/**
 * Navigation Routes Registry
 * Central configuration for all navigation items with visibility rules
 * Licensed under the Apache License, Version 2.0. See LICENSE for details.
 */

export const ROUTES = [
  // Core Routes - Everyone
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    visibility: 'all',
    category: 'main',
  },
  {
    path: '/projects',
    label: 'My Projects',
    icon: 'Folder',
    visibility: 'all',
    category: 'main',
  },
  {
    path: '/marketplace',
    label: 'Marketplace',
    icon: 'Store',
    visibility: 'all',
    category: 'main',
  },
  {
    path: '/documentation',
    label: 'Documentation',
    icon: 'BookOpen',
    visibility: 'all',
    category: 'main',
  },
  {
    path: '/support',
    label: 'Support',
    icon: 'HelpCircle',
    visibility: 'all',
    category: 'main',
  },

  // Advanced Mode Routes
  {
    path: '/api-playground',
    label: 'API Playground',
    icon: 'Code',
    visibility: 'advanced-mode',
    category: 'advanced',
  },
  {
    path: '/environment-variables',
    label: 'Environment Variables',
    icon: 'Settings',
    visibility: 'advanced-mode',
    category: 'advanced',
  },
  {
    path: '/logs-monitoring',
    label: 'Logs & Monitoring',
    icon: 'Activity',
    visibility: 'advanced-mode',
    category: 'advanced',
  },
  {
    path: '/quantum-lab',
    label: 'Quantum Lab',
    icon: 'Zap',
    visibility: 'advanced-mode',
    category: 'advanced',
  },

  // Admin Routes
  {
    path: '/admin',
    label: 'Admin Dashboard',
    icon: 'Settings',
    visibility: 'admin-only',
    category: 'admin',
  },
  {
    path: '/admin/users',
    label: 'User Management',
    icon: 'Users',
    visibility: 'admin-only',
    category: 'admin',
  },
  {
    path: '/admin/system',
    label: 'System Settings',
    icon: 'Settings',
    visibility: 'admin-only',
    category: 'admin',
  },
  {
    path: '/admin/audit-logs',
    label: 'Audit Logs',
    icon: 'ClipboardList',
    visibility: 'admin-only',
    category: 'admin',
  },
];

/**
 * Filter routes based on user permissions
 */
export function getVisibleRoutes(userMode = 'beginner', isAdmin = false) {
  return ROUTES.filter(route => {
    if (route.visibility === 'all') return true;
    if (route.visibility === 'admin-only') return isAdmin;
    if (route.visibility === 'advanced-mode') return userMode === 'advanced' || isAdmin;
    return false;
  });
}

/**
 * Get routes grouped by category
 */
export function getRoutesByCategory(userMode = 'beginner', isAdmin = false) {
  const visibleRoutes = getVisibleRoutes(userMode, isAdmin);
  const grouped = {
    main: [],
    advanced: [],
    admin: [],
  };

  visibleRoutes.forEach(route => {
    if (grouped[route.category]) {
      grouped[route.category].push(route);
    }
  });

  return grouped;
}

/**
 * Find a route by path
 */
export function findRoute(path) {
  return ROUTES.find(route => route.path === path);
}

/**
 * Get breadcrumb trail from path
 */
export function getBreadcrumbs(path) {
  const parts = path.split('/').filter(Boolean);
  const breadcrumbs = [{ label: 'Dashboard', path: '/dashboard' }];

  let currentPath = '';
  parts.forEach(part => {
    currentPath += `/${part}`;
    const route = findRoute(currentPath);
    if (route) {
      breadcrumbs.push({
        label: route.label,
        path: route.path,
      });
    }
  });

  return breadcrumbs;
}
