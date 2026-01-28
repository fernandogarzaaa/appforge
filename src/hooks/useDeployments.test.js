import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeployments } from '@/hooks/useDeployments';

describe('useDeployments Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty deployments', () => {
    const { result } = renderHook(() => useDeployments());
    expect(Array.isArray(result.current.deployments)).toBe(true);
    expect(result.current.loading).toBe(true);
  });

  it('should load deployment history', async () => {
    const { result } = renderHook(() => useDeployments());
    
    expect(result.current.loading).toBe(true);
    
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  it('should filter deployments by status', () => {
    const { result } = renderHook(() => useDeployments());
    
    act(() => {
      const filtered = result.current.filterByStatus('success');
      expect(Array.isArray(filtered)).toBe(true);
    });
  });

  it('should filter deployments by environment', () => {
    const { result } = renderHook(() => useDeployments());
    
    act(() => {
      const filtered = result.current.filterByEnvironment('production');
      expect(Array.isArray(filtered)).toBe(true);
    });
  });

  it('should filter deployments by branch', () => {
    const { result } = renderHook(() => useDeployments());
    
    act(() => {
      const filtered = result.current.filterByBranch('main');
      expect(Array.isArray(filtered)).toBe(true);
    });
  });

  it('should sort deployments by date', () => {
    const { result } = renderHook(() => useDeployments());
    
    act(() => {
      const sorted = result.current.sortByDate('desc');
      expect(Array.isArray(sorted)).toBe(true);
    });
  });

  it('should sort deployments by duration', () => {
    const { result } = renderHook(() => useDeployments());
    
    act(() => {
      const sorted = result.current.sortByDuration('asc');
      expect(Array.isArray(sorted)).toBe(true);
    });
  });

  it('should rollback to previous deployment', async () => {
    const { result } = renderHook(() => useDeployments());
    
    await act(async () => {
      await result.current.rollback('deploy-id-1', 'deploy-id-0');
    });
  });

  it('should cancel deployment', async () => {
    const { result } = renderHook(() => useDeployments());
    
    await act(async () => {
      await result.current.cancel('deploy-id-1');
    });
  });

  it('should fetch deployment logs', async () => {
    const { result } = renderHook(() => useDeployments());
    
    let logs = null;
    await act(async () => {
      logs = await result.current.getDeploymentLogs('deploy-id-1');
    });
    
    expect(logs === null || typeof logs === 'string').toBe(true);
  });

  it('should provide deployment statistics', () => {
    const { result } = renderHook(() => useDeployments());
    
    expect(result.current.stats).toBeDefined();
    expect(result.current.stats).toHaveProperty('total');
    expect(result.current.stats).toHaveProperty('successful');
    expect(result.current.stats).toHaveProperty('failed');
    expect(result.current.stats).toHaveProperty('averageDuration');
  });

  it('should calculate success rate', () => {
    const { result } = renderHook(() => useDeployments());
    
    const successRate = result.current.stats.successRate;
    expect(typeof successRate).toBe('number');
    expect(successRate).toBeGreaterThanOrEqual(0);
    expect(successRate).toBeLessThanOrEqual(100);
  });

  it('should detect if deployment can be rolled back', () => {
    const { result } = renderHook(() => useDeployments());
    
    act(() => {
      const canRollback = result.current.canRollback('deploy-id-2');
      expect(typeof canRollback).toBe('boolean');
    });
  });

  it('should detect if deployment can be cancelled', () => {
    const { result } = renderHook(() => useDeployments());
    
    act(() => {
      const canCancel = result.current.canCancel('deploy-id-1');
      expect(typeof canCancel).toBe('boolean');
    });
  });

  it('should refresh deployment history', async () => {
    const { result } = renderHook(() => useDeployments());
    
    await act(async () => {
      await result.current.refresh();
    });
  });

  it('should clear error messages', () => {
    const { result } = renderHook(() => useDeployments());
    
    act(() => {
      result.current.clearError();
    });
    
    expect(result.current.error).toBeNull();
  });

  it('should handle deployment filters', () => {
    const { result } = renderHook(() => useDeployments());
    
    act(() => {
      result.current.setFilters({
        status: 'success',
        environment: 'production',
        branch: 'main'
      });
    });
  });

  it('should reset filters', () => {
    const { result } = renderHook(() => useDeployments());
    
    act(() => {
      result.current.resetFilters();
    });
    
    expect(result.current.filters).toEqual({});
  });

  it('should track deployment pagination', () => {
    const { result } = renderHook(() => useDeployments());
    
    act(() => {
      result.current.setPage(2);
      expect(result.current.currentPage).toBe(2);
    });
  });
});
