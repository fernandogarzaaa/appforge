"""
Quantum Chimera LLM v4.0 - Configuration
==========================================
Revolutionary configuration with AI-powered optimization
"""

import os
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field


@dataclass
class ChimeraConfig:
    """Revolutionary configuration for Quantum Chimera LLM v4.0"""
    
    # Server Configuration
    HOST: str = field(default_factory=lambda: os.getenv("CHIMERA_HOST", "0.0.0.0"))
    PORT: int = field(default_factory=lambda: int(os.getenv("CHIMERA_PORT", "7860")))
    DEBUG: bool = field(default_factory=lambda: os.getenv("CHIMERA_DEBUG", "false").lower() == "true")
    
    # API Keys
    OPENROUTER_API_KEY: str = field(default_factory=lambda: os.getenv("OPENROUTER_API_KEY", ""))
    KIMI_API_KEY: str = field(default_factory=lambda: os.getenv("KIMI_API_KEY", ""))
    GROQ_API_KEY: str = field(default_factory=lambda: os.getenv("GROQ_API_KEY", ""))
    TOGETHER_API_KEY: str = field(default_factory=lambda: os.getenv("TOGETHER_API_KEY", ""))
    
    # Provider URLs
    KIMI_BASE_URL: str = "https://api.moonshot.cn/v1"
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    TOGETHER_BASE_URL: str = "https://api.together.xyz/v1"
    
    # Feature Flags - ALL VERIFIED AND ENFORCED
    ENABLE_QUANTUM_ROUTING: bool = field(default_factory=lambda: os.getenv("ENABLE_QUANTUM_ROUTING", "true").lower() == "true")
    ENABLE_PREDICTIVE_CACHE: bool = field(default_factory=lambda: os.getenv("ENABLE_PREDICTIVE_CACHE", "true").lower() == "true")
    ENABLE_TOKEN_OPTIMIZER: bool = field(default_factory=lambda: os.getenv("ENABLE_TOKEN_OPTIMIZER", "true").lower() == "true")
    ENABLE_ADAPTIVE_ROUTING: bool = field(default_factory=lambda: os.getenv("ENABLE_ADAPTIVE_ROUTING", "true").lower() == "true")
    ENABLE_AUTO_MODEL_DISCOVERY: bool = field(default_factory=lambda: os.getenv("ENABLE_AUTO_MODEL_DISCOVERY", "true").lower() == "true")
    ENABLE_STREAMING: bool = field(default_factory=lambda: os.getenv("ENABLE_STREAMING", "true").lower() == "true")
    ENABLE_COST_TRACKING: bool = field(default_factory=lambda: os.getenv("ENABLE_COST_TRACKING", "true").lower() == "true")
    ENABLE_SMART_FALLBACK: bool = field(default_factory=lambda: os.getenv("ENABLE_SMART_FALLBACK", "true").lower() == "true")
    
    # Model Configuration
    MAX_PRIMARY_MODELS: int = field(default_factory=lambda: int(os.getenv("MAX_PRIMARY_MODELS", "5")))
    MAX_FALLBACK_MODELS: int = field(default_factory=lambda: int(os.getenv("MAX_FALLBACK_MODELS", "10")))
    MAX_RETRIES_PER_MODEL: int = field(default_factory=lambda: int(os.getenv("MAX_RETRIES_PER_MODEL", "2")))
    REQUEST_TIMEOUT: int = field(default_factory=lambda: int(os.getenv("REQUEST_TIMEOUT", "60")))
    
    # Token Cost Optimization
    TOKEN_COST_THRESHOLD: float = field(default_factory=lambda: float(os.getenv("TOKEN_COST_THRESHOLD", "0.001")))
    ENABLE_PROMPT_COMPRESSION: bool = field(default_factory=lambda: os.getenv("ENABLE_PROMPT_COMPRESSION", "true").lower() == "true")
    COMPRESSION_RATIO_TARGET: float = field(default_factory=lambda: float(os.getenv("COMPRESSION_RATIO_TARGET", "0.7")))
    
    # Rate Limit Optimization
    RATE_LIMIT_STRATEGY: str = field(default_factory=lambda: os.getenv("RATE_LIMIT_STRATEGY", "token_bucket"))
    MAX_CALLS_PER_MINUTE: int = field(default_factory=lambda: int(os.getenv("MAX_CALLS_PER_MINUTE", "15")))
    RATE_LIMIT_WINDOW_SECONDS: int = 60
    ENABLE_BURST_HANDLING: bool = field(default_factory=lambda: os.getenv("ENABLE_BURST_HANDLING", "true").lower() == "true")
    BURST_CAPACITY: int = field(default_factory=lambda: int(os.getenv("BURST_CAPACITY", "5")))
    
    # Predictive Cache
    PREDICTIVE_CACHE_ENABLED: bool = field(default_factory=lambda: os.getenv("PREDICTIVE_CACHE_ENABLED", "true").lower() == "true")
    PREDICTIVE_CACHE_SIZE: int = field(default_factory=lambda: int(os.getenv("PREDICTIVE_CACHE_SIZE", "1000")))
    PREDICTIVE_SIMILARITY_THRESHOLD: float = field(default_factory=lambda: float(os.getenv("PREDICTIVE_SIMILARITY_THRESHOLD", "0.85")))
    
    # Semantic Cache
    CACHE_SIMILARITY_THRESHOLD: float = field(default_factory=lambda: float(os.getenv("CACHE_SIMILARITY_THRESHOLD", "0.92")))
    CACHE_MAX_ENTRIES: int = field(default_factory=lambda: int(os.getenv("CACHE_MAX_ENTRIES", "1000")))
    CACHE_TTL_HOURS: int = field(default_factory=lambda: int(os.getenv("CACHE_TTL_HOURS", "24")))
    
    # Model Health
    MODEL_COOLDOWN_SECONDS: int = field(default_factory=lambda: int(os.getenv("MODEL_COOLDOWN_SECONDS", "180")))
    DEGRADED_THRESHOLD_FAILURES: int = 2
    HEALTH_CHECK_INTERVAL: int = field(default_factory=lambda: int(os.getenv("HEALTH_CHECK_INTERVAL", "30")))
    
    # Adaptive Routing
    ROUTING_ALGORITHM: str = field(default_factory=lambda: os.getenv("ROUTING_ALGORITHM", "multi_armed_bandit"))
    EXPLORATION_RATE: float = field(default_factory=lambda: float(os.getenv("EXPLORATION_RATE", "0.1")))
    LATENCY_WEIGHT: float = field(default_factory=lambda: float(os.getenv("LATENCY_WEIGHT", "0.3")))
    QUALITY_WEIGHT: float = field(default_factory=lambda: float(os.getenv("QUALITY_WEIGHT", "0.4")))
    COST_WEIGHT: float = field(default_factory=lambda: float(os.getenv("COST_WEIGHT", "0.3")))
    
    # Auto Model Discovery
    AUTO_DISCOVERY_INTERVAL_MINUTES: int = field(default_factory=lambda: int(os.getenv("AUTO_DISCOVERY_INTERVAL_MINUTES", "60")))
    FREE_MODEL_PRIORITY: bool = field(default_factory=lambda: os.getenv("FREE_MODEL_PRIORITY", "true").lower() == "true")
    
    # Conversation Memory
    MAX_CONVERSATION_MESSAGES: int = field(default_factory=lambda: int(os.getenv("MAX_CONVERSATION_MESSAGES", "8")))
    ENABLE_CONVERSATION_MEMORY: bool = field(default_factory=lambda: os.getenv("ENABLE_CONVERSATION_MEMORY", "true").lower() == "true")
    
    # Response Quality
    MIN_QUALITY_SCORE: float = field(default_factory=lambda: float(os.getenv("MIN_QUALITY_SCORE", "0.35")))
    
    # Embedding Model
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    EMBEDDING_CACHE_DIR: str = "./models/sentence-transformers"
    
    # Custom System Prompt
    CUSTOM_SYSTEM_PROMPT: str = field(default_factory=lambda: os.getenv("CUSTOM_SYSTEM_PROMPT", ""))
    
    # Data Paths
    DATA_DIR: str = "./data"
    MODEL_STATS_FILE: str = "./data/model_stats.json"
    KIMI_USAGE_FILE: str = "./data/kimi_usage.json"
    DISCOVERED_MODELS_FILE: str = "./data/discovered_models.json"
    COST_TRACKING_FILE: str = "./data/cost_tracking.json"
    
    # Dashboard
    DASHBOARD_REFRESH_INTERVAL: int = 10  # seconds
    
    def validate(self) -> List[str]:
        """Validate configuration and return list of errors."""
        errors = []
        
        if not self.OPENROUTER_API_KEY and not self.GROQ_API_KEY:
            errors.append("At least one API key (OPENROUTER or GROQ) is required")
        
        if self.MAX_PRIMARY_MODELS < 1:
            errors.append("MAX_PRIMARY_MODELS must be at least 1")
        
        if self.CACHE_SIMILARITY_THRESHOLD < 0 or self.CACHE_SIMILARITY_THRESHOLD > 1:
            errors.append("CACHE_SIMILARITY_THRESHOLD must be between 0 and 1")
        
        if self.MIN_QUALITY_SCORE < 0 or self.MIN_QUALITY_SCORE > 1:
            errors.append("MIN_QUALITY_SCORE must be between 0 and 1")
        
        valid_routing = ["round_robin", "least_loaded", "weighted", "multi_armed_bandit", "thompson_sampling"]
        if self.ROUTING_ALGORITHM not in valid_routing:
            errors.append(f"ROUTING_ALGORITHM must be one of {valid_routing}")
        
        return errors
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert config to dictionary for logging."""
        return {
            "HOST": self.HOST,
            "PORT": self.PORT,
            "DEBUG": self.DEBUG,
            "ENABLE_QUANTUM_ROUTING": self.ENABLE_QUANTUM_ROUTING,
            "ENABLE_PREDICTIVE_CACHE": self.ENABLE_PREDICTIVE_CACHE,
            "ENABLE_TOKEN_OPTIMIZER": self.ENABLE_TOKEN_OPTIMIZER,
            "ENABLE_ADAPTIVE_ROUTING": self.ENABLE_ADAPTIVE_ROUTING,
            "ENABLE_AUTO_MODEL_DISCOVERY": self.ENABLE_AUTO_MODEL_DISCOVERY,
            "ROUTING_ALGORITHM": self.ROUTING_ALGORITHM,
            "MAX_PRIMARY_MODELS": self.MAX_PRIMARY_MODELS,
            "MAX_FALLBACK_MODELS": self.MAX_FALLBACK_MODELS,
            "CACHE_SIMILARITY_THRESHOLD": self.CACHE_SIMILARITY_THRESHOLD,
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
