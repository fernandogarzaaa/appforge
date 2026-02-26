"""
Quantum Chimera LLM - Kimi Client
==================================
OpenAI-compatible client for Moonshot AI's Kimi K2.5.
Last-resort fallback only.
"""

import json
import time
from datetime import datetime
from typing import Dict, List, Optional, Any, Generator
import os

import openai

from llm.config import get_config
from llm.src.logger import get_logger

logger = get_logger()


_kimi_client_instance = None
def get_kimi_client():
	global _kimi_client_instance
	if _kimi_client_instance is None:
		_kimi_client_instance = KimiClient()
	return _kimi_client_instance