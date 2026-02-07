/**
 * Embeddings Service
 * Provides text embeddings from OpenAI API with caching and error handling
 */

import { createError } from '../utils/helpers.js';
import redisCache from '../utils/redisCache.js';
import { logger } from '../config/logger.js';
import crypto from 'crypto';

class EmbeddingsService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
    this.dimension = 1536; // Default dimension for text-embedding-3-small
    this.cacheEnabled = process.env.ENABLE_EMBEDDING_CACHE !== 'false';
    this.cacheTTL = parseInt(process.env.EMBEDDING_CACHE_TTL || '86400'); // 24 hours default in seconds

    if (!this.apiKey) {
      logger.warn('[EmbeddingsService] OPENAI_API_KEY not configured. Embedding features will be limited.');
    }
  }

  /**
   * Generate a cache key for an embedding request
   */
  _generateCacheKey(text, model = this.model) {
    const hash = crypto.createHash('sha256')
      .update(`${model}:${text}`)
      .digest('hex');
    return `embedding:${model}:${hash}`;
  }

  /**
   * Get embedding from OpenAI API
   * @param {string} text - Text to embed
   * @param {Object} options - Options (model, dimensions)
   * @returns {Promise<number[]>} Embedding vector
   */
  async getEmbedding(text, options = {}) {
    if (!text || typeof text !== 'string') {
      throw createError(400, 'Text is required for embedding generation');
    }

    // Validate text length (OpenAI has token limits)
    if (text.length > 50000) {
      throw createError(400, 'Text too long for embedding (max 50,000 characters)');
    }

    const model = options.model || this.model;
    const dimensions = options.dimensions || this.dimension;

    // Check cache first
    if (this.cacheEnabled) {
      const cacheKey = this._generateCacheKey(text, model);
      const cached = await redisCache.get(cacheKey);

      if (cached) {
        logger.debug(`[EmbeddingsService] Cache hit for text (${text.substring(0, 50)}...)`);
        return cached;
      }
    }

    // Validate API key
    if (!this.apiKey) {
      throw createError(500, 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
    }

    try {
      logger.info(`[EmbeddingsService] Generating embedding for text (${text.length} chars)`);

      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: text,
          dimensions,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error('[EmbeddingsService] OpenAI API error:', error);

        // Handle specific error types
        if (response.status === 401) {
          throw createError(500, 'Invalid OpenAI API key');
        } else if (response.status === 429) {
          throw createError(429, 'OpenAI rate limit exceeded. Please try again later.');
        } else if (response.status === 400) {
          throw createError(400, error.error?.message || 'Invalid request to OpenAI API');
        }

        throw createError(500, 'Failed to generate embedding from OpenAI');
      }

      const data = await response.json();
      const embedding = data.data[0].embedding;

      // Normalize to unit vector
      const normalized = this._normalizeVector(embedding);

      // Cache the result
      if (this.cacheEnabled) {
        const cacheKey = this._generateCacheKey(text, model);
        await redisCache.set(cacheKey, normalized, this.cacheTTL * 1000);
        logger.debug('[EmbeddingsService] Cached embedding');
      }

      // Log usage for billing tracking
      logger.info('[EmbeddingsService] Embedding generated', {
        model,
        tokens: data.usage.total_tokens,
        dimensions: normalized.length,
      });

      return normalized;

    } catch (error) {
      if (error.statusCode) {
        throw error; // Re-throw our custom errors
      }

      logger.error('[EmbeddingsService] Unexpected error:', error);
      throw createError(500, 'Failed to generate embedding: ' + error.message);
    }
  }

  /**
   * Get embeddings for multiple texts in batch
   * @param {string[]} texts - Array of texts to embed
   * @param {Object} options - Options (model, dimensions)
   * @returns {Promise<number[][]>} Array of embedding vectors
   */
  async getBatchEmbeddings(texts, options = {}) {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw createError(400, 'Texts array is required for batch embedding generation');
    }

    // OpenAI supports batch embeddings up to 2048 inputs
    if (texts.length > 2048) {
      throw createError(400, 'Too many texts for batch embedding (max 2048)');
    }

    const model = options.model || this.model;
    const dimensions = options.dimensions || this.dimension;

    // Check cache for each text
    const results = [];
    const uncachedIndices = [];
    const uncachedTexts = [];

    if (this.cacheEnabled) {
      for (let i = 0; i < texts.length; i++) {
        const cacheKey = this._generateCacheKey(texts[i], model);
        const cached = await redisCache.get(cacheKey);

        if (cached) {
          results[i] = cached;
        } else {
          uncachedIndices.push(i);
          uncachedTexts.push(texts[i]);
        }
      }
    } else {
      uncachedTexts.push(...texts);
      uncachedIndices.push(...texts.map((_, i) => i));
    }

    // If all cached, return immediately
    if (uncachedTexts.length === 0) {
      logger.debug('[EmbeddingsService] All embeddings found in cache');
      return results;
    }

    // Validate API key
    if (!this.apiKey) {
      throw createError(500, 'OpenAI API key not configured');
    }

    try {
      logger.info(`[EmbeddingsService] Generating ${uncachedTexts.length} embeddings in batch`);

      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: uncachedTexts,
          dimensions,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error('[EmbeddingsService] OpenAI API error:', error);
        throw createError(response.status, error.error?.message || 'Failed to generate embeddings');
      }

      const data = await response.json();

      // Process and normalize embeddings
      for (let i = 0; i < data.data.length; i++) {
        const embedding = data.data[i].embedding;
        const normalized = this._normalizeVector(embedding);
        const originalIndex = uncachedIndices[i];

        results[originalIndex] = normalized;

        // Cache each embedding
        if (this.cacheEnabled) {
          const cacheKey = this._generateCacheKey(texts[originalIndex], model);
          await redisCache.set(cacheKey, normalized, this.cacheTTL * 1000);
        }
      }

      logger.info('[EmbeddingsService] Batch embeddings generated', {
        model,
        count: uncachedTexts.length,
        tokens: data.usage.total_tokens,
      });

      return results;

    } catch (error) {
      if (error.statusCode) {
        throw error;
      }

      logger.error('[EmbeddingsService] Batch embedding error:', error);
      throw createError(500, 'Failed to generate batch embeddings: ' + error.message);
    }
  }

  /**
   * Calculate cosine similarity between two embedding vectors
   * @param {number[]} a - First embedding vector
   * @param {number[]} b - Second embedding vector
   * @returns {number} Similarity score (0-1)
   */
  cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) {
      throw createError(400, 'Invalid embedding vectors for similarity calculation');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Find the most similar text from a list
   * @param {string} query - Query text
   * @param {string[]} candidates - Candidate texts
   * @param {Object} options - Options
   * @returns {Promise<Object>} Most similar text with score
   */
  async findMostSimilar(query, candidates, options = {}) {
    if (!query || !Array.isArray(candidates) || candidates.length === 0) {
      throw createError(400, 'Query and candidates required for similarity search');
    }

    // Get embeddings for query and all candidates
    const queryEmbedding = await this.getEmbedding(query, options);
    const candidateEmbeddings = await this.getBatchEmbeddings(candidates, options);

    // Calculate similarities
    let maxSimilarity = -1;
    let bestMatch = null;
    let bestIndex = -1;

    for (let i = 0; i < candidateEmbeddings.length; i++) {
      const similarity = this.cosineSimilarity(queryEmbedding, candidateEmbeddings[i]);

      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        bestMatch = candidates[i];
        bestIndex = i;
      }
    }

    return {
      text: bestMatch,
      index: bestIndex,
      similarity: maxSimilarity,
    };
  }

  /**
   * Normalize a vector to unit length
   * @private
   */
  _normalizeVector(vector) {
    let magnitude = 0;
    for (const value of vector) {
      magnitude += value * value;
    }
    magnitude = Math.sqrt(magnitude);

    if (magnitude < 1e-10) {
      return vector.map(() => 0);
    }

    return vector.map(x => x / magnitude);
  }

  /**
   * Clear embedding cache
   */
  async clearCache() {
    logger.info('[EmbeddingsService] Clearing embedding cache (not implemented - would need Redis SCAN)');
    // Note: Implement this using Redis SCAN if needed
    // For now, embeddings expire naturally based on TTL
  }

  /**
   * Get service status and configuration
   */
  getStatus() {
    return {
      configured: !!this.apiKey,
      model: this.model,
      dimension: this.dimension,
      cacheEnabled: this.cacheEnabled,
      cacheTTL: this.cacheTTL,
    };
  }
}

// Singleton instance
const embeddingsService = new EmbeddingsService();

export default embeddingsService;
export { EmbeddingsService };
