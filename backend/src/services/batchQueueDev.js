/**
 * Development Mode Fallback - In-memory queue when Redis unavailable
 */

const { v4: uuidv4  } = require('uuid');

const jobs = new Map();
const queue = [];
let processing = false;

function enqueueJob(type, payload, userId, tenantId) {
  const id = uuidv4();
  const job = {
    id,
    type,
    payload,
    status: 'queued',
    progress: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId,
    tenantId
  };

  jobs.set(id, job);
  queue.push(id);
  processQueue();
  return Promise.resolve(job);
}

async function getJob(jobId) {
  return jobs.get(jobId) || null;
}

async function listJobs({ status, userId, tenantId } = {}) {
  return Array.from(jobs.values()).filter(job => {
    if (status && job.status !== status) return false;
    if (userId && job.userId !== userId) return false;
    if (tenantId && job.tenantId !== tenantId) return false;
    return true;
  });
}

async function processQueue() {
  if (processing) return;
  processing = true;

  while (queue.length > 0) {
    const jobId = queue.shift();
    const job = jobs.get(jobId);
    if (!job) continue;

    job.status = 'processing';
    job.updatedAt = new Date().toISOString();

    try {
      for (let i = 1; i <= 5; i += 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
        job.progress = i * 20;
        job.updatedAt = new Date().toISOString();
      }

      job.status = 'completed';
      job.result = { message: 'Job completed successfully (in-memory mode)' };
      job.updatedAt = new Date().toISOString();
    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.updatedAt = new Date().toISOString();
    }
  }

  processing = false;
}

async function cancelJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) return null;
  if (job.status === 'completed' || job.status === 'failed') return job;

  job.status = 'cancelled';
  job.updatedAt = new Date().toISOString();
  return job;
}

function getQueue() {
  console.warn('Running in DEVELOPMENT MODE - using in-memory queue');
  return null; // No BullMQ queue in dev mode
}

async function closeQueue() {
  // Nothing to close in dev mode
}

module.exports = {
  enqueueJob,
  getJob,
  listJobs,
  cancelJob,
  getQueue,
  closeQueue
};
