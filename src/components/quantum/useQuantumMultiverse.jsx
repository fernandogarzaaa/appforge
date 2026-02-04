import { useState, useCallback, useEffect } from 'react';

/**
 * Quantum Multiverse Hook - Simulates parallel universes and timeline branching
 * Manages quantum states across multiple parallel timelines
 */
export function useQuantumMultiverse(initialQubits = 3) {
  const [universes, setUniverses] = useState([]);
  const [activeUniverseId, setActiveUniverseId] = useState(null);
  const [timelineHistory, setTimelineHistory] = useState([]);
  const [entanglementMap, setEntanglementMap] = useState({});

  // Initialize multiverses
  useEffect(() => {
    const initialUniverses = Array.from({ length: 4 }, (_, i) => ({
      id: `universe_${i}`,
      name: `Universe ${String.fromCharCode(65 + i)}`,
      qubits: generateQubits(initialQubits),
      amplitude: 1 / Math.sqrt(4),
      timestamp: Date.now(),
      collapsed: false,
      interference: 0,
    }));
    setUniverses(initialUniverses);
    setActiveUniverseId(initialUniverses[0].id);
  }, [initialQubits]);

  const generateQubits = useCallback((count) => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      real: Math.cos(Math.random() * Math.PI / 2),
      imag: Math.sin(Math.random() * Math.PI / 2),
      phase: Math.random() * 2 * Math.PI,
    }));
  }, []);

  // Apply quantum gate to all universes (superposition)
  const applyGateToAll = useCallback((gateName) => {
    setUniverses(prev => prev.map(universe => ({
      ...universe,
      qubits: applyQuantumGate(universe.qubits, gateName),
    })));
    recordTimelineEvent('gate', gateName);
  }, []);

  // Branch current universe into new timeline
  const branchUniverse = useCallback(() => {
    const activeUniverse = universes.find(u => u.id === activeUniverseId);
    if (!activeUniverse) return;

    const newUniverse = {
      id: `universe_branch_${Date.now()}`,
      name: `${activeUniverse.name} (Branch)`,
      qubits: JSON.parse(JSON.stringify(activeUniverse.qubits)),
      amplitude: activeUniverse.amplitude * 0.7,
      timestamp: Date.now(),
      collapsed: false,
      interference: 0,
      parentId: activeUniverseId,
    };

    setUniverses(prev => [...prev, newUniverse]);
    setEntanglementMap(prev => ({
      ...prev,
      [newUniverse.id]: activeUniverseId,
    }));
    recordTimelineEvent('branch', activeUniverse.name);
  }, [universes, activeUniverseId]);

  // Measure/collapse wavefunction in active universe
  const collapseWavefunction = useCallback(() => {
    setUniverses(prev => prev.map(universe => 
      universe.id === activeUniverseId
        ? {
            ...universe,
            collapsed: true,
            qubits: universe.qubits.map(q => ({
              ...q,
              real: Math.round(q.real),
              imag: 0,
            })),
          }
        : universe
    ));
    recordTimelineEvent('collapse', activeUniverseId);
  }, [activeUniverseId]);

  // Calculate quantum interference between universes
  const calculateInterference = useCallback(() => {
    const interferenceMap = {};
    
    for (let i = 0; i < universes.length; i++) {
      for (let j = i + 1; j < universes.length; j++) {
        const u1 = universes[i];
        const u2 = universes[j];
        
        let interference = 0;
        for (let k = 0; k < Math.min(u1.qubits.length, u2.qubits.length); k++) {
          const q1 = u1.qubits[k];
          const q2 = u2.qubits[k];
          interference += Math.abs(
            (q1.real * q2.real + q1.imag * q2.imag) * 
            (u1.amplitude * u2.amplitude)
          );
        }
        interferenceMap[`${u1.id}-${u2.id}`] = interference;
      }
    }
    return interferenceMap;
  }, [universes]);

  // Entangle two universes
  const entangleUniverses = useCallback((id1, id2) => {
    setEntanglementMap(prev => ({
      ...prev,
      [id1]: id2,
      [id2]: id1,
    }));
    recordTimelineEvent('entangle', `${id1} <-> ${id2}`);
  }, []);

  // Record timeline event
  const recordTimelineEvent = useCallback((eventType, details) => {
    setTimelineHistory(prev => [...prev, {
      timestamp: Date.now(),
      type: eventType,
      details,
      universeCount: universes.length,
    }]);
  }, [universes.length]);

  // Apply Hadamard gate (creates superposition)
  const applyHadamard = useCallback(() => applyGateToAll('hadamard'), [applyGateToAll]);

  // Apply Pauli-X gate (bit flip)
  const applyPauliX = useCallback(() => applyGateToAll('pauliX'), [applyGateToAll]);

  // Get active universe
  const getActiveUniverse = useCallback(() => 
    universes.find(u => u.id === activeUniverseId), 
    [universes, activeUniverseId]
  );

  return {
    universes,
    activeUniverseId,
    setActiveUniverseId,
    timelineHistory,
    entanglementMap,
    branchUniverse,
    collapseWavefunction,
    calculateInterference,
    entangleUniverses,
    applyHadamard,
    applyPauliX,
    getActiveUniverse,
  };
}

// Quantum gate implementations
function applyQuantumGate(qubits, gateName) {
  return qubits.map(q => {
    switch (gateName) {
      case 'hadamard':
        return {
          ...q,
          real: (q.real + q.imag) / Math.sqrt(2),
          imag: (q.real - q.imag) / Math.sqrt(2),
        };
      case 'pauliX':
        return {
          ...q,
          real: -q.real,
          imag: q.imag,
        };
      case 'pauliZ':
        return {
          ...q,
          phase: q.phase + Math.PI,
        };
      default:
        return q;
    }
  });
}