import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

/**
 * Register Page - Redirects to Base44's built-in authentication
 * Base44 handles all user registration, so this page simply
 * redirects users to the platform's login/registration flow.
 */
export default function Register() {
  useEffect(() => {
    // Redirect to Base44's login page (which includes registration)
    base44.auth.redirectToLogin(window.location.origin + '/Dashboard');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-slate-600 dark:text-slate-400">Redirecting to registration...</p>
      </div>
    </div>
  );
}
