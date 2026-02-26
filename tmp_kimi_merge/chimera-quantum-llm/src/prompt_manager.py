"""
Quantum Chimera LLM - Prompt Manager
=====================================
Intent-aware system prompt management.
"""

from typing import Dict, Optional
from enum import Enum

from config import get_config
from src.logger import get_logger

logger = get_logger()


class IntentType(Enum):
    """Supported intent types."""
    CODING = "coding"
    SCIENCE = "science"
    GENERAL = "general"
    CREATIVE = "creative"
    ANALYSIS = "analysis"
    UNKNOWN = "unknown"


class PromptManager:
    """Manage system prompts based on intent and domain."""
    
    # Intent-specific system prompts
    PROMPTS: Dict[str, str] = {
        IntentType.CODING.value: """You are an expert software engineer and coding assistant.
Provide clean, well-documented code with explanations.
Follow best practices and modern conventions.
Include error handling and edge cases.
Prefer readability over cleverness.""",
        
        IntentType.SCIENCE.value: """You are a knowledgeable scientific research assistant.
Provide accurate, evidence-based information.
Cite sources when possible.
Distinguish between established facts and hypotheses.
Acknowledge uncertainty when appropriate.""",
        
        IntentType.GENERAL.value: """You are a helpful, friendly assistant.
Provide clear, concise answers.
Be honest about what you don't know.
Ask clarifying questions when needed.
Maintain a professional but approachable tone.""",
        
        IntentType.CREATIVE.value: """You are a creative writing assistant.
Help with storytelling, poetry, and creative projects.
Provide constructive feedback and suggestions.
Encourage originality and fresh perspectives.
Respect the user's creative vision.""",
        
        IntentType.ANALYSIS.value: """You are an analytical assistant skilled in critical thinking.
Break down complex problems systematically.
Consider multiple perspectives and trade-offs.
Provide structured, logical analysis.
Support conclusions with reasoning.""",
    }
    
    def __init__(self):
        self.config = get_config()
        logger.info("PromptManager initialized")
    
    def detect_intent(self, query: str) -> str:
        """
        Detect the intent of a query.
        
        Returns one of: coding, science, general, creative, analysis
        """
        query_lower = query.lower()
        
        # Coding indicators
        coding_keywords = [
            "code", "program", "function", "class", "bug", "error", "debug",
            "python", "javascript", "java", "cpp", "rust", "go", "typescript",
            "sql", "html", "css", "react", "api", "json", "xml", "yaml",
            "algorithm", "data structure", "library", "framework", "git",
        ]
        
        # Science indicators
        science_keywords = [
            "science", "physics", "chemistry", "biology", "math", "equation",
            "theorem", "experiment", "research", "study", "paper", "journal",
            "molecule", "atom", "cell", "organism", "planet", "galaxy",
            "evolution", "quantum", "relativity", "thermodynamics",
        ]
        
        # Creative indicators
        creative_keywords = [
            "story", "poem", "write", "creative", "fiction", "novel",
            "character", "plot", "dialogue", "scene", "chapter", "verse",
            "imagine", "invent", "design", "art", "music", "song",
        ]
        
        # Analysis indicators
        analysis_keywords = [
            "analyze", "compare", "contrast", "evaluate", "assess",
            "pros and cons", "advantages", "disadvantages", "trade-off",
            "strategy", "recommendation", "solution", "optimize",
            "performance", "efficiency", "cost", "benefit",
        ]
        
        # Count matches for each category
        coding_score = sum(1 for kw in coding_keywords if kw in query_lower)
        science_score = sum(1 for kw in science_keywords if kw in query_lower)
        creative_score = sum(1 for kw in creative_keywords if kw in query_lower)
        analysis_score = sum(1 for kw in analysis_keywords if kw in query_lower)
        
        scores = {
            IntentType.CODING.value: coding_score,
            IntentType.SCIENCE.value: science_score,
            IntentType.CREATIVE.value: creative_score,
            IntentType.ANALYSIS.value: analysis_score,
        }
        
        # Get highest scoring intent
        max_intent = max(scores, key=scores.get)
        max_score = scores[max_intent]
        
        # If no clear match, return general
        if max_score == 0:
            return IntentType.GENERAL.value
        
        logger.debug(f"Detected intent: {max_intent}", 
                    scores=scores,
                    query_preview=query[:50])
        
        return max_intent
    
    def get_system_prompt(
        self, 
        intent: Optional[str] = None, 
        domain: Optional[str] = None
    ) -> str:
        """
        Get the appropriate system prompt for an intent.
        
        Args:
            intent: The detected intent (coding, science, etc.)
            domain: Optional domain context
        
        Returns:
            System prompt string
        """
        # Check for custom override
        if self.config.CUSTOM_SYSTEM_PROMPT:
            logger.debug("Using custom system prompt from env")
            return self.config.CUSTOM_SYSTEM_PROMPT
        
        # Use detected intent or default
        if intent is None:
            intent = IntentType.GENERAL.value
        
        # Get prompt for intent
        prompt = self.PROMPTS.get(intent, self.PROMPTS[IntentType.GENERAL.value])
        
        # Add domain context if provided
        if domain:
            prompt += f"\n\nDomain context: {domain}"
        
        logger.debug(f"Using system prompt for intent: {intent}")
        
        return prompt
    
    def inject_system_prompt(
        self, 
        messages: list, 
        intent: Optional[str] = None,
        domain: Optional[str] = None
    ) -> list:
        """
        Inject system prompt into messages if none exists.
        
        Args:
            messages: List of message dicts
            intent: Detected intent
            domain: Optional domain
        
        Returns:
            Modified messages list
        """
        # Check if system message already exists
        has_system = any(
            msg.get("role") == "system" for msg in messages
        )
        
        if has_system:
            logger.debug("System message already exists, preserving it")
            return messages
        
        # Get appropriate system prompt
        system_prompt = self.get_system_prompt(intent, domain)
        
        # Insert at beginning
        new_messages = [{"role": "system", "content": system_prompt}] + messages
        
        logger.debug(f"Injected system prompt for intent: {intent or 'general'}")
        
        return new_messages


# Global instance
_manager: Optional[PromptManager] = None


def get_prompt_manager() -> PromptManager:
    """Get global prompt manager instance."""
    global _manager
    if _manager is None:
        _manager = PromptManager()
    return _manager
