/**
 * Error Tracking & Monitoring Utilities
 * Centralized error handling and reporting
 */

import env from './env';

class ErrorTracker {
  constructor() {
    this.enabled = env.features.errorTracking && env.app.isProduction;
    this.errors = [];
    this.maxErrors = 100;
    
    if (this.enabled) {
      this.initializeSentry();
    }
    
    // Set up global error handlers
    this.setupGlobalHandlers();
  }

  initializeSentry() {
    // Initialize Sentry if DSN is configured
    if (env.services.sentry.dsn) {
      // Try to dynamically import Sentry only if available
      try {
        // Use string template to avoid static analysis
        const sentryPackage = '@sentry/' + 'react';
        import(/* @vite-ignore */ sentryPackage).then(Sentry => {
          Sentry.init({
            dsn: env.services.sentry.dsn,
            environment: env.services.sentry.environment,
            tracesSampleRate: env.app.isProduction ? 0.1 : 1.0,
            integrations: [
              Sentry.browserTracingIntegration?.() || null,
              Sentry.replayIntegration?.({
                maskAllText: true,
                blockAllMedia: true,
              }) || null,
            ].filter(Boolean),
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,
          });
          
          console.log('✅ Sentry initialized');
        }).catch(() => {
          console.warn('Sentry not installed - Error tracking disabled. Install @sentry/react to enable.');
        });
      } catch (err) {
        console.warn('Sentry not available');
      }
    }
  }

  setupGlobalHandlers() {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, {
        type: 'unhandledrejection',
        promise: true,
      });
    });

    // Catch global errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || event.message, {
        type: 'global',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });
  }

  captureError(error, context = {}) {
    const errorData = {
      message: error?.message || String(error),
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      env: env.app.env,
    };

    // Store locally
    this.errors.push(errorData);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console in development
    if (env.app.isDevelopment) {
      console.error('🔴 Error captured:', errorData);
    }

    // Send to Sentry if enabled
    if (this.enabled && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: { custom: context },
      });
    }

    // Send to custom error endpoint
    this.reportToBackend(errorData);

    return errorData;
  }

  captureMessage(message, level = 'info', context = {}) {
    const data = {
      message,
      level,
      timestamp: new Date().toISOString(),
      context,
      url: window.location.href,
    };

    if (env.app.isDevelopment) {
      console.log(`📝 Message [${level}]:`, message, context);
    }

    if (this.enabled && window.Sentry) {
      window.Sentry.captureMessage(message, {
        level,
        contexts: { custom: context },
      });
    }

    return data;
  }

  async reportToBackend(errorData) {
    if (!env.app.isProduction) return;

    try {
      // Report to your backend API
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      });
    } catch (err) {
      console.warn('Failed to report error to backend:', err);
    }
  }

  setUser(user) {
    if (this.enabled && window.Sentry) {
      window.Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
      });
    }
  }

  clearUser() {
    if (this.enabled && window.Sentry) {
      window.Sentry.setUser(null);
    }
  }

  getRecentErrors(count = 10) {
    return this.errors.slice(-count);
  }

  clearErrors() {
    this.errors = [];
  }
}

// Create singleton instance
const errorTracker = new ErrorTracker();

export default errorTracker;

// Convenience exports
export const captureError = (error, context) => errorTracker.captureError(error, context);
export const captureMessage = (message, level, context) => errorTracker.captureMessage(message, level, context);
export const setUser = (user) => errorTracker.setUser(user);
export const clearUser = () => errorTracker.clearUser();
