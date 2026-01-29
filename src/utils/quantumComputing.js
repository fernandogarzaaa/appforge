/**
 * @fileoverview Quantum Computing Utility
 * Provides quantum circuit building, gate operations, and algorithm implementations
 * @module quantumComputing
 */

/**
 * @typedef {Object} QuantumGate
 * @property {string} name - Gate name
 * @property {string} type - Gate type (single, controlled, measurement)
 * @property {number[]} targetQubits - Target qubit indices
 * @property {number[]} [controlQubits] - Control qubit indices (for controlled gates)
 * @property {number} [angle] - Rotation angle (for parametric gates)
 * @property {number} timestamp - Gate creation timestamp
 */

/**
 * @typedef {Object} QuantumCircuit
 * @property {number} numQubits - Number of qubits
 * @property {QuantumGate[]} gates - Gates in the circuit
 * @property {Object.<string, any>} metadata - Circuit metadata
 */

/**
 * @typedef {Object} MeasurementResult
 * @property {string} bitstring - Measured bitstring (e.g., "010")
 * @property {number} probability - Probability of this measurement
 * @property {number} count - Number of times measured in simulation
 */

/**
 * @typedef {Object} AlgorithmResult
 * @property {string} name - Algorithm name
 * @property {QuantumCircuit} circuit - Generated circuit
 * @property {number} depth - Circuit depth
 * @property {number} gateCount - Total gates
 * @property {Object} parameters - Algorithm parameters
 * @property {MeasurementResult[]} results - Simulation results
 */

// =======================
// Core Quantum Gates
// =======================

/**
 * Pauli-X gate (NOT gate) - Flips |0⟩ to |1⟩ and vice versa
 */
const PauliX = (qubit) => ({
  name: 'X',
  type: 'single',
  targetQubits: [qubit],
  timestamp: Date.now(),
  matrix: [
    [0, 1],
    [1, 0]
  ]
});

/**
 * Pauli-Y gate - Rotation around Y-axis
 */
const PauliY = (qubit) => ({
  name: 'Y',
  type: 'single',
  targetQubits: [qubit],
  timestamp: Date.now(),
  matrix: [
    [0, -1],
    [1, 0]
  ]
});

/**
 * Pauli-Z gate - Phase flip
 */
const PauliZ = (qubit) => ({
  name: 'Z',
  type: 'single',
  targetQubits: [qubit],
  timestamp: Date.now(),
  matrix: [
    [1, 0],
    [0, -1]
  ]
});

/**
 * Hadamard gate - Creates superposition
 */
const Hadamard = (qubit) => ({
  name: 'H',
  type: 'single',
  targetQubits: [qubit],
  timestamp: Date.now(),
  matrix: [
    [1 / Math.sqrt(2), 1 / Math.sqrt(2)],
    [1 / Math.sqrt(2), -1 / Math.sqrt(2)]
  ]
});

/**
 * Phase gate - Adds phase to |1⟩
 */
const Phase = (qubit, angle = Math.PI / 4) => ({
  name: 'P',
  type: 'single',
  targetQubits: [qubit],
  angle,
  timestamp: Date.now(),
  matrix: [
    [1, 0],
    [0, { real: Math.cos(angle), imag: Math.sin(angle) }]
  ]
});

/**
 * RX gate - Rotation around X-axis
 */
const RX = (qubit, angle) => ({
  name: 'RX',
  type: 'single',
  targetQubits: [qubit],
  angle,
  timestamp: Date.now(),
  parametric: true
});

/**
 * RY gate - Rotation around Y-axis
 */
const RY = (qubit, angle) => ({
  name: 'RY',
  type: 'single',
  targetQubits: [qubit],
  angle,
  timestamp: Date.now(),
  parametric: true
});

/**
 * RZ gate - Rotation around Z-axis
 */
const RZ = (qubit, angle) => ({
  name: 'RZ',
  type: 'single',
  targetQubits: [qubit],
  angle,
  timestamp: Date.now(),
  parametric: true
});

/**
 * CNOT gate - Controlled-NOT (two-qubit gate)
 */
const CNOT = (control, target) => ({
  name: 'CNOT',
  type: 'controlled',
  controlQubits: [control],
  targetQubits: [target],
  timestamp: Date.now()
});

/**
 * SWAP gate - Swaps two qubits
 */
const SWAP = (qubit1, qubit2) => ({
  name: 'SWAP',
  type: 'two-qubit',
  targetQubits: [qubit1, qubit2],
  timestamp: Date.now()
});

/**
 * CZ gate - Controlled-Z gate
 */
const CZ = (control, target) => ({
  name: 'CZ',
  type: 'controlled',
  controlQubits: [control],
  targetQubits: [target],
  timestamp: Date.now()
});

/**
 * Toffoli gate - Controlled-Controlled-NOT (3-qubit gate)
 */
const Toffoli = (control1, control2, target) => ({
  name: 'CCX',
  type: 'multi-controlled',
  controlQubits: [control1, control2],
  targetQubits: [target],
  timestamp: Date.now()
});

/**
 * Measurement gate
 */
const Measure = (qubit, classicalBit = null) => ({
  name: 'MEASURE',
  type: 'measurement',
  targetQubits: [qubit],
  classicalBit: classicalBit ?? qubit,
  timestamp: Date.now()
});

// =======================
// Circuit Construction
// =======================

/**
 * Create a new quantum circuit
 * @param {number} numQubits - Number of qubits
 * @param {Object} [metadata={}] - Circuit metadata
 * @returns {QuantumCircuit} New quantum circuit
 */
export function createCircuit(numQubits, metadata = {}) {
  return {
    numQubits,
    gates: [],
    metadata: {
      name: metadata.name || `Circuit-${Date.now()}`,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      ...metadata
    }
  };
}

/**
 * Add gate to circuit
 * @param {QuantumCircuit} circuit - Target circuit
 * @param {QuantumGate} gate - Gate to add
 * @returns {QuantumCircuit} Modified circuit
 */
export function addGate(circuit, gate) {
  circuit.gates.push(gate);
  circuit.metadata.modified = new Date().toISOString();
  return circuit;
}

/**
 * Add multiple gates to circuit
 * @param {QuantumCircuit} circuit - Target circuit
 * @param {QuantumGate[]} gates - Gates to add
 * @returns {QuantumCircuit} Modified circuit
 */
export function addGates(circuit, gates) {
  circuit.gates.push(...gates);
  circuit.metadata.modified = new Date().toISOString();
  return circuit;
}

/**
 * Get circuit depth (number of gate layers)
 * @param {QuantumCircuit} circuit - Circuit to analyze
 * @returns {number} Circuit depth
 */
export function getCircuitDepth(circuit) {
  if (circuit.gates.length === 0) return 0;
  
  const qubitLayers = new Array(circuit.numQubits).fill(0);
  
  circuit.gates.forEach(gate => {
    const maxLayer = Math.max(...gate.targetQubits.map(q => qubitLayers[q]));
    gate.targetQubits.forEach(q => {
      qubitLayers[q] = maxLayer + 1;
    });
  });
  
  return Math.max(...qubitLayers);
}

/**
 * Get total gate count
 * @param {QuantumCircuit} circuit - Circuit to analyze
 * @returns {number} Total gates
 */
export function getGateCount(circuit) {
  return circuit.gates.length;
}

/**
 * Get gate counts by type
 * @param {QuantumCircuit} circuit - Circuit to analyze
 * @returns {Object.<string, number>} Gate counts by type
 */
export function getGateCountsByType(circuit) {
  const counts = {};
  circuit.gates.forEach(gate => {
    counts[gate.name] = (counts[gate.name] || 0) + 1;
  });
  return counts;
}

/**
 * Remove gate at index
 * @param {QuantumCircuit} circuit - Target circuit
 * @param {number} index - Gate index
 * @returns {QuantumCircuit} Modified circuit
 */
export function removeGate(circuit, index) {
  if (index >= 0 && index < circuit.gates.length) {
    circuit.gates.splice(index, 1);
    circuit.metadata.modified = new Date().toISOString();
  }
  return circuit;
}

/**
 * Clear all gates from circuit
 * @param {QuantumCircuit} circuit - Target circuit
 * @returns {QuantumCircuit} Modified circuit
 */
export function clearCircuit(circuit) {
  circuit.gates = [];
  circuit.metadata.modified = new Date().toISOString();
  return circuit;
}

// =======================
// Quantum Algorithms
// =======================

/**
 * Shor's Algorithm - Integer factorization
 * @param {number} numberToFactor - Number to factor
 * @param {Object} [options={}] - Algorithm options
 * @returns {AlgorithmResult} Algorithm result with circuit
 */
export function shorsAlgorithm(numberToFactor, options = {}) {
  const numQubits = Math.ceil(Math.log2(numberToFactor)) * 2 + 1;
  const circuit = createCircuit(numQubits, {
    name: `Shor's Algorithm (N=${numberToFactor})`
  });

  // Phase estimation with Hadamard gates
  for (let i = 0; i < numQubits / 2; i++) {
    addGate(circuit, Hadamard(i));
  }

  // Controlled modular exponentiation (simplified representation)
  for (let i = 0; i < numQubits / 2 - 1; i++) {
    addGate(circuit, CNOT(i, i + 1));
  }

  // Inverse QFT
  for (let i = numQubits / 2 - 1; i >= 0; i--) {
    addGate(circuit, Hadamard(i));
  }

  // Measurements
  for (let i = 0; i < numQubits / 2; i++) {
    addGate(circuit, Measure(i));
  }

  return {
    name: "Shor's Algorithm",
    circuit,
    depth: getCircuitDepth(circuit),
    gateCount: getGateCount(circuit),
    parameters: {
      numberToFactor,
      expectedFactors: [3, 5, 7, 11, 13].filter(f => numberToFactor % f === 0)
    },
    description: 'Finds prime factors of large integers using quantum phase estimation'
  };
}

/**
 * Grover's Algorithm - Database search
 * @param {number} numQubits - Number of qubits
 * @param {number} numMarkedItems - Number of marked items
 * @param {Object} [options={}] - Algorithm options
 * @returns {AlgorithmResult} Algorithm result with circuit
 */
export function groversAlgorithm(numQubits, numMarkedItems = 1, options = {}) {
  const circuit = createCircuit(numQubits, {
    name: `Grover's Algorithm (N=${Math.pow(2, numQubits)}, marked=${numMarkedItems})`
  });

  // Initialize superposition
  for (let i = 0; i < numQubits; i++) {
    addGate(circuit, Hadamard(i));
  }

  // Grover iterations
  const iterations = Math.floor(
    Math.PI / 4 * Math.sqrt(Math.pow(2, numQubits) / numMarkedItems)
  );

  for (let iter = 0; iter < iterations; iter++) {
    // Oracle (marked item reflection)
    addGate(circuit, Hadamard(numQubits - 1));
    for (let i = 0; i < numQubits - 1; i++) {
      addGate(circuit, CNOT(i, numQubits - 1));
    }
    addGate(circuit, Hadamard(numQubits - 1));

    // Diffusion operator
    for (let i = 0; i < numQubits; i++) {
      addGate(circuit, Hadamard(i));
    }
    for (let i = 0; i < numQubits; i++) {
      addGate(circuit, PauliX(i));
    }
    for (let i = 0; i < numQubits - 1; i++) {
      addGate(circuit, CNOT(i, numQubits - 1));
    }
    for (let i = 0; i < numQubits; i++) {
      addGate(circuit, PauliX(i));
    }
    for (let i = 0; i < numQubits; i++) {
      addGate(circuit, Hadamard(i));
    }
  }

  // Measurements
  for (let i = 0; i < numQubits; i++) {
    addGate(circuit, Measure(i));
  }

  return {
    name: "Grover's Algorithm",
    circuit,
    depth: getCircuitDepth(circuit),
    gateCount: getGateCount(circuit),
    parameters: {
      numQubits,
      numMarkedItems,
      iterations,
      speedup: `√N ≈ ${Math.sqrt(Math.pow(2, numQubits)).toFixed(0)}`
    },
    description: 'Searches unstructured database with quadratic speedup'
  };
}

/**
 * Deutsch-Jozsa Algorithm - Promise problem solver
 * @param {number} numQubits - Number of qubits
 * @param {Object} [options={}] - Algorithm options
 * @returns {AlgorithmResult} Algorithm result with circuit
 */
export function deutschJozsaAlgorithm(numQubits, options = {}) {
  const circuit = createCircuit(numQubits + 1, {
    name: `Deutsch-Jozsa Algorithm (n=${numQubits})`
  });

  // Initialize ancilla to |−⟩
  addGate(circuit, PauliX(numQubits));
  addGate(circuit, Hadamard(numQubits));

  // Apply Hadamard to data qubits
  for (let i = 0; i < numQubits; i++) {
    addGate(circuit, Hadamard(i));
  }

  // Apply oracle (simplified)
  for (let i = 0; i < numQubits; i++) {
    addGate(circuit, CNOT(i, numQubits));
  }

  // Apply Hadamard to data qubits again
  for (let i = 0; i < numQubits; i++) {
    addGate(circuit, Hadamard(i));
  }

  // Measurements
  for (let i = 0; i < numQubits; i++) {
    addGate(circuit, Measure(i));
  }

  return {
    name: 'Deutsch-Jozsa Algorithm',
    circuit,
    depth: getCircuitDepth(circuit),
    gateCount: getGateCount(circuit),
    parameters: { numQubits },
    description: 'Determines if function is constant or balanced with single query'
  };
}

/**
 * Bell State Generator - Creates entangled pairs
 * @param {number} numPairs - Number of Bell pairs
 * @param {Object} [options={}] - Algorithm options
 * @returns {AlgorithmResult} Algorithm result with circuit
 */
export function bellStateGenerator(numPairs, options = {}) {
  const circuit = createCircuit(numPairs * 2, {
    name: `Bell States (${numPairs} pairs)`
  });

  for (let i = 0; i < numPairs; i++) {
    const q1 = i * 2;
    const q2 = i * 2 + 1;

    addGate(circuit, Hadamard(q1));
    addGate(circuit, CNOT(q1, q2));
  }

  // Measurements
  for (let i = 0; i < numPairs * 2; i++) {
    addGate(circuit, Measure(i));
  }

  return {
    name: 'Bell State Generator',
    circuit,
    depth: getCircuitDepth(circuit),
    gateCount: getGateCount(circuit),
    parameters: { numPairs },
    entanglementDepth: numPairs,
    description: 'Creates maximally entangled Bell pairs'
  };
}

/**
 * Quantum Fourier Transform
 * @param {number} numQubits - Number of qubits
 * @param {Object} [options={}] - Algorithm options
 * @returns {AlgorithmResult} Algorithm result with circuit
 */
export function quantumFourierTransform(numQubits, options = {}) {
  const circuit = createCircuit(numQubits, {
    name: `Quantum Fourier Transform (n=${numQubits})`
  });

  for (let j = 0; j < numQubits; j++) {
    addGate(circuit, Hadamard(j));

    for (let k = j + 1; k < numQubits; k++) {
      const angle = (2 * Math.PI) / Math.pow(2, k - j + 1);
      const controlledRZ = {
        name: 'CRZ',
        type: 'controlled',
        controlQubits: [k],
        targetQubits: [j],
        angle
      };
      addGate(circuit, controlledRZ);
    }
  }

  // SWAP gates to reverse qubit order
  for (let i = 0; i < Math.floor(numQubits / 2); i++) {
    addGate(circuit, SWAP(i, numQubits - 1 - i));
  }

  return {
    name: 'Quantum Fourier Transform',
    circuit,
    depth: getCircuitDepth(circuit),
    gateCount: getGateCount(circuit),
    parameters: { numQubits },
    description: 'Quantum version of Classical Fourier Transform'
  };
}

// =======================
// Analysis & Utilities
// =======================

/**
 * Calculate entanglement entropy
 * @param {QuantumCircuit} circuit - Circuit to analyze
 * @returns {number} Entanglement entropy (0-1)
 */
export function calculateEntanglementEntropy(circuit) {
  const numQubits = circuit.numQubits;
  let entanglementCount = 0;

  circuit.gates.forEach(gate => {
    if (gate.type === 'controlled' || gate.type === 'two-qubit' || gate.type === 'multi-controlled') {
      entanglementCount++;
    }
  });

  return Math.min(entanglementCount / numQubits, 1);
}

/**
 * Validate circuit
 * @param {QuantumCircuit} circuit - Circuit to validate
 * @returns {Object} Validation result
 */
export function validateCircuit(circuit) {
  const errors = [];
  const warnings = [];

  if (circuit.numQubits <= 0) {
    errors.push('Circuit must have at least 1 qubit');
  }

  circuit.gates.forEach((gate, index) => {
    gate.targetQubits.forEach(q => {
      if (q >= circuit.numQubits || q < 0) {
        errors.push(`Gate ${index} (${gate.name}) targets invalid qubit ${q}`);
      }
    });

    if (gate.controlQubits) {
      gate.controlQubits.forEach(q => {
        if (q >= circuit.numQubits || q < 0) {
          errors.push(`Gate ${index} (${gate.name}) has invalid control qubit ${q}`);
        }
      });
    }
  });

  if (getCircuitDepth(circuit) > 100) {
    warnings.push('Circuit depth is very large (>100)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Export circuit to OpenQASM format
 * @param {QuantumCircuit} circuit - Circuit to export
 * @returns {string} OpenQASM code
 */
export function exportToOpenQASM(circuit) {
  let qasm = 'OPENQASM 2.0;\n';
  qasm += 'include "qelib1.inc";\n';
  qasm += `qreg q[${circuit.numQubits}];\n`;
  qasm += `creg c[${circuit.numQubits}];\n\n`;

  circuit.gates.forEach(gate => {
    if (gate.name === 'H') {
      qasm += `h q[${gate.targetQubits[0]}];\n`;
    } else if (gate.name === 'X') {
      qasm += `x q[${gate.targetQubits[0]}];\n`;
    } else if (gate.name === 'Y') {
      qasm += `y q[${gate.targetQubits[0]}];\n`;
    } else if (gate.name === 'Z') {
      qasm += `z q[${gate.targetQubits[0]}];\n`;
    } else if (gate.name === 'RX') {
      qasm += `rx(${gate.angle}) q[${gate.targetQubits[0]}];\n`;
    } else if (gate.name === 'RY') {
      qasm += `ry(${gate.angle}) q[${gate.targetQubits[0]}];\n`;
    } else if (gate.name === 'RZ') {
      qasm += `rz(${gate.angle}) q[${gate.targetQubits[0]}];\n`;
    } else if (gate.name === 'CNOT') {
      qasm += `cx q[${gate.controlQubits[0]}], q[${gate.targetQubits[0]}];\n`;
    } else if (gate.name === 'MEASURE') {
      qasm += `measure q[${gate.targetQubits[0]}] -> c[${gate.classicalBit}];\n`;
    }
  });

  return qasm;
}

// =======================
// Export All Functionality
// =======================

export const QuantumGates = {
  PauliX, PauliY, PauliZ, Hadamard, Phase,
  RX, RY, RZ, CNOT, SWAP, CZ, Toffoli, Measure
};

export const QuantumAlgorithms = {
  shorsAlgorithm,
  groversAlgorithm,
  deutschJozsaAlgorithm,
  bellStateGenerator,
  quantumFourierTransform
};

export const CircuitUtils = {
  createCircuit,
  addGate,
  addGates,
  removeGate,
  clearCircuit,
  getCircuitDepth,
  getGateCount,
  getGateCountsByType,
  validateCircuit,
  calculateEntanglementEntropy,
  exportToOpenQASM
};
