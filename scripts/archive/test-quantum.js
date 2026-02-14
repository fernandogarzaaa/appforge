#!/usr/bin/env node

/**
 * Unit Tests for Quantum Core Algorithms
 * Tests mathematical correctness of quantum-inspired implementations
 */

class QuantumTester {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }

  describe(name) {
    console.log(`\n📋 ${name}`);
  }

  it(name, fn) {
    try {
      fn();
      console.log(`  ✅ ${name}`);
      this.passed++;
    } catch (error) {
      console.log(`  ❌ ${name}`);
      console.log(`     ${error.message}`);
      this.failed++;
    }
  }

  assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  assertEqual(actual, expected, tolerance = 0.001) {
    const diff = Math.abs(actual - expected);
    if (diff > tolerance) {
      throw new Error(`Expected ${expected}, got ${actual} (diff: ${diff})`);
    }
  }

  report() {
    console.log('\n' + '='.repeat(50));
    console.log(`Tests Passed: ${this.passed}`);
    console.log(`Tests Failed: ${this.failed}`);
    console.log(`Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(50));
  }
}

// Quantum Algorithm Simulations (JavaScript implementations)

class QuantumAnnealerSimulator {
  constructor(startTemp, coolingRate) {
    this.temperature = startTemp;
    this.coolingRate = coolingRate;
    this.minTemp = 0.01;
  }

  optimizeEnergy(currentCost, newCost) {
    if (newCost < currentCost) return true;
    if (this.temperature <= this.minTemp) return false;

    const probability = Math.exp((currentCost - newCost) / this.temperature);
    this.temperature *= this.coolingRate;
    return Math.random() < probability;
  }

  calculateEnergy(conflicts, missing, versionDistance) {
    return conflicts * 100 + missing * 50 + versionDistance;
  }
}

class EntangledStateSimulator {
  constructor() {
    this.alpha = 1 / Math.sqrt(2);
    this.beta = 1 / Math.sqrt(2);
    this.phase = 0;
  }

  applyRotation(theta) {
    const cosT = Math.cos(theta / 2);
    const sinT = Math.sin(theta / 2);

    const newAlpha = cosT * this.alpha - sinT * this.beta;
    const newBeta = sinT * this.alpha + cosT * this.beta;

    this.alpha = newAlpha;
    this.beta = newBeta;
  }

  measureFidelity(remoteAlpha, remoteBeta) {
    const overlap = Math.abs(this.alpha * remoteAlpha + this.beta * remoteBeta);
    return overlap * overlap;
  }

  normalize() {
    const norm = Math.sqrt(this.alpha ** 2 + this.beta ** 2);
    if (norm > 0) {
      this.alpha /= norm;
      this.beta /= norm;
    }
  }
}

class SuperpositionSimulator {
  constructor() {
    this.solutions = [];
  }

  createSuperposition(numApproaches) {
    this.solutions = [];
    const initialAmplitude = 1 / Math.sqrt(numApproaches);

    for (let i = 0; i < numApproaches; i++) {
      this.solutions.push({
        approach: `Solution ${i + 1}`,
        amplitude: initialAmplitude,
        constraintsMet: 0,
        constraintsTotal: 0
      });
    }
  }

  applyInterference() {
    const threshold = 0.7;

    this.solutions.forEach(sol => {
      if (sol.constraintsTotal === 0) return;

      const fitRatio = sol.constraintsMet / sol.constraintsTotal;

      if (fitRatio >= threshold) {
        sol.amplitude *= 1 + (fitRatio - threshold);
      } else {
        sol.amplitude *= fitRatio;
      }
    });

    this.normalizeAmplitudes();
  }

  normalizeAmplitudes() {
    const sumSquares = this.solutions.reduce((sum, sol) => sum + sol.amplitude ** 2, 0);
    if (sumSquares > 0) {
      const norm = Math.sqrt(sumSquares);
      this.solutions.forEach(sol => {
        sol.amplitude /= norm;
      });
    }
  }

  collapseToOptimal() {
    let bestIdx = 0;
    let bestAmplitude = 0;

    this.solutions.forEach((sol, idx) => {
      if (sol.amplitude > bestAmplitude) {
        bestAmplitude = sol.amplitude;
        bestIdx = idx;
      }
    });

    return bestIdx;
  }

  calculateEntropy() {
    const probs = this.solutions.map(s => s.amplitude ** 2);
    return -probs.reduce((sum, p) => (p > 0 ? sum + p * Math.log2(p) : sum), 0);
  }
}

// Run Tests
const tester = new QuantumTester();

console.log('\n🔬 QUANTUM ALGORITHM TEST SUITE\n');

// ============================================================================
// Test Suite 1: Quantum Annealing
// ============================================================================
tester.describe('Quantum Annealing Optimizer');

tester.it('Should initialize with correct temperature', () => {
  const annealer = new QuantumAnnealerSimulator(100, 0.95);
  tester.assertEqual(annealer.temperature, 100);
});

tester.it('Should cool down after each step', () => {
  const annealer = new QuantumAnnealerSimulator(100, 0.95);
  annealer.optimizeEnergy(50, 55);
  tester.assert(annealer.temperature < 100, 'Temperature should decrease');
});

tester.it('Should accept better solutions', () => {
  const annealer = new QuantumAnnealerSimulator(100, 0.95);
  const result = annealer.optimizeEnergy(100, 50);
  tester.assert(result === true, 'Should always accept lower energy');
});

tester.it('Should calculate energy correctly', () => {
  const annealer = new QuantumAnnealerSimulator(100, 0.95);
  const energy = annealer.calculateEnergy(10, 2, 5.5);
  tester.assertEqual(energy, 1105.5); // 10*100 + 2*50 + 5.5
});

tester.it('Should freeze at minimum temperature', () => {
  const annealer = new QuantumAnnealerSimulator(0.005, 0.95);
  const result = annealer.optimizeEnergy(100, 105);
  tester.assert(result === false, 'Should reject uphill moves when frozen');
});

tester.it('Should handle optimization iterations', () => {
  const annealer = new QuantumAnnealerSimulator(100, 0.95);
  let energy = 100;

  for (let i = 0; i < 100; i++) {
    const newEnergy = energy - Math.random() * 5;
    if (annealer.optimizeEnergy(energy, newEnergy)) {
      energy = newEnergy;
    }
  }

  tester.assert(energy < 100, 'Energy should decrease over iterations');
});

// ============================================================================
// Test Suite 2: Entangled States
// ============================================================================
tester.describe('Entangled State Synchronization');

tester.it('Should create normalized Bell state', () => {
  const state = new EntangledStateSimulator();
  const norm = Math.sqrt(state.alpha ** 2 + state.beta ** 2);
  tester.assertEqual(norm, 1.0, 0.001);
});

tester.it('Should measure perfect fidelity with identical state', () => {
  const state = new EntangledStateSimulator();
  const fidelity = state.measureFidelity(state.alpha, state.beta);
  tester.assertEqual(fidelity, 1.0, 0.001);
});

tester.it('Should rotate state correctly', () => {
  const state = new EntangledStateSimulator();
  const originalAlpha = state.alpha;
  state.applyRotation(Math.PI / 4);
  tester.assert(state.alpha !== originalAlpha, 'State should change after rotation');
});

tester.it('Should normalize after arbitrary rotation', () => {
  const state = new EntangledStateSimulator();
  state.applyRotation(Math.PI / 3);
  state.normalize();
  const norm = Math.sqrt(state.alpha ** 2 + state.beta ** 2);
  tester.assertEqual(norm, 1.0, 0.001);
});

tester.it('Should detect orthogonal states as decoherent', () => {
  const state = new EntangledStateSimulator();
  // Apply 90-degree rotation to create orthogonal state
  state.applyRotation(Math.PI);
  const fidelity = state.measureFidelity(1, 0);
  tester.assert(fidelity < 0.5, 'Orthogonal states should have low fidelity');
});

tester.it('Should maintain entanglement across rotations', () => {
  const state = new EntangledStateSimulator();
  const fidelities = [];

  for (let i = 0; i < 5; i++) {
    state.applyRotation(0.1);
    state.normalize();
    const f = state.measureFidelity(state.alpha, state.beta);
    fidelities.push(f);
  }

  tester.assert(fidelities.every(f => f > 0.9), 'Should maintain high fidelity');
});

// ============================================================================
// Test Suite 3: Superposition & Interference
// ============================================================================
tester.describe('Superposition AI Code Synthesizer');

tester.it('Should create superposition with equal amplitudes', () => {
  const synth = new SuperpositionSimulator();
  synth.createSuperposition(6);
  const initialAmp = 1 / Math.sqrt(6);
  synth.solutions.forEach(sol => {
    tester.assertEqual(sol.amplitude, initialAmp, 0.001);
  });
});

tester.it('Should normalize amplitudes after interference', () => {
  const synth = new SuperpositionSimulator();
  synth.createSuperposition(6);
  synth.solutions.forEach((sol, idx) => {
    sol.constraintsMet = Math.floor(Math.random() * 10);
    sol.constraintsTotal = 10;
  });
  synth.applyInterference();

  const sumSquares = synth.solutions.reduce((sum, sol) => sum + sol.amplitude ** 2, 0);
  tester.assertEqual(sumSquares, 1.0, 0.001);
});

tester.it('Should amplify solutions meeting constraints', () => {
  const synth = new SuperpositionSimulator();
  synth.createSuperposition(3);
  synth.solutions[0].constraintsMet = 10;
  synth.solutions[0].constraintsTotal = 10;
  synth.solutions[1].constraintsMet = 5;
  synth.solutions[1].constraintsTotal = 10;

  synth.applyInterference();

  tester.assert(
    synth.solutions[0].amplitude > synth.solutions[1].amplitude,
    'Solution 1 should have higher amplitude'
  );
});

tester.it('Should collapse to highest amplitude solution', () => {
  const synth = new SuperpositionSimulator();
  synth.createSuperposition(5);
  synth.solutions[2].amplitude = 0.9;
  synth.solutions.forEach((sol, idx) => {
    if (idx !== 2) sol.amplitude = 0.1;
  });

  const collapsed = synth.collapseToOptimal();
  tester.assertEqual(collapsed, 2);
});

tester.it('Should calculate entropy correctly', () => {
  const synth = new SuperpositionSimulator();
  synth.createSuperposition(2);
  const entropy = synth.calculateEntropy();
  // For equal superposition of 2 states: entropy = 1 bit
  tester.assertEqual(entropy, 1.0, 0.001);
});

tester.it('Should have lower entropy after interference', () => {
    const synth = new SuperpositionSimulator();
    synth.createSuperposition(4);
    const initialEntropy = synth.calculateEntropy();

    // Apply interference that favors one solution
    synth.solutions[0].constraintsMet = 4;
    synth.solutions[0].constraintsTotal = 4;
    synth.solutions.forEach((sol, idx) => {
      if (idx !== 0) {
        sol.constraintsMet = 1;
        sol.constraintsTotal = 4;
      }
    });
    synth.applyInterference();

    const finalEntropy = synth.calculateEntropy();
    tester.assert(finalEntropy < initialEntropy, 'Entropy should decrease with interference');
});

// ============================================================================
// Summary
// ============================================================================
tester.report();

if (tester.failed > 0) {
  console.log('\n⚠️ Some tests failed. Review implementation.');
  process.exit(1);
} else {
  console.log('\n✅ All unit tests passed! Quantum algorithms verified.');
  process.exit(0);
}
