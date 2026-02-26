"""
Quantum Chimera LLM v4.0 - Rate Limit Optimizer
================================================
Advanced rate limiting with token bucket, burst handling, and predictive throttling.
"""

import time
import asyncio
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from collections import defaultdict
import threading

from config import get_config
from src.logger import get_logger

logger = get_logger()


@dataclass
class RateLimitState:
    """Rate limit state for a model."""
    model_id: str
    tokens: float = field(default=0.0)  # Current tokens in bucket
    last_update: float = field(default_factory=time.time)
    call_history: List[float] = field(default_factory=list)
    consecutive_failures: int = 0
    backoff_until: float = 0.0
    
    def __post_init__(self):
        if self.tokens == 0.0:
            self.tokens = self._get_config().MAX_CALLS_PER_MINUTE
    
    def _get_config(self):
        from config import get_config
        return get_config()


class TokenBucketRateLimiter:
    """
    Token bucket rate limiter with burst handling.
    """
    
    def __init__(self):
        self.config = get_config()
        self.buckets: Dict[str, RateLimitState] = {}
        self._lock = threading.RLock()
        
        # Burst capacity
        self.burst_capacity = self.config.BURST_CAPACITY
        
        logger.info("TokenBucketRateLimiter initialized",
                   max_calls_per_minute=self.config.MAX_CALLS_PER_MINUTE,
                   burst_capacity=self.burst_capacity)
    
    def _get_bucket(self, model_id: str) -> RateLimitState:
        """Get or create bucket for model."""
        with self._lock:
            if model_id not in self.buckets:
                self.buckets[model_id] = RateLimitState(
                    model_id=model_id,
                    tokens=self.config.MAX_CALLS_PER_MINUTE,
                )
            return self.buckets[model_id]
    
    def _refill_tokens(self, bucket: RateLimitState):
        """Refill tokens based on time elapsed."""
        now = time.time()
        elapsed = now - bucket.last_update
        
        # Refill rate: tokens per second
        refill_rate = self.config.MAX_CALLS_PER_MINUTE / self.config.RATE_LIMIT_WINDOW_SECONDS
        
        # Calculate tokens to add
        tokens_to_add = elapsed * refill_rate
        
        # Update bucket (cap at max + burst)
        max_tokens = self.config.MAX_CALLS_PER_MINUTE + self.burst_capacity
        bucket.tokens = min(max_tokens, bucket.tokens + tokens_to_add)
        bucket.last_update = now
    
    def can_make_request(self, model_id: str) -> bool:
        """
        Check if request can be made.
        
        Returns True if tokens available and not in backoff.
        """
        bucket = self._get_bucket(model_id)
        
        with self._lock:
            # Refill tokens
            self._refill_tokens(bucket)
            
            # Check backoff
            if time.time() < bucket.backoff_until:
                return False
            
            # Check tokens
            if bucket.tokens >= 1:
                return True
            
            return False
    
    def consume_token(self, model_id: str) -> bool:
        """
        Consume a token for a request.
        
        Returns True if token consumed successfully.
        """
        bucket = self._get_bucket(model_id)
        
        with self._lock:
            self._refill_tokens(bucket)
            
            if bucket.tokens >= 1:
                bucket.tokens -= 1
                bucket.call_history.append(time.time())
                
                # Prune old history
                cutoff = time.time() - self.config.RATE_LIMIT_WINDOW_SECONDS
                bucket.call_history = [t for t in bucket.call_history if t > cutoff]
                
                return True
            
            return False
    
    def record_failure(self, model_id: str, is_rate_limit: bool = False):
        """Record a failure, potentially triggering backoff."""
        bucket = self._get_bucket(model_id)
        
        with self._lock:
            bucket.consecutive_failures += 1
            
            # Exponential backoff for rate limits
            if is_rate_limit or bucket.consecutive_failures >= 3:
                backoff_seconds = min(300, 2 ** bucket.consecutive_failures)
                bucket.backoff_until = time.time() + backoff_seconds
                
                logger.warning(f"Rate limit backoff for {model_id}",
                             backoff_seconds=backoff_seconds,
                             consecutive_failures=bucket.consecutive_failures)
    
    def record_success(self, model_id: str):
        """Record a successful request."""
        bucket = self._get_bucket(model_id)
        
        with self._lock:
            bucket.consecutive_failures = 0
            bucket.backoff_until = 0
    
    def get_wait_time(self, model_id: str) -> float:
        """Get estimated wait time until next request can be made."""
        bucket = self._get_bucket(model_id)
        
        with self._lock:
            self._refill_tokens(bucket)
            
            # Check backoff
            if time.time() < bucket.backoff_until:
                return bucket.backoff_until - time.time()
            
            # Calculate time for next token
            if bucket.tokens < 1:
                refill_rate = self.config.MAX_CALLS_PER_MINUTE / self.config.RATE_LIMIT_WINDOW_SECONDS
                tokens_needed = 1 - bucket.tokens
                return tokens_needed / refill_rate
            
            return 0
    
    def get_stats(self, model_id: str) -> Dict[str, Any]:
        """Get rate limit stats for a model."""
        bucket = self._get_bucket(model_id)
        
        with self._lock:
            self._refill_tokens(bucket)
            
            return {
                "model_id": model_id,
                "tokens_available": round(bucket.tokens, 2),
                "calls_in_window": len(bucket.call_history),
                "consecutive_failures": bucket.consecutive_failures,
                "in_backoff": time.time() < bucket.backoff_until,
                "backoff_seconds_remaining": max(0, bucket.backoff_until - time.time()),
            }


class PredictiveRateLimiter:
    """
    Predictive rate limiter that anticipates rate limits before they occur.
    
    Uses historical patterns to predict when rate limits will be hit
    and proactively throttles requests.
    """
    
    def __init__(self):
        self.config = get_config()
        self.token_bucket = TokenBucketRateLimiter()
        
        # Historical call patterns
        self.hourly_patterns: Dict[str, List[int]] = defaultdict(lambda: [0] * 24)
        self.daily_calls: Dict[str, int] = defaultdict(int)
        
        logger.info("PredictiveRateLimiter initialized")
    
    def predict_rate_limit_risk(self, model_id: str) -> float:
        """
        Predict risk of hitting rate limit (0-1).
        
        Higher = more likely to hit rate limit.
        """
        bucket = self.token_bucket._get_bucket(model_id)
        
        with self.token_bucket._lock:
            # Current usage
            current_calls = len(bucket.call_history)
            max_calls = self.config.MAX_CALLS_PER_MINUTE
            
            # Base risk from current usage
            usage_risk = current_calls / max_calls if max_calls > 0 else 0
            
            # Historical pattern risk
            hour = time.localtime().tm_hour
            historical_avg = sum(self.hourly_patterns[model_id]) / max(1, len(self.hourly_patterns[model_id]))
            current_hour_calls = self.hourly_patterns[model_id][hour]
            
            pattern_risk = 0
            if historical_avg > 0:
                pattern_risk = min(1.0, current_hour_calls / (historical_avg * 1.5))
            
            # Combined risk
            risk = 0.6 * usage_risk + 0.4 * pattern_risk
            
            return min(1.0, risk)
    
    def should_throttle(self, model_id: str) -> bool:
        """
        Determine if request should be throttled to avoid rate limit.
        """
        risk = self.predict_rate_limit_risk(model_id)
        
        # Throttle if risk is high (>70%)
        if risk > 0.7:
            logger.debug(f"Throttling {model_id} due to high rate limit risk",
                        risk=round(risk, 2))
            return True
        
        return False
    
    def record_call(self, model_id: str):
        """Record a call for pattern analysis."""
        hour = time.localtime().tm_hour
        self.hourly_patterns[model_id][hour] += 1
        self.daily_calls[model_id] += 1
    
    def get_recommendations(self, model_id: str) -> List[str]:
        """Get rate limit recommendations for a model."""
        recommendations = []
        
        stats = self.token_bucket.get_stats(model_id)
        risk = self.predict_rate_limit_risk(model_id)
        
        if stats["in_backoff"]:
            recommendations.append(f"In backoff for {stats['backoff_seconds_remaining']:.0f}s")
        
        if risk > 0.8:
            recommendations.append("HIGH RISK: Consider switching models")
        elif risk > 0.5:
            recommendations.append("MEDIUM RISK: Monitor closely")
        
        if stats["tokens_available"] < 2:
            recommendations.append("Low tokens: Throttle incoming requests")
        
        return recommendations


class RateLimitOptimizer:
    """
    Main rate limit optimizer that combines all strategies.
    """
    
    def __init__(self):
        self.config = get_config()
        self.token_bucket = TokenBucketRateLimiter()
        self.predictive = PredictiveRateLimiter()
        
        logger.info("RateLimitOptimizer initialized",
                   strategy=self.config.RATE_LIMIT_STRATEGY)
    
    def can_use_model(self, model_id: str) -> bool:
        """
        Check if model can be used.
        
        Combines token bucket and predictive throttling.
        """
        # Check token bucket
        if not self.token_bucket.can_make_request(model_id):
            return False
        
        # Check predictive throttling
        if self.config.ENABLE_BURST_HANDLING:
            if self.predictive.should_throttle(model_id):
                return False
        
        return True
    
    def before_request(self, model_id: str) -> bool:
        """
        Call before making a request.
        
        Returns True if request should proceed.
        """
        if not self.can_use_model(model_id):
            return False
        
        # Consume token
        if not self.token_bucket.consume_token(model_id):
            return False
        
        # Record for predictive analysis
        self.predictive.record_call(model_id)
        
        return True
    
    def after_request(self, model_id: str, success: bool, is_rate_limit: bool = False):
        """Call after request completes."""
        if success:
            self.token_bucket.record_success(model_id)
        else:
            self.token_bucket.record_failure(model_id, is_rate_limit)
    
    def get_wait_time(self, model_id: str) -> float:
        """Get wait time until model can be used."""
        return self.token_bucket.get_wait_time(model_id)
    
    def get_available_models(self, models: List[str]) -> List[str]:
        """Filter to models that can be used now."""
        return [m for m in models if self.can_use_model(m)]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get optimizer stats."""
        return {
            "strategy": self.config.RATE_LIMIT_STRATEGY,
            "max_calls_per_minute": self.config.MAX_CALLS_PER_MINUTE,
            "burst_capacity": self.config.BURST_CAPACITY,
            "burst_handling_enabled": self.config.ENABLE_BURST_HANDLING,
        }


# Global instance
_rate_limit_optimizer: Optional[RateLimitOptimizer] = None


def get_rate_limit_optimizer() -> RateLimitOptimizer:
    """Get global rate limit optimizer instance."""
    global _rate_limit_optimizer
    if _rate_limit_optimizer is None:
        _rate_limit_optimizer = RateLimitOptimizer()
    return _rate_limit_optimizer
