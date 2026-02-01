/**
 * Team Workflows Model
 * Stores team automation workflows, webhooks, and integrations
 */

import mongoose from 'mongoose';

const teamWorkflowsSchema = new mongoose.Schema({
  teamId: {
    type: String,
    required: true,
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
  next();
});

export default mongoose.model('TeamWorkflows', teamWorkflowsSchema);
