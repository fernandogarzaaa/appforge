import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getUserState,
  upsertUserState,
  createAnalyticsEvent,
  listAnalyticsEvents,
  createSyncLog,
  listSyncLogs
} from '../controllers/persistenceController.js';

const router = express.Router();

router.use(authenticate);

// User state
router.get('/user-state', getUserState);
router.put('/user-state', upsertUserState);

// Analytics
router.post('/analytics', createAnalyticsEvent);
router.get('/analytics', listAnalyticsEvents);

// Sync logs
router.post('/sync/logs', createSyncLog);
router.get('/sync/logs', listSyncLogs);

export default router;
