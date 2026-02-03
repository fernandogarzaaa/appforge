/**
 * Sentry Error Tracking Configuration
 * Production-ready error monitoring and performance tracking
 */

import * as Sentry from '@sentry/node';

// Try to import profiling integration (optional)
let ProfilingIntegration;
try {
  const profiling = await import('@sentry/profiling-node');
  ProfilingIntegration = profiling.ProfilingIntegration;
} catch (err) {
  console.warn('⚠️  @sentry/profiling-node not installed - profiling disabled');
}

/**
 * Initialize Sentry with environment-specific configuration
 */
export function initializeSentry(app) {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';
  
  // Only initialize if DSN is provided
  if (!dsn) {
    console.warn('⚠️  Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    
    // Set sample rate based on environment
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // Performance monitoring
    integrations: [
      // Express integration for automatic instrumentation
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      ProfilingIntegration ? new ProfilingIntegration() : null,
    ].filter(Boolean),
    
    // Filter out health checks and other noise
    beforeSend(event, hint) {
      // Don't send health check errors
      if (event.request?.url?.includes('/health')) {
        return null;
      }
      
      // Don't send expected errors (4xx)
      if (event.exception?.values?.[0]?.type === 'HttpError') {
        const statusCode = hint.originalException?.statusCode;
        if (statusCode >= 400 && statusCode < 500) {
          return null;
        }
      }
      
      return event;
    },
    
    // Tag events with useful context
    beforeBreadcrumb(breadcrumb, hint) {
      if (breadcrumb.category === 'console') {
        return null; // Filter out console logs
      }
      return breadcrumb;
    },
  });

  console.log('✅ Sentry error tracking initialized');
}

/**
 * Request handler middleware (must be first)
 */
export const sentryRequestHandler = () => Sentry.Handlers.requestHandler();

/**
 * Tracing middleware
 */
export const sentryTracingHandler = () => Sentry.Handlers.tracingHandler();

/**
 * Error handler middleware (must be after routes, before other error handlers)
 */
export const sentryErrorHandler = () => Sentry.Handlers.errorHandler({
  shouldHandleError(error) {
    // Capture all errors except 4xx
    if (error.statusCode >= 400 && error.statusCode < 500) {
      return false;
    }
    return true;
  },
});

/**
 * Manually capture an exception
 */
export function captureException(error, context = {}) {
  Sentry.captureException(error, {
    tags: context.tags || {},
    extra: context.extra || {},
    user: context.user || {},
  });
}

/**
 * Capture a message (for non-error events)
 */
export function captureMessage(message, level = 'info', context = {}) {
  Sentry.captureMessage(message, {
    level,
    tags: context.tags || {},
    extra: context.extra || {},
  });
}

/**
 * Set user context for error tracking
 */
export function setUser(user) {
  Sentry.setUser(user ? {
    id: user.id,
    email: user.email,
    username: user.username,
  } : null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb) {
  Sentry.addBreadcrumb(breadcrumb);
}

export default {
  initializeSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
};
