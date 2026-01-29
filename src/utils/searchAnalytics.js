/**
 * Search Analytics System
 * Tracks and analyzes search behavior, popular queries, and search performance
 */

// In-memory storage for search analytics
const searchAnalyticsStore = {
  queries: [], // All search queries
  popularSearches: new Map(), // Query -> count
  zeroResults: [], // Searches with no results
  metrics: {
    totalSearches: 0,
    avgResponseTime: 0,
    conversionRate: 0,
    refinementRate: 0
  },
  trends: [], // Time-based search trends
  subscribers: new Set()
};

/**
 * SearchAnalytics - Track and analyze search queries
 */
export class SearchAnalytics {
  /**
   * Log a search query
   * @param {Object} queryData - Search query information
   * @param {string} queryData.query - The search query
   * @param {number} queryData.resultCount - Number of results
   * @param {number} queryData.responseTime - Response time in ms
   * @param {Object} queryData.filters - Applied filters
   * @param {string} queryData.userId - User ID (optional)
   * @returns {Object} Logged query data
   */
  static logQuery(queryData) {
    const query = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      query: queryData.query,
      resultCount: queryData.resultCount || 0,
      responseTime: queryData.responseTime || 0,
      filters: queryData.filters || {},
      userId: queryData.userId,
      timestamp: new Date().toISOString(),
      isRefinement: false,
      converted: false
    };

    // Add to queries
    searchAnalyticsStore.queries.push(query);

    // Update popular searches
    const currentCount = searchAnalyticsStore.popularSearches.get(queryData.query) || 0;
    searchAnalyticsStore.popularSearches.set(queryData.query, currentCount + 1);

    // Track zero results
    if (query.resultCount === 0) {
      searchAnalyticsStore.zeroResults.push(query);
    }

    // Update metrics
    searchAnalyticsStore.metrics.totalSearches++;
    this._updateAverageResponseTime(query.responseTime);

    // Notify subscribers
    this._notify();

    return query;
  }

  /**
   * Mark a query as converted (user clicked a result)
   * @param {string} queryId - Query ID
   */
  static markConversion(queryId) {
    const query = searchAnalyticsStore.queries.find(q => q.id === queryId);
    if (query) {
      query.converted = true;
      this._updateConversionRate();
      this._notify();
    }
  }

  /**
   * Mark a query as a refinement of a previous search
   * @param {string} queryId - Query ID
   */
  static markRefinement(queryId) {
    const query = searchAnalyticsStore.queries.find(q => q.id === queryId);
    if (query) {
      query.isRefinement = true;
      this._updateRefinementRate();
      this._notify();
    }
  }

  /**
   * Get popular searches
   * @param {number} limit - Number of results
   * @returns {Array} Popular searches sorted by count
   */
  static getPopularSearches(limit = 10) {
    return Array.from(searchAnalyticsStore.popularSearches.entries())
      .map(([query, count]) => ({
        query,
        count,
        percentage: ((count / searchAnalyticsStore.metrics.totalSearches) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get zero-result searches
   * @param {number} limit - Number of results
   * @returns {Array} Searches with no results
   */
  static getZeroResultSearches(limit = 10) {
    const zeroResultMap = new Map();
    
    searchAnalyticsStore.zeroResults.forEach(query => {
      const count = zeroResultMap.get(query.query) || 0;
      zeroResultMap.set(query.query, count + 1);
    });

    return Array.from(zeroResultMap.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get search trends over time
   * @param {string} period - Time period (hour, day, week, month)
   * @returns {Array} Trend data
   */
  static getTrends(period = 'day') {
    const now = Date.now();
    const periodMs = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    }[period] || 24 * 60 * 60 * 1000;

    const intervals = 24; // Number of data points
    const intervalMs = periodMs / intervals;
    const trends = [];

    for (let i = 0; i < intervals; i++) {
      const startTime = now - (intervals - i) * intervalMs;
      const endTime = startTime + intervalMs;

      const intervalQueries = searchAnalyticsStore.queries.filter(q => {
        const queryTime = new Date(q.timestamp).getTime();
        return queryTime >= startTime && queryTime < endTime;
      });

      trends.push({
        timestamp: new Date(startTime).toISOString(),
        count: intervalQueries.length,
        avgResponseTime: intervalQueries.length > 0
          ? intervalQueries.reduce((sum, q) => sum + q.responseTime, 0) / intervalQueries.length
          : 0,
        zeroResults: intervalQueries.filter(q => q.resultCount === 0).length
      });
    }

    return trends;
  }

  /**
   * Get overall search metrics
   * @returns {Object} Metrics data
   */
  static getMetrics() {
    return {
      ...searchAnalyticsStore.metrics,
      totalQueries: searchAnalyticsStore.queries.length,
      uniqueQueries: searchAnalyticsStore.popularSearches.size,
      zeroResultCount: searchAnalyticsStore.zeroResults.length,
      zeroResultRate: ((searchAnalyticsStore.zeroResults.length / searchAnalyticsStore.metrics.totalSearches) * 100).toFixed(1)
    };
  }

  /**
   * Get recent searches
   * @param {number} limit - Number of results
   * @returns {Array} Recent search queries
   */
  static getRecentSearches(limit = 10) {
    return searchAnalyticsStore.queries
      .slice(-limit)
      .reverse()
      .map(q => ({
        query: q.query,
        resultCount: q.resultCount,
        timestamp: q.timestamp,
        converted: q.converted
      }));
  }

  /**
   * Get filter usage statistics
   * @returns {Array} Filter usage data
   */
  static getFilterUsage() {
    const filterStats = {};

    searchAnalyticsStore.queries.forEach(query => {
      Object.keys(query.filters).forEach(filterKey => {
        if (!filterStats[filterKey]) {
          filterStats[filterKey] = { count: 0, values: new Map() };
        }
        filterStats[filterKey].count++;
        
        const value = query.filters[filterKey];
        const valueCount = filterStats[filterKey].values.get(value) || 0;
        filterStats[filterKey].values.set(value, valueCount + 1);
      });
    });

    return Object.entries(filterStats).map(([filter, data]) => ({
      filter,
      count: data.count,
      topValues: Array.from(data.values.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    }));
  }

  /**
   * Export analytics data
   * @returns {Object} Complete analytics data
   */
  static exportData() {
    return {
      queries: searchAnalyticsStore.queries,
      popularSearches: this.getPopularSearches(50),
      zeroResults: this.getZeroResultSearches(50),
      metrics: this.getMetrics(),
      trends: this.getTrends('week'),
      filterUsage: this.getFilterUsage(),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Clear analytics data
   */
  static clearData() {
    searchAnalyticsStore.queries = [];
    searchAnalyticsStore.popularSearches.clear();
    searchAnalyticsStore.zeroResults = [];
    searchAnalyticsStore.metrics = {
      totalSearches: 0,
      avgResponseTime: 0,
      conversionRate: 0,
      refinementRate: 0
    };
    searchAnalyticsStore.trends = [];
    this._notify();
  }

  /**
   * Subscribe to analytics updates
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  static subscribe(callback) {
    searchAnalyticsStore.subscribers.add(callback);
    return () => searchAnalyticsStore.subscribers.delete(callback);
  }

  // Private methods
  static _updateAverageResponseTime(newResponseTime) {
    const total = searchAnalyticsStore.metrics.totalSearches;
    const current = searchAnalyticsStore.metrics.avgResponseTime;
    searchAnalyticsStore.metrics.avgResponseTime = 
      ((current * (total - 1)) + newResponseTime) / total;
  }

  static _updateConversionRate() {
    const converted = searchAnalyticsStore.queries.filter(q => q.converted).length;
    searchAnalyticsStore.metrics.conversionRate = 
      (converted / searchAnalyticsStore.metrics.totalSearches) * 100;
  }

  static _updateRefinementRate() {
    const refined = searchAnalyticsStore.queries.filter(q => q.isRefinement).length;
    searchAnalyticsStore.metrics.refinementRate = 
      (refined / searchAnalyticsStore.metrics.totalSearches) * 100;
  }

  static _notify() {
    searchAnalyticsStore.subscribers.forEach(callback => callback());
  }
}

/**
 * Hook for search analytics in React components
 */
export function useSearchAnalytics() {
  const [metrics, setMetrics] = React.useState(() => SearchAnalytics.getMetrics());

  React.useEffect(() => {
    const unsubscribe = SearchAnalytics.subscribe(() => {
      setMetrics(SearchAnalytics.getMetrics());
    });
    return unsubscribe;
  }, []);

  return {
    metrics,
    logQuery: SearchAnalytics.logQuery.bind(SearchAnalytics),
    markConversion: SearchAnalytics.markConversion.bind(SearchAnalytics),
    markRefinement: SearchAnalytics.markRefinement.bind(SearchAnalytics),
    getPopularSearches: SearchAnalytics.getPopularSearches.bind(SearchAnalytics),
    getZeroResultSearches: SearchAnalytics.getZeroResultSearches.bind(SearchAnalytics),
    getTrends: SearchAnalytics.getTrends.bind(SearchAnalytics),
    getRecentSearches: SearchAnalytics.getRecentSearches.bind(SearchAnalytics),
    getFilterUsage: SearchAnalytics.getFilterUsage.bind(SearchAnalytics),
    exportData: SearchAnalytics.exportData.bind(SearchAnalytics),
    clearData: SearchAnalytics.clearData.bind(SearchAnalytics)
  };
}

export default SearchAnalytics;
