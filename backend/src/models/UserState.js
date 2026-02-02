import mongoose from 'mongoose';

/**
 * UserState
 * Stores persisted user application state for multi-device sync.
 */
const userStateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    state: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    version: {
      type: Number,
      default: 1
    },
    checksum: {
      type: String
    },
    deviceId: {
      type: String
    },
    platform: {
      type: String
    },
    appVersion: {
      type: String
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now
    },
    dirtySince: {
      type: Date
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

// indexes for efficient lookups
userStateSchema.index({ userId: 1, updatedAt: -1 });
userStateSchema.index({ userId: 1, deviceId: 1 });

const UserState = mongoose.model('UserState', userStateSchema);

export default UserState;
