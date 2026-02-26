"""
Quantum Chimera LLM v4.0 - LLM Client Wrappers
==============================================
Unified client interface for multiple LLM providers.

Features:
- Unified interface for all providers
- Automatic retry with exponential backoff
- Streaming support
- Token counting
- Error handling and fallbacks
"""

import os
import time
import json
import asyncio
from typing import Dict, List, Optional, Any, AsyncGenerator, Callable
from dataclasses import dataclass
from abc import ABC, abstractmethod
import aiohttp
import logging

logger = logging.getLogger(__name__)


@dataclass
class LLMResponse:
    """Standardized LLM response."""
    content: str
    model: str
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    latency_ms: float = 0.0
    cost_usd: float = 0.0
    finish_reason: str = ""
    raw_response: Optional[Dict] = None
    success: bool = True
    error: Optional[str] = None


@dataclass
class StreamingChunk:
    """Streaming response chunk."""
    content: str
    is_finished: bool = False
    finish_reason: str = ""


class BaseLLMClient(ABC):
    """Base class for LLM clients."""
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "",
        timeout_seconds: float = 60.0,
        max_retries: int = 3,
        retry_delay_seconds: float = 1.0
    ):
        self.api_key = api_key
        self.base_url = base_url
        self.timeout_seconds = timeout_seconds
        self.max_retries = max_retries
        self.retry_delay_seconds = retry_delay_seconds
        self._session: Optional[aiohttp.ClientSession] = None
    
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create HTTP session."""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=self.timeout_seconds)
            )
        return self._session
    
    async def close(self):
        """Close HTTP session."""
        if self._session and not self._session.closed:
            await self._session.close()
    
    @abstractmethod
    async def complete(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        stream: bool = False,
        **kwargs
    ) -> LLMResponse:
        """Send completion request."""
        pass
    
    @abstractmethod
    async def complete_stream(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        **kwargs
    ) -> AsyncGenerator[StreamingChunk, None]:
        """Send streaming completion request."""
        pass
    
    async def _make_request_with_retry(
        self,
        method: str,
        url: str,
        headers: Dict[str, str],
        json_data: Dict,
        stream: bool = False
    ) -> aiohttp.ClientResponse:
        """Make HTTP request with retry logic."""
        last_error = None
        
        for attempt in range(self.max_retries):
            try:
                session = await self._get_session()
                
                if stream:
                    response = await session.post(
                        url,
                        headers=headers,
                        json=json_data
                    )
                else:
                    async with session.post(
                        url,
                        headers=headers,
                        json=json_data
                    ) as response:
                        if response.status == 200:
                            return response
                        elif response.status == 429:  # Rate limit
                            retry_after = int(response.headers.get('Retry-After', self.retry_delay_seconds * (2 ** attempt)))
                            logger.warning(f"Rate limited, waiting {retry_after}s")
                            await asyncio.sleep(retry_after)
                            continue
                        else:
                            text = await response.text()
                            raise aiohttp.ClientError(f"HTTP {response.status}: {text}")
                
                return response
                
            except aiohttp.ClientError as e:
                last_error = e
                wait_time = self.retry_delay_seconds * (2 ** attempt)
                logger.warning(f"Request failed (attempt {attempt + 1}/{self.max_retries}): {e}, retrying in {wait_time}s")
                await asyncio.sleep(wait_time)
        
        raise last_error or Exception("Max retries exceeded")
    
    def _estimate_tokens(self, text: str) -> int:
        """Estimate token count."""
        return max(1, len(text) // 4)


class KimiClient(BaseLLMClient):
    """Kimi (Moonshot AI) client."""
    
    MODEL_PRICING = {
        "kimi-latest": {"input": 2.0, "output": 2.0},  # $ per 1M tokens
        "kimi-k2": {"input": 2.0, "output": 2.0},
        "kimi-k1-5": {"input": 2.0, "output": 2.0},
    }
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://api.moonshot.cn/v1",
        **kwargs
    ):
        super().__init__(
            api_key=api_key or os.getenv("KIMI_API_KEY"),
            base_url=base_url,
            **kwargs
        )
    
    async def complete(
        self,
        messages: List[Dict[str, str]],
        model: str = "kimi-latest",
        temperature: float = 0.7,
        max_tokens: int = 1024,
        stream: bool = False,
        **kwargs
    ) -> LLMResponse:
        """Send completion request to Kimi."""
        start_time = time.time()
        
        if not self.api_key:
            return LLMResponse(
                content="",
                model=model,
                success=False,
                error="Kimi API key not configured"
            )
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream
        }
        payload.update(kwargs)
        
        try:
            response = await self._make_request_with_retry(
                "POST",
                f"{self.base_url}/chat/completions",
                headers,
                payload
            )
            
            data = await response.json()
            
            latency_ms = (time.time() - start_time) * 1000
            
            # Extract response data
            choice = data.get("choices", [{}])[0]
            message = choice.get("message", {})
            content = message.get("content", "")
            finish_reason = choice.get("finish_reason", "")
            
            usage = data.get("usage", {})
            input_tokens = usage.get("prompt_tokens", 0)
            output_tokens = usage.get("completion_tokens", 0)
            total_tokens = usage.get("total_tokens", input_tokens + output_tokens)
            
            # Calculate cost
            pricing = self.MODEL_PRICING.get(model, {"input": 2.0, "output": 2.0})
            cost_usd = (input_tokens * pricing["input"] + output_tokens * pricing["output"]) / 1_000_000
            
            return LLMResponse(
                content=content,
                model=model,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                total_tokens=total_tokens,
                latency_ms=latency_ms,
                cost_usd=cost_usd,
                finish_reason=finish_reason,
                raw_response=data,
                success=True
            )
            
        except Exception as e:
            logger.error(f"Kimi request failed: {e}")
            return LLMResponse(
                content="",
                model=model,
                success=False,
                error=str(e),
                latency_ms=(time.time() - start_time) * 1000
            )
    
    async def complete_stream(
        self,
        messages: List[Dict[str, str]],
        model: str = "kimi-latest",
        temperature: float = 0.7,
        max_tokens: int = 1024,
        **kwargs
    ) -> AsyncGenerator[StreamingChunk, None]:
        """Send streaming completion request to Kimi."""
        if not self.api_key:
            yield StreamingChunk(content="Error: Kimi API key not configured", is_finished=True)
            return
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True
        }
        payload.update(kwargs)
        
        try:
            session = await self._get_session()
            async with session.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            ) as response:
                async for line in response.content:
                    line = line.decode('utf-8').strip()
                    if line.startswith('data: '):
                        data_str = line[6:]
                        if data_str == '[DONE]':
                            yield StreamingChunk(content="", is_finished=True)
                            break
                        
                        try:
                            data = json.loads(data_str)
                            delta = data.get("choices", [{}])[0].get("delta", {})
                            content = delta.get("content", "")
                            
                            if content:
                                yield StreamingChunk(content=content)
                        except json.JSONDecodeError:
                            continue
                        
        except Exception as e:
            logger.error(f"Kimi streaming request failed: {e}")
            yield StreamingChunk(content=f"Error: {str(e)}", is_finished=True)


class OpenRouterClient(BaseLLMClient):
    """OpenRouter client for accessing multiple models."""
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://openrouter.ai/api/v1",
        **kwargs
    ):
        super().__init__(
            api_key=api_key or os.getenv("OPENROUTER_API_KEY"),
            base_url=base_url,
            **kwargs
        )
    
    async def complete(
        self,
        messages: List[Dict[str, str]],
        model: str = "meta-llama/llama-3.3-70b-instruct",
        temperature: float = 0.7,
        max_tokens: int = 1024,
        stream: bool = False,
        **kwargs
    ) -> LLMResponse:
        """Send completion request via OpenRouter."""
        start_time = time.time()
        
        if not self.api_key:
            return LLMResponse(
                content="",
                model=model,
                success=False,
                error="OpenRouter API key not configured"
            )
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://quantum-chimera.ai",
            "X-Title": "Quantum Chimera LLM"
        }
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream
        }
        payload.update(kwargs)
        
        try:
            response = await self._make_request_with_retry(
                "POST",
                f"{self.base_url}/chat/completions",
                headers,
                payload
            )
            
            data = await response.json()
            
            latency_ms = (time.time() - start_time) * 1000
            
            # Check for errors
            if "error" in data:
                return LLMResponse(
                    content="",
                    model=model,
                    success=False,
                    error=data["error"].get("message", "Unknown error"),
                    latency_ms=latency_ms
                )
            
            # Extract response data
            choice = data.get("choices", [{}])[0]
            message = choice.get("message", {})
            content = message.get("content", "")
            finish_reason = choice.get("finish_reason", "")
            
            usage = data.get("usage", {})
            input_tokens = usage.get("prompt_tokens", 0)
            output_tokens = usage.get("completion_tokens", 0)
            total_tokens = usage.get("total_tokens", input_tokens + output_tokens)
            
            # Get cost from response
            cost_usd = 0.0
            if "usage" in data and "cost" in data["usage"]:
                cost_usd = data["usage"]["cost"]
            
            return LLMResponse(
                content=content,
                model=model,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                total_tokens=total_tokens,
                latency_ms=latency_ms,
                cost_usd=cost_usd,
                finish_reason=finish_reason,
                raw_response=data,
                success=True
            )
            
        except Exception as e:
            logger.error(f"OpenRouter request failed: {e}")
            return LLMResponse(
                content="",
                model=model,
                success=False,
                error=str(e),
                latency_ms=(time.time() - start_time) * 1000
            )
    
    async def complete_stream(
        self,
        messages: List[Dict[str, str]],
        model: str = "meta-llama/llama-3.3-70b-instruct",
        temperature: float = 0.7,
        max_tokens: int = 1024,
        **kwargs
    ) -> AsyncGenerator[StreamingChunk, None]:
        """Send streaming completion request via OpenRouter."""
        if not self.api_key:
            yield StreamingChunk(content="Error: OpenRouter API key not configured", is_finished=True)
            return
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://quantum-chimera.ai",
            "X-Title": "Quantum Chimera LLM"
        }
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True
        }
        payload.update(kwargs)
        
        try:
            session = await self._get_session()
            async with session.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            ) as response:
                async for line in response.content:
                    line = line.decode('utf-8').strip()
                    if line.startswith('data: '):
                        data_str = line[6:]
                        if data_str == '[DONE]':
                            yield StreamingChunk(content="", is_finished=True)
                            break
                        
                        try:
                            data = json.loads(data_str)
                            
                            # Check for errors
                            if "error" in data:
                                yield StreamingChunk(
                                    content=f"Error: {data['error'].get('message', 'Unknown error')}",
                                    is_finished=True
                                )
                                return
                            
                            delta = data.get("choices", [{}])[0].get("delta", {})
                            content = delta.get("content", "")
                            
                            if content:
                                yield StreamingChunk(content=content)
                        except json.JSONDecodeError:
                            continue
                        
        except Exception as e:
            logger.error(f"OpenRouter streaming request failed: {e}")
            yield StreamingChunk(content=f"Error: {str(e)}", is_finished=True)


class GroqClient(BaseLLMClient):
    """Groq client for fast inference."""
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://api.groq.com/openai/v1",
        **kwargs
    ):
        super().__init__(
            api_key=api_key or os.getenv("GROQ_API_KEY"),
            base_url=base_url,
            **kwargs
        )
    
    async def complete(
        self,
        messages: List[Dict[str, str]],
        model: str = "llama-3.3-70b-versatile",
        temperature: float = 0.7,
        max_tokens: int = 1024,
        stream: bool = False,
        **kwargs
    ) -> LLMResponse:
        """Send completion request to Groq."""
        start_time = time.time()
        
        if not self.api_key:
            return LLMResponse(
                content="",
                model=model,
                success=False,
                error="Groq API key not configured"
            )
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream
        }
        payload.update(kwargs)
        
        try:
            response = await self._make_request_with_retry(
                "POST",
                f"{self.base_url}/chat/completions",
                headers,
                payload
            )
            
            data = await response.json()
            
            latency_ms = (time.time() - start_time) * 1000
            
            # Extract response data
            choice = data.get("choices", [{}])[0]
            message = choice.get("message", {})
            content = message.get("content", "")
            finish_reason = choice.get("finish_reason", "")
            
            usage = data.get("usage", {})
            input_tokens = usage.get("prompt_tokens", 0)
            output_tokens = usage.get("completion_tokens", 0)
            total_tokens = usage.get("total_tokens", input_tokens + output_tokens)
            
            return LLMResponse(
                content=content,
                model=model,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                total_tokens=total_tokens,
                latency_ms=latency_ms,
                cost_usd=0.0,  # Groq is free tier
                finish_reason=finish_reason,
                raw_response=data,
                success=True
            )
            
        except Exception as e:
            logger.error(f"Groq request failed: {e}")
            return LLMResponse(
                content="",
                model=model,
                success=False,
                error=str(e),
                latency_ms=(time.time() - start_time) * 1000
            )
    
    async def complete_stream(
        self,
        messages: List[Dict[str, str]],
        model: str = "llama-3.3-70b-versatile",
        temperature: float = 0.7,
        max_tokens: int = 1024,
        **kwargs
    ) -> AsyncGenerator[StreamingChunk, None]:
        """Send streaming completion request to Groq."""
        if not self.api_key:
            yield StreamingChunk(content="Error: Groq API key not configured", is_finished=True)
            return
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True
        }
        payload.update(kwargs)
        
        try:
            session = await self._get_session()
            async with session.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            ) as response:
                async for line in response.content:
                    line = line.decode('utf-8').strip()
                    if line.startswith('data: '):
                        data_str = line[6:]
                        if data_str == '[DONE]':
                            yield StreamingChunk(content="", is_finished=True)
                            break
                        
                        try:
                            data = json.loads(data_str)
                            delta = data.get("choices", [{}])[0].get("delta", {})
                            content = delta.get("content", "")
                            
                            if content:
                                yield StreamingChunk(content=content)
                        except json.JSONDecodeError:
                            continue
                        
        except Exception as e:
            logger.error(f"Groq streaming request failed: {e}")
            yield StreamingChunk(content=f"Error: {str(e)}", is_finished=True)


class LLMClientManager:
    """Manager for multiple LLM clients."""
    
    def __init__(self):
        self._clients: Dict[str, BaseLLMClient] = {}
        self._register_default_clients()
    
    def _register_default_clients(self):
        """Register default clients."""
        self.register_client("kimi", KimiClient())
        self.register_client("openrouter", OpenRouterClient())
        self.register_client("groq", GroqClient())
    
    def register_client(self, name: str, client: BaseLLMClient):
        """Register a client."""
        self._clients[name] = client
        logger.info(f"Registered LLM client: {name}")
    
    def get_client(self, name: str) -> Optional[BaseLLMClient]:
        """Get a client by name."""
        return self._clients.get(name)
    
    def get_client_for_model(self, model: str) -> Optional[BaseLLMClient]:
        """Get appropriate client for a model."""
        model_lower = model.lower()
        
        if "kimi" in model_lower:
            return self._clients.get("kimi")
        elif "groq" in model_lower or "llama-3.3-70b-versatile" in model_lower:
            return self._clients.get("groq")
        else:
            # Default to OpenRouter for most models
            return self._clients.get("openrouter")
    
    async def close_all(self):
        """Close all clients."""
        for client in self._clients.values():
            await client.close()


# Global client manager
_client_manager: Optional[LLMClientManager] = None


def get_client_manager() -> LLMClientManager:
    """Get or create global client manager."""
    global _client_manager
    if _client_manager is None:
        _client_manager = LLMClientManager()
    return _client_manager
