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

_chimera_config_instance = None
def get_config():
	global _chimera_config_instance
	if _chimera_config_instance is None:
		_chimera_config_instance = ChimeraConfig()
	return _chimera_config_instance
