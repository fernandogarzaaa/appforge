/**
 * Sentry Error Tracking Configuration
 * Initializes Sentry for production error monitoring and performance tracking
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

/**
 * Initialize Sentry with environment-specific configuration
 */
export function initializeSentry() {
  const isDevelopment = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;
  
  // Get DSN from environment, with fallback for free tier
  const dsn = import.meta.env.VITE_SENTRY_DSN || 
    process.env.VITE_SENTRY_DSN || 
    'https://examplePublicKey@o0.ingest.sentry.io/0'; // Free tier placeholder

  // Only initialize in production or if explicitly enabled
  if (!isProduction && !import.meta.env.VITE_SENTRY_ENABLED) {
    console.log('[Sentry] Disabled in development (set VITE_SENTRY_ENABLED=true to enable)');
    return null;
  }

  Sentry.init({
    dsn,
    
    // Environment
    environment: isDevelopment ? 'development' : 'production',
    
    // Performance Monitoring - sample 100% of transactions in development, 10% in production
    tracesSampleRate: isDevelopment ? 1.0 : 0.1,
    
    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || 'unknown',
    
    // Integrations
    integrations: [
      new BrowserTracing({
        // Measure absolute time for first contentful paint from navigationStart
        traceFetch: true,
        traceXHR: true,
        tracingOrigins: [
          'localhost',
          import.meta.env.VITE_API_URL?.replace(/^https?:\/\//, ''),
          /^\//,
        ].filter(Boolean),
      }),
    ],
    
    // Attach stack traces to errors
    attachStacktrace: true,
    
    // Request bodies in errors
    includeLocalVariables: true,
    
    // Sample rate for error events
    sampleRate: 1.0,
    
    // Before sending
    beforeSend(event, hint) {
      // Don't send errors in development unless explicitly enabled
      if (isDevelopment && !import.meta.env.VITE_SENTRY_ENABLED) {
        return null;
      }
      
      // Filter out certain errors
      if (event.exception) {
        const error = hint.originalException;
        
        // Ignore network errors from unavailable services
        if (error?.message?.includes('NetworkError')) {
          return null;
        }
        
        // Ignore User cancelled actions
        if (error?.name === 'AbortError') {
          return null;
        }
      }
      
      return event;
    },
    
    // Before sending a transaction
    beforeSendTransaction(transaction) {
      // Ignore certain transactions
      if (transaction.op === 'http.client') {
        if (transaction.description?.includes('/health')) {
          return null;
        }
      }
      
      return transaction;
    },
    
    // Context configuration
    maxBreadcrumbs: 50,
    
    // Ignore patterns for certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'chrome://',
      'moz-extension://',
      // Known third-party errors
      'Can\'t find variable: ZiteReader',
      'jigsaw is not defined',
      'ComboSearch is not defined',
      // Random plugins/extensions that can cause errors
      /^Non-Error promise rejection detected/i,
    ],
  });

  console.log('[Sentry] Initialized');
  
  return Sentry;
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(userId, userEmail, userName) {
  Sentry.setUser({
    id: userId,
    email: userEmail,
    username: userName,
  });
}

/**
 * Clear user context when logging out
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Set custom context for additional debugging
 */
export function setSentryContext(contextName, contextData) {
  Sentry.setContext(contextName, contextData);
}

/**
 * Capture a breadcrumb for tracking
 */
export function captureBreadcrumb(message, level = 'info', category = 'user-action') {
  Sentry.captureMessage(message, {
    level,
    tags: { category },
  });
}

/**
 * Capture an exception manually
 */
export function captureException(error, context = {}) {
  Sentry.withScope((scope) => {
    Object.entries(context).forEach(([key, value]) => {
      scope.setContext(key, value);
    });
    Sentry.captureException(error);
  });
}

/**
 * Start a performance transaction
 */
export function startTransaction(name, op = 'http.request') {
  return null;
}

/**
 * High-order component to wrap a React component with error boundary
 */
export function withSentryErrorBoundary(Component, errorBoundaryOptions = {}) {
  return Sentry.withProfiler(
    Sentry.withErrorBoundary(Component, {
      fallback: <ErrorFallback />,
      showDialog: false,
      ...errorBoundaryOptions,
    })
  );
}

/**
 * Error fallback component
 */
function ErrorFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-slate-600 mb-4">
          Our team has been notified. Please try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

/**
 * Create a performance monitoring context
 */
export class SentryPerformanceMonitor {
  constructor(transactionName) {
    this.transaction = startTransaction(transactionName);
    this.startTime = performance.now();
  }

  addSpan(spanName, spanOp = 'db.query') {
    if (this.transaction) {
      return this.transaction.startChild({
        op: spanOp,
        description: spanName,
      });
    }
    return null;
  }

  finish() {
    if (this.transaction) {
      this.transaction.finish();
      const duration = performance.now() - this.startTime;
      console.log(`[Sentry Performance] ${this.transaction.name} completed in ${duration.toFixed(2)}ms`);
    }
  }

  setTag(key, value) {
    if (this.transaction) {
      this.transaction.setTag(key, value);
    }
  }

  setData(key, value) {
    if (this.transaction) {
      this.transaction.setData(key, value);
    }
  }
}