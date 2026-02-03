/**
 * BullMQ worker to process batch jobs
 */

const { Worker  } = require('bullmq');
const { createRedisConnection  } = require('../config/redis');
const { emitWebhook  } = require('../services/webhookService');

// Job processors for different types
const processors = {
  'quantum-analysis': async (job) => {
    const { params } = job.data;
    
    // Simulate quantum analysis processing
    await job.updateProgress(20);
    await sleep(1000);
    
    await job.updateProgress(50);
    await sleep(1500);
    
    await job.updateProgress(80);
    await sleep(1000);
    
    await job.updateProgress(100);
    
    return {
      message: 'Quantum analysis completed',
      analyzed: params.codeSnippet?.length || 0,
      findings: [
        { type: 'entanglement', severity: 'medium', count: 3 },
        { type: 'superposition', severity: 'low', count: 7 },
      ],
    };
  },

  'security-scan': async (job) => {
    const { params } = job.data;
    
    await job.updateProgress(25);
    await sleep(800);
    
    await job.updateProgress(60);
    await sleep(1200);
    
    await job.updateProgress(90);
    await sleep(600);
    
    await job.updateProgress(100);
    
    return {
      message: 'Security scan completed',
      scanned: params.files?.length || 1,
      vulnerabilities: [
        { type: 'sql-injection', severity: 'high', file: 'api.js', line: 45 },
        { type: 'xss', severity: 'medium', file: 'render.js', line: 78 },
      ],
    };
  },

  'code-review': async (job) => {
    const { params } = job.data;
    
    await job.updateProgress(30);
    await sleep(1000);
    
    await job.updateProgress(70);
    await sleep(1500);
    
    await job.updateProgress(100);
    await sleep(500);
    
    return {
      message: 'Code review completed',
      filesReviewed: params.files?.length || 0,
      suggestions: [
        { type: 'complexity', message: 'Reduce cyclomatic complexity in handleRequest()', file: 'handler.js' },
        { type: 'duplication', message: 'Extract common validation logic', file: 'validators.js' },
      ],
    };
  },

  'custom': async (job) => {
    const { params } = job.data;
    
    // Generic processor for custom jobs
    const steps = params.steps || 5;
    for (let i = 1; i <= steps; i++) {
      await job.updateProgress((i / steps) * 100);
      await sleep(500);
    }
    
    return {
      message: 'Custom job completed',
      steps,
      result: params.result || 'success',
    };
  },
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main job processor
 */
async function processJob(job) {
  const { type } = job.data;
  
  console.log(`[Worker] Processing job ${job.id} (${type})`);
  
  const processor = processors[type];
  if (!processor) {
    throw new Error(`Unknown job type: ${type}`);
  }
  
  try {
    const result = await processor(job);
    console.log(`[Worker] Job ${job.id} completed successfully`);
    return result;
  } catch (error) {
    console.error(`[Worker] Job ${job.id} failed:`, error);
    throw error;
  }
}

/**
 * Create and start the worker
 */
function startBatchWorker() {
  const worker = new Worker('batch-jobs', processJob, {
    connection: createRedisConnection(),
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
    limiter: {
      max: 100, // Max jobs per duration
      duration: 60000, // 1 minute
    },
  });

  worker.on('completed', async (job) => {
    console.log(`✓ Job ${job.id} completed`);
    
    // Emit webhook on job completion
    try {
      await emitWebhook('job.completed', {
        jobId: job.id,
        type: job.data.type,
        userId: job.data.userId,
        tenantId: job.data.tenantId,
        result: job.returnvalue,
        completedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Webhook delivery failed:', error.message);
    }
  });

  worker.on('failed', async (job, err) => {
    console.error(`✗ Job ${job?.id} failed:`, err.message);
    
    // Emit webhook on job failure
    try {
      await emitWebhook('job.failed', {
        jobId: job?.id,
        type: job?.data?.type,
        userId: job?.data?.userId,
        tenantId: job?.data?.tenantId,
        error: err.message,
        failedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Webhook delivery failed:', error.message);
    }
  });

  worker.on('error', (err) => {
    console.error('[Worker] Error:', err);
  });

  console.log('✓ Batch worker started (concurrency:', worker.opts.concurrency + ')');

  return worker;
}

/**
 * Graceful shutdown
 */
async function stopBatchWorker(worker) {
  if (worker) {
    await worker.close();
    console.log('✓ Batch worker stopped');
  }
}
