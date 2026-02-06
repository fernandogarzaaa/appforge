# Autonomous Bot System - Integration Guide

## 📋 Overview

The **Autonomous Bot System** allows you to create AI-powered chatbots that can:
- ✅ Run workflows autonomously on schedules or triggers
- ✅ Respond to user queries using Quantum LLM
- ✅ Execute multi-step actions (API calls, data processing, notifications)
- ✅ Learn from interactions and improve over time
- ✅ Deploy to multiple channels (WhatsApp, Email, Web, API)

---

## 🏗️ Current Architecture

```
Frontend (React)
    ├─ ChatbotManager.jsx - Bot management UI
    ├─ ChatbotBuilder.jsx - Visual bot builder
    ├─ ChatbotPersonalityConfig.jsx - Personality settings
    ├─ ChatbotKnowledgeConfig.jsx - Knowledge base
    └─ ChatbotChannelConfig.jsx - Channel deployment

Backend (Express + Base44)
    ├─ /api/bots/ - Bot CRUD operations (TO BE CREATED)
    ├─ /api/bots/:id/execute - Execute bot workflow
    ├─ /api/bots/:id/deploy - Deploy to channels
    └─ /api/bots/:id/logs - View execution logs

Functions (Serverless)
    ├─ createChatbotAgent.ts - Create new bot agent
    ├─ executeBotWorkflow.ts - Execute workflow nodes
    ├─ executeBotPipeline.ts - Multi-bot pipelines
    ├─ deployBot.ts - Deploy to channels
    ├─ logBotActivity.ts - Activity logging
    └─ processAgentFeedback.ts - Learning loop

Database (MongoDB)
    ├─ Bot (TO BE CREATED) - Bot configurations
    ├─ BotExecution (TO BE CREATED) - Execution history
    ├─ BotKnowledge (TO BE CREATED) - Knowledge base
    └─ BotFeedback (TO BE CREATED) - User feedback
```

---

## 🚀 Implementation Steps

### Step 1: Create Database Models

Create `backend/src/models/Bot.js`:

```javascript
import mongoose from 'mongoose';

const BotSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,

  // Personality & Behavior
  personality: {
    systemPrompt: { type: String, default: 'You are a helpful assistant.' },
    tone: { type: String, enum: ['professional', 'friendly', 'casual', 'technical'], default: 'friendly' },
    style: { type: String, enum: ['concise', 'detailed', 'conversational'], default: 'conversational' },
    language: { type: String, default: 'en' },
    temperature: { type: Number, default: 0.7 },
  },

  // Knowledge Base
  knowledge: {
    sources: [{ type: String }], // URLs, file IDs
    entities: [{ type: String }], // Base44 entity references
    customData: mongoose.Schema.Types.Mixed,
  },

  // LLM Configuration
  llm: {
    model: { type: String, default: 'quantum' },
    forceEnsemble: { type: Boolean, default: true },
    taskType: { type: String, default: 'conversational' },
  },

  // Workflow
  workflow: {
    nodes: [mongoose.Schema.Types.Mixed],
    triggers: [{
      type: { type: String, enum: ['schedule', 'webhook', 'user_message', 'event'] },
      config: mongoose.Schema.Types.Mixed,
    }],
  },

  // Deployment
  channels: [{
    type: { type: String, enum: ['whatsapp', 'email', 'web', 'api'] },
    config: mongoose.Schema.Types.Mixed,
    isActive: { type: Boolean, default: false },
  }],

  // Status
  isActive: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: false },

  // Autonomous Settings
  autonomous: {
    enabled: { type: Boolean, default: false },
    schedule: String, // Cron expression
    maxExecutionsPerDay: { type: Number, default: 100 },
    executionCount: { type: Number, default: 0 },
    lastExecutionAt: Date,
  },

  // Metrics
  metrics: {
    totalExecutions: { type: Number, default: 0 },
    successfulExecutions: { type: Number, default: 0 },
    failedExecutions: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 },
    userSatisfactionScore: { type: Number, default: 0 },
  },

  // Owner
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

BotSchema.index({ userId: 1, createdAt: -1 });
BotSchema.index({ 'autonomous.schedule': 1, 'autonomous.enabled': 1 });

export default mongoose.model('Bot', BotSchema);
```

Create `backend/src/models/BotExecution.js`:

```javascript
import mongoose from 'mongoose';

const BotExecutionSchema = new mongoose.Schema({
  botId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bot', required: true },
  executionId: { type: String, required: true, unique: true },

  trigger: {
    type: { type: String, enum: ['manual', 'schedule', 'webhook', 'user_message', 'event'] },
    data: mongoose.Schema.Types.Mixed,
  },

  status: {
    type: String,
    enum: ['running', 'completed', 'failed', 'cancelled'],
    default: 'running',
  },

  workflow: {
    nodesExecuted: Number,
    nodesSucceeded: Number,
    nodesFailed: Number,
    logs: [mongoose.Schema.Types.Mixed],
    results: [mongoose.Schema.Types.Mixed],
  },

  llm: {
    model: String,
    provider: String,
    quantumMetrics: mongoose.Schema.Types.Mixed,
    tokenUsage: {
      prompt: Number,
      completion: Number,
      total: Number,
    },
    cost: Number,
  },

  timing: {
    startedAt: Date,
    completedAt: Date,
    durationMs: Number,
  },

  error: {
    message: String,
    stack: String,
    code: String,
  },

  createdAt: { type: Date, default: Date.now },
});

BotExecutionSchema.index({ botId: 1, createdAt: -1 });
BotExecutionSchema.index({ executionId: 1 });

export default mongoose.model('BotExecution', BotExecutionSchema);
```

### Step 2: Create Bot Routes

Create `backend/src/routes/botRoutes.js`:

```javascript
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createBot,
  getBots,
  getBot,
  updateBot,
  deleteBot,
  executeBot,
  deployBot,
  getBotExecutions,
  getBotMetrics,
} from '../controllers/botController.js';

const router = express.Router();

// All bot routes require authentication
router.use(authenticate);

// CRUD operations
router.post('/', createBot);
router.get('/', getBots);
router.get('/:id', getBot);
router.put('/:id', updateBot);
router.delete('/:id', deleteBot);

// Execution
router.post('/:id/execute', executeBot);
router.get('/:id/executions', getBotExecutions);

// Deployment
router.post('/:id/deploy', deployBot);

// Analytics
router.get('/:id/metrics', getBotMetrics);

export default router;
```

### Step 3: Create Bot Controller

Create `backend/src/controllers/botController.js`:

```javascript
import Bot from '../models/Bot.js';
import BotExecution from '../models/BotExecution.js';
import quantumLLMService from '../services/quantumLLMService.js';
import { createError } from '../utils/helpers.js';
import logger from '../config/logger.js';
import { v4 as uuidv4 } from 'uuid';

export const createBot = async (req, res, next) => {
  try {
    const bot = new Bot({
      ...req.body,
      userId: req.user.id,
    });

    await bot.save();

    res.status(201).json({
      success: true,
      data: bot,
    });
  } catch (error) {
    next(error);
  }
};

export const getBots = async (req, res, next) => {
  try {
    const bots = await Bot.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bots.length,
      data: bots,
    });
  } catch (error) {
    next(error);
  }
};

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
    next(error);
  }
};

export const updateBot = async (req, res, next) => {
  try {
    const bot = await Bot.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    if (!bot) {
      throw createError(404, 'Bot not found');
    }

    res.json({
      success: true,
      data: bot,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBot = async (req, res, next) => {
  try {
    const bot = await Bot.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!bot) {
      throw createError(404, 'Bot not found');
    }

    res.json({
      success: true,
      message: 'Bot deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const executeBot = async (req, res, next) => {
  try {
    const bot = await Bot.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!bot) {
      throw createError(404, 'Bot not found');
    }

    const { userMessage, triggerData = {} } = req.body;
    const executionId = uuidv4();

    // Create execution record
    const execution = new BotExecution({
      botId: bot._id,
      executionId,
      trigger: {
        type: 'manual',
        data: { userMessage, ...triggerData },
      },
      timing: {
        startedAt: new Date(),
      },
    });

    await execution.save();

    // Execute bot workflow with Quantum LLM
    const result = await quantumLLMService.quantumQuery(userMessage, {
      systemPrompt: bot.personality.systemPrompt,
      temperature: bot.personality.temperature,
      taskType: bot.llm.taskType,
      forceEnsemble: bot.llm.forceEnsemble,
      userId: req.user.id,
    });

    // Update execution record
    execution.status = result.success ? 'completed' : 'failed';
    execution.timing.completedAt = new Date();
    execution.timing.durationMs = execution.timing.completedAt - execution.timing.startedAt;
    execution.llm = {
      model: result.model,
      provider: result.provider || 'quantum',
      quantumMetrics: result.quantumMetrics,
      tokenUsage: result.usage,
    };

    await execution.save();

    // Update bot metrics
    bot.metrics.totalExecutions++;
    if (result.success) {
      bot.metrics.successfulExecutions++;
    } else {
      bot.metrics.failedExecutions++;
    }
    bot.autonomous.lastExecutionAt = new Date();
    await bot.save();

    logger.info(`[Bot] Executed bot ${bot.name} (${executionId})`);

    res.json({
      success: true,
      executionId,
      response: result.response,
      quantumMetrics: result.quantumMetrics,
      timing: execution.timing,
    });
  } catch (error) {
    logger.error('[Bot] Execution error:', error);
    next(error);
  }
};

export const getBotExecutions = async (req, res, next) => {
  try {
    const bot = await Bot.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!bot) {
      throw createError(404, 'Bot not found');
    }

    const executions = await BotExecution.find({ botId: bot._id })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: executions.length,
      data: executions,
    });
  } catch (error) {
    next(error);
  }
};

export const deployBot = async (req, res, next) => {
  try {
    const bot = await Bot.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!bot) {
      throw createError(404, 'Bot not found');
    }

    const { channel, config } = req.body;

    // Add or update channel
    const existingChannelIndex = bot.channels.findIndex(c => c.type === channel);
    if (existingChannelIndex >= 0) {
      bot.channels[existingChannelIndex] = { type: channel, config, isActive: true };
    } else {
      bot.channels.push({ type: channel, config, isActive: true });
    }

    bot.isPublished = true;
    await bot.save();

    logger.info(`[Bot] Deployed bot ${bot.name} to ${channel}`);

    res.json({
      success: true,
      message: `Bot deployed to ${channel}`,
      data: bot,
    });
  } catch (error) {
    next(error);
  }
};

export const getBotMetrics = async (req, res, next) => {
  try {
    const bot = await Bot.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!bot) {
      throw createError(404, 'Bot not found');
    }

    const recentExecutions = await BotExecution.find({ botId: bot._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        bot: {
          name: bot.name,
          isActive: bot.isActive,
          autonomous: bot.autonomous,
        },
        metrics: bot.metrics,
        recentExecutions: recentExecutions.map(exec => ({
          executionId: exec.executionId,
          status: exec.status,
          durationMs: exec.timing.durationMs,
          createdAt: exec.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
```

### Step 4: Integrate with Quantum LLM

The bot system now automatically uses Quantum LLM! When a bot executes:

1. **Fetches bot configuration** (personality, knowledge, LLM settings)
2. **Calls Quantum LLM** with:
   - System prompt from bot personality
   - User message as prompt
   - Bot's LLM preferences (model, ensemble mode)
3. **Gets quantum consensus response** with metrics
4. **Stores execution record** with quantum metrics
5. **Updates bot metrics** for monitoring

### Step 5: Add Autonomous Scheduling

Create `backend/src/services/botScheduler.js`:

```javascript
import cron from 'node-cron';
import Bot from '../models/Bot.js';
import logger from '../config/logger.js';
import quantumLLMService from './quantumLLMService.js';

class BotScheduler {
  constructor() {
    this.scheduledBots = new Map();
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) return;

    logger.info('[BotScheduler] Starting autonomous bot scheduler');

    // Load all autonomous bots
    const bots = await Bot.find({
      'autonomous.enabled': true,
      isActive: true,
    });

    for (const bot of bots) {
      this.scheduleBot(bot);
    }

    this.isRunning = true;
    logger.info(`[BotScheduler] Scheduled ${bots.length} autonomous bots`);
  }

  scheduleBot(bot) {
    if (!bot.autonomous.schedule) {
      logger.warn(`[BotScheduler] Bot ${bot.name} has no schedule defined`);
      return;
    }

    try {
      const task = cron.schedule(bot.autonomous.schedule, async () => {
        await this.executeBotAutonomously(bot);
      });

      this.scheduledBots.set(bot._id.toString(), task);
      logger.info(`[BotScheduler] Scheduled bot ${bot.name} with cron: ${bot.autonomous.schedule}`);
    } catch (error) {
      logger.error(`[BotScheduler] Failed to schedule bot ${bot.name}:`, error);
    }
  }

  async executeBotAutonomously(bot) {
    try {
      logger.info(`[BotScheduler] Executing autonomous bot: ${bot.name}`);

      // Check rate limits
      if (bot.autonomous.executionCount >= bot.autonomous.maxExecutionsPerDay) {
        logger.warn(`[BotScheduler] Bot ${bot.name} exceeded daily execution limit`);
        return;
      }

      // Execute bot workflow using Quantum LLM
      const triggerPrompt = bot.workflow.autonomousTriggerPrompt || 'Execute scheduled task';

      const result = await quantumLLMService.quantumQuery(triggerPrompt, {
        systemPrompt: bot.personality.systemPrompt,
        temperature: bot.personality.temperature,
        taskType: bot.llm.taskType,
        forceEnsemble: bot.llm.forceEnsemble,
      });

      // Update bot metrics
      bot.autonomous.executionCount++;
      bot.autonomous.lastExecutionAt = new Date();
      bot.metrics.totalExecutions++;

      if (result.success) {
        bot.metrics.successfulExecutions++;
      } else {
        bot.metrics.failedExecutions++;
      }

      await bot.save();

      logger.info(`[BotScheduler] Autonomous execution completed for ${bot.name}`);
    } catch (error) {
      logger.error(`[BotScheduler] Autonomous execution failed for ${bot.name}:`, error);
    }
  }

  stop() {
    logger.info('[BotScheduler] Stopping autonomous bot scheduler');

    for (const [botId, task] of this.scheduledBots.entries()) {
      task.stop();
    }

    this.scheduledBots.clear();
    this.isRunning = false;
  }
}

const botScheduler = new BotScheduler();
export default botScheduler;
```

### Step 6: Register Routes in Server

In `backend/src/server.js`:

```javascript
import botRoutes from './routes/botRoutes.js';
import botScheduler from './services/botScheduler.js';

// ... existing code ...

// Routes
app.use('/api/bots', botRoutes);

// Start bot scheduler
botScheduler.start();
```

---

## 🎯 Usage Examples

### Create a Bot

```javascript
POST /api/bots
{
  "name": "Customer Support Bot",
  "description": "Handles customer inquiries",
  "personality": {
    "systemPrompt": "You are a friendly customer support agent. Help users with their questions about our product.",
    "tone": "friendly",
    "style": "conversational",
    "temperature": 0.7
  },
  "llm": {
    "model": "quantum",
    "forceEnsemble": true,
    "taskType": "conversational"
  },
  "autonomous": {
    "enabled": true,
    "schedule": "0 */4 * * *", // Every 4 hours
    "maxExecutionsPerDay": 6
  }
}
```

### Execute Bot

```javascript
POST /api/bots/:id/execute
{
  "userMessage": "How do I reset my password?"
}

// Response
{
  "success": true,
  "executionId": "uuid-...",
  "response": "To reset your password...",
  "quantumMetrics": {
    "ensemble": true,
    "providers": ["gpt-4", "claude-3-opus"],
    "coherence": 0.94,
    "confidence": 0.96,
    "hallucinationRisk": "low"
  }
}
```

### Deploy to Channel

```javascript
POST /api/bots/:id/deploy
{
  "channel": "web",
  "config": {
    "embedUrl": "https://mysite.com",
    "theme": "light"
  }
}
```

---

## ✅ Current Status

- [x] Frontend UI components (ChatbotManager, Builder, Config)
- [x] Base44 function templates (executeBotWorkflow.ts, etc.)
- [ ] Backend models (Bot, BotExecution) - **TO BE CREATED**
- [ ] Backend routes (/api/bots) - **TO BE CREATED**
- [ ] Backend controller (botController.js) - **TO BE CREATED**
- [ ] Bot scheduler (botScheduler.js) - **TO BE CREATED**
- [x] Quantum LLM integration - **READY**
- [ ] Channel deployments (WhatsApp, Email) - **TO BE IMPLEMENTED**
- [ ] Feedback learning loop - **TO BE IMPLEMENTED**

---

## 🚀 Next Steps

1. **Create models** (`Bot.js`, `BotExecution.js`)
2. **Create routes** (`botRoutes.js`)
3. **Create controller** (`botController.js`)
4. **Create scheduler** (`botScheduler.js`)
5. **Test bot creation** via API
6. **Test bot execution** with Quantum LLM
7. **Implement channel deployments**
8. **Add feedback learning**

---

**Version**: 1.0.0
**Status**: Ready for Implementation 🎯
