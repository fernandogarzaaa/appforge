# RTX 2060 Optimization Guide for Hybrid AI Deployment

> **Target Hardware:** NVIDIA RTX 2060 (6GB GDDR6)  
> **Last Updated:** February 24, 2026  
> **Purpose:** Maximize local inference performance for hybrid cloud/edge AI systems

---

## 1. Hardware Overview

### 1.1 RTX 2060 Specifications

| Component | Specification | Impact on AI |
|-----------|--------------|--------------|
| **VRAM** | 6GB GDDR6 | Limits max model size to ~4B params (Q4) |
| **Memory Bandwidth** | 336 GB/s | Good for inference, not training |
| **CUDA Cores** | 1,920 | Decent parallel processing |
| **Tensor Cores** | 240 (Gen 1) | Limited FP16 acceleration |
| **PCIe** | 3.0 x16 | ~16 GB/s bandwidth |
| **Architecture** | Turing | CUDA 7.5+ support |
| **TDP** | 160W | Manageable power draw |

### 1.2 Understanding 6GB VRAM Constraints

**VRAM Usage Breakdown:**
```
Total VRAM: 6.0 GB
├── Model Weights: 2.0-3.5 GB
├── KV Cache: 0.5-1.5 GB
├── Activation/Temp: 0.5-1.0 GB
├── Embeddings: 0.2-0.5 GB
├── System Overhead: 0.5 GB
└── Available Buffer: 0.5-1.0 GB
```

**Key Insight:** You can run one 3B model OR two 1.5B models, but not two 3B models simultaneously.

---

## 2. Model Selection Guide

### 2.1 Recommended Local Models

**Tier 1: Fastest (1-2GB VRAM)**

| Model | Size | Quantization | VRAM | Speed | Quality | Best For |
|-------|------|--------------|------|-------|---------|----------|
| Llama 3.2 1B | 1.0B | Q4_K_M | ~0.8GB | Very Fast | Good | Quick Q&A |
| Qwen2.5 0.5B | 0.5B | Q4_K_M | ~0.4GB | Ultra Fast | OK | Classification |
| Gemma 2 2B | 2.0B | Q4_K_M | ~1.5GB | Fast | Good | General tasks |
| Phi-3 3.8B | 3.8B | Q4_K_M | ~2.5GB | Fast | Good | Reasoning |

**Tier 2: Balanced (2-4GB VRAM)** ⭐ RECOMMENDED

| Model | Size | Quantization | VRAM | Speed | Quality | Best For |
|-------|------|--------------|------|-------|---------|----------|
| Llama 3.2 3B | 3.0B | Q4_K_M | ~2.0GB | Fast | Better | Daily driver |
| Qwen2.5 3B | 3.0B | Q4_K_M | ~2.0GB | Fast | Better | Coding, RAG |
| Qwen2.5-Coder 3B | 3.0B | Q4_K_M | ~2.0GB | Fast | Better | Code completion |
| Mistral 7B | 7.0B | Q4_K_M | ~4.5GB | Moderate | Best | Heavy reasoning |

**Tier 3: MoE Models (Variable VRAM)**

| Model | Active Params | VRAM | Speed | Quality | Notes |
|-------|---------------|------|-------|---------|-------|
| Llama 4 Scout | 17B (16E) | ~3.5GB | Fast | Excellent | Efficient MoE |
| Qwen3 MoE | Variable | Varies | Fast | Good | Router overhead |

### 2.2 Quantization Strategy

**Understanding Quantization Levels:**

| Format | Bits/Weight | Relative Size | Quality Loss | Speed |
|--------|-------------|---------------|--------------|-------|
| FP16 | 16 | 100% | 0% | Baseline |
| Q8_0 | 8 | 50% | ~1% | Fast |
| Q6_K | 6 | 38% | ~2% | Fast |
| Q5_K_M | 5 | 31% | ~3% | Fast |
| **Q4_K_M** | **4** | **25%** | **~4%** | **Fastest** ⭐ |
| Q3_K_M | 3 | 19% | ~8% | Fastest |
| Q2_K | 2 | 13% | ~15% | Fastest |

**Recommendation:** Use Q4_K_M for 3B+ models, Q5_K_M for 1-2B models.

### 2.3 Context Length vs Performance

**VRAM Impact by Context:**

| Context | KV Cache (3B Q4) | KV Cache (7B Q4) | Recommendation |
|---------|------------------|------------------|----------------|
| 512 | 128 MB | 256 MB | Minimal impact |
| 1024 | 256 MB | 512 MB | Good default |
| 2048 | 512 MB | 1.0 GB | Sweet spot |
| 4096 | 1.0 GB | 2.0 GB | Use carefully |
| 8192 | 2.0 GB | 4.0 GB | 7B models only |

**Best Practice:** Start with 2048 context and increase only when needed.

---

## 3. Embedding Models for 6GB VRAM

### 3.1 Recommended Embedding Models

| Model | Dimensions | Size | VRAM | Batch 32 | Batch 64 | Best For |
|-------|------------|------|------|----------|----------|----------|
| **all-MiniLM-L6-v2** ⭐ | 384 | 23MB | ~500MB | 50ms | 80ms | General RAG |
| all-MiniLM-L12-v2 | 384 | 34MB | ~600MB | 70ms | 110ms | Better quality |
| paraphrase-MiniLM-L3-v2 | 384 | 17MB | ~300MB | 35ms | 55ms | Speed priority |
| nomic-embed-text-v1.5 | 768 | 130MB | ~1GB | 90ms | 150ms | MTEB leader |
| mxbai-embed-large | 1024 | 335MB | ~2GB | 150ms | 280ms | Best quality |
| bge-small-en-v1.5 | 384 | 33MB | ~600MB | 65ms | 100ms | Retrieval |

### 3.2 Embedding Batch Sizing

**Optimal Batch Sizes by Model:**

```python
# all-MiniLM-L6-v2 (Recommended)
OPTIMAL_BATCH = 32        # Best throughput/speed balance
MAX_BATCH = 256           # Maximum before OOM
MAX_SEQ_LENGTH = 512      # Truncate longer texts

# nomic-embed-text-v1.5
OPTIMAL_BATCH = 16        # Higher dims = smaller batches
MAX_BATCH = 128
MAX_SEQ_LENGTH = 8192     # Supports long docs
```

**Batching Strategy:**
```python
# Group texts by length for efficient padding
def batch_texts(texts, batch_size=32):
    # Sort by length to minimize padding
    sorted_texts = sorted(texts, key=len)
    return [sorted_texts[i:i+batch_size] 
            for i in range(0, len(sorted_texts), batch_size)]
```

---

## 4. Memory Management Strategies

### 4.1 VRAM Optimization Techniques

**1. Model Loading Strategy:**
```bash
# Use mmap for faster loading, less RAM
./llama-server -m model.gguf --mmap

# Or preload to VRAM for fastest inference
./llama-server -m model.gguf --gpu-layers 35
```

**2. GPU Layer Offloading:**

| Model | Layers | Recommended | VRAM Used |
|-------|--------|-------------|-----------|
| Llama 3.2 3B | 28 | 28 (all) | ~2.0 GB |
| Qwen2.5 3B | 36 | 36 (all) | ~2.2 GB |
| Mistral 7B | 32 | 28 | ~4.5 GB |
| Phi-3 3.8B | 32 | 32 (all) | ~2.8 GB |

**3. KV Cache Management:**
```python
# Enable KV cache quantization
--cache-type-k q4_0
--cache-type-v q4_0

# Clear cache between unrelated conversations
# Saves ~50% of KV cache VRAM
```

### 4.2 Multi-Model Memory Sharing

**Scenario: Embedding + LLM Concurrent:**
```
Total: 6.0 GB
├── Embedding (all-MiniLM-L6-v2): 0.5 GB
├── LLM (Llama 3.2 3B Q4): 2.0 GB
├── KV Cache (2048 ctx): 0.5 GB
├── Overhead: 0.5 GB
└── Free: 2.5 GB ✅
```

**Scenario: Two Small Models:**
```
Total: 6.0 GB
├── Model A (Llama 3.2 1B): 0.8 GB
├── Model B (Qwen-Coder 1.5B): 1.0 GB
├── KV Cache A: 0.3 GB
├── KV Cache B: 0.3 GB
├── Overhead: 0.5 GB
└── Free: 3.1 GB ✅
```

### 4.3 Swap and CPU Offloading

**When to Use CPU Offloading:**
- Model > 4GB quantized
- Context > 4096 tokens
- Batch inference needed

**Configuration:**
```bash
# Offload some layers to CPU
./llama-server -m model.gguf -ngl 20  # GPU layers: 20, rest on CPU

# This trades speed for capacity
# ~50% slower but fits larger models
```

---

## 5. PCIe Bandwidth Considerations

### 5.1 PCIe 3.0 x16 Performance

**Bandwidth:** ~16 GB/s (theoretical), ~12 GB/s (practical)

**Impact on Workloads:**

| Operation | Data Size | PCIe Time | GPU Time | Bottleneck? |
|-----------|-----------|-----------|----------|-------------|
| Model Load (3B Q4) | 2 GB | ~170ms | - | Minimal |
| Model Load (7B Q4) | 4 GB | ~340ms | - | Acceptable |
| Embed Batch (32) | 50 MB | ~5ms | 50ms | No |
| Prompt (1K tokens) | 4 KB | <1ms | 10ms | No |
| Token Generation | 2 KB/tok | <1ms | 20ms | No |

**Key Insight:** PCIe is NOT a bottleneck for inference. Focus on GPU compute.

### 5.2 Optimization Strategies

**1. Keep Models Loaded:**
```python
# DON'T: Load/unload for each request
# DO: Keep server running with model in VRAM

# Use llama-cpp-python server mode
from llama_cpp.server import app
# Model stays resident in VRAM
```

**2. Batch Embedding Requests:**
```python
# DON'T: Embed one at a time
for text in texts:
    embedding = model.encode(text)  # Slow!

# DO: Batch process
embeddings = model.encode(texts, batch_size=32)  # Fast!
```

**3. Pre-allocate Buffers:**
```python
# Reserve VRAM upfront to avoid fragmentation
CUDA_MALLOC_ASYNC_ENABLE=1
PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512
```

---

## 6. Semantic Caching on RTX 2060

### 6.1 FAISS GPU Setup

**Recommended Index Types:**

```python
import faiss

# Small cache (< 100K vectors): Exact search
index = faiss.IndexFlatIP(384)  # Inner product (cosine similarity)
res = faiss.StandardGpuResources()
gpu_index = faiss.index_cpu_to_gpu(res, 0, index)

# Medium cache (100K - 1M): IVF
nlist = 100  # Number of clusters
quantizer = faiss.IndexFlatIP(384)
index = faiss.IndexIVFFlat(quantizer, 384, nlist)

# Large cache (> 1M): IVF-PQ for memory efficiency
index = faiss.IndexIVFPQ(quantizer, 384, nlist, 8, 8)
```

### 6.2 Cache Size Planning

| Cache Size | Vectors | FAISS Memory | Query Time | Best For |
|------------|---------|--------------|------------|----------|
| Tiny | 10K | 15 MB | 0.1ms | Personal |
| Small | 100K | 150 MB | 0.5ms | Small team |
| Medium | 500K | 750 MB | 2ms | Department |
| Large | 1M | 1.5 GB | 5ms | Enterprise |

**Recommendation:** Start with 100K cache, scale based on hit rate.

### 6.3 Similarity Thresholds

**Threshold Selection:**

```python
# Cosine similarity thresholds
def get_cache_threshold(use_case):
    thresholds = {
        'exact_match': 0.99,      # Identical queries
        'similar': 0.95,          # Same intent, different words
        'paraphrase': 0.90,       # Related meaning
        'fuzzy': 0.85,            # Loose match
    }
    return thresholds.get(use_case, 0.95)

# Hybrid approach
def check_cache(query_embedding, index, threshold=0.95):
    D, I = index.search(query_embedding.reshape(1, -1), k=1)
    if D[0][0] > threshold:
        return I[0][0], D[0][0]  # cache_hit, similarity
    return None, D[0][0]
```

---

## 7. Recommended Configurations

### 7.1 Minimal Setup (All Local)

**For: Offline-first, maximum privacy**

```yaml
Hardware: RTX 2060 6GB
Models:
  LLM: Llama 3.2 3B Q4_K_M (2GB)
  Embedding: all-MiniLM-L6-v2 (500MB)
  Cache: FAISS GPU IndexFlatL2 (150MB)
Context: 2048 tokens
Expected:
  - Tokens/sec: 30-50
  - Latency: 20-40ms/token
  - Cache hit rate: 30-60%
```

### 7.2 Balanced Hybrid Setup ⭐ RECOMMENDED

**For: Best cost/performance ratio**

```yaml
Hardware: RTX 2060 6GB
Local:
  LLM: Llama 3.2 3B Q4_K_M (2GB)
  Embedding: all-MiniLM-L6-v2 (500MB)
  Cache: FAISS GPU (500MB)
  
Cloud:
  Primary: Groq (free tier)
  Fallback: OpenRouter (free models)
  Coding: Together AI ($5 credit)
  
Routing:
  - Simple Q&A: Local
  - Complex tasks: Groq
  - Code: Together AI
  - Fallback: OpenRouter
  
Expected:
  - Local tokens/sec: 30-50
  - Cloud latency: 100-500ms total
  - Monthly cost: $0-10
```

### 7.3 Maximum Performance

**For: Speed priority, budget available**

```yaml
Hardware: RTX 2060 6GB
Local:
  Embedding: nomic-embed-text-v1.5 (1GB)
  Cache: FAISS GPU (1GB)
  
Cloud:
  Primary: Groq (Llama 4 Maverick)
  Coding: Groq (GPT OSS 20B)
  Heavy: Fireworks (DeepSeek V3)
  
Expected:
  - Cloud TPS: 500-1000
  - Total latency: 50-200ms
  - Monthly cost: $10-30
```

---

## 8. Performance Benchmarks

### 8.1 Expected Token Generation Speed

| Model | Quantization | Context | Tokens/Sec | ms/Token |
|-------|--------------|---------|------------|----------|
| Llama 3.2 1B | Q4_K_M | 512 | 80-120 | 8-12 |
| Llama 3.2 3B | Q4_K_M | 512 | 40-60 | 16-25 |
| Qwen2.5 3B | Q4_K_M | 512 | 35-55 | 18-28 |
| Phi-3 3.8B | Q4_K_M | 512 | 30-50 | 20-33 |
| Mistral 7B | Q4_K_M | 512 | 15-25 | 40-65 |

### 8.2 Embedding Throughput

| Model | Batch 1 | Batch 8 | Batch 32 | Batch 64 |
|-------|---------|---------|----------|----------|
| all-MiniLM-L6-v2 | 5ms | 15ms | 50ms | 80ms |
| nomic-embed-text | 10ms | 35ms | 90ms | 150ms |
| mxbai-embed-large | 20ms | 70ms | 180ms | 320ms |

---

## 9. Troubleshooting

### 9.1 Out of Memory (OOM) Errors

**Solutions:**
1. Reduce context length: `--ctx-size 2048` instead of 4096
2. Use smaller model: Switch 7B → 3B
3. Lower quantization: Q4 → Q3 (if quality acceptable)
4. Reduce batch size: 64 → 32
5. Offload layers: `-ngl 20` instead of 35

### 9.2 Slow Token Generation

**Solutions:**
1. Ensure all layers on GPU: Check `-ngl` parameter
2. Use flash attention: `--flash-attn`
3. Reduce context size
4. Check PCIe link: `nvidia-smi` should show x16
5. Close other GPU applications

### 9.3 Cache Misses Too High

**Solutions:**
1. Lower similarity threshold: 0.95 → 0.90
2. Increase cache size
3. Normalize embeddings before storage
4. Use query preprocessing (stemming, etc.)

---

## 10. Quick Reference Commands

### 10.1 llama.cpp Server

```bash
# Start with RTX 2060 optimized settings
./llama-server \
  -m models/llama-3.2-3b-q4_k_m.gguf \
  -c 2048 \
  -ngl 35 \
  --host 0.0.0.0 \
  --port 8080 \
  --flash-attn

# With KV cache quantization
./llama-server \
  -m models/llama-3.2-3b-q4_k_m.gguf \
  -c 4096 \
  -ngl 35 \
  --cache-type-k q4_0 \
  --cache-type-v q4_0
```

### 10.2 Ollama (Easier Setup)

```bash
# Pull optimized model
ollama pull llama3.2:3b

# Run with custom settings
ollama run llama3.2:3b \
  --ctx-size 2048 \
  --gpu-layers 35
```

### 10.3 Python (llama-cpp-python)

```python
from llama_cpp import Llama

llm = Llama(
    model_path="models/llama-3.2-3b-q4_k_m.gguf",
    n_ctx=2048,
    n_gpu_layers=35,
    n_batch=512,
    verbose=False
)

output = llm(
    "Explain quantum computing:",
    max_tokens=256,
    temperature=0.7
)
```

---

## 11. Summary

### Key Takeaways

1. **Best Local Model:** Llama 3.2 3B Q4_K_M (2GB VRAM, good quality, fast)
2. **Best Embedding:** all-MiniLM-L6-v2 (500MB VRAM, excellent speed)
3. **Optimal Context:** 2048 tokens (sweet spot for VRAM/speed)
4. **Cache Strategy:** FAISS GPU IndexFlatL2 for <100K vectors
5. **Cloud Partner:** Groq (fastest, best free tier)

### VRAM Budget Template

```
Available: 6.0 GB
Used:
  - LLM (3B Q4):      2.0 GB
  - Embedding:        0.5 GB  
  - Cache (100K):     0.2 GB
  - KV Cache:         0.5 GB
  - Overhead:         0.5 GB
  ------------------------
  Total:              3.7 GB
  Free:               2.3 GB ✅ (38% headroom)
```

---

*Guide compiled for Clawd Hybrid RTX deployment*  
*For updates, check https://github.com/ggerganov/llama.cpp and provider docs*
