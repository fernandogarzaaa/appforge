/**
 * Security API Routes
 * 11 endpoints for scanning, rules, and audit logs
 */

import express from 'express';
import Joi from 'joi';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import db from '../db/connection.js';
import logger from '../utils/logger.js';
import authModule from '../middleware/auth.js';
import errorModule from '../middleware/errorHandler.js';
import {
  scanCode,
  scanDependencies,
  scanSecrets,
  scanCompliance
} from '../services/securityScanner.js';

const router = express.Router();
const { verifyToken } = authModule;
const { asyncHandler } = errorModule;

router.use(verifyToken);

const scanLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: 'Daily scan limit reached. Please try again tomorrow.',
  standardHeaders: true,
  legacyHeaders: false
});

const validateBody = (schema, req) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const details = error.details.map(detail => ({ field: detail.path.join('.'), message: detail.message }));
    const err = new Error('Validation failed');
    err.statusCode = 400;
    err.details = details;
    throw err;
  }
  return value;
};

const codeScanSchema = Joi.object({
  projectId: Joi.string().required(),
  language: Joi.string().required(),
  code: Joi.string().required().min(1)
});

const dependencyScanSchema = Joi.object({
  projectId: Joi.string().required(),
  projectPath: Joi.string().optional(),
  packageJson: Joi.object().optional()
});

const secretsScanSchema = Joi.object({
  projectId: Joi.string().required(),
  content: Joi.string().required().min(1)
});

const complianceScanSchema = Joi.object({
  projectId: Joi.string().required(),
  code: Joi.string().optional(),
  dependencies: Joi.array().items(Joi.string()).optional()
});

const ruleSchema = Joi.object({
  projectId: Joi.string().required(),
  name: Joi.string().required().max(200),
  description: Joi.string().allow(null, ''),
  ruleType: Joi.string().valid('regex', 'keyword', 'policy').required(),
  pattern: Joi.string().required(),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  enabled: Joi.boolean().default(true)
});

const ruleUpdateSchema = Joi.object({
  name: Joi.string().max(200),
  description: Joi.string().allow(null, ''),
  ruleType: Joi.string().valid('regex', 'keyword', 'policy'),
  pattern: Joi.string(),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical'),
  enabled: Joi.boolean()
}).min(1);

const logAudit = async (req, action, resourceType, resourceId, details) => {
  try {
    await db.query(
      `INSERT INTO audit_logs
        (id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        crypto.randomUUID(),
        req.user.id,
        action,
        resourceType,
        resourceId,
        JSON.stringify(details || {}),
        req.ip,
        req.headers['user-agent'] || null
      ]
    );
  } catch (error) {
    logger.warn('Failed to write security audit log', { error: error.message });
  }
};

/**
 * POST /api/security/scan/code
 */
router.post(
  '/scan/code',
  scanLimiter,
  asyncHandler(async (req, res) => {
    const payload = validateBody(codeScanSchema, req);
    const result = await scanCode({
      userId: req.user.id,
      projectId: payload.projectId,
      code: payload.code,
      language: payload.language,
      req
    });

    res.json({ success: true, ...result });
  })
);

/**
 * POST /api/security/scan/dependencies
 */
router.post(
  '/scan/dependencies',
  scanLimiter,
  asyncHandler(async (req, res) => {
    const payload = validateBody(dependencyScanSchema, req);
    const result = await scanDependencies({
      userId: req.user.id,
      projectId: payload.projectId,
      projectPath: payload.projectPath,
      packageJson: payload.packageJson,
      req
    });

    res.json({ success: true, ...result });
  })
);

/**
 * POST /api/security/scan/secrets
 */
router.post(
  '/scan/secrets',
  scanLimiter,
  asyncHandler(async (req, res) => {
    const payload = validateBody(secretsScanSchema, req);
    const result = await scanSecrets({
      userId: req.user.id,
      projectId: payload.projectId,
      content: payload.content,
      req
    });

    res.json({ success: true, ...result });
  })
);

/**
 * POST /api/security/scan/compliance
 */
router.post(
  '/scan/compliance',
  scanLimiter,
  asyncHandler(async (req, res) => {
    const payload = validateBody(complianceScanSchema, req);
    const result = await scanCompliance({
      userId: req.user.id,
      projectId: payload.projectId,
      code: payload.code || '',
      dependencies: payload.dependencies || [],
      req
    });

    res.json({ success: true, ...result });
  })
);

/**
 * GET /api/security/scans/:id
 */
router.get(
  '/scans/:id',
  asyncHandler(async (req, res) => {
    const result = await db.query(
      `SELECT * FROM security_scans WHERE id = $1`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Scan not found', code: 'SCAN_NOT_FOUND' });
    }

    res.json({ success: true, scan: result.rows[0] });
  })
);

/**
 * GET /api/security/scans
 */
router.get(
  '/scans',
  asyncHandler(async (req, res) => {
    const projectId = req.query.projectId || null;
    const params = [];
    let query = `SELECT * FROM security_scans`;

    if (projectId) {
      params.push(projectId);
      query += ` WHERE project_id = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT 100`;

    const result = await db.query(query, params);
    res.json({ success: true, scans: result.rows });
  })
);

/**
 * POST /api/security/rules
 */
router.post(
  '/rules',
  asyncHandler(async (req, res) => {
    const payload = validateBody(ruleSchema, req);
    const ruleId = crypto.randomUUID();

    await db.query(
      `INSERT INTO security_rules
        (id, project_id, name, description, rule_type, pattern, severity, enabled, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [
        ruleId,
        payload.projectId,
        payload.name,
        payload.description || null,
        payload.ruleType,
        payload.pattern,
        payload.severity,
        payload.enabled
      ]
    );

    await logAudit(req, 'security.rule.create', 'security_rule', ruleId, payload);

    res.status(201).json({ success: true, ruleId });
  })
);

/**
 * GET /api/security/rules
 */
router.get(
  '/rules',
  asyncHandler(async (req, res) => {
    const projectId = req.query.projectId || null;
    const params = [];
    let query = `SELECT * FROM security_rules`;

    if (projectId) {
      params.push(projectId);
      query += ` WHERE project_id = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await db.query(query, params);
    res.json({ success: true, rules: result.rows });
  })
);

/**
 * PUT /api/security/rules/:id
 */
router.put(
  '/rules/:id',
  asyncHandler(async (req, res) => {
    const payload = validateBody(ruleUpdateSchema, req);
    const ruleId = req.params.id;

    const fields = [];
    const values = [];
    let index = 1;

    const map = {
      name: 'name',
      description: 'description',
      ruleType: 'rule_type',
      pattern: 'pattern',
      severity: 'severity',
      enabled: 'enabled'
    };

    Object.entries(payload).forEach(([key, value]) => {
      if (map[key]) {
        fields.push(`${map[key]} = $${index}`);
        values.push(value);
        index += 1;
      }
    });

    fields.push(`updated_at = NOW()`);

    await db.query(
      `UPDATE security_rules
       SET ${fields.join(', ')}
       WHERE id = $${index}`,
      [...values, ruleId]
    );

    await logAudit(req, 'security.rule.update', 'security_rule', ruleId, payload);

    res.json({ success: true, ruleId });
  })
);

/**
 * DELETE /api/security/rules/:id
 */
router.delete(
  '/rules/:id',
  asyncHandler(async (req, res) => {
    const ruleId = req.params.id;
    await db.query(`DELETE FROM security_rules WHERE id = $1`, [ruleId]);
    await logAudit(req, 'security.rule.delete', 'security_rule', ruleId, {});
    res.json({ success: true, ruleId });
  })
);

/**
 * GET /api/security/audit-log
 */
router.get(
  '/audit-log',
  asyncHandler(async (req, res) => {
    const result = await db.query(
      `SELECT * FROM audit_logs
       WHERE action LIKE 'security.%'
       ORDER BY created_at DESC
       LIMIT 200`
    );

    res.json({ success: true, auditLog: result.rows });
  })
);

export default router;
