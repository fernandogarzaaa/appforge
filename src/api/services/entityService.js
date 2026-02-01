/**
 * Entity Service
 * Handles entity CRUD operations with AppForge backend
 */

import appforgeClient from '../appforgeClient';

export const entityService = {
  /**
   * Get all entities for a project
   */
  async getEntities(projectId) {
    try {
      const response = await appforgeClient.get(`/entities?projectId=${projectId}`);
      return {
        success: true,
        entities: response.data.entities || response.data
      };
    } catch (error) {
      console.error('Error fetching entities:', error);
      return {
        success: false,
        entities: [],
        error: error.response?.data?.message || 'Failed to fetch entities'
      };
    }
  },

  /**
   * Get a single entity
   */
  async getEntity(entityId) {
    try {
      const response = await appforgeClient.get(`/entities/${entityId}`);
      return {
        success: true,
        entity: response.data.entity || response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch entity'
      };
    }
  },

  /**
   * Create a new entity
   */
  async createEntity(entityData) {
    try {
      const response = await appforgeClient.post('/entities', {
        projectId: entityData.projectId,
        name: entityData.name,
        schema: entityData.schema,
        displayName: entityData.displayName,
        icon: entityData.icon,
        color: entityData.color,
        description: entityData.description,
        metadata: entityData.metadata
      });

      return {
        success: true,
        entity: response.data.entity || response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create entity'
      };
    }
  },

  /**
   * Update an entity
   */
  async updateEntity(entityId, updates) {
    try {
      const response = await appforgeClient.put(`/entities/${entityId}`, updates);
      return {
        success: true,
        entity: response.data.entity || response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update entity'
      };
    }
  },

  /**
   * Delete an entity
   */
  async deleteEntity(entityId) {
    try {
      await appforgeClient.delete(`/entities/${entityId}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete entity'
      };
    }
  },

  /**
   * Get entity data (records)
   */
  async getEntityData(entityId, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);
      if (options.search) params.append('search', options.search);
      if (options.filter) params.append('filter', JSON.stringify(options.filter));
      if (options.sort) params.append('sort', options.sort);

      const response = await appforgeClient.get(
        `/entities/${entityId}/data?${params.toString()}`
      );
      
      return {
        success: true,
        data: response.data.data || response.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error.response?.data?.message || 'Failed to fetch entity data'
      };
    }
  },

  /**
   * Create entity record
   */
  async createEntityRecord(entityId, recordData) {
    try {
      const response = await appforgeClient.post(
        `/entities/${entityId}/data`,
        recordData
      );
      
      return {
        success: true,
        record: response.data.record || response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create record'
      };
    }
  },

  /**
   * Update entity record
   */
  async updateEntityRecord(entityId, recordId, updates) {
    try {
      const response = await appforgeClient.put(
        `/entities/${entityId}/data/${recordId}`,
        updates
      );
      
      return {
        success: true,
        record: response.data.record || response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update record'
      };
    }
  },

  /**
   * Delete entity record
   */
  async deleteEntityRecord(entityId, recordId) {
    try {
      await appforgeClient.delete(`/entities/${entityId}/data/${recordId}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete record'
      };
    }
  },

  /**
   * Bulk create entity records
   */
  async bulkCreateRecords(entityId, records) {
    try {
      const response = await appforgeClient.post(
        `/entities/${entityId}/data/bulk`,
        { records }
      );
      
      return {
        success: true,
        records: response.data.records || response.data,
        count: response.data.count
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to bulk create records'
      };
    }
  },

  /**
   * Export entity data
   */
  async exportEntityData(entityId, format = 'json') {
    try {
      const response = await appforgeClient.get(
        `/entities/${entityId}/export?format=${format}`
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to export data'
      };
    }
  }
};

export default entityService;
