/**
 * Bot Feedback Model
 * Stores user feedback for continuous learning
 */

import mongoose from 'mongoose';

const BotFeedbackSchema = new mongoose.Schema({
  botId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bot',
    required: true,
    index: true,
  },
  executionId: {
    type: String,
    required: true,
    index: true,
  },

  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  userEmail: String,
  sessionId: String,

  // Feedback Details
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  helpful: {
    type: Boolean,
    default: null,
  },
  comment: {
    type: String,
    maxlength: 1000,
  },

  // Specific Feedback Categories
  categories: {
    accuracy: { type: Number, min: 1, max: 5 },
    helpfulness: { type: Number, min: 1, max: 5 },
    clarity: { type: Number, min: 1, max: 5 },
    speed: { type: Number, min: 1, max: 5 },
    tone: { type: Number, min: 1, max: 5 },
  },

  // Issue Tags
  issues: [{
    type: String,
    enum: [
      'incorrect_info',
      'not_helpful',
      'too_long',
      'too_short',
      'wrong_tone',
      'hallucination',
      'missing_context',
      'technical_error',
      'other'
    ],
  }],

  // Context (for learning)
  context: {
    prompt: String,
    response: String,
    quantumMetrics: mongoose.Schema.Types.Mixed,
    channel: String,
  },

  // Learning Actions Taken
  learningActions: [{
    action: {
      type: String,
      enum: ['adjust_prompt', 'update_knowledge', 'retrain_model', 'flag_review'],
    },
    appliedAt: Date,
    result: String,
  }],

  // Status
  isProcessed: {
    type: Boolean,
    default: false
  },
  isReviewed: {
    type: Boolean,
    default: false
  },
  reviewedBy: mongoose.Schema.Types.ObjectId,
  reviewedAt: Date,

  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Compound indexes
BotFeedbackSchema.index({ botId: 1, createdAt: -1 });
BotFeedbackSchema.index({ botId: 1, rating: 1 });
BotFeedbackSchema.index({ executionId: 1 });
BotFeedbackSchema.index({ isProcessed: 1, createdAt: 1 });

export default mongoose.model('BotFeedback', BotFeedbackSchema);
