import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateCloneName,
  validateProjectName,
  calculateCloneSize,
  getCloneSummary
} from '@/lib/projectCloning';

describe('Project Cloning Utilities', () => {
  describe('generateCloneName', () => {
    it('should generate clone name with suffix', () => {
      const result = generateCloneName('My Project');
      expect(result).toBe('My Project (Copy)');
    });

    it('should increment suffix for duplicates', () => {
      const existing = [{ name: 'Project (Copy)' }];
      const result = generateCloneName('Project', existing);
      expect(result).toBe('Project (Copy 2)');
    });

    it('should handle multiple duplicates', () => {
      const existing = [
        { name: 'Project (Copy)' },
        { name: 'Project (Copy 2)' }
      ];
      const result = generateCloneName('Project', existing);
      expect(result).toBe('Project (Copy 3)');
    });
  });

  describe('validateProjectName', () => {
    it('should accept valid names', () => {
      const result = validateProjectName('Valid Project Name');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should reject empty names', () => {
      const result = validateProjectName('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    it('should reject names exceeding max length', () => {
      const longName = 'a'.repeat(101);
      const result = validateProjectName(longName);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceed 100 characters');
    });

    it('should reject invalid characters', () => {
      const result = validateProjectName('Project@#$%');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('letters, numbers, spaces');
    });
  });

  describe('getCloneSummary', () => {
    const mockProject = {
      name: 'Test Project',
      settings: {},
      environment_variables: [
        { id: 1, name: 'API_KEY' },
        { id: 2, name: 'SECRET' }
      ],
      team_members: [{ id: 1, name: 'User' }],
      deployments: []
    };

    it('should return empty items for no copy options', () => {
      const summary = getCloneSummary(mockProject, {
        copySettings: false,
        copyEnvironmentVars: false,
        copyTeamMembers: false,
        copyDeployments: false
      });
      expect(summary.itemsToClone).toEqual(['Nothing (empty clone)']);
      expect(summary.totalItems).toBe(0);
    });

    it('should count copied items', () => {
      const summary = getCloneSummary(mockProject, {
        copySettings: true,
        copyEnvironmentVars: true,
        copyTeamMembers: true,
        copyDeployments: false
      });
      expect(summary.totalItems).toBe(3);
      expect(summary.itemsToClone).toContain('Project settings');
      expect(summary.itemsToClone).toContain('2 environment variables');
      expect(summary.itemsToClone).toContain('1 team members');
    });
  });

  describe('calculateCloneSize', () => {
    const mockProject = {
      environment_variables: Array(5).fill({ id: 1 }),
      team_members: Array(3).fill({ id: 1 }),
      deployments: Array(2).fill({ id: 1 })
    };

    it('should estimate clone size', () => {
      const size = calculateCloneSize(mockProject, {
        copySettings: true,
        copyEnvironmentVars: true,
        copyTeamMembers: true,
        copyDeployments: true
      });
      expect(size).toMatch(/KB|MB|B/);
    });
  });
});
