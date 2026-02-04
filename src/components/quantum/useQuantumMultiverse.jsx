import { useState, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useQuantumMultiverse() {
  const [universes, setUniverses] = useState([]);
  const [activeUniverseId, setActiveUniverseId] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [timeline, setTimeline] = useState(null);

  // Initialize with one universe
  useEffect(() => {
    initializeMultiverse();
  }, []);

  // Simulation loop
  useEffect(() => {
    if (!isSimulating || universes.length === 0) return;

    const interval = setInterval(() => {
      updateTimeline();
    }, 500);

    return () => clearInterval(interval);
  }, [isSimulating, universes]);

  const initializeMultiverse = async () => {
    try {
      const initialUniverse = {
        id: `universe_${Date.now()}`,
        name: 'Primary Universe',
        parameters: {
          quantumEntanglement: Math.random() * 100,
          coherenceLevel: 95,
          decoherenceRate: 0.02,
        },
        createdAt: new Date(),
      };

      setUniverses([initialUniverse]);
      setActiveUniverseId(initialUniverse.id);

      // Initialize timeline
      setTimeline({
        iteration: 0,
        entanglement: 50,
        coherence: 95,
        branches: 1,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to initialize multiverse:', error);
    }
  };

  const createUniverse = useCallback(async (config) => {
    try {
      // Call backend function to create universe
      const response = await base44.functions.invoke('createQuantumUniverse', {
        name: config.name,
        parameters: config.parameters,
      });

      const newUniverse = {
        id: response.data?.id || `universe_${Date.now()}`,
        name: config.name,
        parameters: config.parameters,
        createdAt: new Date(),
      };

      setUniverses(prev => [...prev, newUniverse]);
      return newUniverse;
    } catch (error) {
      console.error('Failed to create universe:', error);
      
      // Fallback: create universe locally
      const newUniverse = {
        id: `universe_${Date.now()}`,
        name: config.name,
        parameters: config.parameters,
        createdAt: new Date(),
      };
      
      setUniverses(prev => [...prev, newUniverse]);
      return newUniverse;
    }
  }, []);

  const switchUniverse = useCallback((universeId) => {
    setActiveUniverseId(universeId);
  }, []);

  const toggleSimulation = useCallback(() => {
    setIsSimulating(prev => !prev);
  }, []);

  const resetSimulation = useCallback(() => {
    setIsSimulating(false);
    setTimeline({
      iteration: 0,
      entanglement: 50,
      coherence: 95,
      branches: 1,
      timestamp: Date.now(),
    });
  }, []);

  const updateTimeline = useCallback(() => {
    setTimeline(prev => {
      if (!prev) return null;

      const newIteration = prev.iteration + 1;
      
      // Simulate quantum decoherence
      const activeUniverse = universes.find(u => u.id === activeUniverseId);
      const decoherenceRate = activeUniverse?.parameters.decoherenceRate || 0.01;
      
      // Calculate new coherence with decoherence
      const newCoherence = Math.max(0, prev.coherence - (decoherenceRate * 5));
      
      // Entanglement fluctuates based on universe count
      const entanglementNoise = (Math.random() - 0.5) * 3;
      const newEntanglement = Math.max(0, Math.min(100, prev.entanglement + entanglementNoise));
      
      // Branch count increases with complexity
      const newBranches = Math.floor(Math.log2(newIteration + 1)) + 1;

      return {
        iteration: newIteration,
        entanglement: newEntanglement,
        coherence: newCoherence,
        branches: newBranches,
        timestamp: Date.now(),
      };
    });
  }, [universes, activeUniverseId]);

  const observeTimeline = useCallback((timestamp) => {
    // Collapse wave function at specific timestamp
    return {
      observedState: Math.random() > 0.5 ? '|0⟩' : '|1⟩',
      probability: Math.random(),
      timestamp,
    };
  }, []);

  return {
    universes,
    activeUniverseId,
    isSimulating,
    timeline,
    createUniverse,
    switchUniverse,
    toggleSimulation,
    resetSimulation,
    observeTimeline,
  };
}