import * as Sentry from '@sentry/node';

/**
 * Initialize Sentry error tracking
 * @param {import('express').Application} app - Express app instance
 */
export function initializeSentry(app) {
  if (!process.env.SENTRY_DSN) {
    console.log('Sentry DSN not configured, skipping Sentry initialization');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });

  console.log('Sentry initialized successfully');
}

/**
 * Sentry request handler middleware
 */
export function sentryRequestHandler() {
  return Sentry.Handlers.requestHandler();
}

/**
 * Sentry tracing middleware
 */
export function sentryTracingHandler() {
  return Sentry.Handlers.tracingHandler();
}

/**
 * Sentry error handler middleware
 */
export function sentryErrorHandler() {
  return Sentry.Handlers.errorHandler();
}

export default Sentry;
