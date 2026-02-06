/**
 * Bot Model
 * Autonomous chatbot configuration and settings
 */

import mongoose from 'mongoose';

const BotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    maxlength: 500,
  },

  // Personality & Behavior
  personality: {
    systemPrompt: {
      type: String,
      default: 'You are a helpful AI assistant. Provide accurate, concise, and friendly responses.',
      maxlength: 2000,
    },
    tone: {
      type: String,
      enum: ['professional', 'friendly', 'casual', 'technical', 'empathetic'],
      default: 'friendly'
    },
    style: {
      type: String,
      enum: ['concise', 'detailed', 'conversational', 'instructional'],
      default: 'conversational'
    },
    language: {
      type: String,
      default: 'en'
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2,
    },
    maxResponseLength: {
      type: Number,
      default: 2000,
      min: 100,
      max: 4000,
    },
  },

  // Knowledge Base
  knowledge: {
    sources: [{
      type: String,
      url: String,
      fileId: String,
      lastUpdated: Date,
    }],
    entities: [{ type: String }], // Base44 entity references
    customData: mongoose.Schema.Types.Mixed,
    vectorStoreId: String, // For RAG implementation
  },

  // LLM Configuration
  llm: {
    model: {
      type: String,
      default: 'quantum',
      enum: ['quantum', 'chatgpt', 'gpt-4', 'claude', 'gemini', 'grok', 'base44'],
    },
    forceEnsemble: {
      type: Boolean,
      default: true
    },
    taskType: {
      type: String,
      default: 'conversational',
      enum: ['conversational', 'code', 'reasoning', 'creative', 'analysis'],
    },
  },

  // Workflow Configuration
  workflow: {
    nodes: [{
      id: String,
      type: String, // action, condition, loop, api_call, etc.
      name: String,
      config: mongoose.Schema.Types.Mixed,
      position: {
        x: Number,
        y: Number,
      },
    }],
    triggers: [{
      type: {
        type: String,
        enum: ['schedule', 'webhook', 'user_message', 'event', 'manual']
      },
      config: mongoose.Schema.Types.Mixed,
      isActive: { type: Boolean, default: true },
    }],
    autonomousTriggerPrompt: {
      type: String,
      default: 'Execute scheduled task and provide status update',
    },
  },

  // Channel Deployment
  channels: [{
    type: {
      type: String,
      enum: ['whatsapp', 'email', 'web', 'api', 'slack', 'telegram']
    },
    config: mongoose.Schema.Types.Mixed,
    isActive: { type: Boolean, default: false },
    deployedAt: Date,
    endpointUrl: String,
  }],

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },

  // Autonomous Settings
  autonomous: {
    enabled: {
      type: Boolean,
      default: false
    },
    schedule: String, // Cron expression (e.g., "0 */4 * * *")
    maxExecutionsPerDay: {
      type: Number,
      default: 100,
      min: 1,
      max: 1000,
    },
    executionCount: {
      type: Number,
      default: 0
    },
    lastExecutionAt: Date,
    nextExecutionAt: Date,
  },

  // Learning Configuration
  learning: {
    enabled: { type: Boolean, default: true },
    feedbackThreshold: { type: Number, default: 0.7 }, // Min score to consider positive
    adaptSystemPrompt: { type: Boolean, default: true },
    improveResponses: { type: Boolean, default: true },
  },

  // Metrics & Analytics
  metrics: {
    totalExecutions: { type: Number, default: 0 },
    successfulExecutions: { type: Number, default: 0 },
    failedExecutions: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 },
    averageCoherence: { type: Number, default: 0 },
    averageConfidence: { type: Number, default: 0 },
    userSatisfactionScore: { type: Number, default: 0 },
    totalFeedbackCount: { type: Number, default: 0 },
    positiveFeedbackCount: { type: Number, default: 0 },
  },

  // Ownership
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastActivityAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for efficient queries
BotSchema.index({ userId: 1, createdAt: -1 });
BotSchema.index({ 'autonomous.schedule': 1, 'autonomous.enabled': 1 });
BotSchema.index({ isActive: 1, isPublished: 1 });
BotSchema.index({ 'channels.type': 1, 'channels.isActive': 1 });

// Update timestamps before save
BotSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for execution success rate
BotSchema.virtual('successRate').get(function() {
  if (this.metrics.totalExecutions === 0) return 0;
  return (this.metrics.successfulExecutions / this.metrics.totalExecutions) * 100;
});

// Virtual for satisfaction rate
BotSchema.virtual('satisfactionRate').get(function() {
  if (this.metrics.totalFeedbackCount === 0) return 0;
  return (this.metrics.positiveFeedbackCount / this.metrics.totalFeedbackCount) * 100;
});

export default mongoose.model('Bot', BotSchema);
