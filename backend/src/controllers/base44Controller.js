/**
 * Base44 Controller
 * Handles Base44 platform integration and LLM routing
 */

import base44Service from '../services/base44Service.js';
import { createError } from '../utils/helpers.js';
import { logger } from '../config/logger.js';

/**
 * Call a Base44 function
 * POST /api/base44/function/:functionName
 */
export const callFunction = async (req, res, next) => {
  try {
    const { functionName } = req.params;
    const params = req.body;
    const userId = req.user?.id;

    if (!functionName) {
      throw createError(400, 'Function name is required');
    }

    const result = await base44Service.callFunction(functionName, params, { userId });

    res.json({
      success: true,
      data: result,
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Call Base44 LLM
 * POST /api/base44/llm
 */
export const callLLM = async (req, res, next) => {
  try {
    const {
      model = 'base44',
      prompt,
      temperature,
      maxTokens,
      systemPrompt,
      ...otherOptions
    } = req.body;

    if (!prompt) {
      throw createError(400, 'Prompt is required');
    }

    const userId = req.user?.id;

    const result = await base44Service.callLLM(model, prompt, {
      userId,
      temperature,
      maxTokens,
      systemPrompt,
      ...otherOptions,
    });

    res.json({
      success: true,
      data: result,
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Stream LLM response
 * POST /api/base44/llm/stream
 */
export const streamLLM = async (req, res, next) => {
  try {
    const {
      model = 'base44',
      prompt,
      temperature,
      maxTokens,
      systemPrompt,
      ...otherOptions
    } = req.body;

    if (!prompt) {
      throw createError(400, 'Prompt is required');
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await base44Service.streamLLM(model, prompt, {
      temperature,
      maxTokens,
      systemPrompt,
      ...otherOptions,
    });

    // Pipe the stream to response
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          res.write('data: [DONE]\n\n');
          res.end();
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        res.write(`data: ${chunk}\n\n`);
      }
    } catch (streamError) {
      logger.error('[Base44Controller] Stream error:', streamError);
      res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
      res.end();
    }

  } catch (error) {
    next(error);
  }
};

/**
 * Get available LLM models
 * GET /api/base44/models
 */
export const getModels = async (req, res, next) => {
  try {
    const models = await base44Service.getAvailableModels();

    res.json({
      success: true,
      data: models,
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get Base44 service status
 * GET /api/base44/status
 */
export const getStatus = async (req, res, next) => {
  try {
    const status = await base44Service.getStatus();

    res.json({
      success: true,
      data: status,
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Test Base44 connection
 * POST /api/base44/test
 */
export const testConnection = async (req, res, next) => {
  try {
    // Try to authenticate
    const token = await base44Service.authenticate();

    // Try to get models
    const models = await base44Service.getAvailableModels();

    res.json({
      success: true,
      message: 'Base44 connection successful',
      data: {
        authenticated: !!token,
        modelsAvailable: models.length,
        models: models.slice(0, 5), // Show first 5 models
      },
    });

  } catch (error) {
    next(error);
  }
};

export default {
  callFunction,
  callLLM,
  streamLLM,
  getModels,
  getStatus,
  testConnection,
};
