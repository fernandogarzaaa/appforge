import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '@/api/appforge';

export const BackendAuthContext = createContext(null);

/**
 * Authentication context for backend (Express) API
 * Separate from base44 AuthContext for platform authentication
 * Uses HTTP-only cookies for token storage (secure, no JS access)
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
    try {
      // Call /auth/me endpoint to verify session
      // Server sends JWT via HTTP-only cookie, no JS token access needed
      const userData = await authService.me();
      
      // userData should be the user object from the API response
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Auth check failed:', err.message);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await authService.login({ email, password });
      
      // Response should contain user data from API
      // Token is handled via HTTP-only cookie by server
      if (response?.user) {
        setUser(response.user);
        setIsAuthenticated(true);
      }
      
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMsg);
      throw err;
    }
  };

  const register = async (username, email, password) => {
    setError(null);
    try {
      const response = await authService.register({ 
        username, 
        email, 
        password,
        name: username 
      });
      
      // Response should contain user data from API
      if (response?.user) {
        setUser(response.user);
        setIsAuthenticated(true);
      }
      
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Registration failed';
      setError(errorMsg);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    }
  };

  const refreshAuth = async () => {
    try {
      // For HTTP-only cookie auth, refresh is handled by the server
      // Call checkAuth to verify the session is still valid
      await checkAuth();
      return { success: isAuthenticated };
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
