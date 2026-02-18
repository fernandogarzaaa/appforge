/**
 * Vitest Test Setup & Configuration
 * Consolidated setup file for all tests
 * Runs before all tests
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';

// Provide global React for tests that don't import it
global.React = React;

// Provide global jest as an alias for vi to support legacy mocks
global.jest = vi;

// ============================================================================
// FETCH & NETWORK MOCKS
// ============================================================================

// Stub fetch/axios transport to return harmless defaults
// This prevents jsdom tests from throwing on relative URLs
// and prevents Base44 SDK axios calls from emitting network errors
if (process.env.RUN_INTEGRATION_TESTS !== 'true') {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '',
  });
}

// Mock XMLHttpRequest for legacy code
class MockXMLHttpRequest {
  constructor() {
    this.readyState = 0;
    this.status = 200;
    this.responseText = '{}';
    this.onreadystatechange = null;
    this.onload = null;
    this.onerror = null;
  }
  open(method, url) {
    this.method = method;
    this.url = url;
    this.readyState = 1;
  }
  setRequestHeader() { }
  send() {
    this.readyState = 4;
    if (typeof this.onreadystatechange === 'function') {
      this.onreadystatechange();
    }
    if (typeof this.onload === 'function') {
      this.onload();
    }
  }
  abort() { }
}

global.XMLHttpRequest = MockXMLHttpRequest;

// ============================================================================
// DOM API MOCKS
// ============================================================================

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() { }
  disconnect() { }
  observe() { }
  takeRecords() {
    return [];
  }
  unobserve() { }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() { }
  disconnect() { }
  observe() { }
  unobserve() { }
};

// Mock scrollTo
window.scrollTo = vi.fn();

// ============================================================================
// WASM MODULE MOCKS
// ============================================================================

// Mock quantum_core WASM module
vi.mock('quantum_core', () => ({
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
    optimize: vi.fn(() => Promise.resolve({ optimized: true, energy: 0.5 })),
  },
  EntangledState: {
    create: vi.fn(() => ({ entanglement: 0.9 })),
  },
  SuperpositionSynthesizer: {
    synthesize: vi.fn(() => Promise.resolve({ superposition: 0.8 })),
  },
}));

// Mock @/quantum-core/pkg/quantum_core
vi.mock('@/quantum-core/pkg/quantum_core', () => ({
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
    optimize: vi.fn(() => Promise.resolve({ optimized: true, energy: 0.5 })),
  },
  EntangledState: {
    create: vi.fn(() => ({ entanglement: 0.9 })),
  },
  SuperpositionSynthesizer: {
    synthesize: vi.fn(() => Promise.resolve({ superposition: 0.8 })),
  },
}), { virtual: true });

// ============================================================================
// CUSTOM MATCHERS
// ============================================================================

// Add custom matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// ============================================================================
// GLOBAL TEST UTILITIES
// ============================================================================

global.testUtils = {
  waitForAsync: (fn, timeout = 1000) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(fn()), timeout);
    });
  },
};
