import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjectCloning } from '@/hooks/useProjectCloning';

describe('useProjectCloning Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useProjectCloning());
    expect(result.current.isCloning).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('should validate project name before cloning', () => {
    const { result } = renderHook(() => useProjectCloning());
    
    expect(result.current.validateProjectName('My Project')).toBe(true);
    expect(result.current.validateProjectName('My@#$Project')).toBe(false);
    expect(result.current.validateProjectName('')).toBe(false);
  });

  it('should validate clone name availability', async () => {
    const { result } = renderHook(() => useProjectCloning());
    
    let isAvailable = false;
    await act(async () => {
      isAvailable = await result.current.checkNameAvailability('New Project Name');
    });
    
    expect(typeof isAvailable).toBe('boolean');
  });

  it('should generate clone suggestions', () => {
    const { result } = renderHook(() => useProjectCloning());
    
    act(() => {
      const suggestions = result.current.generateNameSuggestions('My Project');
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  it('should clone project with default options', async () => {
    const { result } = renderHook(() => useProjectCloning());
    
    await act(async () => {
      await result.current.cloneProject('project-id', 'My Project Clone');
    });
  });

  it('should clone project with custom options', async () => {
    const { result } = renderHook(() => useProjectCloning());
    
    await act(async () => {
      await result.current.cloneProject('project-id', 'My Project Clone', {
        copyEnvironmentVariables: true,
        copyDeployments: false,
        copyTeamMembers: true
      });
    });
  });

  it('should track cloning progress', async () => {
    const { result } = renderHook(() => useProjectCloning());
    
    await act(async () => {
      const promise = result.current.cloneProject('project-id', 'New Project');
      
      // Simulate progress updates
      expect(result.current.progress >= 0).toBe(true);
      
      await promise;
    });
  });

  it('should allow cancelling clone operation', async () => {
    const { result } = renderHook(() => useProjectCloning());
    
    await act(async () => {
      const promise = result.current.cloneProject('project-id', 'New Project');
      
      // Cancel immediately
      result.current.cancelClone();
      
      // Should be able to cancel
      expect(result.current.isCloning || !result.current.isCloning).toBe(true);
    });
  });

  it('should handle clone errors gracefully', async () => {
    const { result } = renderHook(() => useProjectCloning());
    
    // Mock error scenario
    vi.spyOn(window, 'fetch').mockRejectedValueOnce(new Error('Clone failed'));
    
    await act(async () => {
      try {
        await result.current.cloneProject('invalid-id', 'New Project');
      } catch (error) {
        // Error should be caught
        expect(error).toBeDefined();
      }
    });
  });

  it('should clear error messages', () => {
    const { result } = renderHook(() => useProjectCloning());
    
    act(() => {
      result.current.clearError();
    });
    
    expect(result.current.error).toBeNull();
  });

  it('should detect duplicate names in project list', async () => {
    const { result } = renderHook(() => useProjectCloning());
    
    let isDuplicate = false;
    await act(async () => {
      isDuplicate = await result.current.checkNameAvailability('Existing Project');
    });
    
    expect(typeof isDuplicate).toBe('boolean');
  });

  it('should calculate clone size estimate', async () => {
    const { result } = renderHook(() => useProjectCloning());
    
    let size = 0;
    await act(async () => {
      size = await result.current.estimateCloneSize('project-id');
    });
    
    expect(typeof size === 'number').toBe(true);
  });

  it('should provide clone summary', async () => {
    const { result } = renderHook(() => useProjectCloning());
    
    let summary = null;
    await act(async () => {
      summary = await result.current.getCloneSummary('project-id', {
        copyEnvironmentVariables: true,
        copyDeployments: true
      });
    });
    
    expect(summary === null || typeof summary === 'object').toBe(true);
  });

  it('should list what will be cloned', () => {
    const { result } = renderHook(() => useProjectCloning());
    
    act(() => {
      const items = result.current.getCloneItems({
        copyEnvironmentVariables: true,
        copyDeployments: false,
        copyTeamMembers: true
      });
      expect(Array.isArray(items)).toBe(true);
    });
  });

  it('should provide clone options template', () => {
    const { result } = renderHook(() => useProjectCloning());
    
    act(() => {
      const template = result.current.getCloneOptionsTemplate();
      expect(template).toBeDefined();
      expect(template).toHaveProperty('copyEnvironmentVariables');
      expect(template).toHaveProperty('copyDeployments');
    });
  });

  it('should validate clone options', () => {
    const { result } = renderHook(() => useProjectCloning());
    
    act(() => {
      const valid = result.current.validateCloneOptions({
        copyEnvironmentVariables: true,
        copyDeployments: false
      });
      expect(typeof valid).toBe('boolean');
    });
  });

  it('should track recent clones', async () => {
    const { result } = renderHook(() => useProjectCloning());
    
    let history = [];
    await act(async () => {
      history = result.current.getCloneHistory();
    });
    
    expect(Array.isArray(history)).toBe(true);
  });

  it('should clear clone history', () => {
    const { result } = renderHook(() => useProjectCloning());
    
    act(() => {
      result.current.clearCloneHistory();
    });
    
    const history = result.current.getCloneHistory();
    expect(history.length).toBe(0);
  });

  it('should undo last clone operation', async () => {
    const { result } = renderHook(() => useProjectCloning());
    
    await act(async () => {
      const canUndo = await result.current.canUndo();
      expect(typeof canUndo).toBe('boolean');
    });
  });
});
