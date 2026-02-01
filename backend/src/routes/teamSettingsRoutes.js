/**
 * Team Workflows Routes
 * Handles team workflows, webhooks, and automation
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';
import cache from '../utils/cache.js';
import TeamWorkflows from '../models/TeamWorkflows.js';

const router = express.Router();

const CACHE_TTL_MS = 30000;
const DEFAULT_TEAM_ID = 'default-team';

const getTeamId = (req) => req.user?.teamId || DEFAULT_TEAM_ID;

const ensureArray = (value, name) => {
  if (value !== undefined && !Array.isArray(value)) {
    throw new AppError(`${name} must be an array`, 400);
  }
};

// All team routes require authentication
router.use(authenticate);

/**
 * GET /api/team/workflows
 * Get all team workflows
 */
router.get('/workflows', asyncHandler(async (req, res) => {
  const teamId = getTeamId(req);
  const cacheKey = `team:${teamId}:workflows`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  let teamWorkflows = await TeamWorkflows.findOne({ teamId }).select('workflows webhooks automations');
  
  if (!teamWorkflows) {
    teamWorkflows = new TeamWorkflows({ teamId });
    await teamWorkflows.save();
  }

  const payload = {
    teamId,
    workflows: teamWorkflows.workflows,
    webhooks: teamWorkflows.webhooks,
    automations: teamWorkflows.automations
  };

  cache.set(cacheKey, payload, CACHE_TTL_MS);
  res.json(payload);
}));

/**
 * POST /api/team/workflows
 * Create or update team workflows
 */
router.post('/workflows', asyncHandler(async (req, res) => {
  const teamId = getTeamId(req);
  const { workflows, webhooks, automations } = req.body;

  ensureArray(workflows, 'workflows');
  ensureArray(webhooks, 'webhooks');
  ensureArray(automations, 'automations');

  let teamWorkflows = await TeamWorkflows.findOne({ teamId });
  
  if (!teamWorkflows) {
    teamWorkflows = new TeamWorkflows({ teamId });
  }

  if (workflows) teamWorkflows.workflows = workflows;
  if (webhooks) teamWorkflows.webhooks = webhooks;
  if (automations) teamWorkflows.automations = automations;

  await teamWorkflows.save();
  cache.del(`team:${teamId}:workflows`);

  res.json({
    success: true,
    message: 'Workflows saved',
    teamId,
    workflows: teamWorkflows.workflows,
    webhooks: teamWorkflows.webhooks,
    automations: teamWorkflows.automations
  });
}));

export default router;
