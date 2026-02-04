/**
 * Spectrum Navigation Layout Container
 * Main container component that combines all navigation elements
 * Licensed under the Apache License, Version 2.0. See LICENSE for details.
 */
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigation } from '@/hooks/useNavigation';
import TopNav from './TopNav';
import SpectrumSidebar from './SpectrumSidebar';
import MobileDrawer from './MobileDrawer';
import Breadcrumbs from './Breadcrumbs';

export default function SpectrumNavigation({ children, onSearchOpen }) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const location = useLocation();
  const { updateCurrentRoute, darkMode } = useNavigation();

  // Update current route context
  useEffect(() => {
    updateCurrentRoute(location.pathname);
  }, [location.pathname, updateCurrentRoute]);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-white dark:bg-spectrum-gray-950 text-spectrum-gray-900 dark:text-white">
        {/* Sidebar - Desktop only */}
        <SpectrumSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navigation */}
          <TopNav
            onMenuClick={() => setMobileDrawerOpen(true)}
            onSearchOpen={onSearchOpen}
          />

          {/* Breadcrumbs */}
          <Breadcrumbs />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Mobile Drawer - Mobile only */}
        <MobileDrawer
          isOpen={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
        />
      </div>
    </div>
  );
}
