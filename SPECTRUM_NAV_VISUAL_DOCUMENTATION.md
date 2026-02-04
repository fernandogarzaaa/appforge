/**
 * SPECTRUM NAVIGATION SYSTEM - VISUAL COMPONENT DIAGRAM
 * 
 * This file shows the visual structure and relationships between components
 */

// ============================================================================
// 1. APPLICATION HIERARCHY
// ============================================================================

/*
┌─ App.jsx ──────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌─ NavigationProvider ─────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  ┌─ ErrorBoundary ──────────────────────────────────────┐   │  │
│  │  │                                                        │   │  │
│  │  │  ┌─ ThemeProvider ──────────────────────────────┐    │   │  │
│  │  │  │                                               │    │   │  │
│  │  │  │  ┌─ LLMProvider ────────────────────────┐   │    │   │  │
│  │  │  │  │                                       │   │    │   │  │
│  │  │  │  │  ┌─ AuthProvider ─────────────────┐ │   │    │   │  │
│  │  │  │  │  │                                 │ │   │    │   │  │
│  │  │  │  │  │  ┌─ BackendAuthProvider ────┐  │ │   │    │   │  │
│  │  │  │  │  │  │                          │  │ │   │    │   │  │
│  │  │  │  │  │  │  ┌─ ActivityProvider ──┐ │  │ │   │    │   │  │
│  │  │  │  │  │  │  │                      │ │  │ │   │    │   │  │
│  │  │  │  │  │  │  │  ┌─ Collaboration ┐ │ │  │ │   │    │   │  │
│  │  │  │  │  │  │  │  │                 │ │ │  │ │   │    │   │  │
│  │  │  │  │  │  │  │  │  ┌─ Router ──┐ │ │ │  │ │   │    │   │  │
│  │  │  │  │  │  │  │  │  │           │ │ │ │  │ │   │    │   │  │
│  │  │  │  │  │  │  │  │  │ ┌─ Layout ┤ │ │ │  │ │   │    │   │  │
│  │  │  │  │  │  │  │  │  │ │         │ │ │ │  │ │   │    │   │  │
│  │  │  │  │  │  │  │  │  │ └────────┘ │ │ │ │  │ │   │    │   │  │
│  │  │  │  │  │  │  │  │  │           │ │ │ │  │ │   │    │   │  │
│  │  │  │  │  │  │  │  │  └─────────┘ │ │ │  │ │   │    │   │  │
│  │  │  │  │  │  │  │  │                 │ │  │ │   │    │   │  │
│  │  │  │  │  │  │  │  └─────────────────┘ │  │ │   │    │   │  │
│  │  │  │  │  │  │  │                      │  │ │   │    │   │  │
│  │  │  │  │  │  │  └──────────────────────┘  │ │   │    │   │  │
│  │  │  │  │  │  │                            │ │   │    │   │  │
│  │  │  │  │  │  └────────────────────────────┘ │   │    │   │  │
│  │  │  │  │  │                                 │   │    │   │  │
│  │  │  │  │  └─────────────────────────────────┘   │    │   │  │
│  │  │  │  │                                         │    │   │  │
│  │  │  │  └─────────────────────────────────────────┘    │   │  │
│  │  │  │                                                  │    │   │  │
│  │  │  └──────────────────────────────────────────────────┘    │   │  │
│  │  │                                                            │   │  │
│  │  └────────────────────────────────────────────────────────────┘   │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
*/

// ============================================================================
// 2. LAYOUT COMPONENT STRUCTURE
// ============================================================================

/*
┌─ Layout.jsx ─────────────────────────────────────────────────────┐
│                                                                    │
│  ┌─ SpectrumNavigation ─────────────────────────────────────┐   │
│  │                                                             │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │  TopNav (h-16)                                      │  │   │
│  │  │  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  │  │   │
│  │  │  │ Logo     │  │    Search    │  │ Notifications│  │  │   │
│  │  │  │ + Menu   │  │  (⌘K focus)  │  │ Theme Dark   │  │  │   │
│  │  │  └──────────┘  └──────────────┘  └──────────────┘  │  │   │
│  │  │  ┌──────────────────────────────────────────────┐  │  │   │
│  │  │  │ Admin Indicator (if isAdmin)                 │  │  │   │
│  │  │  └──────────────────────────────────────────────┘  │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  ┌────────────────┐  ┌──────────────────────────────────┐  │   │
│  │  │ Sidebar (md+)  │  │ Breadcrumbs                      │  │   │
│  │  │ ┌──────────────┤  │                                  │  │   │
│  │  │ │ Navigation   │  └──────────────────────────────────┘  │   │
│  │  │ │ • Main       │                                         │   │
│  │  │ │ • Advanced   │  ┌──────────────────────────────────┐  │   │
│  │  │ │ • Admin (if) │  │                                  │  │   │
│  │  │ │              │  │   Main Content                   │  │   │
│  │  │ │              │  │   ({children})                   │  │   │
│  │  │ │ Toggle [<-]  │  │                                  │  │   │
│  │  │ └──────────────┤  │                                  │  │   │
│  │  │ Collapsed: 80px│  │                                  │  │   │
│  │  │ Expanded: 280px│  │                                  │  │   │
│  │  └────────────────┘  └──────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  ┌─ MobileDrawer (mobile only) ─────────────────────────┐  │   │
│  │  │ (Slides from left on top of content)                 │  │   │
│  │  │ Full navigation tree for mobile                      │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
*/

// ============================================================================
// 3. RESPONSIVE LAYOUT CHANGES
// ============================================================================

/*
DESKTOP (1024px+):
┌─────────────────────────────────────────────────────────────┐
│ TopNav                                                        │
├──────────┬─────────────────────────────────────────────────┤
│ Sidebar  │ Breadcrumbs                                      │
│ (280px)  ├─────────────────────────────────────────────────┤
│          │                                                  │
│ • Main   │            Main Content                          │
│ • Adv    │                                                  │
│ • Admin  │                                                  │
│          │                                                  │
│ [<] | [>]│                                                  │
└──────────┴─────────────────────────────────────────────────┘

COLLAPSED:
┌─────────────────────────────────────────────────────────────┐
│ TopNav                                                        │
├────┬────────────────────────────────────────────────────────┤
│ ◆  │ Breadcrumbs                                           │
│ 📁 ├────────────────────────────────────────────────────────┤
│ 🛍️  │                                                        │
│ 📖 │            Main Content                                │
│ ❓ │                                                        │
│    │                                                        │
│ [>] │                                                        │
└────┴────────────────────────────────────────────────────────┘

TABLET (768px - 1023px):
┌─────────────────────────────────────────────────────────────┐
│ TopNav (hamburger visible)                                   │
├──────────┬─────────────────────────────────────────────────┤
│ Sidebar  │ Breadcrumbs                                      │
│ (240px)  ├─────────────────────────────────────────────────┤
│          │                                                  │
│ Compact  │            Main Content                          │
│ view     │                                                  │
│          │                                                  │
└──────────┴─────────────────────────────────────────────────┘

MOBILE (320px - 767px):
┌────────────────────────────────────────┐
│ TopNav [≡]                              │
├────────────────────────────────────────┤
│ Breadcrumbs (horizontal scroll)         │
├────────────────────────────────────────┤
│                                        │
│       Main Content                     │
│       Full Width                       │
│                                        │
└────────────────────────────────────────┘

When [≡] clicked, drawer opens:
┌─────────────────┐  ┌─────────────────────────┐
│ Menu [X]        │  │ Overlay Blur            │
│ ├─ Main         │  │  (click to close)       │
│ ├─ Dashboard    │  │                         │
│ ├─ Projects     │  │                         │
│ ├─ Adv          │  │                         │
│ ├─ ⚡ Quantum   │  │                         │
│ ├─ Admin        │  │                         │
│ │ └─ 🔧 System  │  │                         │
│ └─ Logout       │  │                         │
└─────────────────┘  └─────────────────────────┘
*/

// ============================================================================
// 4. COMPONENT DATA FLOW
// ============================================================================

/*
User Interaction:
┌─────────────────┐
│  User Actions   │
└────────┬────────┘
         │
    ┌────┴────────────────────────────────────┐
    │                                         │
┌───▼─────┐  ┌──────────────┐  ┌────────────▼───┐
│ TopNav  │  │ Sidebar      │  │ Mobile Drawer  │
│ • Search│  │ • Collapse   │  │ • Toggle       │
│ • Theme │  │ • Route click│  │ • Route click  │
│ • Menu  │  │ • Mode info  │  │ • Close btn    │
└───┬─────┘  └──────┬───────┘  └────────┬───────┘
    │               │                  │
    └───────────────┼──────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ NavigationContext     │
        │                       │
        │ • userMode            │
        │ • isAdmin             │
        │ • sidebarCollapsed    │
        │ • darkMode            │
        │ • currentRoute        │
        └───────┬───────────────┘
                │
    ┌───────────┼───────────┐
    │           │           │
    ▼           ▼           ▼
 TopNav     Sidebar    Breadcrumbs
 Updates    Updates    Auto-Updates
*/

// ============================================================================
// 5. ROUTE VISIBILITY MATRIX
// ============================================================================

/*
Route Visibility Rules:
                   Beginner  Advanced  Admin
────────────────────────────────────────────
Dashboard            ✓         ✓        ✓
Projects             ✓         ✓        ✓
Marketplace          ✓         ✓        ✓
Documentation        ✓         ✓        ✓
Support              ✓         ✓        ✓
────────────────────────────────────────────
API Playground       ✗         ✓        ✓
Env Variables        ✗         ✓        ✓
Logs & Monitoring    ✗         ✓        ✓
⚛️ Quantum Lab       ✗         ✓        ✓
────────────────────────────────────────────
Admin Dashboard      ✗         ✗        ✓
User Management      ✗         ✗        ✓
System Settings      ✗         ✗        ✓
Audit Logs          ✗         ✗        ✓
────────────────────────────────────────────

Legend:
✓ = Route visible
✗ = Route hidden

Note: Admin users (isAdmin=true) see ALL routes
      regardless of userMode setting
*/

// ============================================================================
// 6. COLOR SYSTEM MAPPING
// ============================================================================

/*
Text Colors:
├─ Spectrum Gray      (Main text)
│  ├─ Light:  text-spectrum-gray-700
│  └─ Dark:   text-spectrum-gray-300
│
├─ Spectrum Purple    (Active state)
│  ├─ Light:  text-spectrum-purple-700
│  └─ Dark:   text-spectrum-purple-300
│
├─ Spectrum Indigo    (Advanced items)
│  ├─ Light:  text-spectrum-indigo-600
│  └─ Dark:   text-spectrum-indigo-400
│
└─ Spectrum Red       (Admin items)
   ├─ Light:  text-spectrum-red-600
   └─ Dark:   text-spectrum-red-400

Background Colors:
├─ Active Item
│  ├─ Light:  bg-spectrum-purple-100
│  └─ Dark:   bg-spectrum-purple-900
│
├─ Hover Item
│  ├─ Light:  bg-spectrum-purple-50
│  └─ Dark:   bg-spectrum-purple-900/30
│
├─ Sidebar/TopNav
│  ├─ Light:  bg-white
│  └─ Dark:   bg-spectrum-gray-900
│
└─ Borders
   ├─ Light:  border-spectrum-gray-200
   └─ Dark:   border-spectrum-gray-800
*/

// ============================================================================
// 7. STATE MANAGEMENT DIAGRAM
// ============================================================================

/*
NavigationContext State Tree:

NavigationContext {
  
  // User Mode (Default: 'beginner')
  userMode: 'beginner' | 'advanced'
  └─ Controls: API Playground, Quantum Lab visibility
  └─ Persists: localStorage['userMode']
  └─ Updates: updateUserMode(mode)
  
  // Admin Status (Default: false)
  isAdmin: boolean
  └─ Controls: Admin Dashboard visibility
  └─ Persists: In-memory (should be from user object)
  └─ Updates: setAdminStatus(status)
  
  // Sidebar Collapse (Default: false)
  sidebarCollapsed: boolean
  └─ Controls: Sidebar width animation
  └─ Persists: In-memory (could add localStorage)
  └─ Updates: toggleSidebar()
  
  // Dark Mode (Default: system preference)
  darkMode: boolean
  └─ Controls: Applied via 'dark' class
  └─ Persists: localStorage['darkMode']
  └─ Updates: toggleDarkMode()
  └─ System: matchMedia('(prefers-color-scheme: dark)')
  
  // Current Route (Default: '/dashboard')
  currentRoute: string
  └─ Controls: Breadcrumb generation
  └─ Persists: In-memory
  └─ Updates: updateCurrentRoute(route)
}
*/

// ============================================================================
// 8. ANIMATION SPECIFICATIONS
// ============================================================================

/*
Sidebar Collapse Animation:
┌─ Width: 280px → 80px (collapsed)
├─ Duration: 200ms
├─ Easing: ease-in-out
└─ Use: Framer Motion animate prop

Mobile Drawer Animation:
┌─ Slide: translateX(-280px) → translateX(0)
├─ Duration: 300ms
├─ Easing: spring
│  ├─ stiffness: 400
│  └─ damping: 40
├─ Opacity: 0 → 1 (backdrop)
└─ Use: Framer Motion

Dropdown Menu Animation:
┌─ Opacity: 0 → 1
├─ Y Position: -8px → 0
├─ Duration: 150ms
└─ Use: Framer Motion AnimatePresence

Color Transitions:
┌─ Duration: 200ms
├─ Property: background-color, color
└─ Use: CSS transition

Smooth scrolling:
└─ behavior: smooth (CSS)
*/

// ============================================================================
// 9. KEYBOARD INTERACTION FLOW
// ============================================================================

/*
⌘K / Ctrl+K (Global):
┌─ Captured in: TopNav useEffect
├─ Handler: onSearchOpen callback
├─ Action: Opens search modal
└─ Prevent: Default ⌘K behavior

Tab Key (Navigation):
┌─ Focus order: Menu → Sidebar → Content → Drawer
├─ Links in sidebar: Tabnable
├─ Buttons: All tabnable
└─ Managed by: Browser default

Escape Key (Drawer/Menu):
├─ Closes dropdown menu
├─ Closes mobile drawer
└─ Handled by: useEffect click-outside

Arrow Keys (Future):
├─ Up/Down: Navigate menu items
├─ Left/Right: Collapse/expand sidebar
└─ Status: Not yet implemented

Enter Key:
├─ Activates focused button/link
└─ Managed by: Browser default
*/

// ============================================================================
// 10. FILE IMPORT DEPENDENCY GRAPH
// ============================================================================

/*
App.jsx
├─ NavigationProvider (from NavigationContext)
│  └─ [Wraps entire app]
│
Layout.jsx
├─ SpectrumNavigation
│  ├─ TopNav
│  │  ├─ Framer Motion
│  │  ├─ lucide-react (Icons)
│  │  └─ useNavigation hook
│  │
│  ├─ SpectrumSidebar
│  │  ├─ Framer Motion
│  │  ├─ useNavigation hook
│  │  ├─ useLocation (React Router)
│  │  ├─ getRoutesByCategory (navigationRoutes)
│  │  └─ lucide-react (Icons)
│  │
│  ├─ MobileDrawer
│  │  ├─ Framer Motion
│  │  ├─ useNavigation hook
│  │  ├─ useLocation (React Router)
│  │  ├─ getRoutesByCategory (navigationRoutes)
│  │  └─ lucide-react (Icons)
│  │
│  └─ Breadcrumbs
│     ├─ useLocation (React Router)
│     ├─ getBreadcrumbs (navigationRoutes)
│     └─ lucide-react (ChevronRight)
│
useNavigation (hook)
└─ NavigationContext
   └─ No external dependencies
   
navigationRoutes (utilities)
└─ No external dependencies
*/

// ============================================================================
// 11. DEPLOYMENT ARCHITECTURE
// ============================================================================

/*
Code Bundling:
┌─ Webpack/Vite Bundle
│
├─ Main Bundle (~500KB gzipped)
│  ├─ Core React Components
│  ├─ Navigation System (+23KB)
│  │  ├─ SpectrumNavigation.jsx
│  │  ├─ TopNav.jsx
│  │  ├─ SpectrumSidebar.jsx
│  │  ├─ MobileDrawer.jsx
│  │  ├─ Breadcrumbs.jsx
│  │  ├─ NavigationContext.jsx
│  │  ├─ useNavigation.js
│  │  └─ navigationRoutes.js
│  ├─ Other Components
│  └─ Dependencies (React, Framer Motion, Lucide, Tailwind)
│
├─ Code Splitting (Lazy Loaded)
│  ├─ Page Components
│  └─ Feature Modules
│
└─ Assets
   ├─ CSS (Tailwind)
   ├─ Fonts
   └─ Icons (Inline SVG)

Performance Budget:
├─ Navigation System: 23KB gzipped
├─ Framer Motion: ~30KB
├─ Lucide Icons: ~8KB
└─ Total Impact: ~61KB gzipped
*/

// ============================================================================
// 12. TESTING COVERAGE MAP
// ============================================================================

/*
Unit Tests:
├─ navigationRoutes.js
│  ├─ getVisibleRoutes()
│  ├─ getRoutesByCategory()
│  ├─ findRoute()
│  └─ getBreadcrumbs()
│
├─ NavigationContext.jsx
│  ├─ Initial state
│  ├─ All action creators
│  └─ localStorage persistence
│
└─ useNavigation.js
   └─ Hook functionality

Component Tests:
├─ TopNav.jsx
│  ├─ Render all elements
│  ├─ Search focus (⌘K)
│  ├─ Dark mode toggle
│  ├─ User menu open/close
│  └─ Admin badge visibility
│
├─ SpectrumSidebar.jsx
│  ├─ Collapse/expand animation
│  ├─ Route visibility
│  ├─ Active state highlighting
│  └─ Dark mode colors
│
├─ MobileDrawer.jsx
│  ├─ Open/close animation
│  ├─ Overlay blur effect
│  ├─ Route navigation
│  └─ Auto-close handlers
│
├─ Breadcrumbs.jsx
│  ├─ Auto-generation
│  ├─ Custom breadcrumbs
│  └─ Link functionality
│
└─ SpectrumNavigation.jsx
   ├─ Full layout render
   ├─ All sub-components
   └─ Route updates

Integration Tests:
├─ App.jsx with NavigationProvider
├─ Layout.jsx with SpectrumNavigation
├─ Route changes update breadcrumbs
├─ Mode/admin changes update sidebar
└─ Dark mode applies globally

E2E Tests:
├─ Desktop workflow
├─ Mobile workflow
├─ Responsive design
└─ All features functional
*/

export const VISUAL_DOCUMENTATION = {
  components: 'See component hierarchy above',
  responsiveness: 'See responsive layout changes',
  colors: 'See color system mapping',
  animations: 'See animation specifications',
  testing: 'See testing coverage map'
};
