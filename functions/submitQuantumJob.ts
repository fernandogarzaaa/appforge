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
  try {
    // IBM Quantum REST API submission
    const qasm = convertCircuitToQASM(circuitData);
    const response = await fetch('https://api.quantum-computing.ibm.com/runtime/jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        program_id: 'sampler',
        circuits: [qasm],
        shots,
        backend: 'ibm_quantum_simulator',
        options: { optimization_level: 2 }
      })
    });

    if (!response.ok) throw new Error(`IBM API error: ${response.statusText}`);
    const data = await response.json();
    return {
      job_id: data.id,
      cost: 0
    };
  } catch (error) {
     throw error;
   }
}

async function submitToAWSBraket(circuitData, shots, apiKey) {
  try {
    // AWS Braket REST API submission
    const response = await fetch('https://braket.us-west-1.amazonaws.com/jobs', {
      method: 'POST',
      headers: {
        'Authorization': `AWS4-HMAC-SHA256 Credential=${apiKey}`,
        'Content-Type': 'application/x-amz-json-1.1'
      },
      body: JSON.stringify({
        deviceArn: 'arn:aws:braket:us-west-1::device/quantum-simulator/amazon/sv1',
        shots,
        scriptModeParams: {
          scriptString: convertCircuitToPython(circuitData)
        }
      })
    });

    if (!response.ok) throw new Error(`AWS error: ${response.statusText}`);
    const data = await response.json();
    return {
      job_id: data.jobArn,
      cost: 0.3
    };
  } catch (error) {
     throw error;
   }
}

async function submitToGoogleCirq(circuitData, shots, apiKey) {
  try {
    // Google Quantum AI REST API submission
    const response = await fetch('https://quantum.googleapis.com/v1alpha1/projects/quantum/reservations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        circuit: convertCircuitToCirq(circuitData),
        repetitions: shots,
        simulator: 'google_simulator'
      })
    });

    if (!response.ok) throw new Error(`Google API error: ${response.statusText}`);
    const data = await response.json();
    return {
      job_id: data.result_id,
      cost: 0
    };
  } catch (error) {
     throw error;
   }
}

function convertCircuitToQASM(circuitData) {
  let qasm = `OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[${circuitData.qubits}];\ncreg c[${circuitData.qubits}];\n`;
  circuitData.gates.forEach(gate => {
    if (gate.type === 'H') qasm += `h q[${gate.targets[0]}];\n`;
    else if (gate.type === 'X') qasm += `x q[${gate.targets[0]}];\n`;
    else if (gate.type === 'Y') qasm += `y q[${gate.targets[0]}];\n`;
    else if (gate.type === 'Z') qasm += `z q[${gate.targets[0]}];\n`;
    else if (gate.type === 'CNOT') qasm += `cx q[${gate.targets[0]}],q[${gate.targets[1]}];\n`;
    else if (gate.type === 'RX') qasm += `rx(${gate.params}) q[${gate.targets[0]}];\n`;
    else if (gate.type === 'RY') qasm += `ry(${gate.params}) q[${gate.targets[0]}];\n`;
  });
  qasm += `measure q -> c;\n`;
  return qasm;
}

function convertCircuitToPython(circuitData) {
  let python = 'import pennylane as qml\ndev = qml.device("default.qubit", wires=' + circuitData.qubits + ')\n@qml.qnode(dev)\ndef circuit():\n';
  circuitData.gates.forEach(gate => {
    if (gate.type === 'H') python += `  qml.Hadamard(wires=${gate.targets[0]})\n`;
    else if (gate.type === 'X') python += `  qml.PauliX(wires=${gate.targets[0]})\n`;
    else if (gate.type === 'CNOT') python += `  qml.CNOT(wires=[${gate.targets[0]}, ${gate.targets[1]}])\n`;
  });
  python += '  return qml.expval(qml.PauliZ(0))\n';
  return python;
}

function convertCircuitToCirq(circuitData) {
  let cirq = '{"circuit": "';
  circuitData.gates.forEach(gate => {
    if (gate.type === 'H') cirq += `q${gate.targets[0]}**0.5,`;
    else if (gate.type === 'CNOT') cirq += `CNOT(q${gate.targets[0]},q${gate.targets[1]}),`;
  });
  cirq += '"}';
  return JSON.parse(cirq);
}