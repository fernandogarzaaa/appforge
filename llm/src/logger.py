"""
Quantum Chimera LLM - Logging
==============================
Structured logging with no silent error swallowing.
"""

import logging
import sys
from datetime import datetime
from typing import Any, Dict, Optional
import json


class ChimeraLogger:
	"""Structured logger that never swallows errors silently."""
    
	def __init__(self, name: str = "chimera", level: int = logging.INFO):
		self.logger = logging.getLogger(name)
		self.logger.setLevel(level)
        
		# Clear existing handlers
		self.logger.handlers = []
        
		# Console handler with structured format
		console_handler = logging.StreamHandler(sys.stdout)
		console_handler.setLevel(level)
        
		formatter = logging.Formatter(
			'%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
			datefmt='%Y-%m-%d %H:%M:%S'
		)
		console_handler.setFormatter(formatter)
		self.logger.addHandler(console_handler)
        
		# File handler for persistent logs
		try:
			file_handler = logging.FileHandler('./data/chimera.log')
			file_handler.setLevel(logging.DEBUG)
			file_handler.setFormatter(formatter)
			self.logger.addHandler(file_handler)
		except Exception as e:
			self.logger.warning(f"Could not create file handler: {e}")
    
	def debug(self, msg: str, **kwargs):
		"""Log debug message."""
		self._log(logging.DEBUG, msg, **kwargs)
    
	def info(self, msg: str, **kwargs):
		"""Log info message."""
		self._log(logging.INFO, msg, **kwargs)
    
	def warning(self, msg: str, **kwargs):
		"""Log warning message."""
		self._log(logging.WARNING, msg, **kwargs)
    
	def error(self, msg: str, exc_info: bool = True, **kwargs):
		"""Log error message - NEVER silent."""
		self._log(logging.ERROR, msg, exc_info=exc_info, **kwargs)
    
	def critical(self, msg: str, exc_info: bool = True, **kwargs):
		self._log(logging.CRITICAL, msg, exc_info=exc_info, **kwargs)

	def _log(self, level: int, msg: str, exc_info: bool = False, **kwargs):
		extra = {"extra": kwargs} if kwargs else {}
		self.logger.log(level, msg, exc_info=exc_info, **extra)

_logger_instance = None
def get_logger():
	global _logger_instance
	if _logger_instance is None:
		_logger_instance = ChimeraLogger()
	return _logger_instance

def log_error_with_context(e, context: str, fallback_action: str = ""):
	logger = get_logger()
	logger.error(f"[{context}] {str(e)} | {fallback_action}")
	return {"error": str(e), "context": context, "action": fallback_action}