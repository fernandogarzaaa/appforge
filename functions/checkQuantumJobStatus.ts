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
  // Placeholder - in production, call IBM Quantum API
  return {
    status: 'completed',
    results: {
      measurements: { '00': 500, '11': 500 },
      probabilities: { '00': 0.5, '11': 0.5 }
    },
    execution_time_ms: 1200,
    progress: 100
  };
}

async function checkAWSBraketStatus(jobId) {
  // Placeholder - in production, call AWS Braket API
  return {
    status: 'completed',
    results: {
      measurements: { '00': 500, '11': 500 },
      probabilities: { '00': 0.5, '11': 0.5 }
    },
    execution_time_ms: 1500,
    progress: 100
  };
}

async function checkGoogleCirqStatus(jobId) {
  // Placeholder - in production, call Google Quantum API
  return {
    status: 'completed',
    results: {
      measurements: { '00': 500, '11': 500 },
      probabilities: { '00': 0.5, '11': 0.5 }
    },
    execution_time_ms: 1000,
    progress: 100
  };
}