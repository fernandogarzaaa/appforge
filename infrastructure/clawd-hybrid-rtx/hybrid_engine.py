"""
Hybrid Inference Engine for Clawd Hybrid RTX
Core engine that combines local GPU embeddings with cloud LLM inference.
Optimized for RTX 2060 6GB VRAM.
"""

import os
import asyncio
import aiohttp
import logging
from typing import AsyncIterator, Optional, List, Dict, Any, Union, Callable
from dataclasses import dataclass
from enum import Enum
from contextlib import asynccontextmanager

# Import local modules
from semantic_cache import SemanticCache, create_cache
from batch_manager import BatchManager, create_batch_processor

logger = logging.getLogger(__name__)


class RoutingDecision(Enum):
    """Decision for request routing."""
    CACHE_HIT = "cache_hit"
    LOCAL_FALLBACK = "local_fallback"
    CLOUD_API = "cloud_api"


@dataclass
class InferenceResult:
    """Result from an inference request."""
    query: str
    response: str
    source: str  # 'cache', 'local', 'cloud'
    model: str
    latency_ms: float
    tokens_used: Optional[int] = None
    cost_estimate: Optional[float] = None


class HybridInferenceEngine:
    """
    Hybrid inference engine combining local embeddings with cloud LLMs.
    
    Architecture:
    1. Semantic cache check (local, < 50ms)
    2. On miss: batch and route to cloud API
    3. Stream responses back progressively
    4. Cache responses for future queries
    
    Hardware Constraints (RTX 2060 6GB):
    - Embedding model: ~1GB VRAM (all-MiniLM-L6-v2)
    - Remaining VRAM for other local processing
    """
    
    # Supported cloud providers
    PROVIDERS = {
        "openrouter": {
            "base_url": "https://openrouter.ai/api/v1",
            "default_model": "meta-llama/llama-3.1-8b-instruct:free",
        },
        "together": {
            "base_url": "https://api.together.xyz/v1",
            "default_model": "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
        },
    }
    
    DEFAULT_CONFIG = {
        # Cache configuration
        "cache_similarity_threshold": 0.92,
        "cache_ttl_seconds": 3600,
        "cache_max_entries": 10000,
        
        # Batch configuration
        "batch_max_size": 5,  # Conservative for RTX 2060
        "batch_timeout_ms": 50,
        
        # Provider configuration
        "primary_provider": "openrouter",
        "fallback_provider": "together",
        "timeout_seconds": 30,
        
        # Local configuration
        "use_gpu_for_embeddings": False,  # Default to CPU to save VRAM
        "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
        
        # Streaming
        "enable_streaming": True,
        "stream_chunk_size": 64,
    }
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the hybrid inference engine.
        
        Args:
            config: Configuration dictionary (overrides defaults + env vars)
        """
        self.config = self._load_config(config)
        
        # Initialize components (lazy loading for heavy resources)
        self._cache: Optional[SemanticCache] = None
        self._batch_manager: Optional[BatchManager] = None
        self._session: Optional[aiohttp.ClientSession] = None
        self._initialized = False
        
        # API keys (loaded from environment)
        self._api_keys = {
            "openrouter": os.getenv("OPENROUTER_API_KEY"),
            "together": os.getenv("TOGETHER_API_KEY"),
        }
        
        # Metrics
        self._request_count = 0
        self._cache_hit_count = 0
        self._cloud_request_count = 0
    
    def _load_config(self, override: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Load configuration from defaults + environment + overrides."""
        config = self.DEFAULT_CONFIG.copy()
        
        # Environment variable overrides
        env_mappings = {
            "CLAWD_CACHE_THRESHOLD": ("cache_similarity_threshold", float),
            "CLAWD_CACHE_TTL": ("cache_ttl_seconds", int),
            "CLAWD_BATCH_SIZE": ("batch_max_size", int),
            "CLAWD_PRIMARY_PROVIDER": ("primary_provider", str),
            "CLAWD_USE_GPU": ("use_gpu_for_embeddings", lambda x: x.lower() == "true"),
            "CLAWD_ENABLE_STREAMING": ("enable_streaming", lambda x: x.lower() == "true"),
        }
        
        for env_var, (config_key, cast_fn) in env_mappings.items():
            value = os.getenv(env_var)
            if value is not None:
                try:
                    config[config_key] = cast_fn(value)
                except (ValueError, TypeError):
                    logger.warning(f"Invalid value for {env_var}: {value}")
        
        # User-provided overrides
        if override:
            config.update(override)
        
        return config
    
    async def initialize(self) -> None:
        """Initialize all components."""
        if self._initialized:
            return
        
        # Initialize HTTP session
        self._session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.config["timeout_seconds"]),
            headers={"Content-Type": "application/json"}
        )
        
        # Initialize semantic cache
        cache_config = {
            "similarity_threshold": self.config["cache_similarity_threshold"],
            "default_ttl_seconds": self.config["cache_ttl_seconds"],
            "max_entries": self.config["cache_max_entries"],
            "use_gpu": self.config["use_gpu_for_embeddings"],
            "embedding_model": self.config["embedding_model"],
        }
        self._cache = create_cache(cache_config)
        
        # Initialize batch manager
        batch_config = {
            "max_batch_size": self.config["batch_max_size"],
            "batch_timeout_ms": self.config["batch_timeout_ms"],
            "deduplicate_requests": True,
        }
        self._batch_manager = create_batch_processor(
            self._process_cloud_batch,
            batch_config
        )
        await self._batch_manager.start()
        
        self._initialized = True
        logger.info("HybridInferenceEngine initialized")
    
    async def close(self) -> None:
        """Clean up resources."""
        if self._batch_manager:
            await self._batch_manager.stop()
        
        if self._cache:
            await asyncio.get_event_loop().run_in_executor(None, self._cache.close)
        
        if self._session:
            await self._session.close()
        
        self._initialized = False
        logger.info("HybridInferenceEngine closed")
    
    @asynccontextmanager
    async def session(self):
        """Context manager for engine sessions."""
        await self.initialize()
        try:
            yield self
        finally:
            await self.close()
    
    async def generate(
        self, 
        query: str,
        stream: bool = False,
        callback: Optional[Callable[[str], None]] = None
    ) -> Union[str, AsyncIterator[str]]:
        """
        Generate a response for the given query.
        
        Args:
            query: The input query
            stream: If True, return an async iterator of chunks
            callback: Optional callback for streaming (called with each chunk)
        
        Returns:
            Response string if stream=False, AsyncIterator if stream=True
        """
        if not self._initialized:
            await self.initialize()
        
        self._request_count += 1
        
        # Step 1: Check semantic cache
        cache_result = await self._cache.get(query)
        if cache_result:
            self._cache_hit_count += 1
            logger.debug(f"Cache hit for: {query[:50]}...")
            
            if stream:
                return self._stream_from_string(cache_result.response, callback)
            return cache_result.response
        
        # Step 2: Route to cloud API (batched)
        logger.debug(f"Cache miss, routing to cloud: {query[:50]}...")
        
        if stream:
            return self._generate_streaming(query, callback)
        
        return await self._generate_sync(query)
    
    async def generate_batch(
        self, 
        queries: List[str]
    ) -> List[InferenceResult]:
        """
        Generate responses for multiple queries efficiently.
        
        Args:
            queries: List of input queries
        
        Returns:
            List of InferenceResult objects
        """
        if not self._initialized:
            await self.initialize()
        
        results = []
        cache_misses = []
        
        # Check cache for all queries first
        for i, query in enumerate(queries):
            cache_result = await self._cache.get(query)
            if cache_result:
                self._cache_hit_count += 1
                results.append(InferenceResult(
                    query=query,
                    response=cache_result.response,
                    source="cache",
                    model=cache_result.model_used,
                    latency_ms=0
                ))
            else:
                cache_misses.append((i, query))
                results.append(None)  # Placeholder
        
        # Process cache misses in batch
        if cache_misses:
            miss_queries = [q for _, q in cache_misses]
            responses = await self._batch_manager.submit_batch(miss_queries)
            
            for (original_idx, query), response in zip(cache_misses, responses):
                # Cache the response
                await self._cache.put(
                    query, 
                    response,
                    model_used=self.config["primary_provider"]
                )
                
                results[original_idx] = InferenceResult(
                    query=query,
                    response=response,
                    source="cloud",
                    model=self.config["primary_provider"],
                    latency_ms=0  # Would track actual time
                )
                self._cloud_request_count += 1
        
        return results
    
    async def _generate_sync(self, query: str) -> str:
        """Generate a synchronous response."""
        response = await self._batch_manager.submit(query)
        
        # Cache the response
        await self._cache.put(
            query,
            response,
            model_used=self.config["primary_provider"]
        )
        
        self._cloud_request_count += 1
        return response
    
    async def _generate_streaming(
        self, 
        query: str,
        callback: Optional[Callable[[str], None]]
    ) -> AsyncIterator[str]:
        """Generate a streaming response."""
        # For now, simulate streaming by chunking the response
        # In production, this would use SSE from the cloud API
        response = await self._generate_sync(query)
        
        return self._stream_from_string(response, callback)
    
    async def _stream_from_string(
        self, 
        text: str,
        callback: Optional[Callable[[str], None]]
    ) -> AsyncIterator[str]:
        """Create an async iterator from a string, simulating streaming."""
        chunk_size = self.config["stream_chunk_size"]
        
        async def iterator():
            for i in range(0, len(text), chunk_size):
                chunk = text[i:i + chunk_size]
                if callback:
                    callback(chunk)
                yield chunk
                await asyncio.sleep(0.01)  # Simulate network delay
        
        return iterator()
    
    async def _process_cloud_batch(self, queries: List[str]) -> List[str]:
        """Process a batch of queries via cloud API."""
        provider = self.config["primary_provider"]
        api_key = self._api_keys.get(provider)
        
        if not api_key:
            # Try fallback provider
            provider = self.config["fallback_provider"]
            api_key = self._api_keys.get(provider)
            
            if not api_key:
                raise ValueError(
                    f"No API key found for {self.config['primary_provider']} "
                    f"or fallback {self.config['fallback_provider']}. "
                    f"Set {provider.upper()}_API_KEY environment variable."
                )
        
        provider_config = self.PROVIDERS.get(provider, self.PROVIDERS["openrouter"])
        
        # Build requests
        messages_batch = [
            [{"role": "user", "content": q}] for q in queries
        ]
        
        # For single query, simple request
        if len(queries) == 1:
            return [await self._call_cloud_api(
                provider, 
                api_key, 
                provider_config,
                messages_batch[0]
            )]
        
        # For batch, use asyncio.gather
        tasks = [
            self._call_cloud_api(provider, api_key, provider_config, messages)
            for messages in messages_batch
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Convert exceptions to error strings
        responses = []
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Cloud API error: {result}")
                responses.append(f"Error: {str(result)}")
            else:
                responses.append(result)
        
        return responses
    
    async def _call_cloud_api(
        self,
        provider: str,
        api_key: str,
        provider_config: Dict[str, Any],
        messages: List[Dict[str, str]]
    ) -> str:
        """Make a single call to the cloud API."""
        url = f"{provider_config['base_url']}/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        
        # Add OpenRouter-specific headers
        if provider == "openrouter":
            headers["HTTP-Referer"] = "https://clawd.ai"
            headers["X-Title"] = "Clawd Hybrid RTX"
        
        payload = {
            "model": provider_config["default_model"],
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 1024,
        }
        
        async with self._session.post(
            url, 
            headers=headers, 
            json=payload
        ) as response:
            if response.status != 200:
                text = await response.text()
                raise Exception(f"API error {response.status}: {text}")
            
            data = await response.json()
            return data["choices"][0]["message"]["content"]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get engine statistics."""
        cache_stats = self._cache.get_stats() if self._cache else {}
        batch_stats = self._batch_manager.get_stats() if self._batch_manager else {}
        
        return {
            "requests": {
                "total": self._request_count,
                "cache_hits": self._cache_hit_count,
                "cloud_requests": self._cloud_request_count,
                "cache_hit_rate": (
                    self._cache_hit_count / max(1, self._request_count)
                ),
            },
            "cache": cache_stats,
            "batch": batch_stats,
            "config": self.config,
        }
    
    async def invalidate_cache(self, query: Optional[str] = None) -> int:
        """
        Invalidate cache entries.
        
        Args:
            query: If provided, invalidate only this query. If None, clear all.
        
        Returns:
            Number of entries invalidated
        """
        if self._cache:
            # Run sync cache method in executor
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(
                None, 
                lambda: self._cache.invalidate(query)
            )
        return 0


# Convenience functions
async def create_engine(config: Optional[Dict[str, Any]] = None) -> HybridInferenceEngine:
    """Factory function to create and initialize an engine."""
    engine = HybridInferenceEngine(config)
    await engine.initialize()
    return engine


# Simple CLI interface for testing
async def main():
    """CLI interface for testing the engine."""
    logging.basicConfig(level=logging.INFO)
    
    # Check for API keys
    if not os.getenv("OPENROUTER_API_KEY") and not os.getenv("TOGETHER_API_KEY"):
        print("Error: Set OPENROUTER_API_KEY or TOGETHER_API_KEY environment variable")
        return
    
    engine = await create_engine()
    
    print("Clawd Hybrid RTX - Interactive Mode")
    print("Type 'exit' to quit, 'stats' for statistics\n")
    
    try:
        while True:
            query = input("You: ").strip()
            
            if query.lower() == 'exit':
                break
            
            if query.lower() == 'stats':
                import json
                print(json.dumps(engine.get_stats(), indent=2, default=str))
                continue
            
            if not query:
                continue
            
            print("Clawd: ", end="", flush=True)
            
            # Stream response
            async for chunk in await engine.generate(query, stream=True):
                print(chunk, end="", flush=True)
            
            print("\n")
    
    except KeyboardInterrupt:
        print("\nGoodbye!")
    finally:
        await engine.close()


if __name__ == "__main__":
    asyncio.run(main())
