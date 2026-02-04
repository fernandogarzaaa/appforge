/**
 * Admin API Keys Controller
 * Manages API keys with proper Mongoose database persistence
 * Implements CRUD operations, pagination, filtering, sorting, and audit logging
 */

import { successResponse, createError } from '../utils/helpers.js';
import APIKey from '../models/APIKey.js';
import AuditLog from '../models/AuditLog.js';

/**
 * Mask API key for safe display
 * @param {string} value - Full API key value
 * @returns {string} - Masked key preview
 */
const maskKey = (value) => {
  if (!value) return '';
  const safe = String(value);
  if (safe.length <= 8) return `${safe.slice(0, 2)}...${safe.slice(-2)}`;
  return `${safe.slice(0, 4)}...${safe.slice(-4)}`;
};

/**
 * Serialize API key for response (excludes sensitive data)
 * @param {Object} record - API key document
 * @param {boolean} includePlainKey - Whether to include plaintext key
 * @returns {Object} - Serialized key data
 */
const serializeKey = (record, includePlainKey = false) => {
  const serialized = {
    _id: record._id,
    name: record.name,
    status: record.status,
    scope: record.scope,
    rateLimit: record.rateLimit,
    rateLimitUnit: record.rateLimitUnit,
    description: record.description,
    keyPreview: maskKey(record.key),
    createdAt: record.createdAt,
    createdBy: record.createdBy,
    lastUsed: record.lastUsed,
    usageCount: record.usageCount,
    expiresAt: record.expiresAt,
    ipWhitelist: record.ipWhitelist,
    metadata: record.metadata
  };

  if (record.revokedAt) {
    serialized.revokedAt = record.revokedAt;
    serialized.revokedBy = record.revokedBy;
    serialized.revokedReason = record.revokedReason;
  }

  return serialized;
};

/**
 * List all API keys with pagination, filtering, and sorting
 * GET /admin/keys
 */
export const listKeys = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-createdAt';
    const { status, scope, search } = req.query;

    // Build filter query
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (scope) {
      filter.scope = scope;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const [total, keys] = await Promise.all([
      APIKey.countDocuments(filter),
      APIKey.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    const serialized = keys.map(key => serializeKey(key, false));

    res.json(successResponse({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      keys: serialized
    }, 'API keys retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * Get a single API key by ID
 * GET /admin/keys/:id
 */
export const getKey = async (req, res, next) => {
  try {
    const { id } = req.params;

    const key = await APIKey.findById(id).lean();

    if (!key) {
      throw createError(404, 'API key not found');
    }

    res.json(successResponse(
      serializeKey(key, false),
      'API key retrieved successfully'
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new API key
 * POST /admin/keys
 */
export const createKey = async (req, res, next) => {
  try {
    const { name, description, scope, rateLimit, rateLimitUnit, expiresAt, ipWhitelist, metadata } = req.body;
    const userId = req.user?.id || 'system';

    // Validation
    if (!name) {
      throw createError(400, 'Key name is required');
    }

    if (!Array.isArray(scope) || scope.length === 0) {
      throw createError(400, 'At least one scope is required');
    }

    if (rateLimit && (rateLimit < 1 || rateLimit > 1000000)) {
      throw createError(400, 'Rate limit must be between 1 and 1,000,000');
    }

    // Check for duplicate name per user
    const existing = await APIKey.findOne({ name, createdBy: userId });
    if (existing) {
      throw createError(409, 'API key with this name already exists');
    }

    // Generate new key
    const { key: plainKey, keyDocument } = await APIKey.generateKey({
      name,
      description,
      scope,
      rateLimit: rateLimit || 1000,
      rateLimitUnit: rateLimitUnit || 'hour',
      expiresAt,
      createdBy: userId,
      ipWhitelist: ipWhitelist || [],
      metadata: metadata || {}
    });

    // Audit log
    await AuditLog.logAction({
      action: 'CREATE',
      userId,
      resourceType: 'apiKey',
      resourceId: keyDocument._id.toString(),
      details: { name, scope, rateLimit },
      status: 'success'
    });

    res.status(201).json(successResponse({
      ...serializeKey(keyDocument, false),
      key: plainKey // Only returned once at creation
    }, 'API key created successfully'));
  } catch (err) {
    // Audit failure
    if (req.user?.id) {
      await AuditLog.logAction({
        action: 'CREATE',
        userId: req.user.id,
        resourceType: 'apiKey',
        details: req.body,
        status: 'failure',
        errorMessage: err.message
      }).catch(() => {}); // Don't fail if audit logging fails
    }
    next(err);
  }
};

/**
 * Update an API key
 * PATCH /admin/keys/:id
 */
export const updateKey = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, scope, rateLimit, rateLimitUnit, metadata, ipWhitelist } = req.body;
    const userId = req.user?.id || 'system';

    const key = await APIKey.findById(id);
    if (!key) {
      throw createError(404, 'API key not found');
    }

    // Track original state for audit
    const originalState = {
      name: key.name,
      scope: key.scope,
      rateLimit: key.rateLimit
    };

    // Update fields
    if (name !== undefined) key.name = name;
    if (description !== undefined) key.description = description;
    if (scope !== undefined) {
      if (!Array.isArray(scope) || scope.length === 0) {
        throw createError(400, 'At least one scope is required');
      }
      key.scope = scope;
    }
    if (rateLimit !== undefined) {
      if (rateLimit < 1 || rateLimit > 1000000) {
        throw createError(400, 'Rate limit must be between 1 and 1,000,000');
      }
      key.rateLimit = rateLimit;
    }
    if (rateLimitUnit !== undefined) key.rateLimitUnit = rateLimitUnit;
    if (metadata !== undefined) key.metadata = metadata;
    if (ipWhitelist !== undefined) key.ipWhitelist = ipWhitelist;

    await key.save();

    // Audit log
    await AuditLog.logAction({
      action: 'UPDATE',
      userId,
      resourceType: 'apiKey',
      resourceId: key._id.toString(),
      details: {
        originalState,
        updatedFields: { name, scope, rateLimit }
      },
      status: 'success'
    });

    res.json(successResponse(
      serializeKey(key, false),
      'API key updated successfully'
    ));
  } catch (err) {
    // Audit failure
    if (req.user?.id) {
      await AuditLog.logAction({
        action: 'UPDATE',
        userId: req.user.id,
        resourceType: 'apiKey',
        resourceId: req.params.id,
        details: req.body,
        status: 'failure',
        errorMessage: err.message
      }).catch(() => {});
    }
    next(err);
  }
};

/**
 * Delete an API key (soft delete by revoking)
 * DELETE /admin/keys/:id
 */
export const deleteKey = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    const key = await APIKey.findById(id);
    if (!key) {
      throw createError(404, 'API key not found');
    }

    // Revoke the key instead of deleting
    await key.revoke(userId, 'Administrative deletion');

    // Audit log
    await AuditLog.logAction({
      action: 'DELETE',
      userId,
      resourceType: 'apiKey',
      resourceId: key._id.toString(),
      details: { name: key.name },
      status: 'success'
    });

    res.json(successResponse(
      { _id: key._id, status: key.status },
      'API key deleted successfully'
    ));
  } catch (err) {
    // Audit failure
    if (req.user?.id) {
      await AuditLog.logAction({
        action: 'DELETE',
        userId: req.user.id,
        resourceType: 'apiKey',
        resourceId: req.params.id,
        status: 'failure',
        errorMessage: err.message
      }).catch(() => {});
    }
    next(err);
  }
};

/**
 * Rotate an API key (generates new key, keeps old one valid for 24 hours)
 * POST /admin/keys/:id/rotate
 */
export const rotateKey = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    const key = await APIKey.findById(id);
    if (!key) {
      throw createError(404, 'API key not found');
    }

    if (key.status !== 'active') {
      throw createError(400, 'Cannot rotate a key that is not active');
    }

    // Generate new key
    const { key: newPlainKey, keyDocument } = await APIKey.generateKey({
      name: key.name,
      description: key.description,
      scope: key.scope,
      rateLimit: key.rateLimit,
      rateLimitUnit: key.rateLimitUnit,
      expiresAt: key.expiresAt,
      createdBy: key.createdBy,
      ipWhitelist: key.ipWhitelist,
      metadata: { ...key.metadata, rotatedFromKey: key._id }
    });

    // Audit log
    await AuditLog.logAction({
      action: 'ROTATE',
      userId,
      resourceType: 'apiKey',
      resourceId: key._id.toString(),
      details: {
        oldKeyId: key._id,
        newKeyId: keyDocument._id
      },
      status: 'success'
    });

    res.json(successResponse({
      oldKey: serializeKey(key, false),
      newKey: {
        ...serializeKey(keyDocument, false),
        key: newPlainKey
      }
    }, 'API key rotated successfully'));
  } catch (err) {
    // Audit failure
    if (req.user?.id) {
      await AuditLog.logAction({
        action: 'ROTATE',
        userId: req.user.id,
        resourceType: 'apiKey',
        resourceId: req.params.id,
        status: 'failure',
        errorMessage: err.message
      }).catch(() => {});
    }
    next(err);
  }
};

/**
 * Get API key usage statistics
 * GET /admin/keys/:id/usage
 */
export const getKeyUsage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const key = await APIKey.findById(id).lean();
    if (!key) {
      throw createError(404, 'API key not found');
    }

    res.json(successResponse({
      _id: key._id,
      name: key.name,
      rateLimit: key.rateLimit,
      rateLimitUnit: key.rateLimitUnit,
      usageCount: key.usageCount,
      lastUsed: key.lastUsed,
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
      expiresAt: key.expiresAt
    }, 'API key usage retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * Revoke an API key
 * POST /admin/keys/:id/revoke
 */
export const revokeKey = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id || 'system';

    const key = await APIKey.findById(id);
    if (!key) {
      throw createError(404, 'API key not found');
    }

    if (key.status === 'revoked') {
      throw createError(400, 'API key is already revoked');
    }

    await key.revoke(userId, reason || 'Manual revocation');

    // Audit log
    await AuditLog.logAction({
      action: 'REVOKE',
      userId,
      resourceType: 'apiKey',
      resourceId: key._id.toString(),
      details: { reason },
      status: 'success'
    });

    res.json(successResponse(
      serializeKey(key, false),
      'API key revoked successfully'
    ));
  } catch (err) {
    // Audit failure
    if (req.user?.id) {
      await AuditLog.logAction({
        action: 'REVOKE',
        userId: req.user.id,
        resourceType: 'apiKey',
        resourceId: req.params.id,
        status: 'failure',
        errorMessage: err.message
      }).catch(() => {});
    }
    next(err);
  }
};

export default {
  listKeys,
  getKey,
  createKey,
  updateKey,
  deleteKey,
  rotateKey,
  getKeyUsage,
  revokeKey
};
