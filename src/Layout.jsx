import React, { useState, useEffect, Suspense, lazy } from 'react';
import { base44 } from '@/api/base44Client';
import { useBackendAuth } from '@/contexts/BackendAuthContext';
import Header from '@/components/layout/Header';
import HelpSidebar from '@/components/help/HelpSidebar';
import MobileDrawerSidebar from '@/components/sidebar/MobileDrawerSidebar';

// Lazy load the sidebar component for code splitting
const ConsolidatedAISidebar = lazy(() => import('@/components/sidebar/ConsolidatedAISidebar'));

// Fallback loading skeleton for sidebar
function SidebarFallback() {
  return (
    <div className="w-80 bg-white dark:bg-gray-900 h-screen shadow-sm animate-pulse">
      <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 dark:border-gray-800/50">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 w-20 rounded" />
        <div className="h-7 w-7 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 w-24 rounded" />
            <div className="space-y-2">
              {[...Array(2)].map((_, j) => (
                <div key={j} className="h-9 bg-gray-100 dark:bg-gray-800 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Layout({ children, currentPageName: _currentPageName, onSearchOpen }) {
  const [user, setUser] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { logout: backendLogout, user: backendUser } = useBackendAuth();

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
    backendLogout(); // Also logout from backend
  };

  return (
    <div className="flex h-screen bg-[#fafbfc] dark:bg-gray-950">
      {/* Desktop Sidebar - Hidden on mobile (< md:768px) */}
      <div className="hidden md:block">
        <Suspense fallback={<SidebarFallback />}>
          <ConsolidatedAISidebar 
            currentProject={currentProject} 
            collapsed={sidebarCollapsed}
            user={user}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </Suspense>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          user={user} 
          onLogout={handleLogout}
          onSearchOpen={onSearchOpen}
          mobileMenu={
            <MobileDrawerSidebar 
              currentProject={currentProject}
              user={user}
              onClose={() => {}}
            />
          }
        />
        <main className="flex-1 overflow-auto bg-[#fafbfc] dark:bg-gray-950">
          {children}
        </main>
      </div>
      <HelpSidebar />
    </div>
  );
}