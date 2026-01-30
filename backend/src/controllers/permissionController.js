import Permission from '../models/Permission.js';
import { AppError } from '../middleware/errorHandler.js';
import { logAudit } from '../utils/auditLogger.js';

/**
 * @desc    Get all permissions
 * @route   GET /api/permissions
 * @access  Private (Admin or Owner)
 */
export const getPermissions = async (req, res, next) => {
  try {
    const { resourceType, resourceId } = req.query;

    const query = {};
    if (resourceType) query.resourceType = resourceType;
    if (resourceId) query.resourceId = resourceId;

    const permissions = await Permission.find(query)
      .populate('user', 'name email')
      .populate('grantedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: permissions.length,
      data: permissions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get permissions for a specific resource
 * @route   GET /api/permissions/resource/:resourceType/:resourceId
 * @access  Private (Team member)
 */
export const getResourcePermissions = async (req, res, next) => {
  try {
    const { resourceType, resourceId } = req.params;

    const permissions = await Permission.find({
      resourceType,
      resourceId
    })
      .populate('user', 'name email')
      .populate('grantedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: permissions.length,
      data: permissions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all permissions for a user
 * @route   GET /api/permissions/user/:userId
 * @access  Private (Self or Admin)
 */
export const getUserPermissions = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Users can only view their own permissions unless they're admin
    if (userId !== req.user.id && !['admin', 'owner'].includes(req.user.role)) {
      throw new AppError('Access denied', 403);
    }

    const permissions = await Permission.find({ user: userId })
      .populate('grantedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: permissions.length,
      data: permissions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check if user has specific permission
 * @route   POST /api/permissions/check
 * @access  Private
 */
export const checkPermission = async (req, res, next) => {
  try {
    const { userId, action, resourceType, resourceId } = req.body;

    const permission = await Permission.findOne({
      user: userId || req.user.id,
      action,
      resourceType,
      resourceId
    });

    const hasPermission = !!permission;

    res.json({
      success: true,
      data: {
        hasPermission,
        permission: permission || null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Grant permission to user
 * @route   POST /api/permissions/grant
 * @access  Private (Admin or Owner)
 */
export const grantPermission = async (req, res, next) => {
  try {
    const { userId, action, resourceType, resourceId, expiresAt } = req.body;

    // Check if permission already exists
    const existingPermission = await Permission.findOne({
      user: userId,
      action,
      resourceType,
      resourceId
    });

    if (existingPermission) {
      throw new AppError('Permission already exists', 400);
    }

    const permission = await Permission.create({
      user: userId,
      action,
      resourceType,
      resourceId,
      grantedBy: req.user.id,
      expiresAt: expiresAt || null
    });

    await logAudit({
      action: 'permission.grant',
      userId: req.user.id,
      resourceType: 'permission',
      resourceId: permission._id,
      details: {
        targetUserId: userId,
        action,
        resourceType,
        resourceId
      }
    });

    const populatedPermission = await Permission.findById(permission._id)
      .populate('user', 'name email')
      .populate('grantedBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedPermission
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Revoke permission from user
 * @route   DELETE /api/permissions/revoke
 * @access  Private (Admin or Owner)
 */
export const revokePermission = async (req, res, next) => {
  try {
    const { userId, action, resourceType, resourceId } = req.body;

    const permission = await Permission.findOneAndDelete({
      user: userId,
      action,
      resourceType,
      resourceId
    });

    if (!permission) {
      throw new AppError('Permission not found', 404);
    }

    await logAudit({
      action: 'permission.revoke',
      userId: req.user.id,
      resourceType: 'permission',
      resourceId: permission._id,
      details: {
        targetUserId: userId,
        action,
        resourceType,
        resourceId
      }
    });

    res.json({
      success: true,
      message: 'Permission revoked successfully'
    });
  } catch (error) {
    next(error);
  }
};
