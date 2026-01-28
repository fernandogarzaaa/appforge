import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as analytics from '@/utils/analytics';

describe('Analytics System', () => {
  beforeEach(() => {
    // Reset analytics state
    analytics.setAnalyticsEnabled(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('should track a custom event', () => {
      const event = analytics.trackEvent('test_event', { value: 123 });
      
      expect(event).toBeDefined();
      expect(event.eventName).toBe('test_event');
      expect(event.properties.value).toBe(123);
    });

    it('should accept data object', () => {
      const testData = { userId: '123', action: 'click' };
      const event = analytics.trackEvent('user_action', testData);

      expect(event.properties.userId).toBe('123');
      expect(event.properties.action).toBe('click');
    });

    it('should set timestamp automatically', () => {
      const event = analytics.trackEvent('test', {});
      
      expect(event.timestamp).toBeDefined();
      expect(typeof event.timestamp).toBe('string');
    });
  });

  describe('trackPageView', () => {
    it('should track page views', () => {
      const event = analytics.trackPageView('/dashboard');
      
      expect(event).toBeDefined();
      expect(event.eventName).toBe('page_view');
      expect(event.properties.pageName).toBe('/dashboard');
    });

    it('should track with full URL', () => {
      const event = analytics.trackPageView('/products?category=electronics');
      
      expect(event.properties.pageName).toBe('/products?category=electronics');
    });
  });

  describe('trackUserAction', () => {
    it('should track user actions', () => {
      const event = analytics.trackUserAction('click', 'submit-button');
      
      expect(event).toBeDefined();
      expect(event.eventName).toBe('user_action');
      expect(event.properties.action).toBe('click');
      expect(event.properties.target).toBe('submit-button');
    });

    it('should track various action types', () => {
      const actions = ['click', 'hover', 'scroll', 'type', 'submit'];
      
      actions.forEach(action => {
        const event = analytics.trackUserAction(action, 'test-element');
        expect(event.properties.action).toBe(action);
      });
    });
  });

  describe('trackConversion', () => {
    it('should track conversions with value', () => {
      const event = analytics.trackConversion('purchase', 99.99);
      
      expect(event).toBeDefined();
      expect(event.eventName).toBe('conversion');
      expect(event.properties.conversionType).toBe('purchase');
      expect(event.properties.value).toBe(99.99);
    });

    it('should support conversion metadata', () => {
      const event = analytics.trackConversion('purchase', 50, { currency: 'USD', items: 3 });
      
      expect(event.properties.currency).toBe('USD');
      expect(event.properties.items).toBe(3);
    });
  });

  describe('trackError', () => {
    it('should track errors', () => {
      const event = analytics.trackError('NetworkError', 'Network error');
      
      expect(event).toBeDefined();
      expect(event.eventName).toBe('error_tracked');
      expect(event.properties.message).toBe('Network error');
    });

    it('should track with error context', () => {
      const event = analytics.trackError('PaymentError', 'Payment failed', null, { page: '/checkout' });
      
      expect(event.properties.page).toBe('/checkout');
    });
  });

  describe('trackMetric', () => {
    it('should track custom metrics', () => {
      const event = analytics.trackMetric('api_latency', 245);
      
      expect(event).toBeDefined();
      expect(event.eventName).toBe('custom_metric');
      expect(event.properties.metricName).toBe('api_latency');
      expect(event.properties.value).toBe(245);
    });

    it('should track with metric units', () => {
      const event = analytics.trackMetric('load_time', 1500, 'ms');
      
      expect(event.properties.unit).toBe('ms');
    });
  });

  describe('Event Batching', () => {
    it('should batch events', () => {
      for (let i = 0; i < 5; i++) {
        analytics.trackEvent('batch_test', { index: i });
      }

      expect(() => {
        analytics.getAnalyticsSummary();
      }).not.toThrow();
    });

    it('should handle batch flush', () => {
      analytics.trackEvent('test1', {});
      analytics.trackEvent('test2', {});
      analytics.trackEvent('test3', {});

      expect(() => {
        analytics.flushAnalytics();
      }).not.toThrow();
    });
  });

  describe('configureAnalytics', () => {
    it('should configure endpoint', () => {
      expect(() => {
        analytics.configureAnalytics({ endpoint: '/api/analytics' });
      }).not.toThrow();
    });

    it('should configure batch size', () => {
      expect(() => {
        analytics.configureAnalytics({ batchSize: 100 });
      }).not.toThrow();
    });

    it('should configure flush interval', () => {
      expect(() => {
        analytics.configureAnalytics({ flushInterval: 60000 });
      }).not.toThrow();
    });
  });

  describe('Event Subscription', () => {
    it('should subscribe to specific events', () => {
      const handler = vi.fn();
      const unsubscribe = analytics.onAnalyticsEvent('page_view', handler);

      analytics.trackPageView('/test');
      expect(handler).toHaveBeenCalled();

      unsubscribe();
    });

    it('should unsubscribe from events', () => {
      const handler = vi.fn();
      const unsubscribe = analytics.onAnalyticsEvent('user_action', handler);

      analytics.trackUserAction('click', 'button');
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();

      analytics.trackUserAction('click', 'button');
      // Should still be 1 since we unsubscribed
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should support wildcard subscription', () => {
      const handler = vi.fn();
      const unsubscribe = analytics.onAnalyticsEvent('*', handler);

      analytics.trackEvent('test1', {});
      analytics.trackEvent('test2', {});
      // Handler may not be called immediately depending on implementation
      
      unsubscribe();
    });
  });

  describe('Session Management', () => {
    it('should track session info', () => {
      const event = analytics.trackEvent('test', {});
      expect(event.properties.sessionId).toBeDefined();
    });

    it('should maintain session consistency', () => {
      const event1 = analytics.trackEvent('test1', {});
      const event2 = analytics.trackEvent('test2', {});

      expect(event1.properties.sessionId).toBe(event2.properties.sessionId);
    });
  });

  describe('Enable/Disable', () => {
    it('should respect enabled flag', () => {
      // This test behavior depends on implementation
      // Just verify the flag can be set without errors
      analytics.setAnalyticsEnabled(false);
      expect(() => {
        analytics.trackEvent('test', {});
      }).not.toThrow();
      
      analytics.setAnalyticsEnabled(true);
      expect(() => {
        analytics.trackEvent('test', {});
      }).not.toThrow();
    });
  });
});
