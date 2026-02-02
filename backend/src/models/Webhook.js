/**
 * Webhook Model - Persistent webhook storage
 */

const mongoose = require('mongoose');

const webhookSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    trim: true,
  },
  events: [{
    type: String,
    required: true,
  }],
  secret: {
    type: String,
    required: false,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  tenantId: {
    type: String,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  lastTriggeredAt: {
    type: Date,
  },
  deliveryCount: {
    type: Number,
    default: 0,
  },
  failureCount: {
    type: Number,
    default: 0,
  },
  lastError: {
    type: String,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

// Compound index for efficient event lookups
webhookSchema.index({ events: 1, isActive: 1 });
webhookSchema.index({ userId: 1, isActive: 1 });

const Webhook = mongoose.model('Webhook', webhookSchema);

module.exports = Webhook;
