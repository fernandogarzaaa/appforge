"""
OpenRouter Client for Clawd Hybrid RTX
Async HTTP client for OpenRouter API with rate limiting and circuit breaker patterns.
Queries multiple free LLMs in parallel for quantum consensus.
"""

import os
import asyncio
import logging
from typing import List, Dict, Any, Optional, AsyncIterator
from dataclasses import dataclass
from datetime import datetime, timedelta
import aiohttp
from tenacity import retry, stop_after_attempt, wait_exponential
import json

logger = logging.getLogger(__name__)


@dataclass
class OpenRouterResponse:
    """Response from OpenRouter API."""
    model: str
    response: str
    tokens_input: int
    tokens_output: int
    latency_ms: float
    timestamp: datetime
    error: Optional[str] = None
    
    @property
    def is_error(self) -> bool:
        return self.error is not None


@dataclass
class ModelInfo:
    """Information about an OpenRouter model."""
    id: str
    name: str
    description: str
    context_length: int
    pricing: Dict[str, float]
    is_free: bool = False


class RateLimiter:
    """Token bucket rate limiter for API calls."""
    
    def __init__(self, requests_per_minute: int = 20):
        self.requests_per_minute = requests_per_minute
        self.tokens = requests_per_minute
        self.last_update = datetime.now()
        self._lock = asyncio.Lock()
    
    async def acquire(self):
        """Acquire a token, waiting if necessary."""
        async with self._lock:
            now = datetime.now()
            elapsed = (now - self.last_update).total_seconds()
            
            # Replenish tokens based on elapsed time
            self.tokens = min(
                self.requests_per_minute,
                self.tokens + (elapsed / 60.0) * self.requests_per_minute
            )
            self.last_update = now
            
            if self.tokens < 1:
                # Calculate wait time for next token
                wait_time = (60.0 / self.requests_per_minute) * (1 - self.tokens)
                await asyncio.sleep(wait_time)
                self.tokens = 1
            
            self.tokens -= 1


class OpenRouterClient:
    """
    Async client for OpenRouter API with ensemble support.
    
    Features:
    - Parallel queries to multiple free LLM models
    - Rate limiting (20 req/min per model as per OpenRouter free tier)
    - Automatic retries with exponential backoff
    - Circuit breaker pattern for resilience
    - Streaming support
    """
    
    BASE_URL = "https://openrouter.ai/api/v1"
    
    # Free tier models available on OpenRouter
    FREE_MODELS = {
        "mistralai/mistral-7b-instruct:free": {
            "name": "Mistral 7B Instruct",
            "description": "Fast and efficient 7B parameter model",
            "context_length": 32768,
            "strengths": ["general", "instruction_following", "speed"]
        },
        "google/gemma-7b-it:free": {
            "name": "Google Gemma 7B IT",
            "description": "Google's open 7B instruction-tuned model",
            "context_length": 8192,
            "strengths": ["general", "safety", "quality"]
        },
        "meta-llama/llama-2-13b-chat:free": {
            "name": "Llama 2 13B Chat",
            "description": "Meta's 13B chat-optimized model",
            "context_length": 4096,
            "strengths": ["chat", "reasoning", "coding"]
        },
        "openchat/openchat-7b:free": {
            "name": "OpenChat 7B",
            "description": "Open-source chat model with strong performance",
            "context_length": 8192,
            "strengths": ["chat", "conversation", "helpfulness"]
        },
        "nousresearch/nous-hermes-llama2-13b:free": {
            "name": "Nous Hermes Llama2 13B",
            "description": "Fine-tuned for instruction following",
            "context_length": 4096,
            "strengths": ["instruction", "creative", "roleplay"]
        }
    }
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize OpenRouter client.
        
        Args:
            api_key: OpenRouter API key. If None, reads from OPENROUTER_API_KEY env var.
        """
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            logger.warning("No OpenRouter API key provided. Set OPENROUTER_API_KEY env var.")
        
        self._session: Optional[aiohttp.ClientSession] = None
        self._rate_limiters: Dict[str, RateLimiter] = {
            model: RateLimiter(requests_per_minute=20)
            for model in self.FREE_MODELS.keys()
        }
        
        # Circuit breaker state
        self._circuit_state: Dict[str, str] = {
            model: "closed" for model in self.FREE_MODELS.keys()
        }
        self._failure_counts: Dict[str, int] = {
            model: 0 for model in self.FREE_MODELS.keys()
        }
        self._circuit_threshold = 5  # Open circuit after 5 failures
        self._circuit_timeout = 60  # Reset after 60 seconds
        
        self._initialized = False
    
    async def initialize(self) -> None:
        """Initialize HTTP session."""
        if self._initialized:
            return
        
        self._session = aiohttp.ClientSession(
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://clawd.ai",
                "X-Title": "Clawd Hybrid RTX"
            },
            timeout=aiohttp.ClientTimeout(total=60)
        )
        
        self._initialized = True
        logger.info(f"OpenRouter client initialized with {len(self.FREE_MODELS)} free models")
    
    async def close(self) -> None:
        """Close HTTP session."""
        if self._session:
            await self._session.close()
            self._session = None
        self._initialized = False
    
    async def __aenter__(self):
        await self.initialize()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()
    
    def _is_circuit_open(self, model: str) -> bool:
        """Check if circuit breaker is open for a model."""
        return self._circuit_state.get(model) == "open"
    
    def _record_failure(self, model: str):
        """Record a failure for circuit breaker."""
        self._failure_counts[model] += 1
        if self._failure_counts[model] >= self._circuit_threshold:
            self._circuit_state[model] = "open"
            logger.warning(f"Circuit opened for {model}")
            
            # Schedule circuit reset
            asyncio.create_task(self._reset_circuit(model))
    
    def _record_success(self, model: str):
        """Record a success, reset failure count."""
        self._failure_counts[model] = 0
    
    async def _reset_circuit(self, model: str):
        """Reset circuit breaker after timeout."""
        await asyncio.sleep(self._circuit_timeout)
        self._circuit_state[model] = "closed"
        self._failure_counts[model] = 0
        logger.info(f"Circuit reset for {model}")
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10)
    )
    async def query_single(
        self,
        prompt: str,
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        system_prompt: Optional[str] = None
    ) -> OpenRouterResponse:
        """
        Query a single model with rate limiting and retries.
        
        Args:
            prompt: User prompt
            model: Model ID (must be in FREE_MODELS)
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            system_prompt: Optional system prompt
        
        Returns:
            OpenRouterResponse with results or error
        """
        if not self._initialized:
            await self.initialize()
        
        if self._is_circuit_open(model):
            return OpenRouterResponse(
                model=model,
                response="",
                tokens_input=0,
                tokens_output=0,
                latency_ms=0,
                timestamp=datetime.now(),
                error="Circuit breaker open"
            )
        
        # Apply rate limiting
        await self._rate_limiters[model].acquire()
        
        start_time = datetime.now()
        
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            
            async with self._session.post(
                f"{self.BASE_URL}/chat/completions",
                json=payload
            ) as response:
                latency_ms = (datetime.now() - start_time).total_seconds() * 1000
                
                if response.status != 200:
                    error_text = await response.text()
                    self._record_failure(model)
                    return OpenRouterResponse(
                        model=model,
                        response="",
                        tokens_input=0,
                        tokens_output=0,
                        latency_ms=latency_ms,
                        timestamp=datetime.now(),
                        error=f"HTTP {response.status}: {error_text[:200]}"
                    )
                
                data = await response.json()
                
                self._record_success(model)
                
                return OpenRouterResponse(
                    model=model,
                    response=data["choices"][0]["message"]["content"],
                    tokens_input=data.get("usage", {}).get("prompt_tokens", 0),
                    tokens_output=data.get("usage", {}).get("completion_tokens", 0),
                    latency_ms=latency_ms,
                    timestamp=datetime.now()
                )
        
        except Exception as e:
            latency_ms = (datetime.now() - start_time).total_seconds() * 1000
            self._record_failure(model)
            return OpenRouterResponse(
                model=model,
                response="",
                tokens_input=0,
                tokens_output=0,
                latency_ms=latency_ms,
                timestamp=datetime.now(),
                error=str(e)
            )
    
    async def query_ensemble(
        self,
        prompt: str,
        models: Optional[List[str]] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        system_prompt: Optional[str] = None,
        timeout_seconds: float = 10.0
    ) -> List[OpenRouterResponse]:
        """
        Query multiple models in parallel for ensemble consensus.
        
        Args:
            prompt: User prompt
            models: List of model IDs to query (defaults to all free models)
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            system_prompt: Optional system prompt
            timeout_seconds: Maximum time to wait for all responses
        
        Returns:
            List of OpenRouterResponse (one per model)
        """
        if models is None:
            models = list(self.FREE_MODELS.keys())
        
        # Create tasks for parallel execution
        tasks = [
            self.query_single(
                prompt=prompt,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
                system_prompt=system_prompt
            )
            for model in models
        ]
        
        # Wait for all with timeout
        start_time = datetime.now()
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        total_time = (datetime.now() - start_time).total_seconds()
        
        # Convert exceptions to error responses
        results = []
        for model, response in zip(models, responses):
            if isinstance(response, Exception):
                results.append(OpenRouterResponse(
                    model=model,
                    response="",
                    tokens_input=0,
                    tokens_output=0,
                    latency_ms=total_time * 1000,
                    timestamp=datetime.now(),
                    error=str(response)
                ))
            else:
                results.append(response)
        
        logger.info(f"Ensemble query completed: {len(results)} models, {total_time:.2f}s")
        return results
    
    async def query_streaming(
        self,
        prompt: str,
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 1024
    ) -> AsyncIterator[str]:
        """
        Stream response from a single model.
        
        Args:
            prompt: User prompt
            model: Model ID
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
        
        Yields:
            Response chunks as they arrive
        """
        if not self._initialized:
            await self.initialize()
        
        await self._rate_limiters[model].acquire()
        
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True
        }
        
        async with self._session.post(
            f"{self.BASE_URL}/chat/completions",
            json=payload
        ) as response:
            async for line in response.content:
                line = line.decode('utf-8').strip()
                if line.startswith('data: '):
                    data = line[6:]
                    if data == '[DONE]':
                        break
                    try:
                        chunk = json.loads(data)
                        delta = chunk["choices"][0].get("delta", {})
                        if "content" in delta:
                            yield delta["content"]
                    except (json.JSONDecodeError, KeyError):
                        continue
    
    def get_available_models(self) -> List[ModelInfo]:
        """Get list of available free models."""
        return [
            ModelInfo(
                id=model_id,
                name=info["name"],
                description=info["description"],
                context_length=info["context_length"],
                pricing={"prompt": 0.0, "completion": 0.0},
                is_free=True
            )
            for model_id, info in self.FREE_MODELS.items()
        ]
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get health status of all models."""
        return {
            model: {
                "circuit_state": self._circuit_state[model],
                "failure_count": self._failure_counts[model],
                "healthy": self._circuit_state[model] == "closed"
            }
            for model in self.FREE_MODELS.keys()
        }


# Convenience functions
async def create_openrouter_client(api_key: Optional[str] = None) -> OpenRouterClient:
    """Factory function to create and initialize client."""
    client = OpenRouterClient(api_key)
    await client.initialize()
    return client


# Simple test
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    async def test():
        if not os.getenv("OPENROUTER_API_KEY"):
            print("Set OPENROUTER_API_KEY environment variable")
            return
        
        async with OpenRouterClient() as client:
            print("Testing single model query...")
            response = await client.query_single(
                prompt="What is 2+2?",
                model="mistralai/mistral-7b-instruct:free"
            )
            print(f"Response: {response.response[:100]}...")
            print(f"Latency: {response.latency_ms:.2f}ms")
            
            print("\nTesting ensemble query...")
            responses = await client.query_ensemble(
                prompt="Explain quantum computing in one sentence."
            )
            for r in responses:
                status = "✅" if not r.is_error else "❌"
                print(f"{status} {r.model.split('/')[-1]}: {r.response[:60]}...")
    
    asyncio.run(test())
