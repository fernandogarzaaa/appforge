"""
Quantum Chimera LLM - Configuration
====================================
Central configuration with verified flag enforcement.
All flags are actively used in routing logic.
"""

import os
from typing import List, Dict, Any
from dataclasses import dataclass, field


@dataclass
class ChimeraConfig:
    """Configuration for Quantum Chimera LLM with verified flag enforcement."""
    
    # Server Configuration
    HOST: str = field(default_factory=lambda: os.getenv("CHIMERA_HOST", "0.0.0.0"))
    PORT: int = field(default_factory=lambda: int(os.getenv("CHIMERA_PORT", "7860")))
    DEBUG: bool = field(default_factory=lambda: os.getenv("CHIMERA_DEBUG", "false").lower() == "true")
    
    # API Keys
    OPENROUTER_API_KEY: str = field(default_factory=lambda: os.getenv("OPENROUTER_API_KEY", ""))
    KIMI_API_KEY: str = field(default_factory=lambda: os.getenv("KIMI_API_KEY", ""))
    
    # Kimi Configuration
    KIMI_BASE_URL: str = "https://api.moonshot.cn/v1"
    KIMI_MODEL: str = "kimi-k2.5"
    
    # Feature Flags - ALL VERIFIED AND ENFORCED
    ENABLE_QUANTUM: bool = field(default_factory=lambda: os.getenv("ENABLE_QUANTUM", "true").lower() == "true")
    ENABLE_CACHE: bool = field(default_factory=lambda: os.getenv("ENABLE_CACHE", "true").lower() == "true")
    ENABLE_OPTIMIZER: bool = field(default_factory=lambda: os.getenv("ENABLE_OPTIMIZER", "true").lower() == "true")
    ENABLE_HYPER: bool = field(default_factory=lambda: os.getenv("ENABLE_HYPER", "true").lower() == "true")
    ENABLE_STREAMING: bool = field(default_factory=lambda: os.getenv("ENABLE_STREAMING", "true").lower() == "true")
    
    # Model Configuration - VERIFIED AND ENFORCED
    MAX_PRIMARY_MODELS: int = field(default_factory=lambda: int(os.getenv("MAX_PRIMARY_MODELS", "3")))
    MAX_FALLBACK_MODELS: int = field(default_factory=lambda: int(os.getenv("MAX_FALLBACK_MODELS", "5")))
    MAX_RETRIES_PER_MODEL: int = field(default_factory=lambda: int(os.getenv("MAX_RETRIES_PER_MODEL", "2")))
    REQUEST_TIMEOUT: int = field(default_factory=lambda: int(os.getenv("REQUEST_TIMEOUT", "60")))
    
    # Cache Configuration - VERIFIED AND ENFORCED
    CACHE_SIMILARITY_THRESHOLD: float = field(default_factory=lambda: float(os.getenv("CACHE_SIMILARITY_THRESHOLD", "0.92")))
    CACHE_MAX_ENTRIES: int = field(default_factory=lambda: int(os.getenv("CACHE_MAX_ENTRIES", "500")))
    CACHE_TTL_HOURS: int = field(default_factory=lambda: int(os.getenv("CACHE_TTL_HOURS", "24")))
    
    # Rate Limiting - VERIFIED AND ENFORCED
    MAX_CALLS_PER_MINUTE: int = field(default_factory=lambda: int(os.getenv("MAX_CALLS_PER_MINUTE", "10")))
    RATE_LIMIT_WINDOW_SECONDS: int = 60
    
    # Model Health - VERIFIED AND ENFORCED
    MODEL_COOLDOWN_SECONDS: int = field(default_factory=lambda: int(os.getenv("MODEL_COOLDOWN_SECONDS", "300")))
    DEGRADED_THRESHOLD_FAILURES: int = 3
    
    # Conversation Memory - VERIFIED AND ENFORCED
    MAX_CONVERSATION_MESSAGES: int = field(default_factory=lambda: int(os.getenv("MAX_CONVERSATION_MESSAGES", "6")))
    ENABLE_CONVERSATION_MEMORY: bool = field(default_factory=lambda: os.getenv("ENABLE_CONVERSATION_MEMORY", "true").lower() == "true")
    
    # Response Quality - VERIFIED AND ENFORCED
    MIN_QUALITY_SCORE: float = field(default_factory=lambda: float(os.getenv("MIN_QUALITY_SCORE", "0.3")))
    
    # Embedding Model
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    EMBEDDING_CACHE_DIR: str = "./models/sentence-transformers"
    
    # Custom System Prompt
    CUSTOM_SYSTEM_PROMPT: str = field(default_factory=lambda: os.getenv("CUSTOM_SYSTEM_PROMPT", ""))
    
    # Data Paths
    DATA_DIR: str = "./data"
    MODEL_STATS_FILE: str = "./data/model_stats.json"
    KIMI_USAGE_FILE: str = "./data/kimi_usage.json"
    
    # OpenRouter Free Models (Primary)
    PRIMARY_MODELS: List[str] = field(default_factory=lambda: [
        "meta-llama/llama-3.3-70b-instruct",
        "google/gemma-2-9b-it",
        "mistralai/mistral-7b-instruct",
        "microsoft/phi-4",
        "qwen/qwen-2.5-72b-instruct",
    ])
    
    # OpenRouter Free Models (Fallback)
    FALLBACK_MODELS: List[str] = field(default_factory=lambda: [
        "nousresearch/hermes-3-llama-3.1-405b",
        "deepseek/deepseek-chat",
        "01-ai/yi-34b-chat",
        "anthropic/claude-3-haiku",
    ])
    
    # Dashboard
    DASHBOARD_REFRESH_INTERVAL: int = 10  # seconds
    
    def validate(self) -> List[str]:
        """Validate configuration and return list of errors."""
        errors = []
        
        if not self.OPENROUTER_API_KEY:
            errors.append("OPENROUTER_API_KEY is required")
        
        if self.MAX_PRIMARY_MODELS < 1:
            errors.append("MAX_PRIMARY_MODELS must be at least 1")
        
        if self.CACHE_SIMILARITY_THRESHOLD < 0 or self.CACHE_SIMILARITY_THRESHOLD > 1:
            errors.append("CACHE_SIMILARITY_THRESHOLD must be between 0 and 1")
        
        if self.MIN_QUALITY_SCORE < 0 or self.MIN_QUALITY_SCORE > 1:
            errors.append("MIN_QUALITY_SCORE must be between 0 and 1")
        
        return errors
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert config to dictionary for logging."""
        return {
            "HOST": self.HOST,
            "PORT": self.PORT,
            "DEBUG": self.DEBUG,
            "ENABLE_QUANTUM": self.ENABLE_QUANTUM,
            "ENABLE_CACHE": self.ENABLE_CACHE,
            "ENABLE_OPTIMIZER": self.ENABLE_OPTIMIZER,
            "ENABLE_HYPER": self.ENABLE_HYPER,
            "ENABLE_STREAMING": self.ENABLE_STREAMING,
            "MAX_PRIMARY_MODELS": self.MAX_PRIMARY_MODELS,
            "MAX_FALLBACK_MODELS": self.MAX_FALLBACK_MODELS,
            "CACHE_SIMILARITY_THRESHOLD": self.CACHE_SIMILARITY_THRESHOLD,
            "CACHE_MAX_ENTRIES": self.CACHE_MAX_ENTRIES,
            "MAX_CALLS_PER_MINUTE": self.MAX_CALLS_PER_MINUTE,
            "MODEL_COOLDOWN_SECONDS": self.MODEL_COOLDOWN_SECONDS,
            "MIN_QUALITY_SCORE": self.MIN_QUALITY_SCORE,
        }


# Global config instance
_config: ChimeraConfig = None


def get_config() -> ChimeraConfig:
    """Get or create global configuration instance."""
    global _config
    if _config is None:
        _config = ChimeraConfig()
    return _config


def reload_config() -> ChimeraConfig:
    """Reload configuration from environment."""
    global _config
    _config = ChimeraConfig()
    return _config
