import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearch } from '@/hooks/useSearch';

describe('useSearch Hook', () => {
  const mockData = [
    { id: '1', name: 'Authentication Service', type: 'project' },
    { id: '2', name: 'API Gateway', type: 'project' },
    { id: '3', name: 'User Database', type: 'project' },
    { id: '4', name: 'Auth UI', type: 'component' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSearch(mockData));
    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual(mockData);
    expect(result.current.isSearching).toBe(false);
  });

  it('should perform fuzzy search', () => {
    const { result } = renderHook(() => useSearch(mockData));
    
    act(() => {
      result.current.search('auth');
    });
    
    expect(result.current.results.length).toBeGreaterThan(0);
    expect(result.current.query).toBe('auth');
  });

  it('should be case insensitive', () => {
    const { result } = renderHook(() => useSearch(mockData));
    
    let result1Count = 0;
    let result2Count = 0;
    
    act(() => {
      result.current.search('Auth');
      result1Count = result.current.results.length;
    });
    
    act(() => {
      result.current.search('AUTH');
      result2Count = result.current.results.length;
    });
    
    expect(result1Count).toBe(result2Count);
  });

  it('should filter results by type', () => {
    const { result } = renderHook(() => useSearch(mockData));
    
    act(() => {
      result.current.filterByType('project');
    });
    
    expect(result.current.filteredResults.every(item => item.type === 'project')).toBe(true);
  });

  it('should clear search', () => {
    const { result } = renderHook(() => useSearch(mockData));
    
    act(() => {
      result.current.search('test');
      result.current.clearSearch();
    });
    
    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual(mockData);
  });

  it('should highlight search matches', () => {
    const { result } = renderHook(() => useSearch(mockData));
    
    act(() => {
      result.current.search('auth');
    });
    
    const highlighted = result.current.getHighlightedResults();
    expect(Array.isArray(highlighted)).toBe(true);
  });

  it('should get search suggestions', () => {
    const { result } = renderHook(() => useSearch(mockData));
    
    act(() => {
      result.current.search('au');
    });
    
    const suggestions = result.current.getSuggestions();
    expect(Array.isArray(suggestions)).toBe(true);
  });

  it('should track search history', () => {
    const { result } = renderHook(() => useSearch(mockData));
    
    act(() => {
      result.current.search('auth');
      result.current.search('api');
      result.current.search('database');
    });
    
    const history = result.current.getSearchHistory();
    expect(history.length).toBeGreaterThan(0);
    expect(history).toContain('auth');
  });

  it('should clear search history', () => {
    const { result } = renderHook(() => useSearch(mockData));
    
    act(() => {
      result.current.search('auth');
      result.current.clearHistory();
    });
    
    const history = result.current.getSearchHistory();
    expect(history.length).toBe(0);
  });

  it('should handle empty search query', () => {
    const { result } = renderHook(() => useSearch(mockData));
    
    act(() => {
      result.current.search('');
    });
    
    expect(result.current.results).toEqual(mockData);
  });

  it('should handle no matches', () => {
    const { result } = renderHook(() => useSearch(mockData));
    
    act(() => {
      result.current.search('xyz123xyz');
    });
    
    expect(result.current.results.length).toBe(0);
  });

  it('should search with regex patterns', () => {
    const { result } = renderHook(() => useSearch(mockData));
    
    act(() => {
      result.current.searchRegex(/^[A-Z]/);
    });
    
    expect(result.current.results.length).toBeGreaterThan(0);
  });

  it('should provide search statistics', () => {
    const { result } = renderHook(() => useSearch(mockData));
    
    act(() => {
      result.current.search('auth');
    });
    
    expect(result.current.stats).toBeDefined();
    expect(result.current.stats).toHaveProperty('totalResults');
    expect(result.current.stats).toHaveProperty('queryLength');
  });

  it('should debounce search input', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSearch(mockData));
    
    act(() => {
      result.current.search('a');
      result.current.search('au');
      result.current.search('auth');
    });
    
    expect(result.current.isSearching).toBe(true);
    
    vi.runAllTimers();
    vi.useRealTimers();
  });

  it('should rank results by relevance', () => {
    const { result } = renderHook(() => useSearch(mockData));
    
    act(() => {
      result.current.search('auth');
    });
    
    const ranked = result.current.getRankedResults();
    if (ranked.length > 1) {
      const score1 = ranked[0].score || 0;
      const score2 = ranked[1].score || 0;
      expect(score1).toBeGreaterThanOrEqual(score2);
    }
  });

  it('should sort results', () => {
    const { result } = renderHook(() => useSearch(mockData));
    
    act(() => {
      result.current.sortResults('name', 'asc');
    });
    
    expect(Array.isArray(result.current.results)).toBe(true);
  });

  it('should handle search with empty data', () => {
    const { result } = renderHook(() => useSearch([]));
    
    act(() => {
      result.current.search('test');
    });
    
    expect(result.current.results.length).toBe(0);
  });

  it('should reset to initial state', () => {
    const { result } = renderHook(() => useSearch(mockData));
    
    act(() => {
      result.current.search('auth');
      result.current.reset();
    });
    
    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual(mockData);
    expect(result.current.isSearching).toBe(false);
  });
});
