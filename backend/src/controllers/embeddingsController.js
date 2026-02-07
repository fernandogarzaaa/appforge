/**
 * Embeddings Controller
 * Handles embedding generation requests
 */

import embeddingsService from '../services/embeddingsService.js';
import { createError } from '../utils/helpers.js';
import { logger } from '../config/logger.js';

/**
 * Generate embedding for a single text
 * POST /api/embeddings
 */
export const generateEmbedding = async (req, res, next) => {
  try {
    const { text, model, dimensions } = req.body;

    if (!text) {
      throw createError(400, 'Text is required');
    }

    const embedding = await embeddingsService.getEmbedding(text, {
      model,
      dimensions,
    });

    res.json({
      success: true,
      data: {
        embedding,
        dimension: embedding.length,
        model: model || embeddingsService.model,
      },
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Generate embeddings for multiple texts
 * POST /api/embeddings/batch
 */
export const generateBatchEmbeddings = async (req, res, next) => {
  try {
    const { texts, model, dimensions } = req.body;

    if (!texts || !Array.isArray(texts)) {
      throw createError(400, 'Texts array is required');
    }

    if (texts.length === 0) {
      throw createError(400, 'Texts array cannot be empty');
    }

    if (texts.length > 100) {
      throw createError(400, 'Maximum 100 texts per batch request');
    }

    const embeddings = await embeddingsService.getBatchEmbeddings(texts, {
      model,
      dimensions,
    });

    res.json({
      success: true,
      data: {
        embeddings,
        count: embeddings.length,
        dimension: embeddings[0]?.length || 0,
        model: model || embeddingsService.model,
      },
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Calculate similarity between two texts
 * POST /api/embeddings/similarity
 */
export const calculateSimilarity = async (req, res, next) => {
  try {
    const { text1, text2, model, dimensions } = req.body;

    if (!text1 || !text2) {
      throw createError(400, 'Both text1 and text2 are required');
    }

    // Get embeddings for both texts
    const embeddings = await embeddingsService.getBatchEmbeddings(
      [text1, text2],
      { model, dimensions }
    );

    // Calculate similarity
    const similarity = embeddingsService.cosineSimilarity(embeddings[0], embeddings[1]);

    res.json({
      success: true,
      data: {
        similarity,
        text1_preview: text1.substring(0, 100),
        text2_preview: text2.substring(0, 100),
      },
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Find most similar text from candidates
 * POST /api/embeddings/search
 */
export const searchSimilar = async (req, res, next) => {
  try {
    const { query, candidates, model, dimensions, topK = 1 } = req.body;

    if (!query) {
      throw createError(400, 'Query text is required');
    }

    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      throw createError(400, 'Candidates array is required and cannot be empty');
    }

    if (candidates.length > 100) {
      throw createError(400, 'Maximum 100 candidates per search');
    }

    // Get embeddings
    const queryEmbedding = await embeddingsService.getEmbedding(query, {
      model,
      dimensions,
    });

    const candidateEmbeddings = await embeddingsService.getBatchEmbeddings(
      candidates,
      { model, dimensions }
    );

    // Calculate all similarities
    const results = candidates.map((text, index) => ({
      text,
      index,
      similarity: embeddingsService.cosineSimilarity(
        queryEmbedding,
        candidateEmbeddings[index]
      ),
    }));

    // Sort by similarity (descending) and take top K
    results.sort((a, b) => b.similarity - a.similarity);
    const topResults = results.slice(0, Math.min(topK, results.length));

    res.json({
      success: true,
      data: {
        query_preview: query.substring(0, 100),
        results: topResults,
        total_candidates: candidates.length,
      },
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get embeddings service status
 * GET /api/embeddings/status
 */
export const getStatus = async (req, res, next) => {
  try {
    const status = embeddingsService.getStatus();

    res.json({
      success: true,
      data: status,
    });

  } catch (error) {
    next(error);
  }
};

export default {
  generateEmbedding,
  generateBatchEmbeddings,
  calculateSimilarity,
  searchSimilar,
  getStatus,
};
