"""
Token Optimizer — Aggressive token optimization for CHIMERA QUANTUM.

Minimizes API costs through prompt compression, smart routing,
token counting, and cost tracking. All heuristic-based — no LLM calls.

Python 3.12+
"""

from __future__ import annotations

import json
import math
import re
from collections import defaultdict
from datetime import datetime, date
from pathlib import Path
from typing import Any


# ---------------------------------------------------------------------------
# 1. PromptCompressor
# ---------------------------------------------------------------------------

class PromptCompressor:
    """Compress prompts and conversation history using heuristic rules."""

    # Filler words/phrases safe to strip (boundaries enforced via regex)
    _FILLER_PATTERNS: list[re.Pattern[str]] = [
        re.compile(r"\b(please|kindly|just|simply|basically|actually|really|very|quite|rather)\b", re.I),
        re.compile(r"\b(I think|I believe|I would like you to|could you please|would you mind)\b", re.I),
        re.compile(r"\b(in order to)\b", re.I),
        re.compile(r"\b(as a matter of fact|at the end of the day|for what it's worth)\b", re.I),
        re.compile(r"\b(it is important to note that|it should be noted that)\b", re.I),
        re.compile(r"\b(essentially|fundamentally|generally speaking)\b", re.I),
    ]

    _WHITESPACE_RE = re.compile(r"[ \t]+")
    _BLANK_LINES_RE = re.compile(r"\n{3,}")
    _INSTRUCTION_RE = re.compile(
        r"(?:^|\n)\s*[-*•]?\s*(?:you (?:must|should|will|are)|do not|don't|always|never|ensure|make sure|remember)[^\n]+",
        re.I,
    )

    # ---- public API ----

    def compress(self, text: str, target_ratio: float = 0.6) -> str:
        """Compress *text* toward *target_ratio* of original length."""
        original_len = len(text)
        target_len = int(original_len * target_ratio)

        result = text

        # Pass 1 — collapse whitespace & blank lines
        result = self._WHITESPACE_RE.sub(" ", result)
        result = self._BLANK_LINES_RE.sub("\n\n", result)

        # Pass 2 — strip filler words (iteratively until target met)
        for pat in self._FILLER_PATTERNS:
            if len(result) <= target_len:
                break
            result = pat.sub("", result)

        # Pass 3 — clean up artifacts from removal
        result = re.sub(r"  +", " ", result)
        result = re.sub(r" ([.,;:!?])", r"\1", result)
        result = re.sub(r"\n +", "\n", result)
        result = result.strip()

        return result

    def extract_key_instructions(self, system_prompt: str) -> str:
        """Pull only imperative/key instruction lines from a system prompt."""
        matches = self._INSTRUCTION_RE.findall(system_prompt)
        if not matches:
            # Fallback: return first 3 sentences
            sentences = re.split(r"(?<=[.!?])\s+", system_prompt)
            return " ".join(sentences[:3])
        return "\n".join(m.strip().lstrip("-*• ") for m in matches)

    def deduplicate_messages(self, messages: list[dict[str, str]]) -> list[dict[str, str]]:
        """Remove exact and near-duplicate messages (by normalized content)."""
        seen: set[str] = set()
        deduped: list[dict[str, str]] = []
        for msg in messages:
            key = self._normalize(msg.get("content", ""))
            if key not in seen:
                seen.add(key)
                deduped.append(msg)
        return deduped

    def summarize_old_context(
        self,
        messages: list[dict[str, str]],
        keep_recent: int = 4,
    ) -> list[dict[str, str]]:
        """Collapse older messages into a single summary, keep *keep_recent* newest."""
        if len(messages) <= keep_recent:
            return list(messages)

        old = messages[:-keep_recent]
        recent = messages[-keep_recent:]

        # Build a condensed summary from old messages
        summary_parts: list[str] = []
        for msg in old:
            role = msg.get("role", "user")
            content = (msg.get("content") or "").strip()
            if not content:
                continue
            # Take first sentence or first 120 chars
            first_sentence = re.split(r"(?<=[.!?])\s", content, maxsplit=1)[0]
            truncated = first_sentence[:120]
            summary_parts.append(f"[{role}] {truncated}")

        summary_text = "Prior context summary:\n" + "\n".join(summary_parts)
        summary_msg: dict[str, str] = {"role": "system", "content": summary_text}
        return [summary_msg, *recent]

    # ---- helpers ----

    @staticmethod
    def _normalize(text: str) -> str:
        """Lowercase, strip punctuation/whitespace for dedup comparison."""
        text = text.lower()
        text = re.sub(r"[^\w\s]", "", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text


# ---------------------------------------------------------------------------
# 2. TokenCounter
# ---------------------------------------------------------------------------

class TokenCounter:
    """Fast heuristic token estimator (no tokenizer dependency)."""

    # Rough chars-per-token ratios
    _CHARS_PER_TOKEN_PROSE = 4.0
    _CHARS_PER_TOKEN_CODE = 3.5  # code has more short tokens
    _CHARS_PER_TOKEN_CJK = 1.5  # CJK characters ≈ 1-2 tokens each

    _CODE_INDICATORS = re.compile(r"[{}()\[\];=<>]|def |class |import |function |const |let |var ")
    _CJK_RE = re.compile(r"[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]")

    # Per-message overhead tokens (role marker + separators) — OpenAI-style
    _MSG_OVERHEAD = 4

    # Model pricing (all free for us, but tracked for metrics — $/1M tokens)
    _PRICING: dict[str, dict[str, float]] = {
        "default":          {"prompt": 0.0, "completion": 0.0},
        "qwen3-coder":      {"prompt": 0.0, "completion": 0.0},
        "deepseek-r1":      {"prompt": 0.0, "completion": 0.0},
        "llama-3.3-70b":    {"prompt": 0.0, "completion": 0.0},
        "llama-4-scout":    {"prompt": 0.0, "completion": 0.0},
        "gemma-3-27b":      {"prompt": 0.0, "completion": 0.0},
    }

    def estimate(self, text: str) -> int:
        """Estimate token count for a single string."""
        if not text:
            return 0

        cjk_chars = len(self._CJK_RE.findall(text))
        non_cjk_len = len(text) - cjk_chars

        # Decide prose vs code ratio for non-CJK portion
        code_signals = len(self._CODE_INDICATORS.findall(text))
        is_code = code_signals > max(3, len(text) // 200)
        cpt = self._CHARS_PER_TOKEN_CODE if is_code else self._CHARS_PER_TOKEN_PROSE

        tokens = non_cjk_len / cpt + cjk_chars / self._CHARS_PER_TOKEN_CJK
        return max(1, math.ceil(tokens))

    def estimate_messages(self, messages: list[dict[str, str]]) -> int:
        """Estimate total tokens for a chat-style message list."""
        total = 0
        for msg in messages:
            total += self._MSG_OVERHEAD
            total += self.estimate(msg.get("role", ""))
            total += self.estimate(msg.get("content", ""))
            if "name" in msg:
                total += self.estimate(msg["name"]) + 1  # name overhead
        total += 3  # priming tokens
        return total

    def estimate_cost(self, model: str, prompt_tokens: int, completion_tokens: int) -> float:
        """Return estimated cost in USD (all our models are free → 0.0)."""
        pricing = self._PRICING.get(model, self._PRICING["default"])
        cost = (
            prompt_tokens * pricing["prompt"] / 1_000_000
            + completion_tokens * pricing["completion"] / 1_000_000
        )
        return cost


# ---------------------------------------------------------------------------
# 3. SmartRouter
# ---------------------------------------------------------------------------

class SmartRouter:
    """Route requests to the cheapest/fastest model for the job."""

    _CODE_KEYWORDS = re.compile(
        r"\b(code|function|bug|error|traceback|implement|refactor|debug|script|class|def |import |syntax)\b",
        re.I,
    )
    _REASONING_KEYWORDS = re.compile(
        r"\b(reason|explain why|analyze|compare|proof|logic|step[- ]by[- ]step|think through|evaluate)\b",
        re.I,
    )
    _SIMPLE_PATTERNS = re.compile(
        r"^(hi|hello|hey|thanks|ok|yes|no|sure|what time|how are you|good morning|good night)[.!?\s]*$",
        re.I,
    )

    # Model preference tiers (first = preferred for that category)
    _CATEGORY_PREFERENCES: dict[str, list[str]] = {
        "simple":    ["gemma-3-27b", "llama-3.3-70b", "llama-4-scout"],
        "moderate":  ["llama-3.3-70b", "llama-4-scout", "gemma-3-27b"],
        "complex":   ["llama-3.3-70b", "deepseek-r1", "llama-4-scout"],
        "code":      ["qwen3-coder", "deepseek-r1", "llama-3.3-70b"],
        "reasoning": ["deepseek-r1", "llama-3.3-70b", "qwen3-coder"],
    }

    def estimate_complexity(self, messages: list[dict[str, str]]) -> str:
        """Classify the conversation complexity.

        Returns one of: "simple", "moderate", "complex", "code", "reasoning".
        """
        combined = " ".join(m.get("content", "") for m in messages)
        last_user = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                last_user = m.get("content", "")
                break

        # Check simple first (only last user message)
        if self._SIMPLE_PATTERNS.match(last_user.strip()):
            return "simple"

        # Code detection
        code_hits = len(self._CODE_KEYWORDS.findall(combined))
        if code_hits >= 2:
            return "code"

        # Reasoning detection
        reasoning_hits = len(self._REASONING_KEYWORDS.findall(combined))
        if reasoning_hits >= 2:
            return "reasoning"

        # Length-based complexity
        total_len = len(combined)
        if total_len < 100:
            return "simple"
        if total_len < 800:
            return "moderate"
        return "complex"

    def select_model(
        self,
        messages: list[dict[str, str]],
        models: list[str],
        max_tokens: int | None = None,
    ) -> str:
        """Pick the best available model from *models* for these *messages*."""
        complexity = self.estimate_complexity(messages)
        preferences = self._CATEGORY_PREFERENCES.get(complexity, self._CATEGORY_PREFERENCES["moderate"])

        # Return the first preferred model that's in the available list
        for preferred in preferences:
            if preferred in models:
                return preferred

        # Fallback: just return first available model
        return models[0] if models else "llama-3.3-70b"


# ---------------------------------------------------------------------------
# 4. CostTracker
# ---------------------------------------------------------------------------

class CostTracker:
    """Track cumulative usage for sustainability metrics."""

    def __init__(self) -> None:
        self._counter = TokenCounter()
        self._data: dict[str, Any] = self._empty_state()

    # ---- tracking ----

    def record(
        self,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        *,
        tokens_saved: int = 0,
    ) -> None:
        """Record a single request."""
        today = date.today().isoformat()

        # Lifetime totals
        totals = self._data["totals"]
        totals["requests"] += 1
        totals["prompt_tokens"] += prompt_tokens
        totals["completion_tokens"] += completion_tokens
        totals["tokens_saved"] += tokens_saved
        totals["estimated_cost"] += self._counter.estimate_cost(model, prompt_tokens, completion_tokens)

        # Per-model totals
        if model not in self._data["by_model"]:
            self._data["by_model"][model] = self._empty_model_entry()
        m = self._data["by_model"][model]
        m["requests"] += 1
        m["prompt_tokens"] += prompt_tokens
        m["completion_tokens"] += completion_tokens

        # Daily tracking
        if today not in self._data["daily"]:
            self._data["daily"][today] = self._empty_daily_entry()
        d = self._data["daily"][today]
        d["requests"] += 1
        d["prompt_tokens"] += prompt_tokens
        d["completion_tokens"] += completion_tokens
        d["tokens_saved"] += tokens_saved

        # Per-model within daily
        if model not in d["by_model"]:
            d["by_model"][model] = 0
        d["by_model"][model] += 1

    # ---- reporting ----

    def report(self) -> dict[str, Any]:
        """Return full usage report."""
        return {
            "totals": dict(self._data["totals"]),
            "by_model": {k: dict(v) for k, v in self._data["by_model"].items()},
            "efficiency_score": self.get_efficiency_score(),
            "days_tracked": len(self._data["daily"]),
        }

    def get_daily_summary(self) -> dict[str, Any]:
        """Return today's usage summary."""
        today = date.today().isoformat()
        entry = self._data["daily"].get(today, self._empty_daily_entry())
        return {"date": today, **entry}

    def get_efficiency_score(self) -> float:
        """Tokens saved ÷ tokens sent. Higher is better. 0.0 if no data."""
        totals = self._data["totals"]
        sent = totals["prompt_tokens"] + totals["completion_tokens"]
        saved = totals["tokens_saved"]
        if sent == 0:
            return 0.0
        return round(saved / sent, 4)

    # ---- persistence ----

    def save(self, path: str | Path) -> None:
        """Persist tracking data to JSON."""
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(self._data, indent=2, default=str), encoding="utf-8")

    def load(self, path: str | Path) -> None:
        """Load tracking data from JSON."""
        p = Path(path)
        if p.exists():
            raw = json.loads(p.read_text(encoding="utf-8"))
            # Merge with defaults so new fields don't break old data
            merged = self._empty_state()
            merged.update(raw)
            self._data = merged

    # ---- private helpers ----

    @staticmethod
    def _empty_state() -> dict[str, Any]:
        return {
            "totals": {
                "requests": 0,
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "tokens_saved": 0,
                "estimated_cost": 0.0,
            },
            "by_model": {},
            "daily": {},
        }

    @staticmethod
    def _empty_model_entry() -> dict[str, int]:
        return {"requests": 0, "prompt_tokens": 0, "completion_tokens": 0}

    @staticmethod
    def _empty_daily_entry() -> dict[str, Any]:
        return {
            "requests": 0,
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "tokens_saved": 0,
            "by_model": {},
        }


# ---------------------------------------------------------------------------
# Convenience: module-level singletons
# ---------------------------------------------------------------------------

compressor = PromptCompressor()
counter = TokenCounter()
router = SmartRouter()
tracker = CostTracker()
