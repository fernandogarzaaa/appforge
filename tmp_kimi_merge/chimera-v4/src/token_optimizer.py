"""
Quantum Chimera LLM v4.0 - Token Optimizer
============================================
Advanced token cost minimization with prompt compression and smart routing.
"""

import re
import json
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
import hashlib

from config import get_config
from src.logger import get_logger

logger = get_logger()


@dataclass
class TokenEstimate:
    """Token estimate for a request."""
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    estimated_cost: float


class TokenOptimizer:
    """
    Optimizes token usage to minimize costs.
    """
    
    # Approximate tokens per character for different languages
    TOKENS_PER_CHAR = {
        "en": 0.25,  # English
        "code": 0.3,  # Code
        "zh": 0.5,   # Chinese
        "default": 0.25,
    }
    
    def __init__(self):
        self.config = get_config()
        self.compression_cache: Dict[str, str] = {}
        logger.info("TokenOptimizer initialized")
    
    def estimate_tokens(self, text: str, content_type: str = "default") -> int:
        """
        Estimate token count for text.
        
        Uses character-based approximation which is fast and reasonably accurate.
        """
        if not text:
            return 0
        
        rate = self.TOKENS_PER_CHAR.get(content_type, self.TOKENS_PER_CHAR["default"])
        return int(len(text) * rate)
    
    def estimate_request_cost(
        self, 
        messages: List[Dict[str, str]], 
        model_pricing: Dict[str, float]
    ) -> TokenEstimate:
        """
        Estimate cost for a request.
        
        Args:
            messages: List of message dicts
            model_pricing: {"prompt": cost_per_token, "completion": cost_per_token}
        """
        # Calculate prompt tokens
        prompt_text = "\n".join(m.get("content", "") for m in messages)
        prompt_tokens = self.estimate_tokens(prompt_text)
        
        # Estimate completion tokens (rough heuristic based on prompt complexity)
        prompt_complexity = self._calculate_complexity(prompt_text)
        completion_tokens = min(4096, int(prompt_tokens * (0.5 + prompt_complexity)))
        
        # Calculate cost
        prompt_cost = prompt_tokens * model_pricing.get("prompt", 0)
        completion_cost = completion_tokens * model_pricing.get("completion", 0)
        total_cost = prompt_cost + completion_cost
        
        return TokenEstimate(
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=prompt_tokens + completion_tokens,
            estimated_cost=total_cost,
        )
    
    def _calculate_complexity(self, text: str) -> float:
        """
        Calculate text complexity (0-1).
        
        Higher complexity = longer expected response.
        """
        if not text:
            return 0.5
        
        complexity = 0.5  # Base complexity
        
        # Question marks indicate questions (expect answers)
        question_ratio = text.count("?") / max(1, len(text.split()))
        complexity += question_ratio * 0.3
        
        # Code blocks indicate technical content
        if "```" in text or "`" in text:
            complexity += 0.2
        
        # Long text indicates complex request
        word_count = len(text.split())
        if word_count > 100:
            complexity += 0.1
        
        # Specific keywords indicate complex tasks
        complex_keywords = [
            "explain", "analyze", "compare", "contrast", "evaluate",
            "implement", "design", "architecture", "algorithm",
        ]
        text_lower = text.lower()
        for keyword in complex_keywords:
            if keyword in text_lower:
                complexity += 0.05
        
        return min(1.0, complexity)
    
    def compress_prompt(
        self, 
        messages: List[Dict[str, str]], 
        target_ratio: float = None
    ) -> List[Dict[str, str]]:
        """
        Compress prompt to reduce token count.
        
        Uses multiple techniques:
        1. Remove redundant whitespace
        2. Truncate very long messages
        3. Summarize conversation history
        """
        if not self.config.ENABLE_PROMPT_COMPRESSION:
            return messages
        
        if target_ratio is None:
            target_ratio = self.config.COMPRESSION_RATIO_TARGET
        
        compressed = []
        
        for msg in messages:
            content = msg.get("content", "")
            role = msg.get("role", "user")
            
            # Skip empty messages
            if not content.strip():
                continue
            
            # Compress content
            compressed_content = self._compress_content(content, role)
            
            compressed.append({
                "role": role,
                "content": compressed_content,
            })
        
        # Calculate compression ratio
        original_tokens = sum(self.estimate_tokens(m.get("content", "")) for m in messages)
        compressed_tokens = sum(self.estimate_tokens(m.get("content", "")) for m in compressed)
        
        if original_tokens > 0:
            achieved_ratio = compressed_tokens / original_tokens
            logger.debug(f"Prompt compression",
                        original_tokens=original_tokens,
                        compressed_tokens=compressed_tokens,
                        ratio=round(achieved_ratio, 2))
        
        return compressed
    
    def _compress_content(self, content: str, role: str) -> str:
        """Compress a single message content."""
        # Remove excessive whitespace
        content = re.sub(r'\n{3,}', '\n\n', content)
        content = re.sub(r' {2,}', ' ', content)
        
        # Truncate very long messages (but keep system messages mostly intact)
        max_length = 4000 if role == "system" else 3000
        if len(content) > max_length:
            content = content[:max_length] + "... [truncated]"
        
        # Remove common filler phrases
        filler_phrases = [
            "I would like to",
            "Could you please",
            "I was wondering if",
            "It would be great if",
        ]
        for phrase in filler_phrases:
            content = content.replace(phrase, "")
        
        return content.strip()
    
    def select_cheapest_model(
        self, 
        models: List[str], 
        model_costs: Dict[str, float]
    ) -> str:
        """
        Select the cheapest available model.
        
        Returns model with lowest cost per 1k tokens.
        """
        if not models:
            return ""
        
        # Sort by cost
        sorted_models = sorted(
            models,
            key=lambda m: model_costs.get(m, float('inf'))
        )
        
        cheapest = sorted_models[0]
        logger.debug(f"Selected cheapest model: {cheapest}",
                    cost=model_costs.get(cheapest, 0))
        
        return cheapest
    
    def should_use_caching(
        self, 
        messages: List[Dict[str, str]], 
        cache_hit_rate: float
    ) -> bool:
        """
        Determine if caching should be prioritized.
        
        High cache hit rate = prioritize cache over cost optimization.
        """
        # If cache hit rate is good (>40%), always try cache first
        if cache_hit_rate > 0.4:
            return True
        
        # For simple queries, cache is more valuable
        query = messages[-1].get("content", "") if messages else ""
        if len(query.split()) < 10:
            return True
        
        return False
    
    def optimize_request(
        self, 
        messages: List[Dict[str, str]],
        available_models: List[str],
        model_costs: Dict[str, float],
        cache_hit_rate: float = 0,
    ) -> Tuple[List[Dict[str, str]], List[str], str]:
        """
        Full request optimization pipeline.
        
        Returns:
            (optimized_messages, prioritized_models, strategy)
        """
        # Step 1: Compress prompt
        compressed_messages = self.compress_prompt(messages)
        
        # Step 2: Determine strategy
        if self.should_use_caching(messages, cache_hit_rate):
            strategy = "cache_priority"
            # Prioritize models with good cache performance
            prioritized_models = available_models
        
        elif self.config.ENABLE_TOKEN_OPTIMIZER:
            strategy = "cost_optimized"
            # Sort by cost
            prioritized_models = sorted(
                available_models,
                key=lambda m: model_costs.get(m, float('inf'))
            )
        else:
            strategy = "default"
            prioritized_models = available_models
        
        logger.debug(f"Request optimization",
                    strategy=strategy,
                    original_msgs=len(messages),
                    compressed_msgs=len(compressed_messages),
                    models_available=len(prioritized_models))
        
        return compressed_messages, prioritized_models, strategy
    
    def get_cost_report(self) -> Dict[str, Any]:
        """Get cost optimization report."""
        return {
            "compression_enabled": self.config.ENABLE_PROMPT_COMPRESSION,
            "compression_ratio_target": self.config.COMPRESSION_RATIO_TARGET,
            "token_cost_threshold": self.config.TOKEN_COST_THRESHOLD,
            "cache_size": len(self.compression_cache),
        }


# Global instance
_token_optimizer: Optional[TokenOptimizer] = None


def get_token_optimizer() -> TokenOptimizer:
    """Get global token optimizer instance."""
    global _token_optimizer
    if _token_optimizer is None:
        _token_optimizer = TokenOptimizer()
    return _token_optimizer
