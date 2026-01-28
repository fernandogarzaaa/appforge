/**
 * Performance Monitoring Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import performanceMonitor from '@/utils/performance';

describe('Performance Monitor', () => {
  beforeEach(() => {
    performanceMonitor.clear();
  });

  it('records metrics', () => {
    performanceMonitor.recordMetric('test', { duration: 100 });
    
    const report = performanceMonitor.getReport();
    expect(report.metrics.length).toBeGreaterThan(0);
  });

  it('measures render time', () => {
    const result = performanceMonitor.measureRender('TestComponent', () => {
      return 'test result';
    });
    
    expect(result).toBe('test result');
    const report = performanceMonitor.getReport();
    const renderMetrics = report.metrics.filter(m => m.name === 'render');
    expect(renderMetrics.length).toBeGreaterThan(0);
  });

  it('handles async operations', async () => {
    const asyncOperation = async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return 'done';
    };
    
    const result = await performanceMonitor.measureRender('AsyncComponent', asyncOperation);
    
    expect(result).toBe('done');
  });

  it('marks and measures custom timings', () => {
    performanceMonitor.mark('start');
    // Simulate some work
    for (let i = 0; i < 1000; i++) {}
    performanceMonitor.mark('end');
    
    const duration = performanceMonitor.measure('operation', 'start', 'end');
    
    expect(duration).toBeGreaterThanOrEqual(0);
  });

  it('generates performance report', () => {
    performanceMonitor.recordMetric('render', { duration: 50 });
    performanceMonitor.recordMetric('render', { duration: 100 });
    performanceMonitor.recordMetric('api', { duration: 200 });
    
    const report = performanceMonitor.getReport();
    
    expect(report).toHaveProperty('vitals');
    expect(report).toHaveProperty('metrics');
    expect(report).toHaveProperty('summary');
    expect(report.summary.totalMetrics).toBeGreaterThan(0);
  });

  it('calculates average metrics', () => {
    performanceMonitor.recordMetric('render', { duration: 50 });
    performanceMonitor.recordMetric('render', { duration: 100 });
    
    const report = performanceMonitor.getReport();
    
    // Average should be between 50 and 100
    expect(report.summary.avgRenderTime).toBeGreaterThanOrEqual(50);
    expect(report.summary.avgRenderTime).toBeLessThanOrEqual(100);
  });
});
