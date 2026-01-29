/**
 * Quantum Computing Controller
 * Handles quantum circuit operations, simulations, and algorithm execution
 */

import { v4 as uuidv4 } from 'uuid';
import { successResponse, createError } from '../utils/helpers.js';

// Mock database for circuits
const circuits = new Map();

/**
 * Import quantum utilities from frontend
 * In production, these would be shared as npm package or copied to backend
 */
const mockQuantumSimulator = {
  createInitialState: (numQubits) => new Array(2 ** numQubits).fill(1 / Math.sqrt(2 ** numQubits)),
  getProbabilities: (state) => {
    const probs = {};
    state.forEach((amplitude, index) => {
      probs[index.toString(2).padStart(state.length.toString(2).length, '0')] = Math.abs(amplitude) ** 2;
    });
    return probs;
  }
};

export const createCircuit = async (req, res, next) => {
  try {
    const { name, description, numQubits } = req.body;

    if (!name) throw createError(400, 'Circuit name is required');
    if (!numQubits || numQubits < 1 || numQubits > 20) {
      throw createError(400, 'Number of qubits must be between 1 and 20');
    }

    const circuitId = uuidv4();
    const circuit = {
      id: circuitId,
      name,
      description: description || '',
      numQubits,
      gates: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: req.user.id,
      tags: [],
      isPublic: false
    };

    circuits.set(circuitId, circuit);

    res.status(201).json(successResponse(circuit, 'Circuit created successfully'));
  } catch (err) {
    next(err);
  }
};

export const getCircuits = async (req, res, next) => {
  try {
    const userCircuits = Array.from(circuits.values()).filter(c => c.userId === req.user.id);
    res.json(successResponse(userCircuits, 'Circuits retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export const getCircuit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const circuit = circuits.get(id);

    if (!circuit) {
      throw createError(404, 'Circuit not found');
    }

    if (circuit.userId !== req.user.id && !circuit.isPublic) {
      throw createError(403, 'Unauthorized access to circuit');
    }

    res.json(successResponse(circuit, 'Circuit retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export const updateCircuit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, gates, tags, isPublic } = req.body;

    const circuit = circuits.get(id);
    if (!circuit) {
      throw createError(404, 'Circuit not found');
    }

    if (circuit.userId !== req.user.id) {
      throw createError(403, 'Unauthorized to modify this circuit');
    }

    // Update fields
    if (name) circuit.name = name;
    if (description !== undefined) circuit.description = description;
    if (gates) circuit.gates = gates;
    if (tags) circuit.tags = tags;
    if (isPublic !== undefined) circuit.isPublic = isPublic;
    circuit.updatedAt = new Date();

    circuits.set(id, circuit);

    res.json(successResponse(circuit, 'Circuit updated successfully'));
  } catch (err) {
    next(err);
  }
};

export const deleteCircuit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const circuit = circuits.get(id);

    if (!circuit) {
      throw createError(404, 'Circuit not found');
    }

    if (circuit.userId !== req.user.id) {
      throw createError(403, 'Unauthorized to delete this circuit');
    }

    circuits.delete(id);

    res.json(successResponse(null, 'Circuit deleted successfully'));
  } catch (err) {
    next(err);
  }
};

export const simulateCircuit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { shots = 1000 } = req.body;

    const circuit = circuits.get(id);
    if (!circuit) {
      throw createError(404, 'Circuit not found');
    }

    if (circuit.userId !== req.user.id && !circuit.isPublic) {
      throw createError(403, 'Unauthorized access to circuit');
    }

    // Simulate circuit
    const initialState = mockQuantumSimulator.createInitialState(circuit.numQubits);
    const probabilities = mockQuantumSimulator.getProbabilities(initialState);

    // Generate measurement results
    const results = [];
    const bitstrings = Object.keys(probabilities);
    for (let i = 0; i < shots; i++) {
      const rand = Math.random();
      let cumulative = 0;
      for (const bitstring of bitstrings) {
        cumulative += probabilities[bitstring];
        if (rand <= cumulative) {
          results.push(bitstring);
          break;
        }
      }
    }

    // Count occurrences
    const counts = {};
    results.forEach(result => {
      counts[result] = (counts[result] || 0) + 1;
    });

    const simulationResult = {
      id: uuidv4(),
      circuitId: id,
      shots,
      timestamp: new Date(),
      measurements: results.slice(0, 100), // First 100 for preview
      counts,
      probabilities,
      metadata: {
        avgMeasurementTime: Math.random() * 5 + 0.1, // 0.1-5.1ms
        totalSimulationTime: Math.random() * 100 + 10 // 10-110ms
      }
    };

    res.json(successResponse(simulationResult, 'Circuit simulated successfully'));
  } catch (err) {
    next(err);
  }
};

export const runAlgorithm = async (req, res, next) => {
  try {
    const { algorithm, parameters = {} } = req.body;

    if (!algorithm) {
      throw createError(400, 'Algorithm name is required');
    }

    const validAlgorithms = ['shors', 'grovers', 'deutsch-jozsa', 'bell', 'qft'];
    if (!validAlgorithms.includes(algorithm.toLowerCase())) {
      throw createError(400, `Invalid algorithm. Must be one of: ${validAlgorithms.join(', ')}`);
    }

    const result = {
      id: uuidv4(),
      algorithm,
      parameters,
      timestamp: new Date(),
      result: {
        // Mock results based on algorithm
        ...(algorithm.toLowerCase() === 'shors' && {
          factors: [3, 5],
          iterations: 15
        }),
        ...(algorithm.toLowerCase() === 'grovers' && {
          searchSpace: 16,
          found: true,
          iterations: 3
        }),
        ...(algorithm.toLowerCase() === 'deutsch-jozsa' && {
          isConstant: false,
          balanced: true
        }),
        ...(algorithm.toLowerCase() === 'bell' && {
          entanglementEntropy: 1.0,
          correlationCoefficient: 1.0
        }),
        ...(algorithm.toLowerCase() === 'qft' && {
          frequency: 5,
          amplitude: 0.95
        })
      }
    };

    res.json(successResponse(result, `${algorithm} algorithm executed successfully`));
  } catch (err) {
    next(err);
  }
};

export const getSimulationHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const circuit = circuits.get(id);

    if (!circuit) {
      throw createError(404, 'Circuit not found');
    }

    if (circuit.userId !== req.user.id && !circuit.isPublic) {
      throw createError(403, 'Unauthorized access to circuit');
    }

    // Mock history
    const history = [
      {
        id: uuidv4(),
        circuitId: id,
        shots: 1000,
        timestamp: new Date(Date.now() - 3600000),
        success: true
      }
    ];

    res.json(successResponse(history, 'Simulation history retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export const exportCircuit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { format = 'qasm' } = req.query;

    const circuit = circuits.get(id);
    if (!circuit) {
      throw createError(404, 'Circuit not found');
    }

    if (circuit.userId !== req.user.id && !circuit.isPublic) {
      throw createError(403, 'Unauthorized access to circuit');
    }

    let exportedData;

    if (format === 'qasm') {
      // Mock OpenQASM export
      exportedData = `OPENQASM 2.0;
include "qelib1.inc";
qreg q[${circuit.numQubits}];
creg c[${circuit.numQubits}];

// Circuit: ${circuit.name}
${circuit.gates.map(g => `${g.type} q[${g.targets.join(',')}];`).join('\n')}
measure q -> c;`;
    } else if (format === 'json') {
      exportedData = circuit;
    } else {
      throw createError(400, 'Invalid format. Must be "qasm" or "json"');
    }

    res.json(successResponse(
      { format, data: exportedData },
      `Circuit exported as ${format.toUpperCase()}`
    ));
  } catch (err) {
    next(err);
  }
};
