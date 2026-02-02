/**
 * Analytics Service
 * Centralized event tracking for models, sidebar interactions, and performance metrics
 */

import { persistenceService } from '@/api/services';

const STORAGE_KEY = 'appforge_analytics';
const PERFORMANCE_KEY = 'appforge_performance';

/**
 * Event types for tracking
 */
export const EventTypes = {
  MODEL_SELECTED: 'model_selected',
  SEARCH_QUERY: 'search_query',
  KEYBOARD_SHORTCUT: 'keyboard_shortcut',
  DRAWER_OPENED: 'drawer_opened',
  DRAWER_CLOSED: 'drawer_closed',
  SECTION_COLLAPSED: 'section_collapsed',
  SECTION_EXPANDED: 'section_expanded',
  ADVANCED_OPTIONS_TOGGLED: 'advanced_options_toggled',
};

class AnalyticsService {
  constructor() {
    this.events = this.loadEvents();
    this.performanceMetrics = this.loadPerformanceMetrics();
  }

  /**
   * Track an event
   */
  trackEvent(eventType, eventData = {}) {
    const event = {
      type: eventType,
      timestamp: new Date().toISOString(),
      data: eventData,
      id: `${eventType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.events.push(event);
    this.saveEvents();

    // Fire-and-forget persistence to backend
    persistenceService.recordAnalyticsEvent({
      event: eventType,
      properties: eventData,
      metadata: { localId: event.id }
    }).catch(() => {
      // Swallow errors to avoid breaking UX; local cache remains
    });
    return event;
  }

  /**
   * Track model selection with detailed info
   */
  trackModelSelection(modelId, modelName, provider, costPerKToken) {
    return this.trackEvent(EventTypes.MODEL_SELECTED, {
      modelId,
      modelName,
      provider,
      costPerKToken,
    });
  }

  /**
   * Track search query
   */
  trackSearchQuery(query, resultCount) {
    return this.trackEvent(EventTypes.SEARCH_QUERY, {
      query,
      resultCount,
    });
  }

  /**
   * Track keyboard shortcut usage
   */
  trackKeyboardShortcut(key, modelName) {
    return this.trackEvent(EventTypes.KEYBOARD_SHORTCUT, {
      key,
      modelName,
    });
  }

  /**
   * Track drawer interactions
   */
  trackDrawerOpened() {
    return this.trackEvent(EventTypes.DRAWER_OPENED);
  }

  trackDrawerClosed() {
    return this.trackEvent(EventTypes.DRAWER_CLOSED);
  }

  /**
   * Track accordion section interactions
   */
  trackSectionCollapsed(sectionName) {
    return this.trackEvent(EventTypes.SECTION_COLLAPSED, { sectionName });
  }

  trackSectionExpanded(sectionName) {
    return this.trackEvent(EventTypes.SECTION_EXPANDED, { sectionName });
  }

  /**
   * Track advanced options toggle
   */
  trackAdvancedOptionsToggled(isOpen) {
    return this.trackEvent(EventTypes.ADVANCED_OPTIONS_TOGGLED, { isOpen });
  }

  /**
   * Record performance metric
   */
  recordPerformanceMetric(metricName, duration, metadata = {}) {
    const metric = {
      name: metricName,
      duration,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.performanceMetrics.push(metric);
    this.savePerformanceMetrics();
    return metric;
  }

  /**
   * Get all events
   */
  getEvents() {
    return [...this.events];
  }

  /**
   * Get events filtered by type
   */
  getEventsByType(eventType) {
    return this.events.filter((e) => e.type === eventType);
  }

  /**
   * Get events within time range (milliseconds ago)
   */
  getEventsInTimeRange(millisecondsBefore = 24 * 60 * 60 * 1000) {
    const cutoffTime = new Date(Date.now() - millisecondsBefore);
    return this.events.filter(
      (e) => new Date(e.timestamp) >= cutoffTime
    );
  }

  /**
   * Get model selection statistics
   */
  getModelSelectionStats() {
    const modelSelectionEvents = this.getEventsByType(EventTypes.MODEL_SELECTED);
    const stats = {};

    modelSelectionEvents.forEach((event) => {
      const { modelName, provider } = event.data;
      const key = `${modelName} (${provider})`;

      if (!stats[key]) {
        stats[key] = {
          modelName,
          provider,
          count: 0,
          lastSelected: null,
          firstSelected: null,
        };
      }

      stats[key].count += 1;
      stats[key].lastSelected = event.timestamp;
      if (!stats[key].firstSelected) {
        stats[key].firstSelected = event.timestamp;
      }
    });

    return Object.values(stats).sort((a, b) => b.count - a.count);
  }

  /**
   * Get top models by selection count
   */
  getTopModels(limit = 10) {
    return this.getModelSelectionStats().slice(0, limit);
  }

  /**
   * Get search analytics
   */
  getSearchAnalytics() {
    const searchEvents = this.getEventsByType(EventTypes.SEARCH_QUERY);
    const queryStats = {};

    searchEvents.forEach((event) => {
      const { query } = event.data;
      if (!queryStats[query]) {
        queryStats[query] = {
          query,
          count: 0,
          lastSearched: null,
        };
      }
      queryStats[query].count += 1;
      queryStats[query].lastSearched = event.timestamp;
    });

    return Object.values(queryStats).sort((a, b) => b.count - a.count);
  }

  /**
   * Get keyboard shortcut usage
   */
  getKeyboardShortcutStats() {
    const shortcutEvents = this.getEventsByType(EventTypes.KEYBOARD_SHORTCUT);
    const stats = {};

    shortcutEvents.forEach((event) => {
      const { key, modelName } = event.data;
      if (!stats[key]) {
        stats[key] = { key, count: 0, lastUsed: null, modelsUsed: new Set() };
      }
      stats[key].count += 1;
      stats[key].lastUsed = event.timestamp;
      stats[key].modelsUsed.add(modelName);
    });

    // Convert Sets to arrays for serialization
    Object.keys(stats).forEach((key) => {
      stats[key].modelsUsed = Array.from(stats[key].modelsUsed);
    });

    return Object.values(stats).sort((a, b) => b.count - a.count);
  }

  /**
   * Get interaction summary
   */
  getInteractionSummary(timeRangeMs = 24 * 60 * 60 * 1000) {
    const recentEvents = this.getEventsInTimeRange(timeRangeMs);
    const summary = {
      totalEvents: recentEvents.length,
      eventBreakdown: {},
      topModels: this.getTopModels(5),
      topSearches: this.getSearchAnalytics().slice(0, 5),
      keyboardShortcutUsage: this.getKeyboardShortcutStats().slice(0, 5),
    };

    recentEvents.forEach((event) => {
      if (!summary.eventBreakdown[event.type]) {
        summary.eventBreakdown[event.type] = 0;
      }
      summary.eventBreakdown[event.type] += 1;
    });

    return summary;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(metricName = null) {
    if (metricName) {
      return this.performanceMetrics.filter((m) => m.name === metricName);
    }
    return [...this.performanceMetrics];
  }

  /**
   * Get average performance metric
   */
  getAveragePerformanceMetric(metricName) {
    const metrics = this.getPerformanceMetrics(metricName);
    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((acc, m) => acc + m.duration, 0);
    return sum / metrics.length;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const uniqueMetrics = [...new Set(this.performanceMetrics.map((m) => m.name))];
    const summary = {};

    uniqueMetrics.forEach((metricName) => {
      const metrics = this.getPerformanceMetrics(metricName);
      const durations = metrics.map((m) => m.duration);

      summary[metricName] = {
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        min: Math.min(...durations),
        max: Math.max(...durations),
        count: durations.length,
      };
    });

    return summary;
  }

  /**
   * Clear all analytics data
   */
  clearAllData() {
    this.events = [];
    this.performanceMetrics = [];
    this.saveEvents();
    this.savePerformanceMetrics();
  }

  /**
   * Export analytics data as JSON
   */
  exportData() {
    return {
      events: this.events,
      performanceMetrics: this.performanceMetrics,
      exportDate: new Date().toISOString(),
    };
  }

  /**
   * Import analytics data from JSON
   */
  importData(data) {
    if (data.events) this.events = data.events;
    if (data.performanceMetrics) this.performanceMetrics = data.performanceMetrics;
    this.saveEvents();
    this.savePerformanceMetrics();
  }

  /**
   * Save events to localStorage
   */
  saveEvents() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.events));
    } catch (e) {
      console.error('Failed to save analytics events:', e);
    }
  }

  /**
   * Load events from localStorage
   */
  loadEvents() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to load analytics events:', e);
      return [];
    }
  }

  /**
   * Save performance metrics to localStorage
   */
  savePerformanceMetrics() {
    try {
      localStorage.setItem(PERFORMANCE_KEY, JSON.stringify(this.performanceMetrics));
    } catch (e) {
      console.error('Failed to save performance metrics:', e);
    }
  }

  /**
   * Load performance metrics from localStorage
   */
  loadPerformanceMetrics() {
    try {
      const stored = localStorage.getItem(PERFORMANCE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to load performance metrics:', e);
      return [];
    }
  }
}

// Create singleton instance
export const analyticsService = new AnalyticsService();

export default analyticsService;
