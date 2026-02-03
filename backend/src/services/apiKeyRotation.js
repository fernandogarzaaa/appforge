/**
 * Automated API Key Rotation Service
 * Handles scheduled rotation of API keys for enhanced security
 */

import crypto from 'crypto';
import { logger } from '../config/logger.js';

// Mock database - replace with actual DB models
const apiKeys = new Map();
const rotationSchedule = new Map();

/**
 * API Key Rotation Configuration
 */
const ROTATION_CONFIG = {
  DEFAULT_ROTATION_DAYS: 90, // Rotate every 90 days
  WARNING_DAYS: 14, // Warn 14 days before expiration
  GRACE_PERIOD_DAYS: 7, // Keep old key valid for 7 days after rotation
  KEY_LENGTH: 32,
  PREFIX: 'ak_',
};

/**
 * Generate a secure API key
 */
function generateApiKey() {
  const randomBytes = crypto.randomBytes(ROTATION_CONFIG.KEY_LENGTH);
  const key = randomBytes.toString('base64url');
  return `${ROTATION_CONFIG.PREFIX}${key}`;
}

/**
 * Generate key hash for storage
 */
function hashApiKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Schedule API key for rotation
 */
export async function scheduleKeyRotation(keyId, rotationDays = ROTATION_CONFIG.DEFAULT_ROTATION_DAYS) {
  try {
    const rotationDate = new Date();
    rotationDate.setDate(rotationDate.getDate() + rotationDays);

    rotationSchedule.set(keyId, {
      keyId,
      rotationDate,
      warningDate: new Date(rotationDate.getTime() - ROTATION_CONFIG.WARNING_DAYS * 24 * 60 * 60 * 1000),
      status: 'scheduled',
      rotationDays,
    });

    logger.info(`API key ${keyId} scheduled for rotation on ${rotationDate.toISOString()}`);
    
    return {
      success: true,
      keyId,
      rotationDate,
      warningDate: rotationSchedule.get(keyId).warningDate,
    };
  } catch (error) {
    logger.error(`Failed to schedule key rotation for ${keyId}:`, error);
    throw error;
  }
}

/**
 * Rotate API key
 */
export async function rotateApiKey(keyId, userId) {
  try {
    logger.info(`Starting rotation for API key ${keyId}`);

    // Generate new key
    const newKey = generateApiKey();
    const newKeyHash = hashApiKey(newKey);

    // Get old key metadata
    const oldKey = apiKeys.get(keyId);
    if (!oldKey) {
      throw new Error(`API key ${keyId} not found`);
    }

    // Create new key record
    const newKeyId = crypto.randomUUID();
    const newKeyRecord = {
      id: newKeyId,
      userId,
      keyHash: newKeyHash,
      name: `${oldKey.name} (Rotated)`,
      scopes: oldKey.scopes,
      createdAt: new Date(),
      expiresAt: null,
      rotatedFrom: keyId,
      status: 'active',
    };

    // Mark old key for deprecation (keep valid during grace period)
    const graceExpiresAt = new Date();
    graceExpiresAt.setDate(graceExpiresAt.getDate() + ROTATION_CONFIG.GRACE_PERIOD_DAYS);

    apiKeys.set(keyId, {
      ...oldKey,
      status: 'rotating',
      expiresAt: graceExpiresAt,
      rotatedTo: newKeyId,
    });

    // Store new key
    apiKeys.set(newKeyId, newKeyRecord);

    // Schedule next rotation
    await scheduleKeyRotation(newKeyId);

    // Remove old rotation schedule
    rotationSchedule.delete(keyId);

    // Send notification
    await notifyKeyRotation(userId, {
      oldKeyId: keyId,
      newKeyId,
      graceExpiresAt,
    });

    logger.info(`API key rotated: ${keyId} -> ${newKeyId}`);

    return {
      success: true,
      newKey, // Return plaintext key only once
      newKeyId,
      oldKeyId: keyId,
      graceExpiresAt,
      message: `API key rotated successfully. Old key valid until ${graceExpiresAt.toISOString()}`,
    };
  } catch (error) {
    logger.error(`Failed to rotate API key ${keyId}:`, error);
    throw error;
  }
}

/**
 * Auto-rotate expiring keys
 */
export async function autoRotateExpiringKeys() {
  try {
    const now = new Date();
    const keysToRotate = [];

    // Find keys due for rotation
    for (const [keyId, schedule] of rotationSchedule.entries()) {
      if (schedule.status === 'scheduled' && schedule.rotationDate <= now) {
        keysToRotate.push(keyId);
      }
    }

    logger.info(`Found ${keysToRotate.length} keys due for rotation`);

    const results = [];
    for (const keyId of keysToRotate) {
      try {
        const key = apiKeys.get(keyId);
        if (key && key.status === 'active') {
          const result = await rotateApiKey(keyId, key.userId);
          results.push({ keyId, success: true, newKeyId: result.newKeyId });
        }
      } catch (error) {
        logger.error(`Auto-rotation failed for key ${keyId}:`, error);
        results.push({ keyId, success: false, error: error.message });
      }
    }

    return {
      rotated: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  } catch (error) {
    logger.error('Auto-rotation batch failed:', error);
    throw error;
  }
}

/**
 * Send rotation warnings
 */
export async function sendRotationWarnings() {
  try {
    const now = new Date();
    const warnings = [];

    for (const [keyId, schedule] of rotationSchedule.entries()) {
      if (schedule.status === 'scheduled' && schedule.warningDate <= now && schedule.rotationDate > now) {
        const key = apiKeys.get(keyId);
        if (key) {
          const daysUntilRotation = Math.ceil((schedule.rotationDate - now) / (24 * 60 * 60 * 1000));
          
          await notifyKeyRotationWarning(key.userId, {
            keyId,
            keyName: key.name,
            daysUntilRotation,
            rotationDate: schedule.rotationDate,
          });

          warnings.push({ keyId, daysUntilRotation });
          
          // Mark as warned
          schedule.status = 'warned';
          rotationSchedule.set(keyId, schedule);
        }
      }
    }

    logger.info(`Sent ${warnings.length} rotation warnings`);
    return warnings;
  } catch (error) {
    logger.error('Failed to send rotation warnings:', error);
    throw error;
  }
}

/**
 * Get rotation status for all keys
 */
export function getRotationStatus() {
  const now = new Date();
  const status = {
    total: apiKeys.size,
    active: 0,
    rotating: 0,
    expired: 0,
    scheduledRotations: [],
    upcomingWarnings: [],
  };

  for (const [keyId, key] of apiKeys.entries()) {
    if (key.status === 'active') status.active++;
    if (key.status === 'rotating') status.rotating++;
    if (key.expiresAt && key.expiresAt < now) status.expired++;
  }

  for (const [keyId, schedule] of rotationSchedule.entries()) {
    if (schedule.rotationDate > now) {
      status.scheduledRotations.push({
        keyId,
        rotationDate: schedule.rotationDate,
        daysUntil: Math.ceil((schedule.rotationDate - now) / (24 * 60 * 60 * 1000)),
      });
    }
    
    if (schedule.warningDate > now && schedule.warningDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) {
      status.upcomingWarnings.push({
        keyId,
        warningDate: schedule.warningDate,
        daysUntil: Math.ceil((schedule.warningDate - now) / (24 * 60 * 60 * 1000)),
      });
    }
  }

  return status;
}

/**
 * Cleanup expired keys
 */
export async function cleanupExpiredKeys() {
  try {
    const now = new Date();
    const expired = [];

    for (const [keyId, key] of apiKeys.entries()) {
      if (key.expiresAt && key.expiresAt < now && key.status === 'rotating') {
        apiKeys.delete(keyId);
        expired.push(keyId);
        logger.info(`Cleaned up expired key: ${keyId}`);
      }
    }

    return {
      cleaned: expired.length,
      keys: expired,
    };
  } catch (error) {
    logger.error('Failed to cleanup expired keys:', error);
    throw error;
  }
}

/**
 * Notification helpers (integrate with your notification system)
 */
async function notifyKeyRotation(userId, data) {
  // TODO: Integrate with email/notification service
  logger.info(`[NOTIFICATION] Key rotated for user ${userId}`, data);
}

async function notifyKeyRotationWarning(userId, data) {
  // TODO: Integrate with email/notification service
  logger.warn(`[NOTIFICATION] Key rotation warning for user ${userId}`, data);
}

/**
 * Initialize rotation scheduler (call this on app startup)
 */
export function initializeRotationScheduler() {
  // Run auto-rotation daily at 2 AM
  const ROTATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  
  setInterval(async () => {
    try {
      logger.info('Running scheduled API key rotation check...');
      await autoRotateExpiringKeys();
      await sendRotationWarnings();
      await cleanupExpiredKeys();
    } catch (error) {
      logger.error('Scheduled rotation check failed:', error);
    }
  }, ROTATION_INTERVAL);

  // Also check on startup
  setTimeout(async () => {
    await autoRotateExpiringKeys();
    await sendRotationWarnings();
  }, 5000); // Wait 5 seconds after startup

  logger.info('API key rotation scheduler initialized');
}

export default {
  generateApiKey,
  scheduleKeyRotation,
  rotateApiKey,
  autoRotateExpiringKeys,
  sendRotationWarnings,
  getRotationStatus,
  cleanupExpiredKeys,
  initializeRotationScheduler,
  ROTATION_CONFIG,
};
