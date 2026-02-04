import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { adminAPI } from '@/api/admin-api';
import { checkPermission, getPermissionsForRole, isAdminRole, isSuperAdminRole } from './permissions';

const AdminContext = createContext();

const ADMIN_EMAIL = 'fernandogarzaaa@gmail.com'; // Hardcoded admin email
const ADMIN_CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export const AdminProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState('user');
  const [permissions, setPermissions] = useState({});
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true);
  const [adminCheckError, setAdminCheckError] = useState(null);
  const [lastAdminCheck, setLastAdminCheck] = useState(null);
  const [adminSessionTimeout, setAdminSessionTimeout] = useState(null);

  /**
   * Fetch admin status from backend
   */
  const fetchAdminStatusFromBackend = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setIsAdmin(false);
      setUserRole('user');
      setPermissions({});
      setIsLoadingAdmin(false);
      return;
    }

    try {
      setAdminCheckError(null);
      const response = await adminAPI.checkAdminStatus();
      
      if (response && response.data) {
        const { isAdmin: adminStatus, role } = response.data;
        
        // Defense-in-depth: check both backend role AND hardcoded email
        const isAdminUser = (adminStatus || user.email === ADMIN_EMAIL) && isAdminRole(role);
        
        setIsAdmin(isAdminUser);
        setUserRole(role || 'user');
        
        // Fetch permissions for the role
        const rolePermissions = getPermissionsForRole(role || 'user');
        setPermissions(rolePermissions);
        
        // Cache the admin status
        localStorage.setItem('adminStatus', JSON.stringify({
          isAdmin: isAdminUser,
          userRole: role,
          permissions: rolePermissions,
          timestamp: Date.now()
        }));
        
        // Set admin session timeout (15 min inactivity)
        setAdminSessionTimeout(Date.now() + 15 * 60 * 1000);
        
        // Log the admin check
        if (isAdminUser) {
          await adminAPI.logAdminAction('admin_session_start', 'system');
        }
      }
    } catch (error) {
      console.error('[AdminContext] Failed to fetch admin status:', error);
      setAdminCheckError(error.message);
      
      // Fall back to cached status if available
      const cachedStatus = localStorage.getItem('adminStatus');
      if (cachedStatus) {
        try {
          const parsed = JSON.parse(cachedStatus);
          if (Date.now() - parsed.timestamp < ADMIN_CACHE_DURATION) {
            setIsAdmin(parsed.isAdmin);
            setUserRole(parsed.userRole);
            setPermissions(parsed.permissions);
          }
        } catch (e) {
          console.error('[AdminContext] Failed to parse cached admin status:', e);
        }
      }
    } finally {
      setIsLoadingAdmin(false);
      setLastAdminCheck(Date.now());
    }
  }, [isAuthenticated, user]);

  /**
   * Load admin context on auth change
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if we should use cached status
      const cachedStatus = localStorage.getItem('adminStatus');
      const shouldUseCached = cachedStatus && 
        Date.now() - JSON.parse(cachedStatus).timestamp < ADMIN_CACHE_DURATION;

      if (shouldUseCached) {
        const parsed = JSON.parse(cachedStatus);
        setIsAdmin(parsed.isAdmin);
        setUserRole(parsed.userRole);
        setPermissions(parsed.permissions);
        setIsLoadingAdmin(false);
        setLastAdminCheck(Date.now());
      } else {
        fetchAdminStatusFromBackend();
      }
    } else {
      setIsAdmin(false);
      setUserRole('user');
      setPermissions({});
      setIsLoadingAdmin(false);
      localStorage.removeItem('adminStatus');
    }
  }, [isAuthenticated, user]);

  /**
   * Check if admin session has timed out
   */
  useEffect(() => {
    if (!isAdmin || !adminSessionTimeout) return;

    const checkTimeout = setInterval(() => {
      if (Date.now() > adminSessionTimeout) {
        setIsAdmin(false);
        setUserRole('user');
        setPermissions({});
        localStorage.removeItem('adminStatus');
        console.warn('[AdminContext] Admin session expired due to inactivity');
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(checkTimeout);
  }, [adminSessionTimeout, isAdmin]);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = useCallback((permission) => {
    if (!isAdmin) return false;
    return checkPermission(userRole, permission);
  }, [isAdmin, userRole]);

  /**
   * Check if user can perform an action
   */
  const canDo = useCallback((permission) => {
    return hasPermission(permission);
  }, [hasPermission]);

  /**
   * Refresh admin status from backend
   */
  const refreshAdminStatus = useCallback(async () => {
    setIsLoadingAdmin(true);
    await fetchAdminStatusFromBackend();
  }, [fetchAdminStatusFromBackend]);

  /**
   * Log an admin action to audit trail
   */
  const logAction = useCallback(async (action, resource, details = {}) => {
    if (!isAdmin) return;
    
    try {
      await adminAPI.logAdminAction(action, resource, details);
    } catch (error) {
      console.error('[AdminContext] Failed to log admin action:', error);
    }
  }, [isAdmin]);

  /**
   * Invalidate admin cache to force refresh
   */
  const invalidateCache = useCallback(() => {
    localStorage.removeItem('adminStatus');
    fetchAdminStatusFromBackend();
  }, [fetchAdminStatusFromBackend]);

  const value = {
    // Status flags
    isAdmin,
    isLoadingAdmin,
    userRole,
    permissions,
    adminCheckError,
    
    // Auth checks
    adminAuthChecks: {
      isAuthenticated: isAuthenticated && isAdmin,
      isAuthorized: hasPermission,
      isSuperAdmin: isSuperAdminRole(userRole),
    },
    
    // Helper methods
    hasPermission,
    canDo,
    refreshAdminStatus,
    logAction,
    invalidateCache,
    lastAdminCheck,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminContext must be used within an AdminProvider');
  }
  return context;
};
