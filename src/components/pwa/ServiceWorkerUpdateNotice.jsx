/**
 * Service Worker Update Notice
 * Notifies users when a new version is available
 */

import React from 'react';
import { useServiceWorker } from '@/hooks/usePWA';
import { RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ServiceWorkerUpdateNotice() {
  const { updateAvailable, updating, updateServiceWorker } = useServiceWorker();

  return (
    <AnimatePresence>
      {updateAvailable && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 z-50 max-w-sm"
        >
          <div className="bg-blue-600 text-white rounded-lg shadow-2xl p-4">
            <div className="flex items-center gap-3">
              <RefreshCw className={`w-5 h-5 flex-shrink-0 ${updating ? 'animate-spin' : ''}`} />
              <div className="flex-1">
                <p className="font-semibold text-sm">Update Available</p>
                <p className="text-xs opacity-90 mt-0.5">
                  A new version of AppForge is ready
                </p>
              </div>
              <button
                onClick={updateServiceWorker}
                disabled={updating}
                className="px-3 py-1.5 bg-white text-blue-600 rounded font-medium text-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ServiceWorkerUpdateNotice;
