import express from 'express';
import { getSolanaConfig, createSubscription } from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/solana/config', authenticate, getSolanaConfig);
router.post('/subscription', authenticate, createSubscription);

export default router;
