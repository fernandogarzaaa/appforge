"""
Safety and Alignment Filter for LLM outputs.
- Blocks unsafe, toxic, or policy-violating content.
- Can be extended with external APIs (OpenAI, Perspective, etc).
"""
import re
from typing import Tuple

# Basic keyword and regex-based filters (extend as needed)
UNSAFE_KEYWORDS = [
    "kill", "suicide", "violence", "hate", "bomb", "attack", "explosive", "harm", "abuse",
    "rape", "murder", "terror", "shoot", "stab", "molest", "incest", "genocide", "execute",
    "torture", "threat", "assault", "harass", "self-harm", "overdose", "abduct", "hostage",
    "nazi", "holocaust", "lynch", "slavery", "pedophile", "child porn", "gore", "dismember",
    "nsfw", "porn", "sex", "sexual", "nude", "nudity", "prostitute", "profanity", "fuck", "shit",
    "bitch", "cunt", "asshole", "bastard", "dick", "pussy", "cock", "cum", "blowjob", "anal",
    "racist", "bigot", "homophobic", "transphobic", "misogynist", "slur", "retard", "cripple",
]

# Regex for common patterns (emails, phone numbers, etc)
PATTERNS = [
    re.compile(r"\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b"),  # US phone numbers
    re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"),  # emails
]

def safety_filter(text: str) -> Tuple[bool, str]:
    """
    Returns (is_safe, reason). If not safe, reason describes why.
    """
    lowered = text.lower()
    for word in UNSAFE_KEYWORDS:
        if word in lowered:
            return False, f"Blocked for unsafe keyword: {word}"
    for pat in PATTERNS:
        if pat.search(text):
            return False, "Blocked for sensitive pattern (PII or similar)"
    # Add more advanced checks here (toxicity, external APIs, etc)
    return True, ""
