import { describe, it, expect } from 'vitest';
import {
  generateMockFavorites,
  toggleFavorite,
  isFavorited,
  getFavoriteCount,
  sortByFavorites,
  calculateFavoriteStats
} from '@/lib/favorites';

describe('Favorites Utilities', () => {
  describe('generateMockFavorites', () => {
    it('should generate mock favorites array', () => {
      const favorites = generateMockFavorites();
      expect(Array.isArray(favorites)).toBe(true);
      expect(favorites.length).toBeGreaterThan(0);
    });

    it('should have valid favorite structure', () => {
      const favorites = generateMockFavorites();
      favorites.forEach(fav => {
        expect(fav).toHaveProperty('projectId');
        expect(fav).toHaveProperty('timestamp');
      });
    });

    it('should generate specified count', () => {
      const favorites = generateMockFavorites(5);
      expect(favorites.length).toBe(5);
    });
  });

  describe('toggleFavorite', () => {
    it('should add favorite when not exists', () => {
      const favorites = [];
      const result = toggleFavorite(favorites, 'proj-1');
      expect(result.length).toBe(1);
      expect(result[0].projectId).toBe('proj-1');
    });

    it('should remove favorite when exists', () => {
      const favorites = [{ projectId: 'proj-1', timestamp: Date.now() }];
      const result = toggleFavorite(favorites, 'proj-1');
      expect(result.length).toBe(0);
    });

    it('should preserve other favorites', () => {
      const favorites = [
        { projectId: 'proj-1', timestamp: Date.now() },
        { projectId: 'proj-2', timestamp: Date.now() }
      ];
      const result = toggleFavorite(favorites, 'proj-1');
      expect(result.length).toBe(1);
      expect(result[0].projectId).toBe('proj-2');
    });
  });

  describe('isFavorited', () => {
    it('should return true for favorited projects', () => {
      const favorites = [{ projectId: 'proj-1', timestamp: Date.now() }];
      expect(isFavorited(favorites, 'proj-1')).toBe(true);
    });

    it('should return false for non-favorited projects', () => {
      const favorites = [{ projectId: 'proj-1', timestamp: Date.now() }];
      expect(isFavorited(favorites, 'proj-2')).toBe(false);
    });

    it('should handle empty favorites', () => {
      expect(isFavorited([], 'proj-1')).toBe(false);
    });
  });

  describe('getFavoriteCount', () => {
    it('should count favorites correctly', () => {
      const favorites = [
        { projectId: 'proj-1', timestamp: Date.now() },
        { projectId: 'proj-2', timestamp: Date.now() },
        { projectId: 'proj-3', timestamp: Date.now() }
      ];
      expect(getFavoriteCount(favorites)).toBe(3);
    });

    it('should return 0 for empty array', () => {
      expect(getFavoriteCount([])).toBe(0);
    });
  });

  describe('sortByFavorites', () => {
    it('should sort projects with favorites first', () => {
      const projects = [
        { id: 'proj-1', name: 'Project 1' },
        { id: 'proj-2', name: 'Project 2' },
        { id: 'proj-3', name: 'Project 3' }
      ];
      const favorites = [
        { projectId: 'proj-3', timestamp: Date.now() }
      ];

      const sorted = sortByFavorites(projects, favorites);
      expect(sorted[0].id).toBe('proj-3');
    });

    it('should maintain order within each group', () => {
      const projects = [
        { id: 'proj-1', name: 'A' },
        { id: 'proj-2', name: 'B' },
        { id: 'proj-3', name: 'C' }
      ];
      const favorites = [
        { projectId: 'proj-2', timestamp: Date.now() }
      ];

      const sorted = sortByFavorites(projects, favorites);
      // Favorite first
      expect(sorted[0].id).toBe('proj-2');
      // Non-favorites after, in original order
      expect(sorted[1].id).toBe('proj-1');
      expect(sorted[2].id).toBe('proj-3');
    });
  });

  describe('calculateFavoriteStats', () => {
    it('should calculate stats correctly', () => {
      const projects = [
        { id: 'proj-1' },
        { id: 'proj-2' },
        { id: 'proj-3' },
        { id: 'proj-4' },
        { id: 'proj-5' }
      ];
      const favorites = [
        { projectId: 'proj-1', timestamp: Date.now() },
        { projectId: 'proj-3', timestamp: Date.now() }
      ];

      const stats = calculateFavoriteStats(projects, favorites);
      expect(stats.totalProjects).toBe(5);
      expect(stats.favoriteCount).toBe(2);
      expect(stats.favoritePercentage).toBe(40);
    });

    it('should handle no projects', () => {
      const stats = calculateFavoriteStats([], []);
      expect(stats.totalProjects).toBe(0);
      expect(stats.favoriteCount).toBe(0);
      expect(stats.favoritePercentage).toBe(0);
    });

    it('should handle all projects favorited', () => {
      const projects = [
        { id: 'proj-1' },
        { id: 'proj-2' }
      ];
      const favorites = [
        { projectId: 'proj-1', timestamp: Date.now() },
        { projectId: 'proj-2', timestamp: Date.now() }
      ];

      const stats = calculateFavoriteStats(projects, favorites);
      expect(stats.favoritePercentage).toBe(100);
    });
  });
});
