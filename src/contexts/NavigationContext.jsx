/**
 * Navigation Context Provider
 * Manages global navigation state including user mode, admin status, and sidebar state
 * Licensed under the Apache License, Version 2.0. See LICENSE for details.
 */
import React, { createContext, useState, useCallback, useEffect } from 'react';

export const NavigationContext = createContext();

export function NavigationProvider({ children }) {
  const [userMode, setUserMode] = useState('beginner');
  const [isAdmin, setIsAdmin] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true' || 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [currentRoute, setCurrentRoute] = useState('/dashboard');

  // Persist dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Persist user mode preference
  useEffect(() => {
    localStorage.setItem('userMode', userMode);
  }, [userMode]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  const updateUserMode = useCallback((mode) => {
    if (['beginner', 'advanced'].includes(mode)) {
      setUserMode(mode);
    }
  }, []);

  const setAdminStatus = useCallback((status) => {
    setIsAdmin(!!status);
  }, []);

  const updateCurrentRoute = useCallback((route) => {
    setCurrentRoute(route);
  }, []);

  const value = {
    userMode,
    isAdmin,
    sidebarCollapsed,
    darkMode,
    currentRoute,
    toggleSidebar,
    toggleDarkMode,
    updateUserMode,
    setAdminStatus,
    updateCurrentRoute,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}
