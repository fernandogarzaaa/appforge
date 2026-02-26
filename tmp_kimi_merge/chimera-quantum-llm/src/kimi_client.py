"""
Quantum Chimera LLM - Kimi Client
==================================
OpenAI-compatible client for Moonshot AI's Kimi K2.5.
Last-resort fallback only.
"""

import json
import time
from datetime import datetime
from typing import Dict, List, Optional, Any, Generator
import os

import openai

from config import get_config
from src.logger import get_logger

logger = get_logger()


class KimiUsageTracker:
    """Track Kimi API usage and costs."""
    
    def __init__(self, usage_file: str = "./data/kimi_usage.json"):
        self.usage_file = usage_file
        self.daily_stats: Dict[str, Any] = {
            "calls": 0,
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "estimated_cost": 0.0,
        }
        self._load_usage()
    
    def _load_usage(self):
        """Load usage data from file."""
        try:
            if os.path.exists(self.usage_file):
                with open(self.usage_file, 'r') as f:
                    data = json.load(f)
                    today = datetime.utcnow().strftime("%Y-%m-%d")
                    if today in data:
                        self.daily_stats = data[today]
        except Exception as e:
            logger.error(f"Failed to load Kimi usage: {e}")
    
    def _save_usage(self):
        """Save usage data to file."""
        try:
            os.makedirs(os.path.dirname(self.usage_file), exist_ok=True)
            
            today = datetime.utcnow().strftime("%Y-%m-%d")
            
            # Load existing data
            data = {}
            if os.path.exists(self.usage_file):
                with open(self.usage_file, 'r') as f:
                    data = json.load(f)
            
            # Update today's stats
            data[today] = self.daily_stats
            
            # Keep only last 30 days
            cutoff = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
            data = {k: v for k, v in data.items() if k >= cutoff}
            
            with open(self.usage_file, 'w') as f:
                json.dump(data, f, indent=2)
        
        except Exception as e:
            logger.error(f"Failed to save Kimi usage: {e}")
    
    def record_usage(
        self, 
        prompt_tokens: int, 
        completion_tokens: int,
        prompt_text: str = "",
        response_text: str = ""
    ):
        """Record API usage."""
        # Estimate tokens if not provided (rough approximation: 4 chars = 1 token)
        if prompt_tokens == 0 and prompt_text:
            prompt_tokens = len(prompt_text) // 4
        if completion_tokens == 0 and response_text:
            completion_tokens = len(response_text) // 4
        
        # Kimi pricing: $0.012 per 1k tokens (estimated)
        cost_per_1k = 0.012
        estimated_cost = (prompt_tokens + completion_tokens) / 1000 * cost_per_1k
        
        self.daily_stats["calls"] += 1
        self.daily_stats["prompt_tokens"] += prompt_tokens
        self.daily_stats["completion_tokens"] += completion_tokens
        self.daily_stats["estimated_cost"] += estimated_cost
        
        self._save_usage()
        
        logger.info(f"Kimi usage recorded",
                   prompt_tokens=prompt_tokens,
                   completion_tokens=completion_tokens,
                   estimated_cost=round(estimated_cost, 6))
    
    def get_daily_summary(self) -> Dict[str, Any]:
        """Get daily usage summary."""
        return {
            "calls_today": self.daily_stats["calls"],
            "total_tokens": self.daily_stats["prompt_tokens"] + self.daily_stats["completion_tokens"],
            "prompt_tokens": self.daily_stats["prompt_tokens"],
            "completion_tokens": self.daily_stats["completion_tokens"],
            "estimated_cost_usd": round(self.daily_stats["estimated_cost"], 4),
            "projected_monthly_cost": round(self.daily_stats["estimated_cost"] * 30, 2),
        }


class KimiClient:
    """
    OpenAI-compatible client for Kimi K2.5.
    LAST RESORT ONLY - only called when all OpenRouter models fail.
    """
    
    def __init__(self):
        self.config = get_config()
        self.usage_tracker = KimiUsageTracker()
        
        if not self.config.KIMI_API_KEY:
            logger.warning("KIMI_API_KEY not set - Kimi fallback disabled")
            self.client = None
        else:
            self.client = openai.OpenAI(
                api_key=self.config.KIMI_API_KEY,
                base_url=self.config.KIMI_BASE_URL,
                timeout=self.config.REQUEST_TIMEOUT,
            )
            logger.info("KimiClient initialized",
                       base_url=self.config.KIMI_BASE_URL,
                       model=self.config.KIMI_MODEL)
    
    def is_available(self) -> bool:
        """Check if Kimi client is available."""
        return self.client is not None and bool(self.config.KIMI_API_KEY)
    
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 4096,
        stream: bool = False,
    ) -> Dict[str, Any]:
        """
        Make a chat completion request to Kimi.
        
        Returns OpenAI-compatible response format.
        """
        if not self.is_available():
            logger.error("Kimi client not available - no API key")
            return self._error_response("Kimi fallback not configured")
        
        start_time = time.time()
        
        try:
            logger.warning("⚠️ All OpenRouter models failed — falling back to Kimi K2.5")
            
            response = self.client.chat.completions.create(
                model=self.config.KIMI_MODEL,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=stream,
            )
            
            elapsed_ms = (time.time() - start_time) * 1000
            
            if stream:
                return self._stream_response(response)
            
            # Extract response content
            content = response.choices[0].message.content or ""
            
            # Record usage
            prompt_text = "\n".join(m.get("content", "") for m in messages)
            self.usage_tracker.record_usage(
                prompt_tokens=response.usage.prompt_tokens if response.usage else 0,
                completion_tokens=response.usage.completion_tokens if response.usage else 0,
                prompt_text=prompt_text,
                response_text=content,
            )
            
            logger.info(f"Kimi response received",
                       elapsed_ms=round(elapsed_ms, 2),
                       content_length=len(content),
                       model=self.config.KIMI_MODEL)
            
            # Return OpenAI-compatible format
            return {
                "id": response.id,
                "object": "chat.completion",
                "created": int(time.time()),
                "model": response.model,
                "choices": [
                    {
                        "index": 0,
                        "message": {
                            "role": "assistant",
                            "content": content,
                        },
                        "finish_reason": response.choices[0].finish_reason,
                    }
                ],
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                    "completion_tokens": response.usage.completion_tokens if response.usage else 0,
                    "total_tokens": response.usage.total_tokens if response.usage else 0,
                },
            }
        
        except Exception as e:
            elapsed_ms = (time.time() - start_time) * 1000
            logger.error(f"Kimi request failed: {e}",
                        elapsed_ms=round(elapsed_ms, 2),
                        exc_info=True)
            return self._error_response(f"Kimi fallback failed: {str(e)}")
    
    def _stream_response(self, response) -> Generator[str, None, None]:
        """Stream response chunks."""
        full_content = ""
        
        for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                full_content += content
                
                # Yield SSE-formatted chunk
                data = {
                    "id": chunk.id,
                    "object": "chat.completion.chunk",
                    "created": int(time.time()),
                    "model": chunk.model,
                    "choices": [
                        {
                            "index": 0,
                            "delta": {"content": content},
                            "finish_reason": None,
                        }
                    ],
                }
                yield f"data: {json.dumps(data)}\n\n"
        
        # Final done chunk
        yield "data: [DONE]\n\n"
    
    def _error_response(self, error_message: str) -> Dict[str, Any]:
        """Create a consistent error response."""
        return {
            "id": "kimi-error",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": self.config.KIMI_MODEL,
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": f"Error: {error_message}. All fallback models exhausted.",
                    },
                    "finish_reason": "error",
                }
            ],
            "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
        }
    
    def get_usage_summary(self) -> Dict[str, Any]:
        """Get usage summary for dashboard."""
        return self.usage_tracker.get_daily_summary()


# Global instance
_kimi_client: Optional[KimiClient] = None


def get_kimi_client() -> KimiClient:
    """Get global Kimi client instance."""
    global _kimi_client
    if _kimi_client is None:
        _kimi_client = KimiClient()
    return _kimi_client
