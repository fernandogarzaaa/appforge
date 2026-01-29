import { useEffect, useState, useRef } from 'react';

/**
 * Performance Profiler
 * Real-time performance monitoring and metrics
 */
export function usePerformanceProfiler() {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memory: null,
    renderTime: 0,
    interactions: [],
  });

  const frameTimesRef = useRef([]);
  const startTimeRef = useRef(Date.now());

  // Monitor FPS
  useEffect(() => {
    let lastTime = performance.now();
    let frames = 0;

    const measureFPS = () => {
      frames++;
      const now = performance.now();

      if (now >= lastTime + 1000) {
        setMetrics(prev => ({ ...prev, fps: frames }));
        frames = 0;
        lastTime = now;
      }

      requestAnimationFrame(measureFPS);
    };

    const id = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(id);
  }, []);

  // Monitor Memory
  useEffect(() => {
    const interval = setInterval(() => {
      if (performance.memory) {
        const used = Math.round(performance.memory.usedJSHeapSize / 1048576); // Convert to MB
        const limit = Math.round(performance.memory.jsHeapSizeLimit / 1048576);
        setMetrics(prev => ({
          ...prev,
          memory: {
            used,
            limit,
            percentage: Math.round((used / limit) * 100),
          },
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Track render time
  const startMeasure = (name) => {
    performance.mark(`${name}-start`);
    return name;
  };

  const endMeasure = (name) => {
    performance.mark(`${name}-end`);
    try {
      performance.measure(name, `${name}-start`, `${name}-end`);
      const measure = performance.getEntriesByName(name)[0];
      return measure.duration;
    } catch (e) {
      return 0;
    }
  };

  // Get detailed metrics
  const getMetrics = () => {
    const entries = performance.getEntries();
    return {
      navigation: entries.find(e => e.entryType === 'navigation'),
      paints: entries.filter(e => e.entryType === 'paint'),
      measures: entries.filter(e => e.entryType === 'measure'),
      memory: metrics.memory,
      fps: metrics.fps,
    };
  };

  return {
    metrics,
    startMeasure,
    endMeasure,
    getMetrics,
  };
}

/**
 * Performance Recommendations Engine
 */
export class PerformanceAnalyzer {
  static analyzeMetrics(metrics) {
    const recommendations = [];

    if (metrics.fps && metrics.fps < 30) {
      recommendations.push({
        level: 'error',
        message: 'Low frame rate detected',
        suggestion: 'Profile your code for expensive operations',
      });
    }

    if (metrics.memory && metrics.memory.percentage > 80) {
      recommendations.push({
        level: 'warning',
        message: 'High memory usage',
        suggestion: 'Check for memory leaks and unused objects',
      });
    }

    return recommendations;
  }

  static generateReport(metrics) {
    return {
      timestamp: new Date().toISOString(),
      summary: {
        fps: metrics.fps,
        memory: metrics.memory,
        navigationTiming: metrics.navigation?.duration,
      },
      recommendations: this.analyzeMetrics(metrics),
    };
  }
}
