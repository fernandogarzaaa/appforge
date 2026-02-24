/**
 * Enhanced Error Boundary Components
 * 
 * Provides comprehensive error handling with:
 * - Graceful fallback UI
 * - Error logging
 * - Recovery mechanisms
 * - Accessibility support
 */

import React, { Component, ErrorInfo, ReactNode, Suspense } from 'react';
import { toast } from 'sonner';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: Array<string | number>;
  componentName?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  componentName?: string;
}

// ============================================================================
// Default Error Fallback UI
// ============================================================================

export function DefaultErrorFallback({ 
  error, 
  resetErrorBoundary,
  componentName 
}: ErrorFallbackProps): React.ReactElement {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <Card className="w-full max-w-lg mx-auto border-red-200 shadow-lg">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-red-100">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl text-red-900">
            Something went wrong
          </CardTitle>
        </div>
        <CardDescription>
          {componentName ? `Error in ${componentName}` : 'An unexpected error occurred'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-red-50 rounded-lg border border-red-100">
          <p className="text-sm text-red-800 font-medium">
            {error.message || 'Unknown error'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={resetErrorBoundary}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/'}
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>

          <Button 
            variant="ghost"
            onClick={() => setShowDetails(!showDetails)}
          >
            <Bug className="w-4 h-4 mr-2" />
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>

        {showDetails && (
          <div className="mt-4 p-4 bg-slate-900 rounded-lg overflow-auto max-h-64">
            <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
              {error.stack}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Compact Error Fallback (for smaller components)
// ============================================================================

export function CompactErrorFallback({ 
  error, 
  resetErrorBoundary 
}: ErrorFallbackProps): React.ReactElement {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <span className="font-semibold text-red-900">Error</span>
      </div>
      <p className="text-sm text-red-700 mb-3">{error.message}</p>
      <Button 
        size="sm" 
        onClick={resetErrorBoundary}
        className="bg-red-600 hover:bg-red-700 text-white"
      >
        <RefreshCw className="w-3 h-3 mr-1" />
        Retry
      </Button>
    </div>
  );
}

// ============================================================================
// Inline Error Fallback (for inline components)
// ============================================================================

export function InlineErrorFallback({ 
  error, 
  resetErrorBoundary 
}: ErrorFallbackProps): React.ReactElement {
  return (
    <span className="inline-flex items-center gap-1 text-red-600 text-sm">
      <AlertCircle className="w-4 h-4" />
      <span>Failed to load</span>
      <button 
        onClick={resetErrorBoundary}
        className="underline hover:no-underline ml-1"
      >
        Retry
      </button>
    </span>
  );
}

// ============================================================================
// Main Error Boundary Component
// ============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState & { prevResetKeys?: Array<string | number> }> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  public state: ErrorBoundaryState & { prevResetKeys?: Array<string | number> } = {
    hasError: false,
    error: null,
    errorInfo: null,
    prevResetKeys: undefined
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public static getDerivedStateFromProps(
    props: ErrorBoundaryProps,
    state: ErrorBoundaryState & { prevResetKeys?: Array<string | number> }
  ): Partial<ErrorBoundaryState & { prevResetKeys?: Array<string | number> }> | null {
    const { hasError } = state;
    const { resetKeys } = props;

    // Only reset when resetKeys actually change (not on every render)
    if (hasError && resetKeys && state.prevResetKeys) {
      const keysChanged =
        resetKeys.length !== state.prevResetKeys.length ||
        resetKeys.some((key, i) => key !== state.prevResetKeys![i]);

      if (keysChanged) {
        return {
          hasError: false,
          error: null,
          errorInfo: null,
          prevResetKeys: resetKeys
        };
      }
    }

    // Track current resetKeys for comparison on next render
    if (resetKeys && !state.prevResetKeys) {
      return { prevResetKeys: resetKeys };
    }
    if (resetKeys && state.prevResetKeys) {
      const keysChanged =
        resetKeys.length !== state.prevResetKeys.length ||
        resetKeys.some((key, i) => key !== state.prevResetKeys![i]);
      if (keysChanged && !hasError) {
        return { prevResetKeys: resetKeys };
      }
    }

    return null;
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error to console
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

    // Show toast notification
    toast.error(`Error: ${error.message.substring(0, 100)}`, {
      description: this.props.componentName || 'Component Error',
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service (placeholder)
    this.logErrorToService(error, errorInfo);
  }

  public componentWillUnmount(): void {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo): void {
    // Placeholder for external error logging service
    // Example: Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
      console.log('[ErrorBoundary] Would send to error tracking service:', {
        error: error.toString(),
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    }
  }

  private resetErrorBoundary = (): void => {
    const { onReset } = this.props;

    if (onReset) {
      onReset();
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  public render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, componentName } = this.props;

    if (hasError && error) {
      if (fallback) {
        return fallback;
      }

      return (
        <DefaultErrorFallback
          error={error}
          resetErrorBoundary={this.resetErrorBoundary}
          componentName={componentName}
        />
      );
    }

    return children;
  }
}

// ============================================================================
// Async Error Boundary (for handling async errors)
// ============================================================================

interface AsyncErrorBoundaryState extends ErrorBoundaryState {
  isRetrying: boolean;
}

export class AsyncErrorBoundary extends Component<ErrorBoundaryProps, AsyncErrorBoundaryState> {
  public state: AsyncErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    isRetrying: false
  };

  public static getDerivedStateFromError(error: Error): Partial<AsyncErrorBoundaryState> {
    return { hasError: true, error, isRetrying: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    toast.error(`Async Error: ${error.message.substring(0, 100)}`);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = async (): Promise<void> => {
    this.setState({ isRetrying: true });
    
    // Simulate retry delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (this.props.onReset) {
      this.props.onReset();
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false
    });
  };

  public render(): ReactNode {
    const { hasError, error, isRetrying } = this.state;
    const { children, componentName } = this.props;

    if (hasError && error) {
      return (
        <DefaultErrorFallback
          error={error}
          resetErrorBoundary={this.handleRetry}
          componentName={componentName}
        />
      );
    }

    if (isRetrying) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Retrying...</p>
          </div>
        </div>
      );
    }

    return children;
  }
}

// ============================================================================
// HOC for wrapping components with error boundary
// ============================================================================

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

// ============================================================================
// Hook for error handling
// ============================================================================

export function useErrorHandler(): (error: Error) => void {
  const [error, setError] = React.useState<Error | null>(null);

  if (error) {
    throw error;
  }

  return React.useCallback((error: Error) => {
    setError(error);
  }, []);
}

// ============================================================================
// Suspense Wrapper with Error Boundary
// ============================================================================

interface SuspenseErrorBoundaryProps extends ErrorBoundaryProps {
  suspenseFallback?: ReactNode;
}

export function SuspenseErrorBoundary({
  children,
  suspenseFallback,
  ...errorBoundaryProps
}: SuspenseErrorBoundaryProps): React.ReactElement {
  return (
    <ErrorBoundary {...errorBoundaryProps}>
      <Suspense fallback={suspenseFallback || <DefaultSuspenseFallback />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

function DefaultSuspenseFallback(): React.ReactElement {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default ErrorBoundary;
