/**
 * Embeddings Routes
 * API endpoints for text embedding generation
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  generateEmbedding,
  generateBatchEmbeddings,
  calculateSimilarity,
  searchSimilar,
  getStatus,
} from '../controllers/embeddingsController.js';

const router = express.Router();

// All embeddings routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/embeddings
 * @desc    Generate embedding for a single text
 * @access  Private
 * @body    { text: string, model?: string, dimensions?: number }
 */
router.post('/', generateEmbedding);

/**
 * @route   POST /api/embeddings/batch
 * @desc    Generate embeddings for multiple texts
 * @access  Private
 * @body    { texts: string[], model?: string, dimensions?: number }
 */
router.post('/batch', generateBatchEmbeddings);

/**
 * @route   POST /api/embeddings/similarity
 * @desc    Calculate cosine similarity between two texts
 * @access  Private
 * @body    { text1: string, text2: string, model?: string, dimensions?: number }
 */
router.post('/similarity', calculateSimilarity);

/**
 * @route   POST /api/embeddings/search
 * @desc    Find most similar texts from candidates
 * @access  Private
 * @body    { query: string, candidates: string[], topK?: number, model?: string, dimensions?: number }
 */
router.post('/search', searchSimilar);

/**
 * @route   GET /api/embeddings/status
 * @desc    Get embeddings service status and configuration
 * @access  Private
 */
router.get('/status', getStatus);

export default router;
