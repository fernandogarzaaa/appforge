/**
 * GDPR Compliance Controller
 * Implements right-to-deletion and data portability flows
 */

import { v4 as uuidv4 } from 'uuid';
import { successResponse, createError } from '../utils/helpers.js';
import * as Sentry from '@sentry/node';

// Mock database for GDPR requests
const gdprRequests = new Map();
const deletionAudits = new Map();

/**
 * Right-to-Deletion: Cascade delete all user data
 * GDPR Article 17
 */
export const requestUserDeletion = async (req, res, next) => {
  try {
    const { confirm_email, reason } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Verify email confirmation
    if (confirm_email !== userEmail) {
      throw createError(400, 'Email confirmation does not match user email');
    }

    const requestId = uuidv4();
    const gdprRequest = {
      id: requestId,
      userId,
      type: 'deletion',
      status: 'pending',
      reason: reason || 'User requested deletion',
      requestedAt: new Date(),
      scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days grace period
      completedAt: null,
      itemsDeleted: [],
      errors: [],
    };

    gdprRequests.set(requestId, gdprRequest);

    // Capture in Sentry for compliance audit
    Sentry.captureMessage(`GDPR deletion requested for user ${userId}`, 'info', {
      tags: {
        'gdpr.type': 'deletion',
        'gdpr.user_id': userId,
      },
      extra: {
        reason,
        scheduled_for: gdprRequest.scheduledFor,
      },
    });

    // Send confirmation email (mock)
    console.log(`📧 Deletion confirmation email sent to ${userEmail}`);

    res.status(202).json(successResponse({
      request_id: requestId,
      status: 'pending',
      scheduled_for: gdprRequest.scheduledFor,
      message: 'Your deletion request has been received. You have 30 days to cancel this request.',
      cancel_url: `/api/security/gdpr/deletion/${requestId}/cancel`,
    }, 'Deletion request submitted'));
  } catch (err) {
    next(err);
  }
};

/**
 * Cancel pending deletion request
 */
export const cancelUserDeletion = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const gdprRequest = gdprRequests.get(requestId);
    if (!gdprRequest) {
      throw createError(404, 'GDPR request not found');
    }

    if (gdprRequest.userId !== userId) {
      throw createError(403, 'Unauthorized to modify this request');
    }

    if (gdprRequest.status !== 'pending') {
      throw createError(400, `Cannot cancel request with status: ${gdprRequest.status}`);
    }

    gdprRequest.status = 'cancelled';
    gdprRequest.cancelledAt = new Date();

    Sentry.captureMessage(`GDPR deletion cancelled for user ${userId}`, 'info', {
      tags: {
        'gdpr.type': 'deletion',
        'gdpr.action': 'cancelled',
      },
    });

    res.json(successResponse({
      request_id: requestId,
      status: 'cancelled',
      message: 'Your deletion request has been cancelled',
    }, 'Deletion request cancelled'));
  } catch (err) {
    next(err);
  }
};

/**
 * Execute cascade deletion of all user data
 * Called after grace period expires
 */
export async function executeUserDeletion(userId) {
  const auditId = uuidv4();
  const audit = {
    id: auditId,
    userId,
    startedAt: new Date(),
    completedAt: null,
    deletedCollections: [],
    errors: [],
  };

  try {
    console.log(`🗑️  Starting cascade deletion for user ${userId}`);

    // Collections to delete (in dependency order)
    const collectionsToDelete = [
      // Start with dependent collections
      'webhooks',
      'apikeys',
      'documents',
      'collaborations',
      'teams',
      'subscriptions',
      'analytics',
      'preferences',
      // Finally delete user account
      'users',
    ];

    for (const collection of collectionsToDelete) {
      try {
        const count = await deleteUserDataFromCollection(collection, userId);
        audit.deletedCollections.push({
          collection,
          deletedCount: count,
          deletedAt: new Date(),
        });
        console.log(`✅ Deleted ${count} items from ${collection}`);
      } catch (error) {
        audit.errors.push({
          collection,
          error: error.message,
          timestamp: new Date(),
        });
        console.error(`❌ Error deleting from ${collection}:`, error.message);
      }
    }

    audit.completedAt = new Date();
    deletionAudits.set(auditId, audit);

    // Log deletion audit trail
    Sentry.captureMessage(`User ${userId} deleted - cascade complete`, 'info', {
      tags: {
        'gdpr.action': 'deletion_executed',
        'audit_id': auditId,
      },
      extra: {
        collections_deleted: audit.deletedCollections,
        errors: audit.errors,
        duration_ms: audit.completedAt - audit.startedAt,
      },
    });

    console.log(`🎉 User ${userId} completely deleted`);
    return audit;
  } catch (error) {
    audit.completedAt = new Date();
    audit.errors.push({
      phase: 'unknown',
      error: error.message,
    });
    deletionAudits.set(auditId, audit);
    throw error;
  }
}

/**
 * Helper: Delete user data from a collection
 */
async function deleteUserDataFromCollection(collection, userId) {
  // Mock implementation - in production, call your database
  // This would query the collection for records with userId
  // and delete them all
  
  const mockCounts = {
    webhooks: 5,
    apikeys: 8,
    documents: 23,
    collaborations: 12,
    teams: 2,
    subscriptions: 1,
    analytics: 156,
    preferences: 1,
    users: 1,
  };

  // Simulate deletion
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockCounts[collection] || 0), 100);
  });
}

/**
 * Data Portability: Export all user data
 * GDPR Article 20
 */
export const requestDataPortability = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    const requestId = uuidv4();
    const gdprRequest = {
      id: requestId,
      userId,
      type: 'portability',
      status: 'processing',
      requestedAt: new Date(),
      completedAt: null,
      exportUrl: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiry
    };

    gdprRequests.set(requestId, gdprRequest);

    // Start async export in background
    setImmediate(() => {
      exportUserData(userId, requestId);
    });

    Sentry.captureMessage(`GDPR data portability requested for user ${userId}`, 'info', {
      tags: {
        'gdpr.type': 'portability',
      },
    });

    res.status(202).json(successResponse({
      request_id: requestId,
      status: 'processing',
      message: 'Your data export is being prepared. You will receive an email with a download link shortly.',
      estimated_time: '5-10 minutes',
    }, 'Data export request received'));
  } catch (err) {
    next(err);
  }
};

/**
 * Export all user data as portable JSON
 */
async function exportUserData(userId, requestId) {
  const gdprRequest = gdprRequests.get(requestId);

  try {
    console.log(`📦 Starting data export for user ${userId}`);

    const exportData = {
      export_metadata: {
        user_id: userId,
        exported_at: new Date().toISOString(),
        format_version: '1.0',
        compliance: 'GDPR Article 20',
      },
      user: await getUserData(userId),
      subscriptions: await getUserSubscriptions(userId),
      documents: await getUserDocuments(userId),
      api_keys: await getUserApiKeys(userId),
      teams: await getUserTeams(userId),
      collaborations: await getUserCollaborations(userId),
      analytics: await getUserAnalytics(userId),
      preferences: await getUserPreferences(userId),
      webhooks: await getUserWebhooks(userId),
    };

    // Generate download link (mock)
    const exportUrl = `https://api.appforge.dev/exports/${requestId}/data-${Date.now()}.json`;

    gdprRequest.status = 'completed';
    gdprRequest.completedAt = new Date();
    gdprRequest.exportUrl = exportUrl;

    // Send download email (mock)
    console.log(`📧 Data export email sent with download link`);
    console.log(`📥 Export URL: ${exportUrl}`);
    console.log(`📦 Data size: ${JSON.stringify(exportData).length} bytes`);

    Sentry.captureMessage(`GDPR data export completed for user ${userId}`, 'info', {
      tags: {
        'gdpr.action': 'export_completed',
      },
      extra: {
        export_size_bytes: JSON.stringify(exportData).length,
        collections_included: Object.keys(exportData).length,
      },
    });

    return exportData;
  } catch (error) {
    gdprRequest.status = 'error';
    gdprRequest.completedAt = new Date();
    gdprRequest.error = error.message;

    console.error(`❌ Data export failed:`, error.message);

    Sentry.captureException(error, {
      tags: {
        'gdpr.action': 'export_failed',
      },
    });

    throw error;
  }
}

// Mock data retrieval functions
async function getUserData(userId) {
  return {
    id: userId,
    email: 'user@example.com',
    username: 'john_doe',
    created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    last_login: new Date(Date.now() - 24 * 60 * 60 * 1000),
  };
}

async function getUserSubscriptions(userId) {
  return [{
    id: uuidv4(),
    plan: 'pro',
    status: 'active',
    started_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
  }];
}

async function getUserDocuments(userId) {
  return Array(23).fill(null).map(() => ({
    id: uuidv4(),
    title: 'Sample Document',
    created_at: new Date(),
  }));
}

async function getUserApiKeys(userId) {
  return Array(8).fill(null).map(() => ({
    id: uuidv4(),
    masked_key: 'sk_****...****',
    created_at: new Date(),
    last_used: new Date(),
  }));
}

async function getUserTeams(userId) {
  return [{
    id: uuidv4(),
    name: 'My Team',
    role: 'owner',
    members: 5,
  }];
}

async function getUserCollaborations(userId) {
  return Array(12).fill(null).map(() => ({
    id: uuidv4(),
    document_id: uuidv4(),
    role: 'editor',
    shared_at: new Date(),
  }));
}

async function getUserAnalytics(userId) {
  return {
    total_sessions: 156,
    total_duration_hours: 287,
    last_30_days: {
      sessions: 23,
      duration_hours: 34,
    },
  };
}

async function getUserPreferences(userId) {
  return {
    theme: 'dark',
    language: 'en',
    notifications_enabled: true,
  };
}

async function getUserWebhooks(userId) {
  return [{
    id: uuidv4(),
    url: 'https://example.com/webhook',
    events: ['document.created', 'document.updated'],
  }];
}

/**
 * Get GDPR request status
 */
export const getGDPRRequestStatus = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const gdprRequest = gdprRequests.get(requestId);
    if (!gdprRequest) {
      throw createError(404, 'GDPR request not found');
    }

    if (gdprRequest.userId !== userId) {
      throw createError(403, 'Unauthorized to view this request');
    }

    res.json(successResponse(gdprRequest, 'GDPR request status retrieved'));
  } catch (err) {
    next(err);
  }
};

/**
 * List all GDPR requests for user
 */
export const listGDPRRequests = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userRequests = Array.from(gdprRequests.values())
      .filter(r => r.userId === userId)
      .sort((a, b) => b.requestedAt - a.requestedAt);

    res.json(successResponse(userRequests, 'GDPR requests retrieved'));
  } catch (err) {
    next(err);
  }
};

export default {
  requestUserDeletion,
  cancelUserDeletion,
  executeUserDeletion,
  requestDataPortability,
  getGDPRRequestStatus,
  listGDPRRequests,
};
