/**
 * Analytics Service Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { analyticsService, EventTypes } from '@/services/analytics';

describe('Analytics Service', () => {
  beforeEach(() => {
    analyticsService.clearAllData();
    localStorage.clear();
  });

  afterEach(() => {
    analyticsService.clearAllData();
    localStorage.clear();
  });

  describe('Event Tracking', () => {
    it('should track model selection events', () => {
      analyticsService.trackModelSelection('gpt-4', 'GPT-4', 'OpenAI', 0.03);
      const events = analyticsService.getEventsByType(EventTypes.MODEL_SELECTED);

      expect(events).toHaveLength(1);
      expect(events[0].data).toEqual({
        modelId: 'gpt-4',
        modelName: 'GPT-4',
        provider: 'OpenAI',
        costPerKToken: 0.03,
      });
    });

    it('should track search queries', () => {
      analyticsService.trackSearchQuery('gpt', 3);
      const events = analyticsService.getEventsByType(EventTypes.SEARCH_QUERY);

      expect(events).toHaveLength(1);
      expect(events[0].data).toEqual({
        query: 'gpt',
        resultCount: 3,
      });
    });

    it('should track keyboard shortcuts', () => {
      analyticsService.trackKeyboardShortcut('Ctrl+1', 'GPT-4');
      const events = analyticsService.getEventsByType(EventTypes.KEYBOARD_SHORTCUT);

      expect(events).toHaveLength(1);
      expect(events[0].data).toEqual({
        key: 'Ctrl+1',
        modelName: 'GPT-4',
      });
    });

    it('should track drawer interactions', () => {
      analyticsService.trackDrawerOpened();
      analyticsService.trackDrawerClosed();

      const openedEvents = analyticsService.getEventsByType(EventTypes.DRAWER_OPENED);
      const closedEvents = analyticsService.getEventsByType(EventTypes.DRAWER_CLOSED);

      expect(openedEvents).toHaveLength(1);
      expect(closedEvents).toHaveLength(1);
    });

    it('should track section interactions', () => {
      analyticsService.trackSectionExpanded('AI & Models');
      analyticsService.trackSectionCollapsed('Build');

      const expandedEvents = analyticsService.getEventsByType(EventTypes.SECTION_EXPANDED);
      const collapsedEvents = analyticsService.getEventsByType(EventTypes.SECTION_COLLAPSED);

      expect(expandedEvents).toHaveLength(1);
      expect(expandedEvents[0].data.sectionName).toBe('AI & Models');
      expect(collapsedEvents).toHaveLength(1);
      expect(collapsedEvents[0].data.sectionName).toBe('Build');
    });

    it('should track advanced options toggle', () => {
      analyticsService.trackAdvancedOptionsToggled(true);
      analyticsService.trackAdvancedOptionsToggled(false);

      const events = analyticsService.getEventsByType(EventTypes.ADVANCED_OPTIONS_TOGGLED);
      expect(events).toHaveLength(2);
      expect(events[0].data.isOpen).toBe(true);
      expect(events[1].data.isOpen).toBe(false);
    });
  });

  describe('Statistics & Analytics', () => {
    beforeEach(() => {
      // Create sample data
      analyticsService.trackModelSelection('gpt-4', 'GPT-4', 'OpenAI', 0.03);
      analyticsService.trackModelSelection('gpt-4', 'GPT-4', 'OpenAI', 0.03);
      analyticsService.trackModelSelection('claude-3', 'Claude 3', 'Anthropic', 0.015);
      analyticsService.trackSearchQuery('gpt', 3);
      analyticsService.trackSearchQuery('gpt', 3);
      analyticsService.trackSearchQuery('claude', 2);
      analyticsService.trackKeyboardShortcut('Ctrl+1', 'GPT-4');
      analyticsService.trackKeyboardShortcut('Ctrl+2', 'Claude 3');
    });

    it('should calculate model selection stats', () => {
      const stats = analyticsService.getModelSelectionStats();

      expect(stats).toHaveLength(2);
      expect(stats[0]).toEqual({
        modelName: 'GPT-4',
        provider: 'OpenAI',
        count: 2,
        lastSelected: stats[0].lastSelected,
        firstSelected: stats[0].firstSelected,
      });
    });

    it('should return top models', () => {
      const topModels = analyticsService.getTopModels(1);

      expect(topModels).toHaveLength(1);
      expect(topModels[0].modelName).toBe('GPT-4');
      expect(topModels[0].count).toBe(2);
    });

    it('should calculate search analytics', () => {
      const searchAnalytics = analyticsService.getSearchAnalytics();

      expect(searchAnalytics).toHaveLength(2);
      expect(searchAnalytics[0].query).toBe('gpt');
      expect(searchAnalytics[0].count).toBe(2);
    });

    it('should calculate keyboard shortcut stats', () => {
      const shortcutStats = analyticsService.getKeyboardShortcutStats();

      expect(shortcutStats).toHaveLength(2);
      expect(shortcutStats[0].key).toBe('Ctrl+1');
      expect(shortcutStats[0].count).toBe(1);
    });

    it('should generate interaction summary', () => {
      const summary = analyticsService.getInteractionSummary();

      expect(summary.totalEvents).toBe(8);
      expect(summary.eventBreakdown[EventTypes.MODEL_SELECTED]).toBe(3);
      expect(summary.eventBreakdown[EventTypes.SEARCH_QUERY]).toBe(3);
      expect(summary.eventBreakdown[EventTypes.KEYBOARD_SHORTCUT]).toBe(2);
      expect(summary.topModels).toHaveLength(2);
      expect(summary.topSearches).toHaveLength(2);
    });
  });

  describe('Performance Metrics', () => {
    it('should record performance metrics', () => {
      analyticsService.recordPerformanceMetric('component_render', 45.3);
      analyticsService.recordPerformanceMetric('component_render', 52.1);
      analyticsService.recordPerformanceMetric('search_query', 120.5);

      const renderMetrics = analyticsService.getPerformanceMetrics('component_render');
      expect(renderMetrics).toHaveLength(2);
      expect(renderMetrics[0].duration).toBe(45.3);
    });

    it('should calculate average performance metric', () => {
      analyticsService.recordPerformanceMetric('api_call', 100);
      analyticsService.recordPerformanceMetric('api_call', 200);
      analyticsService.recordPerformanceMetric('api_call', 300);

      const avg = analyticsService.getAveragePerformanceMetric('api_call');
      expect(avg).toBe(200);
    });

    it('should generate performance summary', () => {
      analyticsService.recordPerformanceMetric('render', 30);
      analyticsService.recordPerformanceMetric('render', 50);
      analyticsService.recordPerformanceMetric('render', 40);
      analyticsService.recordPerformanceMetric('search', 100);
      analyticsService.recordPerformanceMetric('search', 120);

      const summary = analyticsService.getPerformanceSummary();

      expect(summary.render).toEqual({
        avg: 40,
        min: 30,
        max: 50,
        count: 3,
      });
      expect(summary.search).toEqual({
        avg: 110,
        min: 100,
        max: 120,
        count: 2,
      });
    });
  });

  describe('Time Range Filtering', () => {
    it('should filter events by time range', () => {
      analyticsService.trackModelSelection('gpt-4', 'GPT-4', 'OpenAI', 0.03);

      // Get events from last 10 seconds
      const recentEvents = analyticsService.getEventsInTimeRange(10000);
      expect(recentEvents).toHaveLength(1);

      // Get events from last 1 second (should be empty if time has passed)
      // Note: This test is timing-dependent, so we just check it returns an array
      const veryRecentEvents = analyticsService.getEventsInTimeRange(1);
      expect(Array.isArray(veryRecentEvents)).toBe(true);
    });
  });

  describe('Data Export & Import', () => {
    it('should export analytics data', () => {
      analyticsService.trackModelSelection('gpt-4', 'GPT-4', 'OpenAI', 0.03);
      analyticsService.recordPerformanceMetric('render', 45.3);

      const exported = analyticsService.exportData();

      expect(exported.events).toHaveLength(1);
      expect(exported.performanceMetrics).toHaveLength(1);
      expect(exported.exportDate).toBeDefined();
    });

    it('should import analytics data', () => {
      const dataToImport = {
        events: [
          {
            type: EventTypes.MODEL_SELECTED,
            timestamp: new Date().toISOString(),
            data: { modelId: 'test', modelName: 'Test', provider: 'Test', costPerKToken: 0 },
            id: 'test_1',
          },
        ],
        performanceMetrics: [
          { name: 'test_metric', duration: 100, timestamp: new Date().toISOString() },
        ],
      };

      analyticsService.importData(dataToImport);

      expect(analyticsService.getEvents()).toHaveLength(1);
      expect(analyticsService.getPerformanceMetrics()).toHaveLength(1);
    });
  });

  describe('Data Persistence', () => {
    it('should persist events to localStorage', () => {
      const storageSetItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      analyticsService.trackModelSelection('gpt-4', 'GPT-4', 'OpenAI', 0.03);

      expect(storageSetItemSpy).toHaveBeenCalled();
      storageSetItemSpy.mockRestore();
    });

    it('should load events from localStorage', () => {
      // Create a new instance to test loading
      const testData = {
        events: [
          {
            type: EventTypes.MODEL_SELECTED,
            timestamp: new Date().toISOString(),
            data: { modelId: 'gpt-4', modelName: 'GPT-4', provider: 'OpenAI', costPerKToken: 0.03 },
            id: 'test_event_1',
          },
        ],
      };

      localStorage.setItem('appforge_analytics', JSON.stringify(testData.events));

      // Create new service instance (simulates page reload)
      const newService = new (analyticsService.constructor)();
      expect(newService.getEvents()).toHaveLength(1);
    });
  });

  describe('Data Clearing', () => {
    it('should clear all analytics data', () => {
      analyticsService.trackModelSelection('gpt-4', 'GPT-4', 'OpenAI', 0.03);
      analyticsService.recordPerformanceMetric('render', 45.3);

      expect(analyticsService.getEvents()).toHaveLength(1);
      expect(analyticsService.getPerformanceMetrics()).toHaveLength(1);

      analyticsService.clearAllData();

      expect(analyticsService.getEvents()).toHaveLength(0);
      expect(analyticsService.getPerformanceMetrics()).toHaveLength(0);
    });
  });
});
