import { Navigate } from 'react-router-dom';
import { useBackendAuth } from '@/contexts/BackendAuthContext';

/**
 * Protected route wrapper for backend-authenticated routes
 * Redirects to login if user is not authenticated with backend
 */
export const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading, loading } = useBackendAuth();
  const resolvedLoading = isLoading ?? loading;

  if (resolvedLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
