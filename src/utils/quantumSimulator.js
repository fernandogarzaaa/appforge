/**
 * @fileoverview Quantum Simulator - Simulates quantum circuits
 * Provides state vector simulation with measurements and visualization
 * @module quantumSimulator
 */

/**
 * @typedef {Object} ComplexNumber
 * @property {number} real - Real part
 * @property {number} imag - Imaginary part
 */

/**
 * @typedef {Object} QuantumState
 * @property {Array<ComplexNumber>} amplitudes - Complex amplitudes
 * @property {number} numQubits - Number of qubits
 */

/**
 * @typedef {Object} SimulationResult
 * @property {QuantumState} finalState - Final quantum state
 * @property {Object.<string, number>} measurements - Measurement statistics
 * @property {Object} metadata - Simulation metadata
 */

/**
 * Complex number representation
 * @param {number} real - Real part
 * @param {number} imag - Imaginary part
 * @returns {ComplexNumber} Complex number
 */
function complex(real, imag = 0) {
  return { real, imag };
}

/**
 * Add complex numbers
 */
function addComplex(a, b) {
  return complex(a.real + b.real, a.imag + b.imag);
}

/**
 * Multiply complex numbers
 */
function multiplyComplex(a, b) {
  return complex(
    a.real * b.real - a.imag * b.imag,
    a.real * b.imag + a.imag * b.real
  );
}

/**
 * Get magnitude of complex number
 */
function magnitudeComplex(c) {
  return Math.sqrt(c.real * c.real + c.imag * c.imag);
}

/**
 * Get probability from amplitude
 */
function amplitudeToProbability(amplitude) {
  const mag = magnitudeComplex(amplitude);
  return mag * mag;
}

// =======================
// State Initialization
// =======================

/**
 * Create initial quantum state |00...0⟩
 * @param {number} numQubits - Number of qubits
 * @returns {QuantumState} Initial state
 */
export function createInitialState(numQubits) {
  const size = Math.pow(2, numQubits);
  const amplitudes = new Array(size).fill(null).map(() => complex(0, 0));
  amplitudes[0] = complex(1, 0); // |0...0⟩ state
  
  return { amplitudes, numQubits };
}

/**
 * Create superposition state |+...+⟩
 * @param {number} numQubits - Number of qubits
 * @returns {QuantumState} Superposition state
 */
export function createSuperpositionState(numQubits) {
  const size = Math.pow(2, numQubits);
  const normalization = 1 / Math.sqrt(size);
  const amplitudes = new Array(size).fill(complex(normalization, 0));
  
  return { amplitudes, numQubits };
}

/**
 * Create equal superposition over marked items
 * @param {number} numQubits - Number of qubits
 * @param {number[]} markedIndices - Indices of marked states
 * @returns {QuantumState} Marked superposition state
 */
export function createMarkedState(numQubits, markedIndices) {
  const size = Math.pow(2, numQubits);
  const normalization = 1 / Math.sqrt(markedIndices.length);
  const amplitudes = new Array(size).fill(complex(0, 0));
  
  markedIndices.forEach(idx => {
    if (idx >= 0 && idx < size) {
      amplitudes[idx] = complex(normalization, 0);
    }
  });
  
  return { amplitudes, numQubits };
}

// =======================
// Single-Qubit Gates
// =======================

/**
 * Apply Hadamard gate
 * @param {QuantumState} state - Input state
 * @param {number} targetQubit - Target qubit
 * @returns {QuantumState} Output state
 */
export function applyHadamard(state, targetQubit) {
  const newAmplitudes = state.amplitudes.slice();
  const size = Math.pow(2, state.numQubits);
  const step = Math.pow(2, targetQubit);
  
  for (let i = 0; i < size; i += 2 * step) {
    for (let j = 0; j < step; j++) {
      const a = newAmplitudes[i + j];
      const b = newAmplitudes[i + step + j];
      
      const inv = 1 / Math.sqrt(2);
      newAmplitudes[i + j] = complex(
        (a.real + b.real) * inv,
        (a.imag + b.imag) * inv
      );
      newAmplitudes[i + step + j] = complex(
        (a.real - b.real) * inv,
        (a.imag - b.imag) * inv
      );
    }
  }
  
  return { amplitudes: newAmplitudes, numQubits: state.numQubits };
}

/**
 * Apply Pauli-X gate
 * @param {QuantumState} state - Input state
 * @param {number} targetQubit - Target qubit
 * @returns {QuantumState} Output state
 */
export function applyPauliX(state, targetQubit) {
  const newAmplitudes = state.amplitudes.slice();
  const step = Math.pow(2, targetQubit);
  
  for (let i = 0; i < Math.pow(2, state.numQubits); i += 2 * step) {
    for (let j = 0; j < step; j++) {
      const temp = newAmplitudes[i + j];
      newAmplitudes[i + j] = newAmplitudes[i + step + j];
      newAmplitudes[i + step + j] = temp;
    }
  }
  
  return { amplitudes: newAmplitudes, numQubits: state.numQubits };
}

/**
 * Apply Pauli-Z gate
 * @param {QuantumState} state - Input state
 * @param {number} targetQubit - Target qubit
 * @returns {QuantumState} Output state
 */
export function applyPauliZ(state, targetQubit) {
  const newAmplitudes = state.amplitudes.slice();
  const step = Math.pow(2, targetQubit);
  
  for (let i = 0; i < Math.pow(2, state.numQubits); i += 2 * step) {
    for (let j = step; j < 2 * step; j++) {
      newAmplitudes[i + j] = complex(
        -newAmplitudes[i + j].real,
        -newAmplitudes[i + j].imag
      );
    }
  }
  
  return { amplitudes: newAmplitudes, numQubits: state.numQubits };
}

/**
 * Apply rotation gate (RX, RY, or RZ)
 * @param {QuantumState} state - Input state
 * @param {number} targetQubit - Target qubit
 * @param {number} angle - Rotation angle
 * @param {string} axis - Rotation axis ('X', 'Y', or 'Z')
 * @returns {QuantumState} Output state
 */
export function applyRotation(state, targetQubit, angle, axis = 'Z') {
  const cos = Math.cos(angle / 2);
  const sin = Math.sin(angle / 2);
  
  const newAmplitudes = state.amplitudes.slice();
  const step = Math.pow(2, targetQubit);
  
  for (let i = 0; i < Math.pow(2, state.numQubits); i += 2 * step) {
    for (let j = 0; j < step; j++) {
      const a = newAmplitudes[i + j];
      const b = newAmplitudes[i + step + j];
      
      if (axis === 'X') {
        newAmplitudes[i + j] = addComplex(
          complex(a.real * cos, a.imag * cos),
          complex(-b.imag * sin, b.real * sin)
        );
        newAmplitudes[i + step + j] = addComplex(
          complex(b.real * cos, b.imag * cos),
          complex(-a.imag * sin, a.real * sin)
        );
      } else if (axis === 'Y') {
        newAmplitudes[i + j] = addComplex(
          complex(a.real * cos, a.imag * cos),
          complex(-b.real * sin, -b.imag * sin)
        );
        newAmplitudes[i + step + j] = addComplex(
          complex(b.real * cos, b.imag * cos),
          complex(a.real * sin, a.imag * sin)
        );
      } else if (axis === 'Z') {
        newAmplitudes[i + j] = multiplyComplex(a, complex(cos, -sin));
        newAmplitudes[i + step + j] = multiplyComplex(b, complex(cos, sin));
      }
    }
  }
  
  return { amplitudes: newAmplitudes, numQubits: state.numQubits };
}

// =======================
// Multi-Qubit Gates
// =======================

/**
 * Apply CNOT gate (controlled-NOT)
 * @param {QuantumState} state - Input state
 * @param {number} controlQubit - Control qubit
 * @param {number} targetQubit - Target qubit
 * @returns {QuantumState} Output state
 */
export function applyCNOT(state, controlQubit, targetQubit) {
  const newAmplitudes = state.amplitudes.slice();
  const size = Math.pow(2, state.numQubits);
  
  for (let i = 0; i < size; i++) {
    const controlBit = (i >> controlQubit) & 1;
    const targetBit = (i >> targetQubit) & 1;
    
    if (controlBit === 1) {
      const flippedIndex = i ^ (1 << targetQubit);
      const temp = newAmplitudes[i];
      newAmplitudes[i] = newAmplitudes[flippedIndex];
      newAmplitudes[flippedIndex] = temp;
    }
  }
  
  return { amplitudes: newAmplitudes, numQubits: state.numQubits };
}

/**
 * Apply SWAP gate
 * @param {QuantumState} state - Input state
 * @param {number} qubit1 - First qubit
 * @param {number} qubit2 - Second qubit
 * @returns {QuantumState} Output state
 */
export function applySWAP(state, qubit1, qubit2) {
  const newAmplitudes = state.amplitudes.slice();
  const size = Math.pow(2, state.numQubits);
  
  for (let i = 0; i < size; i++) {
    const bit1 = (i >> qubit1) & 1;
    const bit2 = (i >> qubit2) & 1;
    
    if (bit1 !== bit2) {
      const swappedIndex = i ^ (1 << qubit1) ^ (1 << qubit2);
      const temp = newAmplitudes[i];
      newAmplitudes[i] = newAmplitudes[swappedIndex];
      newAmplitudes[swappedIndex] = temp;
    }
  }
  
  return { amplitudes: newAmplitudes, numQubits: state.numQubits };
}

// =======================
// Measurement & Analysis
// =======================

/**
 * Get probability distribution
 * @param {QuantumState} state - Quantum state
 * @returns {Object.<string, number>} Probability distribution
 */
export function getProbabilities(state) {
  /** @type {Object.<string, number>} */
  const probabilities = {};
  
  state.amplitudes.forEach((amplitude, index) => {
    const bitstring = index.toString(2).padStart(state.numQubits, '0');
    const probability = amplitudeToProbability(amplitude);
    
    if (probability > 1e-10) { // Ignore negligible probabilities
      probabilities[bitstring] = probability;
    }
  });
  
  return probabilities;
}

/**
 * Simulate measurement
 * @param {QuantumState} state - Quantum state
 * @param {number} shots - Number of measurements
 * @returns {Object.<string, number>} Measurement results
 */
export function simulate(state, shots = 1000) {
  const probabilities = getProbabilities(state);
  /** @type {Object.<string, number>} */
  const results = {};
  
  for (let i = 0; i < shots; i++) {
    let rand = Math.random();
    let bitstring = '0'.repeat(state.numQubits);
    
    for (const [bs, prob] of Object.entries(probabilities)) {
      rand -= prob;
      if (rand <= 0) {
        bitstring = bs;
        break;
      }
    }
    
    results[bitstring] = (results[bitstring] || 0) + 1;
  }
  
  return results;
}

/**
 * Calculate entanglement entropy
 * @param {QuantumState} state - Quantum state
 * @param {number} partitionSize - Size of subsystem A
 * @returns {number} Entanglement entropy
 */
export function calculateEntanglementEntropy(state, partitionSize) {
  const probabilities = getProbabilities(state);
  let entropy = 0;
  
  Object.values(probabilities).forEach(prob => {
    if (prob > 0) {
      entropy -= prob * Math.log2(prob);
    }
  });
  
  return entropy;
}

/**
 * Get expected value of measurement
 * @param {QuantumState} state - Quantum state
 * @returns {number} Expected measurement value (0-1)
 */
export function getExpectationValue(state) {
  const probabilities = getProbabilities(state);
  let expectation = 0;
  
  Object.entries(probabilities).forEach(([bitstring, prob]) => {
    const value = parseInt(bitstring, 2) / (Math.pow(2, state.numQubits) - 1 || 1);
    expectation += value * prob;
  });
  
  return expectation;
}

/**
 * Get state vector fidelity (similarity)
 * @param {QuantumState} state1 - First state
 * @param {QuantumState} state2 - Second state
 * @returns {number} Fidelity (0-1)
 */
export function calculateFidelity(state1, state2) {
  if (state1.numQubits !== state2.numQubits) {
    return 0;
  }
  
  let fidelity = complex(0, 0);
  
  for (let i = 0; i < state1.amplitudes.length; i++) {
    const a = state1.amplitudes[i];
    const b = state2.amplitudes[i];
    
    fidelity = addComplex(fidelity, multiplyComplex(
      complex(a.real, -a.imag),
      b
    ));
  }
  
  return Math.abs(amplitudeToProbability(fidelity));
}

// =======================
// State Visualization
// =======================

/**
 * Get top probability states
 * @param {QuantumState} state - Quantum state
 * @param {number} topN - Number of states to return
 * @returns {Array} Top probability states
 */
export function getTopProbabilityStates(state, topN = 10) {
  const probabilities = getProbabilities(state);
  
  return Object.entries(probabilities)
    .map(([bitstring, probability]) => ({
      bitstring,
      probability,
      percentile: (probability * 100).toFixed(2)
    }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, topN);
}

/**
 * Get Bloch sphere coordinates for single qubit
 * @param {QuantumState} state - Quantum state (must be 1 qubit)
 * @returns {Object} Bloch sphere coordinates {x, y, z}
 */
export function getBlochSphereCoordinates(state) {
  if (state.numQubits !== 1) {
    throw new Error('Bloch sphere only defined for single qubit');
  }
  
  const a0 = state.amplitudes[0]; // |0⟩ amplitude
  const a1 = state.amplitudes[1]; // |1⟩ amplitude
  
  // Extract phase and magnitude
  const mag0 = magnitudeComplex(a0);
  const mag1 = magnitudeComplex(a1);
  
  // Bloch vector components
  const x = 2 * (a0.real * a1.imag - a0.imag * a1.real);
  const y = 2 * (a0.real * a1.real + a0.imag * a1.imag);
  const z = mag0 * mag0 - mag1 * mag1;
  
  return { x, y, z, purity: x * x + y * y + z * z };
}

/**
 * Create state report
 * @param {QuantumState} state - Quantum state
 * @returns {Object} State report
 */
export function createStateReport(state) {
  const probabilities = getProbabilities(state);
  const topStates = getTopProbabilityStates(state, 5);
  const entropy = calculateEntanglementEntropy(state, Math.floor(state.numQubits / 2));
  
  return {
    numQubits: state.numQubits,
    numAmplitudes: state.amplitudes.length,
    totalProbability: Object.values(probabilities).reduce((a, b) => a + b, 0),
    nonzeroAmplitudes: Object.keys(probabilities).length,
    entropy,
    topStates,
    maxProbability: Math.max(...Object.values(probabilities), 0),
    timestamp: new Date().toISOString()
  };
}

// =======================
// Circuit Simulation
// =======================

/**
 * Simulate a full circuit
 * @param {Object} circuit - Quantum circuit
 * @param {number} shots - Number of measurement shots
 * @returns {SimulationResult} Simulation result
 */
export function simulateCircuit(circuit, shots = 1000) {
  let state = createInitialState(circuit.numQubits);
  
  // Apply gates
  circuit.gates.forEach(gate => {
    if (gate.name === 'H') {
      state = applyHadamard(state, gate.targetQubits[0]);
    } else if (gate.name === 'X') {
      state = applyPauliX(state, gate.targetQubits[0]);
    } else if (gate.name === 'Z') {
      state = applyPauliZ(state, gate.targetQubits[0]);
    } else if (gate.name === 'RX') {
      state = applyRotation(state, gate.targetQubits[0], gate.angle, 'X');
    } else if (gate.name === 'RY') {
      state = applyRotation(state, gate.targetQubits[0], gate.angle, 'Y');
    } else if (gate.name === 'RZ') {
      state = applyRotation(state, gate.targetQubits[0], gate.angle, 'Z');
    } else if (gate.name === 'CNOT') {
      state = applyCNOT(state, gate.controlQubits[0], gate.targetQubits[0]);
    } else if (gate.name === 'SWAP') {
      state = applySWAP(state, gate.targetQubits[0], gate.targetQubits[1]);
    }
  });
  
  const measurements = simulate(state, shots);
  
  return {
    finalState: state,
    measurements,
    metadata: {
      shots,
      timestamp: new Date().toISOString(),
      circuitName: circuit.metadata?.name || 'Unknown',
      circuitDepth: circuit.gates.length,
      report: createStateReport(state)
    }
  };
}

export default {
  createInitialState,
  createSuperpositionState,
  createMarkedState,
  applyHadamard,
  applyPauliX,
  applyPauliZ,
  applyRotation,
  applyCNOT,
  applySWAP,
  getProbabilities,
  simulate,
  calculateEntanglementEntropy,
  getExpectationValue,
  calculateFidelity,
  getTopProbabilityStates,
  getBlochSphereCoordinates,
  createStateReport,
  simulateCircuit
};
