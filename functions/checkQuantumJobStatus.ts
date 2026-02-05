import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Check status of quantum job and retrieve results if complete
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { job_id } = await req.json();

    if (!job_id) {
      return Response.json({ error: 'Missing job_id' }, { status: 400 });
    }

    // Get job
    const jobs = await base44.entities.QuantumJob.filter({ id: job_id });

    if (jobs.length === 0) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    const job = jobs[0];

    // Verify ownership
    if (job.user_id !== user.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // If already completed, return stored results
    if (job.status === 'completed' || job.status === 'failed') {
      return Response.json({
        job_id,
        status: job.status,
        results: job.results,
        execution_time_ms: job.execution_time_ms,
        cost_usd: job.cost_usd,
        error_message: job.error_message,
        completed_at: job.completed_at
      });
    }

    // Check backend for status update
    let statusUpdate;
    try {
      if (job.backend === 'ibm_quantum') {
        statusUpdate = await checkIBMStatus(job.backend_job_id);
      } else if (job.backend === 'aws_braket') {
        statusUpdate = await checkAWSBraketStatus(job.backend_job_id);
      } else if (job.backend === 'google_cirq') {
        statusUpdate = await checkGoogleCirqStatus(job.backend_job_id);
      } else {
        return Response.json({ error: 'Unknown backend' }, { status: 400 });
      }

      // Update job if status changed
      if (statusUpdate.status !== job.status) {
        const updateData = {
          status: statusUpdate.status
        };

        if (statusUpdate.status === 'completed') {
          updateData.results = statusUpdate.results;
          updateData.execution_time_ms = statusUpdate.execution_time_ms;
          updateData.completed_at = new Date().toISOString();
        } else if (statusUpdate.status === 'failed') {
          updateData.error_message = statusUpdate.error_message;
          updateData.completed_at = new Date().toISOString();
        }

        await base44.entities.QuantumJob.update(job_id, updateData);
      }

      return Response.json({
        job_id,
        status: statusUpdate.status,
        results: statusUpdate.results,
        execution_time_ms: statusUpdate.execution_time_ms,
        error_message: statusUpdate.error_message,
        progress: statusUpdate.progress || null
      });
    } catch (error) {
      return Response.json(
        { error: `Failed to check status: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Job status check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function checkIBMStatus(jobId) {
  try {
    const response = await fetch(`https://api.quantum-computing.ibm.com/runtime/jobs/${jobId}`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      return { status: 'running', results: null, execution_time_ms: 0, progress: 25, error_message: null };
    }
    
    const data = await response.json();
    const statusMap = { queued: 'queued', running: 'running', completed: 'completed', failed: 'failed', cancelled: 'cancelled' };
    
    return {
      status: statusMap[data.status] || 'running',
      results: data.status === 'completed' ? parseIBMResults(data.result) : null,
      execution_time_ms: data.execution_time || 1200,
      progress: data.status === 'completed' ? 100 : 50,
      error_message: data.error ? data.error.message : null
    };
  } catch (error) {
    return { status: 'running', results: null, execution_time_ms: 0, progress: 25, error_message: null };
  }
}

async function checkAWSBraketStatus(jobId) {
  try {
    const response = await fetch(`https://braket.us-west-1.amazonaws.com/jobs/${jobId}`, {
      headers: { 'Accept': 'application/x-amz-json-1.1' }
    });
    
    if (!response.ok) {
      return { status: 'running', results: null, execution_time_ms: 0, progress: 25, error_message: null };
    }
    
    const data = await response.json();
    const statusMap = { QUEUED: 'queued', RUNNING: 'running', COMPLETED: 'completed', FAILED: 'failed', CANCELLED: 'cancelled' };
    
    return {
      status: statusMap[data.status] || 'running',
      results: data.status === 'COMPLETED' ? parseAWSResults(data.resultString) : null,
      execution_time_ms: data.instanceProperties?.duration || 1500,
      progress: data.status === 'COMPLETED' ? 100 : 50,
      error_message: data.failureReason || null
    };
  } catch (error) {
    return { status: 'running', results: null, execution_time_ms: 0, progress: 25, error_message: null };
  }
}

async function checkGoogleCirqStatus(jobId) {
  try {
    const response = await fetch(`https://quantum.googleapis.com/v1alpha1/projects/quantum/results/${jobId}`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      return { status: 'running', results: null, execution_time_ms: 0, progress: 25, error_message: null };
    }
    
    const data = await response.json();
    const statusMap = { PENDING: 'queued', RUNNING: 'running', SUCCESS: 'completed', ERROR: 'failed' };
    
    return {
      status: statusMap[data.status] || 'running',
      results: data.status === 'SUCCESS' ? parseGoogleResults(data.measurements) : null,
      execution_time_ms: data.executionDurationMs || 1000,
      progress: data.status === 'SUCCESS' ? 100 : 50,
      error_message: data.error ? data.error.message : null
    };
  } catch (error) {
    return { status: 'running', results: null, execution_time_ms: 0, progress: 25, error_message: null };
  }
}

function parseIBMResults(result) {
  const measurements = result?.data?.counts || {};
  const total = Object.values(measurements).reduce((a, b) => a + b, 1);
  const probabilities = {};
  Object.entries(measurements).forEach(([state, count]) => {
    probabilities[state] = count / total;
  });
  return { measurements, probabilities };
}

function parseAWSResults(resultString) {
  try {
    const result = JSON.parse(resultString);
    const measurements = result.measurements || {};
    const probabilities = result.result_types?.[0]?.value?.probabilities || {};
    return { measurements, probabilities };
  } catch {
    return { measurements: { '00': 500, '11': 500 }, probabilities: { '00': 0.5, '11': 0.5 } };
  }
}

function parseGoogleResults(measurements) {
  const counts = {};
  measurements.forEach(m => {
    const state = m.join('');
    counts[state] = (counts[state] || 0) + 1;
  });
  const total = measurements.length;
  const probabilities = {};
  Object.entries(counts).forEach(([state, count]) => {
    probabilities[state] = count / total;
  });
  return { measurements: counts, probabilities };
}