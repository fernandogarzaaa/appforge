import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AuthGuard({ 
  children, 
  requireAdmin = false, 
  requirePermission = null,
  fallback = null 
}) {
  const [user, setUser] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, [requireAdmin, requirePermission]);

  const checkPermissions = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      // Check admin requirement
      if (requireAdmin && userData.role !== 'admin') {
        setHasPermission(false);
        setLoading(false);
        return;
      }

      // Check specific permission
      if (requirePermission) {
        const permissions = await base44.entities.UserPermission.filter({
          user_email: userData.email,
          permission: requirePermission
        });
        setHasPermission(permissions.length > 0 || userData.role === 'admin');
      } else {
        setHasPermission(true);
      }

      setLoading(false);
    } catch (error) {
      setHasPermission(false);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!hasPermission) {
    if (fallback) return fallback;
    
    return (
      <div className="flex items-center justify-center min-h-[400px] p-8">
        <Alert className="max-w-md">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this feature. Contact an administrator for access.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}

// Hook for checking permissions in components
export function usePermission(permission) {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermission();
  }, [permission]);

  const checkPermission = async () => {
    try {
      const user = await base44.auth.me();
      
      if (user.role === 'admin') {
        setHasPermission(true);
        setLoading(false);
        return;
      }

      const permissions = await base44.entities.UserPermission.filter({
        user_email: user.email,
        permission: permission
      });
      
      setHasPermission(permissions.length > 0);
      setLoading(false);
    } catch (error) {
      setHasPermission(false);
      setLoading(false);
    }
  };

  return { hasPermission, loading };
}