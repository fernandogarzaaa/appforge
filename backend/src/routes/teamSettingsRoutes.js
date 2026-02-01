/**
 * Team Workflows Routes
 * Handles team workflows, webhooks, and automation
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import TeamWorkflows from '../models/TeamWorkflows.js';

const router = express.Router();

// All team routes require authentication
router.use(authenticate);

/**
 * GET /api/team/workflows
 * Get all team workflows
 */
router.get('/workflows', async (req, res) => {
  try {
    const teamId = req.user?.teamId || 'default-team';

    let teamWorkflows = await TeamWorkflows.findOne({ teamId });
    
    if (!teamWorkflows) {
      teamWorkflows = new TeamWorkflows({ teamId });
      await teamWorkflows.save();
    }

    res.json({
      teamId,
      workflows: teamWorkflows.workflows,
      webhooks: teamWorkflows.webhooks,
      automations: teamWorkflows.automations
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load workflows', details: error.message });
  }
});

/**
 * POST /api/team/workflows
 * Create or update team workflows
 */
router.post('/workflows', async (req, res) => {
  try {
    const teamId = req.user?.teamId || 'default-team';
    const { workflows, webhooks, automations } = req.body;

    let teamWorkflows = await TeamWorkflows.findOne({ teamId });
    
    if (!teamWorkflows) {
      teamWorkflows = new TeamWorkflows({ teamId });
    }

    if (workflows) teamWorkflows.workflows = workflows;
    if (webhooks) teamWorkflows.webhooks = webhooks;
    if (automations) teamWorkflows.automations = automations;

    await teamWorkflows.save();

    res.json({
      success: true,
      message: 'Workflows saved',
      teamId,
      workflows: teamWorkflows.workflows,
      webhooks: teamWorkflows.webhooks,
      automations: teamWorkflows.automations
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save workflows', details: error.message });
  }
});

export default router;
