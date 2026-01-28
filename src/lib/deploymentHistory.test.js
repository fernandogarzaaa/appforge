import { describe, it, expect } from 'vitest';
import {
  getStatusColor,
  canRollback,
  formatDuration,
  calculateDeploymentStats,
  filterDeployments,
  sortDeployments,
  DEPLOYMENT_STATUS
} from '@/lib/deploymentHistory';

describe('Deployment History Utilities', () => {
  describe('formatDuration', () => {
    it('should format seconds', () => {
      expect(formatDuration(45)).toBe('45s');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(125)).toContain('2m');
      expect(formatDuration(125)).toContain('5s');
    });

    it('should format hours, minutes, and seconds', () => {
      expect(formatDuration(3661)).toContain('1h');
      expect(formatDuration(3661)).toContain('1m');
      expect(formatDuration(3661)).toContain('1s');
    });

    it('should handle zero', () => {
      expect(formatDuration(0)).toBe('0s');
    });
  });

  describe('canRollback', () => {
    it('should allow rollback for successful deployments with previous version', () => {
      const deployment = {
        status: DEPLOYMENT_STATUS.SUCCESS,
        previous_version: 'v1.0.0'
      };
      expect(canRollback(deployment)).toBe(true);
    });

    it('should prevent rollback for failed deployments', () => {
      const deployment = {
        status: DEPLOYMENT_STATUS.FAILED,
        previous_version: 'v1.0.0'
      };
      expect(canRollback(deployment)).toBe(false);
    });

    it('should prevent rollback without previous version', () => {
      const deployment = {
        status: DEPLOYMENT_STATUS.SUCCESS,
        previous_version: null
      };
      expect(canRollback(deployment)).toBe(false);
    });
  });

  describe('calculateDeploymentStats', () => {
    const deployments = [
      { status: DEPLOYMENT_STATUS.SUCCESS, duration: 300 },
      { status: DEPLOYMENT_STATUS.SUCCESS, duration: 400 },
      { status: DEPLOYMENT_STATUS.FAILED, duration: 200 },
      { status: DEPLOYMENT_STATUS.PENDING }
    ];

    it('should calculate correct totals', () => {
      const stats = calculateDeploymentStats(deployments);
      expect(stats.total).toBe(4);
      expect(stats.successful).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.pending).toBe(1);
    });

    it('should calculate average duration', () => {
      const stats = calculateDeploymentStats(deployments);
      expect(stats.averageDuration).toBe(300); // (300 + 400 + 200) / 3
    });

    it('should calculate success rate', () => {
      const stats = calculateDeploymentStats(deployments);
      expect(stats.successRate).toBe(50); // 2/4
    });
  });

  describe('filterDeployments', () => {
    const deployments = [
      {
        id: 1,
        status: DEPLOYMENT_STATUS.SUCCESS,
        environment: 'production',
        branch: 'main',
        created_at: '2026-01-28T10:00:00'
      },
      {
        id: 2,
        status: DEPLOYMENT_STATUS.FAILED,
        environment: 'staging',
        branch: 'develop',
        created_at: '2026-01-27T10:00:00'
      }
    ];

    it('should filter by status', () => {
      const result = filterDeployments(deployments, { status: DEPLOYMENT_STATUS.SUCCESS });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should filter by environment', () => {
      const result = filterDeployments(deployments, { environment: 'production' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should filter by branch', () => {
      const result = filterDeployments(deployments, { branch: 'develop' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it('should return all when no filters', () => {
      const result = filterDeployments(deployments, { status: 'all' });
      expect(result).toHaveLength(2);
    });
  });

  describe('sortDeployments', () => {
    const deployments = [
      {
        id: 1,
        status: DEPLOYMENT_STATUS.SUCCESS,
        duration: 300,
        created_at: '2026-01-28T10:00:00'
      },
      {
        id: 2,
        status: DEPLOYMENT_STATUS.FAILED,
        duration: 200,
        created_at: '2026-01-27T10:00:00'
      }
    ];

    it('should sort by date descending by default', () => {
      const result = sortDeployments(deployments);
      expect(result[0].id).toBe(1);
    });

    it('should sort by date ascending', () => {
      const result = sortDeployments(deployments, 'date', 'asc');
      expect(result[0].id).toBe(2);
    });

    it('should sort by duration', () => {
      const result = sortDeployments(deployments, 'duration', 'asc');
      expect(result[0].duration).toBe(200);
    });

    it('should sort by status', () => {
      const result = sortDeployments(deployments, 'status');
      expect(result).toHaveLength(2);
    });
  });
});
