/**
 * Mobile Navigation Drawer
 * Drawer overlay for mobile navigation, shows sidebar content
 * Licensed under the Apache License, Version 2.0. See LICENSE for details.
 */
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { useNavigation } from '@/hooks/useNavigation';
import { getRoutesByCategory } from '@/lib/navigationRoutes';

export default function MobileDrawer({ isOpen, onClose }) {
  const { userMode, isAdmin } = useNavigation();
  const location = useLocation();

  const routesByCategory = React.useMemo(() => {
    return getRoutesByCategory(userMode, isAdmin);
  }, [userMode, isAdmin]);

  // Close drawer on route change
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const isActive = (path) => location.pathname === path;

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
        : 'text-spectrum-gray-700 dark:text-spectrum-gray-300 active:bg-spectrum-purple-50 dark:active:bg-spectrum-purple-900/30'
    }`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed left-0 top-0 z-50 w-72 h-screen bg-white dark:bg-spectrum-gray-900 border-r border-spectrum-gray-200 dark:border-spectrum-gray-800 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-spectrum-gray-200 dark:border-spectrum-gray-800 bg-white dark:bg-spectrum-gray-900">
              <h2 className="font-bold text-spectrum-gray-900 dark:text-white">Menu</h2>
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-spectrum-gray-100 dark:hover:bg-spectrum-gray-800 transition-colors"
                aria-label="Close menu"
              >
                <X size={20} className="text-spectrum-gray-600 dark:text-spectrum-gray-400" />
              </button>
            </div>

            {/* Navigation Content */}
            <nav className="px-3 py-4 space-y-6">
              {/* Main Routes */}
              {routesByCategory.main.length > 0 && (
                <div>
                  <div className="px-2 mb-3 text-xs font-semibold text-spectrum-gray-500 dark:text-spectrum-gray-400 uppercase tracking-wide">
                    Main
                  </div>
                  <div className="space-y-1">
                    {routesByCategory.main.map(route => (
                      <Link
                        key={route.path}
                        to={route.path}
                        className={navItemClasses(isActive(route.path))}
                      >
                        <span className="flex-shrink-0 text-spectrum-purple-600 dark:text-spectrum-purple-400">
                          {renderIcon(route.icon)}
                        </span>
                        <span>{route.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Advanced Routes */}
              {routesByCategory.advanced.length > 0 && (
                <div>
                  <div className="px-2 mb-3 text-xs font-semibold text-spectrum-gray-500 dark:text-spectrum-gray-400 uppercase tracking-wide">
                    Advanced
                  </div>
                  <div className="space-y-1">
                    {routesByCategory.advanced.map(route => (
                      <Link
                        key={route.path}
                        to={route.path}
                        className={navItemClasses(isActive(route.path))}
                      >
                        <span className="flex-shrink-0 text-spectrum-indigo-600 dark:text-spectrum-indigo-400">
                          {renderIcon(route.icon)}
                        </span>
                        <span>{route.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Routes */}
              {routesByCategory.admin.length > 0 && (
                <div>
                  <div className="px-2 mb-3 text-xs font-semibold text-spectrum-red-600 dark:text-spectrum-red-400 uppercase tracking-wide flex items-center gap-2">
                    🔧 Admin
                  </div>
                  <div className="space-y-1">
                    {routesByCategory.admin.map(route => (
                      <Link
                        key={route.path}
                        to={route.path}
                        className={navItemClasses(isActive(route.path))}
                      >
                        <span className="flex-shrink-0 text-spectrum-red-600 dark:text-spectrum-red-400">
                          {renderIcon(route.icon)}
                        </span>
                        <span>{route.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </nav>

            {/* Footer */}
            <div className="mt-auto p-4 border-t border-spectrum-gray-200 dark:border-spectrum-gray-800">
              <div className="text-sm text-spectrum-gray-600 dark:text-spectrum-gray-400 mb-2">
                Mode: <span className="font-semibold capitalize">{userMode}</span>
              </div>
              {isAdmin && (
                <div className="text-sm text-spectrum-purple-600 dark:text-spectrum-purple-400">
                  👑 Admin Access Active
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
