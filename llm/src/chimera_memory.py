"""
Quantum Chimera LLM - Memory (Lazy Loading)
============================================
Lazy-loaded embedding model with local cache.
"""

import os
from typing import List, Optional
import numpy as np

from llm.config import get_config
from llm.src.logger import get_logger

logger = get_logger()


_chimera_memory_instance = None
def get_chimera_memory():
	global _chimera_memory_instance
	if _chimera_memory_instance is None:
		_chimera_memory_instance = ChimeraMemory()
	return _chimera_memory_instance