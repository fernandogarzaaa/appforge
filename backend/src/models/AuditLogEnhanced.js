/**
 * AuditLogEnhanced Model
 * Comprehensive audit logging for compliance, security, and debugging
 * Tracks all system actions with full context and traceability
 */

import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
      trim: true,
      enum: [
        'create',
        'read',
        'update',
        'delete',
        'login',
        'logout',
        'auth-failure',
        'permission-change',
        'secret-access',
        'secret-create',
        'secret-update',
        'secret-delete',
        'key-generate',
        'key-revoke',
        'deployment',
        'build',
        'export',
        'import',
        'sync',
        'subscribe',
        'unsubscribe',
        'payment',
        'admin-action'
      ]
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true
    },

    userId: {
      // Store user ID as string for non-user actions
      type: String,
      default: null,
      index: true
    },

    entity: {
      type: String,
      required: true,
      enum: [
        'user',
        'team',
        'project',
        'workflow',
        'deployment',
        'apikey',
        'secret',
        'permission',
        'environment',
        'integration',
        'webhook',
        'payment',
        'analytics',
        'quantum',
        'system',
        'audit'
      ],
      index: true
    },

    entityId: {
      type: String,
      required: false,
      index: true
    },

    entityName: {
      type: String,
      required: false,
      // Human-readable name of what was affected
      trim: true,
      maxlength: 500
    },

    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
      required: true
    },

    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
      // Can contain:
      // - changes: { field: { old: value, new: value } }
      // - reason: 'why this happened'
      // - metadata: additional context
    },

    ipAddress: {
      type: String,
      required: false,
      index: true
      // IPv4 or IPv6 address
    },

    userAgent: {
      type: String,
      required: false,
      maxlength: 2000
      // Browser/client information
    },

    status: {
      type: String,
      enum: ['success', 'failure', 'warning', 'pending'],
      default: 'success',
      required: true,
      index: true
    },

    // NEW ENHANCED FIELDS
    errorMessage: {
      type: String,
      default: null,
      maxlength: 1000
    },

    errorCode: {
      type: String,
      default: null
      // Error code for programmatic handling
    },

    duration: {
      type: Number,
      default: 0
      // Execution duration in milliseconds
    },

    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
      index: true
    },

    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: null
      // { fieldName: { before: value, after: value } }
    },

    affectedEntities: {
      type: [
        {
          type: String,
          entity: String,
          entityId: String
        }
      ],
      default: []
      // Track cascading changes
    },

    tags: {
      type: [String],
      default: [],
      index: true
      // e.g., ['security', 'compliance', 'performance']
    },

    source: {
      type: String,
      enum: ['api', 'web', 'cli', 'webhook', 'system', 'scheduled'],
      default: 'api',
      index: true
    },

    requestId: {
      type: String,
      default: null,
      index: true
      // Correlate with request logs
    },

    sessionId: {
      type: String,
      default: null,
      index: true
      // User session identifier
    },

    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
      index: true
    },

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true
    },

    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'production',
      index: true
    },

    region: {
      type: String,
      default: null
      // Geographic region of the action
    },

    relatedLogs: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
      ref: 'AuditLog'
      // Link related audit log entries
    },

    complianceFlags: {
      type: [String],
      default: [],
      enum: [
        'gdpr',
        'hipaa',
        'pci-dss',
        'soc2',
        'iso27001',
        'pii-involved'
      ]
    },

    retentionDays: {
      type: Number,
      default: 90
      // How long to keep this log
    }
  },
  {
    timestamps: true
    // createdAt and updatedAt automatically added
  }
);

// INDEXES FOR EFFICIENT QUERYING
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, status: 1, createdAt: -1 });
auditLogSchema.index({ team: 1, createdAt: -1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ ipAddress: 1, timestamp: -1 });
auditLogSchema.index({ sessionId: 1, timestamp: -1 });
auditLogSchema.index({ status: 1, severity: 1, timestamp: -1 });
auditLogSchema.index({ tags: 1, timestamp: -1 });
auditLogSchema.index({ source: 1, environment: 1, timestamp: -1 });
auditLogSchema.index({ requestId: 1 });
auditLogSchema.index({ environment: 1, createdAt: -1 });

// TTL Index - automatically delete logs based on retentionDays
auditLogSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 90 * 24 * 60 * 60, // 90 days default
    partialFilterExpression: { retentionDays: { $gte: 90 } }
  }
);

// TEXT INDEX for searching
auditLogSchema.index({
  entityName: 'text',
  action: 'text',
  'details.reason': 'text'
});

/**
 * Static method to log an action
 * @param {Object} data - Audit log data
 * @returns {Object}
 */
auditLogSchema.statics.logAction = async function (data) {
  try {
    const auditLog = new this({
      action: data.action,
      user: data.user,
      userId: data.userId,
      entity: data.entity,
      entityId: data.entityId,
      entityName: data.entityName,
      timestamp: new Date(),
      details: data.details || {},
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      status: data.status || 'success',
      errorMessage: data.errorMessage,
      errorCode: data.errorCode,
      duration: data.duration || 0,
      severity: data.severity || 'info',
      changes: data.changes,
      affectedEntities: data.affectedEntities || [],
      tags: data.tags || [],
      source: data.source || 'api',
      requestId: data.requestId,
      sessionId: data.sessionId,
      team: data.team,
      organization: data.organization,
      environment: data.environment || 'production',
      region: data.region,
      relatedLogs: data.relatedLogs || [],
      complianceFlags: data.complianceFlags || [],
      retentionDays: data.retentionDays || 90
    });

    return await auditLog.save();
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return null;
  }
};

/**
 * Static method to get user activity
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Array}
 */
auditLogSchema.statics.getUserActivity = async function (userId, options = {}) {
  const query = { user: userId };

  if (options.startDate || options.endDate) {
    query.timestamp = {};
    if (options.startDate)
      query.timestamp.$gte = new Date(options.startDate);
    if (options.endDate) query.timestamp.$lte = new Date(options.endDate);
  }

  if (options.action) query.action = options.action;
  if (options.status) query.status = options.status;

  return this.find(query)
    .populate('user', 'name email')
    .sort({ timestamp: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

/**
 * Static method to get entity history
 * @param {string} entity - Entity type
 * @param {string} entityId - Entity ID
 * @param {Object} options - Query options
 * @returns {Array}
 */
auditLogSchema.statics.getEntityHistory = async function (
  entity,
  entityId,
  options = {}
) {
  const query = { entity, entityId };

  if (options.startDate || options.endDate) {
    query.timestamp = {};
    if (options.startDate)
      query.timestamp.$gte = new Date(options.startDate);
    if (options.endDate) query.timestamp.$lte = new Date(options.endDate);
  }

  return this.find(query)
    .populate('user', 'name email')
    .sort({ timestamp: -1 })
    .limit(options.limit || 100);
};

/**
 * Static method to get actions by type
 * @param {string} action - Action type
 * @param {Object} options - Query options
 * @returns {Array}
 */
auditLogSchema.statics.getActionsByType = async function (action, options = {}) {
  const query = { action };

  if (options.startDate || options.endDate) {
    query.timestamp = {};
    if (options.startDate)
      query.timestamp.$gte = new Date(options.startDate);
    if (options.endDate) query.timestamp.$lte = new Date(options.endDate);
  }

  if (options.status) query.status = options.status;
  if (options.entity) query.entity = options.entity;

  return this.find(query)
    .populate('user', 'name email')
    .sort({ timestamp: -1 })
    .limit(options.limit || 100);
};

/**
 * Static method to get failed actions
 * @param {Object} options - Query options
 * @returns {Array}
 */
auditLogSchema.statics.getFailedActions = async function (options = {}) {
  const query = { status: { $in: ['failure', 'warning'] } };

  if (options.startDate || options.endDate) {
    query.timestamp = {};
    if (options.startDate)
      query.timestamp.$gte = new Date(options.startDate);
    if (options.endDate) query.timestamp.$lte = new Date(options.endDate);
  }

  if (options.severity) query.severity = options.severity;
  if (options.action) query.action = options.action;

  return this.find(query)
    .populate('user', 'name email')
    .sort({ timestamp: -1 })
    .limit(options.limit || 50);
};

/**
 * Static method to get suspicious activity
 * @param {Object} options - Query options
 * @returns {Array}
 */
auditLogSchema.statics.getSuspiciousActivity = async function (options = {}) {
  const query = {
    $or: [
      { status: 'failure', severity: 'critical' },
      { tags: 'security' },
      { action: 'auth-failure' },
      { action: 'permission-change' }
    ]
  };

  if (options.startDate || options.endDate) {
    query.timestamp = {};
    if (options.startDate)
      query.timestamp.$gte = new Date(options.startDate);
    if (options.endDate) query.timestamp.$lte = new Date(options.endDate);
  }

  return this.find(query)
    .populate('user', 'name email')
    .sort({ timestamp: -1 })
    .limit(options.limit || 50);
};

/**
 * Static method to search audit logs
 * @param {string} query - Search query
 * @param {Object} options - Query options
 * @returns {Array}
 */
auditLogSchema.statics.search = async function (searchQuery, options = {}) {
  const query = { $text: { $search: searchQuery } };

  if (options.entity) query.entity = options.entity;
  if (options.status) query.status = options.status;

  return this.find(query)
    .score({ score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(options.limit || 50);
};

/**
 * Static method to get logs by team
 * @param {string} teamId - Team ID
 * @param {Object} options - Query options
 * @returns {Array}
 */
auditLogSchema.statics.getByTeam = async function (teamId, options = {}) {
  const query = { team: teamId };

  if (options.startDate || options.endDate) {
    query.timestamp = {};
    if (options.startDate)
      query.timestamp.$gte = new Date(options.startDate);
    if (options.endDate) query.timestamp.$lte = new Date(options.endDate);
  }

  return this.find(query)
    .populate('user', 'name email')
    .sort({ timestamp: -1 })
    .limit(options.limit || 100)
    .skip(options.skip || 0);
};

/**
 * Static method to get compliance-related logs
 * @param {Array<string>} flags - Compliance flags
 * @param {Object} options - Query options
 * @returns {Array}
 */
auditLogSchema.statics.getComplianceLogs = async function (
  flags,
  options = {}
) {
  const query = { complianceFlags: { $in: flags } };

  if (options.startDate || options.endDate) {
    query.timestamp = {};
    if (options.startDate)
      query.timestamp.$gte = new Date(options.startDate);
    if (options.endDate) query.timestamp.$lte = new Date(options.endDate);
  }

  return this.find(query)
    .populate('user', 'name email')
    .sort({ timestamp: -1 })
    .limit(options.limit || 100);
};

/**
 * Instance method to add related log
 * @param {string} relatedLogId - Related log ID
 */
auditLogSchema.methods.addRelatedLog = async function (relatedLogId) {
  if (!this.relatedLogs.includes(relatedLogId)) {
    this.relatedLogs.push(relatedLogId);
  }
  return this.save();
};

/**
 * Instance method to add compliance flag
 * @param {string} flag - Compliance flag
 */
auditLogSchema.methods.addComplianceFlag = async function (flag) {
  if (!this.complianceFlags.includes(flag)) {
    this.complianceFlags.push(flag);
  }
  return this.save();
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
