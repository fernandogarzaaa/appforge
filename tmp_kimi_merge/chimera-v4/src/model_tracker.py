"""
Quantum Chimera LLM v4.0 - Model Performance Tracker
====================================================
Advanced model performance tracking with statistical analysis.

Features:
- Real-time performance metrics per model
- Statistical analysis (mean, p95, p99 latencies)
- Success rate tracking with exponential moving average
- Token efficiency analysis
- Cost tracking per model
- Automatic performance degradation detection
- Historical trend analysis
"""

import time
import json
import asyncio
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict
from collections import deque
from statistics import mean, median, stdev
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


@dataclass
class ModelMetrics:
    """Performance metrics for a single model."""
    model_id: str
    
    # Request tracking
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    
    # Latency tracking (milliseconds)
    latencies: deque = field(default_factory=lambda: deque(maxlen=1000))
    
    # Token tracking
    total_input_tokens: int = 0
    total_output_tokens: int = 0
    total_tokens: int = 0
    
    # Cost tracking (USD)
    total_cost: float = 0.0
    
    # Quality tracking
    quality_scores: deque = field(default_factory=lambda: deque(maxlen=100))
    
    # Rate limit tracking
    rate_limit_hits: int = 0
    last_rate_limit_time: Optional[float] = None
    
    # Timestamps
    first_used: float = field(default_factory=time.time)
    last_used: float = field(default_factory=time.time)
    
    # EMA for success rate (alpha = 0.1 for slow adaptation)
    _success_ema: float = 1.0
    _ema_alpha: float = 0.1
    
    def record_request(
        self,
        latency_ms: float,
        success: bool,
        input_tokens: int = 0,
        output_tokens: int = 0,
        cost: float = 0.0,
        quality_score: float = 0.0
    ):
        """Record a request result."""
        self.total_requests += 1
        self.last_used = time.time()
        
        # Update EMA success rate
        self._success_ema = (
            self._ema_alpha * (1.0 if success else 0.0) +
            (1 - self._ema_alpha) * self._success_ema
        )
        
        if success:
            self.successful_requests += 1
            self.latencies.append(latency_ms)
            self.total_input_tokens += input_tokens
            self.total_output_tokens += output_tokens
            self.total_tokens += input_tokens + output_tokens
            self.total_cost += cost
            
            if quality_score > 0:
                self.quality_scores.append(quality_score)
        else:
            self.failed_requests += 1
    
    def record_rate_limit(self):
        """Record a rate limit hit."""
        self.rate_limit_hits += 1
        self.last_rate_limit_time = time.time()
    
    @property
    def success_rate(self) -> float:
        """Get current success rate (EMA)."""
        return self._success_ema
    
    @property
    def mean_latency(self) -> float:
        """Get mean latency in milliseconds."""
        if not self.latencies:
            return 0.0
        return mean(self.latencies)
    
    @property
    def median_latency(self) -> float:
        """Get median latency in milliseconds."""
        if not self.latencies:
            return 0.0
        return median(self.latencies)
    
    @property
    def p95_latency(self) -> float:
        """Get 95th percentile latency."""
        if not self.latencies:
            return 0.0
        sorted_latencies = sorted(self.latencies)
        idx = int(len(sorted_latencies) * 0.95)
        return sorted_latencies[min(idx, len(sorted_latencies) - 1)]
    
    @property
    def p99_latency(self) -> float:
        """Get 99th percentile latency."""
        if not self.latencies:
            return 0.0
        sorted_latencies = sorted(self.latencies)
        idx = int(len(sorted_latencies) * 0.99)
        return sorted_latencies[min(idx, len(sorted_latencies) - 1)]
    
    @property
    def latency_std(self) -> float:
        """Get latency standard deviation."""
        if len(self.latencies) < 2:
            return 0.0
        try:
            return stdev(self.latencies)
        except:
            return 0.0
    
    @property
    def mean_quality(self) -> float:
        """Get mean quality score."""
        if not self.quality_scores:
            return 0.0
        return mean(self.quality_scores)
    
    @property
    def tokens_per_second(self) -> float:
        """Get average tokens per second throughput."""
        if not self.latencies or self.total_tokens == 0:
            return 0.0
        total_seconds = sum(self.latencies) / 1000
        return self.total_tokens / total_seconds if total_seconds > 0 else 0.0
    
    @property
    def cost_per_1k_tokens(self) -> float:
        """Get average cost per 1K tokens."""
        if self.total_tokens == 0:
            return 0.0
        return (self.total_cost / self.total_tokens) * 1000
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "model_id": self.model_id,
            "total_requests": self.total_requests,
            "successful_requests": self.successful_requests,
            "failed_requests": self.failed_requests,
            "success_rate": self.success_rate,
            "mean_latency_ms": self.mean_latency,
            "median_latency_ms": self.median_latency,
            "p95_latency_ms": self.p95_latency,
            "p99_latency_ms": self.p99_latency,
            "latency_std_ms": self.latency_std,
            "total_input_tokens": self.total_input_tokens,
            "total_output_tokens": self.total_output_tokens,
            "total_tokens": self.total_tokens,
            "total_cost_usd": round(self.total_cost, 6),
            "cost_per_1k_tokens": round(self.cost_per_1k_tokens, 6),
            "mean_quality": self.mean_quality,
            "tokens_per_second": round(self.tokens_per_second, 2),
            "rate_limit_hits": self.rate_limit_hits,
            "first_used": self.first_used,
            "last_used": self.last_used
        }


class ModelTracker:
    """
    Advanced model performance tracker with statistical analysis.
    
    Features:
    - Per-model performance metrics
    - Statistical analysis (p95, p99 latencies)
    - Success rate tracking with EMA
    - Cost analysis
    - Performance degradation detection
    """
    
    def __init__(
        self,
        history_size: int = 1000,
        save_interval_seconds: float = 60.0,
        data_dir: str = "./data"
    ):
        self.history_size = history_size
        self.save_interval_seconds = save_interval_seconds
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # Model metrics storage
        self._metrics: Dict[str, ModelMetrics] = {}
        
        # Historical snapshots for trend analysis
        self._history: Dict[str, deque] = {}
        
        # Performance degradation thresholds
        self._degradation_threshold = 0.8  # 80% of baseline
        
        # Lock for thread safety
        self._lock = asyncio.Lock()
        
        # Background save task
        self._save_task: Optional[asyncio.Task] = None
        self._running = False
        
        # Load existing data
        self._load_data()
        
        logger.info("ModelTracker initialized")
    
    async def start(self):
        """Start background tasks."""
        self._running = True
        self._save_task = asyncio.create_task(self._periodic_save())
        logger.info("ModelTracker started")
    
    async def stop(self):
        """Stop background tasks and save data."""
        self._running = False
        if self._save_task:
            self._save_task.cancel()
            try:
                await self._save_task
            except asyncio.CancelledError:
                pass
        await self._save_data()
        logger.info("ModelTracker stopped")
    
    def _get_or_create_metrics(self, model_id: str) -> ModelMetrics:
        """Get or create metrics for a model."""
        if model_id not in self._metrics:
            self._metrics[model_id] = ModelMetrics(model_id=model_id)
            self._history[model_id] = deque(maxlen=self.history_size)
        return self._metrics[model_id]
    
    async def record_request(
        self,
        model_id: str,
        latency_ms: float,
        success: bool,
        input_tokens: int = 0,
        output_tokens: int = 0,
        cost: float = 0.0,
        quality_score: float = 0.0
    ):
        """Record a request result."""
        async with self._lock:
            metrics = self._get_or_create_metrics(model_id)
            metrics.record_request(
                latency_ms=latency_ms,
                success=success,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                cost=cost,
                quality_score=quality_score
            )
    
    async def record_rate_limit(self, model_id: str):
        """Record a rate limit hit."""
        async with self._lock:
            metrics = self._get_or_create_metrics(model_id)
            metrics.record_rate_limit()
    
    async def get_metrics(self, model_id: str) -> Optional[ModelMetrics]:
        """Get metrics for a model."""
        async with self._lock:
            return self._metrics.get(model_id)
    
    async def get_all_metrics(self) -> Dict[str, Dict[str, Any]]:
        """Get all model metrics as dictionaries."""
        async with self._lock:
            return {
                model_id: metrics.to_dict()
                for model_id, metrics in self._metrics.items()
            }
    
    async def get_best_model(
        self,
        model_ids: List[str],
        min_success_rate: float = 0.8,
        max_latency_ms: float = 10000
    ) -> Optional[str]:
        """Get best performing model from list."""
        async with self._lock:
            candidates = []
            
            for model_id in model_ids:
                if model_id not in self._metrics:
                    # No data, consider as candidate
                    candidates.append((model_id, 0.5, 5000))  # Neutral score
                    continue
                
                metrics = self._metrics[model_id]
                
                # Filter by requirements
                if metrics.success_rate < min_success_rate:
                    continue
                if metrics.mean_latency > max_latency_ms:
                    continue
                
                # Score: balance success rate and latency
                # Higher success rate is better, lower latency is better
                latency_score = max(0, 1 - (metrics.mean_latency / max_latency_ms))
                score = (metrics.success_rate * 0.6) + (latency_score * 0.4)
                
                candidates.append((model_id, score, metrics.mean_latency))
            
            if not candidates:
                return None
            
            # Sort by score (descending), then by latency (ascending)
            candidates.sort(key=lambda x: (-x[1], x[2]))
            return candidates[0][0]
    
    async def detect_degradation(self, model_id: str) -> Optional[Dict[str, Any]]:
        """Detect performance degradation for a model."""
        async with self._lock:
            if model_id not in self._metrics:
                return None
            
            metrics = self._metrics[model_id]
            history = self._history.get(model_id, deque())
            
            if len(history) < 10:
                return None  # Not enough history
            
            # Compare current to historical baseline
            baseline_success = mean([h.get("success_rate", 1.0) for h in history])
            baseline_latency = mean([h.get("mean_latency_ms", 0) for h in history])
            
            issues = []
            
            if metrics.success_rate < baseline_success * self._degradation_threshold:
                issues.append({
                    "type": "success_rate_drop",
                    "current": metrics.success_rate,
                    "baseline": baseline_success,
                    "severity": "high" if metrics.success_rate < 0.5 else "medium"
                })
            
            if metrics.mean_latency > baseline_latency * (1 / self._degradation_threshold):
                issues.append({
                    "type": "latency_increase",
                    "current": metrics.mean_latency,
                    "baseline": baseline_latency,
                    "severity": "high" if metrics.mean_latency > baseline_latency * 2 else "medium"
                })
            
            if issues:
                return {
                    "model_id": model_id,
                    "issues": issues,
                    "timestamp": time.time()
                }
            
            return None
    
    async def _periodic_save(self):
        """Periodically save metrics to disk."""
        while self._running:
            try:
                await asyncio.sleep(self.save_interval_seconds)
                await self._save_data()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in periodic save: {e}")
    
    async def _save_data(self):
        """Save metrics to disk."""
        try:
            data = {
                "timestamp": time.time(),
                "models": await self.get_all_metrics()
            }
            
            file_path = self.data_dir / "model_metrics.json"
            with open(file_path, 'w') as f:
                json.dump(data, f, indent=2, default=str)
            
            logger.debug(f"Saved metrics to {file_path}")
        except Exception as e:
            logger.error(f"Error saving metrics: {e}")
    
    def _load_data(self):
        """Load metrics from disk."""
        try:
            file_path = self.data_dir / "model_metrics.json"
            if not file_path.exists():
                return
            
            with open(file_path, 'r') as f:
                data = json.load(f)
            
            for model_id, metrics_dict in data.get("models", {}).items():
                metrics = ModelMetrics(model_id=model_id)
                metrics.total_requests = metrics_dict.get("total_requests", 0)
                metrics.successful_requests = metrics_dict.get("successful_requests", 0)
                metrics.failed_requests = metrics_dict.get("failed_requests", 0)
                metrics.total_input_tokens = metrics_dict.get("total_input_tokens", 0)
                metrics.total_output_tokens = metrics_dict.get("total_output_tokens", 0)
                metrics.total_tokens = metrics_dict.get("total_tokens", 0)
                metrics.total_cost = metrics_dict.get("total_cost_usd", 0)
                metrics.rate_limit_hits = metrics_dict.get("rate_limit_hits", 0)
                self._metrics[model_id] = metrics
                self._history[model_id] = deque(maxlen=self.history_size)
            
            logger.info(f"Loaded metrics for {len(self._metrics)} models")
        except Exception as e:
            logger.warning(f"Error loading metrics: {e}")
    
    def get_summary(self) -> Dict[str, Any]:
        """Get summary of all tracked models."""
        total_requests = sum(m.total_requests for m in self._metrics.values())
        total_successful = sum(m.successful_requests for m in self._metrics.values())
        total_cost = sum(m.total_cost for m in self._metrics.values())
        
        return {
            "total_models": len(self._metrics),
            "total_requests": total_requests,
            "total_successful": total_successful,
            "overall_success_rate": total_successful / total_requests if total_requests > 0 else 0,
            "total_cost_usd": round(total_cost, 6),
            "models": list(self._metrics.keys())
        }


# Global model tracker instance
_tracker: Optional[ModelTracker] = None


def get_model_tracker(
    history_size: int = 1000,
    save_interval_seconds: float = 60.0,
    data_dir: str = "./data"
) -> ModelTracker:
    """Get or create global model tracker instance."""
    global _tracker
    if _tracker is None:
        _tracker = ModelTracker(
            history_size=history_size,
            save_interval_seconds=save_interval_seconds,
            data_dir=data_dir
        )
    return _tracker
