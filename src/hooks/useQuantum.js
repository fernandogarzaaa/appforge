/**
 * useQuantum - React hook for quantum core integration
 * Provides easy access to quantum-optimized features
 */

import { useEffect, useState, useCallback } from 'react';
import {
  initializeQuantumCore,
  optimizeDependencies,
  synchronizeCollaborativeState,
  generateOptimalCode,
  isQuantumAvailable as checkQuantumAvailable,
} from '@/lib/quantumIntegration';

export function useQuantum() {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize quantum core on mount
  useEffect(() => {
    async function init() {
      try {
        await initializeQuantumCore();
        setInitialized(true);
      } catch (err) {
        setError(err.message);
        console.warn('Quantum core not available:', err.message);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  // Optimize dependencies with quantum annealing
  const optimizeDeps = useCallback(async (deps, constraints) => {
    if (!initialized) {
      throw new Error('Quantum core not initialized');
    }
    try {
      const result = await optimizeDependencies(deps, constraints);
      return result;
    } catch (err) {
      console.error('Dependency optimization failed:', err);
      throw err;
    }
  }, [initialized]);

  // Synchronize collaborative state
  const syncState = useCallback(async (state1, state2) => {
    if (!initialized) {
      throw new Error('Quantum core not initialized');
    }
    try {
      const result = await synchronizeCollaborativeState(state1, state2);
      return result;
    } catch (err) {
      console.error('State synchronization failed:', err);
      throw err;
    }
  }, [initialized]);

  // Generate optimal code
  const generateCode = useCallback(async (requirements, candidates = 100) => {
    if (!initialized) {
      throw new Error('Quantum core not initialized');
    }
    try {
      const result = await generateOptimalCode(requirements, candidates);
      return result;
    } catch (err) {
      console.error('Code generation failed:', err);
      throw err;
    }
  }, [initialized]);

  return {
    initialized,
    loading,
    error,
    available: checkQuantumAvailable(),
    optimizeDeps,
    syncState,
    generateCode,
  };
}

export default useQuantum;
