"""
Quantum Chimera LLM - OpenRouter Client
========================================
OpenRouter API client with health monitoring and cooldown integration.
"""

import json
import time
from typing import Dict, List, Optional, Any, Generator

import requests

from config import get_config
from src.logger import get_logger
from src.model_tracker import get_model_tracker

logger = get_logger()


class OpenRouterClient:
    """OpenRouter API client with health tracking."""
    
    def __init__(self):
        self.config = get_config()
        self.api_key = self.config.OPENROUTER_API_KEY
        self.base_url = "https://openrouter.ai/api/v1"
        self.model_tracker = get_model_tracker()
        
        if not self.api_key:
            logger.error("OPENROUTER_API_KEY not set!")
        else:
            logger.info("OpenRouterClient initialized")
    
    def is_available(self) -> bool:
        """Check if client is available."""
        return bool(self.api_key)
    
    def chat_completion(
        self,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 4096,
        stream: bool = False,
    ) -> Dict[str, Any]:
        """
        Make a chat completion request to OpenRouter.
        
        Returns OpenAI-compatible response format.
        """
        if not self.is_available():
            return self._error_response("OpenRouter not configured")
        
        # Check if model is available (not in cooldown, not rate limited)
        if not self.model_tracker.is_available(model):
            logger.debug(f"Model {model} is in cooldown, skipping")
            return self._error_response(f"Model {model} in cooldown")
        
        if not self.model_tracker.can_call(model):
            logger.debug(f"Model {model} is rate limited, skipping")
            return self._error_response(f"Model {model} rate limited")
        
        start_time = time.time()
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://appforge.ai",
            "X-Title": "Quantum Chimera LLM",
        }
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream,
        }
        
        try:
            # Record the call for rate limiting
            self.model_tracker.record_call(model)
            
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=self.config.REQUEST_TIMEOUT,
                stream=stream,
            )
            
            elapsed_ms = (time.time() - start_time) * 1000
            
            if response.status_code != 200:
                error_msg = f"HTTP {response.status_code}"
                try:
                    error_data = response.json()
                    error_msg = error_data.get("error", {}).get("message", error_msg)
                except:
                    pass
                
                logger.error(f"OpenRouter error for {model}: {error_msg}",
                           status_code=response.status_code,
                           elapsed_ms=round(elapsed_ms, 2))
                
                self.model_tracker.record_failure(model)
                return self._error_response(error_msg)
            
            if stream:
                return self._stream_response(response, model)
            
            data = response.json()
            
            # Extract content
            content = ""
            if data.get("choices"):
                content = data["choices"][0].get("message", {}).get("content", "")
            
            # Check for empty response
            if not content or not content.strip():
                logger.warning(f"Empty response from {model}")
                self.model_tracker.record_empty(model)
                return self._error_response("Empty response")
            
            # Record success
            self.model_tracker.record_success(model, len(content))
            
            logger.info(f"OpenRouter success for {model}",
                       elapsed_ms=round(elapsed_ms, 2),
                       content_length=len(content))
            
            return data
        
        except requests.Timeout:
            elapsed_ms = (time.time() - start_time) * 1000
            logger.error(f"OpenRouter timeout for {model}",
                        elapsed_ms=round(elapsed_ms, 2))
            self.model_tracker.record_failure(model)
            return self._error_response("Request timeout")
        
        except Exception as e:
            elapsed_ms = (time.time() - start_time) * 1000
            logger.error(f"OpenRouter exception for {model}: {e}",
                        elapsed_ms=round(elapsed_ms, 2),
                        exc_info=True)
            self.model_tracker.record_failure(model)
            return self._error_response(str(e))
    
    def _stream_response(self, response, model: str) -> Generator[str, None, None]:
        """Stream response chunks."""
        full_content = ""
        last_heartbeat = time.time()
        
        try:
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    
                    if line.startswith('data: '):
                        data_str = line[6:]
                        
                        if data_str == '[DONE]':
                            # Record success
                            self.model_tracker.record_success(model, len(full_content))
                            yield "data: [DONE]\n\n"
                            break
                        
                        try:
                            data = json.loads(data_str)
                            
                            # Extract content from chunk
                            if data.get("choices"):
                                delta = data["choices"][0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    full_content += content
                            
                            yield f"data: {data_str}\n\n"
                            last_heartbeat = time.time()
                        
                        except json.JSONDecodeError:
                            continue
                
                # Send heartbeat if no data for 5 seconds
                if time.time() - last_heartbeat > 5:
                    yield ":heartbeat\n\n"
                    last_heartbeat = time.time()
        
        except Exception as e:
            logger.error(f"Stream error for {model}: {e}")
            # Send error chunk
            error_data = {
                "error": {"message": f"Stream error: {str(e)}"}
            }
            yield f"data: {json.dumps(error_data)}\n\n"
            yield "data: [DONE]\n\n"
    
    def _error_response(self, error_message: str) -> Dict[str, Any]:
        """Create a consistent error response."""
        return {
            "error": {
                "message": error_message,
                "type": "api_error",
            }
        }
    
    def get_available_models(self) -> List[str]:
        """Get list of available models from OpenRouter."""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
            }
            
            response = requests.get(
                f"{self.base_url}/models",
                headers=headers,
                timeout=30,
            )
            
            if response.status_code == 200:
                data = response.json()
                models = [m["id"] for m in data.get("data", [])]
                return models
            
            return []
        
        except Exception as e:
            logger.error(f"Failed to get models: {e}")
            return []


# Global instance
_openrouter_client: Optional[OpenRouterClient] = None


def get_openrouter_client() -> OpenRouterClient:
    """Get global OpenRouter client instance."""
    global _openrouter_client
    if _openrouter_client is None:
        _openrouter_client = OpenRouterClient()
    return _openrouter_client
