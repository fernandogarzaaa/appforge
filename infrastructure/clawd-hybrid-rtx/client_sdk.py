"""
Clawd Hybrid RTX - Python SDK
Official Python client for the Hybrid LLM API

Usage:
    from client_sdk import ClawdClient
    
    client = ClawdClient("http://localhost:8000")
    
    # Simple generation with cache
    response = client.generate("Explain quantum computing")
    print(response.response)
    
    # Streaming
    for token in client.generate_stream("Write a poem"):
        print(token, end="")
    
    # Batch for cost savings
    responses = client.batch([
        "What is AI?",
        "What is ML?",
        "What is DL?"
    ])

@version 1.0.0
"""
from typing import Optional, List, Dict, Any, Iterator, Union, Generator
from dataclasses import dataclass
from enum import Enum
import requests
import json
from urllib.parse import urljoin


class Provider(str, Enum):
    GROQ = "groq"
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    LOCAL = "local"
    AUTO = "auto"


class ModelTier(str, Enum):
    FAST = "fast"
    BALANCED = "balanced"
    QUALITY = "quality"
    CODING = "coding"


@dataclass
class GenerateResponse:
    """Response from generation endpoint"""
    response: str
    cache_hit: bool
    provider_used: str
    model_used: str
    cost_usd: float
    local_gpu_used: bool
    tokens_input: int
    tokens_output: int
    tokens_saved: int
    latency_ms: float
    request_id: str
    timestamp: str

    @property
    def total_tokens(self) -> int:
        return self.tokens_input + self.tokens_output
    
    @property
    def savings_usd(self) -> float:
        """Estimated savings from cache hit"""
        return self.tokens_saved * 0.000002 if self.cache_hit else 0


@dataclass
class BatchResponse:
    """Response from batch endpoint"""
    responses: List[GenerateResponse]
    total_cost_usd: float
    total_tokens_saved: int
    batch_size: int
    batch_id: str
    
    @property
    def average_cost(self) -> float:
        return self.total_cost_usd / self.batch_size if self.batch_size > 0 else 0


@dataclass
class EmbedResponse:
    """Response from embedding endpoint"""
    embeddings: List[List[float]]
    dimensions: int
    model_used: str
    local_gpu_used: bool
    latency_ms: float


@dataclass
class SimilarityResponse:
    """Response from similarity endpoint"""
    similarity: float
    distance: float
    model_used: str
    local_gpu_used: bool


@dataclass
class SearchResult:
    """Single search result"""
    id: str
    text: str
    score: float
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class SearchResponse:
    """Response from search endpoint"""
    results: List[SearchResult]
    query_embedding_time_ms: float
    search_time_ms: float
    total_results: int
    local_gpu_used: bool


@dataclass
class CacheStats:
    """Cache statistics"""
    total_entries: int
    hit_rate_24h: float
    hit_rate_7d: float
    total_hits: int
    total_misses: int
    tokens_saved_total: int
    estimated_savings_usd: float
    cache_size_mb: float
    oldest_entry: Optional[str] = None
    newest_entry: Optional[str] = None
    
    @property
    def hit_rate(self) -> float:
        total = self.total_hits + self.total_misses
        return self.total_hits / total if total > 0 else 0


@dataclass
class CostStats:
    """Cost tracking statistics"""
    total_spent_usd: float
    total_tokens_input: int
    total_tokens_output: int
    total_requests: int
    provider_breakdown: Dict[str, float]
    daily_average_7d: float
    projected_monthly_usd: float


@dataclass
class CostEstimate:
    """Cost estimate response"""
    estimated_cost_usd: float
    estimated_tokens_input: int
    estimated_tokens_output: int
    provider: str
    model: str
    cache_potential: float


@dataclass
class HealthStatus:
    """Health check response"""
    status: str
    services: Dict[str, str]
    version: str
    
    @property
    def healthy(self) -> bool:
        return self.status == "healthy"


class ClawdError(Exception):
    """Base exception for Clawd SDK"""
    def __init__(self, message: str, code: Optional[str] = None, request_id: Optional[str] = None):
        super().__init__(message)
        self.code = code
        self.request_id = request_id


class ClawdClient:
    """
    Official Python client for Clawd Hybrid RTX API
    
    Features:
    - Smart caching with automatic fallback
    - Streaming support
    - Batch operations for cost savings
    - Local GPU embedding
    - Cost tracking and estimation
    """
    
    def __init__(
        self,
        base_url: str = "http://localhost:8000",
        api_key: Optional[str] = None,
        timeout: float = 60.0,
        default_tier: ModelTier = ModelTier.BALANCED,
        default_provider: Provider = Provider.AUTO
    ):
        """
        Initialize Clawd client
        
        Args:
            base_url: API base URL (default: http://localhost:8000)
            api_key: Optional API key for authentication
            timeout: Request timeout in seconds
            default_tier: Default model tier for generation
            default_provider: Default provider (auto for smart routing)
        """
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout
        self.default_tier = default_tier
        self.default_provider = default_provider
        
        self._session = requests.Session()
        if api_key:
            self._session.headers["Authorization"] = f"Bearer {api_key}"
    
    def _request(
        self,
        method: str,
        endpoint: str,
        json_data: Optional[Dict] = None,
        stream: bool = False
    ) -> Union[Dict, requests.Response]:
        """Make HTTP request to API"""
        url = urljoin(self.base_url + "/", endpoint.lstrip("/"))
        
        try:
            response = self._session.request(
                method=method,
                url=url,
                json=json_data,
                timeout=self.timeout,
                stream=stream
            )
            response.raise_for_status()
            
            if stream:
                return response
            return response.json()
            
        except requests.exceptions.HTTPError as e:
            try:
                error_data = e.response.json()
                raise ClawdError(
                    error_data.get("message", str(e)),
                    error_data.get("code"),
                    error_data.get("request_id")
                )
            except (json.JSONDecodeError, AttributeError):
                raise ClawdError(str(e))
                
        except requests.exceptions.Timeout:
            raise ClawdError("Request timeout", "TIMEOUT")
        except requests.exceptions.ConnectionError:
            raise ClawdError(f"Cannot connect to {self.base_url}", "CONNECTION_ERROR")
    
    def generate(
        self,
        prompt: str,
        *,
        model_tier: Optional[ModelTier] = None,
        provider: Optional[Provider] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        use_cache: bool = True,
        metadata: Optional[Dict[str, Any]] = None
    ) -> GenerateResponse:
        """
        Generate text with smart caching
        
        Args:
            prompt: Input prompt for generation
            model_tier: Quality tier (fast/balanced/quality/coding)
            provider: LLM provider (auto for smart routing)
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
            use_cache: Whether to check cache first
            metadata: Optional tracking metadata
            
        Returns:
            GenerateResponse with generated text and metadata
            
        Example:
            >>> client = ClawdClient()
            >>> result = client.generate("Explain Python")
            >>> print(f"Response: {result.response}")
            >>> print(f"Cost: ${result.cost_usd:.4f}")
            >>> print(f"Cache hit: {result.cache_hit}")
        """
        data = {
            "prompt": prompt,
            "model_tier": (model_tier or self.default_tier).value,
            "provider": (provider or self.default_provider).value,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "use_cache": use_cache,
            "stream": False,
            "metadata": metadata
        }
        
        result = self._request("POST", "/generate", data)
        return GenerateResponse(**result)
    
    def generate_stream(
        self,
        prompt: str,
        *,
        model_tier: Optional[ModelTier] = None,
        provider: Optional[Provider] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024
    ) -> Generator[str, None, None]:
        """
        Stream generation tokens
        
        Args:
            prompt: Input prompt for generation
            model_tier: Quality tier
            provider: LLM provider
            temperature: Sampling temperature
            max_tokens: Maximum tokens
            
        Yields:
            Token strings as they are generated
            
        Example:
            >>> for token in client.generate_stream("Write a story"):
            ...     print(token, end="", flush=True)
        """
        data = {
            "prompt": prompt,
            "model_tier": (model_tier or self.default_tier).value,
            "provider": (provider or self.default_provider).value,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True
        }
        
        response = self._request("POST", "/generate/stream", data, stream=True)
        
        for line in response.iter_lines():
            if line:
                line = line.decode("utf-8")
                if line.startswith("data: "):
                    try:
                        event = json.loads(line[6:])
                        if "token" in event:
                            yield event["token"]
                        elif event.get("done"):
                            break
                    except json.JSONDecodeError:
                        continue
    
    def batch(
        self,
        prompts: List[str],
        *,
        model_tier: Optional[ModelTier] = None,
        provider: Optional[Provider] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        use_cache: bool = True
    ) -> BatchResponse:
        """
        Batch generation for cost savings
        
        Automatically deduplicates prompts and maximizes cache hits.
        Best for processing multiple similar queries efficiently.
        
        Args:
            prompts: List of prompts (1-100)
            model_tier: Quality tier
            provider: LLM provider
            temperature: Sampling temperature
            max_tokens: Maximum tokens
            use_cache: Whether to use cache
            
        Returns:
            BatchResponse with all results
            
        Example:
            >>> prompts = ["What is AI?", "What is ML?", "What is DL?"]
            >>> results = client.batch(prompts)
            >>> print(f"Total cost: ${results.total_cost_usd:.4f}")
            >>> for r in results.responses:
            ...     print(r.response)
        """
        data = {
            "prompts": prompts,
            "model_tier": (model_tier or self.default_tier).value,
            "provider": (provider or self.default_provider).value,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "use_cache": use_cache
        }
        
        result = self._request("POST", "/batch", data)
        responses = [GenerateResponse(**r) for r in result["responses"]]
        return BatchResponse(
            responses=responses,
            total_cost_usd=result["total_cost_usd"],
            total_tokens_saved=result["total_tokens_saved"],
            batch_size=result["batch_size"],
            batch_id=result["batch_id"]
        )
    
    def embed(
        self,
        texts: Union[str, List[str]],
        *,
        model: str = "all-MiniLM-L6-v2",
        normalize: bool = True
    ) -> EmbedResponse:
        """
        Generate embeddings using local GPU (RTX 2060)
        
        Free to use - no cloud API costs!
        
        Args:
            texts: Text(s) to embed (string or list)
            model: Embedding model name
            normalize: Normalize to unit length
            
        Returns:
            EmbedResponse with embedding vectors
            
        Example:
            >>> result = client.embed(["Hello world", "Goodbye world"])
            >>> print(f"Dimensions: {result.dimensions}")
            >>> print(f"Embeddings: {len(result.embeddings)}")
        """
        if isinstance(texts, str):
            texts = [texts]
            
        data = {
            "texts": texts,
            "model": model,
            "normalize": normalize
        }
        
        result = self._request("POST", "/embed", data)
        return EmbedResponse(**result)
    
    def similarity(
        self,
        text1: str,
        text2: str,
        *,
        model: str = "all-MiniLM-L6-v2"
    ) -> SimilarityResponse:
        """
        Calculate semantic similarity between two texts
        
        Uses local GPU for fast embedding and comparison.
        
        Args:
            text1: First text
            text2: Second text
            model: Embedding model
            
        Returns:
            SimilarityResponse with cosine similarity score
            
        Example:
            >>> result = client.similarity("cat", "dog")
            >>> print(f"Similarity: {result.similarity:.3f}")
        """
        data = {
            "text1": text1,
            "text2": text2,
            "model": model
        }
        
        result = self._request("POST", "/similarity", data)
        return SimilarityResponse(**result)
    
    def search(
        self,
        query: str,
        *,
        top_k: int = 5,
        threshold: float = 0.7,
        index_name: Optional[str] = None
    ) -> SearchResponse:
        """
        Local vector search
        
        Searches indexed documents using GPU-accelerated embeddings.
        
        Args:
            query: Search query
            top_k: Number of results
            threshold: Minimum similarity threshold
            index_name: Optional index to search
            
        Returns:
            SearchResponse with matching documents
            
        Example:
            >>> results = client.search("machine learning", top_k=3)
            >>> for r in results.results:
            ...     print(f"{r.score:.3f}: {r.text}")
        """
        data = {
            "query": query,
            "top_k": top_k,
            "threshold": threshold,
            "index_name": index_name
        }
        
        result = self._request("POST", "/search", data)
        results = [SearchResult(**r) for r in result["results"]]
        return SearchResponse(
            results=results,
            query_embedding_time_ms=result["query_embedding_time_ms"],
            search_time_ms=result["search_time_ms"],
            total_results=result["total_results"],
            local_gpu_used=result["local_gpu_used"]
        )
    
    # ========================================================================
    # CACHE MANAGEMENT
    # ========================================================================
    
    def cache_stats(self) -> CacheStats:
        """Get cache statistics"""
        result = self._request("GET", "/cache/stats")
        return CacheStats(**result)
    
    def cache_clear(self) -> Dict[str, Any]:
        """Clear all cached entries"""
        return self._request("POST", "/cache/clear")
    
    def cache_warm(
        self,
        queries: List[str],
        model_tier: Optional[ModelTier] = None
    ) -> Dict[str, Any]:
        """
        Pre-populate cache with common queries
        
        Runs in background to avoid blocking.
        
        Args:
            queries: List of queries to cache
            model_tier: Tier to use for warming
            
        Returns:
            Status of warming operation
        """
        data = {
            "queries": queries,
            "model_tier": (model_tier or self.default_tier).value
        }
        return self._request("POST", "/cache/warm", data)
    
    # ========================================================================
    # COST OPTIMIZATION
    # ========================================================================
    
    def cost_stats(self) -> CostStats:
        """Get cost tracking statistics"""
        result = self._request("GET", "/cost/stats")
        return CostStats(**result)
    
    def cost_estimate(
        self,
        prompt: str,
        *,
        model_tier: Optional[ModelTier] = None,
        max_tokens: int = 1024
    ) -> CostEstimate:
        """
        Estimate cost before generation
        
        Args:
            prompt: Prompt to estimate
            model_tier: Quality tier
            max_tokens: Expected output tokens
            
        Returns:
            CostEstimate with predicted cost
        """
        data = {
            "prompt": prompt,
            "model_tier": (model_tier or self.default_tier).value,
            "max_tokens": max_tokens
        }
        
        result = self._request("POST", "/cost/estimate", data)
        return CostEstimate(**result)
    
    def switch_provider(
        self,
        provider: Provider,
        model: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Change default cloud provider
        
        Args:
            provider: Provider to switch to
            model: Specific model (optional)
            api_key: API key for provider (optional)
            
        Returns:
            Status of switch operation
        """
        data = {
            "provider": provider.value,
            "model": model,
            "api_key": api_key
        }
        return self._request("POST", "/providers/switch", data)
    
    # ========================================================================
    # UTILITIES
    # ========================================================================
    
    def health(self) -> HealthStatus:
        """Check API health status"""
        result = self._request("GET", "/health")
        return HealthStatus(**result)
    
    def info(self) -> Dict[str, Any]:
        """Get API information"""
        return self._request("GET", "/")
    
    def close(self):
        """Close HTTP session"""
        self._session.close()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


# =============================================================================
# ASYNC CLIENT
# =============================================================================

class AsyncClawdClient:
    """Async version of ClawdClient using aiohttp"""
    
    def __init__(
        self,
        base_url: str = "http://localhost:8000",
        api_key: Optional[str] = None,
        timeout: float = 60.0,
        default_tier: ModelTier = ModelTier.BALANCED,
        default_provider: Provider = Provider.AUTO
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout
        self.default_tier = default_tier
        self.default_provider = default_provider
        self._session = None
    
    async def __aenter__(self):
        import aiohttp
        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        self._session = aiohttp.ClientSession(headers=headers)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._session:
            await self._session.close()
    
    async def generate(self, prompt: str, **kwargs) -> GenerateResponse:
        """Async generate (same args as ClawdClient.generate)"""
        # Implementation similar to sync version
        raise NotImplementedError("Async client - implement as needed")


# =============================================================================
# CLI INTERFACE
# =============================================================================

def main():
    """Simple CLI for testing"""
    import argparse
    import sys
    
    parser = argparse.ArgumentParser(description="Clawd Hybrid RTX Client")
    parser.add_argument("--url", default="http://localhost:8000", help="API URL")
    parser.add_argument("--tier", default="balanced", choices=["fast", "balanced", "quality", "coding"])
    parser.add_argument("prompt", nargs="?", help="Prompt to generate")
    parser.add_argument("--batch", action="store_true", help="Batch mode")
    parser.add_argument("--stream", action="store_true", help="Stream mode")
    parser.add_argument("--embed", action="store_true", help="Embed mode")
    
    args = parser.parse_args()
    
    client = ClawdClient(args.url, default_tier=ModelTier(args.tier))
    
    if args.embed:
        text = args.prompt or input("Text to embed: ")
        result = client.embed(text)
        print(f"Dimensions: {result.dimensions}")
        print(f"Embedding: {result.embeddings[0][:10]}...")
        
    elif args.batch:
        prompts = []
        if args.prompt:
            prompts.append(args.prompt)
        while True:
            line = input("Prompt (empty to run): ")
            if not line:
                break
            prompts.append(line)
        
        results = client.batch(prompts)
        print(f"\nTotal cost: ${results.total_cost_usd:.4f}")
        for i, r in enumerate(results.responses):
            print(f"\n[{i+1}] {r.response[:200]}...")
            
    elif args.stream:
        prompt = args.prompt or input("Prompt: ")
        print("\nStreaming:\n")
        for token in client.generate_stream(prompt):
            print(token, end="", flush=True)
        print()
        
    else:
        prompt = args.prompt or input("Prompt: ")
        result = client.generate(prompt)
        print(f"\n{result.response}")
        print(f"\n---")
        print(f"Provider: {result.provider_used}")
        print(f"Model: {result.model_used}")
        print(f"Cost: ${result.cost_usd:.6f}")
        print(f"Cache hit: {result.cache_hit}")
        print(f"Latency: {result.latency_ms:.1f}ms")


if __name__ == "__main__":
    main()
