"""NVIDIA API client for Qwen and other models."""

import requests
import json
from typing import List, Dict, Any

NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"

class NvidiaClient:
    """Client for NVIDIA API (Qwen, Llama, etc.)"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = NVIDIA_BASE_URL
    
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = "qwen/qwen3.5-397b-a17b",
        max_tokens: int = 1024,
        temperature: float = 0.7,
        stream: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """Send chat completion request to NVIDIA API."""
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "top_p": 0.95,
            "top_k": 20,
            "stream": stream
        }
        
        # Add any additional parameters
        payload.update(kwargs)
        
        response = requests.post(
            f"{self.base_url}/chat/completions",
            headers=headers,
            json=payload,
            timeout=60
        )
        response.raise_for_status()
        
        return response.json()
    
    def is_available(self) -> bool:
        """Check if API is accessible."""
        try:
            headers = {"Authorization": f"Bearer {self.api_key}"}
            response = requests.get(
                f"{self.base_url}/models",
                headers=headers,
                timeout=10
            )
            return response.status_code == 200
        except Exception:
            return False
