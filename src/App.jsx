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
import { useState, useEffect } from 'react';
import { validateEnv } from '@/utils/env';
import errorTracker, { setUser, clearUser } from '@/utils/errorTracking';
import { startHealthMonitoring } from '@/utils/healthCheck';
import { useToast } from '@/components/ui/use-toast';

const { Pages, Layout, mainPage, publicPages = [] } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName, onSearchOpen }) => Layout ?
  <Layout currentPageName={currentPageName} onSearchOpen={onSearchOpen}>{children}</Layout>
  : <>{children}</>;

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
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey} onSearchOpen={onSearchOpen}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => {
        const isPublic = publicPages.includes(path);
        const element = (
          <LayoutWrapper currentPageName={path} onSearchOpen={onSearchOpen}>
            <Page />
          </LayoutWrapper>
        );
        
        return (
          <Route
            key={path}
            path={`/${path}`}
            element={isPublic ? element : <PrivateRoute>{element}</PrivateRoute>}
          />
        );
      })}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  const [searchOpen, setSearchOpen] = useState(false);

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
                  <Router>
                    <NavigationTracker />
                    <AuthenticatedApp onSearchOpen={() => setSearchOpen(true)} />
                    <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
                    <OfflineIndicator />
                  </Router>
                  <Toaster />
                </QueryClientProvider>                </CollaborationProvider>              </ActivityProvider>
            </BackendAuthProvider>
          </AuthProvider>
        </LLMProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
