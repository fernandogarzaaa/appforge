# Clawd Hybrid RTX API Documentation

> Smart LLM API with local cache and cost optimization for RTX 2060 + Cloud Hybrid Architecture

**Version:** 1.0.0  
**Base URL:** `http://localhost:8000`  
**OpenAPI:** `/docs` (Swagger UI) or `/openapi.json`

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Smart Routing](#smart-routing)
  - [Cache Management](#cache-management)
  - [Cost Optimization](#cost-optimization)
  - [Local GPU](#local-gpu)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [SDKs](#sdks)
- [Examples](#examples)

---

## Overview

Clawd Hybrid RTX is a cost-efficient LLM API that combines:

- **Local RTX 2060 GPU** for embeddings and semantic search
- **Semantic cache** to avoid redundant API calls
- **Smart routing** between Groq, OpenAI, and Anthropic
- **Aggressive batching** for cost savings

### Cost Savings Formula

```
Savings = (Cache Hit Rate × Cloud Cost) + (Local Embedding Cost = $0)
```

**Typical savings: 40-70%** on cloud API costs with aggressive caching.

---

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Client Request │────▶│  API Server  │────▶│  Semantic Cache │
└─────────────────┘     └──────────────┘     └─────────────────┘
                               │                       │
                               ▼                       ▼
                        ┌──────────────┐      ┌──────────────┐
                        │  RTX 2060    │      │  Cache Hit?  │
                        │  Embeddings  │      └──────────────┘
                        └──────────────┘            │
                               │                    │
                               ▼                    ▼
                        ┌──────────────┐      ┌──────────────┐
                        │  Vector DB   │      │   Return     │
                        │   (FAISS)    │      │   Cached     │
                        └──────────────┘      └──────────────┘
                                                       │
                               ┌───────────────────────┘
                               ▼
                        ┌──────────────┐
                        │  Cloud LLM   │
                        │   Provider   │
                        │ ├─ Groq      │
                        │ ├─ OpenAI    │
                        │ └─ Anthropic │
                        └──────────────┘
```

---

## Authentication

API uses Bearer token authentication (optional for local deployments):

```http
Authorization: Bearer YOUR_API_KEY
```

---

## Endpoints

### Smart Routing

#### POST `/generate`

Generate text with smart caching and provider routing.

**Request:**
```json
{
  "prompt": "Explain quantum computing in simple terms",
  "model_tier": "balanced",
  "provider": "auto",
  "temperature": 0.7,
  "max_tokens": 1024,
  "use_cache": true,
  "stream": false
}
```

**Response:**
```json
{
  "response": "Quantum computing is a type of computing that uses quantum mechanics...",
  "cache_hit": false,
  "provider_used": "groq",
  "model_used": "llama-3.3-70b-versatile",
  "cost_usd": 0.00052,
  "local_gpu_used": false,
  "tokens_input": 12,
  "tokens_output": 245,
  "tokens_saved": 0,
  "latency_ms": 892,
  "request_id": "a1b2c3d4e5f67890",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Model Tiers:**

| Tier | Provider | Model | Speed | Quality |
|------|----------|-------|-------|---------|
| `fast` | Groq | llama-3.1-8b-instant | ⚡⚡⚡ | ⭐⭐ |
| `balanced` | Groq | llama-3.3-70b-versatile | ⚡⚡ | ⭐⭐⭐ |
| `quality` | Anthropic | claude-3-5-sonnet | ⚡ | ⭐⭐⭐⭐⭐ |
| `coding` | Groq | deepseek-coder-33b | ⚡⚡ | ⭐⭐⭐⭐ |

---

#### POST `/generate/stream`

Stream generation with local buffering.

**Request:** Same as `/generate` with `"stream": true`

**Response:** Server-Sent Events (SSE)

```
data: {"token": "Quantum", "buffered": 1}

data: {"token": "computing", "buffered": 2}

data: {"token": "uses", "buffered": 3}

data: {"done": true, "total_tokens": 245}
```

---

#### POST `/batch`

Batch generation for cost savings. Aggressively deduplicates and uses cache.

**Request:**
```json
{
  "prompts": [
    "What is machine learning?",
    "What is deep learning?",
    "What is machine learning?"
  ],
  "model_tier": "balanced",
  "use_cache": true
}
```

**Response:**
```json
{
  "responses": [...],
  "total_cost_usd": 0.0008,
  "total_tokens_saved": 245,
  "batch_size": 3,
  "batch_id": "batch_a1b2c3"
}
```

**💡 Tip:** Use batching for processing multiple documents - can save up to 30% on costs!

---

### Cache Management

#### GET `/cache/stats`

Get cache performance metrics.

**Response:**
```json
{
  "total_entries": 15420,
  "hit_rate_24h": 0.67,
  "hit_rate_7d": 0.58,
  "total_hits": 8912,
  "total_misses": 4508,
  "tokens_saved_total": 2234500,
  "estimated_savings_usd": 45.20,
  "cache_size_mb": 152.4,
  "oldest_entry": "2025-01-01T00:00:00Z",
  "newest_entry": "2025-01-15T10:30:00Z"
}
```

---

#### POST `/cache/clear`

Clear all cached entries.

**Response:**
```json
{
  "status": "cleared",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

#### POST `/cache/warm`

Pre-populate cache with common queries (runs async).

**Request:**
```json
{
  "queries": [
    "What is AI?",
    "How does machine learning work?",
    "Explain neural networks"
  ],
  "model_tier": "balanced"
}
```

**Response:**
```json
{
  "warmed_count": 3,
  "failed_count": 0,
  "total_cost_usd": 0.0015
}
```

---

### Cost Optimization

#### GET `/cost/stats`

Get spending and usage statistics.

**Response:**
```json
{
  "total_spent_usd": 127.45,
  "total_tokens_input": 450230,
  "total_tokens_output": 1890450,
  "total_requests": 8921,
  "provider_breakdown": {
    "groq": 45.20,
    "anthropic": 82.25
  },
  "daily_average_7d": 5.43,
  "projected_monthly_usd": 163.20
}
```

---

#### POST `/cost/estimate`

Predict cost before generation.

**Request:**
```json
{
  "prompt": "Write a 500 word essay on climate change",
  "model_tier": "quality",
  "max_tokens": 750
}
```

**Response:**
```json
{
  "estimated_cost_usd": 0.0153,
  "estimated_tokens_input": 15,
  "estimated_tokens_output": 750,
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20241022",
  "cache_potential": 0.23
}
```

---

#### POST `/providers/switch`

Change default cloud provider.

**Request:**
```json
{
  "provider": "groq",
  "model": "llama-3.3-70b-versatile"
}
```

**Response:**
```json
{
  "success": true,
  "provider": "groq",
  "model": "llama-3.3-70b-versatile",
  "message": "Switched to groq"
}
```

---

### Local GPU

#### POST `/embed`

Generate embeddings using local RTX 2060. **FREE!**

**Request:**
```json
{
  "texts": [
    "Machine learning is a subset of AI",
    "Deep learning uses neural networks"
  ],
  "model": "all-MiniLM-L6-v2",
  "normalize": true
}
```

**Response:**
```json
{
  "embeddings": [
    [0.023, -0.156, 0.892, ...],  // 384 dimensions
    [0.112, -0.089, 0.765, ...]
  ],
  "dimensions": 384,
  "model_used": "all-MiniLM-L6-v2",
  "local_gpu_used": true,
  "latency_ms": 12.4
}
```

---

#### POST `/similarity`

Calculate semantic similarity between two texts.

**Request:**
```json
{
  "text1": "The cat sat on the mat",
  "text2": "A feline rested on the rug"
}
```

**Response:**
```json
{
  "similarity": 0.89,
  "distance": 0.22,
  "model_used": "all-MiniLM-L6-v2",
  "local_gpu_used": true
}
```

---

#### POST `/search`

Local vector search using GPU-accelerated embeddings.

**Request:**
```json
{
  "query": "machine learning algorithms",
  "top_k": 5,
  "threshold": 0.7
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "doc_001",
      "text": "Supervised learning uses labeled data...",
      "score": 0.94,
      "metadata": {"source": "textbook_ch3"}
    }
  ],
  "query_embedding_time_ms": 2.1,
  "search_time_ms": 5.3,
  "total_results": 5,
  "local_gpu_used": true
}
```

---

## Response Format

All successful responses follow this structure:

```json
{
  "response": "...",
  "cache_hit": true,
  "provider_used": "groq",
  "cost_usd": 0.0001,
  "local_gpu_used": true,
  "tokens_saved": 245
}
```

### Cost Calculation

```python
cost_usd = (tokens_input / 1000 * input_rate) + (tokens_output / 1000 * output_rate)
```

### Pricing (per 1K tokens)

| Model | Input | Output |
|-------|-------|--------|
| llama-3.1-8b-instant | $0.0001 | $0.0002 |
| llama-3.3-70b-versatile | $0.0005 | $0.0008 |
| claude-3-5-sonnet | $0.003 | $0.015 |
| deepseek-coder-33b | $0.0008 | $0.0012 |

---

## Error Handling

### Error Response Format

```json
{
  "code": "RATE_LIMITED",
  "message": "Too many requests",
  "request_id": "req_abc123",
  "details": {
    "retry_after": 30
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Malformed request |
| `RATE_LIMITED` | 429 | Too many requests |
| `PROVIDER_ERROR` | 502 | LLM provider error |
| `CACHE_ERROR` | 500 | Cache service error |
| `GPU_ERROR` | 500 | GPU service error |
| `TIMEOUT` | 504 | Request timeout |

---

## SDKs

### Python SDK

```bash
pip install cladw-hybrid
```

```python
from client_sdk import ClawdClient, ModelTier

# Initialize
client = ClawdClient("http://localhost:8000")

# Generate with cache
result = client.generate(
    "Explain Python decorators",
    model_tier=ModelTier.BALANCED,
    use_cache=True
)
print(f"Response: {result.response}")
print(f"Cost: ${result.cost_usd:.4f}")
print(f"Cache hit: {result.cache_hit}")

# Stream tokens
for token in client.generate_stream("Write a poem"):
    print(token, end="", flush=True)

# Batch for savings
results = client.batch([
    "What is AI?",
    "What is ML?",
    "What is DL?"
])
print(f"Total: ${results.total_cost_usd:.4f}")

# Local GPU embeddings (FREE!)
embeddings = client.embed(["Hello world", "Goodbye world"])
print(f"Dimensions: {embeddings.dimensions}")

# Semantic similarity
sim = client.similarity("cat", "kitten")
print(f"Similarity: {sim.similarity:.3f}")

# Context manager
with ClawdClient() as client:
    result = client.generate("Hello")
```

### TypeScript/JavaScript SDK

```bash
npm install cladw-hybrid
```

```typescript
import { ClawdClient, ModelTier } from 'cladw-hybrid';

const client = new ClawdClient({
  baseUrl: 'http://localhost:8000',
  defaultTier: ModelTier.BALANCED
});

// Generate
const result = await client.generate({
  prompt: 'Explain async/await',
  use_cache: true
});
console.log(`Cost: $${result.cost_usd}`);

// Stream
const stream = await client.generateStream({ prompt: 'Write code' });
for await (const token of stream) {
  process.stdout.write(token);
}
```

---

## Examples

### Example 1: RAG Pipeline

```python
from client_sdk import ClawdClient

client = ClawdClient()

# 1. Embed documents (FREE with local GPU!)
docs = [
    "Machine learning is...",
    "Deep learning uses...",
    "Neural networks are..."
]
embeddings = client.embed(docs)

# 2. Search relevant docs
query = "What is deep learning?"
results = client.search(query, top_k=3)

# 3. Generate answer with context
context = "\n".join([r.text for r in results.results])
prompt = f"Context: {context}\n\nQuestion: {query}"
answer = client.generate(prompt, model_tier="quality")

print(f"Answer: {answer.response}")
print(f"Total cost: ${answer.cost_usd:.4f}")
```

### Example 2: Cache Warming

```python
# Pre-populate cache with FAQ
faqs = [
    "What are your business hours?",
    "How do I reset my password?",
    "What payment methods do you accept?",
    "How do I contact support?",
]

client.cache_warm(faqs, model_tier="balanced")

# Now these queries will be instant and free!
```

### Example 3: Cost Monitoring

```python
# Check costs before and after
before = client.cost_stats()
print(f"Spent so far: ${before.total_spent_usd:.2f}")

# Run expensive operation
for doc in large_document_set:
    client.generate(f"Summarize: {doc}")

after = client.cost_stats()
print(f"This session: ${after.total_spent_usd - before.total_spent_usd:.2f}")
print(f"Projected monthly: ${after.projected_monthly_usd:.2f}")
```

---

## Deployment

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY api_routes.py .
EXPOSE 8000

CMD ["uvicorn", "api_routes:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GROQ_API_KEY` | Groq API key | Required |
| `OPENAI_API_KEY` | OpenAI API key | Optional |
| `ANTHROPIC_API_KEY` | Anthropic API key | Optional |
| `CACHE_DIR` | Cache storage path | `./cache` |
| `GPU_ENABLED` | Enable local GPU | `true` |

---

## Performance Benchmarks

| Operation | Latency | Cost |
|-----------|---------|------|
| Cache hit | ~5ms | $0 |
| Cache miss (Groq) | ~800ms | ~$0.0005 |
| Cache miss (Claude) | ~2000ms | ~$0.015 |
| Local embedding | ~10ms | $0 |
| Similarity | ~15ms | $0 |
| Vector search | ~20ms | $0 |

---

## Support

- **Issues:** https://github.com/clawd/hybrid-rtx/issues
- **Discord:** https://discord.gg/clawd
- **Docs:** https://docs.clawd.ai

---

*Built with ❤️ for cost-efficient AI by the Clawd Team*
