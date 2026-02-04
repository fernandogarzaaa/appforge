/*
 * AppForge layout container
 * Licensed under the Apache License, Version 2.0. See LICENSE for details.
 */
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigation } from '@/contexts/NavigationContext';
import { createPageUrl } from '@/utils';
import GlobalTopNav from '@/components/navigation/GlobalTopNav';
import ContextualNav from '@/components/navigation/ContextualNav';
import HelpSidebar from '@/components/help/HelpSidebar';
import MobileDrawerSidebar from '@/components/sidebar/MobileDrawerSidebar';

// Lazy load the sidebar component for code splitting
const ConsolidatedAISidebar = lazy(() => import('@/components/sidebar/ConsolidatedAISidebar'));

// Theme management hook
function useThemeManager() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme-mode');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
      localStorage.setItem('theme-mode', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme-mode', 'light');
    }
  }, [isDark]);

  return { isDark, toggleTheme: () => setIsDark(!isDark) };
}

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
  const { isDark, toggleTheme } = useThemeManager();
  const { selectProject, clearProject } = useNavigation();

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

  useEffect(() => {
    if (currentProject) {
      selectProject(currentProject);
    } else {
      clearProject();
    }
  }, [currentProject, selectProject, clearProject]);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const contextualItems = currentProject
    ? [
        {
          label: 'Build',
          href: `${createPageUrl('PageEditor')}?projectId=${currentProject.id}`,
        },
        {
          label: 'Deploy',
          href: `${createPageUrl('Deployments')}?projectId=${currentProject.id}`,
        },
        {
          label: 'Collaborate',
          href: `${createPageUrl('Collaboration')}?projectId=${currentProject.id}`,
        },
        {
          label: 'Settings',
          href: `${createPageUrl('ProjectSettings')}?projectId=${currentProject.id}`,
        },
      ]
    : [];

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
        <GlobalTopNav 
          user={user} 
          onLogout={handleLogout}
          mobileMenu={
            <MobileDrawerSidebar 
              currentProject={currentProject}
              user={user}
              onClose={() => {}}
            />
          }
        />
        <ContextualNav
          items={contextualItems.map((item) => ({
            ...item,
            isActive: window.location.href.includes(item.href),
          }))}
        />
        <main className="flex-1 overflow-auto bg-[#fafbfc] dark:bg-gray-950">
          {children}
        </main>
      </div>
      <HelpSidebar />
    </div>
  );
}