import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Run quantum circuit simulations
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { circuit, num_shots = 1000 } = await req.json();

    if (!circuit) {
      return Response.json({ error: 'Circuit definition required' }, { status: 400 });
    }

    // Simulate quantum circuit
    const simulationResult = simulateCircuit(circuit, num_shots);

    return Response.json({
      success: true,
      simulation: simulationResult,
      shots: num_shots,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Quantum simulation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function simulateCircuit(circuit, numShots) {
  const { gates, qubits } = circuit;
  
  // Initialize quantum state (simplified simulation)
  let state = new Array(Math.pow(2, qubits)).fill(0);
  state[0] = 1; // Start in |0...0⟩ state

  // Apply gates
  gates.forEach(gate => {
    state = applyGate(state, gate, qubits);
  });

  // Measure qubits
  const measurements = {};
  for (let shot = 0; shot < numShots; shot++) {
    const outcome = measure(state, qubits);
    measurements[outcome] = (measurements[outcome] || 0) + 1;
  }

  // Calculate probabilities
  const probabilities = {};
  Object.keys(measurements).forEach(outcome => {
    probabilities[outcome] = measurements[outcome] / numShots;
  });

  return {
    measurements,
    probabilities,
    statevector: state.slice(0, Math.min(16, state.length)),
    fidelity: calculateFidelity(state)
  };
}

function applyGate(state, gate, qubits) {
  const { type, targets, parameters = {} } = gate;
  
  // Simplified gate application
  switch (type) {
    case 'H': // Hadamard
      return applyHadamard(state, targets[0], qubits);
    case 'X': // Pauli-X
      return applyPauliX(state, targets[0], qubits);
    case 'Y': // Pauli-Y
      return applyPauliY(state, targets[0], qubits);
    case 'Z': // Pauli-Z
      return applyPauliZ(state, targets[0], qubits);
    case 'RX': // RX rotation
      return applyRX(state, targets[0], parameters.angle, qubits);
    case 'RY': // RY rotation
      return applyRY(state, targets[0], parameters.angle, qubits);
    case 'CNOT': // CNOT gate
      return applyCNOT(state, targets[0], targets[1], qubits);
    default:
      return state;
  }
}

function applyHadamard(state, target, qubits) {
  const newState = state.slice();
  const factor = 1 / Math.sqrt(2);
  
  for (let i = 0; i < state.length; i++) {
    const bitValue = (i >> target) & 1;
    const flipped = i ^ (1 << target);
    
    if (bitValue === 0) {
      newState[i] = factor * (state[i] + state[flipped]);
    } else {
      newState[i] = factor * (state[i ^ (1 << target)] - state[i]);
    }
  }
  return newState;
}

function applyPauliX(state, target, qubits) {
  const newState = new Array(state.length);
  for (let i = 0; i < state.length; i++) {
    const flipped = i ^ (1 << target);
    newState[flipped] = state[i];
  }
  return newState;
}

function applyPauliY(state, target, qubits) {
  const newState = new Array(state.length);
  for (let i = 0; i < state.length; i++) {
    const bitValue = (i >> target) & 1;
    const flipped = i ^ (1 << target);
    newState[flipped] = bitValue === 0 ? { r: -state[i].i, i: state[i].r } : { r: state[i].i, i: -state[i].r };
  }
  return newState;
}

function applyPauliZ(state, target, qubits) {
  const newState = state.slice();
  for (let i = 0; i < state.length; i++) {
    const bitValue = (i >> target) & 1;
    if (bitValue === 1) {
      newState[i] = -state[i];
    }
  }
  return newState;
}

function applyRX(state, target, angle, qubits) {
  const cos = Math.cos(angle / 2);
  const sin = Math.sin(angle / 2);
  const newState = state.slice();
  
  for (let i = 0; i < state.length; i++) {
    const bitValue = (i >> target) & 1;
    const flipped = i ^ (1 << target);
    
    if (bitValue === 0) {
      newState[i] = cos * state[i] - sin * state[flipped];
    } else {
      newState[i] = cos * state[i] + sin * state[flipped];
    }
  }
  return newState;
}

function applyRY(state, target, angle, qubits) {
  const cos = Math.cos(angle / 2);
  const sin = Math.sin(angle / 2);
  const newState = state.slice();
  
  for (let i = 0; i < state.length; i++) {
    const bitValue = (i >> target) & 1;
    const flipped = i ^ (1 << target);
    
    if (bitValue === 0) {
      newState[i] = cos * state[i] + sin * state[flipped];
    } else {
      newState[i] = -sin * state[i] + cos * state[flipped];
    }
  }
  return newState;
}

function applyCNOT(state, control, target, qubits) {
  const newState = state.slice();
  for (let i = 0; i < state.length; i++) {
    const controlBit = (i >> control) & 1;
    if (controlBit === 1) {
      const flipped = i ^ (1 << target);
      [newState[i], newState[flipped]] = [newState[flipped], newState[i]];
    }
  }
  return newState;
}

function measure(state, qubits) {
  const probabilities = state.map(amp => Math.abs(amp) ** 2);
  const cumulativeProbabilities = [];
  let sum = 0;
  probabilities.forEach(p => {
    sum += p;
    cumulativeProbabilities.push(sum);
  });

  const random = Math.random();
  const outcome = cumulativeProbabilities.findIndex(cp => cp >= random);
  return outcome.toString(2).padStart(qubits, '0');
}

function calculateFidelity(state) {
  // Measure how close the state is to a pure state
  let purity = 0;
  state.forEach(amp => {
    purity += Math.abs(amp) ** 4;
  });
  return Math.sqrt(purity);
}