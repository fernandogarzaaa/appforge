/**
 * Real-time Collaboration Controller
 * Handles document management and collaboration features
 */

import { v4 as uuidv4 } from 'uuid';
import { successResponse, createError } from '../utils/helpers.js';

// Mock databases
const documents = new Map();
const collaborators = new Map();

export const createDocument = async (req, res, next) => {
  try {
    const { title, content = '', projectId, isPublic = false } = req.body;

    if (!title) {
      throw createError(400, 'Document title is required');
    }

    const docId = uuidv4();
    const doc = {
      id: docId,
      title,
      content,
      projectId,
      isPublic,
      owner: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      collaborators: [
        {
          userId: req.user.id,
          role: 'owner',
          joinedAt: new Date()
        }
      ],
      changeHistory: [],
      tags: []
    };

    documents.set(docId, doc);

    res.status(201).json(successResponse(doc, 'Document created successfully'));
  } catch (err) {
    next(err);
  }
};

export const getDocuments = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    let userDocs = Array.from(documents.values()).filter(
      d => d.owner === req.user.id || d.isPublic || d.collaborators.some(c => c.userId === req.user.id)
    );

    if (projectId) {
      userDocs = userDocs.filter(d => d.projectId === projectId);
    }

    res.json(successResponse(userDocs, 'Documents retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export const getDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = documents.get(id);

    if (!doc) {
      throw createError(404, 'Document not found');
    }

    const isOwner = doc.owner === req.user.id;
    const isCollaborator = doc.collaborators.some(c => c.userId === req.user.id);

    if (!isOwner && !isCollaborator && !doc.isPublic) {
      throw createError(403, 'Unauthorized access to document');
    }

    res.json(successResponse(doc, 'Document retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export const updateDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, isPublic } = req.body;

    const doc = documents.get(id);
    if (!doc) {
      throw createError(404, 'Document not found');
    }

    const isOwner = doc.owner === req.user.id;
    const isCollaborator = doc.collaborators.some(c => c.userId === req.user.id);

    if (!isOwner && !isCollaborator) {
      throw createError(403, 'Unauthorized to modify document');
    }

    // Record change
    const change = {
      id: uuidv4(),
      userId: req.user.id,
      timestamp: new Date(),
      changes: {}
    };

    if (title !== undefined) {
      change.changes.title = { old: doc.title, new: title };
      doc.title = title;
    }
    if (content !== undefined) {
      change.changes.content = { old: doc.content.slice(0, 50), new: content.slice(0, 50) };
      doc.content = content;
    }
    if (isPublic !== undefined) {
      change.changes.isPublic = { old: doc.isPublic, new: isPublic };
      doc.isPublic = isPublic;
    }

    doc.changeHistory.push(change);
    doc.version++;
    doc.updatedAt = new Date();

    documents.set(id, doc);

    res.json(successResponse(doc, 'Document updated successfully'));
  } catch (err) {
    next(err);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = documents.get(id);

    if (!doc) {
      throw createError(404, 'Document not found');
    }

    if (doc.owner !== req.user.id) {
      throw createError(403, 'Only owner can delete document');
    }

    documents.delete(id);

    res.json(successResponse(null, 'Document deleted successfully'));
  } catch (err) {
    next(err);
  }
};

export const addCollaborator = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { collaboratorId, role = 'editor' } = req.body;

    const doc = documents.get(id);
    if (!doc) {
      throw createError(404, 'Document not found');
    }

    if (doc.owner !== req.user.id) {
      throw createError(403, 'Only owner can add collaborators');
    }

    if (doc.collaborators.some(c => c.userId === collaboratorId)) {
      throw createError(409, 'User is already a collaborator');
    }

    doc.collaborators.push({
      userId: collaboratorId,
      role,
      joinedAt: new Date()
    });

    documents.set(id, doc);

    res.status(201).json(successResponse(doc, 'Collaborator added successfully'));
  } catch (err) {
    next(err);
  }
};

export const removeCollaborator = async (req, res, next) => {
  try {
    const { id, collaboratorId } = req.params;
    const doc = documents.get(id);

    if (!doc) {
      throw createError(404, 'Document not found');
    }

    if (doc.owner !== req.user.id) {
      throw createError(403, 'Only owner can remove collaborators');
    }

    doc.collaborators = doc.collaborators.filter(c => c.userId !== collaboratorId);
    documents.set(id, doc);

    res.json(successResponse(doc, 'Collaborator removed successfully'));
  } catch (err) {
    next(err);
  }
};

export const getCollaborators = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = documents.get(id);

    if (!doc) {
      throw createError(404, 'Document not found');
    }

    const isOwner = doc.owner === req.user.id;
    const isCollaborator = doc.collaborators.some(c => c.userId === req.user.id);

    if (!isOwner && !isCollaborator && !doc.isPublic) {
      throw createError(403, 'Unauthorized access');
    }

    res.json(successResponse(doc.collaborators, 'Collaborators retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export const getChangeHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = documents.get(id);

    if (!doc) {
      throw createError(404, 'Document not found');
    }

    const isOwner = doc.owner === req.user.id;
    const isCollaborator = doc.collaborators.some(c => c.userId === req.user.id);

    if (!isOwner && !isCollaborator && !doc.isPublic) {
      throw createError(403, 'Unauthorized access');
    }

    res.json(successResponse(
      doc.changeHistory.slice(-50), // Last 50 changes
      'Change history retrieved successfully'
    ));
  } catch (err) {
    next(err);
  }
};

export const publishDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = documents.get(id);

    if (!doc) {
      throw createError(404, 'Document not found');
    }

    if (doc.owner !== req.user.id) {
      throw createError(403, 'Only owner can publish document');
    }

    doc.isPublic = true;
    doc.publishedAt = new Date();
    documents.set(id, doc);

    res.json(successResponse(doc, 'Document published successfully'));
  } catch (err) {
    next(err);
  }
};

export const unpublishDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = documents.get(id);

    if (!doc) {
      throw createError(404, 'Document not found');
    }

    if (doc.owner !== req.user.id) {
      throw createError(403, 'Only owner can unpublish document');
    }

    doc.isPublic = false;
    documents.set(id, doc);

    res.json(successResponse(doc, 'Document unpublished successfully'));
  } catch (err) {
    next(err);
  }
};
