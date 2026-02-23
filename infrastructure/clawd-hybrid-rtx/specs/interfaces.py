"""
Type definitions and interfaces for Clawd Hybrid RTX.

This module defines the public API types for type checking and IDE support.
"""

from typing import (
    AsyncIterator, Optional, List, Dict, Any, 
    Union, Callable, Awaitable, Literal
)
from dataclasses import dataclass
from datetime import datetime
import numpy as np

# Type aliases
Query = str
Response = str
Provider = Literal["openrouter", "together"]
StreamCallback = Callable[[str], None]
AsyncCallback = Callable[[str], Awaitable[None]]

# Configuration types
CacheConfig = Dict[str, Any]
BatchConfig = Dict[str, Any]
EngineConfig = Dict[str, Any]

@dataclass
class CacheEntry:
    """Represents a cached response with metadata."""
    query: str
    response: str
    embedding: np.ndarray
    timestamp: datetime
    ttl_seconds: int
    hit_count: int = 0
    model_used: str = ""

@dataclass
class InferenceResult:
    """Result from an inference request."""
    query: str
    response: str
    source: str  # 'cache', 'cloud', 'local'
    model: str
    latency_ms: float
    tokens_used: Optional[int] = None
    cost_estimate: Optional[float] = None

@dataclass
class BatchRequest:
    """Represents a single request in a batch."""
    id: str
    query: str
    priority: int = 0
    timestamp: datetime = None
    status: str = "pending"
    response: Optional[str] = None
    error: Optional[str] = None

@dataclass
class BatchResult:
    """Result of a batch processing operation."""
    batch_id: str
    requests: List[BatchRequest]
    completed_at: datetime
    total_tokens: int = 0
    cost_estimate: float = 0.0

@dataclass
class MemoryStats:
    """Memory statistics snapshot."""
    gpu_total_mb: float = 0.0
    gpu_used_mb: float = 0.0
    gpu_free_mb: float = 0.0
    gpu_utilization: float = 0.0
    cpu_total_mb: float = 0.0
    cpu_used_mb: float = 0.0
    cpu_available_mb: float = 0.0
    cpu_percent: float = 0.0
    timestamp: float = 0.0

# Callback types
MemoryWarningCallback = Callable[[MemoryStats], None]
CacheHitCallback = Callable[[str], None]
BatchCompleteCallback = Callable[[BatchResult], None]

# Provider response types
ProviderResponse = Dict[str, Any]
ChatMessage = Dict[str, str]
ChatCompletion = Dict[str, Any]

__all__ = [
    "Query",
    "Response", 
    "Provider",
    "StreamCallback",
    "AsyncCallback",
    "CacheConfig",
    "BatchConfig",
    "EngineConfig",
    "CacheEntry",
    "InferenceResult",
    "BatchRequest",
    "BatchResult",
    "MemoryStats",
    "MemoryWarningCallback",
    "CacheHitCallback",
    "BatchCompleteCallback",
    "ProviderResponse",
    "ChatMessage",
    "ChatCompletion",
]
