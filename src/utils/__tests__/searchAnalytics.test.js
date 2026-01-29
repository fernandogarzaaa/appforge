import { describe, it, expect, beforeEach } from 'vitest';
import { SearchAnalytics } from '../searchAnalytics';

describe('SearchAnalytics', () => {
  beforeEach(() => {
    SearchAnalytics.clearData();
  });

  describe('logQuery', () => {
    it('should log a search query', () => {
      const query = SearchAnalytics.logQuery({
        query: 'test search',
        resultCount: 10,
        responseTime: 100,
        filters: { category: 'all' },
        userId: 'user1'
      });

      expect(query).toHaveProperty('id');
      expect(query.query).toBe('test search');
      expect(query.resultCount).toBe(10);
      expect(query.responseTime).toBe(100);
      expect(query.converted).toBe(false);
    });

    it('should track zero-result searches', () => {
      SearchAnalytics.logQuery({
        query: 'no results',
        resultCount: 0,
        responseTime: 50
      });

      const metrics = SearchAnalytics.getMetrics();
      expect(metrics.zeroResultCount).toBe(1);
    });

    it('should update popular searches', () => {
      SearchAnalytics.logQuery({ query: 'popular', resultCount: 5 });
      SearchAnalytics.logQuery({ query: 'popular', resultCount: 3 });

      const popular = SearchAnalytics.getPopularSearches(5);
      expect(popular[0].query).toBe('popular');
      expect(popular[0].count).toBe(2);
    });
  });

  describe('markConversion', () => {
    it('should mark a query as converted', () => {
      const query = SearchAnalytics.logQuery({
        query: 'convertible',
        resultCount: 5
      });

      SearchAnalytics.markConversion(query.id);

      const metrics = SearchAnalytics.getMetrics();
      expect(metrics.conversionRate).toBeGreaterThan(0);
    });
  });

  describe('markRefinement', () => {
    it('should mark a query as refinement', () => {
      const query = SearchAnalytics.logQuery({
        query: 'refined search',
        resultCount: 10
      });

      SearchAnalytics.markRefinement(query.id);

      const metrics = SearchAnalytics.getMetrics();
      expect(metrics.refinementRate).toBeGreaterThan(0);
    });
  });

  describe('getPopularSearches', () => {
    it('should return popular searches sorted by count', () => {
      SearchAnalytics.logQuery({ query: 'search1', resultCount: 1 });
      SearchAnalytics.logQuery({ query: 'search2', resultCount: 1 });
      SearchAnalytics.logQuery({ query: 'search2', resultCount: 1 });
      SearchAnalytics.logQuery({ query: 'search3', resultCount: 1 });
      SearchAnalytics.logQuery({ query: 'search3', resultCount: 1 });
      SearchAnalytics.logQuery({ query: 'search3', resultCount: 1 });

      const popular = SearchAnalytics.getPopularSearches(3);
      expect(popular).toHaveLength(3);
      expect(popular[0].query).toBe('search3');
      expect(popular[0].count).toBe(3);
      expect(popular[1].query).toBe('search2');
      expect(popular[1].count).toBe(2);
    });

    it('should limit results', () => {
      for (let i = 0; i < 20; i++) {
        SearchAnalytics.logQuery({ query: `search${i}`, resultCount: 1 });
      }

      const popular = SearchAnalytics.getPopularSearches(5);
      expect(popular).toHaveLength(5);
    });
  });

  describe('getZeroResultSearches', () => {
    it('should return searches with no results', () => {
      SearchAnalytics.logQuery({ query: 'has results', resultCount: 10 });
      SearchAnalytics.logQuery({ query: 'no results 1', resultCount: 0 });
      SearchAnalytics.logQuery({ query: 'no results 2', resultCount: 0 });

      const zeroResults = SearchAnalytics.getZeroResultSearches();
      expect(zeroResults).toHaveLength(2);
    });

    it('should count duplicate zero-result searches', () => {
      SearchAnalytics.logQuery({ query: 'failed', resultCount: 0 });
      SearchAnalytics.logQuery({ query: 'failed', resultCount: 0 });

      const zeroResults = SearchAnalytics.getZeroResultSearches();
      expect(zeroResults[0].count).toBe(2);
    });
  });

  describe('getTrends', () => {
    it('should return trend data for specified period', () => {
      SearchAnalytics.logQuery({ query: 'trend test', resultCount: 5, responseTime: 100 });

      const trends = SearchAnalytics.getTrends('day');
      expect(trends).toHaveLength(24);
      expect(trends[0]).toHaveProperty('timestamp');
      expect(trends[0]).toHaveProperty('count');
      expect(trends[0]).toHaveProperty('avgResponseTime');
    });

    it('should support different time periods', () => {
      const hourTrends = SearchAnalytics.getTrends('hour');
      const dayTrends = SearchAnalytics.getTrends('day');
      const weekTrends = SearchAnalytics.getTrends('week');

      expect(hourTrends).toHaveLength(24);
      expect(dayTrends).toHaveLength(24);
      expect(weekTrends).toHaveLength(24);
    });
  });

  describe('getMetrics', () => {
    it('should return overall metrics', () => {
      SearchAnalytics.logQuery({ query: 'test', resultCount: 5, responseTime: 100 });
      SearchAnalytics.logQuery({ query: 'test2', resultCount: 0, responseTime: 50 });

      const metrics = SearchAnalytics.getMetrics();
      expect(metrics.totalQueries).toBe(2);
      expect(metrics.uniqueQueries).toBe(2);
      expect(metrics.zeroResultCount).toBe(1);
      expect(metrics.avgResponseTime).toBeGreaterThan(0);
    });

    it('should calculate zero result rate', () => {
      SearchAnalytics.logQuery({ query: 'success', resultCount: 10 });
      SearchAnalytics.logQuery({ query: 'fail', resultCount: 0 });

      const metrics = SearchAnalytics.getMetrics();
      expect(metrics.zeroResultRate).toBe('50.0');
    });
  });

  describe('getRecentSearches', () => {
    it('should return recent searches in reverse order', () => {
      SearchAnalytics.logQuery({ query: 'first', resultCount: 1 });
      SearchAnalytics.logQuery({ query: 'second', resultCount: 2 });
      SearchAnalytics.logQuery({ query: 'third', resultCount: 3 });

      const recent = SearchAnalytics.getRecentSearches(3);
      expect(recent).toHaveLength(3);
      expect(recent[0].query).toBe('third');
      expect(recent[2].query).toBe('first');
    });

    it('should limit results', () => {
      for (let i = 0; i < 20; i++) {
        SearchAnalytics.logQuery({ query: `search${i}`, resultCount: 1 });
      }

      const recent = SearchAnalytics.getRecentSearches(5);
      expect(recent).toHaveLength(5);
    });
  });

  describe('getFilterUsage', () => {
    it('should track filter usage', () => {
      SearchAnalytics.logQuery({
        query: 'test',
        resultCount: 1,
        filters: { category: 'all', status: 'active' }
      });

      const filterUsage = SearchAnalytics.getFilterUsage();
      expect(filterUsage).toHaveLength(2);
      expect(filterUsage.find(f => f.filter === 'category')).toBeDefined();
    });

    it('should count filter value occurrences', () => {
      SearchAnalytics.logQuery({ query: 'q1', resultCount: 1, filters: { type: 'project' } });
      SearchAnalytics.logQuery({ query: 'q2', resultCount: 1, filters: { type: 'project' } });
      SearchAnalytics.logQuery({ query: 'q3', resultCount: 1, filters: { type: 'entity' } });

      const filterUsage = SearchAnalytics.getFilterUsage();
      const typeFilter = filterUsage.find(f => f.filter === 'type');
      expect(typeFilter.topValues[0].value).toBe('project');
      expect(typeFilter.topValues[0].count).toBe(2);
    });
  });

  describe('exportData', () => {
    it('should export all analytics data', () => {
      SearchAnalytics.logQuery({ query: 'export test', resultCount: 5 });

      const exported = SearchAnalytics.exportData();
      expect(exported).toHaveProperty('queries');
      expect(exported).toHaveProperty('popularSearches');
      expect(exported).toHaveProperty('metrics');
      expect(exported).toHaveProperty('exportedAt');
    });
  });

  describe('clearData', () => {
    it('should clear all analytics data', () => {
      SearchAnalytics.logQuery({ query: 'test', resultCount: 5 });
      SearchAnalytics.clearData();

      const metrics = SearchAnalytics.getMetrics();
      expect(metrics.totalQueries).toBe(0);
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers on data changes', () => {
      let notified = false;
      const unsubscribe = SearchAnalytics.subscribe(() => {
        notified = true;
      });

      SearchAnalytics.logQuery({ query: 'notification test', resultCount: 1 });
      expect(notified).toBe(true);

      unsubscribe();
    });

    it('should allow unsubscribe', () => {
      let count = 0;
      const unsubscribe = SearchAnalytics.subscribe(() => {
        count++;
      });

      SearchAnalytics.logQuery({ query: 'test1', resultCount: 1 });
      expect(count).toBe(1);

      unsubscribe();

      SearchAnalytics.logQuery({ query: 'test2', resultCount: 1 });
      expect(count).toBe(1); // Should not increment
    });
  });
});
