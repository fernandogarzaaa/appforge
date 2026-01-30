import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getPermissions,
  getResourcePermissions,
  grantPermission,
  revokePermission,
  checkPermission,
  getUserPermissions
} from '../controllers/permissionController.js';
import { validateRequest } from '../middleware/validation.js';
import { permissionSchemas } from '../validators/schemas.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/permissions
 * @desc    Get all permissions for a resource
 * @access  Private (Admin or Owner)
 */
router.get(
  '/',
  authorize(['admin', 'owner']),
  getPermissions
);

/**
 * @route   GET /api/permissions/resource/:resourceType/:resourceId
 * @desc    Get permissions for a specific resource
 * @access  Private (Team member)
 */
router.get(
  '/resource/:resourceType/:resourceId',
  authorize(['member', 'admin', 'owner']),
  getResourcePermissions
);

/**
 * @route   GET /api/permissions/user/:userId
 * @desc    Get all permissions for a user
 * @access  Private (Self or Admin)
 */
router.get(
  '/user/:userId',
  getUserPermissions
);

/**
 * @route   POST /api/permissions/check
 * @desc    Check if user has specific permission
 * @access  Private
 */
router.post(
  '/check',
  validateRequest(permissionSchemas.checkPermission),
  checkPermission
);

/**
 * @route   POST /api/permissions/grant
 * @desc    Grant permission to user
 * @access  Private (Admin or Owner)
 */
router.post(
  '/grant',
  authorize(['admin', 'owner']),
  validateRequest(permissionSchemas.grantPermission),
  grantPermission
);

/**
 * @route   DELETE /api/permissions/revoke
 * @desc    Revoke permission from user
 * @access  Private (Admin or Owner)
 */
router.delete(
  '/revoke',
  authorize(['admin', 'owner']),
  validateRequest(permissionSchemas.revokePermission),
  revokePermission
);

export default router;
