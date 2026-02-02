import mongoose from 'mongoose';

/**
 * SyncLog
 * Tracks synchronization operations for conflict resolution and auditing.
 */
const syncLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    entityType: {
      type: String,
      required: true,
      index: true
    },
    entityId: {
      type: String,
      required: true,
      index: true
    },
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'conflict', 'resolve'],
      required: true,
      index: true
    },
    direction: {
      type: String,
      enum: ['push', 'pull'],
      default: 'push'
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      default: 'success'
    },
    version: {
      type: Number,
      default: 1
    },
    diff: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    error: {
      type: String
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

syncLogSchema.index({ userId: 1, entityType: 1, entityId: 1, createdAt: -1 });
syncLogSchema.index({ action: 1, createdAt: -1 });
syncLogSchema.index({ status: 1, createdAt: -1 });

const SyncLog = mongoose.model('SyncLog', syncLogSchema);

export default SyncLog;
