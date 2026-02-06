/**
 * Bot Routes
 * API endpoints for autonomous bot management
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createBot,
  getBots,
  getBot,
  updateBot,
  deleteBot,
  executeBot,
  getBotExecutions,
  getBotMetrics,
  deployBot,
  undeployBot,
  submitFeedback,
  addKnowledge,
  getKnowledge,
  deleteKnowledge,
  trainBot,
  testBot,
} from '../controllers/botController.js';

const router = express.Router();

// All bot routes require authentication
router.use(authenticate);

// CRUD Operations
router.post('/', createBot);
router.get('/', getBots);
router.get('/:id', getBot);
router.put('/:id', updateBot);
router.delete('/:id', deleteBot);

// Execution
router.post('/:id/execute', executeBot);
router.post('/:id/test', testBot);
router.get('/:id/executions', getBotExecutions);

// Deployment
router.post('/:id/deploy', deployBot);
router.post('/:id/undeploy', undeployBot);

// Knowledge Base
router.post('/:id/knowledge', addKnowledge);
router.get('/:id/knowledge', getKnowledge);
router.delete('/:id/knowledge/:knowledgeId', deleteKnowledge);

// Training & Learning
router.post('/:id/train', trainBot);
router.post('/:id/feedback', submitFeedback);

// Analytics
router.get('/:id/metrics', getBotMetrics);

export default router;
