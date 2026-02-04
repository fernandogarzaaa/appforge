/**
 * Admin Dashboard Routes
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { isAdmin, auditAction } from '../middleware/adminAuth.js';
import { readLimiter, adminLimiter } from '../middleware/rateLimiting.js';
import {
  listKeys,
  createKey,
  deleteKey,
  rotateKey,
  getKeyUsage
} from '../controllers/adminKeysController.js';
import {
  listSecrets,
  getSecret,
  updateSecret,
  createSecret,
  deleteSecret,
  exportSecrets as exportSecretsConfig,
  importSecrets as importSecretsConfig
} from '../controllers/adminSecretsController.js';
import {
  listUsers,
  banUser,
  unbanUser,
  getImpersonationToken,
  getUserActivity
} from '../controllers/adminUsersController.js';
import {
  getRealTimeMetrics,
  getSystemLogs,
  getRecentErrors,
  getHealthCheck,
  getActiveSessions
} from '../controllers/adminMonitoringController.js';
import {
  getAllConfig,
  updateConfig,
  testConnection,
  exportConfig,
  importConfig
} from '../controllers/adminConfigController.js';

const router = express.Router();

// All admin dashboard routes require authentication and admin access
router.use(authenticate);
router.use(isAdmin);
router.use(auditAction);

// =====================
// API Keys
// =====================
router.get('/keys', readLimiter, listKeys);
router.post('/keys', adminLimiter, createKey);
router.delete('/keys/:id', adminLimiter, deleteKey);
router.put('/keys/:id/rotate', adminLimiter, rotateKey);
router.get('/keys/:id/usage', readLimiter, getKeyUsage);

// =====================
// Secrets
// =====================
router.get('/secrets', readLimiter, listSecrets);
router.get('/secrets/:id', readLimiter, getSecret);
router.post('/secrets', adminLimiter, createSecret);
router.put('/secrets/:id', adminLimiter, updateSecret);
router.delete('/secrets/:id', adminLimiter, deleteSecret);
router.post('/secrets/export', adminLimiter, exportSecretsConfig);
router.post('/secrets/import', adminLimiter, importSecretsConfig);

// =====================
// Users
// =====================
router.get('/users', readLimiter, listUsers);
router.put('/users/:id/ban', adminLimiter, banUser);
router.put('/users/:id/unban', adminLimiter, unbanUser);
router.post('/users/:id/impersonate', adminLimiter, getImpersonationToken);
router.get('/users/:id/activity', readLimiter, getUserActivity);

// =====================
// Monitoring
// =====================
router.get('/monitoring/metrics', readLimiter, getRealTimeMetrics);
router.get('/monitoring/logs', readLimiter, getSystemLogs);
router.get('/monitoring/errors', readLimiter, getRecentErrors);
router.get('/monitoring/health', readLimiter, getHealthCheck);
router.get('/monitoring/sessions', readLimiter, getActiveSessions);

// =====================
// Configuration
// =====================
router.get('/config', readLimiter, getAllConfig);
router.put('/config', adminLimiter, updateConfig);
router.post('/config/test', adminLimiter, testConnection);
router.post('/config/export', adminLimiter, exportConfig);
router.post('/config/import', adminLimiter, importConfig);

export default router;
