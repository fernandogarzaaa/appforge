import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Quantum Universe Creation Function
 * Simulates creation of parallel universes with quantum properties
 * This is the backend logic for the Multiverse Engine
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { name, parameters, seed } = payload;

    if (!name) {
      return Response.json({ error: 'Universe name is required' }, { status: 400 });
    }

    // Validate quantum parameters
    const validatedParameters = {
      quantumEntanglement: Math.max(0, Math.min(100, parameters?.quantumEntanglement || 50)),
      coherenceLevel: Math.max(0, Math.min(100, parameters?.coherenceLevel || 95)),
      decoherenceRate: Math.max(0, Math.min(0.1, parameters?.decoherenceRate || 0.01)),
    };

    const seedValue =
      typeof seed === 'number'
        ? seed
        : typeof seed === 'string'
        ? hashString(seed)
        : Math.floor(Date.now() % 4294967296);
    const rng = createSeededRandom(seedValue);

    // Simulate quantum state vector initialization
    const stateVector = generateQuantumStateVector(rng);

    // Create universe record
    const universeId = `u_${generateId(rng)}`;
    const universe = {
      id: universeId,
      name: name.trim(),
      parameters: validatedParameters,
      stateVector: stateVector,
      createdAt: new Date().toISOString(),
      createdBy: user.email,
      stats: {
        observations: 0,
        collapses: 0,
        entanglements: 0,
      },
    };

    // Simulate multiverse branching
    const branchingFactor = calculateBranchingFactor(validatedParameters);

    let storedUniverse = null;
    try {
      storedUniverse = await base44.entities.QuantumUniverse.create({
        universe_id: universeId,
        name: universe.name,
        user_id: user.email,
        parameters: validatedParameters,
        state_vector: stateVector,
        branching_factor: branchingFactor,
        status: 'active'
      });
    } catch (storageError) {
      console.warn('QuantumUniverse entity not available:', storageError?.message || storageError);
    }

    return Response.json({
      success: true,
      id: storedUniverse?.id || universeId,
      universe: storedUniverse || universe,
      branchingFactor: branchingFactor,
      message: `Universe "${name}" created with ${branchingFactor} potential branches`,
      seed: seedValue
    });

  } catch (error) {
    console.error('Quantum universe creation error:', error);
    return Response.json(
      { error: error.message || 'Failed to create quantum universe' },
      { status: 500 }
    );
  }
});

/**
 * Generate a random quantum state vector (simplified)
 * In real quantum computing, this would be a complex superposition
 */
function generateQuantumStateVector(rng) {
  const qubits = 5; // 32 possible states
  const amplitudes = [];
  
  for (let i = 0; i < Math.pow(2, qubits); i++) {
    amplitudes.push({
      state: i.toString(2).padStart(qubits, '0'),
      amplitude: Math.sqrt(1 / Math.pow(2, qubits)) + (rng() - 0.5) * 0.1,
      phase: rng() * 2 * Math.PI,
    });
  }

  return {
    numQubits: qubits,
    amplitudes: amplitudes.map(a => ({
      state: a.state,
      magnitude: Math.abs(a.amplitude),
      phase: a.phase,
    })),
  };
}

/**
 * Calculate the branching factor based on quantum parameters
 * Higher entanglement and coherence = more branches
 */
function calculateBranchingFactor(parameters) {
  const entanglementBoost = parameters.quantumEntanglement / 100;
  const coherenceBoost = parameters.coherenceLevel / 100;
  const decoherencePenalty = 1 - (parameters.decoherenceRate * 10);
  
  const baseFactor = 2; // Binary branching (|0⟩ and |1⟩)
  const enhancedFactor = baseFactor * (1 + entanglementBoost * coherenceBoost * decoherencePenalty);
  
  return Math.round(enhancedFactor * 1000) / 1000;
}

/**
 * Generate a unique universe ID
 */
function generateId(rng) {
  return rng().toString(36).substring(2, 15) +
         rng().toString(36).substring(2, 15);
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
