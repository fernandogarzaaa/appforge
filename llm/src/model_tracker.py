"""
Quantum Chimera LLM - Model Tracker
====================================
Per-model performance tracking with health monitoring and rate limiting.
"""

import json
import time
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field, asdict
from collections import defaultdict
import os

from llm.config import get_config
from llm.src.logger import get_logger

logger = get_logger()

# ...rest of Kimi-enhanced model_tracker.py...

_model_tracker_instance = None
def get_model_tracker():
	global _model_tracker_instance
	if _model_tracker_instance is None:
		_model_tracker_instance = ModelTracker()
	return _model_tracker_instance