"""
ChimeraContext — Deterministic context object for stabilization
"""

class ChimeraContext:
    def __init__(self, messages, user_text=None, intent=None, domain=None, strategy=None, responses=None, token_budget=8000, model_call_count=0, recursion_depth=0):
        self.messages = messages
        self.user_text = user_text or self._extract_user_text(messages)
        self.intent = intent
        self.domain = domain
        self.strategy = strategy
        self.responses = responses or []
        self.token_budget = token_budget
        self.model_call_count = model_call_count
        self.recursion_depth = recursion_depth

    @staticmethod
    def _extract_user_text(messages):
        return " ".join(
            m["content"] for m in messages if m.get("role") == "user" and m.get("content")
        )

    def add_response(self, response):
        self.responses.append(response)

    def increment_model_call(self):
        self.model_call_count += 1

    def increment_recursion(self):
        self.recursion_depth += 1

    def set_strategy(self, strategy):
        self.strategy = strategy

    def set_intent(self, intent):
        self.intent = intent

    def set_domain(self, domain):
        self.domain = domain

    def set_token_budget(self, budget):
        self.token_budget = budget
