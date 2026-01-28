/**
 * API Key Service - Backend Integration
 * Handles API key management with base44 backend
 */

import { encryptValue, decryptValue } from '@/lib/apiKeyUtils';

export const apiKeyService = {
  /**
   * Get all API keys for current project
   */
  async getAPIKeys(base44Client, projectId) {
    try {
      const keys = await base44Client.entities.APIKey.filter({
        project_id: projectId
      });
      
      // Decrypt values
      return keys.map(k => ({
        ...k,
        // Note: In production, don't decrypt full values
        masked_value: k.masked_value || '••••••••'
      }));
    } catch (error) {
      console.error('Error fetching API keys:', error);
      return [];
    }
  },

  /**
   * Create a new API key
   */
  async createAPIKey(base44Client, projectId, data) {
    try {
      const encrypted = encryptValue(data.key_value);
      
      const newKey = await base44Client.entities.APIKey.create({
        project_id: projectId,
        name: data.name,
        key_value: encrypted,
        scopes: JSON.stringify(data.scopes),
        environment: data.environment,
        is_active: true,
        is_revoked: false,
        created_at: new Date().toISOString(),
        last_used_at: null
      });

      return newKey;
    } catch (error) {
      console.error('Error creating API key:', error);
      throw error;
    }
  },

  /**
   * Revoke an API key
   */
  async revokeAPIKey(base44Client, keyId) {
    try {
      await base44Client.entities.APIKey.update(keyId, {
        is_revoked: true,
        revoked_at: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error revoking API key:', error);
      throw error;
    }
  },

  /**
   * Delete an API key
   */
  async deleteAPIKey(base44Client, keyId) {
    try {
      await base44Client.entities.APIKey.delete(keyId);
      return true;
    } catch (error) {
      console.error('Error deleting API key:', error);
      throw error;
    }
  },

  /**
   * Update API key scopes
   */
  async updateAPIKeyScopes(base44Client, keyId, scopes) {
    try {
      await base44Client.entities.APIKey.update(keyId, {
        scopes: JSON.stringify(scopes)
      });
      return true;
    } catch (error) {
      console.error('Error updating API key scopes:', error);
      throw error;
    }
  },

  /**
   * Log API key usage
   */
  async logAPIKeyUsage(base44Client, keyId) {
    try {
      await base44Client.entities.APIKey.update(keyId, {
        last_used_at: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error logging API key usage:', error);
      // Non-critical, don't throw
      return false;
    }
  }
};

export default apiKeyService;
