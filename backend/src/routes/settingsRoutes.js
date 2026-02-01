/**
 * User Settings Routes - Frontend Persistence Layer
 * Handles user preferences, settings, and personalization data
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';
import cache from '../utils/cache.js';
import { readLimiter, strictWriteLimiter } from '../middleware/rateLimiting.js';
import UserSettings from '../models/UserSettings.js';

const router = express.Router();

const CACHE_TTL_MS = 30000;
const DEFAULT_USER_ID = 'default-user';

const getUserId = (req) => req.user?.id || DEFAULT_USER_ID;

const ensureObject = (value, name) => {
  if (value !== undefined && (typeof value !== 'object' || value === null || Array.isArray(value))) {
    throw new AppError(`${name} must be an object`, 400);
  }
};

const ensureString = (value, name) => {
  if (value !== undefined && typeof value !== 'string') {
    throw new AppError(`${name} must be a string`, 400);
  }
};

// All settings routes require authentication
router.use(authenticate);

/**
 * GET /api/user/llm-settings
 * Get user's LLM settings and preferences
 */
router.get('/llm-settings', readLimiter, asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const cacheKey = `user:${userId}:llm-settings`;
  const cached = await await cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  let settings = await UserSettings.findOne({ userId }).select('llmSettings llmUsage');

  if (!settings) {
    // Create default settings if not found
    settings = new UserSettings({ userId });
    await settings.save();
  }

  const payload = {
    userId,
    selectedModel: settings.llmSettings.selectedModel,
    apiKey: settings.llmSettings.apiKey,
    settings: settings.llmSettings.settings,
    usage: settings.llmUsage
  };

  await await cache.set(cacheKey, payload, CACHE_TTL_MS);
  res.json(payload);
}));

/**
 * POST /api/user/llm-settings
 * Save user's LLM settings and preferences
 */
router.post('/llm-settings', strictWriteLimiter, asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const { selectedModel, settings, usage } = req.body;

  ensureString(selectedModel, 'selectedModel');
  ensureObject(settings, 'settings');
  ensureObject(usage, 'usage');

  let userSettings = await UserSettings.findOne({ userId });
  
  if (!userSettings) {
    userSettings = new UserSettings({ userId });
  }

  userSettings.llmSettings.selectedModel = selectedModel || userSettings.llmSettings.selectedModel;
  if (settings) {
    userSettings.llmSettings.settings = { ...userSettings.llmSettings.settings, ...settings };
  }
  if (usage) {
    userSettings.llmUsage = { ...userSettings.llmUsage, ...usage };
  }

  await userSettings.save();
  await cache.del(`user:${userId}:llm-settings`);

  res.json({
    success: true,
    message: 'LLM settings saved',
    userId,
    selectedModel: userSettings.llmSettings.selectedModel,
    settings: userSettings.llmSettings.settings
  });
}));

/**
 * DELETE /api/user/llm-usage
 * Clear user's LLM usage statistics
 */
router.delete('/llm-usage', strictWriteLimiter, asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  let userSettings = await UserSettings.findOne({ userId });
  
  if (userSettings) {
    userSettings.llmUsage = {
      totalTokens: 0,
      totalCost: 0,
      queryCount: 0,
      modelBreakdown: new Map(),
      history: []
    };
    await userSettings.save();
  }

  await cache.del(`user:${userId}:llm-settings`);

  res.json({
    success: true,
    message: 'LLM usage cleared',
    userId
  });
}));

/**
 * GET /api/user/theme-settings
 * Get user's theme preferences
 */
router.get('/theme-settings', asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const cacheKey = `user:${userId}:theme-settings`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  let settings = await UserSettings.findOne({ userId }).select('theme');
  
  if (!settings) {
    settings = new UserSettings({ userId });
    await settings.save();
  }

  const payload = {
    userId,
    theme: settings.theme.currentTheme,
    customTheme: {
      colors: Object.fromEntries(settings.theme.customTheme.colors)
    },
    timeBasedTheme: settings.theme.timeBasedTheme
  };

  await cache.set(cacheKey, payload, CACHE_TTL_MS);
  res.json(payload);
}));

/**
 * POST /api/user/theme-settings
 * Save user's theme preferences
 */
router.post('/theme-settings', strictWriteLimiter, asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const { theme, customTheme, timeBasedTheme } = req.body;

  ensureString(theme, 'theme');
  ensureObject(customTheme, 'customTheme');
  if (customTheme?.colors) {
    ensureObject(customTheme.colors, 'customTheme.colors');
  }
  if (timeBasedTheme !== undefined && typeof timeBasedTheme !== 'boolean') {
    throw new AppError('timeBasedTheme must be a boolean', 400);
  }

  let userSettings = await UserSettings.findOne({ userId });
  
  if (!userSettings) {
    userSettings = new UserSettings({ userId });
  }

  if (theme) userSettings.theme.currentTheme = theme;
  if (customTheme && customTheme.colors) {
    userSettings.theme.customTheme.colors = new Map(Object.entries(customTheme.colors));
  }
  if (timeBasedTheme !== undefined) userSettings.theme.timeBasedTheme = timeBasedTheme;

  await userSettings.save();
  await cache.del(`user:${userId}:theme-settings`);

  res.json({
    success: true,
    message: 'Theme settings saved',
    userId,
    theme: userSettings.theme.currentTheme,
    customTheme: { colors: Object.fromEntries(userSettings.theme.customTheme.colors) },
    timeBasedTheme: userSettings.theme.timeBasedTheme
  });
}));

/**
 * GET /api/user/keyboard-shortcuts
 * Get user's keyboard shortcuts
 */
router.get('/keyboard-shortcuts', asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const cacheKey = `user:${userId}:keyboard-shortcuts`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  let settings = await UserSettings.findOne({ userId }).select('keyboardShortcuts');
  
  if (!settings) {
    settings = new UserSettings({ userId });
    await settings.save();
  }

  const payload = {
    userId,
    shortcuts: Object.fromEntries(settings.keyboardShortcuts.shortcuts),
    preset: settings.keyboardShortcuts.preset
  };

  await cache.set(cacheKey, payload, CACHE_TTL_MS);
  res.json(payload);
}));

/**
 * POST /api/user/keyboard-shortcuts
 * Save user's keyboard shortcuts
 */
router.post('/keyboard-shortcuts', strictWriteLimiter, asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const { shortcuts, preset } = req.body;

  ensureObject(shortcuts, 'shortcuts');
  ensureString(preset, 'preset');

  let userSettings = await UserSettings.findOne({ userId });
  
  if (!userSettings) {
    userSettings = new UserSettings({ userId });
  }

  if (shortcuts) {
    userSettings.keyboardShortcuts.shortcuts = new Map(Object.entries(shortcuts));
  }
  if (preset) userSettings.keyboardShortcuts.preset = preset;

  await userSettings.save();
  await cache.del(`user:${userId}:keyboard-shortcuts`);

  res.json({
    success: true,
    message: 'Keyboard shortcuts saved',
    userId,
    shortcuts: Object.fromEntries(userSettings.keyboardShortcuts.shortcuts),
    preset: userSettings.keyboardShortcuts.preset
  });
}));

/**
 * GET /api/user/advanced-settings
 * Get user's advanced settings
 */
router.get('/advanced-settings', asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const cacheKey = `user:${userId}:advanced-settings`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  let settings = await UserSettings.findOne({ userId }).select('advancedSettings');
  
  if (!settings) {
    settings = new UserSettings({ userId });
    await settings.save();
  }

  const payload = {
    userId,
    settings: settings.advancedSettings
  };

  await cache.set(cacheKey, payload, CACHE_TTL_MS);
  res.json(payload);
}));

/**
 * POST /api/user/advanced-settings
 * Save user's advanced settings
 */
router.post('/advanced-settings', strictWriteLimiter, asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const { settings } = req.body;

  ensureObject(settings, 'settings');

  let userSettings = await UserSettings.findOne({ userId });
  
  if (!userSettings) {
    userSettings = new UserSettings({ userId });
  }

  if (settings) {
    userSettings.advancedSettings = { ...userSettings.advancedSettings, ...settings };
  }

  await userSettings.save();
  await cache.del(`user:${userId}:advanced-settings`);

  res.json({
    success: true,
    message: 'Advanced settings saved',
    userId,
    settings: userSettings.advancedSettings
  });
}));

export default router;

