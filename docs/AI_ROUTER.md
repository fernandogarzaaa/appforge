<!-- markdownlint-disable MD013 -->
# AI Model Router Documentation

## Overview

The AI Model Router is an intelligent system that automatically selects the best AI model for each user prompt. It supports **ChatGPT**, **Claude**, **Gemini**, **Grok**, and **Base44** with automatic fallback.

**Version:** 1.0.0  
**Status:** Production Ready  
**Last Updated:** January 28, 2026

---

## 🎯 Features

- ✅ **Intelligent Routing** - Analyzes prompts and selects the best model automatically
- ✅ **Multi-Model Support** - ChatGPT, Claude, Gemini, Grok
- ✅ **Automatic Fallback** - Falls back to Base44 if primary model fails
- ✅ **API Key Management** - Flexible configuration with environment variables
- ✅ **Token Tracking** - Monitors usage across models
- ✅ **Model Statistics** - Analytics on model usage distribution
- ✅ **React Integration** - Hooks for easy component integration

---

## 🤖 Supported Models

| Model | Provider | Best For | API Key | Max Tokens |
|-------|----------|----------|---------|-----------|
| **ChatGPT (GPT-4)** | OpenAI | Code, implementation, debugging | `OPENAI_API_KEY` | 4,096 |
| **Claude (Opus)** | Anthropic | Reasoning, analysis, long-form content | `ANTHROPIC_API_KEY` | 4,096 |
| **Gemini (Pro)** | Google | Vision, multimodal, image analysis | `GEMINI_API_KEY` | 4,096 |
| **Grok (2)** | X.AI | Creative tasks, experimental queries | `GROK_API_KEY` | 4,096 |
| **Base44 LLM** | Base44 | Fallback (always available) | Built-in | 4,096 |

---

## 🧠 Routing Logic

The router analyzes each prompt and selects the optimal model:

### Routing Rules

```
Code Tasks (debug, implement, refactor, error, function, etc.)
  ↓
  ChatGPT (GPT-4)
  Confidence: 95%
  Alternatives: Claude, Gemini, Base44

Complex Reasoning (analyze, explain, compare, evaluate, research, etc.)
  ↓
  Claude (Opus)
  Confidence: 90%
  Alternatives: ChatGPT, Gemini, Base44

Vision/Multimodal (image, visual, diagram, design, photo, etc.)
  ↓
  Gemini (Pro)
  Confidence: 85%
  Alternatives: Claude, ChatGPT, Base44

Creative Tasks (creative, brainstorm, idea, novel, experimental, etc.)
  ↓
  Grok (2)
  Confidence: 80%
  Alternatives: Claude, ChatGPT, Base44

Content Creation (write, generate, compose, article, blog, email, etc.)
  ↓
  Claude (Opus)
  Confidence: 85%
  Alternatives: ChatGPT, Grok, Base44

General Queries (default)
  ↓
  Claude (Opus)
  Confidence: 70%
  Alternatives: ChatGPT, Gemini, Grok, Base44
```

### Confidence Scores

- **95%**: Exact match with high-confidence routing rules
- **90%**: Strong match with clear intent
- **85%**: Clear intent with good match
- **70-80%**: General queries or moderate matches
- **50%**: Fallback to Base44

---

## 🚀 Quick Start

### 1. Setup Environment Variables

Copy and update `.env.local`:

```bash
cp .env.example .env.local
```

Add your API keys:

```env
# OpenAI
OPENAI_API_KEY=sk-proj-xxxx

# Anthropic
ANTHROPIC_API_KEY=sk-ant-xxxx

# Google
GEMINI_API_KEY=AIzaSy-xxxx

# X.AI
GROK_API_KEY=xai-xxxx
```

### 2. Use in Components

```typescript
import { useAIRouter } from '@/hooks/useAIRouter';

function MyComponent() {
  const { query, isLoading, selectedModel, routing } = useAIRouter();

  const handleQuery = async () => {
    const result = await query('Write a function that...', {
      enableAutoRouting: true
    });
    
    console.log('Model used:', result.model);
    console.log('Response:', result.response);
    console.log('Routing info:', routing);
  };

  return (
    <button onClick={handleQuery} disabled={isLoading}>
      Query AI ({selectedModel})
    </button>
  );
}
```

### 3. Manual Model Selection

```typescript
const result = await query('Analyze this data...', {
  model: 'claude', // Force Claude
  enableAutoRouting: false
});
```

---

## 📚 API Reference

### useAIRouter Hook

Main hook for AI querying with automatic routing.

```typescript
const {
  query,           // (prompt, config) => Promise<AIRouterResponse>
  route,           // (prompt) => Promise<AIRouterResponse>
  analyze,         // (prompt) => Promise<AIRouterResponse>
  isLoading,       // boolean
  error,           // Error | null
  selectedModel,   // string
  routing,         // RoutingInfo | null
  reset            // () => void
} = useAIRouter();
```

**Methods:**

- **query(prompt, config?)** - Execute query with routing
- **route(prompt)** - Get routing recommendation only
- **analyze(prompt)** - Analyze prompt without executing
- **reset()** - Clear state and results

**Example:**

```typescript
// Auto-route and execute
const response = await query('Write a React component that displays user data');

// Manual model selection
const response = await query('Analyze quarterly sales data', {
  model: 'claude',
  enableAutoRouting: false
});

// Just get routing recommendation
const routing = await route('Debug this JavaScript error');
console.log(routing.selectedModel); // 'chatgpt'
console.log(routing.confidence);     // 0.95
```

### useAIRouting Hook

Analyze prompts without executing queries.

```typescript
const {
  analyzePrompt,  // (prompt) => Promise<RoutingInfo>
  routing,        // RoutingInfo | null
  isLoading,      // boolean
  error           // Error | null
} = useAIRouting();
```

### useAIModelStats Hook

Track AI model usage and statistics.

```typescript
const {
  stats,                  // Model usage counts
  recordUsage,           // (model, tokens) => void
  resetStats,            // () => void
  getModelDistribution   // () => percentages
} = useAIModelStats();

// Usage
recordUsage('claude', 250);
console.log(getModelDistribution());
// { chatgpt: '25%', claude: '50%', gemini: '15%', grok: '10%', base44: '0%' }
```

---

## 🔧 Configuration

### Router Configuration Options

```typescript
interface AIRouterConfig {
  model?: string;                    // Override model selection
  enableAutoRouting?: boolean;       // Default: true
  fallbackToBase44?: boolean;       // Default: true
  retryOnFailure?: boolean;         // Default: true
}
```

### Environment Variables

```env
# Enable/disable the router
AI_ROUTER_ENABLED=true

# Auto-route to best model
AI_ROUTER_AUTO_ROUTE=true

# Fall back to Base44 if primary fails
AI_ROUTER_FALLBACK_TO_BASE44=true

# Retry on failure
AI_ROUTER_RETRY_ON_FAILURE=true

# Individual model keys
OPENAI_API_KEY=sk-proj-xxxx
ANTHROPIC_API_KEY=sk-ant-xxxx
GEMINI_API_KEY=AIzaSy-xxxx
GROK_API_KEY=xai-xxxx
```

---

## 📋 Response Format

All API calls return a structured response:

```typescript
interface AIRouterResponse {
  success: boolean;                  // Operation succeeded
  model: string;                     // Model used
  response: string;                  // AI response text
  routing?: {                        // Routing info (if enabled)
    selectedModel: string;
    confidence: number;              // 0-1
    reason: string;
    alternatives: string[];
  };
  usage?: {                          // Token usage
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;                    // Error message if failed
}
```

**Example Response:**

```json
{
  "success": true,
  "model": "ChatGPT (GPT-4)",
  "response": "Here's the function you requested...",
  "routing": {
    "selectedModel": "chatgpt",
    "confidence": 0.95,
    "reason": "Code generation/analysis detected - ChatGPT excels at this",
    "alternatives": ["claude", "gemini", "base44"]
  },
  "usage": {
    "promptTokens": 45,
    "completionTokens": 120,
    "totalTokens": 165
  }
}
```

---

## 🎓 Examples

### Example 1: Code Generation

```typescript
const { query } = useAIRouter();

const result = await query('Create a React component for a user profile with edit capability');
// Router automatically selects: ChatGPT
// Confidence: 95%
```

### Example 2: Data Analysis

```typescript
const result = await query('Analyze this quarterly sales data and identify trends...');
// Router automatically selects: Claude
// Confidence: 90%
```

### Example 3: Image Analysis

```typescript
const result = await query('What objects are in this image and their positions?');
// Router automatically selects: Gemini
// Confidence: 85%
```

### Example 4: Creative Brainstorming

```typescript
const result = await query('Brainstorm innovative marketing campaign ideas for a SaaS product');
// Router automatically selects: Grok
// Confidence: 80%
```

### Example 5: Force Specific Model

```typescript
const result = await query('Analyze this code', {
  model: 'claude',
  enableAutoRouting: false
});
// Uses Claude regardless of routing rules
```

---

## ⚙️ Advanced Usage

### Custom Routing Decision

```typescript
import { routeToModel, analyzePrompt, getAvailableModels } from '@/lib/aiRouter';

const prompt = 'Write a function that...';
const analysis = analyzePrompt(prompt);
const decision = routeToModel(prompt, {
  enableAutoRouting: true,
  fallbackToBase44: true
});

console.log('Prompt type:', analysis.type);
console.log('Selected model:', decision.selectedModel);
console.log('Confidence:', decision.confidence);
console.log('Alternatives:', decision.alternativeModels);
```

### Model Availability Check

```typescript
import { getAvailableModels } from '@/lib/aiRouter';

const available = getAvailableModels();
// Returns: ['chatgpt', 'claude', 'gemini', 'grok', 'base44']

if (!available.includes('claude')) {
  console.warn('Claude is not configured. Set ANTHROPIC_API_KEY');
}
```

### Router Statistics

```typescript
import { getRouterStats } from '@/lib/aiRouter';

const stats = getRouterStats();
console.log(stats.supportedModels);      // All models
console.log(stats.availableModels);      // Configured models
console.log(stats.routingRules);         // Routing logic
```

---

## 🐛 Troubleshooting

### Issue: "All models failed"

**Cause:** All API keys are missing or invalid  
**Solution:** Add at least one valid API key to `.env.local`:

```env
OPENAI_API_KEY=sk-proj-xxxx
# OR
ANTHROPIC_API_KEY=sk-ant-xxxx
# OR
GEMINI_API_KEY=AIzaSy-xxxx
# OR
GROK_API_KEY=xai-xxxx
```

### Issue: Wrong Model Selected

**Cause:** Prompt keywords don't match routing rules  
**Solution:** Force specific model:

```typescript
const result = await query(prompt, {
  model: 'claude',
  enableAutoRouting: false
});
```

### Issue: API Rate Limiting

**Cause:** Too many requests to a single model  
**Solution:** Distribute queries across models:

```typescript
// Let router balance
const result = await query(prompt, {
  enableAutoRouting: true
});
```

### Issue: Base44 Fallback Issues

**Cause:** Base44 is also overloaded  
**Solution:** Check Base44 status and retry:

```typescript
const result = await query(prompt, {
  fallbackToBase44: true,
  retryOnFailure: true
});
```

---

## 📊 Monitoring

### Track Model Usage

```typescript
import { useAIModelStats } from '@/hooks/useAIRouter';

function AIStatsPanel() {
  const { stats, recordUsage, getModelDistribution } = useAIModelStats();

  // After each query
  recordUsage(selectedModel, tokens);

  return (
    <div>
      <p>Total Queries: {stats.totalQueries}</p>
      <p>Total Tokens: {stats.totalTokens}</p>
      
      Distribution:
      <pre>{JSON.stringify(getModelDistribution(), null, 2)}</pre>
    </div>
  );
}
```

### Log Routing Decisions

```typescript
const result = await query(prompt);

if (result.routing) {
  console.log(`
    Model: ${result.routing.selectedModel}
    Confidence: ${(result.routing.confidence * 100).toFixed(0)}%
    Reason: ${result.routing.reason}
    Alternatives: ${result.routing.alternatives.join(', ')}
  `);
}
```

---

## 🔒 Security Considerations

1. **API Keys**
   - Never commit `.env.local` to git
   - Use `.gitignore` to exclude environment files
   - Rotate keys regularly

2. **Prompt Injection**
   - Validate user input before querying
   - Don't include sensitive data in prompts
   - Sanitize responses before displaying

3. **Rate Limiting**
   - Implement request throttling on client
   - Monitor token usage per user
   - Set spending limits in provider dashboards

4. **Data Privacy**
   - Check provider privacy policies
   - Anonymize user data in prompts
   - Don't store sensitive responses locally

---

## 📈 Performance Tips

1. **Cache Responses**
   - Store frequently-asked questions
   - Reuse responses for similar queries
   - Use React Query for caching

2. **Batch Requests**
   - Group related queries
   - Process in parallel when possible
   - Implement request deduplication

3. **Model Selection**
   - Use simpler models for simple tasks
   - Reserve expensive models for complex analysis
   - Monitor costs per model

4. **Fallback Strategy**
   - Keep Base44 as ultimate fallback
   - Test all API keys before deployment
   - Implement graceful degradation

---

## 🚀 Deployment

### Production Checklist

- [ ] All required API keys configured
- [ ] Rate limiting enabled
- [ ] Error handling implemented
- [ ] Monitoring/logging setup
- [ ] Fallback strategy tested
- [ ] Load testing completed
- [ ] Cost estimates reviewed
- [ ] Security audit passed

### Environment Setup

```bash
# Development
cp .env.example .env.local
# Add test API keys

# Production
# Use secure secret management (AWS Secrets Manager, etc.)
# Never hardcode keys in code
```

---

## 🤝 Integration Examples

### Example: AIAssistant Component

```typescript
import { useAIRouter } from '@/hooks/useAIRouter';

export function AIAssistant() {
  const { query, isLoading, selectedModel } = useAIRouter();
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');

  const handleSend = async () => {
    try {
      const result = await query(input, { enableAutoRouting: true });
      setResponse(result.response);
    } catch (error) {
      console.error('Query failed:', error);
    }
  };

  return (
    <div>
      <textarea value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={handleSend} disabled={isLoading}>
        Send ({selectedModel})
      </button>
      {response && <div>{response}</div>}
    </div>
  );
}
```

---

## 📝 License

This feature is part of AppForge and follows the same license terms.

---

## 💬 Support

For issues, questions, or feature requests:
- Check [Troubleshooting](#-troubleshooting) section
- Review examples in documentation
- Open an issue on GitHub
- Contact support team

---

**Last Updated:** January 28, 2026  
**Version:** 1.0.0  
**Maintained By:** AppForge Development Team
