/**
 * Admin Secrets Controller
 * Manages encrypted secrets with Mongoose persistence
 * Implements CRUD operations, encryption/decryption, pagination, filtering, sorting, and audit logging
 */

import { successResponse, createError } from '../utils/helpers.js';
import Secret from '../models/Secret.js';
import AuditLog from '../models/AuditLog.js';
import { encrypt, decrypt } from '../utils/encryption.js';

/**
 * Mask secret value for safe display
 * @param {string} value - Decrypted value
 * @returns {string} - Masked value
 */
const maskValue = (value) => {
  if (!value) return '';
  const safe = String(value);
  if (safe.length <= 6) return '*'.repeat(Math.max(3, safe.length));
  return `${safe.slice(0, 2)}${'*'.repeat(Math.max(2, safe.length - 4))}${safe.slice(-2)}`;
};

/**
 * Serialize secret for response (excludes encrypted value by default)
 * @param {Object} secret - Secret document
 * @param {boolean} includeValue - Whether to include decrypted value
 * @returns {Object} - Serialized secret
 */
const serializeSecret = (secret, includeValue = false) => {
  const serialized = {
    _id: secret._id,
    key: secret.key,
    category: secret.category,
    environment: secret.environment,
    description: secret.description || '',
    metadata: secret.metadata || {},
    tags: secret.tags || [],
    createdAt: secret.createdAt,
    updatedAt: secret.updatedAt,
    createdBy: secret.createdBy,
    lastModifiedBy: secret.lastModifiedBy,
    lastModifiedAt: secret.lastModifiedAt,
    isActive: secret.isActive,
    externalReference: secret.externalReference
  };

  if (includeValue && secret.value) {
    try {
      const decrypted = decrypt(secret.value);
      serialized.value = decrypted;
    } catch (err) {
      serialized.value = null;
      serialized.decryptionError = 'Failed to decrypt value';
    }
  } else if (!includeValue && secret.value) {
    try {
      const decrypted = decrypt(secret.value);
      serialized.valueMasked = maskValue(decrypted);
    } catch (err) {
      serialized.valueMasked = '***';
    }
  }

  return serialized;
};

/**
 * List all secrets with pagination, filtering, and sorting
 * GET /admin/secrets
 */
export const listSecrets = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-updatedAt';
    const { category, environment, isActive, search, tags } = req.query;

    // Build filter query
    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (environment) {
      filter.environment = environment;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }

    if (search) {
      filter.$or = [
        { key: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Exclude sensitive fields
    const [total, secrets] = await Promise.all([
      Secret.countDocuments(filter),
      Secret.find(filter)
        .select('-value -valueHash -previousValues -accessLog')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    const serialized = secrets.map(secret => serializeSecret(secret, false));

    res.json(successResponse({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      secrets: serialized
    }, 'Secrets retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * Get a single secret by ID (includes decrypted value)
 * GET /admin/secrets/:id
 */
export const getSecret = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    const secret = await Secret.findById(id).select('-previousValues -accessLog');

    if (!secret) {
      throw createError(404, 'Secret not found');
    }

    // Log access
    await AuditLog.logAction({
      action: 'READ',
      userId,
      resourceType: 'secret',
      resourceId: secret._id.toString(),
      details: { key: secret.key },
      status: 'success'
    }).catch(() => {}); // Don't fail if audit logging fails

    res.json(successResponse(
      serializeSecret(secret.toObject(), true),
      'Secret retrieved successfully'
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new secret
 * POST /admin/secrets
 */
export const createSecret = async (req, res, next) => {
  try {
    const { key, value, category, environment, description, metadata, tags, owner, externalReference } = req.body;
    const userId = req.user?.id || 'system';

    // Validation
    if (!key) {
      throw createError(400, 'Secret key is required');
    }

    if (!value) {
      throw createError(400, 'Secret value is required');
    }

    // Check for duplicate key in same environment
    const existing = await Secret.findOne({
      key,
      environment: environment || 'production',
      owner: owner || null
    });

    if (existing) {
      throw createError(409, 'Secret with this key already exists in this environment');
    }

    // Create secret (pre-save hook handles encryption)
    const secret = new Secret({
      key,
      value: String(value),
      category: category || 'custom',
      environment: environment || 'production',
      description: description || '',
      metadata: metadata || {},
      tags: tags || [],
      createdBy: userId,
      owner: owner || null,
      externalReference: externalReference || null
    });

    await secret.save();

    // Audit log
    await AuditLog.logAction({
      action: 'CREATE',
      userId,
      resourceType: 'secret',
      resourceId: secret._id.toString(),
      details: { key, category, environment },
      status: 'success'
    }).catch(() => {});

    res.status(201).json(successResponse(
      serializeSecret(secret.toObject(), true),
      'Secret created successfully'
    ));
  } catch (err) {
    // Audit failure
    if (req.user?.id) {
      await AuditLog.logAction({
        action: 'CREATE',
        userId: req.user.id,
        resourceType: 'secret',
        details: { key: req.body.key },
        status: 'failure',
        errorMessage: err.message
      }).catch(() => {});
    }
    next(err);
  }
};

/**
 * Update a secret
 * PATCH /admin/secrets/:id
 */
export const updateSecret = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { value, description, metadata, tags, externalReference } = req.body;
    const userId = req.user?.id || 'system';

    const secret = await Secret.findById(id);
    if (!secret) {
      throw createError(404, 'Secret not found');
    }

    const originalState = {
      key: secret.key,
      category: secret.category
    };

    // Update fields
    if (value !== undefined && value !== null) {
      secret.value = String(value);
      secret.lastModifiedBy = userId;
      secret.lastModifiedAt = new Date();
    }

    if (description !== undefined) {
      secret.description = description;
    }

    if (metadata !== undefined) {
      secret.metadata = metadata;
    }

    if (tags !== undefined) {
      secret.tags = tags;
    }

    if (externalReference !== undefined) {
      secret.externalReference = externalReference;
    }

    await secret.save();

    // Audit log
    await AuditLog.logAction({
      action: 'UPDATE',
      userId,
      resourceType: 'secret',
      resourceId: secret._id.toString(),
      details: {
        originalState,
        updatedFields: Object.keys(req.body)
      },
      status: 'success'
    }).catch(() => {});

    res.json(successResponse(
      serializeSecret(secret.toObject(), true),
      'Secret updated successfully'
    ));
  } catch (err) {
    // Audit failure
    if (req.user?.id) {
      await AuditLog.logAction({
        action: 'UPDATE',
        userId: req.user.id,
        resourceType: 'secret',
        resourceId: req.params.id,
        status: 'failure',
        errorMessage: err.message
      }).catch(() => {});
    }
    next(err);
  }
};

/**
 * Delete a secret (soft delete)
 * DELETE /admin/secrets/:id
 */
export const deleteSecret = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    const secret = await Secret.findById(id);
    if (!secret) {
      throw createError(404, 'Secret not found');
    }

    // Soft delete by deactivating
    await Secret.deactivate(id, userId);

    // Audit log
    await AuditLog.logAction({
      action: 'DELETE',
      userId,
      resourceType: 'secret',
      resourceId: secret._id.toString(),
      details: { key: secret.key },
      status: 'success'
    }).catch(() => {});

    res.json(successResponse(
      { _id: secret._id, isActive: false },
      'Secret deleted successfully'
    ));
  } catch (err) {
    // Audit failure
    if (req.user?.id) {
      await AuditLog.logAction({
        action: 'DELETE',
        userId: req.user.id,
        resourceType: 'secret',
        resourceId: req.params.id,
        status: 'failure',
        errorMessage: err.message
      }).catch(() => {});
    }
    next(err);
  }
};

/**
 * Get secrets by category
 * GET /admin/secrets/category/:category
 */
export const getByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
    const skip = (page - 1) * limit;

    const filter = { category, isActive: true };

    const [total, secrets] = await Promise.all([
      Secret.countDocuments(filter),
      Secret.find(filter)
        .select('-value -valueHash -previousValues -accessLog')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    const serialized = secrets.map(secret => serializeSecret(secret, false));

    res.json(successResponse({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      secrets: serialized
    }, `Secrets in category "${category}" retrieved successfully`));
  } catch (err) {
    next(err);
  }
};

/**
 * Rotate a secret (create new value, keep history)
 * POST /admin/secrets/:id/rotate
 */
export const rotateSecret = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newValue } = req.body;
    const userId = req.user?.id || 'system';

    if (!newValue) {
      throw createError(400, 'New value is required');
    }

    const secret = await Secret.findById(id);
    if (!secret) {
      throw createError(404, 'Secret not found');
    }

    // Update value (pre-save hooks handle encryption and history)
    await secret.updateValue(String(newValue), userId, 'Manual rotation');

    // Audit log
    await AuditLog.logAction({
      action: 'ROTATE',
      userId,
      resourceType: 'secret',
      resourceId: secret._id.toString(),
      details: { key: secret.key, category: secret.category },
      status: 'success'
    }).catch(() => {});

    res.json(successResponse(
      serializeSecret(secret.toObject(), true),
      'Secret rotated successfully'
    ));
  } catch (err) {
    // Audit failure
    if (req.user?.id) {
      await AuditLog.logAction({
        action: 'ROTATE',
        userId: req.user.id,
        resourceType: 'secret',
        resourceId: req.params.id,
        status: 'failure',
        errorMessage: err.message
      }).catch(() => {});
    }
    next(err);
  }
};

/**
 * Export secrets (encrypted payload)
 * GET /admin/secrets/export
 */
export const exportSecrets = async (req, res, next) => {
  try {
    const { category, environment, tags } = req.query;
    const userId = req.user?.id || 'system';

    // Build filter
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (environment) filter.environment = environment;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }

    // Fetch secrets (without selecting sensitive data during export)
    const secrets = await Secret.find(filter).select('-valueHash -previousValues -accessLog');

    // Decrypt values for export
    const exportData = secrets.map(secret => {
      try {
        const decrypted = decrypt(secret.value);
        return {
          key: secret.key,
          value: decrypted,
          category: secret.category,
          environment: secret.environment,
          metadata: secret.metadata,
          tags: secret.tags
        };
      } catch (err) {
        return null;
      }
    }).filter(Boolean);

    const payload = {
      exportedAt: new Date().toISOString(),
      exportedBy: userId,
      count: exportData.length,
      secrets: exportData
    };

    // Encrypt payload for secure transport
    const encryptedPayload = encrypt(JSON.stringify(payload));

    // Audit log
    await AuditLog.logAction({
      action: 'EXPORT',
      userId,
      resourceType: 'secret',
      details: { count: exportData.length, filters: { category, environment } },
      status: 'success'
    }).catch(() => {});

    res.json(successResponse({
      encrypted: true,
      payload: encryptedPayload,
      count: exportData.length
    }, 'Secrets exported successfully'));
  } catch (err) {
    // Audit failure
    if (req.user?.id) {
      await AuditLog.logAction({
        action: 'EXPORT',
        userId: req.user.id,
        resourceType: 'secret',
        status: 'failure',
        errorMessage: err.message
      }).catch(() => {});
    }
    next(err);
  }
};

/**
 * Import secrets from encrypted payload
 * POST /admin/secrets/import
 */
export const importSecrets = async (req, res, next) => {
  try {
    const { payload, encrypted = true } = req.body;
    const userId = req.user?.id || 'system';

    if (!payload) {
      throw createError(400, 'Payload is required');
    }

    // Decrypt if needed
    let decoded;
    try {
      decoded = encrypted ? decrypt(payload) : payload;
    } catch (err) {
      throw createError(400, 'Failed to decrypt payload');
    }

    const parsed = typeof decoded === 'string' ? JSON.parse(decoded) : decoded;

    if (!parsed || !Array.isArray(parsed.secrets)) {
      throw createError(400, 'Invalid secrets payload format');
    }

    let created = 0;
    let updated = 0;
    const errors = [];

    // Import each secret
    for (const item of parsed.secrets) {
      try {
        if (!item?.key || item?.value === undefined) {
          errors.push(`Invalid secret: missing key or value`);
          continue;
        }

        // Check if exists
        const existing = await Secret.findOne({
          key: item.key,
          environment: item.environment || 'production'
        });

        if (existing) {
          // Update existing
          await existing.updateValue(
            String(item.value),
            userId,
            'Import update'
          );
          updated++;
        } else {
          // Create new
          const secret = new Secret({
            key: item.key,
            value: String(item.value),
            category: item.category || 'custom',
            environment: item.environment || 'production',
            metadata: item.metadata || {},
            tags: item.tags || [],
            createdBy: userId
          });
          await secret.save();
          created++;
        }
      } catch (err) {
        errors.push(`Error importing "${item.key}": ${err.message}`);
      }
    }

    // Audit log
    await AuditLog.logAction({
      action: 'IMPORT',
      userId,
      resourceType: 'secret',
      details: { created, updated, errors: errors.length },
      status: errors.length === 0 ? 'success' : 'warning'
    }).catch(() => {});

    res.json(successResponse({
      created,
      updated,
      errors: errors.length > 0 ? errors : undefined
    }, 'Secrets imported successfully'));
  } catch (err) {
    // Audit failure
    if (req.user?.id) {
      await AuditLog.logAction({
        action: 'IMPORT',
        userId: req.user.id,
        resourceType: 'secret',
        status: 'failure',
        errorMessage: err.message
      }).catch(() => {});
    }
    next(err);
  }
};

/**
 * Get secrets due for rotation
 * GET /admin/secrets/rotation-due
 */
export const getRotationDue = async (req, res, next) => {
  try {
    const secrets = await Secret.getDueForRotation();

    res.json(successResponse(
      secrets.map(secret => serializeSecret(secret, false)),
      'Secrets due for rotation retrieved successfully'
    ));
  } catch (err) {
    next(err);
  }
};

export default {
  listSecrets,
  getSecret,
  createSecret,
  updateSecret,
  deleteSecret,
  getByCategory,
  rotateSecret,
  exportSecrets,
  importSecrets,
  getRotationDue
};
