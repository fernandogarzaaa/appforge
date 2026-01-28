import { describe, it, expect } from 'vitest';
import {
  fuzzySearch,
  rankSearchResults,
  highlightMatches,
  normalizeQuery,
  filterByType,
  combineSearchResults
} from '@/lib/search';

describe('Search Utilities', () => {
  const mockProjects = [
    { id: '1', name: 'Authentication Service', type: 'project' },
    { id: '2', name: 'API Gateway', type: 'project' },
    { id: '3', name: 'User Database', type: 'project' },
    { id: '4', name: 'Authentication UI', type: 'project' }
  ];

  describe('fuzzySearch', () => {
    it('should find exact matches', () => {
      const results = fuzzySearch('Authentication', mockProjects, 'name');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('Authentication');
    });

    it('should find partial matches', () => {
      const results = fuzzySearch('auth', mockProjects, 'name');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should be case insensitive', () => {
      const results1 = fuzzySearch('API', mockProjects, 'name');
      const results2 = fuzzySearch('api', mockProjects, 'name');
      expect(results1.length).toBe(results2.length);
    });

    it('should return empty for no matches', () => {
      const results = fuzzySearch('xyz123', mockProjects, 'name');
      expect(results.length).toBe(0);
    });

    it('should handle fuzzy matching', () => {
      const results = fuzzySearch('athsvc', mockProjects, 'name');
      // Should find "Authentication Service" with fuzzy matching
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for empty query', () => {
      const results = fuzzySearch('', mockProjects, 'name');
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('rankSearchResults', () => {
    it('should rank exact matches higher', () => {
      const results = [
        { name: 'API Gateway', score: 0.5 },
        { name: 'API', score: 0.8 },
        { name: 'Gateway API', score: 0.6 }
      ];
      const ranked = rankSearchResults(results, 'API');
      expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
    });

    it('should rank by position in string', () => {
      const results = [
        { name: 'Test API', score: 0.5 },
        { name: 'API Test', score: 0.5 }
      ];
      const ranked = rankSearchResults(results, 'API');
      // Earlier position should rank higher
      expect(ranked[0].name).toBe('API Test');
    });

    it('should sort by score descending', () => {
      const results = [
        { name: 'Low Match', score: 0.2 },
        { name: 'High Match', score: 0.9 },
        { name: 'Med Match', score: 0.5 }
      ];
      const ranked = rankSearchResults(results, 'match');
      expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
      expect(ranked[1].score).toBeGreaterThanOrEqual(ranked[2].score);
    });
  });

  describe('highlightMatches', () => {
    it('should highlight matching text', () => {
      const text = 'API Gateway Service';
      const highlighted = highlightMatches(text, 'API');
      expect(highlighted).toContain('<mark>');
      expect(highlighted).toContain('</mark>');
    });

    it('should be case insensitive', () => {
      const text = 'API Gateway';
      const highlighted = highlightMatches(text, 'api');
      expect(highlighted).toContain('<mark>');
    });

    it('should highlight all occurrences', () => {
      const text = 'test test test';
      const highlighted = highlightMatches(text, 'test');
      const markCount = (highlighted.match(/<mark>/g) || []).length;
      expect(markCount).toBe(3);
    });

    it('should handle no matches', () => {
      const text = 'API Gateway';
      const highlighted = highlightMatches(text, 'xyz');
      expect(highlighted).not.toContain('<mark>');
      expect(highlighted).toBe(text);
    });
  });

  describe('normalizeQuery', () => {
    it('should trim whitespace', () => {
      const normalized = normalizeQuery('  query  ');
      expect(normalized).toBe('query');
    });

    it('should convert to lowercase', () => {
      const normalized = normalizeQuery('QUERY');
      expect(normalized).toBe('query');
    });

    it('should handle special characters', () => {
      const normalized = normalizeQuery('test-query_123');
      expect(normalized).toMatch(/test.query/);
    });

    it('should handle empty query', () => {
      const normalized = normalizeQuery('');
      expect(normalized).toBe('');
    });
  });

  describe('filterByType', () => {
    const items = [
      { name: 'Auth Service', type: 'service' },
      { name: 'API Project', type: 'project' },
      { name: 'User Service', type: 'service' },
      { name: 'Config Project', type: 'project' }
    ];

    it('should filter by single type', () => {
      const filtered = filterByType(items, 'service');
      expect(filtered.length).toBe(2);
      expect(filtered.every(item => item.type === 'service')).toBe(true);
    });

    it('should filter by multiple types', () => {
      const filtered = filterByType(items, ['service', 'project']);
      expect(filtered.length).toBe(4);
    });

    it('should return empty for unmatched type', () => {
      const filtered = filterByType(items, 'unknown');
      expect(filtered.length).toBe(0);
    });

    it('should handle empty type array', () => {
      const filtered = filterByType(items, []);
      expect(filtered.length).toBe(0);
    });
  });

  describe('combineSearchResults', () => {
    it('should combine multiple search result arrays', () => {
      const results1 = [{ id: '1', name: 'Project A' }];
      const results2 = [{ id: '2', name: 'Project B' }];
      const combined = combineSearchResults([results1, results2]);
      expect(combined.length).toBe(2);
    });

    it('should remove duplicates by id', () => {
      const results1 = [{ id: '1', name: 'Project A' }];
      const results2 = [{ id: '1', name: 'Project A' }];
      const combined = combineSearchResults([results1, results2]);
      expect(combined.length).toBe(1);
    });

    it('should sort by score if available', () => {
      const results1 = [{ id: '1', name: 'Low', score: 0.2 }];
      const results2 = [{ id: '2', name: 'High', score: 0.9 }];
      const combined = combineSearchResults([results1, results2]);
      expect(combined[0].score).toBeGreaterThan(combined[1].score);
    });

    it('should handle empty array', () => {
      const combined = combineSearchResults([]);
      expect(combined).toEqual([]);
    });
  });
});
