/**
 * Secret Model
 * Manages encrypted secrets (API keys, credentials, tokens) for applications
 * Values are encrypted at rest using AES-256-GCM
 */

import mongoose from 'mongoose';
import { encrypt, decrypt, isEncrypted, hash } from '../utils/encryption.js';

const secretSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 255,
      index: true,
      validate: {
        validator: function (v) {
          // Allow standard secret key format (alphanumeric, underscore, hyphen)
          return /^[a-zA-Z0-9_-]+$/.test(v);
        },
        message: 'Secret key must contain only alphanumeric characters, hyphens, and underscores'
      }
    },

    value: {
      type: String,
      required: true,
      // Encryption happens in pre-save hook
      minlength: 1,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'Secret value cannot be empty'
      }
    },

    valueHash: {
      type: String,
      required: true,
      // Hash is used for comparison without decryption
      select: false
    },

    category: {
      type: String,
      enum: [
        'api-key',
        'database',
        'auth-token',
        'webhook-secret',
        'encryption-key',
        'payment',
        'email',
        'storage',
        'external-service',
        'custom'
      ],
      default: 'custom',
      required: true,
      index: true
    },

    isEncrypted: {
      type: Boolean,
      default: true,
      required: true
    },

    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'production',
      required: true,
      index: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    lastModifiedAt: {
      type: Date,
      default: null
    },

    previousValues: {
      type: [
        {
          value: String, // Encrypted value
          valueHash: String,
          modifiedBy: mongoose.Schema.Types.ObjectId,
          modifiedAt: Date,
          reason: String
        }
      ],
      default: [],
      select: false // Don't return history by default
    },

    rotationSchedule: {
      type: String,
      enum: ['never', 'weekly', 'monthly', 'quarterly', 'yearly'],
      default: 'never'
    },

    lastRotatedAt: {
      type: Date,
      default: null
    },

    nextRotationDue: {
      type: Date,
      default: null
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      validate: {
        validator: function (v) {
          // Ensure metadata is an object
          return typeof v === 'object' && !Array.isArray(v);
        },
        message: 'Metadata must be an object'
      }
    },

    tags: {
      type: [String],
      default: [],
      index: true
    },

    externalReference: {
      type: String,
      default: null // URL or identifier of where this secret comes from
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    accessLog: {
      type: [
        {
          accessedBy: mongoose.Schema.Types.ObjectId,
          accessedAt: Date,
          ipAddress: String,
          purpose: String
        }
      ],
      default: [],
      select: false
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for secret lookup by key and environment
secretSchema.index({ key: 1, environment: 1, owner: 1 }, { unique: true });
secretSchema.index({ createdBy: 1, createdAt: -1 });
secretSchema.index({ category: 1, environment: 1 });
secretSchema.index({ lastModifiedAt: -1 });
secretSchema.index({ isActive: 1, nextRotationDue: 1 });

/**
 * Pre-save hook to encrypt value and hash it
 */
secretSchema.pre('save', function (next) {
  // Only process if value has changed
  if (this.isModified('value')) {
    try {
      // Encrypt the value
      if (!isEncrypted(this.value)) {
        this.value = encrypt(this.value);
        this.isEncrypted = true;
      }

      // Always create a hash for comparison
      const plainValue = decrypt(this.value);
      this.valueHash = hash(plainValue);
    } catch (error) {
      return next(new Error(`Encryption failed: ${error.message}`));
    }
  }

  next();
});

/**
 * Pre-save hook to handle secret rotation history
 */
secretSchema.pre('save', function (next) {
  // If secret already exists and value is changing, save to history
  if (!this.isNew && this.isModified('value') && this.previousValues) {
    try {
      const oldValue = this.get('value');
      const oldHash = this.get('valueHash');

      this.previousValues.push({
        value: oldValue,
        valueHash: oldHash,
        modifiedBy: this.lastModifiedBy || this.createdBy,
        modifiedAt: new Date(),
        reason: this.get('_rotationReason') || 'Manual update'
      });

      // Keep only last 10 versions to prevent unbounded growth
      if (this.previousValues.length > 10) {
        this.previousValues = this.previousValues.slice(-10);
      }

      delete this._rotationReason;
    } catch (error) {
      return next(new Error(`History tracking failed: ${error.message}`));
    }
  }

  next();
});

/**
 * Instance method to get decrypted value
 * @param {string} userId - User accessing the secret (for audit)
 * @param {string} ipAddress - IP address of accessor
 * @returns {string}
 */
secretSchema.methods.getDecryptedValue = function (userId, ipAddress = null) {
  try {
    // Log access
    if (userId) {
      this.accessLog = this.accessLog || [];
      this.accessLog.push({
        accessedBy: userId,
        accessedAt: new Date(),
        ipAddress
      });
    }

    return decrypt(this.value);
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
};

/**
 * Instance method to update secret value
 * @param {string} newValue - New secret value
 * @param {string} modifiedBy - User modifying the secret
 * @param {string} reason - Reason for update
 */
secretSchema.methods.updateValue = async function (
  newValue,
  modifiedBy,
  reason = 'Manual update'
) {
  this._rotationReason = reason;
  this.value = newValue;
  this.lastModifiedBy = modifiedBy;
  this.lastModifiedAt = new Date();

  // Update rotation tracking if this is a scheduled rotation
  if (reason === 'Scheduled rotation') {
    this.lastRotatedAt = new Date();
    this.nextRotationDue = this.calculateNextRotationDue();
  }

  return this.save();
};

/**
 * Instance method to calculate next rotation due date
 * @returns {Date|null}
 */
secretSchema.methods.calculateNextRotationDue = function () {
  if (!this.rotationSchedule || this.rotationSchedule === 'never') {
    return null;
  }

  const now = new Date();
  const baseDate = this.lastRotatedAt || this.createdAt;

  switch (this.rotationSchedule) {
    case 'weekly':
      return new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    case 'quarterly':
      return new Date(baseDate.getTime() + 90 * 24 * 60 * 60 * 1000);
    case 'yearly':
      return new Date(baseDate.getTime() + 365 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
};

/**
 * Instance method to verify secret value (without decryption)
 * @param {string} plainValue - Plain text value to verify
 * @returns {boolean}
 */
secretSchema.methods.verifyValue = function (plainValue) {
  const incomingHash = hash(plainValue);
  return incomingHash === this.valueHash;
};

/**
 * Static method to get a secret by key
 * @param {string} key - Secret key
 * @param {Object} options - Query options
 * @returns {Object}
 */
secretSchema.statics.getByKey = async function (key, options = {}) {
  const query = {
    key,
    isActive: true,
    ...(options.environment && { environment: options.environment }),
    ...(options.owner && { owner: options.owner })
  };

  return this.findOne(query);
};

/**
 * Static method to get secrets by category
 * @param {string} category - Category filter
 * @param {Object} options - Query options
 * @returns {Array}
 */
secretSchema.statics.getByCategory = async function (category, options = {}) {
  const query = {
    category,
    isActive: true,
    ...(options.environment && { environment: options.environment }),
    ...(options.owner && { owner: options.owner })
  };

  return this.find(query)
    .select('-value -valueHash -previousValues -accessLog')
    .sort({ createdAt: -1 });
};

/**
 * Static method to get all secrets for an owner
 * @param {string} ownerId - Owner (team/user) ID
 * @param {Object} options - Query options
 * @returns {Array}
 */
secretSchema.statics.getByOwner = async function (ownerId, options = {}) {
  const query = {
    owner: ownerId,
    isActive: true,
    ...(options.environment && { environment: options.environment })
  };

  return this.find(query)
    .select('-value -valueHash -previousValues -accessLog')
    .sort({ category: 1, key: 1 });
};

/**
 * Static method to deactivate a secret
 * @param {string} secretId - Secret ID
 * @param {string} deactivatedBy - User deactivating
 */
secretSchema.statics.deactivate = async function (secretId, deactivatedBy) {
  return this.findByIdAndUpdate(
    secretId,
    {
      isActive: false,
      lastModifiedBy: deactivatedBy,
      lastModifiedAt: new Date()
    },
    { new: true }
  );
};

/**
 * Static method to find secrets due for rotation
 * @returns {Array}
 */
secretSchema.statics.getDueForRotation = async function () {
  return this.find({
    rotationSchedule: { $ne: 'never' },
    isActive: true,
    nextRotationDue: { $lt: new Date() }
  });
};

/**
 * Static method to search secrets by tags
 * @param {Array<string>} tags - Tags to search
 * @param {Object} options - Query options
 * @returns {Array}
 */
secretSchema.statics.searchByTags = async function (tags, options = {}) {
  const query = {
    tags: { $in: tags },
    isActive: true,
    ...(options.owner && { owner: options.owner })
  };

  return this.find(query)
    .select('-value -valueHash -previousValues -accessLog')
    .sort({ createdAt: -1 });
};

/**
 * Static method to clone a secret
 * @param {string} secretId - Secret ID to clone
 * @param {string} newKey - New secret key
 * @param {string} clonedBy - User cloning
 * @returns {Object}
 */
secretSchema.statics.cloneSecret = async function (secretId, newKey, clonedBy) {
  const original = await this.findById(secretId);

  if (!original) {
    throw new Error('Original secret not found');
  }

  const cloned = new this({
    key: newKey,
    value: original.value, // Will be re-encrypted by pre-save hook
    category: original.category,
    environment: original.environment,
    rotationSchedule: original.rotationSchedule,
    metadata: { ...original.metadata, clonedFrom: original._id },
    tags: original.tags,
    createdBy: clonedBy,
    owner: original.owner
  });

  return cloned.save();
};

const Secret = mongoose.model('Secret', secretSchema);

export default Secret;
