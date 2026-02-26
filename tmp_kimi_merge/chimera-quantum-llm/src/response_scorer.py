"""
Quantum Chimera LLM - Response Scorer
======================================
Lightweight response quality scoring (0.0 - 1.0).
"""

import re
from typing import Dict, Any

from src.logger import get_logger

logger = get_logger()


class ResponseScorer:
    """
    Score response quality based on multiple factors:
    - Length ratio vs query complexity
    - Empty/near-empty detection
    - Repetition detection
    - Query echo detection
    """
    
    def __init__(self):
        logger.info("ResponseScorer initialized")
    
    def score(self, query: str, response: str) -> float:
        """
        Score a response (0.0 - 1.0).
        
        Returns:
            Quality score where 1.0 is perfect, 0.0 is terrible
        """
        scores = []
        reasons = []
        
        # 1. Empty or near-empty detection
        empty_score = self._score_empty(response)
        scores.append(empty_score)
        if empty_score < 1.0:
            reasons.append(f"empty_score={empty_score:.2f}")
        
        # 2. Length ratio
        length_score = self._score_length(query, response)
        scores.append(length_score)
        if length_score < 1.0:
            reasons.append(f"length_score={length_score:.2f}")
        
        # 3. Repetition detection
        repetition_score = self._score_repetition(response)
        scores.append(repetition_score)
        if repetition_score < 1.0:
            reasons.append(f"repetition_score={repetition_score:.2f}")
        
        # 4. Query echo detection
        echo_score = self._score_echo(query, response)
        scores.append(echo_score)
        if echo_score < 1.0:
            reasons.append(f"echo_score={echo_score:.2f}")
        
        # Calculate weighted average
        weights = [0.3, 0.25, 0.25, 0.2]  # Empty, Length, Repetition, Echo
        final_score = sum(s * w for s, w in zip(scores, weights))
        
        # Log if score is low
        if final_score < 0.5:
            logger.warning(f"Low quality response detected",
                          score=round(final_score, 3),
                          reasons=reasons,
                          query_preview=query[:50],
                          response_preview=response[:100])
        else:
            logger.debug(f"Response scored",
                        score=round(final_score, 3),
                        query_preview=query[:50])
        
        return final_score
    
    def _score_empty(self, response: str) -> float:
        """Score based on empty/near-empty detection."""
        response = response.strip()
        
        # Completely empty
        if not response:
            return 0.0
        
        # Very short (under 20 chars)
        if len(response) < 20:
            return 0.0
        
        # Short (20-50 chars)
        if len(response) < 50:
            return 0.3
        
        # Reasonable length
        if len(response) < 100:
            return 0.7
        
        # Good length
        return 1.0
    
    def _score_length(self, query: str, response: str) -> float:
        """Score based on length ratio vs query complexity."""
        query_words = len(query.split())
        response_words = len(response.split())
        
        # Simple queries (< 5 words) should get short responses
        if query_words < 5:
            if response_words < 10:
                return 1.0
            elif response_words < 30:
                return 0.8
            else:
                return 0.6  # Too verbose for simple query
        
        # Medium queries (5-20 words)
        if query_words < 20:
            expected_min = query_words * 0.5
            expected_max = query_words * 3
            
            if expected_min <= response_words <= expected_max:
                return 1.0
            elif response_words < expected_min:
                return 0.5  # Too short
            else:
                return 0.7  # A bit verbose
        
        # Complex queries (> 20 words) should get detailed responses
        expected_min = query_words * 0.3
        if response_words >= expected_min:
            return 1.0
        elif response_words >= expected_min * 0.5:
            return 0.6
        else:
            return 0.3  # Too short for complex query
    
    def _score_repetition(self, response: str) -> float:
        """Score based on repetition detection."""
        # Split into sentences
        sentences = re.split(r'[.!?]+', response)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        if len(sentences) < 3:
            return 1.0  # Not enough sentences to check
        
        # Check for repeated sentences
        sentence_counts = {}
        for sent in sentences:
            # Normalize: lowercase, remove extra spaces
            normalized = ' '.join(sent.lower().split())
            sentence_counts[normalized] = sentence_counts.get(normalized, 0) + 1
        
        # Find max repetition
        max_repeats = max(sentence_counts.values())
        
        if max_repeats >= 3:
            return 0.0  # Severe repetition
        elif max_repeats == 2:
            # Check if it's a significant portion
            repeat_ratio = sum(1 for c in sentence_counts.values() if c >= 2) / len(sentences)
            if repeat_ratio > 0.3:
                return 0.3
            return 0.7
        
        return 1.0
    
    def _score_echo(self, query: str, response: str) -> float:
        """Score based on query echo detection."""
        query_normalized = ' '.join(query.lower().split())
        response_normalized = ' '.join(response.lower().split())
        
        # Check if response is just the query repeated
        if query_normalized == response_normalized:
            return 0.0
        
        # Check if response starts with the exact query
        if response_normalized.startswith(query_normalized):
            # If it's just the query + a little, it's an echo
            extra_length = len(response_normalized) - len(query_normalized)
            if extra_length < 20:
                return 0.1
            elif extra_length < 50:
                return 0.5
        
        # Check for high similarity (but not exact)
        query_words = set(query_normalized.split())
        response_words = set(response_normalized.split())
        
        if query_words and response_words:
            overlap = len(query_words & response_words)
            similarity = overlap / len(query_words)
            
            if similarity > 0.9:
                return 0.2
            elif similarity > 0.7:
                return 0.6
        
        return 1.0
    
    def get_score_breakdown(self, query: str, response: str) -> Dict[str, Any]:
        """Get detailed score breakdown."""
        return {
            "total_score": round(self.score(query, response), 3),
            "empty_score": round(self._score_empty(response), 3),
            "length_score": round(self._score_length(query, response), 3),
            "repetition_score": round(self._score_repetition(response), 3),
            "echo_score": round(self._score_echo(query, response), 3),
        }


# Global instance
_scorer: Optional[ResponseScorer] = None


def get_response_scorer() -> ResponseScorer:
    """Get global response scorer instance."""
    global _scorer
    if _scorer is None:
        _scorer = ResponseScorer()
    return _scorer
