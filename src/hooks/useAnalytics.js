/**
 * useAnalytics Hook
 * React hook to integrate analytics tracking in components
 */

import { useCallback, useRef, useEffect } from 'react';
import { analyticsService } from '@/services/analytics';

export function useAnalytics() {
  const trackerRef = useRef(null);

  // Initialize tracker reference
  useEffect(() => {
    trackerRef.current = analyticsService;
  }, []);

  const trackModelSelection = useCallback((modelId, modelName, provider, costPerKToken) => {
    trackerRef.current?.trackModelSelection(modelId, modelName, provider, costPerKToken);
  }, []);

  const trackSearch = useCallback((query, resultCount) => {
    trackerRef.current?.trackSearchQuery(query, resultCount);
  }, []);

  const trackKeyboardShortcut = useCallback((key, modelName) => {
    trackerRef.current?.trackKeyboardShortcut(key, modelName);
  }, []);

  const trackDrawerOpened = useCallback(() => {
    trackerRef.current?.trackDrawerOpened();
  }, []);

  const trackDrawerClosed = useCallback(() => {
    trackerRef.current?.trackDrawerClosed();
  }, []);

  const trackSectionCollapsed = useCallback((sectionName) => {
    trackerRef.current?.trackSectionCollapsed(sectionName);
  }, []);

  const trackSectionExpanded = useCallback((sectionName) => {
    trackerRef.current?.trackSectionExpanded(sectionName);
  }, []);

  const trackAdvancedOptionsToggled = useCallback((isOpen) => {
    trackerRef.current?.trackAdvancedOptionsToggled(isOpen);
  }, []);

  const measurePerformance = useCallback((metricName, callback) => {
    const startTime = performance.now();
    const result = callback();
    const duration = performance.now() - startTime;
    trackerRef.current?.recordPerformanceMetric(metricName, duration);
    return result;
  }, []);

  const measurePerformanceAsync = useCallback(async (metricName, asyncCallback) => {
    const startTime = performance.now();
    const result = await asyncCallback();
    const duration = performance.now() - startTime;
    trackerRef.current?.recordPerformanceMetric(metricName, duration);
    return result;
  }, []);

  return {
    trackModelSelection,
    trackSearch,
    trackKeyboardShortcut,
    trackDrawerOpened,
    trackDrawerClosed,
    trackSectionCollapsed,
    trackSectionExpanded,
    trackAdvancedOptionsToggled,
    measurePerformance,
    measurePerformanceAsync,
    getAnalytics: () => trackerRef.current,
  };
}

export default useAnalytics;
