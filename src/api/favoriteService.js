/**
 * Favorite Service - Backend Integration
 * Handles favorite project synchronization with base44 backend
 */

import { createClientFromRequest } from '@base44/sdk';

export const favoriteService = {
  /**
   * Get all favorites for current user
   */
  async getFavorites(base44Client) {
    try {
      // Query FavoriteProject entity filtered by current user
      const favorites = await base44Client.entities.FavoriteProject.filter({
        // Auto-filters by current user
      });
      return favorites.map(f => f.project_id);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }
  },

  /**
   * Toggle favorite status for a project
   */
  async toggleFavorite(base44Client, projectId) {
    try {
      const existing = await base44Client.entities.FavoriteProject.filter({
        project_id: projectId
      });

      if (existing.length > 0) {
        // Remove favorite
        await base44Client.entities.FavoriteProject.delete(existing[0].id);
        return false;
      } else {
        // Add favorite
        await base44Client.entities.FavoriteProject.create({
          project_id: projectId,
          added_at: new Date().toISOString()
        });
        return true;
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  },

  /**
   * Add project to favorites
   */
  async addFavorite(base44Client, projectId) {
    try {
      await base44Client.entities.FavoriteProject.create({
        project_id: projectId,
        added_at: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  },

  /**
   * Remove project from favorites
   */
  async removeFavorite(base44Client, projectId) {
    try {
      const existing = await base44Client.entities.FavoriteProject.filter({
        project_id: projectId
      });

      if (existing.length > 0) {
        await base44Client.entities.FavoriteProject.delete(existing[0].id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  }
};

export default favoriteService;
