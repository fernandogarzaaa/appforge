/**
 * User Settings Routes - Frontend Persistence Layer
 * Handles user preferences, settings, and personalization data
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import UserSettings from '../models/UserSettings.js';

const router = express.Router();

// All settings routes require authentication
router.use(authenticate);

/**
 * GET /api/user/llm-settings
 * Get user's LLM settings and preferences
 */
router.get('/llm-settings', async (req, res) => {
  try {
    const userId = req.user?.id || 'default-user';
    
    let settings = await UserSettings.findOne({ userId });
    
    if (!settings) {
      // Create default settings if not found
      settings = new UserSettings({ userId });
      await settings.save();
    }

    res.json({
      userId,
      selectedModel: settings.llmSettings.selectedModel,
      apiKey: settings.llmSettings.apiKey,
      settings: settings.llmSettings.settings,
      usage: settings.llmUsage
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load LLM settings', details: error.message });
  }
});

/**
 * POST /api/user/llm-settings
 * Save user's LLM settings and preferences
 */
router.post('/llm-settings', async (req, res) => {
  try {
    const userId = req.user?.id || 'default-user';
    const { selectedModel, settings } = req.body;

    let userSettings = await UserSettings.findOne({ userId });
    
    if (!userSettings) {
      userSettings = new UserSettings({ userId });
    }

    userSettings.llmSettings.selectedModel = selectedModel || userSettings.llmSettings.selectedModel;
    if (settings) {
      userSettings.llmSettings.settings = { ...userSettings.llmSettings.settings, ...settings };
    }

    await userSettings.save();

    res.json({
      success: true,
      message: 'LLM settings saved',
      userId,
      selectedModel: userSettings.llmSettings.selectedModel,
      settings: userSettings.llmSettings.settings
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save LLM settings', details: error.message });
  }
});

/**
 * DELETE /api/user/llm-usage
 * Clear user's LLM usage statistics
 */
router.delete('/llm-usage', async (req, res) => {
  try {
    const userId = req.user?.id || 'default-user';

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

    res.json({
      success: true,
      message: 'LLM usage cleared',
      userId
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear LLM usage', details: error.message });
  }
});

/**
 * GET /api/user/theme-settings
 * Get user's theme preferences
 */
router.get('/theme-settings', async (req, res) => {
  try {
    const userId = req.user?.id || 'default-user';

    let settings = await UserSettings.findOne({ userId });
    
    if (!settings) {
      settings = new UserSettings({ userId });
      await settings.save();
    }

    res.json({
      userId,
      theme: settings.theme.currentTheme,
      customTheme: {
        colors: Object.fromEntries(settings.theme.customTheme.colors)
      },
      timeBasedTheme: settings.theme.timeBasedTheme
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load theme settings', details: error.message });
  }
});

/**
 * POST /api/user/theme-settings
 * Save user's theme preferences
 */
router.post('/theme-settings', async (req, res) => {
  try {
    const userId = req.user?.id || 'default-user';
    const { theme, customTheme, timeBasedTheme } = req.body;

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

    res.json({
      success: true,
      message: 'Theme settings saved',
      userId,
      theme: userSettings.theme.currentTheme,
      customTheme: { colors: Object.fromEntries(userSettings.theme.customTheme.colors) },
      timeBasedTheme: userSettings.theme.timeBasedTheme
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save theme settings', details: error.message });
  }
});

/**
 * GET /api/user/keyboard-shortcuts
 * Get user's keyboard shortcuts
 */
router.get('/keyboard-shortcuts', async (req, res) => {
  try {
    const userId = req.user?.id || 'default-user';

    let settings = await UserSettings.findOne({ userId });
    
    if (!settings) {
      settings = new UserSettings({ userId });
      await settings.save();
    }

    res.json({
      userId,
      shortcuts: Object.fromEntries(settings.keyboardShortcuts.shortcuts),
      preset: settings.keyboardShortcuts.preset
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load keyboard shortcuts', details: error.message });
  }
});

/**
 * POST /api/user/keyboard-shortcuts
 * Save user's keyboard shortcuts
 */
router.post('/keyboard-shortcuts', async (req, res) => {
  try {
    const userId = req.user?.id || 'default-user';
    const { shortcuts, preset } = req.body;

    let userSettings = await UserSettings.findOne({ userId });
    
    if (!userSettings) {
      userSettings = new UserSettings({ userId });
    }

    if (shortcuts) {
      userSettings.keyboardShortcuts.shortcuts = new Map(Object.entries(shortcuts));
    }
    if (preset) userSettings.keyboardShortcuts.preset = preset;

    await userSettings.save();

    res.json({
      success: true,
      message: 'Keyboard shortcuts saved',
      userId,
      shortcuts: Object.fromEntries(userSettings.keyboardShortcuts.shortcuts),
      preset: userSettings.keyboardShortcuts.preset
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save keyboard shortcuts', details: error.message });
  }
});

/**
 * GET /api/user/advanced-settings
 * Get user's advanced settings
 */
router.get('/advanced-settings', async (req, res) => {
  try {
    const userId = req.user?.id || 'default-user';

    let settings = await UserSettings.findOne({ userId });
    
    if (!settings) {
      settings = new UserSettings({ userId });
      await settings.save();
    }

    res.json({
      userId,
      settings: settings.advancedSettings
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load advanced settings', details: error.message });
  }
});

/**
 * POST /api/user/advanced-settings
 * Save user's advanced settings
 */
router.post('/advanced-settings', async (req, res) => {
  try {
    const userId = req.user?.id || 'default-user';
    const { settings } = req.body;

    let userSettings = await UserSettings.findOne({ userId });
    
    if (!userSettings) {
      userSettings = new UserSettings({ userId });
    }

    if (settings) {
      userSettings.advancedSettings = { ...userSettings.advancedSettings, ...settings };
    }

    await userSettings.save();

    res.json({
      success: true,
      message: 'Advanced settings saved',
      userId,
      settings: userSettings.advancedSettings
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save advanced settings', details: error.message });
  }
});

export default router;
