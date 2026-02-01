/**
 * Analytics Hook Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { analyticsService } from '@/services/analytics';

describe('useAnalytics Hook', () => {
  beforeEach(() => {
    analyticsService.clearAllData();
  });

  it('should provide analytics tracking functions', () => {
    const { result } = renderHook(() => useAnalytics());

    expect(result.current.trackModelSelection).toBeDefined();
    expect(result.current.trackSearch).toBeDefined();
    expect(result.current.trackKeyboardShortcut).toBeDefined();
    expect(result.current.trackDrawerOpened).toBeDefined();
    expect(result.current.trackDrawerClosed).toBeDefined();
    expect(result.current.trackSectionCollapsed).toBeDefined();
    expect(result.current.trackSectionExpanded).toBeDefined();
    expect(result.current.trackAdvancedOptionsToggled).toBeDefined();
  });

  it('should track model selection', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackModelSelection('gpt-4', 'GPT-4', 'OpenAI', 0.03);
    });

    const events = analyticsService.getEventsByType('model_selected');
    expect(events).toHaveLength(1);
    expect(events[0].data.modelName).toBe('GPT-4');
  });

  it('should track search queries', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackSearch('test', 5);
    });

    const events = analyticsService.getEventsByType('search_query');
    expect(events).toHaveLength(1);
    expect(events[0].data.query).toBe('test');
  });

  it('should track keyboard shortcuts', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackKeyboardShortcut('Ctrl+1', 'GPT-4');
    });

    const events = analyticsService.getEventsByType('keyboard_shortcut');
    expect(events).toHaveLength(1);
    expect(events[0].data.key).toBe('Ctrl+1');
  });

  it('should track drawer interactions', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackDrawerOpened();
      result.current.trackDrawerClosed();
    });

    const openedEvents = analyticsService.getEventsByType('drawer_opened');
    const closedEvents = analyticsService.getEventsByType('drawer_closed');

    expect(openedEvents).toHaveLength(1);
    expect(closedEvents).toHaveLength(1);
  });

  it('should track section interactions', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackSectionExpanded('AI & Models');
      result.current.trackSectionCollapsed('Build');
    });

    const expandedEvents = analyticsService.getEventsByType('section_expanded');
    const collapsedEvents = analyticsService.getEventsByType('section_collapsed');

    expect(expandedEvents).toHaveLength(1);
    expect(collapsedEvents).toHaveLength(1);
  });

  it('should measure performance synchronously', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      const value = result.current.measurePerformance('test_metric', () => {
        // Simulate some work
        let sum = 0;
        for (let i = 0; i < 1000000; i += 1) {
          sum += i;
        }
        return sum;
      });

      expect(value).toBeDefined();
    });

    const metrics = analyticsService.getPerformanceMetrics('test_metric');
    expect(metrics).toHaveLength(1);
    expect(metrics[0].duration).toBeGreaterThan(0);
  });

  it('should measure performance asynchronously', async () => {
    const { result } = renderHook(() => useAnalytics());

    await act(async () => {
      const value = await result.current.measurePerformanceAsync('async_metric', async () => {
        return new Promise((resolve) => {
          setTimeout(() => resolve('done'), 10);
        });
      });

      expect(value).toBe('done');
    });

    const metrics = analyticsService.getPerformanceMetrics('async_metric');
    expect(metrics).toHaveLength(1);
    expect(metrics[0].duration).toBeGreaterThanOrEqual(10);
  });

  it('should provide access to analytics service', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackModelSelection('gpt-4', 'GPT-4', 'OpenAI', 0.03);
    });

    const analytics = result.current.getAnalytics();
    const stats = analytics.getModelSelectionStats();

    expect(stats).toHaveLength(1);
  });
});
