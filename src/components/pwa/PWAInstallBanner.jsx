/**
 * PWA Install Banner
 * Prompts users to install the app for better experience
 */

import React, { useState } from 'react';
import { useInstallPrompt, useOnlineStatus } from '@/hooks/usePWA';
import { X, Download, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PWAInstallBanner() {
  const { canInstall, promptInstall } = useInstallPrompt();
  const isOnline = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);

  React.useEffect(() => {
    if (!isOnline) {
      setShowOfflineNotice(true);
      const timer = setTimeout(() => setShowOfflineNotice(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setDismissed(true);
    }
  };

  return (
    <>
      {/* Install Prompt Banner */}
      <AnimatePresence>
        {canInstall && !dismissed && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
          >
            <div className="max-w-7xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Install AppForge</p>
                    <p className="text-xs opacity-90">
                      Get faster access, offline support, and native app experience
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleInstall}
                    className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors"
                  >
                    Install
                  </button>
                  <button
                    onClick={() => setDismissed(true)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline Notice */}
      <AnimatePresence>
        {showOfflineNotice && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-4 right-4 z-50 max-w-sm"
          >
            <div className={`rounded-lg shadow-2xl p-4 ${
              isOnline 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-800 text-white'
            }`}>
              <div className="flex items-center gap-3">
                {isOnline ? (
                  <Wifi className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <WifiOff className="w-5 h-5 flex-shrink-0" />
                )}
                <div>
                  <p className="font-semibold text-sm">
                    {isOnline ? 'Back Online!' : 'You\'re Offline'}
                  </p>
                  <p className="text-xs opacity-90 mt-0.5">
                    {isOnline 
                      ? 'Your changes have been synced' 
                      : 'Changes will sync when reconnected'}
                  </p>
                </div>
                <button
                  onClick={() => setShowOfflineNotice(false)}
                  className="ml-auto p-1 hover:bg-white/10 rounded transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default PWAInstallBanner;
