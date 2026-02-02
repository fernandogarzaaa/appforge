/**
 * Scheduled Jobs Routes - API for managing recurring and delayed jobs
 */

const express = require('express');
const { authenticate  } = require('../middleware/auth');
const { validateRequest  } = require('../middleware/validation');
const Joi = require('joi');
const { scheduleRecurringJob,
  scheduleDelayedJob,
  removeScheduledJob,
  listRecurringJobs,
  listScheduledJobs,
  schedulePatterns,
 } = require('../services/scheduledJobs');

const router = express.Router();

const recurringJobSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  data: Joi.object().optional(),
  pattern: Joi.string().required(), // Cron pattern
});

const delayedJobSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  data: Joi.object().optional(),
  delayMs: Joi.number().min(1000).required(), // Min 1 second delay
});

router.use(authenticate);

// List all recurring jobs
router.get('/recurring', async (req, res) => {
  try {
    const jobs = await listRecurringJobs();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Schedule a recurring job
router.post('/recurring', validateRequest(recurringJobSchema), async (req, res) => {
  try {
    const { name, data, pattern } = req.body;
    const job = await scheduleRecurringJob(name, data || {}, pattern);
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List all scheduled (delayed) jobs
router.get('/scheduled', async (req, res) => {
  try {
    const jobs = await listScheduledJobs();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Schedule a delayed job
router.post('/scheduled', validateRequest(delayedJobSchema), async (req, res) => {
  try {
    const { name, data, delayMs } = req.body;
    const job = await scheduleDelayedJob(name, data || {}, delayMs);
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove a scheduled job
router.delete('/:jobId', async (req, res) => {
  try {
    const removed = await removeScheduledJob(req.params.jobId);
    res.json({ removed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available schedule patterns
router.get('/patterns', (req, res) => {
  res.json({
    patterns: schedulePatterns,
    examples: {
      EVERY_MINUTE: 'Run every minute',
      EVERY_5_MINUTES: 'Run every 5 minutes',
      HOURLY: 'Run every hour at :00',
      DAILY_MIDNIGHT: 'Run daily at midnight',
      WEEKLY_MONDAY: 'Run every Monday at midnight',
    },
  });
});

module.exports = router;
