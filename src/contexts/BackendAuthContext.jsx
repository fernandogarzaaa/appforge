import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '@/api/appforge';

export const BackendAuthContext = createContext();

/**
 * Authentication context for backend (Express) API
 * Separate from base44 AuthContext for platform authentication
 */
export const BackendAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await authService.me();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Auth check failed:', err);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  const register = async (username, email, password) => {
    setError(null);
    try {
      const response = await authService.register(username, email, password);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  };

  const refreshAuth = async () => {
    try {
      const response = await authService.refresh();
      setUser(response.user);
      return response;
    } catch (err) {
      logout();
      throw err;
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
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
    throw new Error('useBackendAuth must be used within BackendAuthProvider');
  }
  return context;
};
