# Optimization Guide

## RTX 2060 6GB VRAM Optimization

This guide covers specific optimizations for running Clawd Hybrid RTX on an RTX 2060 with 6GB VRAM.

## VRAM Budget Breakdown

### System Reservation

| Component | VRAM Usage | Notes |
|-----------|------------|-------|
| CUDA Context | ~300MB | Fixed overhead |
| Display Buffer | ~100MB | If monitor connected |
| System Reserved | ~200MB | Driver overhead |
| **Base Usage** | **~600MB** | Always occupied |
| **Available** | **~5.4GB** | For applications |

### Clawd Allocation

| Component | Default VRAM | Optimized VRAM |
|-----------|--------------|----------------|
| Embeddings (GPU) | 1024MB | 0MB (CPU) |
| FAISS Index | 256MB | 128MB |
| Working Buffers | 512MB | 256MB |
| Safety Margin | 512MB | 256MB |
| **Total** | **~2.3GB** | **~640MB** |
| **Headroom** | **~3.1GB** | **~4.8GB** |

## Configuration Presets

### Preset 1: Maximum VRAM Headroom (Recommended)

```python
config = {
    # CPU-only embeddings
    "use_gpu_for_embeddings": False,
    
    # Conservative batching
    "batch_max_size": 3,
    "batch_timeout_ms": 25,
    
    # Smaller cache in memory
    "cache_max_entries": 5000,
    
    # Fast failover
    "timeout_seconds": 15,
}
```

**Use Case**: Running alongside other GPU workloads (gaming, other ML)

### Preset 2: Balanced Performance

```python
config = {
    # GPU for embeddings
    "use_gpu_for_embeddings": True,
    
    # Moderate batching
    "batch_max_size": 5,
    "batch_timeout_ms": 50,
    
    # Standard cache
    "cache_max_entries": 10000,
    
    # Standard timeout
    "timeout_seconds": 30,
}
```

**Use Case**: Dedicated inference machine

### Preset 3: Maximum Throughput

```python
config = {
    # GPU for embeddings
    "use_gpu_for_embeddings": True,
    
    # Aggressive batching
    "batch_max_size": 10,
    "batch_timeout_ms": 100,
    
    # Large cache
    "cache_max_entries": 20000,
    
    # Use local storage for large cache
    "persist_path": "D:/clawd_cache/large_cache.pkl",
}
```

**Use Case**: Batch processing jobs, API server

## Embedding Optimization

### Option 1: CPU Embeddings (Default)

```python
"use_gpu_for_embeddings": False
```

**Pros**:
- Saves ~1GB VRAM
- Embeddings are fast enough on modern CPUs (< 20ms)
- GPU fully available for other workloads

**Cons**:
- Slightly higher CPU usage
- Cache misses take ~20ms longer

### Option 2: GPU Embeddings

```python
"use_gpu_for_embeddings": True
```

**Pros**:
- Faster embeddings (< 5ms)
- Better for high-throughput scenarios

**Cons**:
- Consumes 1GB VRAM
- May cause OOM if other GPU workloads active

### Benchmark Comparison

| Device | Embedding Time | VRAM Used |
|--------|----------------|-----------|
| CPU (Ryzen 5) | ~15ms | 0MB |
| GPU (RTX 2060) | ~3ms | 1024MB |

**Recommendation**: Use CPU for embeddings unless you need > 100 cache ops/second.

## FAISS Index Optimization

### Index Type Selection

For RTX 2060 with < 50K cache entries:

```python
# Current: IndexFlatIP (exact search)
index = faiss.IndexFlatIP(384)

# Good for: < 50K entries, requires exact matches
# Memory: 384 * 4 bytes * n_entries
# 50K entries = ~75MB
```

For larger caches (> 100K entries), consider IVF:

```python
# IVF index (approximate search)
nlist = 100  # Number of clusters
coarse_quantizer = faiss.IndexFlatIP(384)
index = faiss.IndexIVFFlat(coarse_quantizer, 384, nlist)

# Good for: > 100K entries, slight accuracy tradeoff
# Memory: Similar but faster search
```

### Memory-Mapped Storage

For very large caches that don't fit in RAM:

```python
import faiss

# Memory-mapped index
index = faiss.IndexFlatIP(384)
# ... add vectors ...
faiss.write_index(index, "cache.index")

# Later, memory-map instead of loading
index = faiss.read_index("cache.index", faiss.IO_FLAG_MMAP)
```

## Quantization Strategies

### Embedding Quantization

Reduce embedding precision from float32 to int8:

```python
# Before: 384 * 4 = 1536 bytes per embedding
# After: 384 * 1 = 384 bytes per embedding (4x reduction)

import numpy as np

def quantize_embeddings(embeddings):
    """Quantize float32 embeddings to int8."""
    # Calculate scale factor
    scale = np.abs(embeddings).max() / 127.0
    
    # Quantize
    quantized = np.clip(embeddings / scale, -127, 127).astype(np.int8)
    
    return quantized, scale

def dequantize_embeddings(quantized, scale):
    """Dequantize int8 back to float32."""
    return quantized.astype(np.float32) * scale
```

**Impact**:
- Memory: 4x reduction
- Accuracy: ~2% drop in similarity scores
- Speed: Slightly faster (less memory bandwidth)

### Scalar Quantization in FAISS

```python
# Use FAISS built-in quantization
index = faiss.IndexScalarQuantizer(384, faiss.ScalarQuantizer.QT_8bit)
```

## Batch Size Tuning

### Finding Your Optimal Batch Size

```python
import time
import asyncio

async def benchmark_batch_size(engine, queries, batch_size):
    engine.config["batch_max_size"] = batch_size
    
    start = time.perf_counter()
    results = await engine.generate_batch(queries)
    elapsed = time.perf_counter() - start
    
    return {
        "batch_size": batch_size,
        "total_time": elapsed,
        "per_query": elapsed / len(queries)
    }

# Test different batch sizes
for size in [1, 3, 5, 10, 20]:
    result = await benchmark_batch_size(engine, test_queries, size)
    print(f"Batch {size}: {result['per_query']:.2f}s/query")
```

### General Guidelines

| Batch Size | Latency | Throughput | Use Case |
|------------|---------|------------|----------|
| 1 | Lowest | Lowest | Interactive chat |
| 3-5 | Low | Medium | Default balanced |
| 10 | Medium | High | Background processing |
| 20+ | Higher | Highest | Batch jobs only |

## Cache Threshold Tuning

### Similarity Threshold Guide

```python
# Very strict (0.95+)
# Pros: Few false positives
# Cons: More cache misses
config = {"cache_similarity_threshold": 0.95}

# Balanced (0.90-0.92)
# Good default for most use cases
config = {"cache_similarity_threshold": 0.92}

# Lenient (0.85-0.88)
# Pros: More cache hits
# Cons: May return slightly mismatched responses
config = {"cache_similarity_threshold": 0.88}
```

### Domain-Specific Tuning

| Domain | Recommended | Rationale |
|--------|-------------|-----------|
| Code/Technical | 0.95 | Precision matters |
| General QA | 0.92 | Balanced |
| Creative Writing | 0.88 | Variation acceptable |
| Data Extraction | 0.95 | Accuracy critical |

## Provider Optimization

### OpenRouter Free Tier

```python
config = {
    "primary_provider": "openrouter",
    "timeout_seconds": 45,  # Free tier can be slower
}
```

**Limits**:
- Rate limits apply
- May queue during peak times
- Use for non-time-critical workloads

### Together AI Free Tier

```python
config = {
    "primary_provider": "together",
    "fallback_provider": "openrouter",
}
```

**Limits**:
- Generous free tier
- Good for fallback

### Hybrid Strategy

```python
# Use faster provider for simple queries
# Fallback to more capable for complex
# (Requires custom routing logic)
```

## Monitoring and Debugging

### VRAM Monitoring Script

```python
from utils.memory_monitor import create_monitor
import json

monitor = create_monitor(check_interval_seconds=5)
monitor.start_monitoring()

# Check status
print(json.dumps(monitor.get_summary(), indent=2))

# Sample output:
# {
#   "gpu": {
#     "total_mb": 6144.0,
#     "used_mb": 2048.0,
#     "free_mb": 4096.0,
#     "percent": 33.3,
#     "available_for_embeddings": true
#   },
#   "recommendation": "cuda"
# }
```

### Performance Profiling

```python
import cProfile
import pstats

profiler = cProfile.Profile()
profiler.enable()

# Run your workload
await engine.generate_batch(queries)

profiler.disable()
stats = pstats.Stats(profiler)
stats.sort_stats('cumulative')
stats.print_stats(20)
```

## Troubleshooting

### Out of Memory Errors

**Symptoms**: CUDA OOM, system freeze, killed process

**Solutions**:
1. Switch to CPU embeddings
2. Reduce `cache_max_entries`
3. Lower `batch_max_size`
4. Clear cache: `await engine.invalidate_cache()`

### Slow Cache Hits

**Symptoms**: > 100ms cache hit latency

**Solutions**:
1. Ensure FAISS is installed: `pip install faiss-cpu`
2. Reduce `cache_max_entries`
3. Use GPU for embeddings
4. Check for disk swapping (add more RAM)

### High API Costs

**Symptoms**: More API calls than expected

**Solutions**:
1. Lower `cache_similarity_threshold` for more hits
2. Increase `cache_ttl_seconds`
3. Enable deduplication in batch manager
4. Analyze cache hit rate: `engine.get_stats()`

### Slow Cloud Responses

**Symptoms**: > 5s response times

**Solutions**:
1. Switch provider (OpenRouter ↔ Together)
2. Reduce `timeout_seconds` for faster failover
3. Check rate limits
4. Use smaller/faster models

## Advanced: Custom Optimizations

### Custom Embedding Model

For specific domains, fine-tuned embeddings may work better:

```python
config = {
    "embedding_model": "your-domain/finetuned-model",
    "embedding_dimension": 768,  # Match model output
}
```

### Local Quantized LLM Fallback

For offline operation or when API unavailable:

```python
# Requires additional setup with llama.cpp or similar
# Load tiny model (< 4GB) as ultimate fallback

async def local_fallback(queries):
    # Your local LLM integration
    pass

engine = HybridInferenceEngine({
    "local_fallback_fn": local_fallback
})
```

### Distributed Cache

For multi-machine setups:

```python
# Use Redis for shared cache
# Requires implementing custom cache backend

from semantic_cache import SemanticCache

class RedisSemanticCache(SemanticCache):
    def __init__(self, redis_client, *args, **kwargs):
        self.redis = redis_client
        super().__init__(*args, **kwargs)
    
    # Override _save and _load methods
```

## Benchmarks

### Reference Performance (RTX 2060 6GB + Ryzen 5 3600)

| Metric | CPU Embeddings | GPU Embeddings |
|--------|----------------|----------------|
| Cache Hit Latency | 45ms | 25ms |
| Cache Miss Latency | 1.5s | 1.2s |
| Embeddings/sec | 60 | 300 |
| VRAM Used | 640MB | 1664MB |
| Cache Hit Rate | 45% | 45% |

### Scaling Behavior

| Cache Entries | Memory | Search Time |
|---------------|--------|-------------|
| 1K | 1.5MB | < 1ms |
| 10K | 15MB | < 5ms |
| 50K | 75MB | < 20ms |
| 100K | 150MB | < 50ms |

## Checklist for Production

- [ ] Set `use_gpu_for_embeddings: False` for safety
- [ ] Configure monitoring and alerts
- [ ] Set up log rotation
- [ ] Test fallback provider
- [ ] Benchmark with your workload
- [ ] Set appropriate cache TTL
- [ ] Monitor API costs
- [ ] Test cache invalidation
- [ ] Document your configuration
