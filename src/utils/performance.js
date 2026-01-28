/**
 * Performance Monitoring Utilities
 * Track and report application performance metrics
 */

import env from './env';

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.enabled = env.dev.showPerfMetrics || env.features.analytics;
    
    if (this.enabled) {
      this.setupObservers();
    }
  }

  setupObservers() {
    // Performance Observer for navigation timing
    if ('PerformanceObserver' in window) {
      try {
        // Navigation timing
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('navigation', {
              type: entry.type,
              duration: entry.duration,
              domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
              loadComplete: entry.loadEventEnd - entry.loadEventStart,
            });
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });

        // Resource timing
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
              this.recordMetric('api', {
                name: entry.name,
                duration: entry.duration,
                transferSize: entry.transferSize,
              });
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });

        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('lcp', {
            value: lastEntry.renderTime || lastEntry.loadTime,
            element: lastEntry.element?.tagName,
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('fid', {
              value: entry.processingStart - entry.startTime,
            });
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

      } catch (err) {
        console.warn('Performance observers not supported:', err);
      }
    }
  }

  recordMetric(name, data) {
    const metric = {
      name,
      data,
      timestamp: Date.now(),
    };

    this.metrics.set(`${name}-${Date.now()}`, metric);

    if (env.dev.showPerfMetrics) {
      console.log(`📊 Performance [${name}]:`, data);
    }

    // Send to analytics
    this.sendToAnalytics(metric);
  }

  // Measure component render time
  measureRender(componentName, callback) {
    const startTime = performance.now();
    
    try {
      const result = callback();
      
      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = performance.now() - startTime;
          this.recordMetric('render', { component: componentName, duration });
        });
      }
      
      const duration = performance.now() - startTime;
      this.recordMetric('render', { component: componentName, duration });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric('render', { component: componentName, duration, error: true });
      throw error;
    }
  }

  // Mark custom timing
  mark(name) {
    performance.mark(name);
  }

  // Measure between marks
  measure(name, startMark, endMark) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      this.recordMetric('custom', {
        name,
        duration: measure.duration,
      });
      return measure.duration;
    } catch (err) {
      console.warn('Performance measure failed:', err);
      return 0;
    }
  }

  // Get Web Vitals
  getWebVitals() {
    const navigation = performance.getEntriesByType('navigation')[0];
    
    return {
      // First Contentful Paint
      fcp: this.getMetricValue('paint', (m) => m.name === 'first-contentful-paint'),
      // Largest Contentful Paint
      lcp: this.getMetricValue('lcp'),
      // First Input Delay
      fid: this.getMetricValue('fid'),
      // Time to Interactive
      tti: navigation ? navigation.domInteractive - navigation.fetchStart : 0,
      // Total Blocking Time
      tbt: this.calculateTBT(),
    };
  }

  getMetricValue(type, filter) {
    for (const [, metric] of this.metrics) {
      if (metric.name === type) {
        if (!filter || filter(metric.data)) {
          return metric.data.value || metric.data.duration || 0;
        }
      }
    }
    return 0;
  }

  calculateTBT() {
    // Simplified TBT calculation
    const longTasks = performance.getEntriesByType('longtask');
    return longTasks.reduce((total, task) => {
      const blockingTime = task.duration - 50;
      return total + (blockingTime > 0 ? blockingTime : 0);
    }, 0);
  }

  sendToAnalytics(metric) {
    if (!env.features.analytics) return;

    // Send to Google Analytics
    if (window.gtag) {
      window.gtag('event', 'performance', {
        event_category: metric.name,
        value: metric.data.duration || metric.data.value,
        non_interaction: true,
      });
    }

    // Send to custom analytics endpoint
    if (env.app.isProduction) {
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      }).catch(() => {});
    }
  }

  getReport() {
    const vitals = this.getWebVitals();
    const metrics = Array.from(this.metrics.values());

    return {
      vitals,
      metrics,
      summary: {
        totalMetrics: metrics.length,
        avgRenderTime: this.calculateAverage(metrics, 'render', 'duration'),
        avgApiTime: this.calculateAverage(metrics, 'api', 'duration'),
      },
    };
  }

  calculateAverage(metrics, type, field) {
    const filtered = metrics.filter(m => m.name === type && m.data[field]);
    if (filtered.length === 0) return 0;
    
    const sum = filtered.reduce((acc, m) => acc + m.data[field], 0);
    return sum / filtered.length;
  }

  clear() {
    this.metrics.clear();
  }
}

// Create singleton
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;

// Convenience exports
export const measureRender = (name, callback) => performanceMonitor.measureRender(name, callback);
export const mark = (name) => performanceMonitor.mark(name);
export const measure = (name, start, end) => performanceMonitor.measure(name, start, end);
export const getWebVitals = () => performanceMonitor.getWebVitals();
export const getPerformanceReport = () => performanceMonitor.getReport();
