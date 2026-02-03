/**
 * Scheduled Jobs Worker - Processes recurring and delayed jobs
 */

const { Worker  } = require('bullmq');
const { createRedisConnection  } = require('../config/redis');

// Example scheduled job processors
const scheduledProcessors = {
  'cleanup-old-jobs': async (job) => {
    console.log('[Scheduled] Running cleanup-old-jobs...');
    // Logic to clean up old completed jobs
    return { cleaned: 0, message: 'Cleanup completed' };
  },

  'send-daily-digest': async (job) => {
    console.log('[Scheduled] Running send-daily-digest...');
    const { userId } = job.data;
    // Logic to send daily digest email
    return { sent: true, userId };
  },

  'update-analytics': async (job) => {
    console.log('[Scheduled] Running update-analytics...');
    // Logic to update analytics dashboard
    return { updated: true, timestamp: new Date().toISOString() };
  },

  'backup-database': async (job) => {
    console.log('[Scheduled] Running backup-database...');
    // Logic to backup database
    return { backup: 'completed', timestamp: new Date().toISOString() };
  },
};

/**
 * Process scheduled jobs
 */
async function processScheduledJob(job) {
  const processor = scheduledProcessors[job.name];
  
  if (!processor) {
    console.warn(`[Scheduled] No processor for job: ${job.name}`);
    return { message: 'No processor found', jobName: job.name };
  }

  console.log(`[Scheduled] Processing ${job.name}...`);
  const result = await processor(job);
  console.log(`[Scheduled] ${job.name} completed:`, result);
  
  return result;
}

/**
 * Start scheduled jobs worker
 */
function startScheduledWorker() {
  const worker = new Worker('scheduled-jobs', processScheduledJob, {
    connection: createRedisConnection(),
    concurrency: 3,
  });

  worker.on('completed', (job) => {
    console.log(`✓ Scheduled job ${job.name} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`✗ Scheduled job ${job?.name} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[Scheduled Worker] Error:', err);
  });

  console.log('✓ Scheduled jobs worker started');

  return worker;
}

/**
 * Stop scheduled worker
 */
async function stopScheduledWorker(worker) {
  if (worker) {
    await worker.close();
    console.log('✓ Scheduled jobs worker stopped');
  }
}

module.exports = {
  startScheduledWorker,
  stopScheduledWorker,
};
