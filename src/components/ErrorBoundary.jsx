import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, Check, ChevronDown } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      copied: false,
      showDetails: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Log to analytics/monitoring service in production
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: true
      });
    }
  }

  handleRetry = () => {
    this.setState(prev => ({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: prev.retryCount + 1 
    }));
  };

  handleCopyError = () => {
    const errorText = `Error: ${this.state.error?.toString()}\n\nStack: ${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(errorText);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="max-w-lg w-full"
          >
            {/* Error Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-rose-500 p-6 text-white">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm"
                >
                  <AlertTriangle className="w-8 h-8" />
                </motion.div>
                <h1 className="text-2xl font-bold text-center">Oops! Something went wrong</h1>
                <p className="text-red-100 text-center mt-2 text-sm">
                  We encountered an unexpected error. Don't worry, your data is safe.
                </p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Error Summary */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Bug className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm text-red-700 dark:text-red-300 break-words">
                        {this.state.error?.message || this.state.error?.toString() || 'Unknown error occurred'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expandable Details */}
                {this.state.errorInfo && (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <button
                      onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Technical Details
                      </span>
                      <motion.div
                        animate={{ rotate: this.state.showDetails ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      </motion.div>
                    </button>
                    
                    <motion.div
                      initial={false}
                      animate={{ 
                        height: this.state.showDetails ? 'auto' : 0,
                        opacity: this.state.showDetails ? 1 : 0
                      }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 border-t border-slate-200 dark:border-slate-700">
                        <pre className="text-xs text-slate-600 dark:text-slate-400 overflow-auto max-h-48 bg-slate-100 dark:bg-slate-900 rounded-lg p-3">
                          {this.state.errorInfo.componentStack}
                        </pre>
                        <button
                          onClick={this.handleCopyError}
                          className="mt-3 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                        >
                          {this.state.copied ? (
                            <>
                              <Check className="w-4 h-4 text-green-500" />
                              <span className="text-green-600 dark:text-green-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copy error details</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={this.handleRetry}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/25"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.location.href = '/'}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    Go Home
                  </motion.button>
                </div>

                {/* Retry Count */}
                {this.state.retryCount > 0 && (
                  <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                    Retry attempts: {this.state.retryCount}
                  </p>
                )}
              </div>
            </div>

            {/* Help Text */}
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
              If this problem persists, please contact{' '}
              <a href="/Support" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                support
              </a>
            </p>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
