import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Enhanced Error Boundary Components
 *
 * Provides comprehensive error handling with:
 * - Graceful fallback UI
 * - Error logging
 * - Recovery mechanisms
 * - Accessibility support
 */
import React, { Component, Suspense } from 'react';
import { toast } from 'sonner';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card';
// ============================================================================
// Default Error Fallback UI
// ============================================================================
export function DefaultErrorFallback({ error, resetErrorBoundary, componentName }) {
    const [showDetails, setShowDetails] = React.useState(false);
    return (_jsxs(Card, { className: "w-full max-w-lg mx-auto border-red-200 shadow-lg", children: [_jsxs(CardHeader, { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "p-2 rounded-full bg-red-100", children: _jsx(AlertCircle, { className: "w-6 h-6 text-red-600" }) }), _jsx(CardTitle, { className: "text-xl text-red-900", children: "Something went wrong" })] }), _jsx(CardDescription, { children: componentName ? `Error in ${componentName}` : 'An unexpected error occurred' })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx("div", { className: "p-4 bg-red-50 rounded-lg border border-red-100", children: _jsx("p", { className: "text-sm text-red-800 font-medium", children: error.message || 'Unknown error' }) }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsxs(Button, { onClick: resetErrorBoundary, className: "bg-red-600 hover:bg-red-700 text-white", children: [_jsx(RefreshCw, { className: "w-4 h-4 mr-2" }), "Try Again"] }), _jsxs(Button, { variant: "outline", onClick: () => window.location.href = '/', children: [_jsx(Home, { className: "w-4 h-4 mr-2" }), "Go Home"] }), _jsxs(Button, { variant: "ghost", onClick: () => setShowDetails(!showDetails), children: [_jsx(Bug, { className: "w-4 h-4 mr-2" }), showDetails ? 'Hide Details' : 'Show Details'] })] }), showDetails && (_jsx("div", { className: "mt-4 p-4 bg-slate-900 rounded-lg overflow-auto max-h-64", children: _jsx("pre", { className: "text-xs text-slate-300 font-mono whitespace-pre-wrap", children: error.stack }) }))] })] }));
}
// ============================================================================
// Compact Error Fallback (for smaller components)
// ============================================================================
export function CompactErrorFallback({ error, resetErrorBoundary }) {
    return (_jsxs("div", { className: "p-4 bg-red-50 border border-red-200 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-600" }), _jsx("span", { className: "font-semibold text-red-900", children: "Error" })] }), _jsx("p", { className: "text-sm text-red-700 mb-3", children: error.message }), _jsxs(Button, { size: "sm", onClick: resetErrorBoundary, className: "bg-red-600 hover:bg-red-700 text-white", children: [_jsx(RefreshCw, { className: "w-3 h-3 mr-1" }), "Retry"] })] }));
}
// ============================================================================
// Inline Error Fallback (for inline components)
// ============================================================================
export function InlineErrorFallback({ error, resetErrorBoundary }) {
    return (_jsxs("span", { className: "inline-flex items-center gap-1 text-red-600 text-sm", children: [_jsx(AlertCircle, { className: "w-4 h-4" }), _jsx("span", { children: "Failed to load" }), _jsx("button", { onClick: resetErrorBoundary, className: "underline hover:no-underline ml-1", children: "Retry" })] }));
}
// ============================================================================
// Main Error Boundary Component
// ============================================================================
export class ErrorBoundary extends Component {
    resetTimeoutId = null;
    state = {
        hasError: false,
        error: null,
        errorInfo: null,
        prevResetKeys: undefined
    };
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    static getDerivedStateFromProps(props, state) {
        const { hasError } = state;
        const { resetKeys } = props;
        // Only reset when resetKeys actually change (not on every render)
        if (hasError && resetKeys && state.prevResetKeys) {
            const keysChanged = resetKeys.length !== state.prevResetKeys.length ||
                resetKeys.some((key, i) => key !== state.prevResetKeys[i]);
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
            const keysChanged = resetKeys.length !== state.prevResetKeys.length ||
                resetKeys.some((key, i) => key !== state.prevResetKeys[i]);
            if (keysChanged && !hasError) {
                return { prevResetKeys: resetKeys };
            }
        }
        return null;
    }
    componentDidCatch(error, errorInfo) {
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
    componentWillUnmount() {
        if (this.resetTimeoutId) {
            clearTimeout(this.resetTimeoutId);
        }
    }
    logErrorToService(error, errorInfo) {
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
    resetErrorBoundary = () => {
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
    render() {
        const { hasError, error } = this.state;
        const { children, fallback, componentName } = this.props;
        if (hasError && error) {
            if (fallback) {
                return fallback;
            }
            return (_jsx(DefaultErrorFallback, { error: error, resetErrorBoundary: this.resetErrorBoundary, componentName: componentName }));
        }
        return children;
    }
}
export class AsyncErrorBoundary extends Component {
    state = {
        hasError: false,
        error: null,
        errorInfo: null,
        isRetrying: false
    };
    static getDerivedStateFromError(error) {
        return { hasError: true, error, isRetrying: false };
    }
    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        toast.error(`Async Error: ${error.message.substring(0, 100)}`);
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }
    handleRetry = async () => {
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
    render() {
        const { hasError, error, isRetrying } = this.state;
        const { children, componentName } = this.props;
        if (hasError && error) {
            return (_jsx(DefaultErrorFallback, { error: error, resetErrorBoundary: this.handleRetry, componentName: componentName }));
        }
        if (isRetrying) {
            return (_jsx("div", { className: "flex items-center justify-center p-8", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" }), _jsx("p", { className: "text-gray-600", children: "Retrying..." })] }) }));
        }
        return children;
    }
}
// ============================================================================
// HOC for wrapping components with error boundary
// ============================================================================
export function withErrorBoundary(Component, errorBoundaryProps) {
    const WrappedComponent = (props) => (_jsx(ErrorBoundary, { ...errorBoundaryProps, children: _jsx(Component, { ...props }) }));
    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
    return WrappedComponent;
}
// ============================================================================
// Hook for error handling
// ============================================================================
export function useErrorHandler() {
    const [error, setError] = React.useState(null);
    if (error) {
        throw error;
    }
    return React.useCallback((error) => {
        setError(error);
    }, []);
}
export function SuspenseErrorBoundary({ children, suspenseFallback, ...errorBoundaryProps }) {
    return (_jsx(ErrorBoundary, { ...errorBoundaryProps, children: _jsx(Suspense, { fallback: suspenseFallback || _jsx(DefaultSuspenseFallback, {}), children: children }) }));
}
function DefaultSuspenseFallback() {
    return (_jsx("div", { className: "flex items-center justify-center p-8", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" }), _jsx("p", { className: "text-gray-600", children: "Loading..." })] }) }));
}
export default ErrorBoundary;
