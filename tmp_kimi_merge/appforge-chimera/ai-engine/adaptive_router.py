"""
Quantum Chimera LLM v4.0 - Adaptive Router
============================================
Advanced routing algorithms: Multi-Armed Bandit, Thompson Sampling, Quantum Superposition Routing
"""

import random
import math
import time
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, field
from collections import defaultdict
import numpy as np

from config import get_config
from src.logger import get_logger

logger = get_logger()


@dataclass
class ModelArm:
    """A model arm for multi-armed bandit."""
    model_id: str
    successes: int = 0
    failures: int = 0
    total_reward: float = 0.0
    pulls: int = 0
    avg_latency_ms: float = 0.0
    last_pull: float = 0.0
    
    @property
    def success_rate(self) -> float:
        if self.pulls == 0:
            return 0.5  # Prior belief
        return self.successes / self.pulls
    
    @property
    def ucb_score(self) -> float:
        """Upper Confidence Bound score."""
        if self.pulls == 0:
            return float('inf')
        
        # UCB1 formula
        exploration = math.sqrt(2 * math.log(self.pulls + 1) / self.pulls)
        return self.success_rate + exploration
    
    @property
    def thompson_sample(self) -> float:
        """Thompson Sampling score."""
        # Beta distribution parameters
        alpha = self.successes + 1
        beta = self.failures + 1
        return np.random.beta(alpha, beta)
    
    def update(self, success: bool, reward: float, latency_ms: float):
        """Update arm statistics."""
        self.pulls += 1
        if success:
            self.successes += 1
        else:
            self.failures += 1
        
        self.total_reward += reward
        
        # Update latency with EMA
        if self.avg_latency_ms == 0:
            self.avg_latency_ms = latency_ms
        else:
            self.avg_latency_ms = 0.7 * self.avg_latency_ms + 0.3 * latency_ms
        
        self.last_pull = time.time()


class MultiArmedBanditRouter:
    """
    Multi-Armed Bandit router with UCB1 algorithm.
    Balances exploration vs exploitation.
    """
    
    def __init__(self):
        self.arms: Dict[str, ModelArm] = {}
        self.config = get_config()
        self.total_pulls = 0
    
    def register_model(self, model_id: str):
        """Register a model as an arm."""
        if model_id not in self.arms:
            self.arms[model_id] = ModelArm(model_id=model_id)
    
    def select_model(self, available_models: List[str]) -> str:
        """Select model using UCB1 algorithm."""
        # Register any new models
        for model_id in available_models:
            self.register_model(model_id)
        
        # Filter to available arms
        available_arms = [self.arms[m] for m in available_models if m in self.arms]
        
        if not available_arms:
            return random.choice(available_models) if available_models else ""
        
        # UCB1: Select arm with highest UCB score
        best_arm = max(available_arms, key=lambda a: a.ucb_score)
        
        logger.debug(f"MAB selected {best_arm.model_id}",
                    ucb_score=best_arm.ucb_score,
                    success_rate=best_arm.success_rate,
                    pulls=best_arm.pulls)
        
        return best_arm.model_id
    
    def update(self, model_id: str, success: bool, reward: float, latency_ms: float):
        """Update arm after request."""
        if model_id in self.arms:
            self.arms[model_id].update(success, reward, latency_ms)
            self.total_pulls += 1


class ThompsonSamplingRouter:
    """
    Thompson Sampling router.
    Uses Bayesian approach with Beta distribution.
    """
    
    def __init__(self):
        self.arms: Dict[str, ModelArm] = {}
        self.config = get_config()
    
    def register_model(self, model_id: str):
        """Register a model as an arm."""
        if model_id not in self.arms:
            self.arms[model_id] = ModelArm(model_id=model_id)
    
    def select_model(self, available_models: List[str]) -> str:
        """Select model using Thompson Sampling."""
        for model_id in available_models:
            self.register_model(model_id)
        
        available_arms = [self.arms[m] for m in available_models if m in self.arms]
        
        if not available_arms:
            return random.choice(available_models) if available_models else ""
        
        # Thompson Sampling: Sample from each arm's posterior
        best_arm = max(available_arms, key=lambda a: a.thompson_sample)
        
        logger.debug(f"Thompson selected {best_arm.model_id}",
                    success_rate=best_arm.success_rate,
                    pulls=best_arm.pulls)
        
        return best_arm.model_id
    
    def update(self, model_id: str, success: bool, reward: float, latency_ms: float):
        """Update arm after request."""
        if model_id in self.arms:
            self.arms[model_id].update(success, reward, latency_ms)


class QuantumSuperpositionRouter:
    """
    Quantum-inspired superposition routing.
    Explores multiple models simultaneously in "superposition"
    then collapses to best based on weighted probability.
    """
    
    def __init__(self):
        self.models: Dict[str, Dict[str, Any]] = {}
        self.config = get_config()
        self.superposition_size = 3  # Number of models in superposition
    
    def register_model(self, model_id: str, cost_per_1k: float = 0):
        """Register a model."""
        if model_id not in self.models:
            self.models[model_id] = {
                "cost_per_1k": cost_per_1k,
                "success_rate": 0.5,
                "avg_latency_ms": 0,
                "quantum_amplitude": 1.0,
            }
    
    def _calculate_quantum_weights(self, models: List[str]) -> Dict[str, float]:
        """
        Calculate quantum-inspired weights for models.
        
        Uses interference pattern:
        - High success rate → constructive interference (higher weight)
        - Low latency → constructive interference
        - Low cost → constructive interference
        """
        weights = {}
        
        for model_id in models:
            if model_id not in self.models:
                weights[model_id] = 1.0
                continue
            
            model = self.models[model_id]
            
            # Success rate component (0-1)
            success_weight = model["success_rate"]
            
            # Latency component (inverse, normalized)
            latency_ms = model["avg_latency_ms"]
            if latency_ms > 0:
                latency_weight = 1.0 / (1 + latency_ms / 1000)  # Normalize to seconds
            else:
                latency_weight = 0.5
            
            # Cost component (inverse)
            cost = model["cost_per_1k"]
            if cost > 0:
                cost_weight = 1.0 / (1 + cost * 100)  # Scale cost
            else:
                cost_weight = 1.0  # Free models get max weight
            
            # Quantum interference: combine with constructive/destructive patterns
            # Use config weights
            w_success = self.config.QUALITY_WEIGHT
            w_latency = self.config.LATENCY_WEIGHT
            w_cost = self.config.COST_WEIGHT
            
            # Combined weight (quantum superposition)
            weight = (w_success * success_weight + 
                     w_latency * latency_weight + 
                     w_cost * cost_weight)
            
            # Add quantum noise for exploration
            if self.config.EXPLORATION_RATE > 0:
                noise = np.random.normal(0, self.config.EXPLORATION_RATE)
                weight = max(0.1, weight + noise)
            
            weights[model_id] = weight
        
        return weights
    
    def select_models_superposition(self, available_models: List[str]) -> List[str]:
        """
        Select multiple models in "quantum superposition".
        Returns top N models based on quantum weights.
        """
        for model_id in available_models:
            self.register_model(model_id)
        
        weights = self._calculate_quantum_weights(available_models)
        
        # Sort by weight (descending)
        sorted_models = sorted(
            available_models,
            key=lambda m: weights.get(m, 0),
            reverse=True
        )
        
        # Return top N models in superposition
        return sorted_models[:self.superposition_size]
    
    def collapse_superposition(self, models: List[str], context: Dict) -> str:
        """
        Collapse superposition to single model based on context.
        
        Uses weighted random selection (quantum measurement).
        """
        weights = self._calculate_quantum_weights(models)
        
        # Normalize weights to probabilities
        total_weight = sum(weights.get(m, 0) for m in models)
        if total_weight == 0:
            return random.choice(models)
        
        probabilities = [weights.get(m, 0) / total_weight for m in models]
        
        # Quantum measurement: weighted random selection
        selected = np.random.choice(models, p=probabilities)
        
        logger.debug(f"Quantum collapse selected {selected}",
                    probabilities={m: round(p, 3) for m, p in zip(models, probabilities)})
        
        return selected
    
    def update(self, model_id: str, success: bool, reward: float, latency_ms: float):
        """Update model statistics."""
        if model_id in self.models:
            model = self.models[model_id]
            
            # Update success rate with EMA
            alpha = 0.3
            current = 1.0 if success else 0.0
            model["success_rate"] = alpha * current + (1 - alpha) * model["success_rate"]
            
            # Update latency
            if model["avg_latency_ms"] == 0:
                model["avg_latency_ms"] = latency_ms
            else:
                model["avg_latency_ms"] = 0.7 * model["avg_latency_ms"] + 0.3 * latency_ms
            
            # Update quantum amplitude based on success
            if success:
                model["quantum_amplitude"] = min(2.0, model["quantum_amplitude"] * 1.1)
            else:
                model["quantum_amplitude"] = max(0.1, model["quantum_amplitude"] * 0.9)


class AdaptiveRouter:
    """
    Adaptive router that switches between algorithms based on context.
    """
    
    def __init__(self):
        self.config = get_config()
        self.mab_router = MultiArmedBanditRouter()
        self.thompson_router = ThompsonSamplingRouter()
        self.quantum_router = QuantumSuperpositionRouter()
        
        # Algorithm performance tracking
        self.algorithm_stats = {
            "mab": {"successes": 0, "failures": 0, "total_reward": 0},
            "thompson": {"successes": 0, "failures": 0, "total_reward": 0},
            "quantum": {"successes": 0, "failures": 0, "total_reward": 0},
        }
    
    def select_model(self, available_models: List[str], context: Dict = None) -> str:
        """
        Select model using configured routing algorithm.
        """
        if not available_models:
            return ""
        
        algorithm = self.config.ROUTING_ALGORITHM
        
        if algorithm == "multi_armed_bandit":
            return self.mab_router.select_model(available_models)
        
        elif algorithm == "thompson_sampling":
            return self.thompson_router.select_model(available_models)
        
        elif algorithm == "quantum_superposition":
            # Get superposition then collapse
            superposition = self.quantum_router.select_models_superposition(available_models)
            return self.quantum_router.collapse_superposition(superposition, context or {})
        
        elif algorithm == "round_robin":
            # Simple round-robin
            return available_models[0]
        
        elif algorithm == "weighted":
            # Weighted random based on success rate
            return self._weighted_random(available_models)
        
        else:
            # Default to MAB
            return self.mab_router.select_model(available_models)
    
    def _weighted_random(self, models: List[str]) -> str:
        """Weighted random selection based on model stats."""
        from src.model_tracker import get_model_tracker
        
        tracker = get_model_tracker()
        
        # Get scores for all models
        scores = []
        for model_id in models:
            score = tracker.get_score(model_id)
            scores.append(max(0.1, score))  # Minimum weight
        
        # Normalize to probabilities
        total = sum(scores)
        probabilities = [s / total for s in scores]
        
        return np.random.choice(models, p=probabilities)
    
    def update(self, model_id: str, success: bool, reward: float, latency_ms: float):
        """Update all routers after request."""
        self.mab_router.update(model_id, success, reward, latency_ms)
        self.thompson_router.update(model_id, success, reward, latency_ms)
        self.quantum_router.update(model_id, success, reward, latency_ms)
        
        # Update algorithm stats
        algorithm = self.config.ROUTING_ALGORITHM
        if algorithm in self.algorithm_stats:
            stats = self.algorithm_stats[algorithm]
            if success:
                stats["successes"] += 1
            else:
                stats["failures"] += 1
            stats["total_reward"] += reward


# Global instance
_adaptive_router: Optional[AdaptiveRouter] = None


def get_adaptive_router() -> AdaptiveRouter:
    """Get global adaptive router instance."""
    global _adaptive_router
    if _adaptive_router is None:
        _adaptive_router = AdaptiveRouter()
    return _adaptive_router
