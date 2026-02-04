/*
 * AppForge layout container
 * Licensed under the Apache License, Version 2.0. See LICENSE for details.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useBackendAuth } from '@/contexts/BackendAuthContext';
import SpectrumNavigation from '@/components/layout/SpectrumNavigation';
import HelpSidebar from '@/components/help/HelpSidebar';

export default function Layout({ children, currentPageName: _currentPageName, onSearchOpen }) {
  const [user, setUser] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const { logout: backendLogout } = useBackendAuth();

  useEffect(() => {
    loadUser();
    loadCurrentProject();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (err) {
      console.error('Failed to load user:', err);
    }
  };

  const loadCurrentProject = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const projectId = urlParams.get('projectId');
      if (projectId) {
        const projects = await base44.entities.Project.filter({ id: projectId });
        if (projects.length > 0) {
          setCurrentProject(projects[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load project:', err);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
    backendLogout(); // Also logout from backend
  };

  return (
    <SpectrumNavigation onSearchOpen={onSearchOpen}>
      <main className="flex-1 overflow-auto bg-white dark:bg-spectrum-gray-950">
        {children}
      </main>
      <HelpSidebar />
    </SpectrumNavigation>
  );
}