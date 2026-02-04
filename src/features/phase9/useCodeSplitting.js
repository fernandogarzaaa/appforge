import { useState, useEffect, useCallback } from 'react';
import React from 'react';

/**
 * Hook for managing code splitting and dynamic imports
 * @returns {Object} Code splitting utilities and statistics
 */
export const useCodeSplitting = () => {
  const [splitModules, setSplitModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalChunks: 0,
    loadedChunks: 0,
    failedChunks: 0,
    averageLoadTime: 0,
  });

  /**
   * Dynamically import a module with tracking
   */
  const loadModule = useCallback(async (modulePath) => {
    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      const module = await import(/* webpackChunkName: "[request]" */ modulePath);
      const loadTime = performance.now() - startTime;

      setSplitModules(prev => [...prev, {
        path: modulePath,
        loadTime,
        loaded: true,
        timestamp: new Date().toISOString(),
      }]);

      setStats(prev => ({
        ...prev,
        totalChunks: prev.totalChunks + 1,
        loadedChunks: prev.loadedChunks + 1,
        averageLoadTime: ((prev.averageLoadTime * prev.loadedChunks) + loadTime) / (prev.loadedChunks + 1),
      }));

      return module;
    } catch (err) {
      setError(err.message);
      setStats(prev => ({
        ...prev,
        totalChunks: prev.totalChunks + 1,
        failedChunks: prev.failedChunks + 1,
      }));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Preload a module for better UX
   */
  const preloadModule = useCallback(async (modulePath) => {
    try {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'script';
      link.href = modulePath;
      document.head.appendChild(link);
    } catch (err) {
      console.error('Preload failed:', err);
    }
  }, []);

  /**
   * Get lazy component wrapper
   */
  const getLazyComponent = useCallback((importFn) => {
    return React.lazy(importFn);
  }, []);

  return {
    splitModules,
    loading,
    error,
    stats,
    loadModule,
    preloadModule,
    getLazyComponent,
  };
};
