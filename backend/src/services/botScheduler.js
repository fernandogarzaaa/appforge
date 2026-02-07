/**
 * Bot Scheduler Service
 * Manages autonomous bot execution on schedules
 */

import cron from 'node-cron';
import Bot from '../models/Bot.js';
import BotExecution from '../models/BotExecution.js';
import quantumLLMService from './quantumLLMService.js';
import { logger } from '../config/logger.js';
import { v4 as uuidv4 } from 'uuid';

class BotScheduler {
  constructor() {
    this.scheduledBots = new Map(); // botId -> cron task
    this.isRunning = false;
  }

  /**
   * Start the scheduler
   */
  async start() {
    if (this.isRunning) {
      logger.warn('[BotScheduler] Scheduler already running');
      return;
    }

    logger.info('[BotScheduler] Starting autonomous bot scheduler...');

    try {
      // Load all autonomous bots
      const bots = await Bot.find({
        'autonomous.enabled': true,
        isActive: true,
      });

      logger.info(`[BotScheduler] Found ${bots.length} autonomous bots`);

      for (const bot of bots) {
        await this.scheduleBot(bot);
      }

      // Reset daily execution counts at midnight
      this.scheduleDailyReset();

      this.isRunning = true;
      logger.info(`[BotScheduler] Successfully scheduled ${this.scheduledBots.size} bots`);

    } catch (error) {
      logger.error('[BotScheduler] Failed to start scheduler:', error);
      throw error;
    }
  }

  /**
   * Schedule a single bot
   */
  async scheduleBot(bot) {
    if (!bot.autonomous.schedule) {
      logger.warn(`[BotScheduler] Bot ${bot.name} has no schedule defined`);
      return false;
    }

    // Validate cron expression
    if (!cron.validate(bot.autonomous.schedule)) {
      logger.error(`[BotScheduler] Invalid cron expression for bot ${bot.name}: ${bot.autonomous.schedule}`);
      return false;
    }

    try {
      // Stop existing task if any
      this.unscheduleBot(bot._id.toString());

      // Create new scheduled task
      const task = cron.schedule(bot.autonomous.schedule, async () => {
        await this.executeBotAutonomously(bot._id);
      }, {
        scheduled: true,
        timezone: process.env.TZ || 'UTC',
      });

      this.scheduledBots.set(bot._id.toString(), task);

      logger.info(`[BotScheduler] Scheduled bot "${bot.name}" (${bot._id}) with cron: ${bot.autonomous.schedule}`);
      return true;

    } catch (error) {
      logger.error(`[BotScheduler] Failed to schedule bot ${bot.name}:`, error);
      return false;
    }
  }

  /**
   * Unschedule a bot
   */
  unscheduleBot(botId) {
    const task = this.scheduledBots.get(botId);
    if (task) {
      task.stop();
      this.scheduledBots.delete(botId);
      logger.info(`[BotScheduler] Unscheduled bot ${botId}`);
      return true;
    }
    return false;
  }

  /**
   * Execute bot autonomously
   */
  async executeBotAutonomously(botId) {
    let bot;
    const executionId = uuidv4();

    try {
      // Reload bot to get fresh data
      bot = await Bot.findById(botId);

      if (!bot) {
        logger.error(`[BotScheduler] Bot ${botId} not found`);
        return;
      }

      if (!bot.isActive || !bot.autonomous.enabled) {
        logger.warn(`[BotScheduler] Bot ${bot.name} is no longer active/autonomous`);
        this.unscheduleBot(botId.toString());
        return;
      }

      // Check rate limits
      if (bot.autonomous.executionCount >= bot.autonomous.maxExecutionsPerDay) {
        logger.warn(`[BotScheduler] Bot ${bot.name} exceeded daily execution limit (${bot.autonomous.maxExecutionsPerDay})`);
        return;
      }

      logger.info(`[BotScheduler] 🤖 Executing autonomous bot: "${bot.name}" (${executionId})`);

      // Create execution record
      const execution = new BotExecution({
        botId: bot._id,
        executionId,
        trigger: {
          type: 'schedule',
          source: 'scheduler',
          data: {
            schedule: bot.autonomous.schedule,
            executionCount: bot.autonomous.executionCount + 1,
          },
        },
        input: {
          message: bot.workflow.autonomousTriggerPrompt || 'Execute scheduled task',
        },
        timing: {
          queuedAt: new Date(),
          startedAt: new Date(),
        },
        status: 'running',
      });

      await execution.save();

      // Execute with Quantum LLM
      const llmStartTime = Date.now();
      const result = await quantumLLMService.quantumQuery(
        bot.workflow.autonomousTriggerPrompt || 'Execute scheduled task and provide status update',
        {
          systemPrompt: bot.personality.systemPrompt,
          temperature: bot.personality.temperature,
          maxTokens: bot.personality.maxResponseLength,
          taskType: bot.llm.taskType,
          forceEnsemble: bot.llm.forceEnsemble,
        }
      );

      const llmResponseTime = Date.now() - llmStartTime;

      // Update execution
      execution.status = result.success ? 'completed' : 'failed';
      execution.timing.completedAt = new Date();
      execution.timing.llmResponseTime = llmResponseTime;
      execution.response = {
        text: result.response,
      };
      execution.llm = {
        model: result.model,
        provider: result.provider || 'quantum',
        quantumMetrics: result.quantumMetrics,
        tokenUsage: result.usage || {},
      };

      if (!result.success) {
        execution.error = {
          message: result.error || 'Unknown error',
          code: 'AUTONOMOUS_EXECUTION_FAILED',
        };
      }

      await execution.save();

      // Update bot metrics
      bot.autonomous.executionCount++;
      bot.autonomous.lastExecutionAt = new Date();
      bot.metrics.totalExecutions++;

      if (result.success) {
        bot.metrics.successfulExecutions++;
      } else {
        bot.metrics.failedExecutions++;
      }

      // Update quantum metrics
      if (result.quantumMetrics) {
        const qm = result.quantumMetrics;
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

      logger.info(
        `[BotScheduler] ✅ Autonomous execution completed: "${bot.name}" (${executionId}) ` +
        `- ${llmResponseTime}ms - Coherence: ${result.quantumMetrics?.coherence?.toFixed(3) || 'N/A'}`
      );

    } catch (error) {
      logger.error(`[BotScheduler] ❌ Autonomous execution failed for ${bot?.name || botId}:`, error);

      // Try to save error to execution
      try {
        await BotExecution.updateOne(
          { executionId },
          {
            status: 'failed',
            'timing.completedAt': new Date(),
            error: {
              message: error.message,
              stack: error.stack,
              code: 'SCHEDULER_ERROR',
            },
          }
        );
      } catch (saveError) {
        logger.error('[BotScheduler] Failed to save error state:', saveError);
      }

      // Update bot failure metrics
      if (bot) {
        bot.metrics.failedExecutions++;
        bot.autonomous.lastExecutionAt = new Date();
        await bot.save().catch(err =>
          logger.error('[BotScheduler] Failed to update bot metrics:', err)
        );
      }
    }
  }

  /**
   * Schedule daily reset of execution counts
   */
  scheduleDailyReset() {
    // Reset at midnight every day
    cron.schedule('0 0 * * *', async () => {
      try {
        logger.info('[BotScheduler] Resetting daily execution counts...');

        const result = await Bot.updateMany(
          { 'autonomous.enabled': true },
          { $set: { 'autonomous.executionCount': 0 } }
        );

        logger.info(`[BotScheduler] Reset ${result.modifiedCount} bot execution counts`);
      } catch (error) {
        logger.error('[BotScheduler] Failed to reset daily counts:', error);
      }
    }, {
      timezone: process.env.TZ || 'UTC',
    });

    logger.info('[BotScheduler] Scheduled daily execution count reset at midnight');
  }

  /**
   * Reload bot schedule (after update)
   */
  async reloadBot(botId) {
    const bot = await Bot.findById(botId);

    if (!bot) {
      logger.warn(`[BotScheduler] Cannot reload bot ${botId} - not found`);
      return false;
    }

    if (!bot.autonomous.enabled) {
      this.unscheduleBot(botId.toString());
      return true;
    }

    return await this.scheduleBot(bot);
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      scheduledBots: this.scheduledBots.size,
      bots: Array.from(this.scheduledBots.keys()),
    };
  }

  /**
   * Stop the scheduler
   */
  stop() {
    logger.info('[BotScheduler] Stopping autonomous bot scheduler...');

    for (const [botId, task] of this.scheduledBots.entries()) {
      task.stop();
      logger.debug(`[BotScheduler] Stopped task for bot ${botId}`);
    }

    this.scheduledBots.clear();
    this.isRunning = false;

    logger.info('[BotScheduler] Scheduler stopped');
  }

  /**
   * Get next execution time for a bot
   */
  getNextExecution(botId) {
    const task = this.scheduledBots.get(botId.toString());
    if (!task) return null;

    // Note: node-cron doesn't expose next execution time directly
    // This is a simplified calculation
    return 'Check bot autonomous.schedule for cron expression';
  }
}

// Singleton instance
const botScheduler = new BotScheduler();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('[BotScheduler] SIGTERM received, stopping scheduler...');
  botScheduler.stop();
});

process.on('SIGINT', () => {
  logger.info('[BotScheduler] SIGINT received, stopping scheduler...');
  botScheduler.stop();
});

export default botScheduler;
export { BotScheduler };
