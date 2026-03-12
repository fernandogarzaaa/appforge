"""
Context Fracturer & Token Compressor for CHIMERA

Aggressive context compression that:
1. Fractures context into semantic chunks
2. Scores by importance to current query
3. Keeps only top-relevant parts
4. Hierarchical summarization for old context

Uses semantic similarity (no embeddings needed - keyword/pattern based)
"""

import re
from dataclasses import dataclass
from typing import Any


@dataclass
class CompressionResult:
    compressed_messages: list[dict]
    original_tokens: int
    compressed_tokens: int
    savings_ratio: float
    method: str


class ContextFracturer:
    """
    Fractures long context into smaller, relevant pieces.
    Keeps only what matters for the current query.
    """
    
    # Keywords that indicate high importance
    IMPORTANT_PATTERNS = [
        r'\b(important|critical|essential|must|required|necessary)\b',
        r'\b(error|bug|fix|issue|problem|fail)\b',
        r'\b(question|ask|help|need|want|try)\b',
        r'\b(answer|result|output|response)\b',
        r'\b(code|function|class|implement|create)\b',
    ]
    
    # Patterns that can be compressed heavily
    COMPRESSIBLE_PATTERNS = [
        r'(?:hi|hello|hey|greetings)[,.\s]*',
        r'(?:thank you|thanks|appreciate)[,.\s]*',
        r'(?:please|kindly)[,.\s]*',
        r'^(?:sure|okay|ok|yes|no|maybe)[,.\s]*',
    ]
    
    def __init__(self):
        self.important_re = [re.compile(p, re.I) for p in self.IMPORTANT_PATTERNS]
        self.compressible_re = [re.compile(p, re.I) for p in self.COMPRESSIBLE_PATTERNS]
    
    def score_importance(self, text: str, query: str) -> float:
        """Score text 0-1 based on relevance to query."""
        if not text:
            return 0.0
        
        text_lower = text.lower()
        query_lower = query.lower()
        query_words = set(query_lower.split())
        
        score = 0.0
        
        # Direct keyword matches (high weight)
        for word in query_words:
            if len(word) > 3 and word in text_lower:
                score += 0.15
        
        # Important patterns
        for pat in self.important_re:
            if pat.search(text):
                score += 0.2
        
        # Length penalty (too short = possibly filler, too long = might be noise)
        if 20 < len(text) < 500:
            score += 0.1
        
        # Query-related code blocks get bonus
        if '```' in text and any(w in text_lower for w in query_words):
            score += 0.15
        
        return min(1.0, score)
    
    def fracture(self, messages: list[dict], query: str, max_tokens: int) -> list[dict]:
        """Fracture context, keeping most relevant parts."""
        if not messages:
            return []
        
        # Score each message
        scored = []
        for i, msg in enumerate(messages):
            content = msg.get('content', '')
            role = msg.get('role', 'user')
            
            # System messages are always important
            if role == 'system':
                importance = 1.0
            else:
                importance = self.score_importance(content, query)
            
            # Recency bonus (newer = more important)
            recency_bonus = min(0.3, i * 0.02)
            importance = min(1.0, importance + recency_bonus)
            
            # Estimate tokens
            tokens = self.estimate_tokens(content)
            
            scored.append({
                'index': i,
                'message': msg,
                'content': content,
                'role': role,
                'importance': importance,
                'tokens': tokens
            })
        
        # Sort by importance descending
        scored.sort(key=lambda x: x['importance'], reverse=True)
        
        # Select messages until we hit max_tokens
        selected = []
        total_tokens = 0
        
        for item in scored:
            if total_tokens + item['tokens'] <= max_tokens:
                selected.append(item['message'])
                total_tokens += item['tokens']
            elif item['importance'] > 0.7:
                # High importance - try to compress it
                compressed = self.compress_message(item['content'], max_tokens - total_tokens)
                if compressed:
                    compressed_msg = {**item['message'], 'content': compressed}
                    selected.append(compressed_msg)
                    total_tokens += self.estimate_tokens(compressed)
                if total_tokens >= max_tokens:
                    break
        
        # Restore original order for selected messages
        selected.sort(key=lambda m: messages.index(m) if m in messages else 0)
        
        return selected
    
    def compress_message(self, text: str, max_tokens: int) -> str | None:
        """Compress a single message to fit in max_tokens."""
        current_tokens = self.estimate_tokens(text)
        
        if current_tokens <= max_tokens:
            return text
        
        # Aggressive compression
        result = text
        
        # Remove compressible patterns
        for pat in self.compressible_re:
            result = pat.sub('', result)
        
        # Remove filler words
        filler = r'\b(very|really|quite|just|simply|basically|actually|probably|might|maybe|think|believe)\b'
        result = re.sub(filler, '', result, flags=re.I)
        
        # Collapse whitespace
        result = re.sub(r'\s+', ' ', result).strip()
        
        if self.estimate_tokens(result) <= max_tokens:
            return result
        
        # Last resort: truncate to token limit
        words = result.split()
        chars_per_token = 4
        max_chars = max_tokens * chars_per_token
        return result[:max_chars] + '...' if len(result) > max_chars else result
    
    def estimate_tokens(self, text: str) -> int:
        """Rough token estimation."""
        if not text:
            return 0
        # Account for code blocks (more tokens per char)
        code_blocks = len(re.findall(r'```[\s\S]*?```', text))
        non_code = len(text) - code_blocks * 8  # approximate code block overhead
        return max(1, int((non_code / 4) + (code_blocks * 50)))


class HierarchicalCompressor:
    """
    Multi-level context compression:
    - Level 1: Keep recent messages intact
    - Level 2: Summarize older messages
    - Level 3: Discard least relevant
    """
    
    def __init__(self):
        self.fracturer = ContextFracturer()
    
    def compress(
        self, 
        messages: list[dict], 
        query: str, 
        max_tokens: int,
        keep_recent: int = 3
    ) -> CompressionResult:
        """Main compression entry point."""
        
        if not messages:
            return CompressionResult(
                compressed_messages=[],
                original_tokens=0,
                compressed_tokens=0,
                savings_ratio=0.0,
                method="none"
            )
        
        # Estimate original tokens
        original_tokens = sum(
            self.fracturer.estimate_tokens(m.get('content', '')) 
            for m in messages
        )
        
        # Split into recent and old
        if len(messages) <= keep_recent:
            recent = messages
            old = []
        else:
            recent = messages[-keep_recent:]
            old = messages[:-keep_recent]
        
        # Level 1: Keep recent messages (likely most relevant)
        result_messages = list(recent)
        remaining_budget = max_tokens - sum(
            self.fracturer.estimate_tokens(m.get('content', '')) 
            for m in recent
        )
        
        if old and remaining_budget > 100:
            # Level 2: Compress old messages
            if len(old) == 1:
                # Single old message - compress it
                compressed = self.fracturer.compress_message(
                    old[0].get('content', ''), 
                    remaining_budget
                )
                if compressed:
                    result_messages.insert(0, {**old[0], 'content': compressed})
            else:
                # Multiple old messages - summarize as one
                summary = self.summarize_context(old, query)
                if summary and self.fracturer.estimate_tokens(summary) <= remaining_budget:
                    result_messages.insert(0, {
                        'role': 'system', 
                        'content': f'[Prior context summary: {summary}]'
                    })
        
        # Level 3: If still over budget, use fracturer
        current_tokens = sum(
            self.fracturer.estimate_tokens(m.get('content', '')) 
            for m in result_messages
        )
        
        if current_tokens > max_tokens:
            result_messages = self.fracturer.fracture(result_messages, query, max_tokens)
            current_tokens = sum(
                self.fracturer.estimate_tokens(m.get('content', '')) 
                for m in result_messages
            )
        
        savings = original_tokens - current_tokens
        savings_ratio = savings / original_tokens if original_tokens > 0 else 0.0
        
        method = "hierarchical"
        if len(messages) > 10:
            method = "fracture+hierarchical"
        
        return CompressionResult(
            compressed_messages=result_messages,
            original_tokens=original_tokens,
            compressed_tokens=current_tokens,
            savings_ratio=savings_ratio,
            method=method
        )
    
    def summarize_context(self, messages: list[dict], query: str) -> str:
        """Create a brief summary of old messages."""
        if not messages:
            return ""
        
        # Extract key information
        topics = []
        actions = []
        
        for msg in messages[-5:]:  # Last 5 old messages
            content = msg.get('content', '')
            
            # Extract potential topics (nouns/verbs)
            words = re.findall(r'\b[a-z]{4,}\b', content.lower())
            topics.extend(words[:3])
            
            # Extract action words
            action_words = re.findall(
                r'\b(wrote|created|fixed|added|removed|changed|updated|asked|said)\b',
                content.lower()
            )
            actions.extend(action_words)
        
        # Build summary
        summary_parts = []
        
        if topics:
            # Most common topics
            from collections import Counter
            common = Counter(topics).most_common(3)
            summary_parts.append(f"Topics: {', '.join(t[0] for t in common)}")
        
        if actions:
            summary_parts.append(f"Actions: {', '.join(set(actions[:5]))}")
        
        summary_parts.append(f"{len(messages)} prior messages")
        
        return " | ".join(summary_parts)


class SemanticDeduplicator:
    """Remove semantically similar messages."""
    
    def __init__(self, similarity_threshold: float = 0.8):
        self.threshold = similarity_threshold
    
    def deduplicate(self, messages: list[dict]) -> list[dict]:
        """Remove duplicate/similar messages."""
        if len(messages) <= 1:
            return list(messages)
        
        result = [messages[0]]
        
        for msg in messages[1:]:
            content = msg.get('content', '').lower()
            is_duplicate = False
            
            for existing in result:
                existing_content = existing.get('content', '').lower()
                similarity = self.calculate_similarity(content, existing_content)
                
                if similarity > self.threshold:
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                result.append(msg)
        
        return result
    
    def calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate simple word overlap similarity."""
        if not text1 or not text2:
            return 0.0
        
        words1 = set(text1.split())
        words2 = set(text2.split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1 & words2
        union = words1 | words2
        
        return len(intersection) / len(union)


# Module-level instance
context_fracturer = ContextFracturer()
hierarchical_compressor = HierarchicalCompressor()
semantic_deduplicator = SemanticDeduplicator()
