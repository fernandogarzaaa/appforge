# API Specification for Clawd Hybrid RTX

## Public Interfaces

### HybridInferenceEngine

Main entry point for hybrid inference.

```python
class HybridInferenceEngine:
    def __init__(self, config: Optional[Dict[str, Any]] = None)
    async def initialize(self) -> None
    async def close(self) -> None
    async def generate(
        self, 
        query: str,
        stream: bool = False,
        callback: Optional[Callable[[str], None]] = None
    ) -> Union[str, AsyncIterator[str]]
    async def generate_batch(self, queries: List[str]) -> List[InferenceResult]
    async def invalidate_cache(self, query: Optional[str] = None) -> int
    def get_stats(self) -> Dict[str, Any]
```

### SemanticCache

Vector-based semantic caching layer.

```python
class SemanticCache:
    def __init__(self, config: Optional[Dict[str, Any]] = None)
    async def get(self, query: str, threshold: Optional[float] = None) -> Optional[CacheEntry]
    async def put(
        self, 
        query: str, 
        response: str,
        model_used: str = "",
        ttl_seconds: Optional[int] = None
    ) -> None
    def invalidate(self, query: Optional[str] = None) -> int
    def get_stats(self) -> Dict[str, Any]
    def close(self) -> None
```

### BatchManager

Request batching and deduplication.

```python
class BatchManager:
    def __init__(
        self, 
        process_fn: Callable[[List[str]], Awaitable[List[str]]],
        config: Optional[Dict[str, Any]] = None
    )
    async def start(self) -> None
    async def stop(self) -> None
    async def submit(
        self, 
        query: str, 
        priority: int = 0,
        callback: Optional[Callable[[str], Awaitable[None]]] = None,
        wait_for_result: bool = True
    ) -> Optional[str]
    async def submit_batch(self, queries: List[str], priority: int = 0) -> List[str]
    def get_stats(self) -> Dict[str, Any]
    def clear_pending(self) -> int
```

## Data Types

### CacheEntry

```python
@dataclass
class CacheEntry:
    query: str              # Original query
    response: str           # Cached response
    embedding: np.ndarray   # 384-dim normalized embedding
    timestamp: datetime     # Creation time
    ttl_seconds: int        # Time-to-live
    hit_count: int          # Number of cache hits
    model_used: str         # Model that generated response
    
    def is_expired(self) -> bool
```

### InferenceResult

```python
@dataclass
class InferenceResult:
    query: str              # Input query
    response: str           # Generated response
    source: str            # 'cache', 'cloud', 'local'
    model: str             # Model/provider used
    latency_ms: float      # Response time
    tokens_used: Optional[int]
    cost_estimate: Optional[float]
```

### MemoryStats

```python
@dataclass
class MemoryStats:
    gpu_total_mb: float
    gpu_used_mb: float
    gpu_free_mb: float
    gpu_utilization: float
    cpu_total_mb: float
    cpu_used_mb: float
    cpu_available_mb: float
    cpu_percent: float
    timestamp: float
```

## Configuration Schema

### Full Configuration Object

```python
Config = {
    # Cache settings
    "cache_similarity_threshold": float,  # 0.0 - 1.0
    "cache_ttl_seconds": int,
    "cache_max_entries": int,
    "embedding_model": str,
    "use_gpu_for_embeddings": bool,
    
    # Batch settings
    "batch_max_size": int,
    "batch_timeout_ms": int,
    "max_concurrent_batches": int,
    "deduplicate_requests": bool,
    "adaptive_batching": bool,
    
    # Provider settings
    "primary_provider": str,      # "openrouter" | "together"
    "fallback_provider": str,
    "timeout_seconds": int,
    
    # Feature flags
    "enable_streaming": bool,
    "stream_chunk_size": int,
}
```

## Error Handling

### Exception Types

```python
class CacheError(Exception):
    """Raised when cache operations fail."""
    pass

class BatchError(Exception):
    """Raised when batch processing fails."""
    pass

class ProviderError(Exception):
    """Raised when cloud API calls fail."""
    code: int      # HTTP status code
    response: str  # Error response body
    
class ConfigurationError(Exception):
    """Raised when configuration is invalid."""
    pass
```

## Async Patterns

### Context Manager

```python
async with HybridInferenceEngine().session() as engine:
    result = await engine.generate("query")
# Automatically closes
```

### Streaming

```python
# Iterator pattern
async for chunk in await engine.generate("query", stream=True):
    print(chunk, end="")

# Callback pattern
def on_chunk(chunk: str):
    update_ui(chunk)

await engine.generate("query", callback=on_chunk)
```

### Batch with Progress

```python
queries = ["q1", "q2", "q3"]
results = await engine.generate_batch(queries)

for result in results:
    if result.source == "cache":
        print(f"Cached: {result.response}")
    else:
        print(f"Generated: {result.response}")
```

## Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| OPENROUTER_API_KEY | string | None | OpenRouter API key |
| TOGETHER_API_KEY | string | None | Together AI API key |
| CLAWD_USE_GPU | bool | false | Use GPU for embeddings |
| CLAWD_CACHE_THRESHOLD | float | 0.92 | Similarity threshold |
| CLAWD_CACHE_TTL | int | 3600 | Cache TTL seconds |
| CLAWD_BATCH_SIZE | int | 5 | Max batch size |
| CLAWD_PRIMARY_PROVIDER | string | "openrouter" | Primary provider |
| CLAWD_ENABLE_STREAMING | bool | true | Enable streaming |

## Type Hints

```python
from typing import (
    AsyncIterator, Optional, List, Dict, Any, 
    Union, Callable, Awaitable
)

Query = str
Response = str
Provider = Literal["openrouter", "together"]
StreamCallback = Callable[[str], None]
AsyncCallback = Callable[[str], Awaitable[None]]
```
