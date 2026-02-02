import mongoose from 'mongoose';

/**
 * Analytics
 * Captures product analytics events with flexible properties payload.
 */
const analyticsSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    sessionId: {
      type: String,
      index: true
    },
    properties: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    durationMs: {
      type: Number
    },
    success: {
      type: Boolean,
      default: true
    },
    source: {
      type: String
    },
    context: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

analyticsSchema.index({ event: 1, createdAt: -1 });
analyticsSchema.index({ userId: 1, createdAt: -1 });
analyticsSchema.index({ sessionId: 1, createdAt: -1 });

const Analytics = mongoose.model('Analytics', analyticsSchema);

export default Analytics;
