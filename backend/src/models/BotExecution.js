/**
 * Bot Execution Model
 * Tracks individual bot workflow executions
 */

import mongoose from 'mongoose';

const BotExecutionSchema = new mongoose.Schema({
  botId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bot',
    required: true,
    index: true,
  },
  executionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  // Trigger Information
  trigger: {
    type: {
      type: String,
      enum: ['manual', 'schedule', 'webhook', 'user_message', 'event', 'api'],
      required: true,
    },
    source: String, // Channel source (web, whatsapp, etc.)
    userId: mongoose.Schema.Types.ObjectId,
    data: mongoose.Schema.Types.Mixed,
  },

  // User Input
  input: {
    message: String,
    attachments: [String],
    metadata: mongoose.Schema.Types.Mixed,
  },

  // Execution Status
  status: {
    type: String,
    enum: ['queued', 'running', 'completed', 'failed', 'cancelled', 'timeout'],
    default: 'queued',
    index: true,
  },

  // Workflow Execution Details
  workflow: {
    nodesExecuted: { type: Number, default: 0 },
    nodesSucceeded: { type: Number, default: 0 },
    nodesFailed: { type: Number, default: 0 },
    logs: [{
      nodeId: String,
      nodeName: String,
      timestamp: Date,
      status: String,
      message: String,
      data: mongoose.Schema.Types.Mixed,
    }],
    results: [mongoose.Schema.Types.Mixed],
  },

  // LLM Response Details
  llm: {
    model: String,
    provider: String,

    // Quantum Metrics
    quantumMetrics: {
      ensemble: Boolean,
      providers: [String],
      coherence: Number,
      entropy: Number,
      confidence: Number,
      hallucinationRisk: String,
    },

    // Token Usage
    tokenUsage: {
      prompt: { type: Number, default: 0 },
      completion: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },

    // Cost
    cost: { type: Number, default: 0 },
  },

  // Bot Response
  response: {
    text: String,
    formatted: String, // HTML or Markdown formatted
    attachments: [String],
    actions: [mongoose.Schema.Types.Mixed], // Suggested actions
  },

  // Timing Information
  timing: {
    queuedAt: { type: Date, default: Date.now },
    startedAt: Date,
    completedAt: Date,
    durationMs: Number,
    llmResponseTime: Number,
  },

  // Error Information
  error: {
    message: String,
    stack: String,
    code: String,
    nodeId: String, // Which node failed
  },

  // User Feedback
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    helpful: Boolean,
    submittedAt: Date,
  },

  // Context for learning
  context: {
    conversationId: String,
    previousExecutions: [String], // Related execution IDs
    sessionData: mongoose.Schema.Types.Mixed,
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Compound indexes for common queries
BotExecutionSchema.index({ botId: 1, createdAt: -1 });
BotExecutionSchema.index({ botId: 1, status: 1 });
BotExecutionSchema.index({ 'trigger.userId': 1, createdAt: -1 });
BotExecutionSchema.index({ executionId: 1 });

// Update duration when completed
BotExecutionSchema.pre('save', function(next) {
  if (this.timing.startedAt && this.timing.completedAt) {
    this.timing.durationMs = this.timing.completedAt - this.timing.startedAt;
  }
  next();
});

export default mongoose.model('BotExecution', BotExecutionSchema);
