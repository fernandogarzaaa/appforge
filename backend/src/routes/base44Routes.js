/**
 * Base44 Routes
 * API endpoints for Base44 platform integration
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  callFunction,
  callLLM,
  streamLLM,
  getModels,
  getStatus,
  testConnection,
} from '../controllers/base44Controller.js';

const router = express.Router();

// All Base44 routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/base44/function/:functionName
 * @desc    Call a Base44 function
 * @access  Private
 * @param   functionName - Name of the function to call
 * @body    Function parameters
 */
router.post('/function/:functionName', callFunction);

/**
 * @route   POST /api/base44/llm
 * @desc    Call Base44 LLM (AI model)
 * @access  Private
 * @body    { model: string, prompt: string, temperature?: number, maxTokens?: number, systemPrompt?: string }
 */
router.post('/llm', callLLM);

/**
 * @route   POST /api/base44/llm/stream
 * @desc    Stream LLM response (Server-Sent Events)
 * @access  Private
 * @body    { model: string, prompt: string, temperature?: number, maxTokens?: number, systemPrompt?: string }
 */
router.post('/llm/stream', streamLLM);

/**
 * @route   GET /api/base44/models
 * @desc    Get available LLM models
 * @access  Private
 */
router.get('/models', getModels);

/**
 * @route   GET /api/base44/status
 * @desc    Get Base44 service status and configuration
 * @access  Private
 */
router.get('/status', getStatus);

/**
 * @route   POST /api/base44/test
 * @desc    Test Base44 connection and authentication
 * @access  Private
 */
router.post('/test', testConnection);

export default router;
