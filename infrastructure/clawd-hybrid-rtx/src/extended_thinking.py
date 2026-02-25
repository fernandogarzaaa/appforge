"""
Extended Thinking Module — Claude Opus 4.6 Style Reasoning
===========================================================

Implements visible reasoning chains, self-correction, and progressive
enhancement inspired by Claude Opus 4.6's extended thinking mode.
"""

from __future__ import annotations

import re
import time
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ReasoningStep:
    """A single step in the reasoning chain."""
    step_number: int
    action: str
    reasoning: str
    result: str | None = None
    confidence: float = 0.0


@dataclass
class ThinkingContext:
    """Context for extended thinking generation."""
    query: str
    intent: str
    complexity: float
    domain: str
    strategy: str
    models_consulted: list[str] = field(default_factory=list)
    steps: list[ReasoningStep] = field(default_factory=list)
    start_time: float = field(default_factory=time.time)


class ExtendedThinking:
    """Claude-style extended thinking for CHIMERA QUANTUM.
    
    Provides visible reasoning chains, self-correction, and
    progressive response enhancement.
    """
    
    # Intent detection patterns
    INTENT_PATTERNS = {
        "explain": [r"\b(?:explain|describe|what is|tell me about)\b"],
        "compare": [r"\b(?:compare|difference|versus|vs|pros and cons)\b"],
        "solve": [r"\b(?:solve|fix|debug|error|issue|problem)\b"],
        "create": [r"\b(?:create|make|build|generate|write|design)\b"],
        "analyze": [r"\b(?:analyze|evaluate|assess|review)\b"],
        "code": [r"\b(?:code|function|class|script|program|implement)\b"],
        "reason": [r"\b(?:why|how|reason|because|therefore|if.*then)\b"],
    }
    
    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        self._history: list[ThinkingContext] = []
    
    def create_context(
        self,
        query: str,
        intent: str = "unknown",
        complexity: float = 0.5,
        domain: str = "general",
        strategy: str = "single_model",
    ) -> ThinkingContext:
        """Create a thinking context for a query."""
        return ThinkingContext(
            query=query,
            intent=intent,
            complexity=complexity,
            domain=domain,
            strategy=strategy,
        )
    
    def analyze_query(self, context: ThinkingContext) -> dict[str, Any]:
        """Analyze query structure and requirements."""
        query = context.query.lower()
        
        # Detect explicit intent
        detected_intent = self._detect_intent(query)
        
        # Count complexity indicators
        complexity_factors = {
            "length": len(context.query.split()) > 50,
            "multiple_questions": query.count("?") > 1,
            "has_code_markers": bool(re.search(r"```|def |class |function ", query)),
            "has_math": bool(re.search(r"[=+\-*/^]|\b(?:calculate|compute|solve)\b", query)),
            "has_comparison": bool(re.search(r"\b(?:compare|difference|versus|vs)\b", query)),
            "needs_context": len(context.query.split()) > 100,
        }
        
        # Estimate required steps
        required_steps = sum(1 for v in complexity_factors.values() if v) + 1
        
        return {
            "detected_intent": detected_intent,
            "complexity_factors": complexity_factors,
            "complexity_score": sum(complexity_factors.values()) / len(complexity_factors),
            "estimated_steps": min(required_steps, 5),
            "domain": context.domain,
        }
    
    def generate_thinking_chain(self, context: ThinkingContext) -> str:
        """Generate a visible reasoning chain."""
        analysis = self.analyze_query(context)
        steps = []
        
        # Step 1: Intent recognition
        steps.append(ReasoningStep(
            step_number=1,
            action="Intent Recognition",
            reasoning=f"Analyzing query structure and detecting intent patterns",
            result=f"Detected intent: {analysis['detected_intent']}",
            confidence=0.9,
        ))
        
        # Step 2: Complexity assessment
        factors = [k for k, v in analysis["complexity_factors"].items() if v]
        steps.append(ReasoningStep(
            step_number=2,
            action="Complexity Assessment",
            reasoning=f"Evaluating query complexity based on {len(factors)} factors",
            result=f"Complexity: {analysis['complexity_score']:.2f} (factors: {', '.join(factors) if factors else 'none'})",
            confidence=0.85,
        ))
        
        # Step 3: Strategy selection
        strategy_reason = self._explain_strategy(context.strategy, analysis)
        steps.append(ReasoningStep(
            step_number=3,
            action="Strategy Selection",
            reasoning=strategy_reason,
            result=f"Selected: {context.strategy}",
            confidence=0.88,
        ))
        
        # Step 4: Model routing (if applicable)
        if context.models_consulted:
            steps.append(ReasoningStep(
                step_number=4,
                action="Model Routing",
                reasoning=f"Routing to specialized models based on query characteristics",
                result=f"Models: {', '.join(context.models_consulted)}",
                confidence=0.82,
            ))
        
        # Step 5: Synthesis plan
        steps.append(ReasoningStep(
            step_number=len(steps) + 1,
            action="Synthesis Planning",
            reasoning=f"Preparing to synthesize response with {analysis['estimated_steps']} reasoning steps",
            result="Ready to generate response",
            confidence=0.90,
        ))
        
        context.steps = steps
        return self._format_thinking_chain(steps)
    
    def _detect_intent(self, query: str) -> str:
        """Detect query intent from patterns."""
        for intent, patterns in self.INTENT_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, query, re.IGNORECASE):
                    return intent
        return "general"
    
    def _explain_strategy(self, strategy: str, analysis: dict) -> str:
        """Explain why a strategy was chosen."""
        explanations = {
            "single_model": "Simple query detected - single model sufficient for accurate response",
            "ensemble": "Complex query detected - ensemble approach for consensus and quality",
            "specialist_route": f"Specialized query detected (intent: {analysis['detected_intent']}) - routing to domain specialist",
            "cached": "Similar query found in semantic cache - using cached response",
        }
        return explanations.get(strategy, "Default strategy selection")
    
    def _format_thinking_chain(self, steps: list[ReasoningStep]) -> str:
        """Format thinking chain for display."""
        lines = ["<thinking>"]
        for step in steps:
            lines.append(f"  Step {step.step_number}: {step.action}")
            lines.append(f"    Reasoning: {step.reasoning}")
            if step.result:
                lines.append(f"    Result: {step.result}")
            lines.append(f"    Confidence: {step.confidence:.0%}")
        lines.append("</thinking>")
        return "\n".join(lines)
    
    def validate_response(
        self,
        response: str,
        context: ThinkingContext,
    ) -> dict[str, Any]:
        """Validate and potentially correct a response."""
        issues = []
        corrections = []
        
        # Check for empty response
        if not response or not response.strip():
            issues.append("empty_response")
            corrections.append("Response was empty, retrying with fallback model")
        
        # Check for insufficient effort
        if "I don't know" in response and len(response) < 100:
            issues.append("insufficient_effort")
            corrections.append("Response showed low effort, consider ensemble approach")
        
        # Check for repetition
        words = response.lower().split()
        if len(words) > 20:
            unique_ratio = len(set(words)) / len(words)
            if unique_ratio < 0.3:
                issues.append("repetition")
                corrections.append("High repetition detected, regenerate with temperature adjustment")
        
        # Check for incomplete code
        if "```" in response:
            code_blocks = response.count("```")
            if code_blocks % 2 != 0:
                issues.append("unclosed_code_block")
                corrections.append("Code block not properly closed")
        
        # Calculate confidence
        base_confidence = 0.9
        penalty = len(issues) * 0.15
        final_confidence = max(0.3, base_confidence - penalty)
        
        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "corrections": corrections,
            "confidence": final_confidence,
            "should_retry": len(issues) > 0 and "empty" not in issues,
        }
    
    def enhance_response(
        self,
        response: str,
        context: ThinkingContext,
        include_thinking: bool = False,
    ) -> str:
        """Enhance response with progressive improvements."""
        enhanced = response
        
        # Add thinking chain if requested
        if include_thinking and context.steps:
            thinking = self._format_thinking_chain(context.steps)
            enhanced = f"{thinking}\n\n{enhanced}"
        
        # Add structure if missing
        if not self._has_structure(enhanced):
            enhanced = self._add_structure(enhanced, context)
        
        # Add confidence indicator for complex queries
        if context.complexity > 0.7 and "confidence" not in enhanced.lower():
            validation = self.validate_response(response, context)
            enhanced += f"\n\n*Confidence: {validation['confidence']:.0%}*"
        
        return enhanced
    
    def _has_structure(self, text: str) -> bool:
        """Check if response has structural elements."""
        has_headers = bool(re.search(r"^#+\s", text, re.MULTILINE))
        has_lists = bool(re.search(r"^\s*[-*]\s", text, re.MULTILINE))
        has_paragraphs = text.count("\n\n") >= 2
        return has_headers or has_lists or has_paragraphs
    
    def _add_structure(self, text: str, context: ThinkingContext) -> str:
        """Add structural elements to response."""
        # Simple structuring for now
        if len(text) < 200:
            return text
        
        # Split into sentences
        sentences = re.split(r"(?<=[.!?])\s+", text)
        
        if len(sentences) < 3:
            return text
        
        # Add header based on intent
        header = f"## {context.intent.title()}"
        
        # Join with paragraph breaks
        paragraphs = []
        current = []
        for sentence in sentences:
            current.append(sentence)
            if len(current) >= 3:
                paragraphs.append(" ".join(current))
                current = []
        if current:
            paragraphs.append(" ".join(current))
        
        return f"{header}\n\n" + "\n\n".join(paragraphs)
    
    def get_history_summary(self, limit: int = 10) -> list[dict]:
        """Get summary of recent thinking contexts."""
        return [
            {
                "query": ctx.query[:100],
                "intent": ctx.intent,
                "complexity": ctx.complexity,
                "strategy": ctx.strategy,
                "steps": len(ctx.steps),
                "duration": time.time() - ctx.start_time,
            }
            for ctx in self._history[-limit:]
        ]


# Singleton instance
_thinking_engine: ExtendedThinking | None = None


def get_thinking_engine(verbose: bool = False) -> ExtendedThinking:
    """Get or create the global thinking engine."""
    global _thinking_engine
    if _thinking_engine is None:
        _thinking_engine = ExtendedThinking(verbose=verbose)
    return _thinking_engine