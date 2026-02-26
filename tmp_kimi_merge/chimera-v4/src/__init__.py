"""
Quantum Chimera LLM v4.0
========================
Revolutionary AI-powered LLM optimization system.

Features:
- Multi-Armed Bandit & Thompson Sampling routing
- Quantum Superposition Routing
- Predictive caching with AI-powered pre-fetching
- Token cost minimization
- Rate limit optimization
- Auto-discovery of free LLM models
- Semantic caching with real cosine similarity
- Advanced model performance tracking
"""

__version__ = "4.0.0"
__author__ = "Quantum Chimera Team"

from .config import ChimeraConfig, get_config
from .adaptive_router import (
    MultiArmedBanditRouter,
    ThompsonSamplingRouter,
    QuantumSuperpositionRouter
)
from .token_optimizer import TokenOptimizer, get_token_optimizer
from .rate_limit_optimizer import RateLimitOptimizer, get_rate_limit_optimizer
from .predictive_cache import PredictiveCache, get_predictive_cache
from .semantic_cache import SemanticCache, get_semantic_cache
from .model_tracker import ModelTracker, get_model_tracker
from .conversation_memory import ConversationMemory, get_conversation_memory
from .llm_clients import (
    KimiClient,
    OpenRouterClient,
    GroqClient,
    LLMClientManager,
    get_client_manager
)
from .response_scorer import ResponseScorer, get_response_scorer
from .prompt_manager import PromptManager, get_prompt_manager
from .chimera_memory import ChimeraMemory, get_chimera_memory
from .logger import get_logger, configure_logging

__all__ = [
    "__version__",
    "ChimeraConfig",
    "get_config",
    "MultiArmedBanditRouter",
    "ThompsonSamplingRouter",
    "QuantumSuperpositionRouter",
    "TokenOptimizer",
    "get_token_optimizer",
    "RateLimitOptimizer",
    "get_rate_limit_optimizer",
    "PredictiveCache",
    "get_predictive_cache",
    "SemanticCache",
    "get_semantic_cache",
    "ModelTracker",
    "get_model_tracker",
    "ConversationMemory",
    "get_conversation_memory",
    "KimiClient",
    "OpenRouterClient",
    "GroqClient",
    "LLMClientManager",
    "get_client_manager",
    "ResponseScorer",
    "get_response_scorer",
    "PromptManager",
    "get_prompt_manager",
    "ChimeraMemory",
    "get_chimera_memory",
    "get_logger",
    "configure_logging",
]
