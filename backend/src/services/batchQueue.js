/**
 * BullMQ-based batch job queue with Redis persistence
 */

const { Queue } = require('bullmq');
const { createRedisConnection } = require('../config/redis');

// Create queue instance
const batchQueue = new Queue('batch-jobs', {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 1000, // Keep last 1000 completed jobs
      age: 24 * 3600, // Keep for 24 hours
    },
    removeOnFail: {
      count: 5000, // Keep last 5000 failed jobs for debugging
    },
  },
});

async function enqueueJob(type, payload, userId, tenantId) {
  const job = await batchQueue.add(
    type,
    {
      type,
      payload,
      userId,
      tenantId,
    },
    {
      priority: payload.priority ? -payload.priority : 0, // BullMQ uses lower numbers for higher priority
      jobId: `${type}_${userId}_${Date.now()}`,
    }
  );

  return {
    id: job.id,
    type,
    payload,
    userId,
    tenantId,
    status: await job.getState(),
    progress: job.progress || 0,
    result: job.returnvalue || null,
    error: job.failedReason || null,
    createdAt: new Date(job.timestamp).toISOString(),
    updatedAt: new Date(job.timestamp).toISOString(),
  };
}

async function getJob(jobId) {
  const job = await batchQueue.getJob(jobId);
  if (!job) return null;

  return {
    id: job.id,
    type: job.name,
    payload: job.data.payload,
    userId: job.data.userId,
    tenantId: job.data.tenantId,
    status: await job.getState(),
    progress: job.progress || 0,
    result: job.returnvalue || null,
    error: job.failedReason || null,
    createdAt: new Date(job.timestamp).toISOString(),
    updatedAt: new Date(job.timestamp).toISOString(),
  };
}

async function listJobs({ status, userId, tenantId } = {}) {
  let jobs = [];

  if (status) {
    const statusMap = {
      queued: 'waiting',
      processing: 'active',
      completed: 'completed',
      failed: 'failed',
      cancelled: 'failed',
    };
    jobs = await batchQueue.getJobs([statusMap[status] || status]);
  } else {
    const [waiting, active, completed, failed] = await Promise.all([
      batchQueue.getJobs(['waiting']),
      batchQueue.getJobs(['active']),
      batchQueue.getJobs(['completed']),
      batchQueue.getJobs(['failed']),
    ]);
    jobs = [...waiting, ...active, ...completed, ...failed];
  }

  let filtered = jobs.filter(job => {
    if (userId && job.data.userId !== userId) return false;
    if (tenantId && job.data.tenantId !== tenantId) return false;
    return true;
  });

  const transformed = await Promise.all(
    filtered.map(async (job) => ({
      id: job.id,
      type: job.name,
      payload: job.data.payload,
      userId: job.data.userId,
      tenantId: job.data.tenantId,
      status: await job.getState(),
      progress: job.progress || 0,
      result: job.returnvalue || null,
      error: job.failedReason || null,
      createdAt: new Date(job.timestamp).toISOString(),
      updatedAt: new Date(job.timestamp).toISOString(),
    }))
  );

  return transformed;
}

async function cancelJob(jobId) {
  const job = await batchQueue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  if (state === 'waiting' || state === 'active') {
    await job.remove();
  }

  return {
    id: job.id,
    type: job.name,
    payload: job.data.payload,
    userId: job.data.userId,
    tenantId: job.data.tenantId,
    status: 'cancelled',
    progress: job.progress || 0,
    result: null,
    error: 'Cancelled by user',
    createdAt: new Date(job.timestamp).toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function getQueue() {
  return batchQueue;
}

async function closeQueue() {
  await batchQueue.close();
}

module.exports = {
  enqueueJob,
  getJob,
  listJobs,
  cancelJob,
  getQueue,
  closeQueue
};


