/**
 * APIKey Model
 * Manages API keys for external integrations and third-party access
 * Keys are hashed for security - original key is never stored
 */

import mongoose from 'mongoose';
import { hash, generateToken } from '../utils/encryption.js';

const apiKeySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
      index: true
    },

    key: {
      type: String,
      required: true,
      unique: true,
      select: false, // Don't return hashed key by default
      index: true
    },

    keyHash: {
      type: String,
      required: true,
      unique: true,
      select: false
    },

    scope: {
      type: [String],
      enum: [
        'read',
        'write',
        'delete',
        'admin',
        'deployments',
        'analytics',
        'teams',
        'workflows',
        'ai',
        'quantum'
      ],
      default: ['read'],
      required: true,
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'At least one scope is required'
      }
    },

    rateLimit: {
      type: Number,
      required: true,
      default: 1000,
      min: 1,
      max: 1000000,
      validate: {
        validator: function (v) {
          return v > 0;
        },
        message: 'Rate limit must be greater than 0'
      }
    },

    rateLimitUnit: {
      type: String,
      enum: ['minute', 'hour', 'day'],
      default: 'hour',
      required: true
    },

    lastUsed: {
      type: Date,
      default: null
    },

    usageCount: {
      type: Number,
      default: 0,
      min: 0
    },

    expiresAt: {
      type: Date,
      validate: {
        validator: function (v) {
          if (!v) return true; // Allow null for non-expiring keys
          return v > new Date();
        },
        message: 'Expiration date must be in the future'
      }
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'revoked', 'expired'],
      default: 'active',
      required: true,
      index: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    revokedAt: {
      type: Date,
      default: null
    },

    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    revokedReason: {
      type: String,
      default: null
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    ipWhitelist: {
      type: [String], // CIDR notation or specific IPs
      default: []
    },

    description: {
      type: String,
      maxlength: 500,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient querying
apiKeySchema.index({ createdBy: 1, createdAt: -1 });
apiKeySchema.index({ status: 1, expiresAt: 1 });
apiKeySchema.index({ lastUsed: -1 });
apiKeySchema.index({ scope: 1 });
apiKeySchema.compound_index = { name: 1, createdBy: 1 };

// Auto-expire keys that have passed their expiration date
apiKeySchema.pre('find', function () {
  this.where({
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });
});

/**
 * Static method to generate a new API key
 * @param {Object} data - Key configuration
 * @returns {Object} - { key: plaintext, keyDocument: saved document }
 */
apiKeySchema.statics.generateKey = async function (data) {
  const plainKey = `appforge_${generateToken(24)}`;
  const keyHash = hash(plainKey);

  const apiKey = new this({
    name: data.name,
    key: plainKey,
    keyHash,
    scope: data.scope || ['read'],
    rateLimit: data.rateLimit || 1000,
    rateLimitUnit: data.rateLimitUnit || 'hour',
    expiresAt: data.expiresAt,
    createdBy: data.createdBy,
    metadata: data.metadata,
    ipWhitelist: data.ipWhitelist,
    description: data.description
  });

  await apiKey.save();

  return {
    key: plainKey, // Only return once, never stored in plain text
    keyDocument: apiKey
  };
};

/**
 * Static method to validate an API key
 * @param {string} plainKey - Plain text API key to validate
 * @param {Object} options - Query options
 * @returns {Object} - API key document if valid
 */
apiKeySchema.statics.validateKey = async function (plainKey, options = {}) {
  const keyHash = hash(plainKey);

  const apiKey = await this.findOne({
    keyHash,
    status: 'active',
    ...(options.createdBy && { createdBy: options.createdBy })
  });

  if (!apiKey) {
    return null;
  }

  // Check expiration
  if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
    await this.updateOne(
      { _id: apiKey._id },
      { status: 'expired' }
    );
    return null;
  }

  // Check IP whitelist if configured
  if (options.ipAddress && apiKey.ipWhitelist.length > 0) {
    const isAllowed = apiKey.ipWhitelist.some(ip => {
      if (ip === '*') return true;
      if (ip === options.ipAddress) return true;
      // Simple CIDR check could be added here
      return false;
    });

    if (!isAllowed) {
      return null;
    }
  }

  // Update usage
  apiKey.lastUsed = new Date();
  apiKey.usageCount = (apiKey.usageCount || 0) + 1;
  await apiKey.save();

  return apiKey;
};

/**
 * Instance method to revoke the key
 * @param {string} revokedBy - User ID revoking the key
 * @param {string} reason - Reason for revocation
 */
apiKeySchema.methods.revoke = async function (revokedBy, reason = '') {
  this.status = 'revoked';
  this.revokedAt = new Date();
  this.revokedBy = revokedBy;
  this.revokedReason = reason;
  return this.save();
};

/**
 * Instance method to check if key has scope
 * @param {string} requiredScope - Scope to check
 * @returns {boolean}
 */
apiKeySchema.methods.hasScope = function (requiredScope) {
  if (!Array.isArray(this.scope)) return false;
  return this.scope.includes(requiredScope) || this.scope.includes('admin');
};

/**
 * Instance method to check if key is valid
 * @returns {boolean}
 */
apiKeySchema.methods.isValid = function () {
  if (this.status !== 'active') return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  return true;
};

/**
 * Instance method to get rate limit info
 * @returns {Object}
 */
apiKeySchema.methods.getRateLimitInfo = function () {
  return {
    limit: this.rateLimit,
    unit: this.rateLimitUnit,
    resetWindow: this.getRateLimitResetWindow()
  };
};

/**
 * Instance method to calculate rate limit reset window
 * @returns {Date}
 */
apiKeySchema.methods.getRateLimitResetWindow = function () {
  const now = new Date();
  const unit = this.rateLimitUnit;

  switch (unit) {
    case 'minute':
      return new Date(now.getTime() + 60000);
    case 'hour':
      return new Date(now.getTime() + 3600000);
    case 'day':
      return new Date(now.getTime() + 86400000);
    default:
      return new Date(now.getTime() + 3600000);
  }
};

/**
 * Static method to get all keys for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Array}
 */
apiKeySchema.statics.getByUser = async function (userId, options = {}) {
  const query = { createdBy: userId };

  if (options.status) {
    query.status = options.status;
  }

  if (options.active) {
    query.status = 'active';
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 100);
};

/**
 * Static method to cleanup expired keys
 * @returns {Object} - Cleanup result
 */
apiKeySchema.statics.cleanupExpired = async function () {
  const result = await this.updateMany(
    {
      status: 'active',
      expiresAt: { $lt: new Date() }
    },
    {
      status: 'expired'
    }
  );

  return result;
};

const APIKey = mongoose.model('APIKey', apiKeySchema);

export default APIKey;
