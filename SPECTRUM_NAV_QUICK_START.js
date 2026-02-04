// ============================================================================
// SPECTRUM NAVIGATION & LAYOUT SYSTEM - QUICK START
// ============================================================================

// 1. VERIFY INSTALLATION
// All files should now exist:
// ✅ src/components/layout/SpectrumNavigation.jsx
// ✅ src/components/layout/TopNav.jsx
// ✅ src/components/layout/SpectrumSidebar.jsx
// ✅ src/components/layout/MobileDrawer.jsx
// ✅ src/components/layout/Breadcrumbs.jsx
// ✅ src/hooks/useNavigation.js
// ✅ src/contexts/NavigationContext.jsx
// ✅ src/lib/navigationRoutes.js
// ✅ src/App.jsx (updated with NavigationProvider)
// ✅ src/Layout.jsx (updated with SpectrumNavigation)

// ============================================================================
// 2. BASIC USAGE IN COMPONENTS
// ============================================================================

import { useNavigation } from '@/hooks/useNavigation';

function MyComponent() {
  const { 
    userMode,           // 'beginner' | 'advanced'
    isAdmin,            // boolean
    sidebarCollapsed,   // boolean
    darkMode,           // boolean
    currentRoute,       // current page path
    toggleSidebar,      // function
    toggleDarkMode,     // function
    updateUserMode,     // function
    setAdminStatus,     // function
  } = useNavigation();

  return (
    <div>
      <p>Mode: {userMode}</p>
      <button onClick={toggleSidebar}>Toggle Sidebar</button>
      {isAdmin && <p>You are an admin</p>}
    </div>
  );
}

// ============================================================================
// 3. ACCESSING ROUTES
// ============================================================================

import { getVisibleRoutes, getRoutesByCategory } from '@/lib/navigationRoutes';

// Get all visible routes for a user
const routes = getVisibleRoutes('advanced', false);

// Get routes grouped by category
const grouped = getRoutesByCategory('beginner', true);
// { main: [...], advanced: [...], admin: [...] }

// ============================================================================
// 4. COMPONENT HIERARCHY
// ============================================================================

// App Structure:
// App.jsx
//   ↓
// NavigationProvider
//   ↓
// AuthProvider, LLMProvider, etc.
//   ↓
// Router (React Router)
//   ↓
// Layout.jsx (from pages.config.jsx)
//   ↓
// SpectrumNavigation
//   ├── TopNav (header)
//   ├── SpectrumSidebar (left sidebar)
//   ├── MobileDrawer (mobile menu)
//   ├── Breadcrumbs (navigation path)
//   └── {children} (page content)

// ============================================================================
// 5. REMOVE OLD NAVIGATION FROM PAGES
// ============================================================================

// BEFORE (old page):
export default function Dashboard() {
  return (
    <div>
      <Header />  {/* REMOVE THIS */}
      <div>Dashboard content</div>
    </div>
  );
}

// AFTER (with new layout):
export default function Dashboard() {
  return (
    <div className="p-6">
      {/* Breadcrumbs render automatically */}
      <h1>Dashboard</h1>
      <div>Dashboard content</div>
    </div>
  );
}

// Layout.jsx automatically wraps your page with SpectrumNavigation
// which provides TopNav, Sidebar, and Breadcrumbs

// ============================================================================
// 6. CUSTOMIZE BREADCRUMBS
// ============================================================================

import Breadcrumbs from '@/components/layout/Breadcrumbs';

export default function CustomPage() {
  const customBreadcrumbs = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Projects', path: '/projects' },
    { label: 'My Project', path: '/projects/123' }
  ];

  return (
    <div>
      <Breadcrumbs customBreadcrumbs={customBreadcrumbs} />
      <h1>My Project</h1>
    </div>
  );
}

// ============================================================================
// 7. ADD CUSTOM ROUTES
// ============================================================================

// Edit src/lib/navigationRoutes.js to add custom routes:

export const ROUTES = [
  // ... existing routes ...
  {
    path: '/my-custom-feature',
    label: 'Custom Feature',
    icon: 'Zap',  // lucide-react icon name
    visibility: 'all',  // 'all', 'admin-only', 'advanced-mode'
    category: 'main',   // 'main', 'advanced', 'admin'
  },
];

// ============================================================================
// 8. ADMIN MODE CONTROL
// ============================================================================

// In your authentication/user context:
import { useNavigation } from '@/hooks/useNavigation';

useEffect(() => {
  if (user && user.isAdmin) {
    setAdminStatus(true);  // Enable admin mode
  }
}, [user]);

// Now admin-only routes and menu items appear automatically

// ============================================================================
// 9. SWITCHING USER MODE
// ============================================================================

import { useNavigation } from '@/hooks/useNavigation';

function ModeSelector() {
  const { userMode, updateUserMode } = useNavigation();

  return (
    <div>
      <button 
        onClick={() => updateUserMode('beginner')}
        className={userMode === 'beginner' ? 'active' : ''}
      >
        Beginner Mode
      </button>
      <button 
        onClick={() => updateUserMode('advanced')}
        className={userMode === 'advanced' ? 'active' : ''}
      >
        Advanced Mode
      </button>
    </div>
  );
}

// Mode preference is auto-saved to localStorage

// ============================================================================
// 10. KEYBOARD SHORTCUTS
// ============================================================================

// ⌘K or Ctrl+K : Focus search bar
// (automatic, handled in TopNav)

// ============================================================================
// 11. DARK MODE
// ============================================================================

// System automatically detects dark mode preference
// User can toggle via sun/moon icon in TopNav
// Preference persists in localStorage

import { useNavigation } from '@/hooks/useNavigation';

function DarkModeAware() {
  const { darkMode } = useNavigation();

  return (
    <div className={darkMode ? 'dark' : ''}>
      {/* Dark mode automatically applied */}
    </div>
  );
}

// ============================================================================
// 12. STYLING WITH SPECTRUM COLORS
// ============================================================================

// Use the Spectrum color system for consistency:
// bg-spectrum-purple-600
// text-spectrum-gray-700
// border-spectrum-indigo-200
// dark:bg-spectrum-purple-900
// dark:text-spectrum-gray-300
// dark:border-spectrum-indigo-800

// These colors are defined in: src/config/spectrum-colors.js

// ============================================================================
// 13. ICONS
// ============================================================================

// All sidebar and menu icons use lucide-react
// Icon names are in ROUTES: 'LayoutDashboard', 'Folder', 'Settings', etc.

// To use custom icons in your components:
import { LayoutDashboard, Users, Settings } from 'lucide-react';

// Size: 20px (standard for navigation)

// ============================================================================
// 14. MOBILE RESPONSIVENESS
// ============================================================================

// Desktop (md+): Sidebar always visible
// Mobile (< md): Sidebar hidden, hamburger menu shows drawer

// Responsive breakpoints (from Tailwind):
// sm: 640px
// md: 768px   ← Sidebar visibility changes here
// lg: 1024px
// xl: 1280px
// 2xl: 1536px

// ============================================================================
// 15. DEPLOYMENT VERIFICATION
// ============================================================================

// Run these checks before deploying:

// 1. No console errors:
//    npm run dev
//    Check browser console

// 2. Sidebar toggles smoothly:
//    Click the chevron icon in sidebar header

// 3. Mobile drawer works:
//    Resize to < 768px, click hamburger menu

// 4. Dark mode persists:
//    Toggle dark mode, reload page

// 5. Routes visible correctly:
//    Check sidebar for all expected items
//    Toggle user mode to see advanced items

// 6. Admin items appear/disappear:
//    Set isAdmin in user context

// 7. Search shortcut works:
//    Press ⌘K or Ctrl+K

// ============================================================================
// 16. FILE STRUCTURE SUMMARY
// ============================================================================

/*
src/
├── components/
│   └── layout/
│       ├── SpectrumNavigation.jsx       ← Main container
│       ├── TopNav.jsx                   ← Header
│       ├── SpectrumSidebar.jsx          ← Left sidebar
│       ├── MobileDrawer.jsx             ← Mobile menu
│       └── Breadcrumbs.jsx              ← Navigation path
├── contexts/
│   └── NavigationContext.jsx            ← State & context
├── hooks/
│   └── useNavigation.js                 ← Custom hook
├── lib/
│   └── navigationRoutes.js              ← Route registry
├── App.jsx                              ← Has NavigationProvider
└── Layout.jsx                           ← Uses SpectrumNavigation
*/

// ============================================================================
// 17. SUPPORT
// ============================================================================

// Issues or questions? Check:
// 1. SPECTRUM_NAVIGATION_GUIDE.md - Full implementation guide
// 2. SPECTRUM_NAV_TESTING_CHECKLIST.md - Testing procedures
// 3. Component JSDoc comments - Implementation details
// 4. src/config/spectrum-colors.js - Color system

// ============================================================================
// READY TO DEPLOY ✅
// ============================================================================
