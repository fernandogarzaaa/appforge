/**
 * Error Boundary Component
 * 
 * Catches React errors and displays them to users with toast notifications.
 * Fixes the "SILENT_ERRORS" issue from quantum verification.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from 'react-hot-toast';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('[ErrorBoundary] Caught error:', error);
        console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

        // Show toast notification to user
        toast.error(`Error: ${error.message.substring(0, 100)}`, {
            duration: 5000,
            icon: '❌'
        });

        // Log to console for debugging
        console.error('[ErrorBoundary] Full error:', {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack
        });
    }

    public render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="error-boundary p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h2 className="text-red-700 font-semibold mb-2">Something went wrong</h2>
                    <p className="text-red-600 text-sm mb-2">
                        {this.state.error?.message || 'An unknown error occurred'}
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
