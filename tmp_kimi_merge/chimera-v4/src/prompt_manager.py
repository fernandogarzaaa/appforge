"""
Quantum Chimera LLM v4.0 - Prompt Management System
===================================================
Advanced prompt management with templates, versioning, and optimization.

Features:
- Prompt templates with variable substitution
- Prompt versioning and A/B testing
- Prompt optimization suggestions
- Prompt performance tracking
- Dynamic prompt assembly
"""

import json
import re
import time
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field, asdict
from pathlib import Path
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


@dataclass
class PromptTemplate:
    """Prompt template with metadata."""
    name: str
    template: str
    description: str = ""
    version: str = "1.0"
    variables: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    created_at: float = field(default_factory=time.time)
    usage_count: int = 0
    avg_quality_score: float = 0.0
    
    def render(self, **kwargs) -> str:
        """Render template with variables."""
        result = self.template
        for key, value in kwargs.items():
            placeholder = f"{{{key}}}"
            result = result.replace(placeholder, str(value))
        return result
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "template": self.template,
            "description": self.description,
            "version": self.version,
            "variables": self.variables,
            "tags": self.tags,
            "created_at": self.created_at,
            "usage_count": self.usage_count,
            "avg_quality_score": self.avg_quality_score
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'PromptTemplate':
        return cls(
            name=data.get("name", ""),
            template=data.get("template", ""),
            description=data.get("description", ""),
            version=data.get("version", "1.0"),
            variables=data.get("variables", []),
            tags=data.get("tags", []),
            created_at=data.get("created_at", time.time()),
            usage_count=data.get("usage_count", 0),
            avg_quality_score=data.get("avg_quality_score", 0.0)
        )


@dataclass
class PromptVersion:
    """Version of a prompt for A/B testing."""
    version_id: str
    template: str
    weight: float = 1.0  # For weighted random selection
    performance_score: float = 0.0
    usage_count: int = 0


class PromptManager:
    """
    Advanced prompt management system.
    
    Features:
    - Template management with variable substitution
    - Version control for A/B testing
    - Performance tracking
    - Optimization suggestions
    """
    
    # Built-in system prompts
    DEFAULT_SYSTEM_PROMPTS = {
        "default": "You are a helpful AI assistant. Provide clear, accurate, and helpful responses.",
        
        "code": """You are an expert programmer. Write clean, well-documented, and efficient code.
Follow best practices and explain your reasoning when appropriate.
Use appropriate formatting for code blocks.""",
        
        "creative": """You are a creative writing assistant. Help with storytelling, creative projects,
and generating original ideas. Be imaginative while maintaining coherence.""",
        
        "analytical": """You are an analytical assistant. Provide thorough analysis, consider multiple perspectives,
and support conclusions with logical reasoning. Be precise and methodical.""",
        
        "concise": """You are a concise assistant. Provide brief, direct answers without unnecessary elaboration.
Focus on the key information requested.""",
        
        "expert": """You are an expert in your field. Provide detailed, accurate information with depth
and nuance. Acknowledge limitations and uncertainties when appropriate.""",
        
        "teacher": """You are a patient teacher. Explain concepts clearly, use examples, and check for understanding.
Adapt your explanation to the user's level of knowledge."""
    }
    
    def __init__(self, data_dir: str = "./data/prompts"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # Template storage
        self._templates: Dict[str, PromptTemplate] = {}
        self._versions: Dict[str, List[PromptVersion]] = defaultdict(list)
        
        # System prompts
        self._system_prompts: Dict[str, str] = dict(self.DEFAULT_SYSTEM_PROMPTS)
        
        # Performance tracking
        self._performance: Dict[str, List[Dict]] = defaultdict(list)
        
        # Load saved data
        self._load_data()
        
        logger.info(f"PromptManager initialized with {len(self._templates)} templates")
    
    def register_template(
        self,
        name: str,
        template: str,
        description: str = "",
        variables: Optional[List[str]] = None,
        tags: Optional[List[str]] = None
    ) -> PromptTemplate:
        """Register a new prompt template."""
        # Extract variables from template if not provided
        if variables is None:
            variables = re.findall(r'\{(\w+)\}', template)
        
        prompt_template = PromptTemplate(
            name=name,
            template=template,
            description=description,
            variables=variables,
            tags=tags or []
        )
        
        self._templates[name] = prompt_template
        logger.info(f"Registered template: {name}")
        
        return prompt_template
    
    def get_template(self, name: str) -> Optional[PromptTemplate]:
        """Get a template by name."""
        return self._templates.get(name)
    
    def render_template(self, name: str, **kwargs) -> Optional[str]:
        """Render a template with variables."""
        template = self._templates.get(name)
        if not template:
            logger.warning(f"Template not found: {name}")
            return None
        
        template.usage_count += 1
        return template.render(**kwargs)
    
    def set_system_prompt(self, name: str, prompt: str):
        """Set a system prompt."""
        self._system_prompts[name] = prompt
        logger.info(f"Set system prompt: {name}")
    
    def get_system_prompt(self, name: str = "default") -> str:
        """Get a system prompt."""
        return self._system_prompts.get(name, self._system_prompts["default"])
    
    def list_system_prompts(self) -> Dict[str, str]:
        """List all system prompts."""
        return dict(self._system_prompts)
    
    def add_version(
        self,
        template_name: str,
        version_id: str,
        template: str,
        weight: float = 1.0
    ):
        """Add a version for A/B testing."""
        version = PromptVersion(
            version_id=version_id,
            template=template,
            weight=weight
        )
        self._versions[template_name].append(version)
        logger.info(f"Added version {version_id} to {template_name}")
    
    def select_version(self, template_name: str) -> Optional[PromptVersion]:
        """Select a version using weighted random selection."""
        versions = self._versions.get(template_name, [])
        if not versions:
            return None
        
        import random
        total_weight = sum(v.weight for v in versions)
        r = random.uniform(0, total_weight)
        
        cumulative = 0
        for version in versions:
            cumulative += version.weight
            if r <= cumulative:
                version.usage_count += 1
                return version
        
        return versions[-1]
    
    def record_performance(
        self,
        template_name: str,
        quality_score: float,
        latency_ms: float,
        tokens_used: int
    ):
        """Record performance for a template."""
        self._performance[template_name].append({
            "timestamp": time.time(),
            "quality_score": quality_score,
            "latency_ms": latency_ms,
            "tokens_used": tokens_used
        })
        
        # Update template's average quality
        if template_name in self._templates:
            template = self._templates[template_name]
            scores = [p["quality_score"] for p in self._performance[template_name]]
            template.avg_quality_score = sum(scores) / len(scores) if scores else 0
    
    def get_optimization_suggestions(self, template_name: str) -> List[str]:
        """Get optimization suggestions for a template."""
        suggestions = []
        
        template = self._templates.get(template_name)
        if not template:
            return suggestions
        
        # Check template length
        if len(template.template) > 2000:
            suggestions.append("Template is very long. Consider splitting into smaller templates.")
        
        # Check for undefined variables
        used_vars = set(re.findall(r'\{(\w+)\}', template.template))
        defined_vars = set(template.variables)
        undefined = used_vars - defined_vars
        if undefined:
            suggestions.append(f"Template uses undefined variables: {undefined}")
        
        # Check performance
        performance = self._performance.get(template_name, [])
        if performance:
            avg_quality = sum(p["quality_score"] for p in performance) / len(performance)
            if avg_quality < 0.6:
                suggestions.append(f"Low average quality score ({avg_quality:.2f}). Consider revising the template.")
            
            avg_latency = sum(p["latency_ms"] for p in performance) / len(performance)
            if avg_latency > 5000:
                suggestions.append(f"High average latency ({avg_latency:.0f}ms). Consider simplifying the template.")
        
        # Check usage
        if template.usage_count > 100 and template.avg_quality_score < 0.7:
            suggestions.append("High usage but moderate quality. A/B test improvements.")
        
        return suggestions
    
    def assemble_messages(
        self,
        user_message: str,
        system_prompt: Optional[str] = None,
        context: Optional[List[Dict[str, str]]] = None
    ) -> List[Dict[str, str]]:
        """Assemble a complete message list."""
        messages = []
        
        # Add system prompt
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        # Add context
        if context:
            messages.extend(context)
        
        # Add user message
        messages.append({"role": "user", "content": user_message})
        
        return messages
    
    def search_templates(self, query: str) -> List[PromptTemplate]:
        """Search templates by name, description, or tags."""
        query_lower = query.lower()
        results = []
        
        for template in self._templates.values():
            if (query_lower in template.name.lower() or
                query_lower in template.description.lower() or
                any(query_lower in tag.lower() for tag in template.tags)):
                results.append(template)
        
        return results
    
    def get_stats(self) -> Dict[str, Any]:
        """Get prompt manager statistics."""
        return {
            "total_templates": len(self._templates),
            "total_system_prompts": len(self._system_prompts),
            "total_versions": sum(len(v) for v in self._versions.values()),
            "most_used": sorted(
                self._templates.values(),
                key=lambda t: t.usage_count,
                reverse=True
            )[:5],
            "highest_quality": sorted(
                self._templates.values(),
                key=lambda t: t.avg_quality_score,
                reverse=True
            )[:5]
        }
    
    def _load_data(self):
        """Load saved templates and data."""
        try:
            # Load templates
            templates_file = self.data_dir / "templates.json"
            if templates_file.exists():
                with open(templates_file, 'r') as f:
                    data = json.load(f)
                
                for name, template_data in data.get("templates", {}).items():
                    self._templates[name] = PromptTemplate.from_dict(template_data)
                
                self._system_prompts.update(data.get("system_prompts", {}))
                
                logger.info(f"Loaded {len(self._templates)} templates")
        except Exception as e:
            logger.warning(f"Error loading prompt data: {e}")
    
    def save_data(self):
        """Save templates and data."""
        try:
            data = {
                "templates": {
                    name: template.to_dict()
                    for name, template in self._templates.items()
                },
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
    """Get or create global prompt manager."""
    global _manager
    if _manager is None:
        _manager = PromptManager(data_dir=data_dir)
    return _manager
