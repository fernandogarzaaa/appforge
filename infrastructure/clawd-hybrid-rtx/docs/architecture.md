# Architecture Documentation

## System Overview

Clawd Hybrid RTX implements a **two-tier inference architecture**:

1. **Fast Tier** - Local embedding-based semantic cache (< 50ms response)
2. **Power Tier** - Cloud LLM APIs for complex inference

This architecture optimizes for:
- **Latency**: Common queries served instantly from cache
- **Cost**: Aggressive deduplication reduces API calls
- **Quality**: Full LLM power when needed

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   generate   │  │generate_batch│  │   invalidate_cache   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
└─────────┼─────────────────┼─────────────────────┼──────────────┘
          │                 │                     │
          └─────────────────┼─────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Routing Layer                               │
│                                                                 │
│   ┌─────────────────┐      ┌─────────────────┐                 │
│   │   Check Cache   │─────▶│   Cache Miss?   │                 │
│   └─────────────────┘      └────────┬────────┘                 │
│                                     │                           │
│                    ┌────────────────┴────────────────┐          │
│                    │                                 │          │
│                    ▼                                 ▼          │
│           ┌───────────────┐               ┌──────────────────┐  │
│           │  Return Cache │               │  Submit to Batch │  │
│           │   Response    │               │     Manager      │  │
│           └───────────────┘               └────────┬─────────┘  │
└────────────────────────────────────────────────────┼────────────┘
                                                     │
                                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Processing Layer                             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Batch Manager                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │  │
│  │  │  Deduplicate│  │   Group     │  │  Flush on Timer │  │  │
│  │  │  Requests   │──▶│  by Batch   │──▶│  or Size Limit  │  │  │
│  │  └─────────────┘  └─────────────┘  └────────┬────────┘  │  │
│  └─────────────────────────────────────────────┼────────────┘  │
│                                                │                │
│                                                ▼                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Cloud API Client                        │  │
│  │         OpenRouter (Primary) / Together (Fallback)       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Storage Layer                              │
│                                                                 │
│  ┌──────────────────────┐      ┌──────────────────────────┐    │
│  │    Semantic Cache    │      │     Cache Persistence    │    │
│  │  ┌────────────────┐  │      │                          │    │
│  │  │  FAISS Index   │  │      │  ./cache/semantic_cache  │    │
│  │  │  (Vectors)     │  │      │       .pkl               │    │
│  │  └────────────────┘  │      │                          │    │
│  │  ┌────────────────┐  │      └──────────────────────────┘    │
│  │  │  Embedding     │  │                                       │
│  │  │  Model (MiniLM)│  │                                       │
│  │  └────────────────┘  │                                       │
│  └──────────────────────┘                                       │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Cache Hit Path (Fast)

```
User Query
    │
    ▼
┌─────────────────┐
│  Text Embedding │──────┐
│  (CPU/GPU)      │      │
└─────────────────┘      │
                         ▼
              ┌─────────────────────┐
              │  FAISS Similarity   │
              │  Search (Top-K=1)   │
              └──────────┬──────────┘
                         │
              ┌──────────┴──────────┐
              │  Similarity Score   │
              │     >= 0.92?        │
              └──────────┬──────────┘
                         │
              ┌──────────┴──────────┐
              │ Yes                 │ No
              ▼                     ▼
      ┌───────────────┐     ┌───────────────┐
      │ Return Cached │     │ Route to Cloud│
      │   Response    │     │     API       │
      └───────────────┘     └───────────────┘
```

**Latency Target**: < 50ms for cache hits

### 2. Cache Miss Path (Full)

```
User Query
    │
    ▼
┌─────────────────┐
│  Check Cache    │───────────────┐
│  (Miss)         │               │
└─────────────────┘               │
                                  ▼
                      ┌─────────────────────┐
                      │  Add to Batch Queue │
                      │  (with Priority)    │
                      └──────────┬──────────┘
                                 │
                      ┌──────────┴──────────┐
                      │  Deduplicate?       │
                      │  (Same query        │
                      │   pending?)         │
                      └──────────┬──────────┘
                                 │
                      ┌──────────┴──────────┐
                      │ Yes (Link)          │ No (New Entry)
                      ▼                     ▼
              ┌───────────────┐     ┌───────────────┐
              │ Wait for      │     │ Create Batch  │
              │ Original      │     │ (Size/Timer)  │
              └───────┬───────┘     └───────┬───────┘
                      │                       │
                      └───────────┬───────────┘
                                  ▼
                      ┌─────────────────────┐
                      │  Send to Cloud API  │
                      │  (with Retry)       │
                      └──────────┬──────────┘
                                 │
                      ┌──────────┴──────────┐
                      │  Response OK?       │
                      └──────────┬──────────┘
                                 │
                      ┌──────────┴──────────┐
                      │ Yes                 │ No
                      ▼                     ▼
              ┌───────────────┐     ┌───────────────┐
              │ Cache Response│     │ Try Fallback  │
              │ Stream to User│     │ Provider      │
              └───────────────┘     └───────────────┘
```

**Latency Target**: 500ms - 3s depending on provider

## Component Details

### SemanticCache

**Purpose**: Fast semantic similarity matching for query deduplication

**Implementation**:
- **Backend**: FAISS (IndexFlatIP for cosine similarity)
- **Embeddings**: sentence-transformers/all-MiniLM-L6-v2
- **Dimensions**: 384
- **Index Type**: Flat (exact search, good for < 100K entries)

**Cache Strategy**:
```python
# Pseudocode
def get(query):
    embedding = embed(query)
    
    # Search FAISS
    distances, indices = index.search(embedding, k=1)
    
    if distances[0] >= threshold:
        entry = entries[indices[0]]
        if not expired(entry):
            entry.hit_count += 1
            return entry.response
    
    return None
```

**Persistence**:
- Format: Pickle with numpy array serialization
- Path: Configurable (default: `./cache/semantic_cache.pkl`)
- Auto-save on close

**Eviction Policy**:
1. TTL expiration (time-based)
2. LRU eviction (when max_entries exceeded)
   - Score = (hit_count, -age)
   - Evict lowest score

### BatchManager

**Purpose**: Reduce API costs by batching and deduplicating requests

**Batching Strategy**:
```python
# Pseudocode
async def batch_loop():
    while running:
        batch = []
        
        # Wait for first request
        batch.append(await queue.get())
        
        # Collect more within timeout
        deadline = now() + timeout_ms
        while len(batch) < max_size:
            try:
                request = await queue.get(timeout=deadline - now())
                
                # Deduplicate within batch
                if request.query not in [r.query for r in batch]:
                    batch.append(request)
            except Timeout:
                break
        
        # Process batch
        await process_batch(batch)
```

**Adaptive Batching**:
- Monitors response times
- Reduces batch size if latency exceeds target
- Increases if significantly faster than target

### HybridInferenceEngine

**Purpose**: Orchestrate cache and cloud layers

**Routing Logic**:
```python
async def generate(query):
    # 1. Check cache
    cached = await cache.get(query)
    if cached:
        return cached.response
    
    # 2. Submit to batch manager
    response = await batch_manager.submit(query)
    
    # 3. Cache result
    await cache.put(query, response)
    
    return response
```

**Fallback Chain**:
1. Try primary provider (OpenRouter)
2. On failure, try fallback (Together AI)
3. On both failure, return error with suggestions

### MemoryMonitor

**Purpose**: Prevent OOM by monitoring VRAM and triggering fallbacks

**Thresholds**:
| Level | GPU VRAM | Action |
|-------|----------|--------|
| Normal | < 4GB | Use GPU for embeddings |
| Warning | 4-5GB | Use CPU for embeddings |
| Critical | > 5GB | Pause new requests |

**Callback System**:
```python
monitor.register_callback("gpu_warning", lambda stats: 
    engine.config["use_gpu_for_embeddings"] = False
)
```

## Storage Schema

### Cache Entry

```python
{
    "query": str,                    # Original query
    "response": str,                 # LLM response
    "embedding": bytes,              # 384-dim float32 array
    "timestamp": datetime,           # When cached
    "ttl_seconds": int,              # Expiration time
    "hit_count": int,                # Times retrieved
    "model_used": str,               # Provider/model
}
```

### FAISS Index

```python
# IndexFlatIP configuration
index = faiss.IndexFlatIP(384)       # Inner product = cosine (normalized)
index.add(embeddings)                # Add on cache.put
index.search(query_emb, k=1)         # Search on cache.get
```

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Cache Hit Latency | < 50ms | Embedding + FAISS search |
| Cache Hit Rate | > 40% | Depends on query distribution |
| Batch Deduplication | > 20% | Identical concurrent queries |
| API Cost Reduction | > 50% | Cache + batching combined |
| VRAM Usage | < 2GB | For all local processing |

## Scalability Considerations

### Current Limits
- **Cache Entries**: 10,000 (configurable)
- **Batch Size**: 10 (conservative for 6GB VRAM)
- **Concurrent Batches**: 3 (configurable)

### Scaling Options
1. **Larger Cache**: Switch to FAISS IVF index for > 100K entries
2. **Multiple GPUs**: Shard embedding workload
3. **Distributed**: Redis for shared cache across instances

## Security Considerations

- API keys stored in environment variables only
- Cache persistence encrypted at rest (user responsibility)
- No query/response logging by default
- Optional: PII detection before caching

## Future Enhancements

1. **Quantized Embeddings**: int8 instead of float32 for 4x memory savings
2. **HNSW Index**: Faster approximate search for large caches
3. **Predictive Prefetching**: Cache likely next queries
4. **Local LLM Fallback**: TinyLLM for offline operation
5. **Multi-modal**: Support image embeddings
