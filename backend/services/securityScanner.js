/**
 * Security Scanner Service
 * Code, dependency, secrets, and compliance scanning with caching
 */

import crypto from 'crypto';
import { parse } from 'acorn';
import { createRequire } from 'module';
import db from '../db/connection.js';
import logger from '../utils/logger.js';

const require = createRequire(import.meta.url);

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const scanCache = new Map();

const safeJsonParse = (value, fallback = null) => {
  try {
    return JSON.parse(value);
  } catch (err) {
    return fallback;
  }
};

const hashContent = (content) => {
  return crypto.createHash('sha256').update(content).digest('hex');
};

const getCacheKey = (scanType, hash, projectId = 'global') => {
  return `${scanType}:${projectId}:${hash}`;
};

const readCache = (key) => {
  const cached = scanCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt < Date.now()) {
    scanCache.delete(key);
    return null;
  }
  return cached.data;
};

const writeCache = (key, data) => {
  scanCache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS
  });
};

const readDbCache = async (scanType, inputHash, projectId) => {
  try {
    const result = await db.query(
      `SELECT id, findings, summary, created_at
       FROM security_scans
       WHERE scan_type = $1
         AND input_hash = $2
         AND project_id = $3
         AND created_at >= NOW() - INTERVAL '24 hours'
       ORDER BY created_at DESC
       LIMIT 1`,
      [scanType, inputHash, projectId]
    );

    if (!result.rows.length) return null;

    const row = result.rows[0];
    return {
      scanId: row.id,
      findings: row.findings,
      summary: row.summary,
      cached: true,
      createdAt: row.created_at
    };
  } catch (error) {
    logger.warn('Security scan db cache lookup failed', { error: error.message });
    return null;
  }
};

const saveScanResult = async ({
  scanId,
  userId,
  projectId,
  scanType,
  inputHash,
  status,
  findings,
  summary,
  metadata
}) => {
  try {
    await db.query(
      `INSERT INTO security_scans
        (id, user_id, project_id, scan_type, status, findings, summary, input_hash, metadata, created_at, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [
        scanId,
        userId,
        projectId,
        scanType,
        status,
        JSON.stringify(findings || []),
        JSON.stringify(summary || {}),
        inputHash,
        JSON.stringify(metadata || {})
      ]
    );
  } catch (error) {
    logger.error('Failed to save security scan result', { error: error.message });
    throw error;
  }
};

const recordAuditLog = async ({ userId, action, resourceType, resourceId, details, req }) => {
  try {
    await db.query(
      `INSERT INTO audit_logs
        (user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        userId,
        action,
        resourceType,
        resourceId,
        JSON.stringify(details || {}),
        req?.ip || null,
        req?.headers?.['user-agent'] || null
      ]
    );
  } catch (error) {
    logger.warn('Failed to write audit log', { error: error.message });
  }
};

const walkAst = (node, visitor) => {
  if (!node || typeof node !== 'object') return;
  visitor(node);
  for (const key of Object.keys(node)) {
    const value = node[key];
    if (Array.isArray(value)) {
      value.forEach(child => walkAst(child, visitor));
    } else if (value && typeof value.type === 'string') {
      walkAst(value, visitor);
    }
  }
};

const buildFinding = (type, severity, message, node) => {
  return {
    id: crypto.randomUUID(),
    type,
    severity,
    message,
    line: node?.loc?.start?.line ?? null,
    column: node?.loc?.start?.column ?? null
  };
};

const detectCodeIssues = (code) => {
  const findings = [];
  let ast;

  try {
    ast = parse(code, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      locations: true
    });
  } catch (error) {
    return [
      buildFinding(
        'parser_error',
        'medium',
        `Unable to parse code: ${error.message}`,
        null
      )
    ];
  }

  walkAst(ast, (node) => {
    if (node.type === 'CallExpression' && node.callee) {
      const calleeName = node.callee.name || node.callee.property?.name;
      if (calleeName === 'eval') {
        findings.push(buildFinding('unsafe_eval', 'high', 'Use of eval can lead to code injection.', node));
      }
      if (calleeName === 'Function') {
        findings.push(buildFinding('unsafe_function_constructor', 'high', 'Function constructor can execute arbitrary code.', node));
      }
      if (calleeName === 'setTimeout' || calleeName === 'setInterval') {
        const arg = node.arguments?.[0];
        if (arg && arg.type === 'Literal' && typeof arg.value === 'string') {
          findings.push(buildFinding('unsafe_timer_string', 'medium', 'Passing strings to timers can lead to code injection.', node));
        }
      }
      if (calleeName === 'query' || calleeName === 'execute' || calleeName === 'raw') {
        const arg = node.arguments?.[0];
        if (arg && (arg.type === 'BinaryExpression' || arg.type === 'TemplateLiteral')) {
          findings.push(buildFinding('possible_sql_injection', 'high', 'Dynamic SQL query detected. Use parameterized queries.', node));
        }
      }
      if (calleeName === 'write' && node.callee.object?.name === 'document') {
        findings.push(buildFinding('document_write', 'medium', 'document.write can introduce XSS vulnerabilities.', node));
      }
    }

    if (node.type === 'AssignmentExpression' && node.left?.property?.name === 'innerHTML') {
      findings.push(buildFinding('unsafe_innerHTML', 'high', 'Assigning to innerHTML can lead to XSS.', node));
    }

    if (node.type === 'JSXAttribute' && node.name?.name === 'dangerouslySetInnerHTML') {
      findings.push(buildFinding('dangerously_set_innerhtml', 'high', 'dangerouslySetInnerHTML can lead to XSS.', node));
    }
  });

  return findings;
};

const loadCustomRules = async (projectId) => {
  try {
    const result = await db.query(
      `SELECT * FROM security_rules WHERE project_id = $1 AND enabled = true`,
      [projectId]
    );
    return result.rows || [];
  } catch (error) {
    logger.warn('Failed to load custom security rules', { error: error.message });
    return [];
  }
};

const applyCustomRules = (rules, content) => {
  const findings = [];
  rules.forEach(rule => {
    if (rule.rule_type === 'regex') {
      try {
        const regex = new RegExp(rule.pattern, 'gi');
        if (regex.test(content)) {
          findings.push({
            id: crypto.randomUUID(),
            type: 'custom_rule',
            severity: rule.severity || 'medium',
            message: rule.description || `Custom rule matched: ${rule.name}`,
            ruleId: rule.id
          });
        }
      } catch (err) {
        logger.warn('Invalid regex in custom rule', { ruleId: rule.id });
      }
    }
    if (rule.rule_type === 'keyword') {
      if (content.toLowerCase().includes(rule.pattern.toLowerCase())) {
        findings.push({
          id: crypto.randomUUID(),
          type: 'custom_rule',
          severity: rule.severity || 'medium',
          message: rule.description || `Custom rule matched: ${rule.name}`,
          ruleId: rule.id
        });
      }
    }
  });
  return findings;
};

const SECRET_PATTERNS = [
  { name: 'aws_access_key', regex: /AKIA[0-9A-Z]{16}/g, severity: 'high' },
  { name: 'aws_secret_key', regex: /aws(.{0,20})?(secret|access)["'`\s:=]{1,6}[0-9a-zA-Z/+]{32,40}/gi, severity: 'high' },
  { name: 'github_token', regex: /ghp_[0-9A-Za-z]{36,}/g, severity: 'high' },
  { name: 'slack_token', regex: /xox[baprs]-[0-9A-Za-z-]{10,}/g, severity: 'high' },
  { name: 'generic_api_key', regex: /api[_-]?key["'`\s:=]{1,6}[0-9a-zA-Z]{16,}/gi, severity: 'medium' },
  { name: 'jwt', regex: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, severity: 'medium' }
];

const detectSecrets = (content) => {
  const findings = [];

  SECRET_PATTERNS.forEach(pattern => {
    const matches = content.match(pattern.regex);
    if (matches) {
      matches.forEach(match => {
        findings.push({
          id: crypto.randomUUID(),
          type: pattern.name,
          severity: pattern.severity,
          message: `Potential secret detected: ${pattern.name}`,
          snippet: match.substring(0, 8) + '***'
        });
      });
    }
  });

  return findings;
};

const runRetireScan = async (projectPath) => {
  try {
    const retirePath = require.resolve('retire/bin/retire');
    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const exec = promisify(execFile);

    const { stdout } = await exec(process.execPath, [retirePath, '--path', projectPath, '--outputformat', 'json']);
    const parsed = safeJsonParse(stdout, []);
    return parsed;
  } catch (error) {
    logger.warn('Retire scan failed', { error: error.message });
    return null;
  }
};

const runDependencyCheck = async (projectPath) => {
  try {
    const dependencyModule = await import('dependency-check');
    const dependencyCheck = dependencyModule.default || dependencyModule.dependencyCheck || dependencyModule.check;
    if (!dependencyCheck) {
      throw new Error('dependency-check module not available');
    }
    return await dependencyCheck({
      path: projectPath,
      install: false
    });
  } catch (error) {
    logger.warn('OWASP dependency-check scan failed', { error: error.message });
    return null;
  }
};

export const scanCode = async ({ userId, projectId, code, language, req }) => {
  const inputHash = hashContent(code || '');
  const cacheKey = getCacheKey('code', inputHash, projectId);

  const cached = readCache(cacheKey);
  if (cached) return cached;

  const dbCached = await readDbCache('code', inputHash, projectId);
  if (dbCached) {
    writeCache(cacheKey, dbCached);
    return dbCached;
  }

  const findings = detectCodeIssues(code || '');
  const customRules = await loadCustomRules(projectId);
  findings.push(...applyCustomRules(customRules, code || ''));
  const summary = {
    language,
    totalFindings: findings.length,
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length
  };

  const scanId = crypto.randomUUID();

  await saveScanResult({
    scanId,
    userId,
    projectId,
    scanType: 'code',
    inputHash,
    status: 'completed',
    findings,
    summary
  });

  await recordAuditLog({
    userId,
    action: 'security.scan.code',
    resourceType: 'security_scan',
    resourceId: scanId,
    details: summary,
    req
  });

  const result = { scanId, findings, summary, cached: false };
  writeCache(cacheKey, result);
  return result;
};

export const scanSecrets = async ({ userId, projectId, content, req }) => {
  const inputHash = hashContent(content || '');
  const cacheKey = getCacheKey('secrets', inputHash, projectId);

  const cached = readCache(cacheKey);
  if (cached) return cached;

  const dbCached = await readDbCache('secrets', inputHash, projectId);
  if (dbCached) {
    writeCache(cacheKey, dbCached);
    return dbCached;
  }

  const findings = detectSecrets(content || '');
  const summary = {
    totalFindings: findings.length,
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length
  };

  const scanId = crypto.randomUUID();

  await saveScanResult({
    scanId,
    userId,
    projectId,
    scanType: 'secrets',
    inputHash,
    status: 'completed',
    findings,
    summary
  });

  await recordAuditLog({
    userId,
    action: 'security.scan.secrets',
    resourceType: 'security_scan',
    resourceId: scanId,
    details: summary,
    req
  });

  const result = { scanId, findings, summary, cached: false };
  writeCache(cacheKey, result);
  return result;
};

export const scanDependencies = async ({ userId, projectId, projectPath, packageJson, req }) => {
  const payload = JSON.stringify({ projectPath, packageJson });
  const inputHash = hashContent(payload);
  const cacheKey = getCacheKey('dependencies', inputHash, projectId);

  const cached = readCache(cacheKey);
  if (cached) return cached;

  const dbCached = await readDbCache('dependencies', inputHash, projectId);
  if (dbCached) {
    writeCache(cacheKey, dbCached);
    return dbCached;
  }

  const retireResults = projectPath ? await runRetireScan(projectPath) : null;
  const dependencyCheckResults = projectPath ? await runDependencyCheck(projectPath) : null;

  const findings = [];

  if (Array.isArray(retireResults)) {
    retireResults.forEach(result => {
      if (result?.results) {
        result.results.forEach(entry => {
          findings.push({
            id: crypto.randomUUID(),
            type: 'retire',
            severity: entry.severity || 'medium',
            message: entry.vulnerability || 'Vulnerable dependency detected',
            dependency: entry.component || entry.file
          });
        });
      }
    });
  }

  if (Array.isArray(dependencyCheckResults)) {
    dependencyCheckResults.forEach(entry => {
      findings.push({
        id: crypto.randomUUID(),
        type: 'dependency_check',
        severity: entry.severity || 'medium',
        message: entry.summary || 'OWASP dependency check finding',
        dependency: entry.module
      });
    });
  }

  const summary = {
    totalFindings: findings.length,
    retireFindings: findings.filter(f => f.type === 'retire').length,
    dependencyCheckFindings: findings.filter(f => f.type === 'dependency_check').length
  };

  const scanId = crypto.randomUUID();

  await saveScanResult({
    scanId,
    userId,
    projectId,
    scanType: 'dependencies',
    inputHash,
    status: 'completed',
    findings,
    summary,
    metadata: { projectPath, packageJsonPresent: Boolean(packageJson) }
  });

  await recordAuditLog({
    userId,
    action: 'security.scan.dependencies',
    resourceType: 'security_scan',
    resourceId: scanId,
    details: summary,
    req
  });

  const result = { scanId, findings, summary, cached: false };
  writeCache(cacheKey, result);
  return result;
};

export const scanCompliance = async ({ userId, projectId, code, dependencies, req }) => {
  const payload = JSON.stringify({ code, dependencies });
  const inputHash = hashContent(payload);
  const cacheKey = getCacheKey('compliance', inputHash, projectId);

  const cached = readCache(cacheKey);
  if (cached) return cached;

  const dbCached = await readDbCache('compliance', inputHash, projectId);
  if (dbCached) {
    writeCache(cacheKey, dbCached);
    return dbCached;
  }

  const findings = [];
  const secretsFindings = detectSecrets(code || '');
  findings.push(...secretsFindings.map(item => ({ ...item, type: 'compliance_secret' })));

  const summary = {
    totalFindings: findings.length,
    compliancePassed: findings.length === 0
  };

  const scanId = crypto.randomUUID();

  await saveScanResult({
    scanId,
    userId,
    projectId,
    scanType: 'compliance',
    inputHash,
    status: 'completed',
    findings,
    summary
  });

  await recordAuditLog({
    userId,
    action: 'security.scan.compliance',
    resourceType: 'security_scan',
    resourceId: scanId,
    details: summary,
    req
  });

  const result = { scanId, findings, summary, cached: false };
  writeCache(cacheKey, result);
  return result;
};
