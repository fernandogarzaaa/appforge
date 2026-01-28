import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFavorites } from '@/hooks/useFavorites';

describe('useFavorites Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useFavorites());
    expect(Array.isArray(result.current.favorites)).toBe(true);
    expect(typeof result.current.isFavorited).toBe('function');
  });

  it('should toggle favorite', () => {
    const { result } = renderHook(() => useFavorites());
    
    const initialCount = result.current.favorites.length;
    
    act(() => {
      result.current.toggleFavorite('project-1');
    });
    
    const newCount = result.current.favorites.length;
    expect(newCount === initialCount + 1 || newCount === initialCount - 1).toBe(true);
  });

  it('should add favorite', () => {
    const { result } = renderHook(() => useFavorites());
    
    act(() => {
      result.current.addFavorite('project-1');
    });
    
    expect(result.current.isFavorited('project-1')).toBe(true);
  });

  it('should remove favorite', () => {
    const { result } = renderHook(() => useFavorites());
    
    act(() => {
      result.current.addFavorite('project-1');
      result.current.removeFavorite('project-1');
    });
    
    expect(result.current.isFavorited('project-1')).toBe(false);
  });

  it('should check if project is favorited', () => {
    const { result } = renderHook(() => useFavorites());
    
    act(() => {
      result.current.addFavorite('project-1');
    });
    
    expect(result.current.isFavorited('project-1')).toBe(true);
    expect(result.current.isFavorited('project-2')).toBe(false);
  });

  it('should get favorite count', () => {
    const { result } = renderHook(() => useFavorites());
    
    act(() => {
      result.current.addFavorite('project-1');
      result.current.addFavorite('project-2');
    });
    
    expect(result.current.getFavoriteCount()).toBe(2);
  });

  it('should clear all favorites', () => {
    const { result } = renderHook(() => useFavorites());
    
    act(() => {
      result.current.addFavorite('project-1');
      result.current.addFavorite('project-2');
      result.current.clearFavorites();
    });
    
    expect(result.current.getFavoriteCount()).toBe(0);
  });

  it('should persist favorites to localStorage', () => {
    const { result } = renderHook(() => useFavorites());
    
    act(() => {
      result.current.addFavorite('project-1');
    });
    
    const stored = localStorage.getItem('favorites');
    expect(stored).not.toBeNull();
    expect(stored).toContain('project-1');
  });

  it('should load favorites from localStorage', () => {
    localStorage.setItem('favorites', JSON.stringify([
      { projectId: 'project-1', timestamp: Date.now() }
    ]));
    
    const { result } = renderHook(() => useFavorites());
    expect(result.current.isFavorited('project-1')).toBe(true);
  });

  it('should sort projects by favorite status', () => {
    const { result } = renderHook(() => useFavorites());
    
    act(() => {
      result.current.addFavorite('project-2');
      result.current.addFavorite('project-4');
    });
    
    const projects = [
      { id: 'project-1' },
      { id: 'project-2' },
      { id: 'project-3' },
      { id: 'project-4' }
    ];
    
    const sorted = result.current.sortByFavorites(projects);
    expect(sorted[0].id === 'project-2' || sorted[0].id === 'project-4').toBe(true);
  });

  it('should get recent favorites', () => {
    const { result } = renderHook(() => useFavorites());
    
    act(() => {
      result.current.addFavorite('project-1');
      result.current.addFavorite('project-2');
      result.current.addFavorite('project-3');
    });
    
    const recent = result.current.getRecentFavorites(2);
    expect(recent.length).toBeLessThanOrEqual(2);
  });

  it('should get all favorite ids', () => {
    const { result } = renderHook(() => useFavorites());
    
    act(() => {
      result.current.addFavorite('project-1');
      result.current.addFavorite('project-2');
    });
    
    const ids = result.current.getFavoriteIds();
    expect(ids).toContain('project-1');
    expect(ids).toContain('project-2');
  });

  it('should handle duplicate favorites gracefully', () => {
    const { result } = renderHook(() => useFavorites());
    
    act(() => {
      result.current.addFavorite('project-1');
      result.current.addFavorite('project-1');
    });
    
    // Should not create duplicates
    const count = result.current.favorites.filter(f => f.projectId === 'project-1').length;
    expect(count).toBe(1);
  });

  it('should provide favorite statistics', () => {
    const { result } = renderHook(() => useFavorites());
    
    act(() => {
      result.current.addFavorite('project-1');
      result.current.addFavorite('project-2');
      result.current.addFavorite('project-3');
    });
    
    expect(result.current.stats).toBeDefined();
    expect(result.current.stats.total).toBe(3);
    expect(result.current.stats.percentage).toBeDefined();
  });

  it('should track favorite timestamps', () => {
    const { result } = renderHook(() => useFavorites());
    
    act(() => {
      result.current.addFavorite('project-1');
    });
    
    const favorite = result.current.favorites.find(f => f.projectId === 'project-1');
    expect(favorite).toBeDefined();
    expect(favorite.timestamp).toBeDefined();
  });

  it('should handle invalid project ids', () => {
    const { result } = renderHook(() => useFavorites());
    
    expect(() => {
      act(() => {
        result.current.addFavorite(null);
      });
    }).not.toThrow();
  });
});
