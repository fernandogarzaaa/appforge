/**
 * Top Navigation Component
 * Global header with logo, search, notifications, user dropdown, and theme toggle
 * Licensed under the Apache License, Version 2.0. See LICENSE for details.
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  Settings,
  LogOut,
  Zap,
  Shield,
} from 'lucide-react';
import { useNavigation } from '@/hooks/useNavigation';

export default function TopNav({ onMenuClick, onSearchOpen }) {
  const { darkMode, toggleDarkMode, isAdmin } = useNavigation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const userMenuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut for search (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onSearchOpen?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSearchOpen]);

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-spectrum-gray-900 border-b border-spectrum-gray-200 dark:border-spectrum-gray-800 transition-colors duration-200">
      <div className="px-4 py-3 flex items-center justify-between gap-4">
        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-4">
          {/* Hamburger Menu - Mobile only */}
          <button
            onClick={onMenuClick}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-spectrum-gray-100 dark:hover:bg-spectrum-gray-800 transition-colors"
            aria-label="Menu"
          >
            <Menu size={20} className="text-spectrum-gray-700 dark:text-spectrum-gray-300" />
          </button>

          {/* Logo + Branding */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-spectrum-purple-500 to-spectrum-indigo-600 flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg text-spectrum-gray-900 dark:text-white hidden sm:inline">
              AppForge
            </span>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-md">
          <div
            onClick={onSearchOpen}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-spectrum-gray-100 dark:bg-spectrum-gray-800 hover:bg-spectrum-gray-200 dark:hover:bg-spectrum-gray-700 transition-colors cursor-pointer group"
          >
            <Search size={16} className="text-spectrum-gray-500 dark:text-spectrum-gray-400" />
            <span className="text-sm text-spectrum-gray-500 dark:text-spectrum-gray-400 flex-1">
              Search...
            </span>
            <kbd className="hidden sm:inline text-xs px-2 py-1 rounded bg-spectrum-gray-200 dark:bg-spectrum-gray-700 text-spectrum-gray-600 dark:text-spectrum-gray-300">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Notifications, Theme, User Menu */}
        <div className="flex items-center gap-2">
          {/* Notifications Bell */}
          <button className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-spectrum-gray-100 dark:hover:bg-spectrum-gray-800 transition-colors group">
            <Bell size={20} className="text-spectrum-gray-700 dark:text-spectrum-gray-300 group-hover:text-spectrum-purple-600 dark:group-hover:text-spectrum-purple-400 transition-colors" />
            {notifications > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-spectrum-red-500 rounded-full" />
            )}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-spectrum-gray-100 dark:hover:bg-spectrum-gray-800 transition-colors group"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <Sun size={20} className="text-spectrum-amber-500 group-hover:text-spectrum-amber-600 transition-colors" />
            ) : (
              <Moon size={20} className="text-spectrum-gray-700 group-hover:text-spectrum-purple-600 transition-colors" />
            )}
          </button>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-spectrum-purple-100 dark:bg-spectrum-purple-900 hover:bg-spectrum-purple-200 dark:hover:bg-spectrum-purple-800 transition-colors text-spectrum-purple-600 dark:text-spectrum-purple-300 font-semibold"
            >
              U
            </button>

            {/* User Dropdown Menu */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 rounded-lg bg-white dark:bg-spectrum-gray-800 shadow-lg border border-spectrum-gray-200 dark:border-spectrum-gray-700 overflow-hidden"
                >
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-spectrum-gray-200 dark:border-spectrum-gray-700">
                    <p className="font-semibold text-spectrum-gray-900 dark:text-white">User Name</p>
                    <p className="text-sm text-spectrum-gray-600 dark:text-spectrum-gray-400">
                      user@example.com
                    </p>
                  </div>

                  {/* Menu Items */}
                  <nav className="py-2">
                    <button className="w-full px-4 py-2 text-left text-sm text-spectrum-gray-700 dark:text-spectrum-gray-300 hover:bg-spectrum-gray-100 dark:hover:bg-spectrum-gray-700 transition-colors flex items-center gap-3">
                      <Settings size={16} />
                      Settings
                    </button>

                    {/* Admin Console Link */}
                    {isAdmin && (
                      <button className="w-full px-4 py-2 text-left text-sm text-spectrum-purple-600 dark:text-spectrum-purple-400 hover:bg-spectrum-purple-50 dark:hover:bg-spectrum-purple-900/30 transition-colors flex items-center gap-3 font-medium">
                        <Shield size={16} />
                        Admin Console
                      </button>
                    )}

                    <div className="my-1 border-t border-spectrum-gray-200 dark:border-spectrum-gray-700" />

                    <button className="w-full px-4 py-2 text-left text-sm text-spectrum-red-600 dark:text-spectrum-red-400 hover:bg-spectrum-red-50 dark:hover:bg-spectrum-red-900/30 transition-colors flex items-center gap-3">
                      <LogOut size={16} />
                      Logout
                    </button>
                  </nav>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Admin indicator badge */}
      {isAdmin && (
        <div className="px-4 py-1 bg-spectrum-purple-50 dark:bg-spectrum-purple-900/30 border-t border-spectrum-purple-200 dark:border-spectrum-purple-800 text-xs text-spectrum-purple-700 dark:text-spectrum-purple-300 font-medium">
          👑 Administrator Mode Active
        </div>
      )}
    </header>
  );
}
