/**
 * DEPRECATED - This file is no longer used
 * 
 * Replaced by axiosClient.js and services/ directory
 * Kept for reference only
 * 
 * Old Usage:
 * import { favoritesAPI, apiKeysAPI, deploymentsAPI, ... } from '@/api/base44Integration';
 * 
 * favoritesAPI.toggleFavorite(projectId)
 * apiKeysAPI.createKey(name, scopes)
 * deploymentsAPI.getHistory(projectId, filters)
 */

import { base44 as base44Client } from './base44Client';

// Constants
const INVITE_EXPIRY_DAYS = 7;

// ============================================================================
// FAVORITES API
// ============================================================================

export const favoritesAPI = {
  /**
   * Get all favorite projects for current user
   * @returns {Promise<Array>} Array of favorited project IDs with timestamps
   */
  async getFavorites() {
    try {
      const user = await base44Client.auth.getCurrentUser();
      if (!user) throw new Error('Not authenticated');
      
      // Fetch from base44.entities.ProjectFavorite
      const favorites = await base44Client.query(
        'SELECT projectId, timestamp FROM ProjectFavorite WHERE userId = ?',
        [user.id]
      );
      
      return favorites || [];
    } catch (error) {
      console.error('Error fetching favorites:', error);
      throw error;
    }
  },

  /**
   * Toggle favorite status for a project
   * @param {string} projectId - Project ID to toggle
   * @returns {Promise<boolean>} New favorite status
   */
  async toggleFavorite(projectId) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }
      
      const user = await base44Client.auth.getCurrentUser();
      if (!user) throw new Error('Not authenticated');
      
      // Check if already favorited
      const existing = await base44Client.query(
        'SELECT id FROM ProjectFavorite WHERE userId = ? AND projectId = ?',
        [user.id, projectId]
      );
      
      if (existing?.length > 0) {
        // Remove favorite
        await base44Client.delete('ProjectFavorite', existing[0].id);
        return false;
      } else {
        // Add favorite
        await base44Client.create('ProjectFavorite', {
          userId: user.id,
          projectId: projectId,
          timestamp: new Date().toISOString()
        });
        return true;
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw new Error(`Failed to toggle favorite for project ${projectId}: ${error.message}`);
    }
  }
};

// ============================================================================
// API KEYS API
// ============================================================================

export const apiKeysAPI = {
  /**
   * Get all API keys for current user
   * @returns {Promise<Array>} Array of API key objects (masked)
   */
  async getKeys() {
    try {
      const user = await base44Client.auth.getCurrentUser();
      if (!user) throw new Error('Not authenticated');
      
      const keys = await base44Client.query(
        'SELECT id, name, keyPrefix, createdAt, expiresAt, scopes, revokedAt FROM APIKey WHERE userId = ? ORDER BY createdAt DESC',
        [user.id]
      );
      
      return (keys || []).map(key => ({
        ...key,
        // Mask the full key value
        lastChars: key.keyPrefix ? key.keyPrefix.slice(-4) : '****'
      }));
    } catch (error) {
      console.error('Error fetching API keys:', error);
      throw error;
    }
  },

  /**
   * Create a new API key
   * @param {string} name - Key name
   * @param {Array} scopes - Permission scopes
   * @param {Date} expiresAt - Optional expiration date
   * @returns {Promise<Object>} Created key (full value, shown only once)
   */
  async createKey(name, scopes = [], expiresAt = null) {
    try {
      if (!name || typeof name !== 'string') {
        throw new Error('Valid key name is required');
      }
      
      const user = await base44Client.auth.getCurrentUser();
      if (!user) throw new Error('Not authenticated');
      
      // Call backend function to generate key
      const result = await base44Client.functions.call('generateAPIKey', {
        userId: user.id,
        name: name,
        scopes: scopes,
        expiresAt: expiresAt
      });
      
      return result;
    } catch (error) {
      console.error('Error creating API key:', error);
      throw new Error(`Failed to create API key '${name}': ${error.message}`);
    }
  },

  /**
   * Reveal/decrypt an API key (requires user action)
   * @param {string} keyId - Key ID to reveal
   * @returns {Promise<string>} Decrypted key value
   */
  async revealKey(keyId) {
    try {
      if (!keyId) {
        throw new Error('Key ID is required');
      }
      
      // Call backend function to decrypt
      const result = await base44Client.functions.call('decryptAPIKey', {
        keyId: keyId
      });
      
      return result;
    } catch (error) {
      console.error('Error revealing key:', error);
      throw error;
    }
  },

  /**
   * Revoke an API key (mark as inactive)
   * @param {string} keyId - Key ID to revoke
   * @returns {Promise<void>}
   */
  async revokeKey(keyId) {
    try {
      await base44Client.update('APIKey', keyId, {
        revokedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error revoking key:', error);
      throw error;
    }
  },

  /**
   * Delete an API key permanently
   * @param {string} keyId - Key ID to delete
   * @returns {Promise<void>}
   */
  async deleteKey(keyId) {
    try {
      await base44Client.delete('APIKey', keyId);
    } catch (error) {
      console.error('Error deleting key:', error);
      throw error;
    }
  }
};

// ============================================================================
// DEPLOYMENTS API
// ============================================================================

export const deploymentsAPI = {
  /**
   * Get deployment history for a project
   * @param {string} projectId - Project ID
   * @param {Object} filters - Filter options (status, environment, branch)
   * @returns {Promise<Array>} Array of deployments
   */
  async getHistory(projectId, filters = {}) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }
      
      let query = 'SELECT * FROM Deployment WHERE projectId = ?';
      const params = [projectId];
      
      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }
      if (filters.environment) {
        query += ' AND environment = ?';
        params.push(filters.environment);
      }
      if (filters.branch) {
        query += ' AND branch = ?';
        params.push(filters.branch);
      }
      
      query += ' ORDER BY createdAt DESC';
      
      const deployments = await base44Client.query(query, params);
      return deployments || [];
    } catch (error) {
      console.error('Error fetching deployments:', error);
      throw error;
    }
  },

  /**
   * Rollback to a previous deployment
   * @param {string} deploymentId - Current deployment ID
   * @param {string} previousDeploymentId - Target deployment to rollback to
   * @returns {Promise<Object>} New rollback deployment
   */
  async rollback(deploymentId, previousDeploymentId) {
    try {
      const result = await base44Client.functions.call('rollbackDeployment', {
        currentDeploymentId: deploymentId,
        targetDeploymentId: previousDeploymentId
      });
      
      return result;
    } catch (error) {
      console.error('Error rolling back deployment:', error);
      throw error;
    }
  },

  /**
   * Cancel a deployment in progress
   * @param {string} deploymentId - Deployment ID to cancel
   * @returns {Promise<void>}
   */
  async cancel(deploymentId) {
    try {
      await base44Client.update('Deployment', deploymentId, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error cancelling deployment:', error);
      throw error;
    }
  },

  /**
   * Get deployment logs
   * @param {string} deploymentId - Deployment ID
   * @returns {Promise<string>} Deployment logs
   */
  async getDeploymentLogs(deploymentId) {
    try {
      const result = await base44Client.query(
        'SELECT logs FROM Deployment WHERE id = ?',
        [deploymentId]
      );
      
      return result?.[0]?.logs || '';
    } catch (error) {
      console.error('Error fetching deployment logs:', error);
      throw error;
    }
  }
};

// ============================================================================
// ENVIRONMENT VARIABLES API
// ============================================================================

export const environmentVariablesAPI = {
  /**
   * Get environment variables for a project
   * @param {string} projectId - Project ID
   * @param {string} environment - Environment (production, staging, development)
   * @returns {Promise<Array>} Array of environment variables
   */
  async getVariables(projectId, environment = null) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }
      
      let query = 'SELECT * FROM EnvironmentVariable WHERE projectId = ?';
      const params = [projectId];
      
      if (environment) {
        query += ' AND environment = ?';
        params.push(environment);
      }
      
      query += ' ORDER BY name ASC';
      
      const variables = await base44Client.query(query, params);
      return variables || [];
    } catch (error) {
      console.error('Error fetching environment variables:', error);
      throw error;
    }
  },

  /**
   * Create a new environment variable
   * @param {string} projectId - Project ID
   * @param {Object} variable - Variable data (name, value, type, environment)
   * @returns {Promise<Object>} Created variable
   */
  async createVariable(projectId, variable) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }
      if (!variable || !variable.name) {
        throw new Error('Variable with name is required');
      }
      
      const result = await base44Client.create('EnvironmentVariable', {
        projectId: projectId,
        ...variable,
        createdAt: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      console.error('Error creating environment variable:', error);
      throw error;
    }
  },

  /**
   * Update an environment variable
   * @param {string} variableId - Variable ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated variable
   */
  async updateVariable(variableId, updates) {
    try {
      const result = await base44Client.update(
        'EnvironmentVariable',
        variableId,
        { ...updates, updatedAt: new Date().toISOString() }
      );
      
      return result;
    } catch (error) {
      console.error('Error updating environment variable:', error);
      throw error;
    }
  },

  /**
   * Delete an environment variable
   * @param {string} variableId - Variable ID
   * @returns {Promise<void>}
   */
  async deleteVariable(variableId) {
    try {
      await base44Client.delete('EnvironmentVariable', variableId);
    } catch (error) {
      console.error('Error deleting environment variable:', error);
      throw error;
    }
  }
};

// ============================================================================
// TEAM INVITES API
// ============================================================================

export const teamInvitesAPI = {
  /**
   * Get team invites for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} Array of invites
   */
  async getInvites(projectId) {
    try {
      const invites = await base44Client.query(
        'SELECT * FROM TeamInvite WHERE projectId = ? ORDER BY createdAt DESC',
        [projectId]
      );
      
      return invites || [];
    } catch (error) {
      console.error('Error fetching invites:', error);
      throw error;
    }
  },

  /**
   * Get team members for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} Array of team members
   */
  async getMembers(projectId) {
    try {
      const members = await base44Client.query(
        'SELECT * FROM TeamMember WHERE projectId = ? ORDER BY name ASC',
        [projectId]
      );
      
      return members || [];
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }
  },

  /**
   * Send a team invite
   * @param {string} projectId - Project ID
   * @param {string} email - Email to invite
   * @param {string} role - Role (admin, developer, viewer)
   * @param {string} message - Optional invite message
   * @returns {Promise<Object>} Created invite
   */
  async sendInvite(projectId, email, role, message = '') {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }
      if (!email || !email.includes('@')) {
        throw new Error('Valid email is required');
      }
      if (!role) {
        throw new Error('Role is required');
      }
      
      const result = await base44Client.create('TeamInvite', {
        projectId: projectId,
        email: email,
        role: role,
        message: message,
        status: 'pending',
        expiresAt: new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      console.error('Error sending invite:', error);
      throw new Error(`Failed to send invite to ${email}: ${error.message}`);
    }
  },

  /**
   * Resend an invite
   * @param {string} inviteId - Invite ID
   * @returns {Promise<Object>} Updated invite
   */
  async resendInvite(inviteId) {
    try {
      const result = await base44Client.update('TeamInvite', inviteId, {
        sentAt: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      console.error('Error resending invite:', error);
      throw error;
    }
  },

  /**
   * Cancel an invite
   * @param {string} inviteId - Invite ID
   * @returns {Promise<void>}
   */
  async cancelInvite(inviteId) {
    try {
      await base44Client.update('TeamInvite', inviteId, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error cancelling invite:', error);
      throw error;
    }
  },

  /**
   * Update team member role
   * @param {string} memberId - Member ID
   * @param {string} newRole - New role
   * @returns {Promise<Object>} Updated member
   */
  async updateMemberRole(memberId, newRole) {
    try {
      const result = await base44Client.update('TeamMember', memberId, {
        role: newRole,
        updatedAt: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  },

  /**
   * Remove a team member
   * @param {string} memberId - Member ID
   * @returns {Promise<void>}
   */
  async removeMember(memberId) {
    try {
      await base44Client.delete('TeamMember', memberId);
    } catch (error) {
      console.error('Error removing team member:', error);
      throw error;
    }
  }
};

// ============================================================================
// PROJECT CLONING API
// ============================================================================

export const projectCloningAPI = {
  /**
   * Clone a project
   * @param {string} sourceProjectId - Source project ID
   * @param {string} newName - New project name
   * @param {Object} options - Clone options (copyEnvironmentVariables, copyDeployments, copyTeamMembers)
   * @returns {Promise<Object>} New cloned project
   */
  async cloneProject(sourceProjectId, newName, options = {}) {
    try {
      if (!sourceProjectId) {
        throw new Error('Source project ID is required');
      }
      if (!newName || typeof newName !== 'string') {
        throw new Error('Valid new project name is required');
      }
      
      const result = await base44Client.functions.call('cloneProject', {
        sourceProjectId: sourceProjectId,
        newName: newName,
        options: options
      });
      
      return result;
    } catch (error) {
      console.error('Error cloning project:', error);
      throw new Error(`Failed to clone project ${sourceProjectId}: ${error.message}`);
    }
  }
};

// ============================================================================
// EXPORT ALL APIS
// ============================================================================

export const base44Integration = {
  favorites: favoritesAPI,
  apiKeys: apiKeysAPI,
  deployments: deploymentsAPI,
  environmentVariables: environmentVariablesAPI,
  teamInvites: teamInvitesAPI,
  projectCloning: projectCloningAPI
};

export default base44Integration;
