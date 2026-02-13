/*
 * AppForge core application shell
 * Licensed under the Apache License, Version 2.0. See LICENSE for details.
 */
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config.jsx'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { ThemeProvider } from '@/context/ThemeContext';
import { LLMProvider } from '@/contexts/LLMContext';
import { BackendAuthProvider } from '@/contexts/BackendAuthContext';
import { ActivityProvider } from '@/contexts/ActivityContext';
import { CollaborationProvider } from '@/contexts/CollaborationContext';
import { PrivateRoute } from '@/components/PrivateRoute';
import { OfflineIndicator } from '@/hooks/useOfflineDetection';
import { SearchModal } from '@/components/SearchModal';
import ErrorBoundary from '@/components/ErrorBoundary';
import AuthGuard from '@/components/auth/AuthGuard';
import AdminLayout from '@/components/admin/AdminLayout';
import React, { useEffect, lazy, Suspense } from 'react';
import PageLoader from './components/common/PageLoader';
import { validateEnv } from '@/utils/env';
import errorTracker, { setUser, clearUser } from '@/utils/errorTracking';
import { startHealthMonitoring } from '@/utils/healthCheck';
import { useToast } from '@/components/ui/use-toast';
import { initVitals } from '@/lib/vitals';
import { ViewModeProvider } from '@/contexts/ViewModeContext';
import { NavigationProvider, useNavigation } from '@/contexts/NavigationContext';
import { ViewModeToggle } from '@/components/navigation/ViewModeToggle';
// Phase 1 Feature Imports
import { CommandPalette } from '@/features/commandPalette/CommandPalette';
import { ContextMenu } from '@/features/quickActions/ContextMenu';
import { ThemeManager } from '@/features/themes/ThemeManager';

const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const AdminAPIKeys = lazy(() => import('@/pages/AdminAPIKeys'));
const AdminAIControl = lazy(() => import('@/pages/AdminAIControl'));
const AdminAgentControl = lazy(() => import('@/pages/AdminAgentControl'));
const AdminAgents = lazy(() => import('@/pages/AdminAgents'));
const AdminAnalytics = lazy(() => import('@/pages/AdminAnalytics'));
const AdminCoaching = lazy(() => import('@/pages/AdminCoaching'));
const AdminDeployments = lazy(() => import('@/pages/AdminDeployments'));
const AdminSecrets = lazy(() => import('@/pages/AdminSecrets'));
const AdminSystemConfig = lazy(() => import('@/pages/AdminSystemConfig'));
const AdminTemplates = lazy(() => import('@/pages/AdminTemplates'));
const AdminUserManagement = lazy(() => import('@/pages/AdminUserManagement'));
const AdminMonitoring = lazy(() => import('@/pages/AdminMonitoring'));
const AdminSovereign = lazy(() => import('@/pages/AdminSovereign'));

const { Pages, Layout, mainPage, publicPages = [] } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName, onSearchOpen }) => Layout ?
  <Layout currentPageName={currentPageName} onSearchOpen={onSearchOpen}>{children}</Layout>
  : <>{children}</>;

const AdminRoute = ({ children }) => (
  <AuthGuard requireAdmin>
    <AdminLayout>{children}</AdminLayout>
  </AuthGuard>
);

const renderAdmin = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

const AuthenticatedApp = ({ onSearchOpen }) => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const { toast } = useToast();

  // Set up global auth error handler
  useEffect(() => {
    window.__showAuthError = (message) => {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: message
      });
    };

    return () => {
      delete window.__showAuthError;
    };
  }, [toast]);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return (
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Redirecting to login...</p>
          </div>
        </div>
      );
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/admin" element={
        <AdminRoute>
          {renderAdmin(AdminDashboard)}
        </AdminRoute>
      } />
      <Route path="/admin/api-keys" element={
        <AdminRoute>
          {renderAdmin(AdminAPIKeys)}
        </AdminRoute>
      } />
      <Route path="/admin/secrets" element={
        <AdminRoute>
          {renderAdmin(AdminSecrets)}
        </AdminRoute>
      } />
      <Route path="/admin/users" element={
        <AdminRoute>
          {renderAdmin(AdminUserManagement)}
        </AdminRoute>
      } />
      <Route path="/admin/ai-control" element={
        <AdminRoute>
          {renderAdmin(AdminAIControl)}
        </AdminRoute>
      } />
      <Route path="/admin/agent-control" element={
        <AdminRoute>
          {renderAdmin(AdminAgentControl)}
        </AdminRoute>
      } />
      <Route path="/admin/deployments" element={
        <AdminRoute>
          {renderAdmin(AdminDeployments)}
        </AdminRoute>
      } />
      <Route path="/admin/templates" element={
        <AdminRoute>
          {renderAdmin(AdminTemplates)}
        </AdminRoute>
      } />
      <Route path="/admin/coaching" element={
        <AdminRoute>
          {renderAdmin(AdminCoaching)}
        </AdminRoute>
      } />
      <Route path="/admin/system-config" element={
        <AdminRoute>
          {renderAdmin(AdminSystemConfig)}
        </AdminRoute>
      } />
      <Route path="/admin/analytics" element={
        <AdminRoute>
          {renderAdmin(AdminAnalytics)}
        </AdminRoute>
      } />
      <Route path="/admin/agents" element={
        <AdminRoute>
          {renderAdmin(AdminAgents)}
        </AdminRoute>
      } />
      <Route path="/admin/monitoring" element={
        <AdminRoute>
          {renderAdmin(AdminMonitoring)}
        </AdminRoute>
      } />
      <Route path="/admin/sovereign" element={
        <AdminRoute>
          {renderAdmin(AdminSovereign)}
        </AdminRoute>
      } />
      <Route path="/admin/terminal" element={
        <AdminRoute>
          {renderAdmin(React.lazy(() => import('@/pages/GodModeTerminal')))}
        </AdminRoute>
      } />
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey} onSearchOpen={onSearchOpen}>
          <MainPage />
        </LayoutWrapper>
      } />
      <Route path="/swarm" element={
        <LayoutWrapper currentPageName="Swarm" onSearchOpen={onSearchOpen}>
          {renderAdmin(React.lazy(() => import('@/pages/SwarmDashboard')))}
        </LayoutWrapper>
      } />
      {/* 🌌 QUANTUM UI ROUTE */}
      <Route path="/quantum-dashboard" element={
        <LayoutWrapper currentPageName="Quantum Engine" onSearchOpen={onSearchOpen}>
          {renderAdmin(React.lazy(() => import('@/components/QuantumDashboard')))}
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => {
        const isPublic = publicPages.includes(path);
        // Pages that require backend authentication (optional - most pages use Base44 auth)
        const requiresBackendAuth = ['Profile', 'TeamManagement'].includes(path);

        const element = (
          <LayoutWrapper currentPageName={path} onSearchOpen={onSearchOpen}>
            <Page />
          </LayoutWrapper>
        );

        return (
          <Route
            key={path}
            path={`/${path}`}
            element={requiresBackendAuth ? <PrivateRoute>{element}</PrivateRoute> : element}
          />
        );
      })}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

const AppShell = () => {
  const { isSearchOpen, openSearch, closeSearch } = useNavigation();

  return (
    <>
      <NavigationTracker />
      {/* Phase 1 Features */}
      <CommandPalette />
      <ContextMenu />
      <AuthenticatedApp onSearchOpen={openSearch} />
      <SearchModal isOpen={isSearchOpen} onClose={closeSearch} />
      <ViewModeToggle />
      <OfflineIndicator />
    </>
  );
};


function App() {
  useEffect(() => {
    // Validate environment configuration
    const envValidation = validateEnv();
    if (!envValidation.valid) {
      console.warn('⚠️ Environment configuration issues detected');
      if (envValidation.missing.length > 0) {
        console.warn('Missing variables:', envValidation.missing);
      }
    }

    // Start health monitoring in production
    if (import.meta.env.PROD) {
      startHealthMonitoring(60000); // Check every minute

      // Initialize Web Vitals tracking
      initVitals();
    }
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LLMProvider>
          <AuthProvider>
            <BackendAuthProvider>
              <ActivityProvider>
                <CollaborationProvider>
                  <QueryClientProvider client={queryClientInstance}>
                    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                      <NavigationProvider>
                        <ViewModeProvider>
                          <AppShell />
                        </ViewModeProvider>
                      </NavigationProvider>
                    </Router>
                    <Toaster />
                  </QueryClientProvider>
                </CollaborationProvider>
              </ActivityProvider>
            </BackendAuthProvider>
          </AuthProvider>
        </LLMProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
