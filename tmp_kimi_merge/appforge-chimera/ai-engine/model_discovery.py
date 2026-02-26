"""
Quantum Chimera LLM v4.0 - Auto Model Discovery
================================================
Automatically discovers and integrates free LLM models from multiple providers.
"""

import json
import time
import asyncio
import aiohttp
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set, Any
from dataclasses import dataclass, asdict
import threading

from config import get_config
from src.logger import get_logger

logger = get_logger()


@dataclass
class DiscoveredModel:
    """A discovered LLM model."""
    id: str
    name: str
    provider: str
    context_length: int
    pricing: Dict[str, Any]
    is_free: bool
    is_chat_model: bool
    capabilities: List[str]
    discovered_at: str
    last_verified: str
    success_rate: float = 0.0
    avg_latency_ms: float = 0.0
    is_available: bool = True
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DiscoveredModel':
        return cls(**data)
    
    def get_cost_per_1k_tokens(self) -> float:
        """Get cost per 1k tokens."""
        if self.is_free:
            return 0.0
        prompt_cost = self.pricing.get("prompt", 0)
        completion_cost = self.pricing.get("completion", 0)
        return (prompt_cost + completion_cost) / 2 * 1000


class ModelDiscoveryEngine:
    """
    Automatically discovers free LLM models from multiple providers.
    """
    
    # Provider endpoints
    PROVIDERS = {
        "openrouter": {
            "url": "https://openrouter.ai/api/v1/models",
            "auth_header": "Authorization",
            "auth_prefix": "Bearer ",
        },
        "groq": {
            "url": "https://api.groq.com/openai/v1/models",
            "auth_header": "Authorization",
            "auth_prefix": "Bearer ",
        },
        "together": {
            "url": "https://api.together.xyz/v1/models",
            "auth_header": "Authorization",
            "auth_prefix": "Bearer ",
        },
    }
    
    # Known free models (fallback)
    KNOWN_FREE_MODELS = {
        "openrouter": [
            "meta-llama/llama-3.3-70b-instruct",
            "meta-llama/llama-3.2-11b-vision-instruct",
            "google/gemma-2-9b-it",
            "google/gemma-2-27b-it",
            "mistralai/mistral-7b-instruct",
            "mistralai/mistral-nemo",
            "microsoft/phi-4",
            "qwen/qwen-2.5-72b-instruct",
            "qwen/qwen-2.5-32b-instruct",
            "qwen/qwen-2.5-14b-instruct",
            "nousresearch/hermes-3-llama-3.1-405b",
            "nousresearch/hermes-2-pro-llama-3-8b",
            "deepseek/deepseek-chat",
            "deepseek/deepseek-coder",
            "01-ai/yi-34b-chat",
            "01-ai/yi-34b",
            "anthropic/claude-3-haiku",
            "anthropic/claude-3.5-haiku",
            "gryphe/mythomax-l2-13b",
            "huggingfaceh4/zephyr-7b-beta",
        ],
        "groq": [
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "mixtral-8x7b-32768",
            "gemma2-9b-it",
            "gemma-7b-it",
        ],
        "together": [
            "meta-llama/Llama-3.3-70B-Instruct-Turbo",
            "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
            "google/gemma-2-27b-it",
            "google/gemma-2-9b-it",
            "mistralai/Mistral-7B-Instruct-v0.3",
            "Qwen/Qwen2.5-72B-Instruct-Turbo",
        ],
    }
    
    def __init__(self):
        self.config = get_config()
        self.discovered_models: Dict[str, DiscoveredModel] = {}
        self._lock = threading.RLock()
        self._discovery_task: Optional[asyncio.Task] = None
        
        # Load previously discovered models
        self._load_discovered_models()
        
        logger.info("ModelDiscoveryEngine initialized",
                   known_models=sum(len(v) for v in self.KNOWN_FREE_MODELS.values()))
    
    def _load_discovered_models(self):
        """Load previously discovered models from disk."""
        try:
            import os
            if os.path.exists(self.config.DISCOVERED_MODELS_FILE):
                with open(self.config.DISCOVERED_MODELS_FILE, 'r') as f:
                    data = json.load(f)
                    for model_id, model_data in data.items():
                        self.discovered_models[model_id] = DiscoveredModel.from_dict(model_data)
                logger.info(f"Loaded {len(self.discovered_models)} discovered models")
        except Exception as e:
            logger.error(f"Failed to load discovered models: {e}")
    
    def _save_discovered_models(self):
        """Save discovered models to disk."""
        try:
            import os
            os.makedirs(os.path.dirname(self.config.DISCOVERED_MODELS_FILE), exist_ok=True)
            with self._lock:
                data = {k: v.to_dict() for k, v in self.discovered_models.items()}
            with open(self.config.DISCOVERED_MODELS_FILE, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save discovered models: {e}")
    
    async def _fetch_models_from_provider(
        self, 
        provider: str, 
        api_key: str
    ) -> List[DiscoveredModel]:
        """Fetch models from a specific provider."""
        provider_config = self.PROVIDERS.get(provider)
        if not provider_config:
            return []
        
        if not api_key:
            logger.debug(f"No API key for {provider}, skipping")
            return []
        
        url = provider_config["url"]
        headers = {
            provider_config["auth_header"]: f"{provider_config['auth_prefix']}{api_key}"
        }
        
        models = []
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, timeout=30) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Parse based on provider format
                        if provider == "openrouter":
                            for model_data in data.get("data", []):
                                model = self._parse_openrouter_model(model_data)
                                if model:
                                    models.append(model)
                        
                        elif provider == "groq":
                            for model_data in data.get("data", []):
                                model = self._parse_groq_model(model_data)
                                if model:
                                    models.append(model)
                        
                        elif provider == "together":
                            for model_data in data.get("data", []):
                                model = self._parse_together_model(model_data)
                                if model:
                                    models.append(model)
                        
                        logger.info(f"Discovered {len(models)} models from {provider}")
                    else:
                        logger.warning(f"Failed to fetch from {provider}: HTTP {response.status}")
        
        except Exception as e:
            logger.error(f"Error fetching from {provider}: {e}")
        
        return models
    
    def _parse_openrouter_model(self, data: Dict) -> Optional[DiscoveredModel]:
        """Parse OpenRouter model data."""
        try:
            model_id = data.get("id", "")
            pricing = data.get("pricing", {})
            
            # Check if free
            prompt_price = float(pricing.get("prompt", 0))
            completion_price = float(pricing.get("completion", 0))
            is_free = prompt_price == 0 and completion_price == 0
            
            # Skip non-chat models
            if not data.get("architecture", {}).get("modality", "").startswith("text"):
                return None
            
            return DiscoveredModel(
                id=model_id,
                name=data.get("name", model_id),
                provider="openrouter",
                context_length=data.get("context_length", 4096),
                pricing={"prompt": prompt_price, "completion": completion_price},
                is_free=is_free,
                is_chat_model=True,
                capabilities=data.get("architecture", {}).get("instruct_type", []),
                discovered_at=datetime.utcnow().isoformat(),
                last_verified=datetime.utcnow().isoformat(),
            )
        except Exception as e:
            logger.debug(f"Failed to parse OpenRouter model: {e}")
            return None
    
    def _parse_groq_model(self, data: Dict) -> Optional[DiscoveredModel]:
        """Parse Groq model data."""
        try:
            model_id = data.get("id", "")
            
            # Groq models are generally free-tier friendly
            return DiscoveredModel(
                id=model_id,
                name=data.get("id", model_id),
                provider="groq",
                context_length=data.get("context_window", 8192),
                pricing={"prompt": 0, "completion": 0},
                is_free=True,
                is_chat_model=True,
                capabilities=["chat"],
                discovered_at=datetime.utcnow().isoformat(),
                last_verified=datetime.utcnow().isoformat(),
            )
        except Exception as e:
            logger.debug(f"Failed to parse Groq model: {e}")
            return None
    
    def _parse_together_model(self, data: Dict) -> Optional[DiscoveredModel]:
        """Parse Together AI model data."""
        try:
            model_id = data.get("id", "")
            pricing = data.get("pricing", {})
            
            prompt_price = pricing.get("input", 0) if isinstance(pricing, dict) else 0
            completion_price = pricing.get("output", 0) if isinstance(pricing, dict) else 0
            is_free = prompt_price == 0 and completion_price == 0
            
            return DiscoveredModel(
                id=model_id,
                name=data.get("id", model_id),
                provider="together",
                context_length=data.get("context_length", 4096),
                pricing={"prompt": prompt_price, "completion": completion_price},
                is_free=is_free,
                is_chat_model=True,
                capabilities=["chat"],
                discovered_at=datetime.utcnow().isoformat(),
                last_verified=datetime.utcnow().isoformat(),
            )
        except Exception as e:
            logger.debug(f"Failed to parse Together model: {e}")
            return None
    
    async def discover_models(self) -> List[DiscoveredModel]:
        """Discover models from all configured providers."""
        logger.info("Starting model discovery...")
        
        tasks = []
        
        # Fetch from each provider
        if self.config.OPENROUTER_API_KEY:
            tasks.append(self._fetch_models_from_provider(
                "openrouter", self.config.OPENROUTER_API_KEY))
        
        if self.config.GROQ_API_KEY:
            tasks.append(self._fetch_models_from_provider(
                "groq", self.config.GROQ_API_KEY))
        
        if self.config.TOGETHER_API_KEY:
            tasks.append(self._fetch_models_from_provider(
                "together", self.config.TOGETHER_API_KEY))
        
        # Also add known free models as fallback
        known_models = self._get_known_free_models()
        
        # Wait for all fetches
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        discovered = []
        for result in results:
            if isinstance(result, list):
                discovered.extend(result)
        
        # Merge with known models
        all_models = {m.id: m for m in known_models}
        for model in discovered:
            all_models[model.id] = model
        
        # Update discovered models
        with self._lock:
            self.discovered_models = all_models
        
        self._save_discovered_models()
        
        # Log summary
        free_models = [m for m in all_models.values() if m.is_free]
        paid_models = [m for m in all_models.values() if not m.is_free]
        
        logger.info(f"Model discovery complete",
                   total=len(all_models),
                   free=len(free_models),
                   paid=len(paid_models))
        
        return list(all_models.values())
    
    def _get_known_free_models(self) -> List[DiscoveredModel]:
        """Get known free models as fallback."""
        models = []
        
        for provider, model_ids in self.KNOWN_FREE_MODELS.items():
            for model_id in model_ids:
                models.append(DiscoveredModel(
                    id=model_id,
                    name=model_id.split("/")[-1],
                    provider=provider,
                    context_length=8192,
                    pricing={"prompt": 0, "completion": 0},
                    is_free=True,
                    is_chat_model=True,
                    capabilities=["chat"],
                    discovered_at=datetime.utcnow().isoformat(),
                    last_verified=datetime.utcnow().isoformat(),
                ))
        
        return models
    
    def get_free_models(self) -> List[DiscoveredModel]:
        """Get all free models sorted by success rate."""
        with self._lock:
            free_models = [m for m in self.discovered_models.values() if m.is_free]
        
        # Sort by success rate (descending)
        return sorted(free_models, key=lambda m: m.success_rate, reverse=True)
    
    def get_all_models(self) -> List[DiscoveredModel]:
        """Get all discovered models."""
        with self._lock:
            return list(self.discovered_models.values())
    
    def update_model_stats(self, model_id: str, success: bool, latency_ms: float):
        """Update model statistics after a request."""
        with self._lock:
            if model_id in self.discovered_models:
                model = self.discovered_models[model_id]
                
                # Update success rate with exponential moving average
                alpha = 0.3  # Smoothing factor
                current_success = 1.0 if success else 0.0
                model.success_rate = (alpha * current_success + 
                                     (1 - alpha) * model.success_rate)
                
                # Update latency
                if model.avg_latency_ms == 0:
                    model.avg_latency_ms = latency_ms
                else:
                    model.avg_latency_ms = (0.7 * model.avg_latency_ms + 
                                           0.3 * latency_ms)
                
                model.last_verified = datetime.utcnow().isoformat()
        
        self._save_discovered_models()
    
    def start_auto_discovery(self):
        """Start automatic model discovery in background."""
        if self._discovery_task is not None:
            return
        
        async def discovery_loop():
            while True:
                try:
                    await self.discover_models()
                except Exception as e:
                    logger.error(f"Auto-discovery error: {e}")
                
                # Wait before next discovery
                await asyncio.sleep(self.config.AUTO_DISCOVERY_INTERVAL_MINUTES * 60)
        
        self._discovery_task = asyncio.create_task(discovery_loop())
        logger.info("Auto-discovery started",
                   interval_minutes=self.config.AUTO_DISCOVERY_INTERVAL_MINUTES)


# Global instance
_discovery_engine: Optional[ModelDiscoveryEngine] = None


def get_model_discovery() -> ModelDiscoveryEngine:
    """Get global model discovery instance."""
    global _discovery_engine
    if _discovery_engine is None:
        _discovery_engine = ModelDiscoveryEngine()
    return _discovery_engine
