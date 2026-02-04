import { useCallback, useEffect, useRef, useState } from 'react';
import init, { MultiverseEngine } from '@/quantum-core/pkg/quantum_core';

export const useQuantumMultiverse = () => {
  const engineRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        await init();
        if (!active) return;
        engineRef.current = new MultiverseEngine();
        setIsReady(true);
      } catch (err) {
        if (!active) return;
        setError(err?.message || 'Failed to load Quantum Multiverse');
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const simulateTimeline = useCallback((universes, cycles = 200) => {
    if (!engineRef.current) {
      return { universes, bestUniverseId: null, rustState: [] };
    }

    const engine = engineRef.current;
    engine.reset();

    universes.forEach((universe) => {
      engine.spawn_universe(universe.id, universe.name, universe.score);
    });

    const bestUniverseId = engine.simulate_evolution(cycles);
    const rawState = engine.get_multiverse_state();

    let rustState = [];
    try {
      rustState = JSON.parse(rawState);
    } catch {
      rustState = [];
    }

    const byId = new Map(rustState.map((u) => [u.id, u]));
    const updatedUniverses = universes.map((universe) => {
      const rustUniverse = byId.get(universe.id);
      if (!rustUniverse) return universe;

      return {
        ...universe,
        score: Math.max(0, Math.min(1, rustUniverse.viability_score)),
        latency: Math.round(rustUniverse.performance_metric),
      };
    });

    return { universes: updatedUniverses, bestUniverseId, rustState };
  }, []);

  return {
    isReady,
    error,
    simulateTimeline,
  };
};

export default useQuantumMultiverse;
