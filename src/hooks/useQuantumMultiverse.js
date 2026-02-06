import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import init, { MultiverseEngine } from '../quantum-core/pkg/quantum_core';
import { base44 } from '@/api/base44Client';

const DEFAULT_PARAMETERS = {
  quantumEntanglement: 50,
  coherenceLevel: 95,
  decoherenceRate: 0.02,
};

const DEFAULT_TIMELINE = {
  iteration: 0,
  entanglement: DEFAULT_PARAMETERS.quantumEntanglement,
  coherence: DEFAULT_PARAMETERS.coherenceLevel,
  branches: 1,
  timestamp: Date.now(),
  bestUniverseId: null,
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const buildUniverse = (config, fallbackId) => {
  const id =
    config?.id ||
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : fallbackId);
  const parameters = {
    quantumEntanglement:
      config?.parameters?.quantumEntanglement ?? DEFAULT_PARAMETERS.quantumEntanglement,
    coherenceLevel: config?.parameters?.coherenceLevel ?? DEFAULT_PARAMETERS.coherenceLevel,
    decoherenceRate: config?.parameters?.decoherenceRate ?? DEFAULT_PARAMETERS.decoherenceRate,
  };

  return {
    id,
    name: config?.name || 'Universe',
    score: config?.score ?? clamp(parameters.coherenceLevel / 100, 0.0, 1.0),
    latency: config?.latency ?? 0,
    parameters,
    metrics: config?.metrics || {
      fidelity: 0,
      t1Relaxation: 0,
      branches: 1,
      iteration: 0,
    },
    createdAt: config?.createdAt || new Date(),
  };
};

export const useQuantumMultiverse = () => {
  const engineRef = useRef(null);
  const spawnedRef = useRef(new Set());
  const seedRef = useRef(null);
  const initAttemptRef = useRef(0);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [universes, setUniverses] = useState([]);
  const [activeUniverseId, setActiveUniverseId] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [timeline, setTimeline] = useState(DEFAULT_TIMELINE);

  const ensureEngine = useCallback(async () => {
    if (engineRef.current) return true;

    initAttemptRef.current += 1;
    try {
      await init();
      engineRef.current = new MultiverseEngine();
      if (seedRef.current !== null && typeof engineRef.current.set_seed === 'function') {
        engineRef.current.set_seed(seedRef.current);
      }
      setIsReady(true);
      setError(null);
      return true;
    } catch (err) {
      setError(err?.message || 'Failed to load Quantum Multiverse');
      setIsReady(false);
      return false;
    }
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      const ok = await ensureEngine();
      if (!active) return;
      setIsLoading(false);
      if (!ok) return;
    };

    load();

    return () => {
      active = false;
    };
  }, [ensureEngine]);

  useEffect(() => {
    if (!isReady || universes.length > 0) return;

    const initialId = `universe_${Date.now()}`;
    const initialUniverse = buildUniverse(
      {
        id: initialId,
        name: 'Primary Universe',
        parameters: DEFAULT_PARAMETERS,
      },
      initialId
    );

    setUniverses([initialUniverse]);
    setActiveUniverseId(initialUniverse.id);
    setTimeline({
      ...DEFAULT_TIMELINE,
      entanglement: initialUniverse.parameters.quantumEntanglement,
      coherence: initialUniverse.parameters.coherenceLevel,
      timestamp: Date.now(),
    });
  }, [isReady, universes.length]);

  const spawnUniverseInEngine = useCallback((universe) => {
    if (!engineRef.current) return false;
    if (spawnedRef.current.has(universe.id)) return true;

    const engine = engineRef.current;
    const params = universe.parameters || DEFAULT_PARAMETERS;
    const codeQuality = clamp(universe.score ?? params.coherenceLevel / 100, 0.0, 1.0);

    try {
      if (typeof engine.spawn_universe_with_params === 'function') {
        engine.spawn_universe_with_params(
          universe.id,
          universe.name,
          codeQuality,
          params.quantumEntanglement,
          params.coherenceLevel,
          params.decoherenceRate
        );
      } else {
        engine.spawn_universe(universe.id, universe.name, codeQuality);
      }
      spawnedRef.current.add(universe.id);
      return true;
    } catch (err) {
      setError(err?.message || 'Failed to spawn universe');
      return false;
    }
  }, []);

  const ensureUniversesSpawned = useCallback(() => {
    universes.forEach((universe) => {
      spawnUniverseInEngine(universe);
    });
  }, [universes, spawnUniverseInEngine]);

  const parseRustState = useCallback((rawState) => {
    try {
      const parsed = JSON.parse(rawState);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const syncFromRustState = useCallback(
    (rustState, bestUniverseId) => {
      if (!rustState.length) return;

      const byId = new Map(rustState.map((u) => [u.id, u]));

      setUniverses((prev) =>
        prev.map((universe) => {
          const rustUniverse = byId.get(universe.id);
          if (!rustUniverse) return universe;

          const parameters = {
            quantumEntanglement: rustUniverse.entanglement ?? universe.parameters.quantumEntanglement,
            coherenceLevel: rustUniverse.coherence ?? universe.parameters.coherenceLevel,
            decoherenceRate: rustUniverse.decoherence_rate ?? universe.parameters.decoherenceRate,
          };

          return {
            ...universe,
            score: clamp(rustUniverse.viability_score ?? universe.score, 0, 1),
            latency: Math.round(rustUniverse.performance_metric ?? universe.latency ?? 0),
            parameters,
            metrics: {
              fidelity: rustUniverse.fidelity ?? universe.metrics?.fidelity ?? 0,
              t1Relaxation: rustUniverse.t1_relaxation ?? universe.metrics?.t1Relaxation ?? 0,
              branches: rustUniverse.branches ?? universe.metrics?.branches ?? 1,
              iteration: rustUniverse.iteration ?? universe.metrics?.iteration ?? 0,
            },
          };
        })
      );

      const activeRust = byId.get(activeUniverseId) || (bestUniverseId ? byId.get(bestUniverseId) : null);
      if (!byId.has(activeUniverseId) && bestUniverseId && byId.has(bestUniverseId)) {
        setActiveUniverseId(bestUniverseId);
      }

      if (activeRust) {
        setTimeline({
          iteration: activeRust.iteration ?? 0,
          entanglement: activeRust.entanglement ?? 0,
          coherence: activeRust.coherence ?? 0,
          branches: activeRust.branches ?? 1,
          timestamp: Date.now(),
          bestUniverseId: bestUniverseId ?? null,
        });
      } else {
        const totals = rustState.reduce(
          (acc, item) => ({
            entanglement: acc.entanglement + (item.entanglement ?? 0),
            coherence: acc.coherence + (item.coherence ?? 0),
            branches: acc.branches + (item.branches ?? 1),
            iteration: Math.max(acc.iteration, item.iteration ?? 0),
          }),
          { entanglement: 0, coherence: 0, branches: 0, iteration: 0 }
        );
        const count = rustState.length || 1;
        setTimeline({
          iteration: totals.iteration,
          entanglement: totals.entanglement / count,
          coherence: totals.coherence / count,
          branches: Math.round(totals.branches / count),
          timestamp: Date.now(),
          bestUniverseId: bestUniverseId ?? null,
        });
      }
    },
    [activeUniverseId]
  );

  const simulateTimeline = useCallback(
    async (cycles = 120) => {
      const ready = await ensureEngine();
      if (!ready || !engineRef.current) return;

      ensureUniversesSpawned();

      try {
        const bestUniverseId = engineRef.current.simulate_evolution(cycles);
        const rawState = engineRef.current.get_multiverse_state();
        const rustState = parseRustState(rawState);

        if (!rustState.length) {
          setError('Failed to parse multiverse state');
          return;
        }

        syncFromRustState(rustState, bestUniverseId);
      } catch (err) {
        setError(err?.message || 'Failed to simulate multiverse');
      }
    },
    [ensureEngine, ensureUniversesSpawned, parseRustState, syncFromRustState]
  );

  useEffect(() => {
    if (!isSimulating || universes.length === 0) return;

    const interval = setInterval(() => {
      void simulateTimeline();
    }, 500);

    return () => clearInterval(interval);
  }, [isSimulating, universes.length, simulateTimeline]);

  const createUniverse = useCallback(
    async (config) => {
      const fallbackId = `universe_${Date.now()}`;
      let responseId = null;

      try {
        const response = await base44.functions.invoke('createQuantumUniverse', {
          name: config.name,
          parameters: config.parameters,
        });
        responseId = response?.data?.id || response?.data?.universe?.id || null;
      } catch (err) {
        console.warn('Failed to create universe via backend, falling back locally.', err);
      }

      const newUniverse = buildUniverse(
        {
          ...config,
          id: responseId || fallbackId,
        },
        fallbackId
      );

      setUniverses((prev) => [...prev, newUniverse]);
      spawnUniverseInEngine(newUniverse);
      return newUniverse;
    },
    [spawnUniverseInEngine]
  );

  const switchUniverse = useCallback((universeId) => {
    setActiveUniverseId(universeId);
  }, []);

  const toggleSimulation = useCallback(() => {
    setIsSimulating((prev) => !prev);
  }, []);

  const resetSimulation = useCallback(() => {
    setIsSimulating(false);
    if (engineRef.current) {
      try {
        engineRef.current.reset();
      } catch (err) {
        setError(err?.message || 'Failed to reset multiverse engine');
      }
    }
    spawnedRef.current.clear();
    setTimeline({
      ...DEFAULT_TIMELINE,
      timestamp: Date.now(),
    });
  }, []);

  const observeTimeline = useCallback(
    (timestamp) => {
      const active = universes.find((u) => u.id === activeUniverseId);
      const fidelity = active?.metrics?.fidelity ?? 0;
      const probability = clamp(fidelity / 100, 0, 1);
      const observedState = probability > 0.5 ? '|0⟩' : '|1⟩';

      return {
        observedState,
        probability,
        timestamp,
      };
    },
    [activeUniverseId, universes]
  );

  const setSimulationSeed = useCallback((seed) => {
    seedRef.current = seed;
    if (engineRef.current && typeof engineRef.current.set_seed === 'function') {
      engineRef.current.set_seed(seed);
    }
  }, []);

  const status = useMemo(
    () => ({
      isReady,
      isLoading,
      error,
      initAttempts: initAttemptRef.current,
    }),
    [error, isLoading, isReady]
  );

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
    simulateTimeline,
    setSimulationSeed,
    ...status,
  };
};

export default useQuantumMultiverse;
