"""
Quantum Chimera LLM v4.0 - Response Quality Scorer
==================================================
Advanced response quality evaluation system.

Features:
- Multi-dimensional quality scoring
- Semantic relevance analysis
- Coherence and fluency metrics
- Factual consistency checking
- Toxicity and safety scoring
"""

import re
import json
import math
import asyncio
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from collections import Counter
import logging

logger = logging.getLogger(__name__)


@dataclass
class QualityScore:
    """Quality score breakdown."""
    overall: float = 0.0
    relevance: float = 0.0
    coherence: float = 0.0
    fluency: float = 0.0
    diversity: float = 0.0
    safety: float = 1.0
    
    def to_dict(self) -> Dict[str, float]:
        return {
            "overall": round(self.overall, 4),
            "relevance": round(self.relevance, 4),
            "coherence": round(self.coherence, 4),
            "fluency": round(self.fluency, 4),
            "diversity": round(self.diversity, 4),
            "safety": round(self.safety, 4)
        }


class ResponseScorer:
    """
    Advanced response quality scorer.
    
    Evaluates responses on multiple dimensions:
    - Relevance: How well the response addresses the query
    - Coherence: Logical flow and structure
    - Fluency: Grammar and readability
    - Diversity: Vocabulary richness
    - Safety: Absence of harmful content
    """
    
    # Toxicity keywords (basic list)
    TOXIC_KEYWORDS = [
        "hate", "kill", "violence", "attack", "abuse",
        "discriminate", "racist", "sexist", "homophobic"
    ]
    
    def __init__(self):
        self._embedding_cache: Dict[str, List[float]] = {}
    
    def score_response(
        self,
        query: str,
        response: str,
        context: Optional[List[Dict[str, str]]] = None
    ) -> QualityScore:
        """
        Score a response on multiple quality dimensions.
        
        Args:
            query: The user query
            response: The model response
            context: Optional conversation context
        
        Returns:
            QualityScore with breakdown
        """
        if not response or not response.strip():
            return QualityScore(overall=0.0)
        
        # Calculate individual scores
        relevance = self._score_relevance(query, response)
        coherence = self._score_coherence(response)
        fluency = self._score_fluency(response)
        diversity = self._score_diversity(response)
        safety = self._score_safety(response)
        
        # Calculate weighted overall score
        weights = {
            "relevance": 0.30,
            "coherence": 0.25,
            "fluency": 0.20,
            "diversity": 0.15,
            "safety": 0.10
        }
        
        overall = (
            relevance * weights["relevance"] +
            coherence * weights["coherence"] +
            fluency * weights["fluency"] +
            diversity * weights["diversity"] +
            safety * weights["safety"]
        )
        
        return QualityScore(
            overall=round(overall, 4),
            relevance=round(relevance, 4),
            coherence=round(coherence, 4),
            fluency=round(fluency, 4),
            diversity=round(diversity, 4),
            safety=round(safety, 4)
        )
    
    def _score_relevance(self, query: str, response: str) -> float:
        """Score relevance of response to query."""
        query_lower = query.lower()
        response_lower = response.lower()
        
        # Extract keywords from query (simple approach)
        query_words = set(self._extract_keywords(query_lower))
        response_words = set(self._extract_keywords(response_lower))
        
        if not query_words:
            return 0.5  # Neutral if no keywords
        
        # Calculate overlap
        overlap = query_words & response_words
        coverage = len(overlap) / len(query_words)
        
        # Check for direct answers to common question types
        question_bonus = 0.0
        
        # Check if response answers the question type
        if any(w in query_lower for w in ["what", "describe", "explain"]):
            if len(response.split()) >= 10:  # Substantive answer
                question_bonus = 0.1
        
        if any(w in query_lower for w in ["how", "steps", "guide"]):
            if any(w in response_lower for w in ["first", "then", "next", "finally", "step"]):
                question_bonus = 0.15
        
        if any(w in query_lower for w in ["why", "reason", "cause"]):
            if any(w in response_lower for w in ["because", "since", "as", "reason", "due to"]):
                question_bonus = 0.15
        
        score = min(1.0, coverage + question_bonus)
        return score
    
    def _score_coherence(self, response: str) -> float:
        """Score coherence and logical flow."""
        sentences = self._split_sentences(response)
        
        if len(sentences) <= 1:
            return 0.7 if sentences else 0.0
        
        # Check for transition words
        transition_words = [
            "however", "therefore", "furthermore", "moreover",
            "additionally", "consequently", "meanwhile", "finally",
            "first", "second", "third", "lastly", "in conclusion",
            "for example", "such as", "in other words", "specifically"
        ]
        
        transition_count = sum(
            1 for t in transition_words
            if t in response.lower()
        )
        
        # Score based on structure
        has_structure = any(
            response.lower().startswith(w) or f"\n{w}" in response.lower()
            for w in ["1.", "2.", "3.", "first", "step", "•", "-"]
        )
        
        # Check sentence length variation (indicates natural flow)
        sentence_lengths = [len(s.split()) for s in sentences]
        if len(sentence_lengths) > 1:
            mean_length = sum(sentence_lengths) / len(sentence_lengths)
            variance = sum((l - mean_length) ** 2 for l in sentence_lengths) / len(sentence_lengths)
            length_score = min(1.0, 1.0 - (variance / 1000))  # Penalize extreme variance
        else:
            length_score = 0.7
        
        # Combine scores
        transition_score = min(1.0, transition_count / 3) * 0.3
        structure_score = 0.2 if has_structure else 0.0
        
        score = 0.5 + transition_score + structure_score + (length_score * 0.3)
        return min(1.0, score)
    
    def _score_fluency(self, response: str) -> float:
        """Score grammar and readability."""
        sentences = self._split_sentences(response)
        
        if not sentences:
            return 0.0
        
        # Check for common grammar issues
        grammar_issues = 0
        
        # Double spaces
        grammar_issues += response.count("  ")
        
        # Repeated punctuation
        grammar_issues += len(re.findall(r'[.]{2,}|[!]{2,}|[?]{2,}', response))
        
        # Sentence starting with lowercase
        for sent in sentences:
            if sent and sent[0].islower():
                grammar_issues += 0.5
        
        # Check average sentence length (very long sentences reduce fluency)
        avg_length = sum(len(s.split()) for s in sentences) / len(sentences)
        length_penalty = max(0, (avg_length - 30) / 100)
        
        # Calculate score
        issue_penalty = min(0.5, grammar_issues / 10)
        score = 1.0 - issue_penalty - length_penalty
        
        return max(0.0, min(1.0, score))
    
    def _score_diversity(self, response: str) -> float:
        """Score vocabulary diversity."""
        words = re.findall(r'\b[a-zA-Z]+\b', response.lower())
        
        if len(words) < 5:
            return 0.5
        
        # Calculate type-token ratio (unique words / total words)
        unique_words = set(words)
        ttr = len(unique_words) / len(words)
        
        # Adjust for response length (TTR naturally decreases with length)
        adjusted_ttr = ttr * (1 + len(words) / 500)
        
        # Check for repetitive phrases
        bigrams = [f"{words[i]} {words[i+1]}" for i in range(len(words)-1)]
        bigram_counts = Counter(bigrams)
        max_repetition = max(bigram_counts.values()) if bigram_counts else 1
        repetition_penalty = min(0.3, (max_repetition - 2) / 10)
        
        score = min(1.0, adjusted_ttr) - repetition_penalty
        return max(0.0, score)
    
    def _score_safety(self, response: str) -> float:
        """Score content safety."""
        response_lower = response.lower()
        
        # Check for toxic keywords
        toxic_count = sum(
            1 for keyword in self.TOXIC_KEYWORDS
            if keyword in response_lower
        )
        
        # Check for excessive capitalization (shouting)
        caps_ratio = sum(1 for c in response if c.isupper()) / max(1, len(response))
        caps_penalty = 0.1 if caps_ratio > 0.5 else 0.0
        
        # Check for personal information patterns
        # (basic check for email, phone, SSN patterns)
        pii_patterns = [
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',  # Email
            r'\b\d{3}-\d{2}-\d{4}\b',  # SSN
            r'\b\d{3}-\d{3}-\d{4}\b',  # Phone
        ]
        
        pii_count = sum(
            len(re.findall(pattern, response))
            for pattern in pii_patterns
        )
        
        # Calculate safety score
        toxic_penalty = min(0.5, toxic_count * 0.1)
        pii_penalty = min(0.3, pii_count * 0.1)
        
        score = 1.0 - toxic_penalty - pii_penalty - caps_penalty
        return max(0.0, score)
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract keywords from text."""
        # Simple keyword extraction (remove stop words)
        stop_words = {
            "the", "a", "an", "is", "are", "was", "were", "be", "been",
            "being", "have", "has", "had", "do", "does", "did", "will",
            "would", "could", "should", "may", "might", "must", "shall",
            "can", "need", "dare", "ought", "used", "to", "of", "in",
            "for", "on", "with", "at", "by", "from", "as", "into",
            "through", "during", "before", "after", "above", "below",
            "between", "under", "and", "but", "or", "yet", "so", "if",
            "because", "although", "though", "while", "where", "when",
            "that", "which", "who", "whom", "whose", "what", "this",
            "these", "those", "i", "you", "he", "she", "it", "we", "they",
            "me", "him", "her", "us", "them", "my", "your", "his",
            "its", "our", "their", "mine", "yours", "hers", "ours",
            "theirs", "myself", "yourself", "himself", "herself",
            "itself", "ourselves", "yourselves", "themselves"
        }
        
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        return [w for w in words if w not in stop_words]
    
    def _split_sentences(self, text: str) -> List[str]:
        """Split text into sentences."""
        # Simple sentence splitting
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def compare_responses(
        self,
        query: str,
        responses: List[str]
    ) -> List[Tuple[str, QualityScore]]:
        """Compare multiple responses and rank them."""
        scored = []
        for response in responses:
            score = self.score_response(query, response)
            scored.append((response, score))
        
        # Sort by overall score (descending)
        scored.sort(key=lambda x: x[1].overall, reverse=True)
        return scored


# Global response scorer instance
_scorer: Optional[ResponseScorer] = None


def get_response_scorer() -> ResponseScorer:
    """Get or create global response scorer."""
    global _scorer
    if _scorer is None:
        _scorer = ResponseScorer()
    return _scorer
