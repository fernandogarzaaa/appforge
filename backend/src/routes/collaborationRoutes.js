/**
 * Real-time Collaboration Routes
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  addCollaborator,
  removeCollaborator,
  getCollaborators,
  getChangeHistory,
  publishDocument,
  unpublishDocument
} from '../controllers/collaborationController.js';

const router = express.Router();

// All collaboration routes require authentication
router.use(authenticate);

/**
 * POST /api/collaboration/documents
 * Create a new document
 */
router.post('/documents', createDocument);

/**
 * GET /api/collaboration/documents
 * Get all documents (with optional projectId filter)
 */
router.get('/documents', getDocuments);

/**
 * GET /api/collaboration/documents/:id
 * Get a specific document
 */
router.get('/documents/:id', getDocument);

/**
 * PUT /api/collaboration/documents/:id
 * Update a document
 */
router.put('/documents/:id', updateDocument);

/**
 * DELETE /api/collaboration/documents/:id
 * Delete a document
 */
router.delete('/documents/:id', deleteDocument);

/**
 * POST /api/collaboration/documents/:id/collaborators
 * Add a collaborator to document
 */
router.post('/documents/:id/collaborators', addCollaborator);

/**
 * DELETE /api/collaboration/documents/:id/collaborators/:collaboratorId
 * Remove a collaborator from document
 */
router.delete('/documents/:id/collaborators/:collaboratorId', removeCollaborator);

/**
 * GET /api/collaboration/documents/:id/collaborators
 * Get document collaborators
 */
router.get('/documents/:id/collaborators', getCollaborators);

/**
 * GET /api/collaboration/documents/:id/history
 * Get change history
 */
router.get('/documents/:id/history', getChangeHistory);

/**
 * POST /api/collaboration/documents/:id/publish
 * Publish document
 */
router.post('/documents/:id/publish', publishDocument);

/**
 * POST /api/collaboration/documents/:id/unpublish
 * Unpublish document
 */
router.post('/documents/:id/unpublish', unpublishDocument);

export default router;
