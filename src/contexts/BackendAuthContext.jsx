import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export const BackendAuthContext = createContext(null);

/**
 * Authentication context - wrapper around Base44's built-in auth
 * Provides a consistent interface for components that use useBackendAuth()
 * All authentication is handled by the Base44 platform
 */
export const BackendAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated on mount using Base44
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err) {
      // User not authenticated - this is normal, not an error
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    // Redirect to Base44's login page
    base44.auth.redirectToLogin(window.location.href);
  };

  const register = async () => {
    // Redirect to Base44's registration/login page
    base44.auth.redirectToLogin(window.location.href);
  };

  const logout = async () => {
    try {
      base44.auth.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    }
  };

  const refreshAuth = async () => {
    await checkAuth();
    return { success: isAuthenticated };
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    loading: isLoading, // alias for compatibility
    error,
    login,
    register,
    logout,
    refreshAuth,
    checkAuth
  };

  return (
    <BackendAuthContext.Provider value={value}>
      {children}
    </BackendAuthContext.Provider>
  );
};

export const useBackendAuth = () => {
  const context = useContext(BackendAuthContext);
  if (!context) {
    // Return a safe default instead of throwing - allows components to work
    // outside the provider during initial render
    return {
      user: null,
      isAuthenticated: false,
      isLoading: true,
      loading: true,
      error: null,
      login: () => base44.auth.redirectToLogin(window.location.href),
      register: () => base44.auth.redirectToLogin(window.location.href),
      logout: () => base44.auth.logout(),
      refreshAuth: async () => ({ success: false }),
      checkAuth: async () => {}
    };
  }
  return context;
};
