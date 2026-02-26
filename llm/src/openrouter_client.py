"""
Quantum Chimera LLM - OpenRouter Client
========================================
OpenRouter API client with health monitoring and cooldown integration.
"""

import json
import time
from typing import Dict, List, Optional, Any, Generator

import requests

from llm.config import get_config
from llm.src.logger import get_logger
from llm.src.model_tracker import get_model_tracker

logger = get_logger()


_openrouter_client_instance = None
def get_openrouter_client():
	global _openrouter_client_instance
	if _openrouter_client_instance is None:
		_openrouter_client_instance = OpenRouterClient()
	return _openrouter_client_instance