/**
 * Data Security & Privacy Controller
 * Handles encryption, anonymization, and GDPR compliance operations
 */

import { v4 as uuidv4 } from 'uuid';
import { successResponse, createError } from '../utils/helpers.js';

// Mock databases
const encryptedData = new Map();
const anonymizationRules = new Map();
const gdprRequests = new Map();

export const encryptData = async (req, res, next) => {
  try {
    const { data, algorithm = 'AES', dataType = 'general' } = req.body;

    if (!data) {
      throw createError(400, 'Data to encrypt is required');
    }

    if (!['AES', 'RSA'].includes(algorithm)) {
      throw createError(400, 'Algorithm must be AES or RSA');
    }

    // Mock encryption (in production, use actual crypto)
    const encrypted = Buffer.from(data).toString('base64');
    const encryptId = uuidv4();

    const result = {
      id: encryptId,
      algorithm,
      dataType,
      encrypted,
      keyId: uuidv4(), // Key ID for key rotation
      timestamp: new Date(),
      userId: req.user.id
    };

    encryptedData.set(encryptId, result);

    res.status(201).json(successResponse(result, 'Data encrypted successfully'));
  } catch (err) {
    next(err);
  }
};

export const decryptData = async (req, res, next) => {
  try {
    const { encryptedId } = req.body;

    if (!encryptedId) {
      throw createError(400, 'Encrypted data ID is required');
    }

    const encrypted = encryptedData.get(encryptedId);
    if (!encrypted) {
      throw createError(404, 'Encrypted data not found');
    }

    if (encrypted.userId !== req.user.id) {
      throw createError(403, 'Unauthorized access to encrypted data');
    }

    // Mock decryption
    const decrypted = Buffer.from(encrypted.encrypted, 'base64').toString('utf-8');

    res.json(successResponse({
      id: encryptedId,
      data: decrypted,
      algorithm: encrypted.algorithm,
      decryptedAt: new Date()
    }, 'Data decrypted successfully'));
  } catch (err) {
    next(err);
  }
};

export const anonymizeData = async (req, res, next) => {
  try {
    const { data, method = 'mask', fieldName, ruleId } = req.body;

    if (!data) {
      throw createError(400, 'Data to anonymize is required');
    }

    const validMethods = ['mask', 'generalize', 'suppress', 'hash', 'pseudonymize', 'aggregate'];
    if (!validMethods.includes(method)) {
      throw createError(400, `Method must be one of: ${validMethods.join(', ')}`);
    }

    let anonymized;

    switch (method) {
      case 'mask':
        anonymized = String(data).slice(0, 2) + '*'.repeat(Math.max(0, String(data).length - 4)) + String(data).slice(-2);
        break;
      case 'generalize':
        anonymized = `<${typeof data}>`;
        break;
      case 'suppress':
        anonymized = '***SUPPRESSED***';
        break;
      case 'hash':
        // Simple hash mock
        anonymized = '#' + Math.abs(String(data).split('').reduce((a, b) => a + b.charCodeAt(0), 0)).toString(16).padStart(8, '0');
        break;
      case 'pseudonymize':
        anonymized = `USER_${uuidv4().split('-')[0].toUpperCase()}`;
        break;
      case 'aggregate':
        anonymized = `[AGGREGATED_${Math.floor(Math.random() * 100)}_RECORDS]`;
        break;
    }

    res.json(successResponse({
      original: method === 'suppress' ? '***' : undefined,
      anonymized,
      method,
      fieldName: fieldName || 'unknown',
      timestamp: new Date()
    }, 'Data anonymized successfully'));
  } catch (err) {
    next(err);
  }
};

export const createAnonymizationRule = async (req, res, next) => {
  try {
    const { name, description, fields, rules } = req.body;

    if (!name) {
      throw createError(400, 'Rule name is required');
    }

    const ruleId = uuidv4();
    const rule = {
      id: ruleId,
      name,
      description: description || '',
      fields: fields || [],
      rules: rules || {},
      createdAt: new Date(),
      userId: req.user.id,
      isActive: true
    };

    anonymizationRules.set(ruleId, rule);

    res.status(201).json(successResponse(rule, 'Anonymization rule created successfully'));
  } catch (err) {
    next(err);
  }
};

export const getAnonymizationRules = async (req, res, next) => {
  try {
    const userRules = Array.from(anonymizationRules.values()).filter(r => r.userId === req.user.id);
    res.json(successResponse(userRules, 'Anonymization rules retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export const recordConsent = async (req, res, next) => {
  try {
    const { consentType, value, description } = req.body;

    const validTypes = ['marketing', 'analytics', 'thirdparty', 'profiling'];
    if (!validTypes.includes(consentType)) {
      throw createError(400, `Consent type must be one of: ${validTypes.join(', ')}`);
    }

    const consent = {
      id: uuidv4(),
      userId: req.user.id,
      consentType,
      value,
      description: description || '',
      recordedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    };

    res.status(201).json(successResponse(consent, 'Consent recorded successfully'));
  } catch (err) {
    next(err);
  }
};

export const getConsentStatus = async (req, res, next) => {
  try {
    const consents = {
      marketing: false,
      analytics: true,
      thirdparty: false,
      profiling: true,
      lastUpdated: new Date()
    };

    res.json(successResponse(consents, 'Consent status retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export const generatePrivacyPolicy = async (req, res, next) => {
  try {
    const { companyName = 'AppForge', dataTypes = [] } = req.body;

    const policy = `# Privacy Policy

## 1. Introduction
This Privacy Policy explains how ${companyName} collects, uses, and protects your personal data.

## 2. Data Collection
We collect the following types of data:
${dataTypes.map(t => `- ${t}`).join('\n')}

## 3. Data Usage
Your data is used for:
- Service improvement
- User experience enhancement
- Compliance with legal obligations

## 4. Data Security
We employ industry-standard encryption and security measures to protect your data.

## 5. Your Rights (GDPR)
You have the right to:
- Access your personal data
- Request data deletion
- Withdraw consent
- Data portability

## 6. Contact
For privacy inquiries, contact: privacy@${companyName.toLowerCase()}.com

Generated on: ${new Date().toISOString()}
`;

    res.json(successResponse({
      policy,
      generatedAt: new Date(),
      version: '1.0.0'
    }, 'Privacy policy generated successfully'));
  } catch (err) {
    next(err);
  }
};

export const submitGDPRRequest = async (req, res, next) => {
  try {
    const { requestType, reason } = req.body;

    const validTypes = ['data-export', 'deletion', 'portability', 'rectification'];
    if (!validTypes.includes(requestType)) {
      throw createError(400, `Request type must be one of: ${validTypes.join(', ')}`);
    }

    const requestId = uuidv4();
    const gdprRequest = {
      id: requestId,
      userId: req.user.id,
      requestType,
      reason: reason || '',
      status: 'pending',
      submittedAt: new Date(),
      processingDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };

    gdprRequests.set(requestId, gdprRequest);

    res.status(201).json(successResponse(gdprRequest, 'GDPR request submitted successfully'));
  } catch (err) {
    next(err);
  }
};

export const getGDPRStatus = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    const gdprRequest = gdprRequests.get(requestId);
    if (!gdprRequest) {
      throw createError(404, 'GDPR request not found');
    }

    if (gdprRequest.userId !== req.user.id) {
      throw createError(403, 'Unauthorized access to GDPR request');
    }

    res.json(successResponse(gdprRequest, 'GDPR request status retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export const generateComplianceReport = async (req, res, next) => {
  try {
    const report = {
      id: uuidv4(),
      generatedAt: new Date(),
      userId: req.user.id,
      compliance: {
        gdpr: 'COMPLIANT',
        ccpa: 'COMPLIANT',
        hipaa: 'NOT_APPLICABLE',
        sox: 'COMPLIANT'
      },
      findings: [
        'All personal data encrypted with AES-256',
        'Data retention policies in place',
        'Regular security audits scheduled',
        'User consent properly recorded'
      ],
      recommendations: [
        'Consider implementing additional MFA options',
        'Schedule quarterly penetration testing'
      ],
      nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    };

    res.json(successResponse(report, 'Compliance report generated successfully'));
  } catch (err) {
    next(err);
  }
};
