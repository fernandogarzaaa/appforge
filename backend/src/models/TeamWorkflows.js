/**
 * Team Workflows Model
 * Stores team automation workflows, webhooks, and integrations
 */

import mongoose from 'mongoose';
import { encrypt, decrypt } from '../utils/encryption.js';

const teamWorkflowsSchema = new mongoose.Schema({
  teamId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  workflows: [
    {
      id: String,
      name: String,
      description: String,
      enabled: {
        type: Boolean,
        default: true
      },
      trigger: String,
      actions: [String],
      createdAt: Date,
      updatedAt: Date
    }
  ],

  webhooks: [
    {
      id: String,
      url: String,
      event: String,
      active: {
        type: Boolean,
        default: true
      },
      secret: String,
      createdAt: Date,
      lastTriggered: Date
    }
  ],

  automations: [
    {
      id: String,
      name: String,
      description: String,
      enabled: {
        type: Boolean,
        default: true
      },
      schedule: String,
      lastRun: Date,
      createdAt: Date
    }
  ],

  integrations: [
    {
      id: String,
      provider: String,
      name: String,
      apiKey: String, // Should be encrypted
      config: mongoose.Schema.Types.Mixed,
      active: {
        type: Boolean,
        default: true
      },
      createdAt: Date
    }
  ],

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Update the updatedAt field before saving
teamWorkflowsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Encrypt sensitive fields
  this.webhooks.forEach((webhook) => {
    if (webhook.secret && !webhook.secret.includes(':')) {
      webhook.secret = encrypt(webhook.secret);
    }
  });
  
  this.integrations.forEach((integration) => {
    if (integration.apiKey && !integration.apiKey.includes(':')) {
      integration.apiKey = encrypt(integration.apiKey);
    }
  });
  
  next();
});

// Decrypt sensitive fields after finding
teamWorkflowsSchema.post('find', function(docs) {
  if (Array.isArray(docs)) {
    docs.forEach(doc => decryptDoc(doc));
  }
});

teamWorkflowsSchema.post('findOne', function(doc) {
  if (doc) decryptDoc(doc);
});

function decryptDoc(doc) {
  if (doc?.webhooks) {
    doc.webhooks.forEach((webhook) => {
      if (webhook.secret && webhook.secret.includes(':')) {
        try {
          webhook.secret = decrypt(webhook.secret);
        } catch (error) {
          console.warn('Failed to decrypt webhook secret:', error.message);
        }
      }
    });
  }
  
  if (doc?.integrations) {
    doc.integrations.forEach((integration) => {
      if (integration.apiKey && integration.apiKey.includes(':')) {
        try {
          integration.apiKey = decrypt(integration.apiKey);
        } catch (error) {
          console.warn('Failed to decrypt integration apiKey:', error.message);
        }
      }
    });
  }
}

export default mongoose.model('TeamWorkflows', teamWorkflowsSchema);
