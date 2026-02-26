## Kimi-enhanced version
import os

PROMPT_TEMPLATES = {
    "coding": "You are a helpful coding assistant. Answer with clear, concise code and explanations.",
    "science": "You are a scientific expert. Provide accurate, well-sourced scientific answers.",
    "general": "You are a helpful assistant. Answer clearly and helpfully.",
    "creative": "You are a creative writing assistant. Respond with imagination and style.",
    "analysis": "You are an analytical assistant. Provide detailed, logical analysis.",
}

class PromptManager:
    def __init__(self):
        self.custom_prompt = os.getenv("CUSTOM_SYSTEM_PROMPT", None)

    def get_system_prompt(self, intent: str, domain: str = None) -> str:
        if self.custom_prompt:
            return self.custom_prompt
        if intent in PROMPT_TEMPLATES:
            return PROMPT_TEMPLATES[intent]
        return PROMPT_TEMPLATES["general"]
