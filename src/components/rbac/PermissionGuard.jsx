import React, { useState, useEffect } from 'react';
import { checkPermission } from '@/utils/permissionCheck';

export default function PermissionGuard({ 
  permission, 
  children, 
  userEmail,
  fallback = null,
  showLockedIcon = false 
}) {
  const [hasPermission, setHasPermission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermissionAsync();
  }, [permission, userEmail]);

  const checkPermissionAsync = async () => {
    try {
      setLoading(true);
      const allowed = await checkPermission(userEmail, permission);
      setHasPermission(allowed);
    } catch (error) {
      console.error('Permission check error:', error);
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!hasPermission) {
    if (fallback) {
      return fallback;
    }
    
    if (showLockedIcon) {
      return (
        <div className="p-4 text-center text-slate-500 border border-dashed rounded">
          <span>🔒 Insufficient permissions</span>
        </div>
      );
    }
    
    return null;
  }

  return children;
}