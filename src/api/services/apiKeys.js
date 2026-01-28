/**
 * API Keys Backend Service
 * Handles all API key operations with base44 backend
 */

import { base44 } from '../base44Client';

export const apiKeysService = {
  /**
   * Fetch all API keys
   */
  async getAll() {
    try {
      const keys = await base44.entities.APIKey.filter({});
      return keys;
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      throw error;
    }
  },

  /**
   * Create a new API key
   */
  async create(data) {
    try {
      const newKey = await base44.entities.APIKey.create({
        ...data,
        created_at: new Date().toISOString(),
        active: true
      });
      return newKey;
    } catch (error) {
      console.error('Failed to create API key:', error);
      throw error;
    }
  },

  /**
   * Revoke an API key
   */
  async revoke(keyId) {
    try {
      const updated = await base44.entities.APIKey.update(keyId, {
        active: false,
        revoked_at: new Date().toISOString()
      });
      return updated;
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      throw error;
    }
  },

  /**
   * Delete an API key
   */
  async delete(keyId) {
    try {
      await base44.entities.APIKey.delete(keyId);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete API key:', error);
      throw error;
    }
  },

  /**
   * Update API key scopes
   */
  async updateScopes(keyId, scopes) {
    try {
      const response = await base44.entities.APIKey.update(keyId, { scopes });
      return response.data;
    } catch (error) {
      console.error('Failed to update API key scopes:', error);
      throw error;
    }
  }
};

export default apiKeysService;
