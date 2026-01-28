/**
 * Error Tracking Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import errorTracker from '@/utils/errorTracking';

describe('Error Tracker', () => {
  beforeEach(() => {
    errorTracker.clearErrors();
    vi.clearAllMocks();
  });

  it('captures errors with context', () => {
    const error = new Error('Test error');
    const context = { component: 'TestComponent' };
    
    const errorData = errorTracker.captureError(error, context);
    
    expect(errorData).toHaveProperty('message', 'Test error');
    expect(errorData).toHaveProperty('timestamp');
    expect(errorData.context).toEqual(context);
  });

  it('stores recent errors', () => {
    errorTracker.captureError(new Error('Error 1'));
    errorTracker.captureError(new Error('Error 2'));
    errorTracker.captureError(new Error('Error 3'));
    
    const recentErrors = errorTracker.getRecentErrors(10);
    
    expect(recentErrors).toHaveLength(3);
    expect(recentErrors[0].message).toBe('Error 1');
    expect(recentErrors[2].message).toBe('Error 3');
  });

  it('limits stored errors to max count', () => {
    // Add more than max errors
    for (let i = 0; i < 150; i++) {
      errorTracker.captureError(new Error(`Error ${i}`));
    }
    
    const allErrors = errorTracker.getRecentErrors(200);
    
    // Should only keep last 100
    expect(allErrors.length).toBeLessThanOrEqual(100);
  });

  it('captures messages with levels', () => {
    const messageData = errorTracker.captureMessage('Test message', 'info', { test: true });
    
    expect(messageData).toHaveProperty('message', 'Test message');
    expect(messageData).toHaveProperty('level', 'info');
    expect(messageData.context).toEqual({ test: true });
  });

  it('clears errors', () => {
    errorTracker.captureError(new Error('Test'));
    expect(errorTracker.getRecentErrors()).toHaveLength(1);
    
    errorTracker.clearErrors();
    expect(errorTracker.getRecentErrors()).toHaveLength(0);
  });
});
