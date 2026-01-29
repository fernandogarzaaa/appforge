/**
 * User & Project Management Controller
 * Handles user profiles, projects, and team management
 */

import { v4 as uuidv4 } from 'uuid';
import { successResponse, createError } from '../utils/helpers.js';

// Mock databases
const projects = new Map();
const userProfiles = new Map();
const teams = new Map();

export const getUserProfile = async (req, res, next) => {
  try {
    const profile = userProfiles.get(req.user.id);

    res.json(successResponse(
      profile || {
        userId: req.user.id,
        email: req.user.email,
        bio: '',
        avatar: '',
        organization: '',
        preferences: {}
      },
      'User profile retrieved successfully'
    ));
  } catch (err) {
    next(err);
  }
};

export const updateUserProfile = async (req, res, next) => {
  try {
    const { name, bio, avatar, preferences } = req.body;

    const profile = userProfiles.get(req.user.id) || { userId: req.user.id };

    if (name) profile.name = name;
    if (bio !== undefined) profile.bio = bio;
    if (avatar !== undefined) profile.avatar = avatar;
    if (preferences) profile.preferences = { ...profile.preferences, ...preferences };
    profile.updatedAt = new Date();

    userProfiles.set(req.user.id, profile);

    res.json(successResponse(profile, 'Profile updated successfully'));
  } catch (err) {
    next(err);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const { name, description, isPublic = false } = req.body;

    if (!name) {
      throw createError(400, 'Project name is required');
    }

    const projectId = uuidv4();
    const project = {
      id: projectId,
      name,
      description: description || '',
      owner: req.user.id,
      isPublic,
      createdAt: new Date(),
      updatedAt: new Date(),
      members: [
        {
          userId: req.user.id,
          role: 'owner',
          joinedAt: new Date()
        }
      ],
      documents: [],
      settings: {
        allowPublicAccess: isPublic,
        defaultDocumentPermissions: 'edit'
      }
    };

    projects.set(projectId, project);

    res.status(201).json(successResponse(project, 'Project created successfully'));
  } catch (err) {
    next(err);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const userProjects = Array.from(projects.values()).filter(
      p => p.owner === req.user.id || p.isPublic || p.members.some(m => m.userId === req.user.id)
    );

    res.json(successResponse(userProjects, 'Projects retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export const getProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = projects.get(id);

    if (!project) {
      throw createError(404, 'Project not found');
    }

    const isOwner = project.owner === req.user.id;
    const isMember = project.members.some(m => m.userId === req.user.id);

    if (!isOwner && !isMember && !project.isPublic) {
      throw createError(403, 'Unauthorized access to project');
    }

    res.json(successResponse(project, 'Project retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, isPublic } = req.body;

    const project = projects.get(id);
    if (!project) {
      throw createError(404, 'Project not found');
    }

    if (project.owner !== req.user.id) {
      throw createError(403, 'Only owner can update project');
    }

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (isPublic !== undefined) project.isPublic = isPublic;
    project.updatedAt = new Date();

    projects.set(id, project);

    res.json(successResponse(project, 'Project updated successfully'));
  } catch (err) {
    next(err);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = projects.get(id);

    if (!project) {
      throw createError(404, 'Project not found');
    }

    if (project.owner !== req.user.id) {
      throw createError(403, 'Only owner can delete project');
    }

    projects.delete(id);

    res.json(successResponse(null, 'Project deleted successfully'));
  } catch (err) {
    next(err);
  }
};

export const addProjectMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { memberId, role = 'editor' } = req.body;

    const project = projects.get(id);
    if (!project) {
      throw createError(404, 'Project not found');
    }

    if (project.owner !== req.user.id) {
      throw createError(403, 'Only owner can add members');
    }

    if (project.members.some(m => m.userId === memberId)) {
      throw createError(409, 'User is already a project member');
    }

    project.members.push({
      userId: memberId,
      role,
      joinedAt: new Date()
    });

    projects.set(id, project);

    res.status(201).json(successResponse(project, 'Member added successfully'));
  } catch (err) {
    next(err);
  }
};

export const removeProjectMember = async (req, res, next) => {
  try {
    const { id, memberId } = req.params;
    const project = projects.get(id);

    if (!project) {
      throw createError(404, 'Project not found');
    }

    if (project.owner !== req.user.id) {
      throw createError(403, 'Only owner can remove members');
    }

    project.members = project.members.filter(m => m.userId !== memberId);
    projects.set(id, project);

    res.json(successResponse(project, 'Member removed successfully'));
  } catch (err) {
    next(err);
  }
};

export const getProjectMembers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = projects.get(id);

    if (!project) {
      throw createError(404, 'Project not found');
    }

    const isOwner = project.owner === req.user.id;
    const isMember = project.members.some(m => m.userId === req.user.id);

    if (!isOwner && !isMember && !project.isPublic) {
      throw createError(403, 'Unauthorized access');
    }

    res.json(successResponse(project.members, 'Project members retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export const getProjectStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = projects.get(id);

    if (!project) {
      throw createError(404, 'Project not found');
    }

    const stats = {
      projectId: id,
      membersCount: project.members.length,
      documentsCount: project.documents.length,
      createdAt: project.createdAt,
      lastUpdated: project.updatedAt,
      owner: project.owner
    };

    res.json(successResponse(stats, 'Project stats retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export const createTeam = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      throw createError(400, 'Team name is required');
    }

    const teamId = uuidv4();
    const team = {
      id: teamId,
      name,
      description: description || '',
      owner: req.user.id,
      createdAt: new Date(),
      members: [
        {
          userId: req.user.id,
          role: 'owner',
          joinedAt: new Date()
        }
      ],
      projects: []
    };

    teams.set(teamId, team);

    res.status(201).json(successResponse(team, 'Team created successfully'));
  } catch (err) {
    next(err);
  }
};

export const getTeams = async (req, res, next) => {
  try {
    const userTeams = Array.from(teams.values()).filter(
      t => t.owner === req.user.id || t.members.some(m => m.userId === req.user.id)
    );

    res.json(successResponse(userTeams, 'Teams retrieved successfully'));
  } catch (err) {
    next(err);
  }
};
