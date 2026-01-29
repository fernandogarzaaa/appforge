/**
 * User & Project Management Routes
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getUserProfile,
  updateUserProfile,
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  getProjectMembers,
  getProjectStats,
  createTeam,
  getTeams
} from '../controllers/userController.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

/**
 * GET /api/users/profile
 * Get current user profile
 */
router.get('/profile', getUserProfile);

/**
 * PUT /api/users/profile
 * Update user profile
 */
router.put('/profile', updateUserProfile);

/**
 * POST /api/users/projects
 * Create a new project
 */
router.post('/projects', createProject);

/**
 * GET /api/users/projects
 * Get all projects
 */
router.get('/projects', getProjects);

/**
 * GET /api/users/projects/:id
 * Get a specific project
 */
router.get('/projects/:id', getProject);

/**
 * PUT /api/users/projects/:id
 * Update a project
 */
router.put('/projects/:id', updateProject);

/**
 * DELETE /api/users/projects/:id
 * Delete a project
 */
router.delete('/projects/:id', deleteProject);

/**
 * POST /api/users/projects/:id/members
 * Add member to project
 */
router.post('/projects/:id/members', addProjectMember);

/**
 * DELETE /api/users/projects/:id/members/:memberId
 * Remove member from project
 */
router.delete('/projects/:id/members/:memberId', removeProjectMember);

/**
 * GET /api/users/projects/:id/members
 * Get project members
 */
router.get('/projects/:id/members', getProjectMembers);

/**
 * GET /api/users/projects/:id/stats
 * Get project statistics
 */
router.get('/projects/:id/stats', getProjectStats);

/**
 * POST /api/users/teams
 * Create a team
 */
router.post('/teams', createTeam);

/**
 * GET /api/users/teams
 * Get all teams
 */
router.get('/teams', getTeams);

export default router;
