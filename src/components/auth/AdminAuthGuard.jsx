import React from 'react';
import { useAdminContext } from '@/lib/AdminContext';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Admin Authentication Guard Component
 * Blocks non-admins from accessing protected content
 * 
 * Usage:
 * <AdminAuthGuard requiredRole="admin">
 *   <AdminDashboard />
 * </AdminAuthGuard>
 * 
 * Props:
 * - children: Component to render if authorized
 * - requiredRole: 'super_admin' | 'admin' | 'operator' (default: 'admin')
 * - fallback: Component to show if not authorized
 * - onUnauthorized: Callback when unauthorized access is attempted
 */
export default function AdminAuthGuard({ 
  children, 
  requiredRole = 'admin',
  fallback = null,
  onUnauthorized = null
}) {
  const { isAdmin, isLoadingAdmin, userRole, adminAuthChecks } = useAdminContext();

  // Show loading state while checking admin status
  if (isLoadingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-t-2 border-blue-500 rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  // Check authorization
  const isAuthorized = adminAuthChecks.isAuthenticated && 
    (requiredRole === 'admin' ? isAdmin : userRole === requiredRole);

  if (!isAuthorized) {
    // Log unauthorized access attempt
    console.warn(
      `[AdminAuthGuard] Unauthorized access attempt. Required role: ${requiredRole}, User role: ${userRole}`
    );

    // Call onUnauthorized callback
    if (onUnauthorized) {
      onUnauthorized({ requiredRole, userRole, isAdmin });
    }

    // Log to audit trail would happen here (backend call)

    // Show fallback or default 403 error
    return fallback || (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-md w-full p-8">
          <Alert className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <h2 className="font-semibold mb-2">Access Denied (403)</h2>
              <p className="text-sm">
                You do not have permission to access this resource.
              </p>
              <p className="text-xs mt-2 opacity-75">
                Required role: <code className="bg-red-100 dark:bg-red-900 px-1 rounded">{requiredRole}</code>
              </p>
              {process.env.NODE_ENV === 'development' && (
                <p className="text-xs mt-2 opacity-50">
                  Your role: <code className="bg-red-100 dark:bg-red-900 px-1 rounded">{userRole}</code>
                </p>
              )}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // User is authorized, render children
  return children;
}
