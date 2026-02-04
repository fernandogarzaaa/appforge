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
    const { name, parameters } = payload;

    if (!name) {
      return Response.json({ error: 'Universe name is required' }, { status: 400 });
    }

    // Validate quantum parameters
    const validatedParameters = {
      quantumEntanglement: Math.max(0, Math.min(100, parameters?.quantumEntanglement || 50)),
      coherenceLevel: Math.max(0, Math.min(100, parameters?.coherenceLevel || 95)),
      decoherenceRate: Math.max(0, Math.min(0.1, parameters?.decoherenceRate || 0.01)),
    };

    // Simulate quantum state vector initialization
    const stateVector = generateQuantumStateVector();

    // Create universe record
    const universe = {
      id: `u_${generateId()}`,
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

    return Response.json({
      success: true,
      universe: universe,
      branchingFactor: branchingFactor,
      message: `Universe "${name}" created with ${branchingFactor} potential branches`,
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
function generateQuantumStateVector() {
  const qubits = 5; // 32 possible states
  const amplitudes = [];
  
  for (let i = 0; i < Math.pow(2, qubits); i++) {
    amplitudes.push({
      state: i.toString(2).padStart(qubits, '0'),
      amplitude: Math.sqrt(1 / Math.pow(2, qubits)) + (Math.random() - 0.5) * 0.1,
      phase: Math.random() * 2 * Math.PI,
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
function generateId() {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}