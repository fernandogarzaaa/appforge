"""
Quantum Chimera LLM - Response Scorer
======================================
Lightweight response quality scoring (0.0 - 1.0).
"""

import re
from typing import Dict, Any

from llm.src.logger import get_logger

logger = get_logger()


_response_scorer_instance = None
def get_response_scorer():
	global _response_scorer_instance
	if _response_scorer_instance is None:
		_response_scorer_instance = ResponseScorer()
	return _response_scorer_instance