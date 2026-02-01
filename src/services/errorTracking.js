/**
 * Error Tracking Service
 * Centralized error logging and monitoring
 */

import { analyticsService } from './analytics';

class ErrorTrackingService {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
    this.sessionId = this.generateSessionId();
    this.setupGlobalHandlers();
  }

  /**
   * Setup global error handlers
   */
  setupGlobalHandlers() {
    // Uncaught errors
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'uncaught',
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        type: 'unhandled_rejection',
      });
    });

    // Console error tracking
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.captureError({
        message: args.join(' '),
        type: 'console_error',
        args,
      });
      originalConsoleError.apply(console, args);
    };
  }

  /**
   * Capture error
   */
  captureError(error) {
    const errorEntry = {
      ...error,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      id: this.generateErrorId(),
    };

    this.errors.push(errorEntry);

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Track in analytics
    analyticsService.trackEvent('error_occurred', {
      type: error.type,
      message: error.message?.substring(0, 100),
    });

    // Send to backend (if configured)
    this.sendToBackend(errorEntry);

    return errorEntry.id;
  }

  /**
   * Send error to backend
   */
  async sendToBackend(error) {
    const endpoint = import.meta.env.VITE_ERROR_TRACKING_ENDPOINT;
    if (!endpoint) return;

    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error),
      });
    } catch (err) {
      // Silently fail to avoid infinite loop
      console.warn('Failed to send error to backend:', err);
    }
  }

  /**
   * Get all errors
   */
  getErrors() {
    return [...this.errors];
  }

  /**
   * Get errors by type
   */
  getErrorsByType(type) {
    return this.errors.filter((e) => e.type === type);
  }

  /**
   * Clear all errors
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate error ID
   */
  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error summary
   */
  getErrorSummary() {
    const byType = {};
    this.errors.forEach((error) => {
      byType[error.type] = (byType[error.type] || 0) + 1;
    });

    return {
      total: this.errors.length,
      byType,
      recent: this.errors.slice(-5),
      sessionId: this.sessionId,
    };
  }
}

export const errorTrackingService = new ErrorTrackingService();
export default errorTrackingService;
