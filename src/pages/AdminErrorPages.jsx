import React from 'react';
import { AlertCircle, Lock, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * 403 Unauthorized Error Page
 * Displayed when user lacks required permissions
 */
export function Forbidden() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full">
              <Lock className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            403
          </h1>
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Access Denied
          </h2>

          <p className="text-slate-600 dark:text-slate-400 mb-6">
            You do not have permission to access this resource.
            Please contact your administrator if you believe this is an error.
          </p>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-4 mb-6">
            <p className="text-sm text-red-800 dark:text-red-300">
              <strong>Security Note:</strong> This access attempt has been logged for audit purposes.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              Return to Dashboard
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-500 mt-6">
          If you need assistance, contact support
        </p>
      </div>
    </div>
  );
}

/**
 * 404 Not Found Error Page
 * Displayed when admin page doesn't exist
 */
export function AdminNotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-full">
              <AlertCircle className="h-12 w-12 text-orange-600 dark:text-orange-400" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            404
          </h1>
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Admin Page Not Found
          </h2>

          <p className="text-slate-600 dark:text-slate-400 mb-6">
            The admin page you're looking for doesn't exist or has been moved.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Tip:</strong> Check the URL and try again, or navigate to admin dashboard.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/admin')}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              Go to Admin Dashboard
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-500 mt-6">
          Error code: ADMIN_404
        </p>
      </div>
    </div>
  );
}

/**
 * Generic Admin Access Denied Component
 * For use in components that need to display permission errors
 */
export function AccessDenied({ message = null, permission = null }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-1">
                Permission Required
              </h3>
              <p className="text-red-700 dark:text-red-400 text-sm mb-4">
                {message || 'You do not have permission to access this resource.'}
              </p>
              {permission && (
                <p className="text-xs text-red-600 dark:text-red-500 font-mono bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                  Required: {permission}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default {
  Forbidden,
  AdminNotFound,
  AccessDenied,
};
