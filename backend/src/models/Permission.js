import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      enum: [
        'read',
        'create',
        'update',
        'delete',
        'execute',
        'manage',
        'admin'
      ]
    },
    resourceType: {
      type: String,
      required: true,
      enum: [
        'project',
        'team',
        'deployment',
        'apiKey',
        'environment',
        'quantum',
        'collaboration'
      ]
    },
    resourceId: {
      type: String,
      required: true,
      index: true
    },
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    expiresAt: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for quick permission lookups
permissionSchema.index({ user: 1, resourceType: 1, resourceId: 1, action: 1 });
permissionSchema.index({ resourceType: 1, resourceId: 1 });
permissionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Methods
permissionSchema.methods.isExpired = function () {
  if (!this.expiresAt) return false;
  return this.expiresAt < new Date();
};

permissionSchema.methods.isValid = function () {
  return this.isActive && !this.isExpired();
};

// Static methods
permissionSchema.statics.hasPermission = async function (userId, action, resourceType, resourceId) {
  const permission = await this.findOne({
    user: userId,
    action: { $in: [action, 'admin', 'manage'] },
    resourceType,
    resourceId,
    isActive: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });

  return !!permission;
};

permissionSchema.statics.getUserPermissions = async function (userId, resourceType = null) {
  const query = {
    user: userId,
    isActive: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  };

  if (resourceType) {
    query.resourceType = resourceType;
  }

  return this.find(query)
    .populate('grantedBy', 'name email')
    .sort({ createdAt: -1 });
};

const Permission = mongoose.model('Permission', permissionSchema);

export default Permission;
