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

export default router;
