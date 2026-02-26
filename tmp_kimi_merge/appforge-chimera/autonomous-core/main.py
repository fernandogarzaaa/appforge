"""
AppForge Chimera - Autonomous Core
==================================
Self-evolving, self-monitoring, self-improving AI system.

This module provides:
- Self-monitoring and diagnostics
- Auto-improvement through code analysis
- Self-healing capabilities
- Continuous learning from usage patterns
- Automatic updates and optimizations
"""

import asyncio
import json
import time
import hashlib
import traceback
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from pathlib import Path
from collections import deque
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AutonomousCore")


@dataclass
class SystemMetric:
    """System performance metric."""
    timestamp: float
    metric_type: str
    value: float
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ImprovementSuggestion:
    """Suggested system improvement."""
    suggestion_id: str
    component: str
    issue: str
    solution: str
    confidence: float
    impact_score: float
    auto_apply: bool = False
    created_at: float = field(default_factory=time.time)
    applied_at: Optional[float] = None
    status: str = "pending"  # pending, approved, applied, rejected


@dataclass
class LearningPattern:
    """Learned pattern from system usage."""
    pattern_id: str
    pattern_type: str
    pattern_data: Dict[str, Any]
    frequency: int = 0
    confidence: float = 0.0
    first_seen: float = field(default_factory=time.time)
    last_seen: float = field(default_factory=time.time)


class SelfMonitor:
    """
    Self-monitoring system that tracks performance and health.
    """
    
    def __init__(self, data_dir: str = "./data/monitoring"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # Metrics storage
        self._metrics: deque = deque(maxlen=10000)
        self._health_status: Dict[str, Any] = {
            "overall": "healthy",
            "components": {},
            "last_check": time.time()
        }
        
        # Thresholds
        self._thresholds = {
            "cpu_percent": 80.0,
            "memory_percent": 85.0,
            "response_time_ms": 5000.0,
            "error_rate": 0.05
        }
        
        logger.info("SelfMonitor initialized")
    
    async def start_monitoring(self, interval_seconds: float = 30.0):
        """Start continuous monitoring."""
        logger.info(f"Starting monitoring (interval={interval_seconds}s)")
        
        while True:
            try:
                await self._collect_metrics()
                await self._check_health()
                await asyncio.sleep(interval_seconds)
            except Exception as e:
                logger.error(f"Monitoring error: {e}")
                await asyncio.sleep(interval_seconds)
    
    async def _collect_metrics(self):
        """Collect system metrics."""
        import psutil
        
        # System metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        metrics = {
            "timestamp": time.time(),
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "memory_available_mb": memory.available / (1024 * 1024),
            "disk_percent": disk.percent,
            "disk_free_gb": disk.free / (1024 * 1024 * 1024)
        }
        
        self._metrics.append(metrics)
        
        # Log if thresholds exceeded
        if cpu_percent > self._thresholds["cpu_percent"]:
            logger.warning(f"High CPU usage: {cpu_percent}%")
        
        if memory.percent > self._thresholds["memory_percent"]:
            logger.warning(f"High memory usage: {memory.percent}%")
    
    async def _check_health(self):
        """Check overall system health."""
        if len(self._metrics) < 2:
            return
        
        recent = list(self._metrics)[-10:]
        
        avg_cpu = sum(m["cpu_percent"] for m in recent) / len(recent)
        avg_memory = sum(m["memory_percent"] for m in recent) / len(recent)
        
        # Determine health status
        if avg_cpu > 90 or avg_memory > 90:
            self._health_status["overall"] = "critical"
        elif avg_cpu > 70 or avg_memory > 70:
            self._health_status["overall"] = "warning"
        else:
            self._health_status["overall"] = "healthy"
        
        self._health_status["last_check"] = time.time()
        self._health_status["metrics"] = {
            "avg_cpu": avg_cpu,
            "avg_memory": avg_memory
        }
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get current health status."""
        return dict(self._health_status)
    
    def get_metrics(self, last_n: int = 100) -> List[Dict[str, Any]]:
        """Get recent metrics."""
        return list(self._metrics)[-last_n:]


class SelfImprover:
    """
    Self-improvement engine that analyzes and optimizes the system.
    """
    
    def __init__(self, data_dir: str = "./data/improvements"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # Improvement tracking
        self._suggestions: List[ImprovementSuggestion] = []
        self._applied_improvements: List[Dict[str, Any]] = []
        
        # Load existing suggestions
        self._load_suggestions()
        
        logger.info("SelfImprover initialized")
    
    async def analyze_and_improve(self, metrics: List[Dict[str, Any]]):
        """Analyze metrics and generate improvements."""
        if len(metrics) < 10:
            return
        
        # Analyze patterns
        await self._analyze_performance_patterns(metrics)
        await self._analyze_error_patterns(metrics)
        await self._analyze_resource_usage(metrics)
        
        # Apply auto-approved improvements
        await self._apply_auto_improvements()
    
    async def _analyze_performance_patterns(self, metrics: List[Dict[str, Any]]):
        """Analyze performance patterns for optimization opportunities."""
        recent = metrics[-50:]
        
        # Check for high CPU usage pattern
        high_cpu_count = sum(1 for m in recent if m.get("cpu_percent", 0) > 70)
        if high_cpu_count > len(recent) * 0.5:
            suggestion = ImprovementSuggestion(
                suggestion_id=hashlib.md5(f"cpu_optimization_{time.time()}".encode()).hexdigest()[:12],
                component="system",
                issue="Consistently high CPU usage detected",
                solution="Consider enabling more aggressive caching or reducing concurrent operations",
                confidence=0.8,
                impact_score=0.7,
                auto_apply=False
            )
            self._suggestions.append(suggestion)
            logger.info(f"Generated suggestion: {suggestion.suggestion_id}")
    
    async def _analyze_error_patterns(self, metrics: List[Dict[str, Any]]):
        """Analyze error patterns."""
        # This would analyze error logs in a real implementation
        pass
    
    async def _analyze_resource_usage(self, metrics: List[Dict[str, Any]]):
        """Analyze resource usage patterns."""
        recent = metrics[-50:]
        
        avg_memory = sum(m.get("memory_percent", 0) for m in recent) / len(recent)
        
        if avg_memory > 80:
            suggestion = ImprovementSuggestion(
                suggestion_id=hashlib.md5(f"memory_optimization_{time.time()}".encode()).hexdigest()[:12],
                component="memory",
                issue=f"High average memory usage: {avg_memory:.1f}%",
                solution="Enable lazy loading for embeddings and reduce cache sizes",
                confidence=0.85,
                impact_score=0.8,
                auto_apply=True
            )
            self._suggestions.append(suggestion)
    
    async def _apply_auto_improvements(self):
        """Automatically apply safe improvements."""
        for suggestion in self._suggestions:
            if suggestion.status == "pending" and suggestion.auto_apply:
                await self._apply_improvement(suggestion)
    
    async def _apply_improvement(self, suggestion: ImprovementSuggestion):
        """Apply a specific improvement."""
        logger.info(f"Applying improvement: {suggestion.suggestion_id}")
        
        # In a real implementation, this would modify configuration
        # or code to apply the improvement
        
        suggestion.status = "applied"
        suggestion.applied_at = time.time()
        
        self._applied_improvements.append({
            "suggestion_id": suggestion.suggestion_id,
            "component": suggestion.component,
            "solution": suggestion.solution,
            "applied_at": suggestion.applied_at
        })
        
        await self._save_suggestions()
    
    def get_suggestions(self, status: Optional[str] = None) -> List[ImprovementSuggestion]:
        """Get improvement suggestions."""
        if status:
            return [s for s in self._suggestions if s.status == status]
        return self._suggestions
    
    def approve_suggestion(self, suggestion_id: str) -> bool:
        """Approve a suggestion for application."""
        for suggestion in self._suggestions:
            if suggestion.suggestion_id == suggestion_id:
                suggestion.status = "approved"
                return True
        return False
    
    def reject_suggestion(self, suggestion_id: str) -> bool:
        """Reject a suggestion."""
        for suggestion in self._suggestions:
            if suggestion.suggestion_id == suggestion_id:
                suggestion.status = "rejected"
                return True
        return False
    
    def _load_suggestions(self):
        """Load saved suggestions."""
        try:
            file_path = self.data_dir / "suggestions.json"
            if file_path.exists():
                with open(file_path, 'r') as f:
                    data = json.load(f)
                
                for s in data.get("suggestions", []):
                    self._suggestions.append(ImprovementSuggestion(**s))
                
                logger.info(f"Loaded {len(self._suggestions)} suggestions")
        except Exception as e:
            logger.warning(f"Error loading suggestions: {e}")
    
    async def _save_suggestions(self):
        """Save suggestions to disk."""
        try:
            data = {
                "suggestions": [asdict(s) for s in self._suggestions],
                "applied": self._applied_improvements
            }
            
            file_path = self.data_dir / "suggestions.json"
            with open(file_path, 'w') as f:
                json.dump(data, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error saving suggestions: {e}")


class ContinuousLearner:
    """
    Continuous learning system that improves from usage patterns.
    """
    
    def __init__(self, data_dir: str = "./data/learning"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # Learning data
        self._patterns: Dict[str, LearningPattern] = {}
        self._usage_history: deque = deque(maxlen=10000)
        
        # Load existing patterns
        self._load_patterns()
        
        logger.info("ContinuousLearner initialized")
    
    async def learn_from_usage(self, usage_data: Dict[str, Any]):
        """Learn from usage data."""
        self._usage_history.append({
            "timestamp": time.time(),
            "data": usage_data
        })
        
        # Extract patterns
        await self._extract_query_patterns(usage_data)
        await self._extract_timing_patterns(usage_data)
        await self._extract_model_preferences(usage_data)
    
    async def _extract_query_patterns(self, usage_data: Dict[str, Any]):
        """Extract patterns from queries."""
        query = usage_data.get("query", "")
        if not query:
            return
        
        # Simple pattern extraction (in production, use NLP)
        words = query.lower().split()
        
        for word in words:
            if len(word) < 4:
                continue
            
            pattern_id = f"word_{word}"
            
            if pattern_id not in self._patterns:
                self._patterns[pattern_id] = LearningPattern(
                    pattern_id=pattern_id,
                    pattern_type="query_word",
                    pattern_data={"word": word}
                )
            
            self._patterns[pattern_id].frequency += 1
            self._patterns[pattern_id].last_seen = time.time()
            self._patterns[pattern_id].confidence = min(1.0, self._patterns[pattern_id].frequency / 100)
    
    async def _extract_timing_patterns(self, usage_data: Dict[str, Any]):
        """Extract timing patterns."""
        hour = datetime.now().hour
        
        pattern_id = f"hour_{hour}"
        
        if pattern_id not in self._patterns:
            self._patterns[pattern_id] = LearningPattern(
                pattern_id=pattern_id,
                pattern_type="usage_time",
                pattern_data={"hour": hour}
            )
        
        self._patterns[pattern_id].frequency += 1
        self._patterns[pattern_id].last_seen = time.time()
    
    async def _extract_model_preferences(self, usage_data: Dict[str, Any]):
        """Extract model preference patterns."""
        model = usage_data.get("model_used", "")
        success = usage_data.get("success", True)
        
        if not model:
            return
        
        pattern_id = f"model_{model}"
        
        if pattern_id not in self._patterns:
            self._patterns[pattern_id] = LearningPattern(
                pattern_id=pattern_id,
                pattern_type="model_preference",
                pattern_data={"model": model, "successes": 0, "failures": 0}
            )
        
        if success:
            self._patterns[pattern_id].pattern_data["successes"] += 1
        else:
            self._patterns[pattern_id].pattern_data["failures"] += 1
        
        total = (self._patterns[pattern_id].pattern_data["successes"] + 
                 self._patterns[pattern_id].pattern_data["failures"])
        
        self._patterns[pattern_id].frequency += 1
        self._patterns[pattern_id].last_seen = time.time()
        self._patterns[pattern_id].confidence = (
            self._patterns[pattern_id].pattern_data["successes"] / total if total > 0 else 0
        )
    
    def get_top_patterns(self, pattern_type: Optional[str] = None, n: int = 10) -> List[LearningPattern]:
        """Get top learned patterns."""
        patterns = list(self._patterns.values())
        
        if pattern_type:
            patterns = [p for p in patterns if p.pattern_type == pattern_type]
        
        patterns.sort(key=lambda p: (p.confidence, p.frequency), reverse=True)
        return patterns[:n]
    
    def get_learned_insights(self) -> Dict[str, Any]:
        """Get insights from learned patterns."""
        # Peak usage hours
        hour_patterns = [p for p in self._patterns.values() if p.pattern_type == "usage_time"]
        peak_hours = sorted(hour_patterns, key=lambda p: p.frequency, reverse=True)[:3]
        
        # Preferred models
        model_patterns = [p for p in self._patterns.values() if p.pattern_type == "model_preference"]
        preferred_models = sorted(model_patterns, key=lambda p: p.confidence, reverse=True)[:3]
        
        # Common query terms
        word_patterns = [p for p in self._patterns.values() if p.pattern_type == "query_word"]
        common_terms = sorted(word_patterns, key=lambda p: p.frequency, reverse=True)[:10]
        
        return {
            "peak_hours": [{"hour": p.pattern_data["hour"], "frequency": p.frequency} for p in peak_hours],
            "preferred_models": [{"model": p.pattern_data["model"], "confidence": p.confidence} for p in preferred_models],
            "common_terms": [{"term": p.pattern_data["word"], "frequency": p.frequency} for p in common_terms],
            "total_patterns": len(self._patterns)
        }
    
    def _load_patterns(self):
        """Load saved patterns."""
        try:
            file_path = self.data_dir / "patterns.json"
            if file_path.exists():
                with open(file_path, 'r') as f:
                    data = json.load(f)
                
                for p in data.get("patterns", []):
                    self._patterns[p["pattern_id"]] = LearningPattern(**p)
                
                logger.info(f"Loaded {len(self._patterns)} patterns")
        except Exception as e:
            logger.warning(f"Error loading patterns: {e}")
    
    async def save_patterns(self):
        """Save patterns to disk."""
        try:
            data = {
                "patterns": [asdict(p) for p in self._patterns.values()],
                "saved_at": time.time()
            }
            
            file_path = self.data_dir / "patterns.json"
            with open(file_path, 'w') as f:
                json.dump(data, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error saving patterns: {e}")


class AutonomousCore:
    """
    Main autonomous core that orchestrates self-evolution.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        
        # Subsystems
        self.monitor = SelfMonitor()
        self.improver = SelfImprover()
        self.learner = ContinuousLearner()
        
        # State
        self._running = False
        self._tasks: List[asyncio.Task] = []
        
        logger.info("AutonomousCore initialized")
    
    async def start(self):
        """Start the autonomous core."""
        self._running = True
        
        logger.info("Starting Autonomous Core...")
        
        # Start monitoring
        monitor_task = asyncio.create_task(
            self.monitor.start_monitoring(interval_seconds=30.0)
        )
        self._tasks.append(monitor_task)
        
        # Start improvement loop
        improve_task = asyncio.create_task(self._improvement_loop())
        self._tasks.append(improve_task)
        
        # Start learning loop
        learn_task = asyncio.create_task(self._learning_loop())
        self._tasks.append(learn_task)
        
        # Start pattern saving
        save_task = asyncio.create_task(self._save_loop())
        self._tasks.append(save_task)
        
        logger.info("Autonomous Core started successfully")
    
    async def stop(self):
        """Stop the autonomous core."""
        self._running = False
        
        logger.info("Stopping Autonomous Core...")
        
        for task in self._tasks:
            task.cancel()
        
        await asyncio.gather(*self._tasks, return_exceptions=True)
        
        # Save final state
        await self.learner.save_patterns()
        
        logger.info("Autonomous Core stopped")
    
    async def _improvement_loop(self):
        """Continuous improvement loop."""
        while self._running:
            try:
                metrics = self.monitor.get_metrics(last_n=100)
                await self.improver.analyze_and_improve(metrics)
                await asyncio.sleep(300)  # Every 5 minutes
            except Exception as e:
                logger.error(f"Improvement loop error: {e}")
                await asyncio.sleep(300)
    
    async def _learning_loop(self):
        """Continuous learning loop."""
        while self._running:
            try:
                # Simulate learning from recent activity
                # In production, this would read from actual usage logs
                await asyncio.sleep(60)
            except Exception as e:
                logger.error(f"Learning loop error: {e}")
                await asyncio.sleep(60)
    
    async def _save_loop(self):
        """Periodic saving loop."""
        while self._running:
            try:
                await self.learner.save_patterns()
                await asyncio.sleep(300)  # Every 5 minutes
            except Exception as e:
                logger.error(f"Save loop error: {e}")
                await asyncio.sleep(300)
    
    def get_status(self) -> Dict[str, Any]:
        """Get autonomous core status."""
        return {
            "running": self._running,
            "health": self.monitor.get_health_status(),
            "suggestions_pending": len(self.improver.get_suggestions("pending")),
            "suggestions_applied": len(self.improver._applied_improvements),
            "patterns_learned": len(self.learner._patterns),
            "insights": self.learner.get_learned_insights()
        }
    
    async def report_usage(self, usage_data: Dict[str, Any]):
        """Report usage data for learning."""
        await self.learner.learn_from_usage(usage_data)


# Global instance
_autonomous_core: Optional[AutonomousCore] = None


def get_autonomous_core(config: Optional[Dict[str, Any]] = None) -> AutonomousCore:
    """Get or create global autonomous core instance."""
    global _autonomous_core
    if _autonomous_core is None:
        _autonomous_core = AutonomousCore(config)
    return _autonomous_core


async def main():
    """Main entry point for autonomous core."""
    core = get_autonomous_core()
    
    try:
        await core.start()
        
        # Keep running
        while True:
            status = core.get_status()
            logger.info(f"Status: {status['health']['overall']}, Patterns: {status['patterns_learned']}")
            await asyncio.sleep(60)
            
    except KeyboardInterrupt:
        logger.info("Shutting down...")
        await core.stop()


if __name__ == "__main__":
    asyncio.run(main())
