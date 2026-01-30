/**
 * Projects Backend Service
 * Handles project operations including cloning with base44 backend
 */

import { base44 } from '../base44Client';

export const projectsService = {
  /**
   * Fetch all projects
   */
  async getAll(filters = {}) {
    try {
      const projects = await base44.entities.Project.filter(filters);
      return projects;
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      throw error;
    }
  },

  /**
   * Get a specific project
   */
  async getById(projectId) {
    try {
      const project = await base44.entities.Project.get(projectId);
      return project;
    } catch (error) {
      console.error('Failed to fetch project:', error);
      throw error;
    }
  },

  /**
   * Clone a project
   */
  async clone(projectId, data) {
    try {
      // Get the source project
      const sourceProject = await base44.entities.Project.get(projectId);
      
      // Create a new project with cloned data
      const clonedProject = await base44.entities.Project.create({
        ...sourceProject,
        id: undefined, // Let DB generate new ID
        name: data.name,
        cloned_from: projectId,
        created_at: new Date().toISOString()
      });
      
      return clonedProject;
    } catch (error) {
      console.error('Failed to clone project:', error);
      throw error;
    }
  },

  /**
   * Create a new project
   */
  async create(data) {
    try {
      const project = await base44.entities.Project.create(data);
      return project;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  },

  /**
   * Update a project
   */
  async update(projectId, data) {
    try {
      const project = await base44.entities.Project.update(projectId, data);
      return project;
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  },

  /**
   * Delete a project
   */
  async delete(projectId) {
    try {
      await base44.entities.Project.delete(projectId);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  },

  /**
   * Toggle project favorite status
   */
  async toggleFavorite(projectId) {
    try {
      // Check if favorite exists
      const existing = await base44.entities.ProjectFavorite.filter({
        project_id: projectId
      });
      
      if (existing && existing.length > 0) {
        // Remove favorite
        await base44.entities.ProjectFavorite.delete(existing[0].id);
        return { isFavorite: false };
      } else {
        // Add favorite
        const favorite = await base44.entities.ProjectFavorite.create({
          project_id: projectId,
          created_at: new Date().toISOString()
        });
        return { isFavorite: true, favorite };
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  },

  /**
   * Get favorite projects
   */
  async getFavorites() {
    try {
      const favorites = await base44.entities.ProjectFavorite.filter({});
      // Get the actual projects
      const projectIds = favorites.map(f => f.project_id);
      const projects = [];
      
      for (const id of projectIds) {
        try {
          const project = await base44.entities.Project.get(id);
          projects.push(project);
        } catch (err) {
          console.warn('Failed to load favorite project:', id);
        }
      }
      
      return projects;
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      throw error;
    }
  },

  /**
   * Search projects
   */
  async search(query) {
    try {
      // Get all projects and filter client-side
      // Base44 entities.filter doesn't support complex queries like $contains
      const allProjects = await base44.entities.Project.filter({});
      const projects = (allProjects instanceof Array ? allProjects : []).filter(p => 
        p.name?.toLowerCase().includes(query.toLowerCase()) ||
        p.description?.toLowerCase().includes(query.toLowerCase())
      );
      
      return {
        projects,
        functions: [],
        pages: [],
        total: projects.length
      };
    } catch (error) {
      console.error('Failed to search projects:', error);
      throw error;
    }
  }
};

export default projectsService;
