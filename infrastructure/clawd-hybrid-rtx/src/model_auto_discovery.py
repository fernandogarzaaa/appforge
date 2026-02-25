"""
ModelAutoDiscovery — Automatically discovers and registers free/public LLM endpoints.
Fetches from HuggingFace Spaces, Together.ai, OpenRouter, Replicate, and public registries.
"""
import requests
import threading
import time
from typing import List, Dict, Any

class ModelAutoDiscovery:
    def __init__(self, refresh_interval: int = 3600):
        self.refresh_interval = refresh_interval
        self.endpoints: List[Dict[str, Any]] = []
        self._lock = threading.Lock()
        self._thread = threading.Thread(target=self._refresh_loop, daemon=True)
        self._thread.start()

    def _refresh_loop(self):
        while True:
            try:
                self.endpoints = self.discover_all()
            except Exception as e:
                print(f"[AutoDiscovery] Error: {e}")
            time.sleep(self.refresh_interval)

    def discover_all(self) -> List[Dict[str, Any]]:
        endpoints = []
        endpoints += self._discover_huggingface_spaces()
        endpoints += self._discover_together_ai()
        endpoints += self._discover_openrouter()
        endpoints += self._discover_replicate()
        # Add more sources as needed
        return endpoints

    def _discover_huggingface_spaces(self) -> List[Dict[str, Any]]:
        # Example: fetch public Spaces tagged as 'text-generation'
        try:
            resp = requests.get("https://huggingface.co/api/spaces?full=true&tag=text-generation")
            data = resp.json()
            return [
                {
                    "name": s["id"],
                    "url": s["subdomain"] + ".hf.space" if s.get("subdomain") else s["id"] + ".hf.space",
                    "type": "huggingface-space",
                    "status": s.get("runtime", {}).get("stage", "unknown"),
                }
                for s in data if s.get("sdk") == "gradio"
            ]
        except Exception:
            return []

    def _discover_together_ai(self) -> List[Dict[str, Any]]:
        # Example: fetch available models from Together.ai public API
        try:
            resp = requests.get("https://api.together.xyz/models")
            data = resp.json()
            return [
                {
                    "name": m["name"],
                    "url": "https://api.together.xyz/inference",
                    "type": "together-ai",
                    "status": "available",
                }
                for m in data.get("models", [])
            ]
        except Exception:
            return []

    def _discover_openrouter(self) -> List[Dict[str, Any]]:
        # Example: fetch available models from OpenRouter public API
        try:
            resp = requests.get("https://openrouter.ai/api/v1/models")
            data = resp.json()
            return [
                {
                    "name": m["id"],
                    "url": "https://openrouter.ai/api/v1/chat/completions",
                    "type": "openrouter",
                    "status": "available",
                }
                for m in data.get("data", [])
            ]
        except Exception:
            return []

    def _discover_replicate(self) -> List[Dict[str, Any]]:
        # Example: fetch available models from Replicate public API
        try:
            resp = requests.get("https://replicate.com/api/models")
            data = resp.json()
            return [
                {
                    "name": m["name"],
                    "url": f"https://replicate.com/api/models/{m['name']}/predict",
                    "type": "replicate",
                    "status": "available",
                }
                for m in data.get("results", [])
            ]
        except Exception:
            return []

    def get_endpoints(self) -> List[Dict[str, Any]]:
        with self._lock:
            return list(self.endpoints)
