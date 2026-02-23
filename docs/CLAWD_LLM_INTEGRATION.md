# OpenRouter + Clawd LLM Integration Plan
## Wiring Quantum-Consensus LLM to AppForge

### Architecture

```
AppForge Frontend
    ↓
AppForge Backend (D:\appforge-main)
    ↓
Clawd Hybrid RTX LLM Service
    ├─ Local: RTX 2060 (embeddings + cache)
    └─ Cloud: OpenRouter Ensemble
        ├─ Mistral 7B (free)
        ├─ Gemma 7B (free)
        ├─ Llama 2 13B (free)
        ├─ OpenChat 7B (free)
        └─ Nous Hermes 13B (free)
        ↓
    Quantum Consensus (RTX 2060)
        ├─ Embed all 5 responses
        ├─ Calculate coherence
        └─ Return 100% consensus
```

### Integration Points

1. **Backend API** (`functions/llmService.ts`)
   - Create LLM service wrapper
   - Call Clawd Hybrid RTX endpoint
   - Handle streaming responses

2. **Frontend Context** (`src/contexts/LLMContext.tsx`)
   - Replace existing LLM calls
   - Add Clawd provider option
   - Cache management

3. **Configuration** (`.env`)
   - CLAWD_LLM_URL
   - OPENROUTER_API_KEY (secured)

### Files to Create/Modify

**New Files:**
- `src/services/clawdLLM.ts` - Frontend client
- `functions/clawdLLM.ts` - Backend service
- `src/contexts/ClawdContext.tsx` - React context

**Modified Files:**
- `src/components/admin/QuantumLLMSettings.jsx` - Add Clawd toggle
- `src/api/appforgeClient.ts` - Add LLM endpoint

### Deployment Options

**Option A: Local RTX 2060 + Hugging Face Space**
- Run Clawd Hybrid locally on your RTX 2060
- AppForge backend calls local endpoint
- Zero cloud costs for embeddings

**Option B: Hugging Face Space Only**
- Deploy Clawd Hybrid to HF Space with GPU
- AppForge calls HF Space API
- Simpler, but costs for GPU hours

**Recommended: Option A (Hybrid)**
```
Your PC (RTX 2060)
├─ Clawd Hybrid LLM (local)
│  ├─ Embeddings (local)
│  ├─ Cache (local SSD)
│  └─ Consensus (local)
│
└─ AppForge (localhost:3000)
   └─ Calls local Clawd endpoint
```

### API Contract

```typescript
// Request
POST http://localhost:7860/ensemble/consensus
{
  "prompt": "Write a React component",
  "context": "AppForge project",
  "max_tokens": 512
}

// Response
{
  "response": "import React...",
  "coherence": 0.97,
  "models_consulted": 5,
  "cache_hit": false,
  "cost_usd": 0
}
```

### Next Steps

1. ⏳ Wait for TypeScript fix swarms to complete
2. 🔧 Create LLM service integration files
3. 🚀 Deploy Clawd Hybrid locally
4. 🔌 Wire to AppForge backend
5. 🧪 Test end-to-end
