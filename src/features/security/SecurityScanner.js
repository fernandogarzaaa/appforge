/**
 * Security Vulnerability Scanner
 * Detects OWASP vulnerabilities, dependency issues, and code security flaws
 */

/**
 * OWASP Top 10 vulnerability patterns
 */
const OWASP_PATTERNS = {
  'SQL_INJECTION': {
    patterns: [
      /query\s*\(\s*["`'].*\$\{.*\}.*["`']/gi,
      /execute\s*\(\s*["`'].*\+\s*.*\+\s*["`']/gi
    ],
    severity: 'critical',
    description: 'Potential SQL Injection vulnerability'
  },
  'XSS': {
    patterns: [
      /innerHTML\s*=\s*(?!.*escapeHtml|.*DOMPurify)/gi,
      /dangerouslySetInnerHTML/gi,
      /eval\s*\(/gi
    ],
    severity: 'critical',
    description: 'Potential Cross-Site Scripting (XSS) vulnerability'
  },
  'INSECURE_RANDOM': {
    patterns: [
      /Math\.random\(\)/gi,
      /crypto\.randomBytes\s*\(\s*0\s*\)/gi
    ],
    severity: 'high',
    description: 'Insecure random number generation'
  },
  'HARDCODED_CREDENTIALS': {
    patterns: [
      /password\s*=\s*["`'].*["`']/gi,
      /apiKey\s*=\s*["`'].*["`']/gi,
      /token\s*=\s*["`'].*["`']/gi,
      /secret\s*=\s*["`'].*["`']/gi
    ],
    severity: 'critical',
    description: 'Hardcoded credentials detected'
  },
  'INSECURE_DESERIALIZATION': {
    patterns: [
      /JSON\.parse\s*\(\s*(?!.*validation|.*schema)/gi,
      /pickle\.|yaml\.load/gi
    ],
    severity: 'high',
    description: 'Insecure deserialization'
  },
  'MISSING_VALIDATION': {
    patterns: [
      /fetch\s*\(["`'].*["`']\s*\)/gi,
      /XMLHttpRequest/gi
    ],
    severity: 'medium',
    description: 'Missing input validation'
  },
  'INSECURE_TRANSPORT': {
    patterns: [
      /http:\/\/api\.|http:\/\/.*\.com/gi
    ],
    severity: 'high',
    description: 'Insecure transport (HTTP instead of HTTPS)'
  },
  'WEAK_CRYPTOGRAPHY': {
    patterns: [
      /md5|sha1|des\(|rc4/gi
    ],
    severity: 'high',
    description: 'Weak cryptographic algorithm detected'
  }
};

/**
 * Scan code for security vulnerabilities
 */
export const scanCode = (code) => {
  const vulnerabilities = [];

  Object.entries(OWASP_PATTERNS).forEach(([type, config]) => {
    config.patterns.forEach(pattern => {
      const matches = code.matchAll(pattern);
      for (const match of matches) {
        vulnerabilities.push({
          id: `${type}_${vulnerabilities.length}`,
          type,
          severity: config.severity,
          description: config.description,
          line: code.substring(0, match.index).split('\n').length,
          column: match.index - code.lastIndexOf('\n', match.index),
          code: match[0],
          recommendation: getRecommendation(type)
        });
      }
    });
  });

  return vulnerabilities;
};

/**
 * Scan dependencies for known vulnerabilities
 */
export const scanDependencies = (packageJson) => {
  const vulnerabilities = [];
  const knownVulnerabilities = getKnownVulnerabilities();

  const deps = {
    ...packageJson.dependencies || {},
    ...packageJson.devDependencies || {}
  };

  Object.entries(deps).forEach(([package, version]) => {
    const vulns = knownVulnerabilities.filter(v => v.package === package);
    vulns.forEach(vuln => {
      if (versionInRange(version, vuln.affectedVersions)) {
        vulnerabilities.push({
          id: `DEP_${vuln.cveId}`,
          type: 'DEPENDENCY_VULNERABILITY',
          package,
          version,
          cveId: vuln.cveId,
          severity: vuln.severity,
          description: vuln.description,
          recommendation: `Update ${package} to version ${vuln.patchedVersion}`,
          url: `https://nvd.nist.gov/vuln/detail/${vuln.cveId}`
        });
      }
    });
  });

  return vulnerabilities;
};

/**
 * Analyze code patterns for security issues
 */
export const analyzeSecurityPatterns = (code) => {
  const issues = [];

  // Check for missing input validation
  if (!/validation|validator|joi|yup|zod/i.test(code)) {
    issues.push({
      type: 'MISSING_VALIDATION_LIBRARY',
      severity: 'medium',
      description: 'No validation library detected',
      recommendation: 'Use a validation library like Joi, Yup, or Zod'
    });
  }

  // Check for missing CSRF protection
  if (/POST|PUT|DELETE/i.test(code) && !/csrf|_token|X-CSRF/i.test(code)) {
    issues.push({
      type: 'MISSING_CSRF_PROTECTION',
      severity: 'high',
      description: 'Missing CSRF protection on state-changing requests',
      recommendation: 'Implement CSRF tokens on all state-changing operations'
    });
  }

  // Check for missing rate limiting
  if (/api|endpoint|route/i.test(code) && !/rateLimit|rate-limit|throttle/i.test(code)) {
    issues.push({
      type: 'MISSING_RATE_LIMITING',
      severity: 'medium',
      description: 'No rate limiting detected',
      recommendation: 'Implement rate limiting to prevent abuse'
    });
  }

  // Check for proper error handling
  if (!/catch|error|try/i.test(code)) {
    issues.push({
      type: 'MISSING_ERROR_HANDLING',
      severity: 'low',
      description: 'Incomplete error handling',
      recommendation: 'Add proper try-catch blocks and error handlers'
    });
  }

  // Check for logging sensitive data
  if (/console\.log|logger\.log/i.test(code)) {
    if (/password|token|secret|apiKey/i.test(code)) {
      issues.push({
        type: 'LOGGING_SENSITIVE_DATA',
        severity: 'critical',
        description: 'Sensitive data may be logged',
        recommendation: 'Remove logging of sensitive information'
      });
    }
  }

  return issues;
};

/**
 * Generate security report
 */
export const generateSecurityReport = (code, packageJson) => {
  const codeVulns = scanCode(code);
  const depVulns = scanDependencies(packageJson || {});
  const patternIssues = analyzeSecurityPatterns(code);

  const criticalCount = [
    ...codeVulns,
    ...depVulns,
    ...patternIssues
  ].filter(v => v.severity === 'critical').length;

  const highCount = [
    ...codeVulns,
    ...depVulns,
    ...patternIssues
  ].filter(v => v.severity === 'high').length;

  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalIssues: codeVulns.length + depVulns.length + patternIssues.length,
      critical: criticalCount,
      high: highCount,
      medium: [
        ...codeVulns,
        ...depVulns,
        ...patternIssues
      ].filter(v => v.severity === 'medium').length,
      low: [
        ...codeVulns,
        ...depVulns,
        ...patternIssues
      ].filter(v => v.severity === 'low').length,
      riskScore: calculateRiskScore(criticalCount, highCount)
    },
    codeVulnerabilities: codeVulns,
    dependencyVulnerabilities: depVulns,
    patternIssues: patternIssues,
    recommendations: generateRecommendations([
      ...codeVulns,
      ...depVulns,
      ...patternIssues
    ])
  };
};

/**
 * Get security recommendation for vulnerability type
 */
function getRecommendation(type) {
  const recommendations = {
    'SQL_INJECTION': 'Use parameterized queries or ORM to prevent SQL injection',
    'XSS': 'Use innerHTML sparingly, use textContent instead or sanitize with DOMPurify',
    'INSECURE_RANDOM': 'Use crypto.getRandomValues() or similar for security-sensitive operations',
    'HARDCODED_CREDENTIALS': 'Move credentials to environment variables',
    'INSECURE_DESERIALIZATION': 'Validate input before deserialization',
    'MISSING_VALIDATION': 'Add input validation and sanitization',
    'INSECURE_TRANSPORT': 'Use HTTPS for all network communications',
    'WEAK_CRYPTOGRAPHY': 'Use modern cryptographic algorithms (SHA-256, AES-256)'
  };
  return recommendations[type] || 'Fix this security issue';
}

/**
 * Get known vulnerabilities database
 */
function getKnownVulnerabilities() {
  // Mock data - in production this would fetch from NVD or similar
  return [
    {
      package: 'lodash',
      affectedVersions: '<=4.17.20',
      patchedVersion: '4.17.21',
      cveId: 'CVE-2021-23337',
      severity: 'high',
      description: 'Prototype pollution in lodash'
    },
    {
      package: 'express',
      affectedVersions: '<4.17.1',
      patchedVersion: '4.17.1',
      cveId: 'CVE-2022-24999',
      severity: 'high',
      description: 'Regular expression denial of service'
    }
  ];
}

/**
 * Check if version is in affected range
 */
function versionInRange(version, range) {
  // Simplified version check - in production use semver
  const numVersion = parseInt(version.replace(/\D/g, ''));
  return numVersion >= 0; // Placeholder
}

/**
 * Calculate overall risk score
 */
function calculateRiskScore(critical, high) {
  return Math.min(100, (critical * 30) + (high * 10));
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(issues) {
  const byType = {};
  issues.forEach(issue => {
    const type = issue.type;
    if (!byType[type]) byType[type] = [];
    byType[type].push(issue);
  });

  return Object.entries(byType)
    .map(([type, items]) => ({
      type,
      count: items.length,
      recommendation: items[0].recommendation,
      priority: items[0].severity
    }))
    .sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.priority] - severityOrder[b.priority];
    });
}

/**
 * Export security audit as JSON
 */
export const exportSecurityAudit = (report) => {
  const json = JSON.stringify(report, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `security-audit-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
