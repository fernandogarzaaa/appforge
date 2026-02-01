/**
 * Admin API Configuration Routes
 * Handles API key management and admin configuration
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import AdminConfiguration from '../models/AdminConfiguration.js';

const router = express.Router();

// All admin routes require authentication
router.use(authenticate);

/**
 * GET /api/admin/api-configurations
 * Get all API configurations
 */
router.get('/api-configurations', async (req, res) => {
  try {
    const userId = req.user?.id || 'default-user';

    let adminConfig = await AdminConfiguration.findOne({ userId });
    
    if (!adminConfig) {
      adminConfig = new AdminConfiguration({ userId });
      await adminConfig.save();
    }

    res.json({
      userId,
      configurations: adminConfig.configurations,
      settings: adminConfig.settings
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load API configurations', details: error.message });
  }
});

/**
 * POST /api/admin/api-configurations
 * Save API configurations
 */
router.post('/api-configurations', async (req, res) => {
  try {
    const userId = req.user?.id || 'default-user';
    const { configurations, settings } = req.body;

    let adminConfig = await AdminConfiguration.findOne({ userId });
    
    if (!adminConfig) {
      adminConfig = new AdminConfiguration({ userId });
    }

    if (configurations) adminConfig.configurations = configurations;
    if (settings) adminConfig.settings = { ...adminConfig.settings, ...settings };
    
    adminConfig.lastModifiedBy = userId;

    await adminConfig.save();

    res.json({
      success: true,
      message: 'API configurations saved',
      userId,
      configurations: adminConfig.configurations,
      settings: adminConfig.settings
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save API configurations', details: error.message });
  }
});

export default router;
