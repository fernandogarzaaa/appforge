/**
 * Admin Configuration Controller
 * Manages system configuration with database persistence and encryption
 * Implements CRUD operations, import/export, and audit logging
 */

import { successResponse, createError } from '../utils/helpers.js';
import AdminConfiguration from '../models/AdminConfiguration.js';
import AuditLog from '../models/AuditLog.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import mongoose from 'mongoose';

const DEFAULT_USER_ID = 'default-user';

/**
 * Get user ID from request context
 * @param {Object} req - Express request
 * @returns {string} - User ID
 */
const getUserId = (req) => req.user?.id || DEFAULT_USER_ID;

/**
 * Validate value is array or object
 * @param {*} value - Value to validate
 * @param {string} name - Field name for error message
 */
const ensureArrayOrObject = (value, name) => {
  if (value === undefined) return;
  if (Array.isArray(value)) return;
  if (value && typeof value === 'object' && value.constructor === Object) return;
  throw createError(400, `${name} must be an array or object`);
};

/**
 * Normalize configuration input
 * @param {Array|Object} payload - Configuration payload
 * @returns {Array} - Normalized configuration array
 */
const normalizeConfigurations = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  if (typeof payload === 'object' && payload.constructor === Object) {
    return Object.entries(payload).map(([provider, config]) => ({
      provider,
      name: config?.name || provider,
      apiKey: config?.apiKey || '',
      apiSecret: config?.apiSecret || '',
      baseUrl: config?.baseUrl || '',
      config: config?.config || {
        model: config?.model,
        timeout: config?.timeout
      },
      active: config?.configured ?? true,
      lastTested: config?.lastTested || null,
      testStatus: config?.testStatus || null,
      metadata: config?.metadata || {}
    }));
  }

  throw createError(400, 'configurations must be an array or object');
};

/**
 * Serialize configuration for response
 * @param {Object} config - Configuration document
 * @returns {Object} - Serialized config
 */
const serializeConfig = (config) => ({
  _id: config._id,
  userId: config.userId,
  configurations: config.configurations?.map(c => ({
    ...c,
    apiKey: c.apiKey ? '***' : '',
    apiSecret: c.apiSecret ? '***' : ''
  })),
  settings: config.settings,
  createdAt: config.createdAt,
  updatedAt: config.updatedAt,
  lastModifiedBy: config.lastModifiedBy
});

/**
 * Get all configuration
 * GET /admin/config
 */
export const getAllConfig = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    let adminConfig = await AdminConfiguration.findOne({ userId }).select('configurations settings');

    if (!adminConfig) {
      // Create default config if doesn't exist
      adminConfig = new AdminConfiguration({
        userId,
        configurations: [],
        settings: {}
      });
      await adminConfig.save();
    }

    res.json(successResponse({
      userId,
      configurations: adminConfig.configurations,
      settings: adminConfig.settings,
      _id: adminConfig._id,
      createdAt: adminConfig.createdAt,
      updatedAt: adminConfig.updatedAt
    }, 'Configuration retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * Update configuration
 * PATCH /admin/config
 */
export const updateConfig = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { configurations, settings } = req.body;
    const adminId = req.user?.id || 'system';

    ensureArrayOrObject(configurations, 'configurations');
    if (settings !== undefined && (typeof settings !== 'object' || settings === null || Array.isArray(settings))) {
      throw createError(400, 'settings must be an object');
    }

    let adminConfig = await AdminConfiguration.findOne({ userId });

    if (!adminConfig) {
      adminConfig = new AdminConfiguration({ userId });
    }

    const originalState = {
      configurationsCount: adminConfig.configurations?.length || 0,
      settingsKeys: Object.keys(adminConfig.settings || {})
    };

    // Update configurations
    if (configurations !== undefined) {
      adminConfig.configurations = normalizeConfigurations(configurations);
    }

    // Update settings
    if (settings) {
      adminConfig.settings = { ...adminConfig.settings, ...settings };
    }

    adminConfig.lastModifiedBy = adminId;
    await adminConfig.save();

    // Audit log
    await AuditLog.logAction({
      action: 'UPDATE',
      userId: adminId,
      resourceType: 'system',
      resourceId: adminConfig._id.toString(),
      details: {
        originalState,
        updatedFields: {
          configurations: !!configurations,
          settings: !!settings
        }
      },
      status: 'success'
    }).catch(() => {});

    res.json(successResponse({
      userId,
      configurations: adminConfig.configurations,
      settings: adminConfig.settings
    }, 'Configuration updated successfully'));
  } catch (err) {
    // Audit failure
    if (req.user?.id) {
      await AuditLog.logAction({
        action: 'UPDATE',
        userId: req.user.id,
        resourceType: 'system',
        details: req.body,
        status: 'failure',
        errorMessage: err.message
      }).catch(() => {});
    }
    next(err);
  }
};

/**
 * Get specific configuration by key
 * GET /admin/config/:key
 */
export const getConfigByKey = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { key } = req.params;

    const adminConfig = await AdminConfiguration.findOne({ userId });

    if (!adminConfig) {
      throw createError(404, 'Configuration not found');
    }

    const value = adminConfig.settings?.[key];

    if (value === undefined) {
      throw createError(404, `Configuration key "${key}" not found`);
    }

    res.json(successResponse({
      key,
      value
    }, `Configuration "${key}" retrieved successfully`));
  } catch (err) {
    next(err);
  }
};

/**
 * Set specific configuration value
 * POST /admin/config/:key
 */
export const setConfigByKey = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { key } = req.params;
    const { value } = req.body;
    const adminId = req.user?.id || 'system';

    if (!key) {
      throw createError(400, 'Configuration key is required');
    }

    let adminConfig = await AdminConfiguration.findOne({ userId });

    if (!adminConfig) {
      adminConfig = new AdminConfiguration({ userId });
    }

    adminConfig.settings = adminConfig.settings || {};
    const oldValue = adminConfig.settings[key];
    adminConfig.settings[key] = value;
    adminConfig.lastModifiedBy = adminId;

    await adminConfig.save();

    // Audit log
    await AuditLog.logAction({
      action: 'SET_CONFIG',
      userId: adminId,
      resourceType: 'system',
      resourceId: adminConfig._id.toString(),
      details: {
        key,
        oldValue,
        newValue: value
      },
      status: 'success'
    }).catch(() => {});

    res.json(successResponse({
      key,
      value
    }, `Configuration "${key}" set successfully`));
  } catch (err) {
    // Audit failure
    if (req.user?.id) {
      await AuditLog.logAction({
        action: 'SET_CONFIG',
        userId: req.user.id,
        resourceType: 'system',
        details: { key: req.params.key },
        status: 'failure',
        errorMessage: err.message
      }).catch(() => {});
    }
    next(err);
  }
};

/**
 * Test database connection
 * POST /admin/config/test/database
 */
export const testDatabaseConnection = async (req, res, next) => {
  try {
    const mongoReadyState = mongoose.connection?.readyState || 0;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    const status = mongoReadyState === 1 ? 'connected' : states[mongoReadyState];
    const isHealthy = mongoReadyState === 1;

    res.status(isHealthy ? 200 : 503).json(successResponse({
      type: 'database',
      status,
      healthy: isHealthy,
      state: mongoReadyState,
      testedAt: new Date().toISOString()
    }, 'Database connection tested'));
  } catch (err) {
    next(err);
  }
};

/**
 * Test email connection
 * POST /admin/config/test/email
 */
export const testEmailConnection = async (req, res, next) => {
  try {
    const hasEmailConfig = Boolean(process.env.SMTP_HOST || process.env.EMAIL_HOST);
    const emailService = process.env.EMAIL_SERVICE || 'SMTP';

    res.json(successResponse({
      type: 'email',
      status: hasEmailConfig ? 'configured' : 'missing',
      configured: hasEmailConfig,
      service: emailService,
      testedAt: new Date().toISOString()
    }, 'Email connection tested'));
  } catch (err) {
    next(err);
  }
};

/**
 * Test connection (generic)
 * POST /admin/config/test
 */
export const testConnection = async (req, res, next) => {
  try {
    const { type } = req.body;

    if (!type) {
      throw createError(400, 'Connection type is required');
    }

    if (type === 'database') {
      return testDatabaseConnection(req, res, next);
    }

    if (type === 'email') {
      return testEmailConnection(req, res, next);
    }

    throw createError(400, `Unsupported connection type: ${type}`);
  } catch (err) {
    next(err);
  }
};

/**
 * Export configuration (encrypted)
 * GET /admin/config/export
 */
export const exportConfig = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const adminId = req.user?.id || 'system';
    const adminConfig = await AdminConfiguration.findOne({ userId });

    if (!adminConfig) {
      throw createError(404, 'Configuration not found');
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      exportedBy: adminId,
      userId,
      configurations: adminConfig.configurations || [],
      settings: adminConfig.settings || {}
    };

    const encryptedPayload = encrypt(JSON.stringify(payload));

    // Audit log
    await AuditLog.logAction({
      action: 'EXPORT_CONFIG',
      userId: adminId,
      resourceType: 'system',
      resourceId: adminConfig._id.toString(),
      status: 'success'
    }).catch(() => {});

    res.json(successResponse({
      encrypted: true,
      payload: encryptedPayload,
      exportedAt: payload.exportedAt
    }, 'Configuration exported successfully'));
  } catch (err) {
    // Audit failure
    if (req.user?.id) {
      await AuditLog.logAction({
        action: 'EXPORT_CONFIG',
        userId: req.user.id,
        resourceType: 'system',
        status: 'failure',
        errorMessage: err.message
      }).catch(() => {});
    }
    next(err);
  }
};

/**
 * Import configuration from encrypted payload
 * POST /admin/config/import
 */
export const importConfig = async (req, res, next) => {
  try {
    const { payload, encrypted = true } = req.body;
    const userId = getUserId(req);
    const adminId = req.user?.id || 'system';

    if (!payload) {
      throw createError(400, 'Payload is required');
    }

    // Decrypt payload
    let decoded;
    try {
      decoded = encrypted ? decrypt(payload) : payload;
    } catch (err) {
      throw createError(400, 'Failed to decrypt payload');
    }

    const parsed = typeof decoded === 'string' ? JSON.parse(decoded) : decoded;

    if (!parsed || (!parsed.configurations && !parsed.settings)) {
      throw createError(400, 'Invalid configuration payload format');
    }

    let adminConfig = await AdminConfiguration.findOne({ userId });
    if (!adminConfig) {
      adminConfig = new AdminConfiguration({ userId });
    }

    const originalState = {
      configurationsCount: adminConfig.configurations?.length || 0,
      settingsKeys: Object.keys(adminConfig.settings || {})
    };

    // Import configurations
    if (parsed.configurations !== undefined) {
      adminConfig.configurations = normalizeConfigurations(parsed.configurations);
    }

    // Import settings
    if (parsed.settings) {
      adminConfig.settings = { ...adminConfig.settings, ...parsed.settings };
    }

    adminConfig.lastModifiedBy = adminId;
    await adminConfig.save();

    // Audit log
    await AuditLog.logAction({
      action: 'IMPORT_CONFIG',
      userId: adminId,
      resourceType: 'system',
      resourceId: adminConfig._id.toString(),
      details: {
        originalState,
        importedAt: new Date()
      },
      status: 'success'
    }).catch(() => {});

    res.json(successResponse({
      userId,
      configurations: adminConfig.configurations,
      settings: adminConfig.settings,
      importedAt: new Date().toISOString()
    }, 'Configuration imported successfully'));
  } catch (err) {
    // Audit failure
    if (req.user?.id) {
      await AuditLog.logAction({
        action: 'IMPORT_CONFIG',
        userId: req.user.id,
        resourceType: 'system',
        status: 'failure',
        errorMessage: err.message
      }).catch(() => {});
    }
    next(err);
  }
};

/**
 * Get configuration history (audit logs for configuration changes)
 * GET /admin/config/history
 */
export const getConfigHistory = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments({
        $or: [
          { action: 'UPDATE', resourceType: 'system' },
          { action: 'SET_CONFIG', resourceType: 'system' },
          { action: 'IMPORT_CONFIG', resourceType: 'system' },
          { action: 'EXPORT_CONFIG', resourceType: 'system' }
        ]
      }),
      AuditLog.find({
        $or: [
          { action: 'UPDATE', resourceType: 'system' },
          { action: 'SET_CONFIG', resourceType: 'system' },
          { action: 'IMPORT_CONFIG', resourceType: 'system' },
          { action: 'EXPORT_CONFIG', resourceType: 'system' }
        ]
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'email username')
        .lean()
    ]);

    res.json(successResponse({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      history: logs
    }, 'Configuration history retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * Reset configuration to defaults
 * POST /admin/config/reset
 */
export const resetConfig = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const adminId = req.user?.id || 'system';
    const { confirm = false } = req.body;

    if (!confirm) {
      throw createError(400, 'Configuration reset must be confirmed');
    }

    let adminConfig = await AdminConfiguration.findOne({ userId });

    if (!adminConfig) {
      throw createError(404, 'Configuration not found');
    }

    const originalState = {
      configurationsCount: adminConfig.configurations?.length || 0,
      settingsKeys: Object.keys(adminConfig.settings || {})
    };

    // Reset configuration
    adminConfig.configurations = [];
    adminConfig.settings = {};
    adminConfig.lastModifiedBy = adminId;

    await adminConfig.save();

    // Audit log
    await AuditLog.logAction({
      action: 'RESET_CONFIG',
      userId: adminId,
      resourceType: 'system',
      resourceId: adminConfig._id.toString(),
      details: {
        originalState
      },
      status: 'success'
    }).catch(() => {});

    res.json(successResponse({
      userId,
      message: 'Configuration reset to defaults'
    }, 'Configuration reset successfully'));
  } catch (err) {
    // Audit failure
    if (req.user?.id) {
      await AuditLog.logAction({
        action: 'RESET_CONFIG',
        userId: req.user.id,
        resourceType: 'system',
        status: 'failure',
        errorMessage: err.message
      }).catch(() => {});
    }
    next(err);
  }
};

export default {
  getAllConfig,
  updateConfig,
  getConfigByKey,
  setConfigByKey,
  testConnection,
  testDatabaseConnection,
  testEmailConnection,
  exportConfig,
  importConfig,
  getConfigHistory,
  resetConfig
};
