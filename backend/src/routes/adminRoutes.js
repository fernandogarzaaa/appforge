/**
 * Admin API Configuration Routes
 * Handles API key management and admin configuration
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';
import cache from '../utils/cache.js';
import { readLimiter, adminLimiter } from '../middleware/rateLimiting.js';
import AdminConfiguration from '../models/AdminConfiguration.js';

const router = express.Router();

const CACHE_TTL_MS = 30000;
const DEFAULT_USER_ID = 'default-user';

const getUserId = (req) => req.user?.id || DEFAULT_USER_ID;

const ensureArrayOrObject = (value, name) => {
  if (value === undefined) return;
  if (Array.isArray(value)) return;
  if (value && typeof value === 'object') return;
  throw new AppError(`${name} must be an array or object`, 400);
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

  throw new AppError('configurations must be an array or object', 400);
};

// All admin routes require authentication
router.use(authenticate);

/**
 * GET /api/admin/api-configurations
 * Get all API configurations
 */
router.get('/api-configurations', readLimiter, asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const cacheKey = `admin:${userId}:api-configurations`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  let adminConfig = await AdminConfiguration.findOne({ userId }).select('configurations settings');
  
  if (!adminConfig) {
    adminConfig = new AdminConfiguration({ userId });
    await adminConfig.save();
  }

  const payload = {
    userId,
    configurations: adminConfig.configurations,
    settings: adminConfig.settings
  };

  await cache.set(cacheKey, payload, CACHE_TTL_MS);
  res.json(payload);
}));

/**
 * POST /api/admin/api-configurations
 * Save API configurations
 */
router.post('/api-configurations', adminLimiter, asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const { configurations, settings } = req.body;

  ensureArrayOrObject(configurations, 'configurations');
  if (settings !== undefined && (typeof settings !== 'object' || settings === null || Array.isArray(settings))) {
    throw new AppError('settings must be an object', 400);
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
  await cache.del(`admin:${userId}:api-configurations`);

  res.json({
    success: true,
    message: 'API configurations saved',
    userId,
    configurations: adminConfig.configurations,
    settings: adminConfig.settings
  });
}));

export default router;
