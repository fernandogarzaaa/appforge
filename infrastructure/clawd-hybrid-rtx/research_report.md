# Clawd Hybrid RTX - Deep Research Report

> **Date:** February 24, 2026  
> **Mission:** Research optimal free/cheap cloud LLM providers and architectures for RTX 2060 hybrid deployment

---

## Executive Summary

This report analyzes free and low-cost cloud LLM APIs, RTX 2060 optimization strategies, semantic caching solutions, and cost optimization techniques for building a hybrid on-premise/cloud AI system. The RTX 2060 (6GB VRAM) can handle embedding models and small-to-medium LLMs locally while offloading heavy workloads to cost-effective cloud providers.

---

## 1. Free Cloud LLM APIs Analysis

### 1.1 OpenRouter

**Overview:** OpenRouter provides a unified API gateway to hundreds of AI models from various providers with intelligent routing.

**Free Tier Details:**
- **Free Variant Models:** Use `:free` suffix (e.g., `google/gemma-3-4b-it:free`)
- **Rate Limits:** Varies by model and provider
- **Key Features:**
  - Automatic failover between providers
  - Price optimization across providers
  - Standardized API format
  - OAuth PKCE support
  - BYOK (Bring Your Own Key) option

**Available Free Models:**
- Google Gemma 3 (4B)
- Meta Llama 3.2 (3B, 1B)
- Microsoft Phi-3 (3.8B)
- Various Qwen models

**Pros:**
- Single API for 200+ models
- Intelligent provider routing
- No single point of failure
- Cost optimization built-in

**Cons:**
- Free tier rate limits are strict
- Popular models may have queue times
- Limited to smaller models on free tier

---

### 1.2 Together AI

**Overview:** Together AI offers a platform for running open-source models with competitive pricing and free starting credits.

**Free Tier Details:**
- **Free Credit:** $5 sign-up credit
- **Pay-as-you-go:** After credits expire
- **Serverless Inference:** No infrastructure management

**Pricing (per 1M tokens):**
| Model | Input | Output |
|-------|-------|--------|
| Llama 3.3 70B | $0.88 | $0.88 |
| Llama 3.1 8B | $0.18 | $0.18 |
| Llama 3.2 3B | $0.06 | $0.06 |
| DeepSeek V3 | $1.25 | $1.25 |
| Qwen2.5 7B | $0.30 | $0.30 |
| Mistral 7B | $0.20 | $0.20 |

**Best Value Models for Coding:**
- **Qwen2.5-Coder 7B:** $0.30/$0.30 - Excellent code generation
- **Llama 3.2 3B:** $0.06/$0.06 - Ultra cheap, good for simple tasks
- **DeepSeek V3:** $1.25/$1.25 - Best reasoning, higher cost

**Pros:**
- Generous $5 starting credit
- Fast inference speeds
- Batch API at 50% discount
- Good selection of coding models

**Cons:**
- Credits expire after trial period
- Rate limits apply
- No persistent free tier

---

### 1.3 Groq

**Overview:** Groq provides the fastest LLM inference in the industry using their custom LPU (Language Processing Unit) architecture.

**Free Tier Details:**
- **Free Developer Tier:** Available with generous limits
- **Rate Limits:** Vary by model (see table below)

**Pricing (per 1M tokens):**
| Model | Speed (TPS) | Input | Output |
|-------|-------------|-------|--------|
| GPT OSS 20B | 1,000 | $0.075 | $0.30 |
| GPT OSS 120B | 500 | $0.15 | $0.60 |
| Llama 4 Scout | 594 | $0.11 | $0.34 |
| Llama 4 Maverick | 562 | $0.20 | $0.60 |
| Kimi K2 | 200 | $1.00 | $3.00 |

**Free Tier Rate Limits:**
| Model | RPM | RPD | TPM | TPD |
|-------|-----|-----|-----|-----|
| Llama 3.1 8B | 30 | 14,400 | 6K | 500K |
| Llama 3.3 70B | 30 | 1,000 | 12K | 100K |
| Llama 4 Scout | 30 | 1,000 | 30K | 500K |
| Llama 4 Maverick | 30 | 1,000 | 6K | 500K |
| GPT OSS 20B | 30 | 1,000 | 8K | 200K |
| GPT OSS 120B | 30 | 1,000 | 8K | 200K |

**Pros:**
- **Fastest inference speeds** (up to 1,000 TPS)
- Excellent free tier limits
- Competitive pricing
- Great for real-time applications

**Cons:**
- Limited model selection compared to OpenRouter
- Rate limits on free tier

---

### 1.4 Fireworks AI

**Overview:** Fireworks AI provides fast inference with a focus on production workloads and fine-tuning capabilities.

**Free Tier Details:**
- **Free Trial:** Available upon registration
- **Serverless:** Pay per 1M tokens

**Pricing (per 1M tokens):**
| Model Category | Input | Output | Cached Input |
|----------------|-------|--------|--------------|
| <4B params | $0.10 | $0.10 | $0.05 |
| 4B-16B params | $0.20 | $0.20 | $0.10 |
| >16B params | $0.90 | $0.90 | $0.45 |
| MoE 0-56B | $0.50 | $0.50 | $0.25 |
| MoE 56-176B | $1.20 | $1.20 | $0.60 |

**Special Pricing:**
| Model | Input | Output | Cached |
|-------|-------|--------|--------|
| DeepSeek V3 | $0.56 | $1.68 | - |
| GLM-5 | $1.00 | $3.20 | $0.20 |
| Kimi K2 | $0.60 | $2.50 | - |
| Kimi K2.5 | $0.60 | $3.00 | $0.10 |
| GPT OSS 120B | $0.15 | $0.60 | - |
| GPT OSS 20B | $0.07 | $0.30 | - |

**Embeddings Pricing:**
| Model Size | Price/1M tokens |
|------------|-----------------|
| up to 150M | $0.008 |
| 150M-350M | $0.016 |
| Qwen3 8B | $0.10 |

**Pros:**
- 50% discount on cached input tokens
- Batch inference at 50% discount
- Strong fine-tuning platform
- Good for production workloads

**Cons:**
- No permanent free tier
- Pricing tiers can be complex

---

### 1.5 Anyscale

**Overview:** Anyscale offers GPU-powered compute for AI workloads with a focus on Ray-based distributed computing.

**Free Tier Details:**
- **Free Credits:** $100 starting credits
- **Hosted Mode:** Fastest way to get started

**Compute Pricing (per hour):**
| GPU Type | Price/Hour |
|----------|------------|
| NVIDIA T4 | $0.5682 |
| NVIDIA L4 | $0.9542 |
| NVIDIA A10G | $1.3635 |
| NVIDIA A100 | $4.9591 |
| NVIDIA H100 | $9.2880 |
| NVIDIA H200 | $10.6812 |

**Best For:**
- Custom model deployments
- Fine-tuning workflows
- Distributed training
- Production Ray Serve applications

**Pros:**
- $100 in starting credits
- Full control over infrastructure
- Bring your own cloud option
- Good for scaling workloads

**Cons:**
- More complex setup
- Credit-based, not permanently free
- Best suited for larger deployments

---

## 2. RTX 2060 Optimization

### 2.1 Hardware Specifications

| Specification | Value |
|--------------|-------|
| VRAM | 6GB GDDR6 |
| Memory Bandwidth | 336 GB/s |
| CUDA Cores | 1,920 |
| Tensor Cores | 240 (Gen 1) |
| PCIe | 3.0 x16 |
| Architecture | Turing |

### 2.2 Best Embedding Models for 6GB VRAM

**Recommended Models:**

| Model | Dimensions | Size | VRAM Required | Speed |
|-------|------------|------|---------------|-------|
| all-MiniLM-L6-v2 | 384 | 23MB | ~500MB | Very Fast |
| all-MiniLM-L12-v2 | 384 | 34MB | ~600MB | Fast |
| paraphrase-MiniLM-L3-v2 | 384 | 17MB | ~300MB | Fastest |
| nomic-embed-text-v1.5 | 768 | 130MB | ~1GB | Fast |
| mxbai-embed-large | 1024 | 335MB | ~2GB | Moderate |

**Optimal Choice:** `all-MiniLM-L6-v2`
- Best speed/quality tradeoff
- Fits easily in 6GB VRAM
- Can batch process efficiently
- 384 dimensions is sufficient for most RAG applications

### 2.3 Local LLM Options for RTX 2060

**Models That Fit (6GB VRAM):**

| Model | Quantization | VRAM | Quality | Use Case |
|-------|--------------|------|---------|----------|
| Llama 3.2 1B | Q4_K_M | ~1GB | Good | Ultra-fast queries |
| Llama 3.2 3B | Q4_K_M | ~2GB | Better | Balanced tasks |
| Qwen2.5 3B | Q4_K_M | ~2GB | Better | Coding tasks |
| Phi-3 3.8B | Q4_K_M | ~3GB | Good | Reasoning |
| Gemma 2 2B | Q4_K_M | ~1.5GB | Good | General purpose |
| Qwen2.5-Coder 1.5B | Q4_K_M | ~1GB | Good | Code completion |

**Recommended Setup:**
- **Primary:** Llama 3.2 3B Q4_K_M (2GB VRAM)
- **Embedding:** all-MiniLM-L6-v2 (500MB VRAM)
- **Remaining VRAM:** ~3.5GB for context/cache

### 2.4 Optimal Batch Sizes

**For Embedding Models:**
| Model | Optimal Batch | Max Batch | Notes |
|-------|--------------|-----------|-------|
| all-MiniLM-L6-v2 | 32-64 | 256 | Larger = better throughput |
| nomic-embed-text | 16-32 | 128 | Higher dim = smaller batches |

**For LLM Inference:**
| Model | Batch Size | Context | Notes |
|-------|------------|---------|-------|
| Llama 3.2 3B | 1 | 4096 | Single-user optimal |
| Llama 3.2 1B | 2-4 | 2048 | Can handle concurrent |
| Qwen2.5 3B | 1 | 8192 | Good for RAG |

### 2.5 Memory Management Strategies

**1. Quantization Strategy:**
```
Q4_K_M: Best balance (4-bit, medium quality)
Q5_K_M: Better quality (~25% more VRAM)
Q6_K: High quality (~50% more VRAM)
FP16: Not recommended for 6GB cards
```

**2. Context Window Management:**
- Keep context at 2048-4096 tokens for general use
- Use 8192 only for RAG with long documents
- Implement sliding window for very long contexts

**3. KV Cache Optimization:**
- Use flash attention when available
- Enable KV cache quantization (Q4_K)
- Clear cache between unrelated conversations

### 2.6 PCIe Bandwidth Considerations

**PCIe 3.0 x16 Bandwidth:** ~16 GB/s

**Impact:**
- Model loading: ~1-2 seconds for 2GB model
- Prompt processing: Minimal impact
- Token generation: Minimal impact
- Embedding batching: Pre-load to GPU

**Recommendations:**
1. Keep models loaded (don't unload between requests)
2. Use mmap for faster model loading
3. Batch embedding requests to reduce transfers
4. Consider using CPU RAM for model storage, GPU for active inference

---

## 3. Semantic Caching Research

### 3.1 Vector Database Comparison

| Feature | FAISS | ChromaDB | Pinecone |
|---------|-------|----------|----------|
| **License** | MIT | Apache 2.0 | Proprietary |
| **Cost** | Free | Free/OSS | Usage-based |
| **GPU Support** | Excellent | No | Cloud-only |
| **Persistence** | Yes | Yes | Yes |
| **Scaling** | Single-node | Single-node | Cloud-native |
| **Best For** | Local/high-perf | Simple RAG | Enterprise |

### 3.2 FAISS Deep Dive

**Key Features:**
- C++ library with Python bindings
- GPU acceleration via CUDA
- Multiple index types for different use cases
- Supports up to billions of vectors

**Index Types:**

| Index | Use Case | Memory | Speed | Accuracy |
|-------|----------|--------|-------|----------|
| IndexFlatL2 | Small datasets (<100K) | High | Slow | 100% |
| IndexIVFFlat | Medium datasets | Medium | Medium | ~95% |
| IndexIVFPQ | Large datasets | Low | Fast | ~90% |
| IndexHNSWFlat | Graph search | Medium | Fast | ~99% |

**Recommended for RTX 2060:**
- **Small cache (<100K):** IndexFlatL2 on GPU
- **Medium cache (100K-1M):** IndexIVFFlat with nlist=100
- **Large cache (>1M):** IndexIVFPQ with compression

### 3.3 ChromaDB Analysis

**Key Features:**
- Pure Python, easy integration
- Built-in embedding functions
- Async support
- Collection-based organization

**Pros:**
- Simple API
- Good documentation
- Active development
- Cloud option available

**Cons:**
- No GPU acceleration
- Single-threaded queries
- Memory-only for small datasets

### 3.4 Similarity Thresholds for Cache Hits

**Recommended Thresholds:**

| Use Case | Cosine Similarity | L2 Distance | Hit Rate |
|----------|------------------|-------------|----------|
| Exact match | 0.99+ | <0.01 | Low |
| Similar query | 0.95-0.98 | 0.01-0.05 | Medium |
| Paraphrase | 0.90-0.95 | 0.05-0.10 | High |
| Fuzzy match | 0.85-0.90 | 0.10-0.15 | Very High |

**Implementation Strategy:**
```python
# Multi-tier caching
if similarity > 0.98:
    return cache_hit  # Exact match
elif similarity > 0.90:
    return cache_hit_with_warning  # Similar
else:
    process_new_request  # Cache miss
```

### 3.5 Cache Eviction Strategies

**Strategies:**

1. **LRU (Least Recently Used)**
   - Good for: General purpose
   - Complexity: O(1)
   - Best for: Balanced workloads

2. **LFU (Least Frequently Used)**
   - Good for: Frequently repeated queries
   - Complexity: O(log n)
   - Best for: Stable query patterns

3. **TTL (Time To Live)**
   - Good for: Time-sensitive data
   - Complexity: O(1)
   - Best for: Dynamic content

4. **Hybrid (LRU + LFU + TTL)**
   - Score = (recency_weight × recency) + (freq_weight × frequency) - (ttl_penalty)
   - Best for: Production systems

**Recommended:** Hybrid approach with 24-hour TTL for semantic cache

### 3.6 Persistent Storage Formats

**FAISS:**
- Native `.faiss` format
- Supports memory-mapped files
- Can serialize to/from disk

**ChromaDB:**
- SQLite backend (default)
- Persistent directory storage
- Backup via file copy

**Hybrid Approach:**
```
Hot cache: FAISS in GPU memory
Warm cache: FAISS on disk
Cold storage: JSON/Parquet with embeddings
```

---

## 4. Cost Optimization

### 4.1 Price Per 1K Tokens Comparison

**Input Tokens:**
| Provider | Cheapest Model | Price/1K | Best Coding Model | Price/1K |
|----------|---------------|----------|-------------------|----------|
| Groq | GPT OSS 20B | $0.000075 | Llama 4 Maverick | $0.00020 |
| Fireworks | GPT OSS 20B | $0.00007 | Llama 3.1 8B | $0.00018 |
| Together | Llama 3.2 3B | $0.00006 | Qwen2.5-Coder 7B | $0.00030 |
| OpenRouter | Free tier | $0.00000 | Varies | Varies |

**Output Tokens:**
| Provider | Cheapest Model | Price/1K | Best Coding Model | Price/1K |
|----------|---------------|----------|-------------------|----------|
| Groq | GPT OSS 20B | $0.00030 | Llama 4 Maverick | $0.00060 |
| Fireworks | GPT OSS 20B | $0.00030 | Llama 3.1 8B | $0.00018 |
| Together | Llama 3.2 3B | $0.00006 | Qwen2.5-Coder 7B | $0.00030 |

### 4.2 Rate Limits Summary

| Provider | Free Tier | RPM Limit | TPM Limit | Best For |
|----------|-----------|-----------|-----------|----------|
| Groq | Yes | 30-60 | 6K-30K | Speed, real-time |
| OpenRouter | Yes (limited) | Varies | Varies | Variety, fallback |
| Together | $5 credit | Varies | Varies | General use |
| Fireworks | Trial | Varies | Varies | Production |
| Anyscale | $100 credit | N/A | N/A | Custom deploy |

### 4.3 Best Models for Coding Tasks

**Budget Tier (Free/Low Cost):**
| Model | Provider | Price/1K In | Price/1K Out | Strengths |
|-------|----------|-------------|--------------|-----------|
| Qwen2.5-Coder 1.5B | Local/RTX 2060 | Free | Free | Fast completion |
| Llama 3.2 3B | Groq | $0.00011 | $0.00034 | General coding |
| GPT OSS 20B | Groq | $0.000075 | $0.00030 | Good reasoning |

**Mid Tier (Best Value):**
| Model | Provider | Price/1K In | Price/1K Out | Strengths |
|-------|----------|-------------|--------------|-----------|
| Qwen2.5-Coder 7B | Together | $0.00030 | $0.00030 | Code gen |
| Llama 3.1 8B | Fireworks | $0.00018 | $0.00018 | Balanced |
| Llama 4 Scout | Groq | $0.00011 | $0.00034 | MoE, efficient |

**Premium Tier (High Quality):**
| Model | Provider | Price/1K In | Price/1K Out | Strengths |
|-------|----------|-------------|--------------|-----------|
| DeepSeek V3 | Fireworks | $0.00056 | $0.00168 | Best reasoning |
| Llama 4 Maverick | Groq | $0.00020 | $0.00060 | Strong general |
| Kimi K2 | Groq | $0.00100 | $0.00300 | 1T context |

---

## 5. Recommended Architecture

### 5.1 Hybrid Deployment Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                        USER REQUEST                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              SEMANTIC CACHE (FAISS on GPU)                  │
│                   - Check similarity > 0.95                 │
│                   - Return cached response if hit           │
└─────────────────────────────────────────────────────────────┘
                            │ Cache Miss
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    ROUTING DECISION                         │
│                                                             │
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │  LOCAL (RTX 2060)│    │   CLOUD API      │              │
│  │                  │    │                  │              │
│  │ • Embedding      │    │ • Complex tasks  │              │
│  │ • Simple queries │    │ • Large context  │              │
│  │ • Fast response  │    │ • Coding tasks   │              │
│  │ • Batch embed    │    │ • Rate limited   │              │
│  └──────────────────┘    └──────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Provider Selection Flow

```python
def select_provider(task_type, complexity, urgency):
    # Priority order
    providers = {
        'embeddings': 'local_rtx2060',
        'simple_qa': 'local_rtx2060',
        'fast_response': 'groq',
        'coding': 'together_qwen_coder',
        'complex_reasoning': 'fireworks_deepseek',
        'fallback': 'openrouter_free'
    }
    
    # Check rate limits first
    if groq_rate_limit_available() and urgency == 'high':
        return 'groq'
    elif task_type == 'coding':
        return 'together'
    else:
        return 'openrouter'
```

### 5.3 Cost-Optimized Stack Recommendation

**Local (RTX 2060):**
- Embeddings: all-MiniLM-L6-v2
- Small LLM: Llama 3.2 3B Q4_K_M
- Cache: FAISS GPU IndexFlatL2

**Cloud (Free/Cheap Tier):**
- Primary: Groq (fastest, good free tier)
- Fallback: OpenRouter (variety, free models)
- Coding: Together AI ($5 credit, good coder models)

**Total Monthly Cost (Estimated):**
- Groq free tier: $0 (within limits)
- Together AI: $0-5 (depending on usage)
- Fireworks: $0-10 (for heavy usage)
- **Total: $0-15/month for moderate usage**

---

## 6. Conclusion

**Key Findings:**

1. **Best Free Tier:** Groq offers the most generous free tier with the fastest inference speeds
2. **Best for Coding:** Together AI's Qwen2.5-Coder models offer excellent value
3. **RTX 2066 Optimization:** Focus on 3B parameter models with Q4_K_M quantization
4. **Semantic Cache:** FAISS on GPU provides best performance for local caching
5. **Cost Optimization:** Hybrid approach can keep costs under $15/month

**Recommended Next Steps:**
1. Set up FAISS GPU index for semantic caching
2. Deploy Llama 3.2 3B on RTX 2060 for local inference
3. Integrate Groq as primary cloud provider
4. Configure OpenRouter as fallback
5. Implement Together AI for coding-specific tasks

---

*Report generated by Clawd Deep Research Swarm Lead*  
*For questions or updates, refer to individual provider documentation*
