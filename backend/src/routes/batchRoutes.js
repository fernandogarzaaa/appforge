/**
 * Batch Processing Routes
 */

const express = require('express');
const { enqueueJob, getJob, listJobs, cancelJob  } = require('../services/batchQueue');
const { authenticate  } = require('../middleware/auth');
const { validateRequest  } = require('../middleware/validation');
const { batchJobSchema  } = require('../validators/schemas');

const router = express.Router();

router.use(authenticate);

router.post('/', validateRequest(batchJobSchema), async (req, res) => {
  try {
    const { type, payload } = req.body;
    const job = await enqueueJob(type, payload, req.user?.id, req.tenant?.id);
    res.status(202).json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const jobs = await listJobs({ userId: req.user?.id, tenantId: req.tenant?.id });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:jobId', async (req, res) => {
  try {
    const job = await getJob(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:jobId/cancel', async (req, res) => {
  try {
    const job = await cancelJob(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
