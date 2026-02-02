/**
 * Sentry Error Boundary Component
 * Catches errors and sends them to Sentry while displaying user-friendly messages
 */

import React from 'react';
import * as Sentry from '@sentry/react';
import { AlertTriangle } from 'lucide-react';

/**
 * Main Error Boundary Component
 * Wraps the entire application to catch React component errors
 */
export class SentryErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Error Boundary caught error:', error, errorInfo);

    // Capture the error context
    this.setState({
      error,
      errorInfo,
      errorId: Sentry.captureException(error, { contexts: { react: errorInfo } }),
    });

    // Send to Sentry with context
    Sentry.withScope((scope) => {
      scope.setContext('error_boundary', {
        componentStack: errorInfo.componentStack,
        errorMessage: error.toString(),
      });
      Sentry.captureException(error);
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
    
    // Optionally navigate to home
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Fallback UI for when an error is caught
 */
function ErrorBoundaryFallback({ error, errorInfo, errorId, onReset }) {
  const isDevelopment = import.meta.env.DEV;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-6 border border-red-200">
        {/* Error Icon */}
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Error Title */}
        <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">
          Oops! Something went wrong
        </h1>

        {/* Error Description */}
        <p className="text-center text-slate-600 mb-4">
          We've logged this error and will investigate. Please try refreshing the page.
        </p>

        {/* Error ID */}
        {errorId && (
          <div className="mb-4 p-3 bg-slate-50 rounded border border-slate-200">
            <p className="text-xs text-slate-600 font-mono break-all">
              Error ID: {errorId}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Share this ID with support if the problem persists.
            </p>
          </div>
        )}

        {/* Development Error Details */}
        {isDevelopment && errorInfo && (
          <div className="mb-4 p-3 bg-yellow-50 rounded border border-yellow-200 max-h-48 overflow-auto">
            <p className="text-xs font-semibold text-yellow-900 mb-2">
              Development Details:
            </p>
            <pre className="text-xs text-yellow-800 whitespace-pre-wrap break-words font-mono">
              {error?.toString()}
              {'\n\n'}
              {errorInfo.componentStack}
            </pre>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 px-4 py-2 bg-slate-200 text-slate-900 rounded font-medium hover:bg-slate-300 transition"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Custom hook for error handling in functional components
 */
export function useErrorHandler() {
  return (error, context = {}) => {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
      Sentry.captureException(error);
    });
    
    throw error;
  };
}

/**
 * Component-level error boundary for specific sections
 */
export function withErrorBoundary(Component, fallback = null) {
  const Wrapped = (props) => (
    <Sentry.ErrorBoundary
      fallback={fallback || <ErrorBoundaryFallback />}
      showDialog
    >
      <Component {...props} />
    </Sentry.ErrorBoundary>
  );

  Wrapped.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return Wrapped;
}

/**
 * Async error handler for promises and async operations
 */
export function handleAsyncError(error, context = {}) {
  console.error('Async error caught:', error);
  
  Sentry.withScope((scope) => {
    scope.setContext('async_operation', {
      ...context,
      timestamp: new Date().toISOString(),
    });
    Sentry.captureException(error);
  });

  // Re-throw to prevent silent failures
  throw error;
}

export default SentryErrorBoundary;
