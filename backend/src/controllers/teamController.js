import Team from '../models/Team.js';
import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import { logAudit } from '../utils/auditLogger.js';

/**
 * @desc    Get all teams for the authenticated user
 * @route   GET /api/teams
 * @access  Private
 */
export const getTeams = async (req, res, next) => {
  try {
    const teams = await Team.find({
      $or: [
        { owner: req.user.id },
        { 'members.user': req.user.id }
      ]
    })
      .populate('owner', 'name email')
      .populate('members.user', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get team by ID
 * @route   GET /api/teams/:id
 * @access  Private (Team member)
 */
export const getTeamById = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!team) {
      throw new AppError('Team not found', 404);
    }

    // Check if user is member
    const isMember = team.isMember(req.user.id);
    if (!isMember) {
      throw new AppError('Access denied', 403);
    }

    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new team
 * @route   POST /api/teams
 * @access  Private
 */
export const createTeam = async (req, res, next) => {
  try {
    const { name, description, settings } = req.body;

    const team = await Team.create({
      name,
      description,
      owner: req.user.id,
      settings: settings || {},
      members: [
        {
          user: req.user.id,
          role: 'owner',
          joinedAt: new Date()
        }
      ]
    });

    await logAudit({
      action: 'team.create',
      userId: req.user.id,
      resourceType: 'team',
      resourceId: team._id,
      details: { name, description }
    });

    const populatedTeam = await Team.findById(team._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email avatar');

    res.status(201).json({
      success: true,
      data: populatedTeam
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update team details
 * @route   PUT /api/teams/:id
 * @access  Private (Admin or Owner)
 */
export const updateTeam = async (req, res, next) => {
  try {
    const { name, description, settings } = req.body;

    const team = await Team.findById(req.params.id);
    if (!team) {
      throw new AppError('Team not found', 404);
    }

    // Update fields
    if (name) team.name = name;
    if (description !== undefined) team.description = description;
    if (settings) team.settings = { ...team.settings, ...settings };

    await team.save();

    await logAudit({
      action: 'team.update',
      userId: req.user.id,
      resourceType: 'team',
      resourceId: team._id,
      details: { name, description, settings }
    });

    const updatedTeam = await Team.findById(team._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email avatar');

    res.json({
      success: true,
      data: updatedTeam
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a team
 * @route   DELETE /api/teams/:id
 * @access  Private (Owner only)
 */
export const deleteTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      throw new AppError('Team not found', 404);
    }

    await team.deleteOne();

    await logAudit({
      action: 'team.delete',
      userId: req.user.id,
      resourceType: 'team',
      resourceId: team._id,
      details: { name: team.name }
    });

    res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all team members
 * @route   GET /api/teams/:id/members
 * @access  Private (Team member)
 */
export const getTeamMembers = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members.user', 'name email avatar createdAt');

    if (!team) {
      throw new AppError('Team not found', 404);
    }

    res.json({
      success: true,
      count: team.members.length,
      data: team.members
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a member to the team
 * @route   POST /api/teams/:id/members
 * @access  Private (Admin or Owner)
 */
export const addTeamMember = async (req, res, next) => {
  try {
    const { userId, role } = req.body;

    const team = await Team.findById(req.params.id);
    if (!team) {
      throw new AppError('Team not found', 404);
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if already a member
    const isMember = team.members.some(
      (member) => member.user.toString() === userId
    );
    if (isMember) {
      throw new AppError('User is already a team member', 400);
    }

    team.members.push({
      user: userId,
      role: role || 'member',
      joinedAt: new Date()
    });

    await team.save();

    await logAudit({
      action: 'team.member.add',
      userId: req.user.id,
      resourceType: 'team',
      resourceId: team._id,
      details: { addedUserId: userId, role }
    });

    const updatedTeam = await Team.findById(team._id)
      .populate('members.user', 'name email avatar');

    res.json({
      success: true,
      data: updatedTeam
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove a member from the team
 * @route   DELETE /api/teams/:id/members/:userId
 * @access  Private (Admin or Owner)
 */
export const removeTeamMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    const team = await Team.findById(id);
    if (!team) {
      throw new AppError('Team not found', 404);
    }

    // Prevent removing the owner
    if (team.owner.toString() === userId) {
      throw new AppError('Cannot remove team owner', 400);
    }

    team.members = team.members.filter(
      (member) => member.user.toString() !== userId
    );

    await team.save();

    await logAudit({
      action: 'team.member.remove',
      userId: req.user.id,
      resourceType: 'team',
      resourceId: team._id,
      details: { removedUserId: userId }
    });

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update member role
 * @route   PATCH /api/teams/:id/members/:userId
 * @access  Private (Admin or Owner)
 */
export const updateMemberRole = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;

    const team = await Team.findById(id);
    if (!team) {
      throw new AppError('Team not found', 404);
    }

    // Cannot change owner's role
    if (team.owner.toString() === userId) {
      throw new AppError('Cannot change owner role', 400);
    }

    const memberIndex = team.members.findIndex(
      (member) => member.user.toString() === userId
    );

    if (memberIndex === -1) {
      throw new AppError('Member not found', 404);
    }

    team.members[memberIndex].role = role;
    await team.save();

    await logAudit({
      action: 'team.member.role.update',
      userId: req.user.id,
      resourceType: 'team',
      resourceId: team._id,
      details: { targetUserId: userId, newRole: role }
    });

    res.json({
      success: true,
      data: team.members[memberIndex]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Transfer team ownership
 * @route   POST /api/teams/:id/transfer-ownership
 * @access  Private (Owner only)
 */
export const transferOwnership = async (req, res, next) => {
  try {
    const { newOwnerId } = req.body;

    const team = await Team.findById(req.params.id);
    if (!team) {
      throw new AppError('Team not found', 404);
    }

    // Check if new owner is a member
    const memberIndex = team.members.findIndex(
      (member) => member.user.toString() === newOwnerId
    );

    if (memberIndex === -1) {
      throw new AppError('New owner must be a team member', 400);
    }

    const oldOwnerId = team.owner;

    // Update ownership
    team.owner = newOwnerId;
    team.members[memberIndex].role = 'owner';

    // Update old owner to admin
    const oldOwnerIndex = team.members.findIndex(
      (member) => member.user.toString() === oldOwnerId.toString()
    );
    if (oldOwnerIndex !== -1) {
      team.members[oldOwnerIndex].role = 'admin';
    }

    await team.save();

    await logAudit({
      action: 'team.ownership.transfer',
      userId: req.user.id,
      resourceType: 'team',
      resourceId: team._id,
      details: { oldOwnerId, newOwnerId }
    });

    const updatedTeam = await Team.findById(team._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email avatar');

    res.json({
      success: true,
      data: updatedTeam
    });
  } catch (error) {
    next(error);
  }
};
