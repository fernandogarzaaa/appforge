/**
 * Spectrum Sidebar Component
 * Collapsible sidebar with mode-based navigation
 * Shows different items based on userMode (beginner/advanced) and isAdmin status
 * Licensed under the Apache License, Version 2.0. See LICENSE for details.
 */
import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useNavigation } from '@/hooks/useNavigation';
import { getRoutesByCategory } from '@/lib/navigationRoutes';

export default function SpectrumSidebar() {
  const { sidebarCollapsed, toggleSidebar, userMode, isAdmin } = useNavigation();
  const location = useLocation();

  // Get visible routes based on user mode and admin status
  const routesByCategory = useMemo(() => {
    return getRoutesByCategory(userMode, isAdmin);
  }, [userMode, isAdmin]);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const renderIcon = (iconName) => {
    if (!iconName) return null;
    const Icon = LucideIcons[iconName];
    if (!Icon) return null;
    return <Icon size={20} />;
  };

  const navItemClasses = (isItemActive) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      isItemActive
        ? 'bg-spectrum-purple-100 dark:bg-spectrum-purple-900 text-spectrum-purple-700 dark:text-spectrum-purple-300 font-medium'
        : 'text-spectrum-gray-700 dark:text-spectrum-gray-300 hover:bg-spectrum-purple-50 dark:hover:bg-spectrum-purple-900/30'
    }`;

  return (
    <>
      {/* Sidebar Container */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 80 : 280 }}
        transition={{ duration: 0.2 }}
        className="hidden md:flex flex-col bg-white dark:bg-spectrum-gray-900 border-r border-spectrum-gray-200 dark:border-spectrum-gray-800 h-screen overflow-hidden shadow-sm"
      >
        {/* Header - Toggle Button */}
        <div className="flex items-center justify-between p-4 border-b border-spectrum-gray-200 dark:border-spectrum-gray-800">
          {!sidebarCollapsed && (
            <h2 className="font-bold text-spectrum-gray-900 dark:text-white text-sm">
              Navigation
            </h2>
          )}
          <button
            onClick={toggleSidebar}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-spectrum-gray-100 dark:hover:bg-spectrum-gray-800 transition-colors text-spectrum-gray-600 dark:text-spectrum-gray-400"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Content */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Routes */}
          {routesByCategory.main.length > 0 && (
            <div>
              {!sidebarCollapsed && (
                <div className="px-2 mb-3 text-xs font-semibold text-spectrum-gray-500 dark:text-spectrum-gray-400 uppercase tracking-wide">
                  Main
                </div>
              )}
              <div className="space-y-1">
                {routesByCategory.main.map(route => (
                  <Link
                    key={route.path}
                    to={route.path}
                    className={navItemClasses(isActive(route.path))}
                    title={sidebarCollapsed ? route.label : undefined}
                  >
                    <span className="flex-shrink-0 text-spectrum-purple-600 dark:text-spectrum-purple-400">
                      {renderIcon(route.icon)}
                    </span>
                    {!sidebarCollapsed && <span>{route.label}</span>}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Advanced Routes */}
          {routesByCategory.advanced.length > 0 && (
            <div>
              {!sidebarCollapsed && (
                <div className="px-2 mb-3 text-xs font-semibold text-spectrum-gray-500 dark:text-spectrum-gray-400 uppercase tracking-wide">
                  Advanced
                </div>
              )}
              <div className="space-y-1">
                {routesByCategory.advanced.map(route => (
                  <Link
                    key={route.path}
                    to={route.path}
                    className={navItemClasses(isActive(route.path))}
                    title={sidebarCollapsed ? route.label : undefined}
                  >
                    <span className="flex-shrink-0 text-spectrum-indigo-600 dark:text-spectrum-indigo-400">
                      {renderIcon(route.icon)}
                    </span>
                    {!sidebarCollapsed && <span>{route.label}</span>}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Admin Routes */}
          {routesByCategory.admin.length > 0 && (
            <div>
              {!sidebarCollapsed && (
                <div className="px-2 mb-3 text-xs font-semibold text-spectrum-red-600 dark:text-spectrum-red-400 uppercase tracking-wide flex items-center gap-2">
                  🔧 Admin
                </div>
              )}
              <div className="space-y-1">
                {routesByCategory.admin.map(route => (
                  <Link
                    key={route.path}
                    to={route.path}
                    className={navItemClasses(isActive(route.path))}
                    title={sidebarCollapsed ? route.label : undefined}
                  >
                    <span className="flex-shrink-0 text-spectrum-red-600 dark:text-spectrum-red-400">
                      {renderIcon(route.icon)}
                    </span>
                    {!sidebarCollapsed && <span>{route.label}</span>}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Footer - User Mode Indicator */}
        {!sidebarCollapsed && (
          <div className="mt-auto p-4 border-t border-spectrum-gray-200 dark:border-spectrum-gray-800">
            <div className="text-xs text-spectrum-gray-600 dark:text-spectrum-gray-400 mb-2">
              Mode: <span className="font-semibold capitalize">{userMode}</span>
            </div>
            {isAdmin && (
              <div className="text-xs text-spectrum-purple-600 dark:text-spectrum-purple-400">
                👑 Admin Access Active
              </div>
            )}
          </div>
        )}
      </motion.aside>
    </>
  );
}
