/**
 * Advanced Analytics System
 * Tracks user behavior, events, and metrics for enterprise reporting
 */

let analyticsQueue = [];
let analyticsConfig = {
  batchSize: 50,
  flushInterval: 30000, // 30 seconds
  enabled: true,
  endpoint: '/api/analytics',
};

let batchTimer = null;
const eventListeners = new Map();

/**
 * Configure analytics settings
 */
export const configureAnalytics = (options) => {
  analyticsConfig = { ...analyticsConfig, ...options };
};

/**
 * Track user event
 */
export const trackEvent = (eventName, properties = {}, timestamp = new Date()) => {
  if (!analyticsConfig.enabled) return;

  const event = {
    eventName,
    properties: {
      ...properties,
      userId: properties.userId,
      sessionId: getSessionId(),
      userAgent: navigator.userAgent,
      url: window.location.pathname,
    },
    timestamp: timestamp.toISOString(),
    eventId: generateEventId(),
  };

  analyticsQueue.push(event);

  // Notify subscribers
  if (eventListeners.has(eventName)) {
    eventListeners.get(eventName).forEach(callback => callback(event));
  }

  // Flush if queue is full
  if (analyticsQueue.length >= analyticsConfig.batchSize) {
    flushAnalytics();
  } else if (!batchTimer) {
    batchTimer = setTimeout(flushAnalytics, analyticsConfig.flushInterval);
  }

  return event;
};

/**
 * Track page view
 */
export const trackPageView = (pageName, metadata = {}) => {
  return trackEvent('page_view', {
    pageName,
    ...metadata,
  });
};

/**
 * Track user action (click, form submission, etc.)
 */
export const trackUserAction = (action, target, properties = {}) => {
  return trackEvent('user_action', {
    action,
    target,
    ...properties,
  });
};

/**
 * Track conversion event
 */
export const trackConversion = (conversionType, value = 0, properties = {}) => {
  return trackEvent('conversion', {
    conversionType,
    value,
    ...properties,
  });
};

/**
 * Track error event
 */
export const trackError = (errorType, message, stack, properties = {}) => {
  return trackEvent('error_tracked', {
    errorType,
    message,
    stack: stack?.substring(0, 1000), // Limit stack trace
    ...properties,
  });
};

/**
 * Track custom metric
 */
export const trackMetric = (metricName, value, unit = '', properties = {}) => {
  return trackEvent('custom_metric', {
    metricName,
    value,
    unit,
    ...properties,
  });
};

/**
 * Flush analytics queue to server
 */
export const flushAnalytics = async () => {
  if (analyticsQueue.length === 0) return;

  const eventsToSend = [...analyticsQueue];
  analyticsQueue = [];

  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }

  try {
    const response = await fetch(analyticsConfig.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        events: eventsToSend,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.warn('Failed to send analytics:', response.status);
      // Re-queue events on failure
      analyticsQueue = [...eventsToSend, ...analyticsQueue].slice(0, 1000);
    }
  } catch (error) {
    console.warn('Analytics flush error:', error);
    // Re-queue events on network error
    analyticsQueue = [...eventsToSend, ...analyticsQueue].slice(0, 1000);
  }
};

/**
 * Subscribe to analytics events
 */
export const onAnalyticsEvent = (eventName, callback) => {
  if (!eventListeners.has(eventName)) {
    eventListeners.set(eventName, []);
  }
  eventListeners.get(eventName).push(callback);

  // Return unsubscribe function
  return () => {
    const callbacks = eventListeners.get(eventName);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  };
};

/**
 * Get analytics summary
 */
export const getAnalyticsSummary = () => {
  return {
    queuedEvents: analyticsQueue.length,
    sessionId: getSessionId(),
    enabled: analyticsConfig.enabled,
    config: analyticsConfig,
  };
};

/**
 * Get or create session ID
 */
function getSessionId() {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Generate unique event ID
 */
function generateEventId() {
  return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Enable/disable analytics
 */
export const setAnalyticsEnabled = (enabled) => {
  analyticsConfig.enabled = enabled;
  if (enabled) {
    // Resume flushing if needed
    if (analyticsQueue.length > 0 && !batchTimer) {
      batchTimer = setTimeout(flushAnalytics, analyticsConfig.flushInterval);
    }
  } else {
    // Pause flushing
    if (batchTimer) {
      clearTimeout(batchTimer);
      batchTimer = null;
    }
  }
};

/**
 * Clear analytics queue
 */
export const clearAnalytics = () => {
  analyticsQueue = [];
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }
};

// Flush analytics before page unload
window.addEventListener('beforeunload', () => {
  if (analyticsQueue.length > 0) {
    const eventsToSend = [...analyticsQueue];
    navigator.sendBeacon(analyticsConfig.endpoint, JSON.stringify({
      events: eventsToSend,
      timestamp: new Date().toISOString(),
    }));
  }
});

export default {
  trackEvent,
  trackPageView,
  trackUserAction,
  trackConversion,
  trackError,
  trackMetric,
  flushAnalytics,
  onAnalyticsEvent,
  getAnalyticsSummary,
  setAnalyticsEnabled,
  clearAnalytics,
  configureAnalytics,
};
