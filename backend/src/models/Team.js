import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      maxlength: [100, 'Team name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        role: {
          type: String,
          enum: ['owner', 'admin', 'member', 'viewer'],
          default: 'member'
        },
        joinedAt: {
          type: Date,
          default: Date.now
        },
        permissions: {
          canEdit: { type: Boolean, default: false },
          canDelete: { type: Boolean, default: false },
          canInvite: { type: Boolean, default: false },
          canManageMembers: { type: Boolean, default: false }
        }
      }
    ],
    settings: {
      isPublic: {
        type: Boolean,
        default: false
      },
      allowMemberInvites: {
        type: Boolean,
        default: false
      },
      requireApproval: {
        type: Boolean,
        default: true
      },
      maxMembers: {
        type: Number,
        default: 50
      }
    },
    stats: {
      projectCount: {
        type: Number,
        default: 0
      },
      activeMembers: {
        type: Number,
        default: 0
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
teamSchema.index({ owner: 1 });
teamSchema.index({ 'members.user': 1 });
teamSchema.index({ name: 'text', description: 'text' });

// Virtual for member count
teamSchema.virtual('memberCount').get(function () {
  return this.members.length;
});

// Methods
teamSchema.methods.isMember = function (userId) {
  return this.members.some(
    (member) => member.user.toString() === userId.toString()
  );
};

teamSchema.methods.getMemberRole = function (userId) {
  const member = this.members.find(
    (member) => member.user.toString() === userId.toString()
  );
  return member ? member.role : null;
};

teamSchema.methods.hasPermission = function (userId, permission) {
  const member = this.members.find(
    (member) => member.user.toString() === userId.toString()
  );
  
  if (!member) return false;
  
  // Owner has all permissions
  if (member.role === 'owner') return true;
  
  // Admin has most permissions
  if (member.role === 'admin') {
    return permission !== 'delete';
  }
  
  // Check specific permission
  return member.permissions[permission] === true;
};

// Pre-save middleware
teamSchema.pre('save', function (next) {
  this.stats.activeMembers = this.members.filter(
    (member) => member.role !== 'viewer'
  ).length;
  next();
});

const Team = mongoose.model('Team', teamSchema);

export default Team;
