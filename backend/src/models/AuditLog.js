import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    resourceType: {
      type: String,
      required: true,
      enum: [
        'user',
        'team',
        'project',
        'permission',
        'deployment',
        'apiKey',
        'environment',
        'quantum',
        'collaboration',
        'system'
      ]
    },
    resourceId: {
      type: String,
      index: true
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    status: {
      type: String,
      enum: ['success', 'failure', 'warning'],
      default: 'success'
    },
    errorMessage: {
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

// Indexes for efficient querying
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

// TTL index - automatically delete logs older than 90 days
auditLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

// Static methods
auditLogSchema.statics.logAction = async function (data) {
  try {
    return await this.create(data);
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should never break the main flow
    return null;
  }
};

auditLogSchema.statics.getUserActivity = async function (userId, limit = 50) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

auditLogSchema.statics.getResourceHistory = async function (resourceType, resourceId, limit = 50) {
  return this.find({ resourceType, resourceId })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

auditLogSchema.statics.getActionsByType = async function (action, startDate, endDate) {
  const query = { action };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  return this.find(query)
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
