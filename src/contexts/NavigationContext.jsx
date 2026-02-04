import React, { createContext, useState, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const NavigationContext = createContext();

/**
 * Navigation Context - Manages navigation state, breadcrumbs, and project context
 */
export function NavigationProvider({ children }) {
  const location = useLocation();
  const [currentProject, setCurrentProject] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-generate breadcrumbs from location
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const crumbs = pathSegments.map((segment, index) => {
      const path = '/' + pathSegments.slice(0, index + 1).join('/');
      return {
        label: segment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        path,
      };
    });
    
    setBreadcrumbs([
      { label: 'Home', path: '/' },
      ...crumbs,
    ]);
  }, [location]);

  // Cmd+K / Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectProject = (project) => {
    setCurrentProject(project);
  };

  const clearProject = () => {
    setCurrentProject(null);
  };

  const openSearch = () => {
    setIsSearchOpen(true);
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const value = {
    currentProject,
    selectProject,
    clearProject,
    breadcrumbs,
    isSearchOpen,
    searchQuery,
    setSearchQuery,
    openSearch,
    closeSearch,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
