/**
 * Admin Configuration Model
 * Stores API keys and admin configurations
 */

import mongoose from 'mongoose';
import { encrypt, decrypt } from '../utils/encryption.js';

const adminConfigurationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  configurations: [
    {
      id: String,
      name: String,
      provider: {
        type: String,
        enum: ['openai', 'anthropic', 'google', 'huggingface', 'stripe', 'github', 'aws', 'custom'],
        required: true
      },
      apiKey: String, // Should be encrypted
      apiSecret: String, // Should be encrypted
      baseUrl: String,
      config: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
      },
      active: {
        type: Boolean,
        default: true
      },
      lastTested: Date,
      testStatus: String,
      createdAt: Date,
      updatedAt: Date
    }
  ],

  // Global settings
  settings: {
    encryptionEnabled: {
      type: Boolean,
      default: true
    },
    auditLogging: {
      type: Boolean,
      default: true
    },
    ipWhitelist: [String],
    rateLimit: {
      enabled: { type: Boolean, default: false },
      requestsPerMinute: { type: Number, default: 100 }
    }
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  lastModifiedBy: String
});

// Update the updatedAt field before saving
adminConfigurationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Encrypt sensitive fields
  if (this.settings?.encryptionEnabled !== false) {
    this.configurations.forEach((config) => {
      if (config.apiKey && !config.apiKey.includes(':')) {
        config.apiKey = encrypt(config.apiKey);
      }
      if (config.apiSecret && !config.apiSecret.includes(':')) {
        config.apiSecret = encrypt(config.apiSecret);
      }
    });
  }
  
  next();
});

// Decrypt sensitive fields after finding
adminConfigurationSchema.post('find', function(docs) {
  if (Array.isArray(docs)) {
    docs.forEach(doc => decryptDoc(doc));
  }
});

adminConfigurationSchema.post('findOne', function(doc) {
  if (doc) decryptDoc(doc);
});

function decryptDoc(doc) {
  if (doc?.configurations) {
    doc.configurations.forEach((config) => {
      if (config.apiKey && config.apiKey.includes(':')) {
        try {
          config.apiKey = decrypt(config.apiKey);
        } catch (error) {
          console.warn('Failed to decrypt apiKey:', error.message);
        }
      }
      if (config.apiSecret && config.apiSecret.includes(':')) {
        try {
          config.apiSecret = decrypt(config.apiSecret);
        } catch (error) {
          console.warn('Failed to decrypt apiSecret:', error.message);
        }
      }
    });
  }
}

export default mongoose.model('AdminConfiguration', adminConfigurationSchema);
