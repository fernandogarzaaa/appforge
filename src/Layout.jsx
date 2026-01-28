import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import HelpSidebar from '@/components/help/HelpSidebar';

export default function Layout({ children, currentPageName: _currentPageName, onSearchOpen }) {
  const [user, setUser] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    loadUser();
    loadCurrentProject();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const loadCurrentProject = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectId');
    if (projectId) {
      const projects = await base44.entities.Project.filter({ id: projectId });
      if (projects.length > 0) {
        setCurrentProject(projects[0]);
      }
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="flex h-screen bg-[#fafbfc] dark:bg-gray-950">
      <Sidebar 
        currentProject={currentProject} 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          user={user} 
          onLogout={handleLogout}
          onSearchOpen={onSearchOpen}
        />
        <main className="flex-1 overflow-auto bg-[#fafbfc] dark:bg-gray-950">
          {children}
        </main>
      </div>
      <HelpSidebar />
    </div>
  );
}