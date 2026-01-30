import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  updateMemberRole,
  getTeamMembers,
  transferOwnership
} from '../controllers/teamController.js';
import { validateRequest } from '../middleware/validation.js';
import { teamSchemas } from '../validators/schemas.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/teams
 * @desc    Get all teams for the authenticated user
 * @access  Private
 */
router.get('/', getTeams);

/**
 * @route   GET /api/teams/:id
 * @desc    Get team by ID
 * @access  Private (Team member)
 */
router.get('/:id', authorize(['member', 'admin', 'owner']), getTeamById);

/**
 * @route   POST /api/teams
 * @desc    Create a new team
 * @access  Private
 */
router.post('/', validateRequest(teamSchemas.createTeam), createTeam);

/**
 * @route   PUT /api/teams/:id
 * @desc    Update team details
 * @access  Private (Admin or Owner)
 */
router.put(
  '/:id',
  authorize(['admin', 'owner']),
  validateRequest(teamSchemas.updateTeam),
  updateTeam
);

/**
 * @route   DELETE /api/teams/:id
 * @desc    Delete a team
 * @access  Private (Owner only)
 */
router.delete('/:id', authorize(['owner']), deleteTeam);

/**
 * @route   GET /api/teams/:id/members
 * @desc    Get all team members
 * @access  Private (Team member)
 */
router.get('/:id/members', authorize(['member', 'admin', 'owner']), getTeamMembers);

/**
 * @route   POST /api/teams/:id/members
 * @desc    Add a member to the team
 * @access  Private (Admin or Owner)
 */
router.post(
  '/:id/members',
  authorize(['admin', 'owner']),
  validateRequest(teamSchemas.addMember),
  addTeamMember
);

/**
 * @route   DELETE /api/teams/:id/members/:userId
 * @desc    Remove a member from the team
 * @access  Private (Admin or Owner)
 */
router.delete(
  '/:id/members/:userId',
  authorize(['admin', 'owner']),
  removeTeamMember
);

/**
 * @route   PATCH /api/teams/:id/members/:userId
 * @desc    Update member role
 * @access  Private (Admin or Owner)
 */
router.patch(
  '/:id/members/:userId',
  authorize(['admin', 'owner']),
  validateRequest(teamSchemas.updateMemberRole),
  updateMemberRole
);

/**
 * @route   POST /api/teams/:id/transfer-ownership
 * @desc    Transfer team ownership to another member
 * @access  Private (Owner only)
 */
router.post(
  '/:id/transfer-ownership',
  authorize(['owner']),
  validateRequest(teamSchemas.transferOwnership),
  transferOwnership
);

export default router;
