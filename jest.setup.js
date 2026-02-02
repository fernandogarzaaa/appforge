// Jest setup file
require('@testing-library/jest-dom');

// Mock WASM modules
jest.mock('quantum_core', () => ({
  HolographicConsensus: jest.fn(() => ({
    superpose_models: jest.fn(() => 0.8),
    measure_entropy: jest.fn(() => 0.5),
    measure_coherence: jest.fn(() => 0.9),
  })),
  TunnelingScanner: jest.fn(() => ({
    calculate_tunneling_probability: jest.fn(() => 0.3),
    run_penetration_test: jest.fn(() => ({ risk: 0.25 })),
  })),
  ZenoStabilizer: jest.fn(() => ({
    calculate_stability: jest.fn(() => 0.95),
    is_state_frozen: jest.fn(() => true),
  })),
  RenormalizationEngine: jest.fn(() => ({
    predict_criticality: jest.fn(() => 0.1),
    coarse_grain: jest.fn(() => 0.05),
  })),
}));

// Global test utilities
global.testUtils = {
  waitForAsync: (fn, timeout = 1000) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(fn()), timeout);
    });
  },
};
