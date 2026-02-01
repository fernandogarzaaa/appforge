/**
 * Project Service
 * Handles project CRUD operations with AppForge backend
 */

import appforgeClient from '../appforgeClient';

export const projectService = {
  /**
   * Get all user projects
   */
  async getAllProjects(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.order) params.append('order', filters.order);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await appforgeClient.get(`/projects?${params.toString()}`);
      
      return {
        success: true,
        projects: response.data.projects || response.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Error fetching projects:', error);
      return {
        success: false,
        projects: [],
        error: error.response?.data?.message || 'Failed to fetch projects'
      };
    }
  },

  /**
   * Get a single project by ID
   */
  async getProject(projectId) {
    try {
      const response = await appforgeClient.get(`/projects/${projectId}`);
      return {
        success: true,
        project: response.data.project || response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch project'
      };
    }
  },

  /**
   * Create a new project
   */
  async createProject(projectData) {
    try {
      const response = await appforgeClient.post('/projects', {
        name: projectData.name,
        description: projectData.description,
        type: projectData.type,
        framework: projectData.framework,
        template: projectData.template,
        features: projectData.features,
        entities: projectData.entities,
        pages: projectData.pages,
        settings: projectData.settings,
        metadata: projectData.metadata
      });

      return {
        success: true,
        project: response.data.project || response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create project'
      };
    }
  },

  /**
   * Update a project
   */
  async updateProject(projectId, updates) {
    try {
      const response = await appforgeClient.put(`/projects/${projectId}`, updates);
      return {
        success: true,
        project: response.data.project || response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update project'
      };
    }
  },

  /**
   * Delete a project
   */
  async deleteProject(projectId) {
    try {
      await appforgeClient.delete(`/projects/${projectId}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete project'
      };
    }
  },

  /**
   * Clone a project
   */
  async cloneProject(projectId, cloneName, options = {}) {
    try {
      const response = await appforgeClient.post(`/projects/${projectId}/clone`, {
        name: cloneName,
        copySettings: options.copySettings !== false,
        copyDeployments: options.copyDeployments || false,
        copyEnvironmentVars: options.copyEnvironmentVars || false,
        copyTeamMembers: options.copyTeamMembers || false
      });

      return {
        success: true,
        project: response.data.project || response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to clone project'
      };
    }
  },

  /**
   * Export a project
   */
  async exportProject(projectId, format = 'json') {
    try {
      const response = await appforgeClient.post(`/projects/${projectId}/export`, {
        format
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to export project'
      };
    }
  },

  /**
   * Archive a project
   */
  async archiveProject(projectId) {
    try {
      await appforgeClient.put(`/projects/${projectId}`, { status: 'archived' });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to archive project'
      };
    }
  },

  /**
   * Restore an archived project
   */
  async restoreProject(projectId) {
    try {
      await appforgeClient.put(`/projects/${projectId}`, { status: 'active' });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to restore project'
      };
    }
  },

  /**
   * Get project analytics
   */
  async getProjectAnalytics(projectId) {
    try {
      const response = await appforgeClient.get(`/projects/${projectId}/analytics`);
      return {
        success: true,
        analytics: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch analytics'
      };
    }
  },

  /**
   * Get project activity logs
   */
  async getProjectActivity(projectId, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);

      const response = await appforgeClient.get(
        `/projects/${projectId}/activity?${params.toString()}`
      );
      
      return {
        success: true,
        activities: response.data.activities || response.data
      };
    } catch (error) {
      return {
        success: false,
        activities: [],
        error: error.response?.data?.message || 'Failed to fetch activity'
      };
    }
  }
};

export default projectService;
