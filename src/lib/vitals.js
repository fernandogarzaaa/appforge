/**
 * Web Vitals Monitoring
 * Tracks Core Web Vitals and sends to analytics
 */

import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

/**
 * Send vitals data to analytics service
 * @param {Object} metric - Web vital metric
 */
function sendToAnalytics({ name, delta, value, id, rating }) {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log(`📊 Web Vital [${rating}]:`, {
      name,
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      delta: Math.round(name === 'CLS' ? delta * 1000 : delta),
      id,
      rating
    });
  }

  // Send to Google Analytics (if available)
  if (window.gtag) {
    window.gtag('event', name, {
      event_category: 'Web Vitals',
      value: Math.round(name === 'CLS' ? delta * 1000 : delta),
      event_label: id,
      non_interaction: true,
    });
  }

  // Send to custom analytics endpoint
  if (import.meta.env.PROD && import.meta.env.VITE_ANALYTICS_ENDPOINT) {
    fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        delta,
        value,
        id,
        rating,
        timestamp: Date.now(),
        url: window.location.href,
      }),
      keepalive: true,
    }).catch((error) => {
      // Fail silently in production
      if (import.meta.env.DEV) {
        console.error('Failed to send vitals:', error);
      }
    });
  }
}

/**
 * Initialize Web Vitals monitoring
 * Call this once in your app entry point
 */
export function initVitals() {
  // Only track in production or if explicitly enabled
  const shouldTrack = import.meta.env.PROD || import.meta.env.VITE_TRACK_VITALS === 'true';

  if (!shouldTrack) {
    if (import.meta.env.DEV) {
      console.log('📊 Web Vitals tracking disabled in development');
      console.log('Set VITE_TRACK_VITALS=true to enable');
    }
    return;
  }

  try {
    // Cumulative Layout Shift (CLS)
    // Good: < 0.1, Needs improvement: 0.1-0.25, Poor: > 0.25
    onCLS(sendToAnalytics);

    // Interaction to Next Paint (INP) - Replaces FID in web-vitals v3+
    // Good: < 200ms, Needs improvement: 200-500ms, Poor: > 500ms
    onINP(sendToAnalytics);

    // First Contentful Paint (FCP)
    // Good: < 1.8s, Needs improvement: 1.8-3s, Poor: > 3s
    onFCP(sendToAnalytics);

    // Largest Contentful Paint (LCP)
    // Good: < 2.5s, Needs improvement: 2.5-4s, Poor: > 4s
    onLCP(sendToAnalytics);

    // Time to First Byte (TTFB)
    // Good: < 800ms, Needs improvement: 800-1800ms, Poor: > 1800ms
    onTTFB(sendToAnalytics);

    if (import.meta.env.DEV) {
      console.log('📊 Web Vitals monitoring initialized');
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to initialize Web Vitals:', error);
    }
  }
}

/**
 * Get current Web Vitals scores
 * Useful for debugging or displaying in UI
 */
export async function getVitals() {
  return new Promise((resolve) => {
    const vitals = {};

    const collectVital = (metric) => {
      vitals[metric.name] = {
        value: metric.value,
        rating: metric.rating,
      };

      // Resolve when we have all vitals
      if (Object.keys(vitals).length === 5) {
        resolve(vitals);
      }
    };

    onCLS(collectVital);
    onINP(collectVital);
    onFCP(collectVital);
    onLCP(collectVital);
    onTTFB(collectVital);

    // Timeout after 5 seconds
    setTimeout(() => resolve(vitals), 5000);
  });
}

/**
 * Create a performance observer for custom metrics
 * @param {string} type - Performance entry type ('navigation', 'resource', 'paint', etc.)
 * @param {Function} callback - Callback function
 */
export function observePerformance(type, callback) {
  if (!window.PerformanceObserver) {
    console.warn('PerformanceObserver not supported');
    return null;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        callback(entry);
      }
    });

    observer.observe({ type, buffered: true });
    return observer;
  } catch (error) {
    console.error(`Failed to observe ${type}:`, error);
    return null;
  }
}

/**
 * Log page navigation timing
 * Useful for debugging performance issues
 */
export function logNavigationTiming() {
  if (!window.performance || !window.performance.timing) {
    console.warn('Navigation Timing API not supported');
    return;
  }

  const timing = window.performance.timing;
  const navigationStart = timing.navigationStart;

  const metrics = {
    'DNS Lookup': timing.domainLookupEnd - timing.domainLookupStart,
    'TCP Connection': timing.connectEnd - timing.connectStart,
    'Request Time': timing.responseEnd - timing.requestStart,
    'Response Time': timing.responseEnd - timing.responseStart,
    'DOM Processing': timing.domComplete - timing.domLoading,
    'DOM Content Loaded': timing.domContentLoadedEventEnd - navigationStart,
    'Page Load': timing.loadEventEnd - navigationStart,
  };

  console.table(metrics);
  return metrics;
}
