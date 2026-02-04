import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminContext } from '@/lib/AdminContext';

/**
 * Protected Admin Route Higher-Order Component
 * Wraps route definitions to protect admin pages
 * 
 * Usage:
 * const AdminDashboardRoute = (
 *   <ProtectedAdminRoute requiredRole="admin">
 *     <AdminDashboard />
 *   </ProtectedAdminRoute>
 * )
 * 
 * Props:
 * - children: Component to render if authorized
 * - requiredRole: 'super_admin' | 'admin' | 'operator' (default: 'admin')
 * - redirectTo: Path to redirect non-admins (default: '/dashboard')
 * - onProtectedRouteAccess: Callback when route is accessed
 */
export default function ProtectedAdminRoute({ 
  children, 
  requiredRole = 'admin',
  redirectTo = '/dashboard',
  onProtectedRouteAccess = null
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isLoadingAdmin, userRole, adminAuthChecks } = useAdminContext();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for admin context to load
    if (isLoadingAdmin) return;

    // Check authorization
    const isAuthorized = adminAuthChecks.isAuthenticated && 
      (requiredRole === 'admin' ? isAdmin : userRole === requiredRole);

    if (!isAuthorized) {
      console.warn(
        `[ProtectedAdminRoute] Unauthorized route access. ` +
        `Path: ${location.pathname}, Required role: ${requiredRole}, User role: ${userRole}`
      );
      
      // Redirect to fallback page
      navigate(redirectTo, { replace: true, state: { from: location } });
    } else {
      // Call callback on authorized access
      if (onProtectedRouteAccess) {
        onProtectedRouteAccess({ requiredRole, userRole, path: location.pathname });
      }
    }

    setIsChecking(false);
  }, [isLoadingAdmin, isAdmin, userRole, adminAuthChecks, navigate, location, requiredRole, redirectTo]);

  // Show loading spinner while checking
  if (isLoadingAdmin || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-200 dark:border-blue-900 border-t-blue-500 rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Render protected component
  return children;
}
