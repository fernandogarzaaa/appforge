import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generate quantum circuit from natural language description using AI
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { description, num_qubits = 3, backend = 'ibm_quantum' } = await req.json();

    if (!description) {
      return Response.json({ error: 'Missing description' }, { status: 400 });
    }

    // Use InvokeLLM to generate circuit
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a quantum computing expert. Generate a quantum circuit based on the following description.
      
Description: ${description}
Number of qubits: ${num_qubits}
Target backend: ${backend}

Respond with a JSON object containing:
{
  "name": "circuit name",
  "description": "what this circuit does",
  "qubits": number of qubits,
  "gates": [
    {
      "type": "H|X|Y|Z|S|T|CNOT|SWAP|RX|RY|RZ",
      "targets": [qubit indices],
      "params": {optional angle in radians}
    }
  ],
  "explanation": "Step-by-step explanation of the circuit"
}

Valid gates:
- Single qubit: H, X, Y, Z, S, T, RX(θ), RY(θ), RZ(θ)
- Multi qubit: CNOT(control, target), SWAP

Make the circuit practical and efficient. Ensure all gate types are valid for the backend.`,
      response_json_schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          qubits: { type: 'number' },
          gates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                targets: { type: 'array', items: { type: 'number' } },
                params: { type: 'number' }
              }
            }
          },
          explanation: { type: 'string' }
        },
        required: ['name', 'description', 'qubits', 'gates', 'explanation']
      }
    });

    const circuitData = response;

    // Validate circuit
    if (!circuitData.gates || !Array.isArray(circuitData.gates)) {
      return Response.json(
        { error: 'Invalid circuit format from AI' },
        { status: 500 }
      );
    }

    // Save to database
    const savedCircuit = await base44.entities.QuantumJob.create({
      user_id: user.email,
      circuit_id: `circuit_${Date.now()}`,
      circuit_data: {
        qubits: circuitData.qubits,
        gates: circuitData.gates,
        name: circuitData.name,
        description: circuitData.description
      },
      backend: 'simulator',
      shots: 1000,
      status: 'draft'
    });

    return Response.json({
      success: true,
      circuit: circuitData,
      circuit_id: savedCircuit.id,
      job_id: savedCircuit.id
    });
  } catch (error) {
    console.error('Circuit generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});