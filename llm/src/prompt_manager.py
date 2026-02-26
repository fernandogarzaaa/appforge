
"""
Quantum Chimera LLM - Prompt Manager
====================================
Intent-aware system prompt management.
"""

import json
import time
import re
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Optional, Any

from llm.config import get_config
from llm.src.logger import get_logger

logger = get_logger()

class PromptManager:
	"""Manage system prompts, templates, and intent detection."""

	DEFAULT_SYSTEM_PROMPTS = {
		"default": "You are a helpful AI assistant. Provide clear, accurate, and helpful responses.",
		"code": "You are an expert programmer. Write clean, well-documented, and efficient code.\nFollow best practices and explain your reasoning when appropriate.\nUse appropriate formatting for code blocks.",
		"creative": "You are a creative writing assistant. Help with storytelling, creative projects,\nand generating original ideas. Be imaginative while maintaining coherence.",
		"analytical": "You are an analytical assistant. Provide thorough analysis, consider multiple perspectives,\nand support conclusions with logical reasoning. Be precise and methodical.",
		"concise": "You are a concise assistant. Provide brief, direct answers without unnecessary elaboration.\nFocus on the key information requested.",
		"expert": "You are an expert in your field. Provide detailed, accurate information with depth\nand nuance. Acknowledge limitations and uncertainties when appropriate.",
		"teacher": "You are a patient teacher. Explain concepts clearly, use examples, and check for understanding.\nAdapt your explanation to the user's level of knowledge."
	}

	def __init__(self, data_dir: str = "./data/prompts"):
		self.config = get_config()
		self.data_dir = Path(data_dir)
		self.data_dir.mkdir(parents=True, exist_ok=True)
		self._templates: Dict[str, Any] = {}
		self._versions: Dict[str, List[Any]] = defaultdict(list)
		self._system_prompts: Dict[str, str] = dict(self.DEFAULT_SYSTEM_PROMPTS)
		self._performance: Dict[str, List[Dict]] = defaultdict(list)
		self._load_data()
		logger.info(f"PromptManager initialized with {len(self._templates)} templates")

	def detect_intent(self, query: str) -> str:
		query_lower = query.lower()
		coding_keywords = [
			"code", "program", "function", "class", "bug", "error", "debug",
			"python", "javascript", "java", "cpp", "rust", "go", "typescript",
			"sql", "html", "css", "react", "api", "json", "xml", "yaml",
			"algorithm", "data structure", "library", "framework", "git",
		]
		science_keywords = [
			"science", "physics", "chemistry", "biology", "math", "equation",
			"theorem", "experiment", "research", "study", "paper", "journal",
			"molecule", "atom", "cell", "organism", "planet", "galaxy",
			"evolution", "quantum", "relativity", "thermodynamics",
		]
		creative_keywords = [
			"story", "poem", "write", "creative", "fiction", "novel",
			"character", "plot", "dialogue", "scene", "chapter", "verse",
			"imagine", "invent", "design", "art", "music", "song",
		]
		analysis_keywords = [
			"analyze", "compare", "contrast", "evaluate", "assess",
			"pros and cons", "advantages", "disadvantages", "trade-off",
			"strategy", "recommendation", "solution", "optimize",
			"performance", "efficiency", "cost", "benefit",
		]
		coding_score = sum(1 for kw in coding_keywords if kw in query_lower)
		science_score = sum(1 for kw in science_keywords if kw in query_lower)
		creative_score = sum(1 for kw in creative_keywords if kw in query_lower)
		analysis_score = sum(1 for kw in analysis_keywords if kw in query_lower)
		scores = {
			"coding": coding_score,
			"science": science_score,
			"creative": creative_score,
			"analysis": analysis_score,
		}
		max_intent = max(scores, key=scores.get)
		max_score = scores[max_intent]
		if max_score == 0:
			return "general"
		logger.debug(f"Detected intent: {max_intent}", scores=scores, query_preview=query[:50])
		return max_intent

	def get_system_prompt(self, name: str = "default") -> str:
		return self._system_prompts.get(name, self._system_prompts["default"])

	def set_system_prompt(self, name: str, prompt: str):
		self._system_prompts[name] = prompt
		logger.info(f"Set system prompt: {name}")

	def inject_system_prompt(self, messages: list, intent: Optional[str] = None, domain: Optional[str] = None) -> list:
		has_system = any(msg.get("role") == "system" for msg in messages)
		if has_system:
			logger.debug("System message already exists, preserving it")
			return messages
		system_prompt = self.get_system_prompt(intent or "default")
		if domain:
			system_prompt += f"\n\nDomain context: {domain}"
		new_messages = [{"role": "system", "content": system_prompt}] + messages
		logger.debug(f"Injected system prompt for intent: {intent or 'general'}")
		return new_messages

	def register_template(self, name: str, template: str, description: str = "", variables: Optional[List[str]] = None, tags: Optional[List[str]] = None) -> Any:
		if variables is None:
			variables = re.findall(r'\{(\w+)\}', template)
		prompt_template = {
			"name": name,
			"template": template,
			"description": description,
			"variables": variables,
			"tags": tags or [],
			"usage_count": 0,
			"avg_quality_score": 0.0
		}
		self._templates[name] = prompt_template
		logger.info(f"Registered template: {name}")
		return prompt_template

	def get_template(self, name: str) -> Optional[Any]:
		return self._templates.get(name)

	def render_template(self, name: str, **kwargs) -> Optional[str]:
		template = self._templates.get(name)
		if not template:
			logger.warning(f"Template not found: {name}")
			return None
		template["usage_count"] += 1
		return template["template"].format(**kwargs)

	def list_system_prompts(self) -> Dict[str, str]:
		return dict(self._system_prompts)

	def add_version(self, template_name: str, version_id: str, template: str, weight: float = 1.0):
		version = {
			"version_id": version_id,
			"template": template,
			"weight": weight,
			"usage_count": 0
		}
		self._versions[template_name].append(version)
		logger.info(f"Added version {version_id} to {template_name}")

	def select_version(self, template_name: str) -> Optional[Any]:
		versions = self._versions.get(template_name, [])
		if not versions:
			return None
		import random
		total_weight = sum(v["weight"] for v in versions)
		r = random.uniform(0, total_weight)
		cumulative = 0
		for version in versions:
			cumulative += version["weight"]
			if r <= cumulative:
				version["usage_count"] += 1
				return version
		return versions[-1] if versions else None

	def record_performance(self, template_name: str, quality_score: float, latency_ms: float, tokens_used: int):
		self._performance[template_name].append({
			"timestamp": time.time(),
			"quality_score": quality_score,
			"latency_ms": latency_ms,
			"tokens_used": tokens_used
		})
		if template_name in self._templates:
			template = self._templates[template_name]
			scores = [p["quality_score"] for p in self._performance[template_name]]
			template["avg_quality_score"] = sum(scores) / len(scores) if scores else 0

	def get_optimization_suggestions(self, template_name: str) -> List[str]:
		suggestions = []
		template = self._templates.get(template_name)
		if not template:
			return suggestions
		if len(template["template"]) > 2000:
			suggestions.append("Template is very long. Consider splitting into smaller templates.")
		used_vars = set(re.findall(r'\{(\w+)\}', template["template"]))
		defined_vars = set(template["variables"])
		undefined = used_vars - defined_vars
		if undefined:
			suggestions.append(f"Template uses undefined variables: {undefined}")
		performance = self._performance.get(template_name, [])
		if performance:
			avg_quality = sum(p["quality_score"] for p in performance) / len(performance)
			if avg_quality < 0.6:
				suggestions.append(f"Low average quality score ({avg_quality:.2f}). Consider revising the template.")
			avg_latency = sum(p["latency_ms"] for p in performance) / len(performance)
			if avg_latency > 5000:
				suggestions.append(f"High average latency ({avg_latency:.0f}ms). Consider simplifying the template.")
		if template["usage_count"] > 100 and template["avg_quality_score"] < 0.7:
			suggestions.append("High usage but moderate quality. A/B test improvements.")
		return suggestions

	def assemble_messages(self, user_message: str, system_prompt: Optional[str] = None, context: Optional[List[Dict[str, str]]] = None) -> List[Dict[str, str]]:
		messages = []
		if system_prompt:
			messages.append({"role": "system", "content": system_prompt})
		if context:
			messages.extend(context)
		messages.append({"role": "user", "content": user_message})
		return messages

	def search_templates(self, query: str) -> List[Any]:
		query_lower = query.lower()
		results = []
		for template in self._templates.values():
			if (query_lower in template["name"].lower() or
				query_lower in template["description"].lower() or
				any(query_lower in tag.lower() for tag in template["tags"])):
				results.append(template)
		return results

	def get_stats(self) -> Dict[str, Any]:
		return {
			"total_templates": len(self._templates),
			"total_system_prompts": len(self._system_prompts),
			"total_versions": sum(len(v) for v in self._versions.values()),
			"most_used": sorted(self._templates.values(), key=lambda t: t["usage_count"], reverse=True)[:5],
			"highest_quality": sorted(self._templates.values(), key=lambda t: t["avg_quality_score"], reverse=True)[:5]
		}

	def _load_data(self):
		try:
			templates_file = self.data_dir / "templates.json"
			if templates_file.exists():
				with open(templates_file, 'r') as f:
					data = json.load(f)
				for name, template_data in data.get("templates", {}).items():
					self._templates[name] = template_data
				self._system_prompts.update(data.get("system_prompts", {}))
				logger.info(f"Loaded {len(self._templates)} templates")
		except Exception as e:
			logger.warning(f"Error loading prompt data: {e}")

	def save_data(self):
		try:
			data = {
				"templates": {name: template for name, template in self._templates.items()},
				"system_prompts": self._system_prompts
			}
			templates_file = self.data_dir / "templates.json"
			with open(templates_file, 'w') as f:
				json.dump(data, f, indent=2)
			logger.info("Saved prompt data")
		except Exception as e:
			logger.error(f"Error saving prompt data: {e}")


# Global prompt manager instance
_manager: Optional[PromptManager] = None

def get_prompt_manager(data_dir: str = "./data/prompts") -> PromptManager:
	global _manager
	if _manager is None:
		_manager = PromptManager(data_dir=data_dir)
	return _manager