import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Optimize quantum circuit for specific backend
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { circuit_data, backend = 'ibm_quantum', optimization_level = 'medium' } = await req.json();

    if (!circuit_data || !circuit_data.gates) {
      return Response.json({ error: 'Invalid circuit data' }, { status: 400 });
    }

    // Get backend specs
    const configs = await base44.asServiceRole.entities.QuantumBackendConfig.filter({
      backend_name: backend
    });

    const backendConfig = configs[0] || {
      max_qubits: 30,
      backend_name: backend
    };

    // Use AI to optimize circuit
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a quantum circuit optimization expert. Optimize the following quantum circuit for ${backend} with ${optimization_level} optimization level.

Original Circuit:
${JSON.stringify(circuit_data, null, 2)}

Backend Specs:
- Max qubits: ${backendConfig.max_qubits}
- Platform: ${backend}

Optimization goals:
1. Reduce total gate count
2. Minimize two-qubit gate operations
3. Improve circuit depth
4. Consider hardware-native gates for ${backend}

Respond with JSON:
{
  "optimized_circuit": {
    "qubits": number,
    "gates": [gate objects with same format as input]
  },
  "optimizations_applied": ["optimization 1", "optimization 2"],
  "metrics": {
    "original_gate_count": number,
    "optimized_gate_count": number,
    "original_depth": number,
    "optimized_depth": number,
    "gate_reduction_percent": number,
    "two_qubit_gate_count": number
  },
  "hardware_notes": "Backend-specific notes"
}`,
      response_json_schema: {
        type: 'object',
        properties: {
          optimized_circuit: {
            type: 'object',
            properties: {
              qubits: { type: 'number' },
              gates: {
                type: 'array',
                items: { type: 'object' }
              }
            }
          },
          optimizations_applied: { type: 'array', items: { type: 'string' } },
          metrics: {
            type: 'object',
            properties: {
              original_gate_count: { type: 'number' },
              optimized_gate_count: { type: 'number' },
              original_depth: { type: 'number' },
              optimized_depth: { type: 'number' },
              gate_reduction_percent: { type: 'number' },
              two_qubit_gate_count: { type: 'number' }
            }
          },
          hardware_notes: { type: 'string' }
        },
        required: ['optimized_circuit', 'optimizations_applied', 'metrics', 'hardware_notes']
      }
    });

    return Response.json({
      success: true,
      circuit: response.optimized_circuit,
      optimizations: response.optimizations_applied,
      metrics: response.metrics,
      hardware_notes: response.hardware_notes
    });
  } catch (error) {
    console.error('Circuit optimization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});