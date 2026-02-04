/**
 * Admin Configuration Controller
 */

import { successResponse, createError } from '../utils/helpers.js';
import AdminConfiguration from '../models/AdminConfiguration.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import mongoose from 'mongoose';

const DEFAULT_USER_ID = 'default-user';

const getUserId = (req) => req.user?.id || DEFAULT_USER_ID;

const ensureArrayOrObject = (value, name) => {
  if (value === undefined) return;
  if (Array.isArray(value)) return;
  if (value && typeof value === 'object') return;
  throw createError(400, `${name} must be an array or object`);
};

const normalizeConfigurations = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  if (typeof payload === 'object') {
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
      testStatus: config?.testStatus || null
    }));
  }

  throw createError(400, 'configurations must be an array or object');
};

export const getAllConfig = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    let adminConfig = await AdminConfiguration.findOne({ userId }).select('configurations settings');

    if (!adminConfig) {
      adminConfig = new AdminConfiguration({ userId });
      await adminConfig.save();
    }

    res.json(successResponse({
      userId,
      configurations: adminConfig.configurations,
      settings: adminConfig.settings
    }, 'Configuration retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export const updateConfig = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { configurations, settings } = req.body;

    ensureArrayOrObject(configurations, 'configurations');
    if (settings !== undefined && (typeof settings !== 'object' || settings === null || Array.isArray(settings))) {
      throw createError(400, 'settings must be an object');
    }

    let adminConfig = await AdminConfiguration.findOne({ userId });

    if (!adminConfig) {
      adminConfig = new AdminConfiguration({ userId });
    }

    if (configurations !== undefined) {
      adminConfig.configurations = normalizeConfigurations(configurations);
    }
    if (settings) adminConfig.settings = { ...adminConfig.settings, ...settings };

    adminConfig.lastModifiedBy = userId;

    await adminConfig.save();

    res.json(successResponse({
      userId,
      configurations: adminConfig.configurations,
      settings: adminConfig.settings
    }, 'Configuration updated successfully'));
  } catch (err) {
    next(err);
  }
};

export const testConnection = async (req, res, next) => {
  try {
    const { type } = req.body;

    if (!type) {
      throw createError(400, 'Connection type is required');
    }

    if (type === 'database') {
      const mongoReadyState = mongoose.connection?.readyState || 0;
      const status = mongoReadyState === 1 ? 'connected' : 'disconnected';
      return res.json(successResponse({
        type,
        status,
        testedAt: new Date().toISOString()
      }, 'Database connection tested'));
    }

    if (type === 'email') {
      const hasEmailConfig = Boolean(process.env.SMTP_HOST || process.env.EMAIL_HOST);
      return res.json(successResponse({
        type,
        status: hasEmailConfig ? 'configured' : 'missing',
        testedAt: new Date().toISOString()
      }, 'Email connection tested'));
    }

    throw createError(400, 'Unsupported connection type');
  } catch (err) {
    next(err);
  }
};

export const exportConfig = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const adminConfig = await AdminConfiguration.findOne({ userId }).select('configurations settings');

    if (!adminConfig) {
      throw createError(404, 'Configuration not found');
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      userId,
      configurations: adminConfig.configurations,
      settings: adminConfig.settings
    };

    const encryptedPayload = encrypt(JSON.stringify(payload));

    res.json(successResponse({
      encrypted: true,
      payload: encryptedPayload
    }, 'Configuration exported successfully'));
  } catch (err) {
    next(err);
  }
};

export const importConfig = async (req, res, next) => {
  try {
    const { payload, encrypted = true } = req.body;

    if (!payload) {
      throw createError(400, 'Payload is required');
    }

    const decoded = encrypted ? decrypt(payload) : payload;
    const parsed = typeof decoded === 'string' ? JSON.parse(decoded) : decoded;

    if (!parsed || (!parsed.configurations && !parsed.settings)) {
      throw createError(400, 'Invalid configuration payload');
    }

    const userId = getUserId(req);

    let adminConfig = await AdminConfiguration.findOne({ userId });
    if (!adminConfig) {
      adminConfig = new AdminConfiguration({ userId });
    }

    if (parsed.configurations !== undefined) {
      adminConfig.configurations = normalizeConfigurations(parsed.configurations);
    }
    if (parsed.settings) {
      adminConfig.settings = { ...adminConfig.settings, ...parsed.settings };
    }

    adminConfig.lastModifiedBy = userId;
    await adminConfig.save();

    res.json(successResponse({
      userId,
      configurations: adminConfig.configurations,
      settings: adminConfig.settings
    }, 'Configuration imported successfully'));
  } catch (err) {
    next(err);
  }
};

export default {
  getAllConfig,
  updateConfig,
  testConnection,
  exportConfig,
  importConfig
};
