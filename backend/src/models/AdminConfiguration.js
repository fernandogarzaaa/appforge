/**
 * Admin Configuration Model
 * Stores API keys and admin configurations
 */

import mongoose from 'mongoose';

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
  next();
});

export default mongoose.model('AdminConfiguration', adminConfigurationSchema);
