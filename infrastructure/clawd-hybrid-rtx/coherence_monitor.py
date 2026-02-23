"""
Coherence Monitor for Clawd Hybrid RTX
Real-time coherence tracking, divergence detection, and dashboard metrics.
Integrates with existing monitoring infrastructure.
"""

import asyncio
import logging
import json
import time
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from collections import deque
from pathlib import Path
import threading
import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class CoherenceEvent:
    """A single coherence measurement event."""
    timestamp: datetime
    query_hash: str
    prompt_preview: str
    coherence_score: float
    divergence_detected: bool
    requery_triggered: bool
    models_responded: int
    processing_time_ms: float
    model_weights: Dict[str, float]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": self.timestamp.isoformat(),
            "query_hash": self.query_hash,
            "prompt_preview": self.prompt_preview,
            "coherence_score": round(self.coherence_score, 4),
            "divergence_detected": self.divergence_detected,
            "requery_triggered": self.requery_triggered,
            "models_responded": self.models_responded,
            "processing_time_ms": round(self.processing_time_ms, 2),
            "model_weights": self.model_weights
        }


@dataclass
class DivergenceAlert:
    """Alert triggered when coherence drops below threshold."""
    timestamp: datetime
    severity: str  # "warning", "critical"
    coherence_score: float
    threshold: float
    query_preview: str
    acknowledged: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": self.timestamp.isoformat(),
            "severity": self.severity,
            "coherence_score": round(self.coherence_score, 4),
            "threshold": self.threshold,
            "query_preview": self.query_preview,
            "acknowledged": self.acknowledged
        }


class CoherenceMonitor:
    """
    Real-time coherence monitoring and alerting system.
    
    Features:
    - Tracks coherence scores per query
    - Detects divergence (< 80% coherence)
    - Auto-triggers re-query recommendations
    - Dashboard metrics with historical data
    - Configurable alerting thresholds
    - Export to Prometheus/Grafana
    
    Target: Maintain 95%+ average coherence
    """
    
    DEFAULT_CONFIG = {
        "warning_threshold": 0.85,   # Warning below 85%
        "critical_threshold": 0.70,  # Critical below 70%
        "history_window_minutes": 60,  # Keep 1 hour of detailed history
        "alert_cooldown_seconds": 300,  # 5 min between alerts
        "max_events": 10000,  # Max events in memory
        "persist_path": "./data/coherence_monitor.json"
    }
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize coherence monitor.
        
        Args:
            config: Optional configuration override
        """
        self.config = {**self.DEFAULT_CONFIG, **(config or {})}
        
        # Event storage (circular buffer)
        self._events: deque = deque(maxlen=self.config["max_events"])
        self._alerts: List[DivergenceAlert] = []
        
        # Running statistics
        self._total_queries = 0
        self._total_coherence = 0.0
        self._divergence_count = 0
        self._requery_count = 0
        
        # Time-bucketed statistics (per minute)
        self._minute_buckets: Dict[str, Dict[str, Any]] = {}
        
        # Callbacks for real-time alerts
        self._alert_callbacks: List[Callable[[DivergenceAlert], None]] = []
        
        # Last alert time (for cooldown)
        self._last_alert_time: Optional[datetime] = None
        
        # Lock for thread safety
        self._lock = threading.Lock()
        
        # Ensure data directory exists
        Path(self.config["persist_path"]).parent.mkdir(parents=True, exist_ok=True)
        
        # Load persisted data
        self._load()
        
        logger.info("CoherenceMonitor initialized")
    
    def record_event(
        self,
        coherence_score: float,
        divergence_detected: bool,
        requery_triggered: bool,
        prompt: str,
        models_responded: int,
        processing_time_ms: float,
        model_weights: Dict[str, float],
        query_hash: Optional[str] = None
    ) -> Optional[DivergenceAlert]:
        """
        Record a coherence event.
        
        Args:
            coherence_score: The coherence score (0-1)
            divergence_detected: Whether divergence was detected
            requery_triggered: Whether requery was triggered
            prompt: The original prompt (for preview)
            models_responded: Number of models that responded
            processing_time_ms: Processing time in milliseconds
            model_weights: Per-model weights
            query_hash: Optional hash of the query
        
        Returns:
            DivergenceAlert if alert triggered, None otherwise
        """
        with self._lock:
            event = CoherenceEvent(
                timestamp=datetime.now(),
                query_hash=query_hash or self._hash_prompt(prompt),
                prompt_preview=prompt[:100] + "..." if len(prompt) > 100 else prompt,
                coherence_score=coherence_score,
                divergence_detected=divergence_detected,
                requery_triggered=requery_triggered,
                models_responded=models_responded,
                processing_time_ms=processing_time_ms,
                model_weights=model_weights
            )
            
            self._events.append(event)
            
            # Update statistics
            self._total_queries += 1
            self._total_coherence += coherence_score
            
            if divergence_detected:
                self._divergence_count += 1
            if requery_triggered:
                self._requery_count += 1
            
            # Update minute bucket
            self._update_minute_bucket(event)
            
            # Check for alerts
            alert = None
            if divergence_detected:
                alert = self._maybe_trigger_alert(coherence_score, prompt)
            
            # Persist periodically (every 100 events)
            if self._total_queries % 100 == 0:
                self._save()
            
            return alert
    
    def _hash_prompt(self, prompt: str) -> str:
        """Generate hash for a prompt."""
        import hashlib
        return hashlib.sha256(prompt.encode()).hexdigest()[:16]
    
    def _update_minute_bucket(self, event: CoherenceEvent) -> None:
        """Update time-bucketed statistics."""
        minute_key = event.timestamp.strftime("%Y-%m-%d %H:%M")
        
        if minute_key not in self._minute_buckets:
            self._minute_buckets[minute_key] = {
                "count": 0,
                "total_coherence": 0.0,
                "divergences": 0,
                "requeries": 0,
                "avg_processing_ms": 0.0
            }
        
        bucket = self._minute_buckets[minute_key]
        bucket["count"] += 1
        bucket["total_coherence"] += event.coherence_score
        bucket["divergences"] += 1 if event.divergence_detected else 0
        bucket["requeries"] += 1 if event.requery_triggered else 0
        
        # Update average processing time
        bucket["avg_processing_ms"] = (
            (bucket["avg_processing_ms"] * (bucket["count"] - 1) + event.processing_time_ms)
            / bucket["count"]
        )
        
        # Clean old buckets
        cutoff = datetime.now() - timedelta(minutes=self.config["history_window_minutes"])
        old_keys = [
            k for k in self._minute_buckets.keys()
            if datetime.strptime(k, "%Y-%m-%d %H:%M") < cutoff
        ]
        for key in old_keys:
            del self._minute_buckets[key]
    
    def _maybe_trigger_alert(
        self,
        coherence_score: float,
        prompt: str
    ) -> Optional[DivergenceAlert]:
        """Potentially trigger a divergence alert."""
        # Check cooldown
        now = datetime.now()
        if self._last_alert_time:
            cooldown = timedelta(seconds=self.config["alert_cooldown_seconds"])
            if now - self._last_alert_time < cooldown:
                return None
        
        # Determine severity
        if coherence_score < self.config["critical_threshold"]:
            severity = "critical"
        elif coherence_score < self.config["warning_threshold"]:
            severity = "warning"
        else:
            return None
        
        # Create alert
        alert = DivergenceAlert(
            timestamp=now,
            severity=severity,
            coherence_score=coherence_score,
            threshold=self.config["warning_threshold"],
            query_preview=prompt[:150] + "..." if len(prompt) > 150 else prompt
        )
        
        self._alerts.append(alert)
        self._last_alert_time = now
        
        # Trigger callbacks
        for callback in self._alert_callbacks:
            try:
                callback(alert)
            except Exception as e:
                logger.error(f"Alert callback failed: {e}")
        
        logger.warning(f"Divergence alert: {severity} - coherence {coherence_score:.2%}")
        
        return alert
    
    def register_alert_callback(self, callback: Callable[[DivergenceAlert], None]) -> None:
        """Register a callback for divergence alerts."""
        self._alert_callbacks.append(callback)
    
    def get_current_stats(self) -> Dict[str, Any]:
        """Get current coherence statistics."""
        with self._lock:
            if self._total_queries == 0:
                return {"status": "no_data"}
            
            recent_events = self._get_recent_events(minutes=5)
            recent_coherence = [e.coherence_score for e in recent_events]
            
            return {
                "current": {
                    "total_queries": self._total_queries,
                    "average_coherence": round(self._total_coherence / self._total_queries, 4),
                    "divergence_count": self._divergence_count,
                    "divergence_rate": round(self._divergence_count / self._total_queries, 4),
                    "requery_count": self._requery_count,
                    "requery_rate": round(self._requery_count / max(1, self._total_queries), 4)
                },
                "recent_5min": {
                    "query_count": len(recent_events),
                    "average_coherence": round(np.mean(recent_coherence), 4) if recent_coherence else 0,
                    "min_coherence": round(min(recent_coherence), 4) if recent_coherence else 0,
                    "max_coherence": round(max(recent_coherence), 4) if recent_coherence else 0,
                    "std_deviation": round(np.std(recent_coherence), 4) if recent_coherence else 0
                },
                "target": {
                    "coherence_target": 0.95,
                    "warning_threshold": self.config["warning_threshold"],
                    "critical_threshold": self.config["critical_threshold"],
                    "meeting_target": (self._total_coherence / max(1, self._total_queries)) >= 0.95
                }
            }
    
    def get_dashboard_data(self) -> Dict[str, Any]:
        """Get comprehensive dashboard data."""
        with self._lock:
            # Time series data (last 30 minutes)
            now = datetime.now()
            time_series = []
            
            for i in range(30):
                minute = now - timedelta(minutes=i)
                key = minute.strftime("%Y-%m-%d %H:%M")
                if key in self._minute_buckets:
                    bucket = self._minute_buckets[key]
                    time_series.append({
                        "time": key,
                        "coherence": round(bucket["total_coherence"] / max(1, bucket["count"]), 4),
                        "queries": bucket["count"],
                        "divergences": bucket["divergences"]
                    })
            
            time_series.reverse()
            
            # Model performance (aggregate from recent events)
            model_stats: Dict[str, Dict[str, Any]] = {}
            recent_events = self._get_recent_events(minutes=60)
            
            for event in recent_events:
                for model, weight in event.model_weights.items():
                    if model not in model_stats:
                        model_stats[model] = {
                            "appearances": 0,
                            "total_weight": 0.0,
                            "high_coherence_appearances": 0
                        }
                    model_stats[model]["appearances"] += 1
                    model_stats[model]["total_weight"] += weight
                    if event.coherence_score > 0.9:
                        model_stats[model]["high_coherence_appearances"] += 1
            
            # Calculate model scores
            for model in model_stats:
                stats = model_stats[model]
                stats["average_weight"] = round(stats["total_weight"] / max(1, stats["appearances"]), 4)
                stats["reliability_score"] = round(
                    stats["high_coherence_appearances"] / max(1, stats["appearances"]), 4
                )
            
            return {
                "summary": self.get_current_stats(),
                "time_series": time_series,
                "model_performance": model_stats,
                "alerts": [a.to_dict() for a in self._alerts[-10:]],  # Last 10 alerts
                "configuration": {
                    "warning_threshold": self.config["warning_threshold"],
                    "critical_threshold": self.config["critical_threshold"]
                }
            }
    
    def _get_recent_events(self, minutes: int) -> List[CoherenceEvent]:
        """Get events from the last N minutes."""
        cutoff = datetime.now() - timedelta(minutes=minutes)
        return [e for e in self._events if e.timestamp > cutoff]
    
    def get_alerts(
        self,
        acknowledged: Optional[bool] = None,
        severity: Optional[str] = None
    ) -> List[DivergenceAlert]:
        """Get divergence alerts with optional filtering."""
        alerts = self._alerts
        
        if acknowledged is not None:
            alerts = [a for a in alerts if a.acknowledged == acknowledged]
        
        if severity is not None:
            alerts = [a for a in alerts if a.severity == severity]
        
        return sorted(alerts, key=lambda a: a.timestamp, reverse=True)
    
    def acknowledge_alert(self, timestamp: str) -> bool:
        """Acknowledge an alert by timestamp."""
        for alert in self._alerts:
            if alert.timestamp.isoformat() == timestamp:
                alert.acknowledged = True
                return True
        return False
    
    def export_metrics_prometheus(self) -> str:
        """Export metrics in Prometheus format."""
        stats = self.get_current_stats()
        
        lines = [
            "# HELP coherence_queries_total Total number of queries",
            "# TYPE coherence_queries_total counter",
            f"coherence_queries_total {stats.get('current', {}).get('total_queries', 0)}",
            "",
            "# HELP coherence_average Average coherence score",
            "# TYPE coherence_average gauge",
            f"coherence_average {stats.get('current', {}).get('average_coherence', 0)}",
            "",
            "# HELP coherence_divergences_total Total divergence events",
            "# TYPE coherence_divergences_total counter",
            f"coherence_divergences_total {stats.get('current', {}).get('divergence_count', 0)}",
            "",
            "# HELP coherence_requeries_total Total requery events",
            "# TYPE coherence_requeries_total counter",
            f"coherence_requeries_total {stats.get('current', {}).get('requery_count', 0)}",
        ]
        
        return "\n".join(lines)
    
    def _save(self) -> None:
        """Persist monitor state to disk."""
        try:
            data = {
                "config": self.config,
                "total_queries": self._total_queries,
                "total_coherence": self._total_coherence,
                "divergence_count": self._divergence_count,
                "requery_count": self._requery_count,
                "events": [e.to_dict() for e in list(self._events)[-1000:]],  # Last 1000 events
                "alerts": [a.to_dict() for a in self._alerts],
                "saved_at": datetime.now().isoformat()
            }
            
            with open(self.config["persist_path"], 'w') as f:
                json.dump(data, f, indent=2)
            
            logger.debug(f"CoherenceMonitor state saved ({len(self._events)} events)")
        
        except Exception as e:
            logger.error(f"Failed to save monitor state: {e}")
    
    def _load(self) -> None:
        """Load monitor state from disk."""
        path = Path(self.config["persist_path"])
        if not path.exists():
            return
        
        try:
            with open(path, 'r') as f:
                data = json.load(f)
            
            self._total_queries = data.get("total_queries", 0)
            self._total_coherence = data.get("total_coherence", 0.0)
            self._divergence_count = data.get("divergence_count", 0)
            self._requery_count = data.get("requery_count", 0)
            
            # Load events
            for e_data in data.get("events", []):
                event = CoherenceEvent(
                    timestamp=datetime.fromisoformat(e_data["timestamp"]),
                    query_hash=e_data["query_hash"],
                    prompt_preview=e_data["prompt_preview"],
                    coherence_score=e_data["coherence_score"],
                    divergence_detected=e_data["divergence_detected"],
                    requery_triggered=e_data["requery_triggered"],
                    models_responded=e_data["models_responded"],
                    processing_time_ms=e_data["processing_time_ms"],
                    model_weights=e_data["model_weights"]
                )
                self._events.append(event)
            
            # Load alerts
            for a_data in data.get("alerts", []):
                alert = DivergenceAlert(
                    timestamp=datetime.fromisoformat(a_data["timestamp"]),
                    severity=a_data["severity"],
                    coherence_score=a_data["coherence_score"],
                    threshold=a_data["threshold"],
                    query_preview=a_data["query_preview"],
                    acknowledged=a_data["acknowledged"]
                )
                self._alerts.append(alert)
            
            logger.info(f"CoherenceMonitor state loaded ({len(self._events)} events)")
        
        except Exception as e:
            logger.error(f"Failed to load monitor state: {e}")
    
    def reset(self) -> None:
        """Reset all statistics (use with caution)."""
        with self._lock:
            self._events.clear()
            self._alerts.clear()
            self._total_queries = 0
            self._total_coherence = 0.0
            self._divergence_count = 0
            self._requery_count = 0
            self._minute_buckets.clear()
            logger.info("CoherenceMonitor statistics reset")


# Singleton instance for application-wide use
_coherence_monitor: Optional[CoherenceMonitor] = None


def get_coherence_monitor(config: Optional[Dict[str, Any]] = None) -> CoherenceMonitor:
    """Get or create the global coherence monitor instance."""
    global _coherence_monitor
    
    if _coherence_monitor is None:
        _coherence_monitor = CoherenceMonitor(config)
    
    return _coherence_monitor


# Integration with quantum consensus engine
def record_consensus_result(result) -> Optional[DivergenceAlert]:
    """
    Record a consensus result from the quantum consensus engine.
    
    Args:
        result: ConsensusResult from QuantumConsensusEngine
    
    Returns:
        DivergenceAlert if triggered, None otherwise
    """
    monitor = get_coherence_monitor()
    
    successful_models = sum(1 for r in result.individual_responses if not r.is_error)
    
    return monitor.record_event(
        coherence_score=result.coherence_score,
        divergence_detected=result.divergence_detected,
        requery_triggered=result.requery_triggered,
        prompt=result.individual_responses[0].response if result.individual_responses else "",
        models_responded=successful_models,
        processing_time_ms=result.processing_time_ms,
        model_weights=result.model_weights
    )


# FastAPI routes for coherence monitoring
from fastapi import APIRouter

coherence_router = APIRouter(prefix="/coherence-monitor", tags=["Coherence Monitor"])


@coherence_router.get("/stats")
async def get_stats():
    """Get current coherence statistics."""
    monitor = get_coherence_monitor()
    return monitor.get_current_stats()


@coherence_router.get("/dashboard")
async def get_dashboard():
    """Get comprehensive dashboard data."""
    monitor = get_coherence_monitor()
    return monitor.get_dashboard_data()


@coherence_router.get("/alerts")
async def get_alerts(acknowledged: Optional[bool] = None, severity: Optional[str] = None):
    """Get divergence alerts."""
    monitor = get_coherence_monitor()
    alerts = monitor.get_alerts(acknowledged=acknowledged, severity=severity)
    return {"alerts": [a.to_dict() for a in alerts]}


@coherence_router.post("/alerts/{timestamp}/acknowledge")
async def acknowledge_alert(timestamp: str):
    """Acknowledge an alert."""
    monitor = get_coherence_monitor()
    success = monitor.acknowledge_alert(timestamp)
    return {"success": success}


@coherence_router.get("/metrics/prometheus")
async def get_prometheus_metrics():
    """Get Prometheus-formatted metrics."""
    monitor = get_coherence_monitor()
    return monitor.export_metrics_prometheus()


@coherence_router.post("/reset")
async def reset_monitor():
    """Reset all statistics (use with caution)."""
    monitor = get_coherence_monitor()
    monitor.reset()
    return {"status": "reset"}
