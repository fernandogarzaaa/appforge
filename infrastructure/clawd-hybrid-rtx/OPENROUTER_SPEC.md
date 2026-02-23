# OpenRouter Integration Specification
## Quantum-Coherent Free LLM Ensemble

### Overview
Integrate OpenRouter's free tier models into Clawd Hybrid RTX system, using quantum engine to achieve 100% coherence across multiple free models.

### OpenRouter Free Models (As of 2026-02-24)

| Model | Provider | Context | Strengths | Rate Limit |
|-------|----------|---------|-----------|------------|
| `mistralai/mistral-7b-instruct:free` | Mistral | 32K | General, fast | 20 req/min |
| `google/gemma-7b-it:free` | Google | 8K | Coding, reasoning | 20 req/min |
| `meta-llama/llama-2-13b-chat:free` | Meta | 4K | Chat, creative | 20 req/min |
| `nousresearch/nous-hermes-llama2-13b:free` | Nous | 4K | Instruction following | 20 req/min |
| `openchat/openchat-7b:free` | OpenChat | 8K | Conversational | 20 req/min |
| `gryphe/mythomax-l2-13b:free` | Gryphe | 4K | Roleplay, creative | 20 req/min |
| `undi95/toppy-m-7b:free` | Undi95 | 4K | Coding | 20 req/min |
| `lizpreciatior/lzlv-70b-fp16-hf:free` | Local | 4K | Local inference | 10 req/min |

### Quantum Coherence Strategy

```
User Query
    ↓
[RTX 2060 Embedding] → Local vector similarity check
    ↓
Cache Hit? 
    ├─ YES → Return cached response (0 cost, instant)
    └─ NO  → Continue to OpenRouter ensemble
              ↓
[Quantum Superposition] → Query ALL free models in parallel
    ├─ Model A (Mistral 7B)
    ├─ Model B (Gemma 7B)  
    ├─ Model C (Llama 2 13B)
    ├─ Model D (OpenChat 7B)
    └─ Model E (MythoMax 13B)
              ↓
[Quantum Consensus] → RTX 2060 embeds all responses
    ├─ Calculate semantic similarity matrix
    ├─ Weight by model confidence
    ├─ Apply interference patterns
    └─ Collapse to optimal response
              ↓
[100% Coherence Check]
    ├─ Coherence ≥ 0.95 → Return consensus
    ├─ Coherence 0.80-0.95 → Re-query divergent models
    └─ Coherence < 0.80 → Add to cache, flag for review
```

### API Integration

#### Endpoint
```
https://openrouter.ai/api/v1/chat/completions
```

#### Headers
```
Authorization: Bearer ${OPENROUTER_API_KEY}
HTTP-Referer: ${YOUR_SITE_URL}
X-Title: ${YOUR_SITE_NAME}
```

#### Request Format
```json
{
  "model": "mistralai/mistral-7b-instruct:free",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant"},
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,
  "max_tokens": 512
}
```

### Implementation Components

#### 1. OpenRouter Client (`openrouter_client.py`)
- Async HTTP client with rate limiting
- Automatic fallback between models
- Cost tracking per request
- Response caching

#### 2. Quantum Consensus Engine (`quantum_consensus.py`)
- Parallel model querying
- Semantic similarity calculation
- Coherence scoring
- Response synthesis

#### 3. Model Router (`model_router.py`)
- Task-based model selection
- Load balancing across free tiers
- Error handling and retries
- Circuit breaker pattern

#### 4. Coherence Monitor (`coherence_monitor.py`)
- Real-time coherence scoring
- Divergence detection
- Automatic re-query triggers
- Quality metrics dashboard

### Cost Analysis (Free Tier)

| Operation | Cost | Limit |
|-----------|------|-------|
| Single model query | $0 | 20/min |
| 5-model ensemble | $0 | 4/min (rate limit shared) |
| Embedding (local) | $0 | Unlimited |
| Cache storage | $0 | Disk space only |

**Monthly Capacity:** ~86,400 free requests (20/min × 60 × 24 × 30)

### Performance Targets

| Metric | Target | Method |
|--------|--------|--------|
| Coherence | ≥ 95% | Quantum consensus |
| Latency | < 5s | Parallel queries |
| Cache Hit | 40-60% | Semantic caching |
| Cost | $0 | Free tier only |
| Quality | GPT-3.5+ | Ensemble averaging |

### Error Handling

```python
class OpenRouterErrorHandler:
    RATE_LIMIT_BACKOFF = [1, 2, 4, 8, 16]  # seconds
    
    async def query_with_retry(model, prompt):
        for attempt in range(5):
            try:
                return await query(model, prompt)
            except RateLimitError:
                await sleep(RATE_LIMIT_BACKOFF[attempt])
                continue
            except ModelUnavailableError:
                # Fallback to next model
                return await query(fallback_model, prompt)
        raise MaxRetriesExceeded()
```

### Deployment Checklist

- [ ] OpenRouter API key configured
- [ ] Rate limiter implemented
- [ ] Quantum consensus engine deployed
- [ ] Coherence monitoring active
- [ ] Cache warming completed
- [ ] Fallback chains tested
- [ ] Cost tracking enabled

### Free Tier Optimization Tips

1. **Rotate API Keys** - Multiple free accounts (if TOS allows)
2. **Aggressive Caching** - Cache everything > 0.9 similarity
3. **Smart Batching** - Batch similar queries together
4. **Off-Peak Queries** - Use rate limits during low-traffic hours
5. **Local Embeddings** - Never pay for embeddings (use all-MiniLM)

### Integration with Existing System

```
┌─────────────────────────────────────────────────────────────┐
│  Existing Clawd Hybrid RTX                                  │
│  ├─ RTX 2060 (Local embeddings + cache)                    │
│  └─ Cloud LLM (Primary generation)                         │
│                                                              │
│  NEW: OpenRouter Ensemble Layer                             │
│  ├─ Free Model Pool (5-7 models)                           │
│  ├─ Quantum Consensus Engine                               │
│  ├─ 100% Coherence Target                                  │
│  └─ Zero Cost Operation                                    │
│                                                              │
│  Fallback Chain:                                            │
│  Cache Hit → OpenRouter Ensemble → Single Free Model       │
│              ↓                                              │
│        Coherence < 0.95 → Re-query → Human Review          │
└─────────────────────────────────────────────────────────────┘
```
