"""
Quantum Chimera LLM - Model Tracker
====================================
Per-model performance tracking with health monitoring and rate limiting.
"""

import json
import time
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field, asdict
from collections import defaultdict
import os

from config import get_config
from src.logger import get_logger

logger = get_logger()


@dataclass
class ModelStats:
    """Statistics for a single model."""
    model_id: str
    success_count: int = 0
    failure_count: int = 0
    empty_response_count: int = 0
    total_response_length: int = 0
    avg_response_length: float = 0.0
    avg_quality_score: float = 0.0
    last_called: Optional[str] = None
    first_seen: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    
    # Cooldown tracking
    degraded_until: Optional[str] = None
    consecutive_failures: int = 0
    
    def record_success(self, response_length: int, quality_score: float = 1.0):
        """Record a successful response."""
        self.success_count += 1
        self.total_response_length += response_length
        self.avg_response_length = self.total_response_length / self.success_count
        
        # Rolling average of quality score
        self.avg_quality_score = (
            (self.avg_quality_score * (self.success_count - 1) + quality_score) / self.success_count
        )
        
        self.last_called = datetime.utcnow().isoformat()
        self.consecutive_failures = 0  # Reset on success
    
    def record_failure(self):
        """Record a failed response."""
        self.failure_count += 1
        self.consecutive_failures += 1
        self.last_called = datetime.utcnow().isoformat()
    
    def record_empty(self):
        """Record an empty response."""
        self.empty_response_count += 1
        self.record_failure()
    
    def get_score(self) -> float:
        """
        Calculate model score (0.0 - 1.0).
        Higher is better.
        """
        total = self.success_count + self.failure_count
        if total == 0:
            return 0.5  # Neutral score for new models
        
        base_score = self.success_count / total
        
        # Penalize models with many empty responses
        if self.success_count > 0:
            empty_rate = self.empty_response_count / self.success_count
            base_score *= (1 - empty_rate * 0.5)
        
        # Boost models with good quality scores
        if self.avg_quality_score > 0:
            base_score = base_score * 0.7 + self.avg_quality_score * 0.3
        
        return max(0.0, min(1.0, base_score))
    
    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'ModelStats':
        """Create from dictionary."""
        return cls(**data)


class ModelTracker:
    """
    Track model performance, health, and rate limits.
    Thread-safe singleton.
    """
    
    _instance: Optional['ModelTracker'] = None
    _lock = threading.Lock()
    
    def __new__(cls) -> 'ModelTracker':
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self.config = get_config()
        self.stats: Dict[str, ModelStats] = {}
        self.rate_limit_calls: Dict[str, List[float]] = defaultdict(list)
        self._lock = threading.RLock()
        
        # Load existing stats
        self._load_stats()
        
        self._initialized = True
        logger.info("ModelTracker initialized")
    
    def _load_stats(self):
        """Load stats from disk."""
        try:
            if os.path.exists(self.config.MODEL_STATS_FILE):
                with open(self.config.MODEL_STATS_FILE, 'r') as f:
                    data = json.load(f)
                    for model_id, stats_data in data.items():
                        self.stats[model_id] = ModelStats.from_dict(stats_data)
                logger.info(f"Loaded stats for {len(self.stats)} models")
        except Exception as e:
            logger.error(f"Failed to load model stats: {e}")
            self.stats = {}
    
    def _save_stats(self):
        """Save stats to disk."""
        try:
            os.makedirs(os.path.dirname(self.config.MODEL_STATS_FILE), exist_ok=True)
            with self._lock:
                data = {k: v.to_dict() for k, v in self.stats.items()}
            with open(self.config.MODEL_STATS_FILE, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save model stats: {e}")
    
    def get_or_create_stats(self, model_id: str) -> ModelStats:
        """Get or create stats for a model."""
        with self._lock:
            if model_id not in self.stats:
                self.stats[model_id] = ModelStats(model_id=model_id)
            return self.stats[model_id]
    
    def record_success(self, model_id: str, response_length: int, quality_score: float = 1.0):
        """Record a successful response."""
        stats = self.get_or_create_stats(model_id)
        stats.record_success(response_length, quality_score)
        self._save_stats()
        logger.debug(f"Recorded success for {model_id}", 
                    response_length=response_length, 
                    quality_score=quality_score)
    
    def record_failure(self, model_id: str):
        """Record a failed response."""
        stats = self.get_or_create_stats(model_id)
        stats.record_failure()
        
        # Check if model should be degraded
        if stats.consecutive_failures >= self.config.DEGRADED_THRESHOLD_FAILURES:
            self.mark_degraded(model_id)
        
        self._save_stats()
        logger.debug(f"Recorded failure for {model_id}", 
                    consecutive_failures=stats.consecutive_failures)
    
    def record_empty(self, model_id: str):
        """Record an empty response."""
        stats = self.get_or_create_stats(model_id)
        stats.record_empty()
        self._save_stats()
        logger.debug(f"Recorded empty response for {model_id}")
    
    def get_score(self, model_id: str) -> float:
        """Get model score (0.0 - 1.0)."""
        stats = self.get_or_create_stats(model_id)
        return stats.get_score()
    
    def get_sorted_models(self, model_ids: List[str]) -> List[Tuple[str, float]]:
        """Get models sorted by score (best first)."""
        scored = [(m, self.get_score(m)) for m in model_ids]
        return sorted(scored, key=lambda x: x[1], reverse=True)
    
    def mark_degraded(self, model_id: str, cooldown_seconds: Optional[int] = None):
        """Mark a model as degraded (cooldown)."""
        if cooldown_seconds is None:
            cooldown_seconds = self.config.MODEL_COOLDOWN_SECONDS
        
        stats = self.get_or_create_stats(model_id)
        degraded_until = datetime.utcnow() + timedelta(seconds=cooldown_seconds)
        stats.degraded_until = degraded_until.isoformat()
        
        self._save_stats()
        logger.warning(f"Model {model_id} marked as degraded until {stats.degraded_until}")
    
    def is_available(self, model_id: str) -> bool:
        """Check if model is available (not in cooldown)."""
        stats = self.get_or_create_stats(model_id)
        
        if stats.degraded_until is None:
            return True
        
        degraded_until = datetime.fromisoformat(stats.degraded_until)
        if datetime.utcnow() >= degraded_until:
            # Cooldown expired
            stats.degraded_until = None
            stats.consecutive_failures = 0
            self._save_stats()
            logger.info(f"Model {model_id} is now available (cooldown expired)")
            return True
        
        return False
    
    def can_call(self, model_id: str) -> bool:
        """Check if model can be called (rate limit check)."""
        # Kimi is exempt from rate limiting
        if "kimi" in model_id.lower():
            return True
        
        now = time.time()
        window_start = now - self.config.RATE_LIMIT_WINDOW_SECONDS
        
        with self._lock:
            # Prune old calls
            self.rate_limit_calls[model_id] = [
                t for t in self.rate_limit_calls[model_id] if t > window_start
            ]
            
            # Check if under limit
            return len(self.rate_limit_calls[model_id]) < self.config.MAX_CALLS_PER_MINUTE
    
    def record_call(self, model_id: str):
        """Record a call to a model."""
        with self._lock:
            self.rate_limit_calls[model_id].append(time.time())
    
    def get_available_models(self, model_ids: List[str]) -> List[str]:
        """Get list of available models (not degraded, not rate limited)."""
        available = []
        for model_id in model_ids:
            if not self.is_available(model_id):
                logger.debug(f"Model {model_id} is in cooldown")
                continue
            if not self.can_call(model_id):
                logger.debug(f"Model {model_id} is rate limited")
                continue
            available.append(model_id)
        
        return available
    
    def get_stats_summary(self) -> Dict:
        """Get summary of all model stats."""
        with self._lock:
            return {
                "total_models": len(self.stats),
                "models": {
                    k: {
                        "score": v.get_score(),
                        "success": v.success_count,
                        "failure": v.failure_count,
                        "empty": v.empty_response_count,
                        "avg_length": v.avg_response_length,
                        "avg_quality": v.avg_quality_score,
                        "available": self.is_available(k),
                        "degraded_until": v.degraded_until,
                    }
                    for k, v in self.stats.items()
                }
            }


# Global instance
_model_tracker: Optional[ModelTracker] = None


def get_model_tracker() -> ModelTracker:
    """Get global model tracker instance."""
    global _model_tracker
    if _model_tracker is None:
        _model_tracker = ModelTracker()
    return _model_tracker
