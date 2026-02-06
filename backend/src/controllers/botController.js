/**
 * Bot Controller
 * Handles autonomous bot operations with Quantum LLM integration
 */

import Bot from '../models/Bot.js';
import BotExecution from '../models/BotExecution.js';
import BotKnowledge from '../models/BotKnowledge.js';
import BotFeedback from '../models/BotFeedback.js';
import quantumLLMService from '../services/quantumLLMService.js';
import multiLLMService from '../services/multiLLMService.js';
import { createError } from '../utils/helpers.js';
import logger from '../config/logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new bot
 * POST /api/bots
 */
export const createBot = async (req, res, next) => {
  try {
    const bot = new Bot({
      ...req.body,
      userId: req.user.id,
    });

    await bot.save();

    logger.info(`[Bot] Created bot: ${bot.name} (${bot._id})`);

    res.status(201).json({
      success: true,
      data: bot,
    });
  } catch (error) {
    logger.error('[Bot] Create error:', error);
    next(error);
  }
};

/**
 * Get all bots for current user
 * GET /api/bots
 */
export const getBots = async (req, res, next) => {
  try {
    const {
      status,
      channel,
      autonomous,
      limit = 50,
      skip = 0,
    } = req.query;

    const filter = { userId: req.user.id };

    if (status) filter.isActive = status === 'active';
    if (channel) filter['channels.type'] = channel;
    if (autonomous) filter['autonomous.enabled'] = autonomous === 'true';

    const bots = await Bot.find(filter)
      .sort({ lastActivityAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Bot.countDocuments(filter);

    res.json({
      success: true,
      count: bots.length,
      total,
      data: bots,
    });
  } catch (error) {
    logger.error('[Bot] Get bots error:', error);
    next(error);
  }
};

/**
 * Get single bot
 * GET /api/bots/:id
 */
export const getBot = async (req, res, next) => {
  try {
    const bot = await Bot.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!bot) {
      throw createError(404, 'Bot not found');
    }

    res.json({
      success: true,
      data: bot,
    });
  } catch (error) {
    logger.error('[Bot] Get bot error:', error);
    next(error);
  }
};

/**
 * Update bot
 * PUT /api/bots/:id
 */
export const updateBot = async (req, res, next) => {
  try {
    const bot = await Bot.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!bot) {
      throw createError(404, 'Bot not found');
    }

    logger.info(`[Bot] Updated bot: ${bot.name} (${bot._id})`);

    res.json({
      success: true,
      data: bot,
    });
  } catch (error) {
    logger.error('[Bot] Update error:', error);
    next(error);
  }
};

/**
 * Delete bot
 * DELETE /api/bots/:id
 */
export const deleteBot = async (req, res, next) => {
  try {
    const bot = await Bot.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!bot) {
      throw createError(404, 'Bot not found');
    }

    // Delete associated data
    await BotExecution.deleteMany({ botId: bot._id });
    await BotKnowledge.deleteMany({ botId: bot._id });
    await BotFeedback.deleteMany({ botId: bot._id });

    logger.info(`[Bot] Deleted bot: ${bot.name} (${bot._id})`);

    res.json({
      success: true,
      message: 'Bot and all associated data deleted successfully',
    });
  } catch (error) {
    logger.error('[Bot] Delete error:', error);
    next(error);
  }
};

/**
 * Execute bot with Quantum LLM
 * POST /api/bots/:id/execute
 */
export const executeBot = async (req, res, next) => {
  try {
    const bot = await Bot.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!bot) {
      throw createError(404, 'Bot not found');
    }

    if (!bot.isActive) {
      throw createError(400, 'Bot is not active');
    }

    const {
      message: userMessage,
      attachments = [],
      channel = 'api',
      sessionId,
      metadata = {},
    } = req.body;

    if (!userMessage) {
      throw createError(400, 'Message is required');
    }

    const executionId = uuidv4();
    logger.info(`[Bot] Starting execution: ${bot.name} (${executionId})`);

    // Create execution record
    const execution = new BotExecution({
      botId: bot._id,
      executionId,
      trigger: {
        type: 'user_message',
        source: channel,
        userId: req.user.id,
        data: { sessionId, metadata },
      },
      input: {
        message: userMessage,
        attachments,
        metadata,
      },
      context: {
        conversationId: sessionId || executionId,
        sessionData: metadata,
      },
      timing: {
        queuedAt: new Date(),
      },
    });

    await execution.save();

    // Update execution status
    execution.status = 'running';
    execution.timing.startedAt = new Date();
    await execution.save();

    // Retrieve relevant knowledge (RAG)
    const relevantKnowledge = await retrieveKnowledge(bot._id, userMessage);

    // Build enhanced system prompt with knowledge
    const enhancedSystemPrompt = buildSystemPrompt(
      bot.personality.systemPrompt,
      relevantKnowledge,
      bot.personality
    );

    // Execute with Quantum LLM
    const llmStartTime = Date.now();
    let result;

    if (bot.llm.model === 'quantum' || bot.llm.forceEnsemble) {
      result = await quantumLLMService.quantumQuery(userMessage, {
        systemPrompt: enhancedSystemPrompt,
        temperature: bot.personality.temperature,
        maxTokens: bot.personality.maxResponseLength,
        taskType: bot.llm.taskType,
        forceEnsemble: bot.llm.forceEnsemble,
        userId: req.user.id,
      });
    } else {
      result = await multiLLMService.callLLM(bot.llm.model, userMessage, {
        systemPrompt: enhancedSystemPrompt,
        temperature: bot.personality.temperature,
        maxTokens: bot.personality.maxResponseLength,
      });

      // Normalize response format
      result = {
        success: true,
        response: result.text,
        model: result.model,
        provider: result.provider,
        usage: result.usage,
      };
    }

    const llmResponseTime = Date.now() - llmStartTime;

    // Update execution record
    execution.status = result.success ? 'completed' : 'failed';
    execution.timing.completedAt = new Date();
    execution.timing.llmResponseTime = llmResponseTime;
    execution.response = {
      text: result.response,
      formatted: formatResponse(result.response, bot.personality.style),
    };
    execution.llm = {
      model: result.model || bot.llm.model,
      provider: result.provider || 'quantum',
      quantumMetrics: result.quantumMetrics,
      tokenUsage: result.usage || {},
      cost: calculateCost(result.model, result.usage),
    };

    if (!result.success && result.error) {
      execution.error = {
        message: result.error,
        code: 'LLM_ERROR',
      };
    }

    await execution.save();

    // Update bot metrics
    await updateBotMetrics(bot, execution);

    // Update knowledge retrieval stats
    if (relevantKnowledge.length > 0) {
      await BotKnowledge.updateMany(
        { _id: { $in: relevantKnowledge.map(k => k._id) } },
        {
          $inc: { 'usage.retrievalCount': 1 },
          $set: { 'usage.lastRetrievedAt': new Date() },
        }
      );
    }

    logger.info(`[Bot] Execution completed: ${bot.name} (${executionId}) - ${llmResponseTime}ms`);

    res.json({
      success: true,
      executionId,
      response: result.response,
      formatted: execution.response.formatted,
      quantumMetrics: result.quantumMetrics,
      timing: {
        total: execution.timing.durationMs,
        llm: llmResponseTime,
      },
      model: execution.llm.model,
      provider: execution.llm.provider,
    });

  } catch (error) {
    logger.error('[Bot] Execution error:', error);
    next(error);
  }
};

/**
 * Test bot without saving execution
 * POST /api/bots/:id/test
 */
export const testBot = async (req, res, next) => {
  try {
    const bot = await Bot.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!bot) {
      throw createError(404, 'Bot not found');
    }

    const { message: userMessage } = req.body;

    if (!userMessage) {
      throw createError(400, 'Message is required');
    }

    // Quick test execution (no database record)
    const result = await quantumLLMService.quantumQuery(userMessage, {
      systemPrompt: bot.personality.systemPrompt,
      temperature: bot.personality.temperature,
      maxTokens: bot.personality.maxResponseLength,
      taskType: bot.llm.taskType,
      forceEnsemble: bot.llm.forceEnsemble,
    });

    res.json({
      success: true,
      response: result.response,
      quantumMetrics: result.quantumMetrics,
      model: result.model,
    });

  } catch (error) {
    logger.error('[Bot] Test error:', error);
    next(error);
  }
};

/**
 * Get bot executions
 * GET /api/bots/:id/executions
 */
export const getBotExecutions = async (req, res, next) => {
  try {
    const bot = await Bot.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!bot) {
      throw createError(404, 'Bot not found');
    }

    const {
      status,
      limit = 50,
      skip = 0,
    } = req.query;

    const filter = { botId: bot._id };
    if (status) filter.status = status;

    const executions = await BotExecution.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select('-workflow.logs -workflow.results'); // Exclude large fields

    const total = await BotExecution.countDocuments(filter);

    res.json({
      success: true,
      count: executions.length,
      total,
      data: executions,
    });
  } catch (error) {
    logger.error('[Bot] Get executions error:', error);
    next(error);
  }
};

/**
 * Get bot metrics and analytics
 * GET /api/bots/:id/metrics
 */
export const getBotMetrics = async (req, res, next) => {
  try {
    const bot = await Bot.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!bot) {
      throw createError(404, 'Bot not found');
    }

    // Get recent executions for detailed metrics
    const recentExecutions = await BotExecution.find({ botId: bot._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('executionId status timing llm.quantumMetrics createdAt');

    // Get feedback summary
    const feedbackStats = await BotFeedback.aggregate([
      { $match: { botId: bot._id } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalFeedback: { $sum: 1 },
          positiveCount: {
            $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] }
          },
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        bot: {
          id: bot._id,
          name: bot.name,
          isActive: bot.isActive,
          autonomous: bot.autonomous,
        },
        metrics: bot.metrics,
        feedback: feedbackStats[0] || {
          avgRating: 0,
          totalFeedback: 0,
          positiveCount: 0,
        },
        recentExecutions,
      },
    });
  } catch (error) {
    logger.error('[Bot] Get metrics error:', error);
    next(error);
  }
};

/**
 * Deploy bot to channel
 * POST /api/bots/:id/deploy
 */
export const deployBot = async (req, res, next) => {
  try {
    const bot = await Bot.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!bot) {
      throw createError(404, 'Bot not found');
    }

    const { channel, config = {} } = req.body;

    if (!channel) {
      throw createError(400, 'Channel is required');
    }

    const validChannels = ['whatsapp', 'email', 'web', 'api', 'slack', 'telegram'];
    if (!validChannels.includes(channel)) {
      throw createError(400, `Invalid channel. Must be one of: ${validChannels.join(', ')}`);
    }

    // Generate endpoint URL
    const endpointUrl = generateChannelEndpoint(bot._id, channel);

    // Check if channel already exists
    const existingChannelIndex = bot.channels.findIndex(c => c.type === channel);

    if (existingChannelIndex >= 0) {
      // Update existing channel
      bot.channels[existingChannelIndex] = {
        type: channel,
        config,
        isActive: true,
        deployedAt: new Date(),
        endpointUrl,
      };
    } else {
      // Add new channel
      bot.channels.push({
        type: channel,
        config,
        isActive: true,
        deployedAt: new Date(),
        endpointUrl,
      });
    }

    bot.isPublished = true;
    await bot.save();

    logger.info(`[Bot] Deployed bot ${bot.name} to ${channel}`);

    res.json({
      success: true,
      message: `Bot deployed to ${channel}`,
      endpointUrl,
      data: bot,
    });
  } catch (error) {
    logger.error('[Bot] Deploy error:', error);
    next(error);
  }
};

/**
 * Undeploy bot from channel
 * POST /api/bots/:id/undeploy
 */
export const undeployBot = async (req, res, next) => {
  try {
    const bot = await Bot.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!bot) {
      throw createError(404, 'Bot not found');
    }

    const { channel } = req.body;

    const channelIndex = bot.channels.findIndex(c => c.type === channel);

    if (channelIndex === -1) {
      throw createError(404, `Bot not deployed to ${channel}`);
    }

    bot.channels[channelIndex].isActive = false;
    await bot.save();

    logger.info(`[Bot] Undeployed bot ${bot.name} from ${channel}`);

    res.json({
      success: true,
      message: `Bot undeployed from ${channel}`,
      data: bot,
    });
  } catch (error) {
    logger.error('[Bot] Undeploy error:', error);
    next(error);
  }
};

/**
 * Add knowledge to bot
 * POST /api/bots/:id/knowledge
 */
export const addKnowledge = async (req, res, next) => {
  try {
    const bot = await Bot.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!bot) {
      throw createError(404, 'Bot not found');
    }

    const { text, title, type = 'document', category, tags = [] } = req.body;

    if (!text) {
      throw createError(400, 'Text content is required');
    }

    // Generate embedding
    const embedding = await multiLLMService.generateEmbedding(text);

    const knowledge = new BotKnowledge({
      botId: bot._id,
      content: {
        text,
        title,
        type,
      },
      source: {
        type: 'manual',
        uploadedBy: req.user.id,
        uploadedAt: new Date(),
      },
      embedding: {
        vector: embedding.embedding,
        model: embedding.model,
        dimension: embedding.embedding.length,
      },
      metadata: {
        category,
        tags,
      },
      isIndexed: true,
    });

    await knowledge.save();

    logger.info(`[Bot] Added knowledge to bot ${bot.name}`);

    res.status(201).json({
      success: true,
      data: knowledge,
    });
  } catch (error) {
    logger.error('[Bot] Add knowledge error:', error);
    next(error);
  }
};

/**
 * Get bot knowledge
 * GET /api/bots/:id/knowledge
 */
export const getKnowledge = async (req, res, next) => {
  try {
    const bot = await Bot.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!bot) {
      throw createError(404, 'Bot not found');
    }

    const knowledge = await BotKnowledge.find({
      botId: bot._id,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: knowledge.length,
      data: knowledge,
    });
  } catch (error) {
    logger.error('[Bot] Get knowledge error:', error);
    next(error);
  }
};

/**
 * Delete knowledge
 * DELETE /api/bots/:id/knowledge/:knowledgeId
 */
export const deleteKnowledge = async (req, res, next) => {
  try {
    const bot = await Bot.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!bot) {
      throw createError(404, 'Bot not found');
    }

    const knowledge = await BotKnowledge.findOneAndDelete({
      _id: req.params.knowledgeId,
      botId: bot._id,
    });

    if (!knowledge) {
      throw createError(404, 'Knowledge not found');
    }

    res.json({
      success: true,
      message: 'Knowledge deleted successfully',
    });
  } catch (error) {
    logger.error('[Bot] Delete knowledge error:', error);
    next(error);
  }
};

/**
 * Train bot with feedback
 * POST /api/bots/:id/train
 */
export const trainBot = async (req, res, next) => {
  try {
    const bot = await Bot.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!bot) {
      throw createError(404, 'Bot not found');
    }

    if (!bot.learning.enabled) {
      throw createError(400, 'Learning is not enabled for this bot');
    }

    // Get recent feedback
    const feedback = await BotFeedback.find({
      botId: bot._id,
      isProcessed: false,
      rating: { $gte: bot.learning.feedbackThreshold * 5 },
    }).limit(100);

    if (feedback.length === 0) {
      return res.json({
        success: true,
        message: 'No new feedback to process',
        processed: 0,
      });
    }

    let processed = 0;

    for (const fb of feedback) {
      // Adjust system prompt based on feedback
      if (bot.learning.adaptSystemPrompt && fb.comment) {
        // Simple adaptation: append successful patterns
        // TODO: Implement more sophisticated learning
        processed++;
      }

      fb.isProcessed = true;
      await fb.save();
    }

    await bot.save();

    logger.info(`[Bot] Trained bot ${bot.name} with ${processed} feedback items`);

    res.json({
      success: true,
      message: `Processed ${processed} feedback items`,
      processed,
    });
  } catch (error) {
    logger.error('[Bot] Train error:', error);
    next(error);
  }
};

/**
 * Submit user feedback
 * POST /api/bots/:id/feedback
 */
export const submitFeedback = async (req, res, next) => {
  try {
    const { executionId, rating, helpful, comment, issues = [] } = req.body;

    if (!executionId) {
      throw createError(400, 'Execution ID is required');
    }

    if (!rating || rating < 1 || rating > 5) {
      throw createError(400, 'Rating must be between 1 and 5');
    }

    const execution = await BotExecution.findOne({ executionId });

    if (!execution) {
      throw createError(404, 'Execution not found');
    }

    // Create feedback record
    const feedback = new BotFeedback({
      botId: execution.botId,
      executionId,
      userId: req.user.id,
      rating,
      helpful,
      comment,
      issues,
      context: {
        prompt: execution.input.message,
        response: execution.response.text,
        quantumMetrics: execution.llm.quantumMetrics,
        channel: execution.trigger.source,
      },
    });

    await feedback.save();

    // Update execution record
    execution.feedback = {
      rating,
      comment,
      helpful,
      submittedAt: new Date(),
    };
    await execution.save();

    // Update bot metrics
    const bot = await Bot.findById(execution.botId);
    if (bot) {
      bot.metrics.totalFeedbackCount++;
      if (rating >= 4) {
        bot.metrics.positiveFeedbackCount++;
      }
      bot.metrics.userSatisfactionScore =
        bot.metrics.positiveFeedbackCount / bot.metrics.totalFeedbackCount;
      await bot.save();
    }

    logger.info(`[Bot] Feedback submitted for execution ${executionId}`);

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback,
    });
  } catch (error) {
    logger.error('[Bot] Submit feedback error:', error);
    next(error);
  }
};

// Helper Functions

async function retrieveKnowledge(botId, query, limit = 5) {
  try {
    // Generate query embedding
    const queryEmbedding = await multiLLMService.generateEmbedding(query);

    // Get all knowledge for this bot
    const knowledge = await BotKnowledge.find({
      botId,
      isActive: true,
      isIndexed: true,
    });

    if (knowledge.length === 0) return [];

    // Calculate cosine similarity
    const results = knowledge.map(k => ({
      ...k.toObject(),
      similarity: cosineSimilarity(queryEmbedding.embedding, k.embedding.vector),
    }));

    // Sort by similarity and return top N
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .filter(k => k.similarity > 0.7); // Only return relevant results

  } catch (error) {
    logger.error('[Bot] Knowledge retrieval error:', error);
    return [];
  }
}

function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  return normA > 0 && normB > 0 ? dotProduct / (normA * normB) : 0;
}

function buildSystemPrompt(basePrompt, knowledge, personality) {
  let prompt = basePrompt;

  // Add knowledge context
  if (knowledge.length > 0) {
    prompt += '\n\nRelevant Knowledge:\n';
    knowledge.forEach((k, i) => {
      prompt += `\n${i + 1}. ${k.content.title || 'Untitled'}:\n${k.content.text.substring(0, 500)}...\n`;
    });
    prompt += '\nUse this knowledge to provide accurate and helpful responses.';
  }

  // Add personality instructions
  prompt += `\n\nTone: ${personality.tone}`;
  prompt += `\nStyle: ${personality.style}`;
  prompt += `\nLanguage: ${personality.language}`;

  return prompt;
}

function formatResponse(text, style) {
  // Simple formatting based on style
  switch (style) {
    case 'concise':
      return text.split('\n\n')[0]; // First paragraph only
    case 'detailed':
      return text; // Keep as is
    case 'conversational':
      return text; // Keep as is
    case 'instructional':
      // Add numbering if not present
      return text.split('\n').map((line, i) =>
        line.match(/^\d+\./) ? line : `${i + 1}. ${line}`
      ).join('\n');
    default:
      return text;
  }
}

function calculateCost(model, usage) {
  if (!usage || !usage.total_tokens) return 0;

  const pricing = {
    'gpt-4': 0.03,
    'gpt-3.5-turbo': 0.002,
    'claude-3-opus': 0.015,
    'claude-3-sonnet': 0.003,
    'gemini-pro': 0.01,
    'grok-2': 0.005,
  };

  const rate = pricing[model] || 0.01;
  return (usage.total_tokens / 1000) * rate;
}

async function updateBotMetrics(bot, execution) {
  bot.metrics.totalExecutions++;

  if (execution.status === 'completed') {
    bot.metrics.successfulExecutions++;
  } else if (execution.status === 'failed') {
    bot.metrics.failedExecutions++;
  }

  // Update average response time
  const totalTime = bot.metrics.averageResponseTime * (bot.metrics.totalExecutions - 1);
  bot.metrics.averageResponseTime =
    (totalTime + (execution.timing.durationMs || 0)) / bot.metrics.totalExecutions;

  // Update quantum metrics averages
  if (execution.llm.quantumMetrics) {
    const qm = execution.llm.quantumMetrics;
    const prevTotal = bot.metrics.totalExecutions - 1;

    if (qm.coherence) {
      bot.metrics.averageCoherence =
        (bot.metrics.averageCoherence * prevTotal + qm.coherence) / bot.metrics.totalExecutions;
    }

    if (qm.confidence) {
      bot.metrics.averageConfidence =
        (bot.metrics.averageConfidence * prevTotal + qm.confidence) / bot.metrics.totalExecutions;
    }
  }

  bot.lastActivityAt = new Date();
  await bot.save();
}

function generateChannelEndpoint(botId, channel) {
  const baseUrl = process.env.API_URL || 'http://localhost:5000';
  return `${baseUrl}/api/webhooks/bot/${botId}/${channel}`;
}

export default {
  createBot,
  getBots,
  getBot,
  updateBot,
  deleteBot,
  executeBot,
  testBot,
  getBotExecutions,
  getBotMetrics,
  deployBot,
  undeployBot,
  addKnowledge,
  getKnowledge,
  deleteKnowledge,
  trainBot,
  submitFeedback,
};
