import { useEffect, useState } from 'react';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { Dashboard } from './components/dashboard/Dashboard';
import { useAppStore } from './stores/appStore';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const { isFirstRun, setFirstRun, initializeApp } = useAppStore();

  useEffect(() => {
    const init = async () => {
      try {
        await initializeApp();
        setIsLoading(false);
      } catch (error) {
        toast.error('Failed to initialize AppForge');
        setIsLoading(false);
      }
    };
    init();
  }, [initializeApp]);

  const handleOnboardingComplete = () => {
    setFirstRun(false);
    toast.success('Welcome to AppForge!', {
      description: 'Your quantum-powered development environment is ready.',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white">Initializing AppForge...</h2>
          <p className="text-slate-400 mt-2">Loading quantum engine</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {isFirstRun ? (
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      ) : (
        <Dashboard />
      )}
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
