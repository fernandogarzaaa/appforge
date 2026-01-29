import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

export function useOfflineDetection() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'Back online',
        description: 'Your connection has been restored.',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        variant: 'destructive',
        title: 'No internet connection',
        description: 'Some features may be unavailable.',
        duration: 10000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  return isOnline;
}

export function OfflineIndicator() {
  const isOnline = useOfflineDetection();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-orange-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
      <span className="text-sm font-medium">Offline Mode</span>
    </div>
  );
}
