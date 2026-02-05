import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Submit quantum circuit to hardware backend (IBM Quantum or AWS Braket)
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { circuit_data, backend, shots = 1000, circuit_id } = await req.json();

    if (!circuit_data || !backend || !shots) {
      return Response.json(
        { error: 'Missing circuit_data, backend, or shots' },
        { status: 400 }
      );
    }

    // Validate circuit
    if (!circuit_data.qubits || !Array.isArray(circuit_data.gates)) {
      return Response.json(
        { error: 'Invalid circuit format' },
        { status: 400 }
      );
    }

    // Get backend config
    const configs = await base44.asServiceRole.entities.QuantumBackendConfig.filter({
      backend_name: backend,
      is_configured: true,
      is_active: true
    });

    if (configs.length === 0) {
      return Response.json(
        { error: `Backend ${backend} not configured` },
        { status: 400 }
      );
    }

    const backendConfig = configs[0];

    // Check qubit limit
    if (circuit_data.qubits > backendConfig.max_qubits) {
      return Response.json(
        { error: `Circuit exceeds backend limit of ${backendConfig.max_qubits} qubits` },
        { status: 400 }
      );
    }

    // Create job record
    const job = await base44.entities.QuantumJob.create({
      user_id: user.email,
      circuit_id: circuit_id || `circuit_${Date.now()}`,
      circuit_data,
      backend,
      shots,
      status: 'queued',
      submitted_at: new Date().toISOString()
    });

    // Submit to backend
    let backendJobId;
    let cost;

    try {
      if (backend === 'ibm_quantum') {
        const result = await submitToIBM(circuit_data, shots, backendConfig.api_key);
        backendJobId = result.job_id;
        cost = result.cost || 0;
      } else if (backend === 'aws_braket') {
        const result = await submitToAWSBraket(circuit_data, shots, backendConfig.api_key);
        backendJobId = result.job_id;
        cost = result.cost || backendConfig.min_cost_per_job || 0.3;
      } else if (backend === 'google_cirq') {
        const result = await submitToGoogleCirq(circuit_data, shots, backendConfig.api_key);
        backendJobId = result.job_id;
        cost = result.cost || 0;
      }

      // Update job with backend ID
      await base44.entities.QuantumJob.update(job.id, {
        backend_job_id: backendJobId,
        status: 'running',
        cost_usd: cost,
        started_at: new Date().toISOString()
      });

      return Response.json({
        success: true,
        job_id: job.id,
        backend_job_id: backendJobId,
        backend,
        status: 'running'
      });
    } catch (backendError) {
      // Update job with error
      await base44.entities.QuantumJob.update(job.id, {
        status: 'failed',
        error_message: backendError.message
      });

      return Response.json(
        { error: `Backend submission failed: ${backendError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Quantum job submission error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function submitToIBM(circuitData, shots, apiKey) {
  // Placeholder for IBM Quantum API integration
  // In production, would use qiskit or IBM's REST API
  return {
    job_id: `ibm_${Date.now()}`,
    cost: 0
  };
}

async function submitToAWSBraket(circuitData, shots, apiKey) {
  // Placeholder for AWS Braket API integration
  // In production, would use boto3 or AWS SDK
  return {
    job_id: `braket_${Date.now()}`,
    cost: 0.3
  };
}

async function submitToGoogleCirq(circuitData, shots, apiKey) {
  // Placeholder for Google Cirq API integration
  // In production, would use Cirq library
  return {
    job_id: `cirq_${Date.now()}`,
    cost: 0
  };
}