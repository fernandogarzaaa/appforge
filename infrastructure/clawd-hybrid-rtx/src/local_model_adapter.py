"""
Local Model Adapter for llama.cpp, Ollama, vLLM, etc.
Provides a unified interface for local inference endpoints.
"""
import requests
from typing import List, Dict, Any

class LocalModelAdapter:
    def __init__(self, base_url: str, name: str = "local-llm"):
        self.base_url = base_url.rstrip("/")
        self.name = name

    def chat_completion(self, messages: List[Dict[str, str]], max_tokens: int = 256, temperature: float = 0.7) -> str:
        # Example: llama.cpp/Ollama/vLLM compatible endpoint
        payload = {
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        try:
            resp = requests.post(f"{self.base_url}/v1/chat/completions", json=payload, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            # OpenAI-compatible: extract first choice
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            return f"[Local model error: {e}]"

    def health(self) -> bool:
        try:
            resp = requests.get(f"{self.base_url}/health", timeout=5)
            return resp.status_code == 200
        except Exception:
            return False
