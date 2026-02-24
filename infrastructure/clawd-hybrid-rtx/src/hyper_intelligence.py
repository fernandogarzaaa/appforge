"""
CHIMERA QUANTUM Brain -- Meta-Cognitive Routing Layer
=====================================================

Hyper-intelligence module that analyzes queries, selects optimal model
strategies, synthesizes ensemble responses, and learns from outcomes
via adaptive memory. Pure heuristics, zero ML dependencies.
"""

from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class QueryProfile:
    """Profile describing a user query's characteristics.

    Attributes:
        intent: Classified intent of the query.
            One of: question, instruction, creative, code, debug,
            conversation, analysis.
        complexity: Estimated complexity on a 0.0-1.0 scale.
        domain: Knowledge domain.
            One of: general, programming, math, science, creative_writing.
        expected_length: Expected response length (short / medium / long).
        needs_reasoning: Whether the query requires multi-step reasoning.
        needs_code: Whether the response should include code.
    """

    intent: str
    complexity: float
    domain: str
    expected_length: str
    needs_reasoning: bool
    needs_code: bool


@dataclass
class Strategy:
    """Routing strategy chosen for a query.

    Attributes:
        name: Strategy type.
            One of: single_model, ensemble, specialist_route, cached.
        models: Ordered list of model identifiers to invoke.
        reason: Human-readable justification for the choice.
    """

    name: str
    models: list[str]
    reason: str


# ---------------------------------------------------------------------------
# Query Analyzer
# ---------------------------------------------------------------------------

# Pre-compiled patterns used by QueryAnalyzer
_CODE_MARKERS = re.compile(
    r"```|(?:^|\s)(?:def |class |function |import |from \w+ import |"
    r"const |let |var |async |await |return |yield |lambda )"
    r"|->|=>|\.py\b|\.js\b|\.ts\b|\.cpp\b|\.rs\b",
    re.MULTILINE,
)
_DEBUG_MARKERS = re.compile(
    r"\b(?:error|exception|traceback|bug|fix|debug|issue|crash|fail|broken|"
    r"not working|doesn'?t work|won'?t work|segfault|stack\s*trace)\b",
    re.IGNORECASE,
)
_MATH_MARKERS = re.compile(
    r"[\u2211\u220f\u222b\u221a\u2202\u2207\u2248\u2260\u2264\u2265\u00b1\u221e]"
    r"|\\(?:frac|sqrt|int|sum|prod|lim|log|ln)\b|"
    r"\b(?:equation|theorem|proof|integral|derivative|matrix|eigenvalue|"
    r"polynomial|factorial|combinat|probability|statistic)\b",
    re.IGNORECASE,
)
_SCIENCE_MARKERS = re.compile(
    r"\b(?:molecule|atom|quantum|relativity|thermodynamic|entropy|genome|"
    r"protein|neuron|photon|electron|chemical|biology|physics|chemistry|"
    r"hypothesis|experiment|empirical)\b",
    re.IGNORECASE,
)
_CREATIVE_MARKERS = re.compile(
    r"\b(?:write\s+(?:a\s+)?(?:story|poem|song|essay|novel|script|haiku|"
    r"limerick|sonnet|chapter)|creative|fiction|imagine|narrative|"
    r"once upon|in a world|character\s+develop|plot\s+twist|"
    r"rhyme|verse|stanza)\b",
    re.IGNORECASE,
)
_QUESTION_MARKERS = re.compile(
    r"\?|^(?:what|who|where|when|why|how|which|is|are|do|does|did|can|"
    r"could|would|should|will|shall|has|have|had)\b",
    re.IGNORECASE | re.MULTILINE,
)
_INSTRUCTION_MARKERS = re.compile(
    r"^(?:create|build|make|generate|implement|design|set\s*up|configure|"
    r"install|deploy|write|add|remove|update|refactor|optimize|convert|"
    r"transform|migrate|explain|list|show|give|tell|describe|summarize|"
    r"compare|analyze|evaluate|calculate|solve)\b",
    re.IGNORECASE | re.MULTILINE,
)
_ANALYSIS_MARKERS = re.compile(
    r"\b(?:analyze|analys[ei]s|evaluate|assess|compare|contrast|review|"
    r"critique|pros?\s+(?:and|&)\s+cons?|trade-?offs?|benchmark|"
    r"implications?|impact|correlat|regression|trend)\b",
    re.IGNORECASE,
)
_REASONING_TRIGGERS = re.compile(
    r"\b(?:why|explain|reason|because|therefore|thus|hence|prove|"
    r"derive|deduce|infer|implication|consequence|step\s*by\s*step|"
    r"think\s+through|logically|if\s+.*then)\b",
    re.IGNORECASE,
)


class QueryAnalyzer:
    """Classifies user messages into a :class:`QueryProfile` using regex
    patterns and lightweight heuristics.  No ML models required.
    """

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def analyze(self, messages: list[dict[str, Any]]) -> QueryProfile:
        """Analyze a conversation's messages and return a profile.

        Args:
            messages: List of chat-completion-style dicts, each with at
                least ``role`` and ``content`` keys.

        Returns:
            A :class:`QueryProfile` characterising the latest user query.
        """
        text = self._extract_text(messages)

        intent = self._classify_intent(text)
        domain = self._classify_domain(text)
        needs_code = self._detect_code_need(text, intent)
        needs_reasoning = self._detect_reasoning_need(text, intent, domain)
        complexity = self._estimate_complexity(
            text, intent, domain, needs_reasoning, needs_code, messages,
        )
        expected_length = self._estimate_length(text, intent, complexity)

        return QueryProfile(
            intent=intent,
            complexity=complexity,
            domain=domain,
            expected_length=expected_length,
            needs_reasoning=needs_reasoning,
            needs_code=needs_code,
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_text(messages: list[dict[str, Any]]) -> str:
        """Concatenate the last few user messages into a single string."""
        user_msgs: list[str] = []
        for msg in reversed(messages):
            if msg.get("role") == "user" and msg.get("content"):
                user_msgs.append(str(msg["content"]))
                if len(user_msgs) >= 3:
                    break
        user_msgs.reverse()
        return "\n".join(user_msgs)

    @staticmethod
    def _classify_intent(text: str) -> str:
        """Return an intent label for *text*."""
        code_hits = len(_CODE_MARKERS.findall(text))
        debug_hits = len(_DEBUG_MARKERS.findall(text))

        if debug_hits >= 2 or (debug_hits >= 1 and code_hits >= 1):
            return "debug"
        if code_hits >= 2:
            return "code"
        if _CREATIVE_MARKERS.search(text):
            return "creative"
        if _ANALYSIS_MARKERS.search(text):
            return "analysis"
        if _INSTRUCTION_MARKERS.search(text):
            return "instruction"
        if _QUESTION_MARKERS.search(text):
            return "question"
        return "conversation"

    @staticmethod
    def _classify_domain(text: str) -> str:
        """Return a domain label for *text*."""
        if len(_CODE_MARKERS.findall(text)) >= 1:
            return "programming"
        if _MATH_MARKERS.search(text):
            return "math"
        if _SCIENCE_MARKERS.search(text):
            return "science"
        if _CREATIVE_MARKERS.search(text):
            return "creative_writing"
        return "general"

    @staticmethod
    def _detect_code_need(text: str, intent: str) -> bool:
        """Decide whether the response likely needs code."""
        if intent in ("code", "debug"):
            return True
        if len(_CODE_MARKERS.findall(text)) >= 1:
            return True
        # Explicit requests for code
        if re.search(
            r"\b(?:code|script|function|program|snippet|implementation|example)\b",
            text,
            re.IGNORECASE,
        ):
            return True
        return False

    @staticmethod
    def _detect_reasoning_need(text: str, intent: str, domain: str) -> bool:
        """Decide whether multi-step reasoning is needed."""
        if intent in ("analysis", "debug"):
            return True
        if domain in ("math", "science"):
            return True
        if _REASONING_TRIGGERS.search(text):
            return True
        return False

    @staticmethod
    def _estimate_complexity(
        text: str,
        intent: str,
        domain: str,
        needs_reasoning: bool,
        needs_code: bool,
        messages: list[dict[str, Any]],
    ) -> float:
        """Return a 0.0–1.0 complexity score via simple heuristics."""
        score = 0.0

        # Length factor
        word_count = len(text.split())
        if word_count > 200:
            score += 0.25
        elif word_count > 80:
            score += 0.15
        elif word_count > 30:
            score += 0.08

        # Intent factor
        intent_weights: dict[str, float] = {
            "conversation": 0.05,
            "question": 0.10,
            "instruction": 0.15,
            "creative": 0.20,
            "code": 0.25,
            "debug": 0.30,
            "analysis": 0.30,
        }
        score += intent_weights.get(intent, 0.10)

        # Domain factor
        domain_weights: dict[str, float] = {
            "general": 0.05,
            "creative_writing": 0.10,
            "programming": 0.15,
            "math": 0.20,
            "science": 0.20,
        }
        score += domain_weights.get(domain, 0.05)

        # Reasoning / code needs
        if needs_reasoning:
            score += 0.10
        if needs_code:
            score += 0.05

        # Multi-topic / compound queries (multiple sentences or clauses)
        sentence_count = len(re.split(r"[.!?;]\s+", text))
        if sentence_count >= 4:
            score += 0.20
        elif sentence_count >= 2:
            score += 0.08

        # Cross-domain signals (code + analysis, etc.)
        domain_signals = sum([
            bool(_CODE_MARKERS.findall(text)),
            bool(_MATH_MARKERS.search(text)),
            bool(_SCIENCE_MARKERS.search(text)),
            bool(_CREATIVE_MARKERS.search(text)),
            bool(_ANALYSIS_MARKERS.search(text)),
        ])
        if domain_signals >= 2:
            score += 0.15

        # Conversation depth
        num_turns = len(messages)
        if num_turns > 10:
            score += 0.10
        elif num_turns > 4:
            score += 0.05

        return min(round(score, 3), 1.0)

    @staticmethod
    def _estimate_length(text: str, intent: str, complexity: float) -> str:
        """Predict the expected response length bucket."""
        if intent == "conversation" and complexity < 0.3:
            return "short"
        if complexity >= 0.65:
            return "long"
        if intent in ("analysis", "creative", "code", "debug"):
            return "long"
        if intent in ("instruction",) and complexity >= 0.35:
            return "medium"
        word_count = len(text.split())
        if word_count < 15:
            return "short"
        if word_count > 100:
            return "long"
        return "medium"


# ---------------------------------------------------------------------------
# Strategy Selector
# ---------------------------------------------------------------------------

# Well-known model shortnames used by default
_MODEL_MISTRAL_SMALL = "mistral-small"
_MODEL_QWEN3_CODER = "qwen3-coder"
_MODEL_DEEPSEEK_R1 = "deepseek-r1"
_MODEL_LLAMA_70B = "llama-3.3-70b"


class StrategySelector:
    """Selects an execution :class:`Strategy` for a given
    :class:`QueryProfile` and available model pool.
    """

    def select(
        self,
        profile: QueryProfile,
        models: list[str],
    ) -> Strategy:
        """Choose the best strategy for *profile* given *models*.

        Args:
            profile: Classified query profile.
            models: Available model identifiers.

        Returns:
            A :class:`Strategy` describing which models to invoke and how.
        """
        if not models:
            raise ValueError("At least one model must be available")

        def _pick(preferred: str) -> str:
            """Return the model whose ID contains *preferred*, else first model."""
            for m in models:
                if preferred in m:
                    return m
            return models[0]

        # 1. Complex queries → ensemble (quantum consensus)
        if profile.complexity >= 0.65:
            return Strategy(
                name="ensemble",
                models=list(models),
                reason=(
                    f"High complexity ({profile.complexity:.2f}) — "
                    "invoking full ensemble for quantum consensus."
                ),
            )

        # 2. Code / debug → specialist coder
        if profile.needs_code or profile.intent in ("code", "debug"):
            chosen = _pick(_MODEL_QWEN3_CODER)
            return Strategy(
                name="specialist_route",
                models=[chosen],
                reason=(
                    f"Code/debug intent detected — routing to specialist "
                    f"coder '{chosen}'."
                ),
            )

        # 3. Reasoning-heavy → deepseek-r1
        if profile.needs_reasoning:
            chosen = _pick(_MODEL_DEEPSEEK_R1)
            return Strategy(
                name="specialist_route",
                models=[chosen],
                reason=(
                    f"Reasoning required (domain={profile.domain}) — "
                    f"routing to reasoning specialist '{chosen}'."
                ),
            )

        # 4. Simple / conversational → fastest model
        if profile.complexity < 0.25 and profile.intent in (
            "conversation",
            "question",
        ):
            chosen = _pick(_MODEL_MISTRAL_SMALL)
            return Strategy(
                name="single_model",
                models=[chosen],
                reason=(
                    f"Simple {profile.intent} (complexity "
                    f"{profile.complexity:.2f}) — using fastest model "
                    f"'{chosen}'."
                ),
            )

        # 5. General / balanced fallback
        chosen = _pick(_MODEL_LLAMA_70B)
        return Strategy(
            name="single_model",
            models=[chosen],
            reason=(
                f"General query (intent={profile.intent}, "
                f"domain={profile.domain}) — balanced model '{chosen}'."
            ),
        )


# ---------------------------------------------------------------------------
# Response Synthesizer
# ---------------------------------------------------------------------------

class ResponseSynthesizer:
    """Combines responses from one or more models into a single output.

    For *single_model* / *specialist_route* strategies the response is
    passed through directly.  For *ensemble* strategies the best
    response is selected via heuristic scoring.
    """

    def synthesize(
        self,
        responses: list[str],
        strategy: Strategy,
    ) -> str:
        """Merge *responses* according to *strategy*.

        Args:
            responses: Raw text responses from each model in
                ``strategy.models`` (same order).
            strategy: The strategy that produced the responses.

        Returns:
            A single synthesised response string.
        """
        # Filter out empty / None responses
        valid: list[str] = [r for r in responses if r and r.strip()]
        if not valid:
            return ""
        if len(valid) == 1 or strategy.name != "ensemble":
            return valid[0]

        # --- Ensemble scoring ---
        scored: list[tuple[float, str]] = [
            (self._score(r), r) for r in valid
        ]
        scored.sort(key=lambda t: t[0], reverse=True)
        return scored[0][1]

    # ------------------------------------------------------------------
    # Scoring heuristics
    # ------------------------------------------------------------------

    @staticmethod
    def _score(response: str) -> float:
        """Assign a quality score to *response* using simple heuristics."""
        score = 0.0

        # Prefer moderate-to-long answers (but not absurdly long)
        words = len(response.split())
        if 50 <= words <= 800:
            score += 3.0
        elif words > 800:
            score += 1.5
        elif words > 20:
            score += 1.0

        # Reward structure: paragraphs, lists, headings, code blocks
        if "\n\n" in response:
            score += 1.0
        bullet_count = len(re.findall(r"^[\s]*[-*]\s", response, re.MULTILINE))
        score += min(bullet_count * 0.3, 2.0)
        numbered_count = len(re.findall(r"^[\s]*\d+[.)]\s", response, re.MULTILINE))
        score += min(numbered_count * 0.3, 2.0)
        if "```" in response:
            score += 1.5

        # Penalise very short / empty
        if words < 5:
            score -= 3.0

        # Reward completeness signals
        if response.rstrip().endswith((".", "!", "?", "```")):
            score += 0.5

        return round(score, 3)


# ---------------------------------------------------------------------------
# Adaptive Memory
# ---------------------------------------------------------------------------

_DEFAULT_MEMORY_PATH = Path(
    r"D:\appforge-main\infrastructure\clawd-hybrid-rtx\data\adaptive_memory.json"
)


@dataclass
class _MemoryRecord:
    """Internal record of a model invocation."""

    intent: str
    domain: str
    complexity: float
    model: str
    quality: float
    timestamp: float = field(default_factory=time.time)


class AdaptiveMemory:
    """Persistent store that learns which models work best for which
    query profiles and provides recommendations.

    Data is serialised to a JSON file (default path:
    ``adaptive_memory.json`` in the project's ``data/`` directory).
    """

    def __init__(self, path: Path | str | None = None) -> None:
        self._path = Path(path) if path else _DEFAULT_MEMORY_PATH
        self._records: list[_MemoryRecord] = []
        self._model_stats: dict[str, dict[str, Any]] = {}
        self._load()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def record(
        self,
        profile: QueryProfile,
        model: str,
        quality: float,
    ) -> None:
        """Record the outcome of a model invocation.

        Args:
            profile: The query profile that was served.
            model: The model that produced the response.
            quality: A 0.0–1.0 quality rating for the response.
        """
        rec = _MemoryRecord(
            intent=profile.intent,
            domain=profile.domain,
            complexity=profile.complexity,
            model=model,
            quality=max(0.0, min(float(quality), 1.0)),
        )
        self._records.append(rec)
        self._update_stats(rec)
        self._save()

    def get_recommendation(
        self,
        profile: QueryProfile,
    ) -> list[tuple[str, float]]:
        """Return model recommendations for *profile* sorted by
        descending confidence.

        Args:
            profile: The query profile to match against history.

        Returns:
            List of ``(model_name, confidence)`` tuples where
            *confidence* is in 0.0–1.0.
        """
        # Find records with similar intent + domain
        relevant = [
            r
            for r in self._records
            if r.intent == profile.intent and r.domain == profile.domain
        ]

        if not relevant:
            # Fall back to intent-only match
            relevant = [r for r in self._records if r.intent == profile.intent]

        if not relevant:
            return []

        # Aggregate quality per model
        model_quality: dict[str, list[float]] = {}
        for r in relevant:
            model_quality.setdefault(r.model, []).append(r.quality)

        # Compute weighted average (recent records count more)
        recommendations: list[tuple[str, float]] = []
        for model, qualities in model_quality.items():
            # Simple recency-weighted mean: later entries get higher weight
            total_weight = 0.0
            weighted_sum = 0.0
            for idx, q in enumerate(qualities):
                w = 1.0 + idx * 0.1  # increasing weight
                weighted_sum += q * w
                total_weight += w
            avg = weighted_sum / total_weight if total_weight else 0.0
            # Confidence grows with sample count (caps at 1.0)
            confidence = min(len(qualities) / 10.0, 1.0)
            recommendations.append((model, round(avg * confidence, 4)))

        recommendations.sort(key=lambda t: t[1], reverse=True)
        return recommendations

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def _load(self) -> None:
        """Load records from disk (best-effort)."""
        if not self._path.exists():
            return
        try:
            data = json.loads(self._path.read_text(encoding="utf-8"))
            for raw in data.get("records", []):
                self._records.append(
                    _MemoryRecord(
                        intent=raw["intent"],
                        domain=raw["domain"],
                        complexity=raw["complexity"],
                        model=raw["model"],
                        quality=raw["quality"],
                        timestamp=raw.get("timestamp", 0.0),
                    )
                )
            self._model_stats = data.get("model_stats", {})
        except (json.JSONDecodeError, KeyError, TypeError):
            # Corrupt file — start fresh
            self._records = []
            self._model_stats = {}

    def _save(self) -> None:
        """Persist records to disk."""
        self._path.parent.mkdir(parents=True, exist_ok=True)
        data: dict[str, Any] = {
            "records": [asdict(r) for r in self._records[-500:]],  # cap
            "model_stats": self._model_stats,
            "version": "1.0.0",
        }
        self._path.write_text(
            json.dumps(data, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

    def _update_stats(self, rec: _MemoryRecord) -> None:
        """Update running per-model statistics."""
        stats = self._model_stats.setdefault(
            rec.model,
            {"total_calls": 0, "total_quality": 0.0, "avg_quality": 0.0},
        )
        stats["total_calls"] += 1
        stats["total_quality"] = round(stats["total_quality"] + rec.quality, 4)
        stats["avg_quality"] = round(
            stats["total_quality"] / stats["total_calls"], 4
        )


# ---------------------------------------------------------------------------
# Convenience: orchestrator facade
# ---------------------------------------------------------------------------

class HyperIntelligence:
    """Top-level orchestrator that wires together all sub-components.

    Usage::

        hi = HyperIntelligence(available_models=["mistral-small", ...])
        profile  = hi.analyze(messages)
        strategy = hi.plan(profile)
        result   = hi.synthesize(responses, strategy)
        hi.learn(profile, chosen_model, quality=0.85)
    """

    def __init__(
        self,
        available_models: list[str] | None = None,
        memory_path: Path | str | None = None,
    ) -> None:
        self.models: list[str] = available_models or [
            _MODEL_MISTRAL_SMALL,
            _MODEL_QWEN3_CODER,
            _MODEL_DEEPSEEK_R1,
            _MODEL_LLAMA_70B,
        ]
        self._analyzer = QueryAnalyzer()
        self._selector = StrategySelector()
        self._synthesizer = ResponseSynthesizer()
        self._memory = AdaptiveMemory(path=memory_path)

    def analyze(self, messages: list[dict[str, Any]]) -> QueryProfile:
        """Analyze messages and return a query profile."""
        return self._analyzer.analyze(messages)

    def plan(self, profile: QueryProfile) -> Strategy:
        """Select the optimal strategy for *profile*."""
        # Augment with adaptive memory recommendations
        recs = self._memory.get_recommendation(profile)
        if recs:
            # If memory strongly recommends a model, bias toward it
            best_model, best_score = recs[0]
            if best_score >= 0.7 and best_model in self.models:
                return Strategy(
                    name="single_model",
                    models=[best_model],
                    reason=(
                        f"Adaptive memory recommends '{best_model}' "
                        f"(score {best_score:.2f}) for "
                        f"{profile.intent}/{profile.domain}."
                    ),
                )
        return self._selector.select(profile, self.models)

    def synthesize(self, responses: list[str], strategy: Strategy) -> str:
        """Synthesize model responses into a single answer."""
        return self._synthesizer.synthesize(responses, strategy)

    def learn(
        self,
        profile: QueryProfile,
        model: str,
        quality: float,
    ) -> None:
        """Record an outcome to improve future routing."""
        self._memory.record(profile, model, quality)
