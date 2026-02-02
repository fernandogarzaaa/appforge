// Jest setup file
require('@testing-library/jest-dom');

// Mock WASM modules
jest.mock('quantum_core', () => ({
  HolographicConsensus: class {
    superpose_models() { return 0.8; }
    measure_entropy() { return 0.5; }
    measure_coherence() { return 0.9; }
  },
  TunnelingScanner: class {
    calculate_tunneling_probability() { return 0.3; }
    run_penetration_test() { return { risk: 0.25 }; }
    scan() { return Promise.resolve([]); }
  },
  ZenoStabilizer: class {
    calculate_stability() { return 0.95; }
    is_state_frozen() { return true; }
  },
  RenormalizationEngine: class {
    predict_criticality() { return 0.1; }
    coarse_grain() { return 0.05; }
  },
  QuantumAnnealer: {
    optimize: jest.fn(() => Promise.resolve({ optimized: true, energy: 0.5 })),
  },
  EntangledState: {
    create: jest.fn(() => ({ entanglement: 0.9 })),
  },
  SuperpositionSynthesizer: {
    synthesize: jest.fn(() => Promise.resolve({ superposition: 0.8 })),
  },
}));

// Mock quantum-core pkg
jest.mock('@/quantum-core/pkg/quantum_core', () => ({
  HolographicConsensus: class {
    superpose_models() { return 0.8; }
    measure_entropy() { return 0.5; }
    measure_coherence() { return 0.9; }
  },
  TunnelingScanner: class {
    calculate_tunneling_probability() { return 0.3; }
    run_penetration_test() { return { risk: 0.25 }; }
    scan() { return Promise.resolve([]); }
  },
  ZenoStabilizer: class {
    calculate_stability() { return 0.95; }
    is_state_frozen() { return true; }
  },
  RenormalizationEngine: class {
    predict_criticality() { return 0.1; }
    coarse_grain() { return 0.05; }
  },
  QuantumAnnealer: {
    optimize: jest.fn(() => Promise.resolve({ optimized: true, energy: 0.5 })),
  },
  EntangledState: {
    create: jest.fn(() => ({ entanglement: 0.9 })),
  },
  SuperpositionSynthesizer: {
    synthesize: jest.fn(() => Promise.resolve({ superposition: 0.8 })),
  },
}), { virtual: true });

// Global test utilities
global.testUtils = {
  waitForAsync: (fn, timeout = 1000) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(fn()), timeout);
    });
  },
};
