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
        """Log critical message."""
        self._log(logging.CRITICAL, msg, exc_info=exc_info, **kwargs)
    
    def _log(self, level: int, msg: str, exc_info: bool = False, **kwargs):
        """Internal log method with structured extras."""
        if kwargs:
            # Add structured data as JSON
            extra_str = json.dumps(kwargs, default=str)
            msg = f"{msg} | {extra_str}"
        
        self.logger.log(level, msg, exc_info=exc_info)


# Global logger instance
_logger: Optional[ChimeraLogger] = None


def get_logger() -> ChimeraLogger:
    """Get global logger instance."""
    global _logger
    if _logger is None:
        _logger = ChimeraLogger()
    return _logger


def log_error_with_context(
    error: Exception,
    context: str,
    fallback_action: str = "returning safe fallback",
    **extra_context
) -> Dict[str, Any]:
    """
    Log error with full context and return safe fallback data.
    
    This function ensures NO error is swallowed silently.
    """
    logger = get_logger()
    
    error_data = {
        "error_type": type(error).__name__,
        "error_message": str(error),
        "context": context,
        "fallback_action": fallback_action,
        "timestamp": datetime.utcnow().isoformat(),
        **extra_context
    }
    
    logger.error(
        f"ERROR in {context}: {type(error).__name__}: {str(error)}",
        exc_info=True,
        **error_data
    )
    
    return error_data
