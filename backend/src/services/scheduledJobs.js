/**
 * Scheduled Jobs Service - Recurring/cron jobs using BullMQ
 */

const { Queue  } = require('bullmq');
const { createRedisConnection  } = require('../config/redis');

// Create scheduled jobs queue
const scheduledQueue = new Queue('scheduled-jobs', {
  connection: createRedisConnection(),
});

/**
 * Schedule a recurring job (cron-like)
 * @param {string} name - Unique job name
 * @param {object} data - Job data
 * @param {string} pattern - Cron pattern (e.g., '0 * * * *' for hourly)
 */
async function scheduleRecurringJob(name, data, pattern) {
  const job = await scheduledQueue.add(
    name,
    data,
    {
      repeat: {
        pattern, // Cron pattern
        tz: process.env.TZ || 'UTC',
      },
      jobId: `recurring_${name}`,
    }
  );

  return {
    id: job.id,
    name,
    pattern,
    nextRun: job.opts.repeat.nextMillis,
    createdAt: new Date(job.timestamp).toISOString(),
  };
}

/**
 * Schedule a one-time delayed job
 * @param {string} name - Job name
 * @param {object} data - Job data
 * @param {number} delayMs - Delay in milliseconds
 */
async function scheduleDelayedJob(name, data, delayMs) {
  const job = await scheduledQueue.add(
    name,
    data,
    {
      delay: delayMs,
      jobId: `delayed_${name}_${Date.now()}`,
    }
  );

  return {
    id: job.id,
    name,
    scheduledFor: new Date(Date.now() + delayMs).toISOString(),
    createdAt: new Date(job.timestamp).toISOString(),
  };
}

/**
 * Remove a scheduled job
 */
async function removeScheduledJob(jobId) {
  const job = await scheduledQueue.getJob(jobId);
  if (!job) return false;

  await job.remove();
  return true;
}

/**
 * List all recurring jobs
 */
async function listRecurringJobs() {
  const repeatableJobs = await scheduledQueue.getRepeatableJobs();
  
  return repeatableJobs.map(job => ({
    id: job.key,
    name: job.name,
    pattern: job.pattern,
    tz: job.tz,
    nextRun: new Date(job.next).toISOString(),
  }));
}

/**
 * List all scheduled (delayed) jobs
 */
async function listScheduledJobs() {
  const delayedJobs = await scheduledQueue.getJobs(['delayed']);
  
  return delayedJobs.map(job => ({
    id: job.id,
    name: job.name,
    data: job.data,
    scheduledFor: new Date(job.timestamp + job.opts.delay).toISOString(),
    createdAt: new Date(job.timestamp).toISOString(),
  }));
}

/**
 * Get queue for worker
 */
function getScheduledQueue() {
  return scheduledQueue;
}

/**
 * Common scheduled job patterns
 */
const schedulePatterns = {
  EVERY_MINUTE: '* * * * *',
  EVERY_5_MINUTES: '*/5 * * * *',
  EVERY_15_MINUTES: '*/15 * * * *',
  EVERY_30_MINUTES: '*/30 * * * *',
  HOURLY: '0 * * * *',
  DAILY_MIDNIGHT: '0 0 * * *',
  DAILY_NOON: '0 12 * * *',
  WEEKLY_MONDAY: '0 0 * * 1',
  MONTHLY: '0 0 1 * *',
};

module.exports = {
  scheduleRecurringJob,
  scheduleDelayedJob,
  removeScheduledJob,
  listRecurringJobs,
  listScheduledJobs,
  getScheduledQueue,
  schedulePatterns,
};
