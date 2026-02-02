/**
 * Data Security & Privacy Routes
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  encryptData,
  decryptData,
  anonymizeData,
  createAnonymizationRule,
  getAnonymizationRules,
  recordConsent,
  getConsentStatus,
  generatePrivacyPolicy,
  submitGDPRRequest,
  getGDPRStatus,
  generateComplianceReport
} from '../controllers/securityController.js';
import {
  requestUserDeletion,
  cancelUserDeletion,
  requestDataPortability,
  getGDPRRequestStatus,
  listGDPRRequests,
} from '../controllers/gdprComplianceController.js';

const router = express.Router();

// All security routes require authentication
router.use(authenticate);

/**
 * POST /api/security/encrypt
 * Encrypt sensitive data
 */
router.post('/encrypt', encryptData);

/**
 * POST /api/security/decrypt
 * Decrypt encrypted data
 */
router.post('/decrypt', decryptData);

/**
 * POST /api/security/anonymize
 * Anonymize data using various methods
 */
router.post('/anonymize', anonymizeData);

/**
 * POST /api/security/rules
 * Create anonymization rule
 */
router.post('/rules', createAnonymizationRule);

/**
 * GET /api/security/rules
 * Get all anonymization rules
 */
router.get('/rules', getAnonymizationRules);

/**
 * POST /api/security/consent
 * Record user consent
 */
router.post('/consent', recordConsent);

/**
 * GET /api/security/consent
 * Get current consent status
 */
router.get('/consent', getConsentStatus);

/**
 * POST /api/security/privacy-policy
 * Generate privacy policy
 */
router.post('/privacy-policy', generatePrivacyPolicy);

/**
 * POST /api/security/gdpr/request
 * Submit GDPR request
 */
router.post('/gdpr/request', submitGDPRRequest);

/**
 * GET /api/security/gdpr/:requestId
 * Get GDPR request status
 */
router.get('/gdpr/:requestId', getGDPRStatus);

/**
 * GET /api/security/compliance
 * Generate compliance report (admin only)
 */
router.get('/compliance', authorize('admin'), generateComplianceReport);

// ============================================
// GDPR Compliance Routes (Right-to-Deletion & Data Portability)
// ============================================

/**
 * POST /api/security/gdpr/deletion
 * Request account deletion (right-to-deletion, GDPR Article 17)
 */
router.post('/gdpr/deletion', requestUserDeletion);

/**
 * POST /api/security/gdpr/deletion/:requestId/cancel
 * Cancel pending deletion request
 */
router.post('/gdpr/deletion/:requestId/cancel', cancelUserDeletion);

/**
 * POST /api/security/gdpr/export
 * Request data export (data portability, GDPR Article 20)
 */
router.post('/gdpr/export', requestDataPortability);

/**
 * GET /api/security/gdpr/requests
 * List all GDPR requests for the user
 */
router.get('/gdpr/requests', listGDPRRequests);

/**
 * GET /api/security/gdpr/:requestId/status
 * Check GDPR request status
 */
router.get('/gdpr/:requestId/status', getGDPRRequestStatus);

export default router;
