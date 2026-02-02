/**
 * Sentry Error Tracking Setup
 * Comprehensive error monitoring, performance tracking, and alerting
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export function initializeSentry() {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      new BrowserTracing({
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          window.history
        ),
        tracingOrigins: ['localhost', /^\//],
        shouldCreateSpanForRequest: (url) => {
          // Don't trace health checks
          return !url.includes('/health');
        },
      }),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend: (event, hint) => {
      // Filter out some errors
      if (event.exception) {
        const error = hint.originalException;
        
        // Don't report network errors for external APIs
        if (error?.message?.includes('Network Error')) {
          return null;
        }
      }
      
      return event;
    },
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // Random plugins/extensions
      'chrome-extension://',
      'moz-extension://',
    ],
  });

  console.log('✅ Sentry initialized');
}

/**
 * Capture quantum analysis errors
 */
export function captureQuantumError(error: Error, context: {
  analysisType: string;
  module: string;
  metrics?: any;
}) {
  Sentry.captureException(error, {
    level: 'error',
    tags: {
      component: 'quantum',
      analysis_type: context.analysisType,
      module: context.module,
    },
    extra: context.metrics,
  });
}

/**
 * Capture API errors
 */
export function captureAPIError(error: Error, endpoint: string, statusCode?: number) {
  Sentry.captureException(error, {
    level: statusCode >= 500 ? 'error' : 'warning',
    tags: {
      component: 'api',
      endpoint,
      status_code: statusCode?.toString(),
    },
  });
}

/**
 * Capture performance metrics
 */
export function capturePerformanceMetric(metric: {
  name: string;
  duration: number;
  tags?: Record<string, string>;
}) {
  const transaction = Sentry.getCurrentHub().getTransaction();
  
  if (transaction) {
    const span = transaction.startChild({
      op: 'performance',
      description: metric.name,
      data: metric.tags,
    });
    
    span.finish();
  }
}

/**
 * Create breadcrumb for user actions
 */
export function recordBreadcrumb(
  message: string,
  category: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, any>
) {
  Sentry.captureMessage(message, level);
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Set user context
 */
export function setUserContext(userId: string, email?: string, username?: string) {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
}

/**
 * Clear user context
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Start transaction for performance monitoring
 */
export function startTransaction(name: string, op: string = 'default') {
  const transaction = Sentry.startTransaction({
    name,
    op,
  });

  return {
    startChild: (description: string) => {
      return transaction.startChild({
        description,
        op: 'db.query',
      });
    },
    finish: () => transaction.finish(),
  };
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(featureName: string, metadata?: any) {
  recordBreadcrumb(
    `Feature used: ${featureName}`,
    'feature_usage',
    'info',
    metadata
  );
}

/**
 * Report issues with source maps
 */
export async function uploadSourceMaps() {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  try {
    const release = process.env.REACT_APP_VERSION;
    
    Sentry.captureMessage(
      `Release ${release} deployed`,
      'info'
    );
  } catch (err) {
    console.error('Failed to report release:', err);
  }
}

export default {
  initializeSentry,
  captureQuantumError,
  captureAPIError,
  capturePerformanceMetric,
  recordBreadcrumb,
  setUserContext,
  clearUserContext,
  startTransaction,
  trackFeatureUsage,
  uploadSourceMaps,
};
