import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
          <div className="max-w-2xl p-8 bg-white rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="font-mono text-sm text-red-800">
                {this.state.error && this.state.error.toString()}
              </p>
            </div>
            {this.state.errorInfo && (
              <details className="mb-4">
                <summary className="cursor-pointer text-slate-600 hover:text-slate-800">
                  Show error details
                </summary>
                <pre className="mt-2 p-4 bg-slate-100 rounded text-xs overflow-auto max-h-64">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
