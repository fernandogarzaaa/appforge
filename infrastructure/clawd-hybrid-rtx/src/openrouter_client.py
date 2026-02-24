"""
Clawd Hybrid RTX LLM - OpenRouter Client
Queries multiple free models in parallel via OpenRouter API.
"""
import asyncio
import time
import httpx
from typing import Optional
from .config import settings


class RateLimiter:
    """Per-model rate limiter (20 req/min)."""

    def __init__(self, max_requests: int = 20, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window = window_seconds
        self.timestamps: dict[str, list[float]] = {}

    def can_request(self, model: str) -> bool:
        now = time.time()
        if model not in self.timestamps:
            self.timestamps[model] = []
        # Clean old timestamps
        self.timestamps[model] = [t for t in self.timestamps[model] if now - t < self.window]
        return len(self.timestamps[model]) < self.max_requests

    def record(self, model: str):
        if model not in self.timestamps:
            self.timestamps[model] = []
        self.timestamps[model].append(time.time())


class OpenRouterClient:
    """Client for querying OpenRouter free-tier models."""

    def __init__(self):
        self.api_key = settings.openrouter_api_key
        self.base_url = settings.openrouter_base_url
        self.models = settings.free_models
        self.rate_limiter = RateLimiter(settings.max_requests_per_minute)

    async def query_model(
        self,
        model: str,
        messages: list[dict],
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> Optional[dict]:
        """Query a single model via OpenRouter."""
        if not self.rate_limiter.can_request(model):
            return None

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "HTTP-Referer": "https://github.com/fernandogarzaaa/appforge",
                        "X-Title": "Clawd Hybrid RTX LLM",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": model,
                        "messages": messages,
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                    },
                )
                self.rate_limiter.record(model)

                if response.status_code == 200:
                    data = response.json()
                    return {
                        "model": model,
                        "content": data["choices"][0]["message"]["content"],
                        "usage": data.get("usage", {}),
                        "latency_ms": response.elapsed.total_seconds() * 1000,
                    }
                else:
                    return {
                        "model": model,
                        "error": f"HTTP {response.status_code}: {response.text[:200]}",
                    }
        except Exception as e:
            return {"model": model, "error": str(e)}

    async def query_ensemble(
        self,
        messages: list[dict],
        max_tokens: int = 1024,
        temperature: float = 0.7,
        num_models: int = 5,
    ) -> list[dict]:
        """Query multiple models in parallel."""
        models_to_query = self.models[:num_models]
        tasks = [
            self.query_model(model, messages, max_tokens, temperature)
            for model in models_to_query
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        valid_results = []
        for r in results:
            if isinstance(r, dict) and "content" in r:
                valid_results.append(r)

        return valid_results


openrouter_client = OpenRouterClient()
