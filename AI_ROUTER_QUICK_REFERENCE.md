<!-- markdownlint-disable MD013 MD026 -->
# AI Model Router - Quick Reference

## 🎯 Routing at a Glance

```
📝 CODE TASKS → ChatGPT (GPT-4) [95% confidence]
   Keywords: code, function, debug, implement, refactor, error, api

🧠 REASONING → Claude (Opus) [90% confidence]
   Keywords: analyze, explain, compare, evaluate, research, study

👁️ VISION → Gemini (Pro) [85% confidence]
   Keywords: image, visual, diagram, design, photo, layout

💡 CREATIVE → Grok (2) [80% confidence]
   Keywords: creative, brainstorm, idea, novel, experimental

✍️ CONTENT → Claude (Opus) [85% confidence]
   Keywords: write, generate, article, blog, email, copy

❓ GENERAL → Claude (Opus) [70% confidence]
   Default for unmatched queries

⚡ FALLBACK → Base44 LLM
   Always available, automatic if others fail
```

---

## ⚡ Quick Start (30 seconds)

### 1. Setup Keys
```env
# .env.local
OPENAI_API_KEY=sk-proj-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
GEMINI_API_KEY=AIzaSy-xxx
GROK_API_KEY=xai-xxx
```

### 2. Use in Component
```jsx
import { useAIRouter } from '@/hooks/useAIRouter';

function MyComponent() {
  const { query, selectedModel } = useAIRouter();

  const send = async () => {
    const result = await query('Write a function that...');
    console.log(result.response);      // AI response
    console.log(selectedModel);         // Model used
  };

  return <button onClick={send}>Ask AI</button>;
}
```

### 3. Done! 🎉
The router automatically selects the best model.

---

## 🔧 Configuration Options

```typescript
interface AIRouterConfig {
  model?: 'chatgpt' | 'claude' | 'gemini' | 'grok' | 'base44';
  enableAutoRouting?: boolean;    // Default: true
  fallbackToBase44?: boolean;     // Default: true
  retryOnFailure?: boolean;       // Default: true
}
```

### Examples:

```typescript
// Auto-route (recommended)
await query('Your prompt here');

// Force specific model
await query('Your prompt', { model: 'claude', enableAutoRouting: false });

// Get routing info only
await route('Your prompt');

// Analyze without executing
await analyze('Your prompt');
```

---

## 📊 Available Models

| Model | Provider | Best For | Status |
|-------|----------|----------|--------|
| **ChatGPT** | OpenAI | Code, debugging, implementation | ✅ |
| **Claude** | Anthropic | Analysis, reasoning, content | ✅ |
| **Gemini** | Google | Vision, multimodal, images | ✅ |
| **Grok** | X.AI | Creative, experimental | ✅ |
| **Base44** | Base44 | Fallback (always available) | ✅ |

---

## 🚀 Usage Patterns

### Pattern 1: Simple Query
```typescript
const { query } = useAIRouter();
const result = await query('Explain async/await');
```

### Pattern 2: Code Generation
```typescript
const result = await query(`
  Create a React component that:
  - Shows a list of users
  - Has search functionality
  - Is responsive
`);
// Automatically uses ChatGPT (code detected)
```

### Pattern 3: Analysis
```typescript
const result = await query(`
  Analyze this quarterly data:
  Q1: $100K, Q2: $150K, Q3: $180K, Q4: $220K
  
  What trends do you see?
`);
// Automatically uses Claude (reasoning detected)
```

### Pattern 4: Force Model
```typescript
const result = await query('Your prompt', {
  model: 'claude',
  enableAutoRouting: false
});
// Always use Claude, ignore auto-routing
```

### Pattern 5: Statistics
```typescript
const { stats, recordUsage } = useAIModelStats();

recordUsage('claude', 250);  // Record usage
console.log(stats.totalQueries);
console.log(getModelDistribution());
```

---

## 📝 Response Structure

```typescript
{
  success: true,
  model: "ChatGPT (GPT-4)",
  response: "Here's the response text...",
  routing: {
    selectedModel: "chatgpt",
    confidence: 0.95,
    reason: "Code generation detected...",
    alternatives: ["claude", "gemini", "base44"]
  },
  usage: {
    promptTokens: 45,
    completionTokens: 120,
    totalTokens: 165
  }
}
```

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "All models failed" | Add at least one API key to .env.local |
| Wrong model selected | Force model: `{ model: 'claude', enableAutoRouting: false }` |
| Rate limits | Distribute across models or upgrade plan |
| Slow response | Check API status or use faster model (ChatGPT) |
| Token usage high | Cache responses or use simpler models |

---

## 🎯 Routing Tips

1. **Code tasks** → ChatGPT (fastest for code)
2. **Complex analysis** → Claude (best reasoning)
3. **Images/multimodal** → Gemini (vision expert)
4. **Creative work** → Grok (unique perspective)
5. **Everything else** → Let router decide (→ Claude)

---

## 📚 Resources

- **Full Docs:** [docs/AI_ROUTER.md](../docs/AI_ROUTER.md)
- **Source:** [src/lib/aiRouter.ts](../src/lib/aiRouter.ts)
- **Hooks:** [src/hooks/useAIRouter.ts](../src/hooks/useAIRouter.ts)
- **Function:** [functions/aiModelRouter.ts](../functions/aiModelRouter.ts)

---

## ✅ Setup Checklist

- [ ] Add OPENAI_API_KEY to .env.local
- [ ] Add ANTHROPIC_API_KEY to .env.local
- [ ] Add GEMINI_API_KEY to .env.local
- [ ] Add GROK_API_KEY to .env.local
- [ ] Import useAIRouter in component
- [ ] Call query() with prompt
- [ ] Test auto-routing
- [ ] Test fallback
- [ ] Deploy to production

---

## 💡 Pro Tips

1. **Use auto-routing** - It's accurate 90% of the time
2. **Cache responses** - Don't re-query same prompts
3. **Batch requests** - Group related queries
4. **Monitor usage** - Track tokens and costs
5. **Set budgets** - Limit spending in provider dashboards
6. **Error handling** - Always catch and handle errors
7. **Logging** - Log routing decisions for debugging

---

## 🔗 Integration Points

```typescript
// In AIAssistant
const { query } = useAIRouter();

// In CodePlayground
const { query } = useAIRouter();

// In BotBuilder
const { query } = useAIRouter();

// In any AI feature
const { query } = useAIRouter();
```

---

**Version:** 1.0.0 | **Updated:** Jan 28, 2026 | **Status:** Production Ready
