/**
 * Webhook Routes
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import Joi from 'joi';
import { registerWebhook, listWebhooks, deleteWebhook, emitWebhook } from '../services/webhookService.js';

const router = express.Router();

const webhookSchema = Joi.object({
  url: Joi.string().uri().required(),
  events: Joi.array().items(Joi.string()).min(1).required(),
  secret: Joi.string().optional()
});

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const webhooks = await listWebhooks(req.user?.id, req.tenant?.id);
    res.json(webhooks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', validateRequest(webhookSchema), async (req, res) => {
  try {
    const hook = await registerWebhook({
      ...req.body,
      userId: req.user?.id,
      tenantId: req.tenant?.id
    });
    res.status(201).json(hook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await deleteWebhook(req.params.id);
    res.json({ deleted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/test', async (req, res) => {
  try {
    const deliveries = await emitWebhook('WEBHOOK_TEST', {
      message: 'Test event',
      timestamp: new Date().toISOString(),
      userId: req.user?.id,
    });

    res.json({ deliveries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
