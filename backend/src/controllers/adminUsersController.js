/**
 * Admin Users Controller
 * Manages user administration with comprehensive audit logging
 * Implements CRUD operations, pagination, filtering, sorting, and audit tracking
 */

import jwt from 'jsonwebtoken';
import { successResponse, createError } from '../utils/helpers.js';
import { getJWTConfig } from '../config/index.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

/**
 * Serialize user for response (excludes sensitive data)
 * @param {Object} user - User document
 * @returns {Object} - Serialized user
 */
const serializeUser = (user) => ({
  _id: user._id,
  email: user.email,
  username: user.username,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  lastLogin: user.lastLogin,
  emailVerified: user.emailVerified || false,
  mfaEnabled: user.mfaEnabled || false
});

/**
 * List all users with pagination, filtering, and sorting
 * GET /admin/users
 */
export const listUsers = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-createdAt';
    const { search, role, status } = req.query;

    // Build filter query
    const filter = {};

    if (role) {
      filter.role = role;
    }

    if (status) {
      filter.isActive = status === 'active';
    }

    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query
    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    const serialized = users.map(user => serializeUser(user));

    res.json(successResponse({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      users: serialized
    }, 'Users retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * Get a single user by ID
 * GET /admin/users/:id
 */
export const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password').lean();

    if (!user) {
      throw createError(404, 'User not found');
    }

    res.json(successResponse(
      serializeUser(user),
      'User retrieved successfully'
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * Update a user (admin only)
 * PATCH /admin/users/:id
 */
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, role, metadata } = req.body;
    const adminId = req.user?.id || 'system';

    const user = await User.findById(id);
    if (!user) {
      throw createError(404, 'User not found');
    }

    // Track original state for audit
    const originalState = {
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };

    // Update fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (role !== undefined) {
      // Ensure role change is audited
      if (user.role !== role) {
        user.role = role;
      }
    }
    if (metadata !== undefined) user.metadata = metadata;

    user.updatedAt = new Date();
    await user.save();

    // Audit log
    await AuditLog.logAction({
      action: 'UPDATE',
      userId: adminId,
      resourceType: 'user',
      resourceId: user._id.toString(),
      details: {
        originalState,
        updatedFields: { firstName, lastName, role }
      },
      status: 'success'
    }).catch(() => {});

    res.json(successResponse(
      serializeUser(user.toObject()),
      'User updated successfully'
    ));
  } catch (err) {
    // Audit failure
    if (req.user?.id) {
      await AuditLog.logAction({
        action: 'UPDATE',
        userId: req.user.id,
        resourceType: 'user',
        resourceId: req.params.id,
        details: req.body,
        status: 'failure',
        errorMessage: err.message
      }).catch(() => {});
    }
    next(err);
  }
};

/**
 * Ban a user
 * POST /admin/users/:id/ban
 */
export const banUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.id || 'system';

    const user = await User.findById(id);
    if (!user) {
      throw createError(404, 'User not found');
    }

    if (!user.isActive) {
      throw createError(400, 'User is already banned');
    }

    user.isActive = false;
    user.updatedAt = new Date();
    await user.save();

    // Audit log
    await AuditLog.logAction({
      action: 'BAN',
      userId: adminId,
      resourceType: 'user',
      resourceId: user._id.toString(),
      details: {
        email: user.email,
        reason: reason || 'No reason provided'
      },
      status: 'success'
    }).catch(() => {});

    res.json(successResponse({
      _id: user._id,
      email: user.email,
      isActive: user.isActive
    }, 'User banned successfully'));
  } catch (err) {
    // Audit failure
    if (req.user?.id) {
      await AuditLog.logAction({
        action: 'BAN',
        userId: req.user.id,
        resourceType: 'user',
        resourceId: req.params.id,
        status: 'failure',
        errorMessage: err.message
      }).catch(() => {});
    }
    next(err);
  }
};

/**
 * Unban a user
 * POST /admin/users/:id/unban
 */
export const unbanUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.id || 'system';

    const user = await User.findById(id);
    if (!user) {
      throw createError(404, 'User not found');
    }

    if (user.isActive) {
      throw createError(400, 'User is not banned');
    }

    user.isActive = true;
    user.updatedAt = new Date();
    await user.save();

    // Audit log
    await AuditLog.logAction({
      action: 'UNBAN',
      userId: adminId,
      resourceType: 'user',
      resourceId: user._id.toString(),
      details: {
        email: user.email,
        reason: reason || 'No reason provided'
      },
      status: 'success'
    }).catch(() => {});

    res.json(successResponse({
      _id: user._id,
      email: user.email,
      isActive: user.isActive
    }, 'User unbanned successfully'));
  } catch (err) {
    // Audit failure
    if (req.user?.id) {
      await AuditLog.logAction({
        action: 'UNBAN',
        userId: req.user.id,
        resourceType: 'user',
        resourceId: req.params.id,
        status: 'failure',
        errorMessage: err.message
      }).catch(() => {});
    }
    next(err);
  }
};

/**
 * Delete a user (hard delete)
 * DELETE /admin/users/:id
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.id || 'system';

    const user = await User.findById(id);
    if (!user) {
      throw createError(404, 'User not found');
    }

    const userEmail = user.email;
    const userId = user._id;

    await User.deleteOne({ _id: id });

    // Audit log
    await AuditLog.logAction({
      action: 'DELETE',
      userId: adminId,
      resourceType: 'user',
      resourceId: userId.toString(),
      details: {
        email: userEmail,
        reason: reason || 'No reason provided'
      },
      status: 'success'
    }).catch(() => {});

    res.json(successResponse({
      _id: userId,
      email: userEmail
    }, 'User deleted successfully'));
  } catch (err) {
    // Audit failure
    if (req.user?.id) {
      await AuditLog.logAction({
        action: 'DELETE',
        userId: req.user.id,
        resourceType: 'user',
        resourceId: req.params.id,
        status: 'failure',
        errorMessage: err.message
      }).catch(() => {});
    }
    next(err);
  }
};

/**
 * Reset user password (admin action)
 * POST /admin/users/:id/reset-password
 */
export const resetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id || 'system';

    const user = await User.findById(id);
    if (!user) {
      throw createError(404, 'User not found');
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12);
    
    // Hash and set password
    user.password = tempPassword;
    user.updatedAt = new Date();
    user.passwordResetRequired = true;
    await user.save();

    // Audit log
    await AuditLog.logAction({
      action: 'RESET_PASSWORD',
      userId: adminId,
      resourceType: 'user',
      resourceId: user._id.toString(),
      details: { email: user.email },
      status: 'success'
    }).catch(() => {});

    res.json(successResponse({
      _id: user._id,
      email: user.email,
      tempPassword,
      message: 'Password reset. User must change password on next login.'
    }, 'User password reset successfully'));
  } catch (err) {
    // Audit failure
    if (req.user?.id) {
      await AuditLog.logAction({
        action: 'RESET_PASSWORD',
        userId: req.user.id,
        resourceType: 'user',
        resourceId: req.params.id,
        status: 'failure',
        errorMessage: err.message
      }).catch(() => {});
    }
    next(err);
  }
};

/**
 * Get impersonation token (for admin testing)
 * POST /admin/users/:id/impersonate
 */
export const getImpersonationToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id || 'system';

    const user = await User.findById(id);
    if (!user) {
      throw createError(404, 'User not found');
    }

    if (!user.isActive) {
      throw createError(400, 'Cannot impersonate a banned user');
    }

    const jwtConfig = getJWTConfig();
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        impersonatedBy: adminId,
        isImpersonation: true
      },
      jwtConfig.secret,
      { expiresIn: '15m' }
    );

    // Audit log
    await AuditLog.logAction({
      action: 'IMPERSONATE',
      userId: adminId,
      resourceType: 'user',
      resourceId: user._id.toString(),
      details: { email: user.email },
      status: 'success'
    }).catch(() => {});

    res.json(successResponse({
      token,
      expiresIn: '15m',
      userId: user._id,
      email: user.email
    }, 'Impersonation token created successfully'));
  } catch (err) {
    // Audit failure
    if (req.user?.id) {
      await AuditLog.logAction({
        action: 'IMPERSONATE',
        userId: req.user.id,
        resourceType: 'user',
        resourceId: req.params.id,
        status: 'failure',
        errorMessage: err.message
      }).catch(() => {});
    }
    next(err);
  }
};

/**
 * Get user activity (audit log entries)
 * GET /admin/users/:id/activity
 */
export const getUserActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    // Verify user exists
    const user = await User.findById(id);
    if (!user) {
      throw createError(404, 'User not found');
    }

    // Get activity logs
    const [total, logs] = await Promise.all([
      AuditLog.countDocuments({ userId: id }),
      AuditLog.find({ userId: id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    res.json(successResponse({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      activity: logs
    }, 'User activity retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * Get user statistics
 * GET /admin/users/stats
 */
export const getUserStats = async (req, res, next) => {
  try {
    const [total, active, inactive, byRole] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const roleStats = {};
    byRole.forEach(item => {
      roleStats[item._id] = item.count;
    });

    res.json(successResponse({
      total,
      active,
      inactive,
      byRole: roleStats
    }, 'User statistics retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export default {
  listUsers,
  getUser,
  updateUser,
  banUser,
  unbanUser,
  deleteUser,
  resetUserPassword,
  getImpersonationToken,
  getUserActivity,
  getUserStats
};
