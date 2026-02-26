"""
Quantum Chimera LLM v4.0 - Structured Logging System
====================================================
Advanced logging with structured output, rotation, and multiple backends.

Features:
- Structured JSON logging for machine parsing
- Pretty console output for human readability
- Log rotation with size and age-based policies
- Multiple log levels with granular control
- Contextual logging with correlation IDs
- Async logging for performance
- Log aggregation and forwarding
"""

import json
import logging
import logging.handlers
import sys
import time
import asyncio
import queue
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from contextvars import ContextVar
import traceback


# Context variables for correlation tracking
_correlation_id: ContextVar[str] = ContextVar('correlation_id', default='')
_session_id: ContextVar[str] = ContextVar('session_id', default='')
_request_id: ContextVar[str] = ContextVar('request_id', default='')


@dataclass
class LogEntry:
    """Structured log entry."""
    timestamp: str
    level: str
    message: str
    logger: str
    correlation_id: str = ""
    session_id: str = ""
    request_id: str = ""
    extra: Dict[str, Any] = None
    exception: Optional[str] = None
    source_file: str = ""
    source_line: int = 0
    thread_id: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        result = {
            "timestamp": self.timestamp,
            "level": self.level,
            "message": self.message,
            "logger": self.logger,
            "correlation_id": self.correlation_id,
            "session_id": self.session_id,
            "request_id": self.request_id,
            "source": f"{self.source_file}:{self.source_line}",
            "thread_id": self.thread_id
        }
        if self.extra:
            result["extra"] = self.extra
        if self.exception:
            result["exception"] = self.exception
        return result
    
    def to_json(self) -> str:
        """Convert to JSON string."""
        return json.dumps(self.to_dict(), default=str)


class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging."""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        entry = LogEntry(
            timestamp=datetime.fromtimestamp(record.created).isoformat(),
            level=record.levelname,
            message=record.getMessage(),
            logger=record.name,
            correlation_id=getattr(record, 'correlation_id', '') or _correlation_id.get(),
            session_id=getattr(record, 'session_id', '') or _session_id.get(),
            request_id=getattr(record, 'request_id', '') or _request_id.get(),
            extra=getattr(record, 'extra', None),
            exception=self.formatException(record.exc_info) if record.exc_info else None,
            source_file=record.pathname,
            source_line=record.lineno,
            thread_id=record.thread
        )
        return entry.to_json()


class PrettyFormatter(logging.Formatter):
    """Pretty console formatter with colors."""
    
    COLORS = {
        'DEBUG': '\033[36m',      # Cyan
        'INFO': '\033[32m',       # Green
        'WARNING': '\033[33m',    # Yellow
        'ERROR': '\033[31m',      # Red
        'CRITICAL': '\033[35m',   # Magenta
        'RESET': '\033[0m'
    }
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record for console."""
        color = self.COLORS.get(record.levelname, self.COLORS['RESET'])
        reset = self.COLORS['RESET']
        
        timestamp = datetime.fromtimestamp(record.created).strftime('%H:%M:%S.%f')[:-3]
        
        # Build message
        parts = [
            f"{color}[{timestamp}]{reset}",
            f"{color}[{record.levelname:8}]{reset}",
            f"[{record.name}]"
        ]
        
        # Add correlation info if present
        corr_id = getattr(record, 'correlation_id', '') or _correlation_id.get()
        if corr_id:
            parts.append(f"[corr:{corr_id[:8]}]")
        
        parts.append(record.getMessage())
        
        # Add exception if present
        if record.exc_info:
            parts.append(f"\n{self.formatException(record.exc_info)}")
        
        return ' '.join(parts)


class AsyncLogHandler(logging.Handler):
    """Asynchronous log handler with background processing."""
    
    def __init__(self, max_queue_size: int = 10000):
        super().__init__()
        self._queue: queue.Queue = queue.Queue(maxsize=max_queue_size)
        self._worker_thread: Optional[asyncio.Task] = None
        self._handlers: List[logging.Handler] = []
        self._running = False
    
    def add_handler(self, handler: logging.Handler):
        """Add a handler to process logs."""
        self._handlers.append(handler)
    
    def emit(self, record: logging.LogRecord):
        """Queue log record for async processing."""
        try:
            self._queue.put_nowait(record)
        except queue.Full:
            # Drop oldest log if queue is full
            try:
                self._queue.get_nowait()
                self._queue.put_nowait(record)
            except queue.Empty:
                pass
    
    async def start(self):
        """Start the async processing loop."""
        self._running = True
        while self._running:
            try:
                record = self._queue.get(timeout=0.1)
                for handler in self._handlers:
                    try:
                        handler.emit(record)
                    except Exception:
                        pass
            except queue.Empty:
                await asyncio.sleep(0.01)
    
    def stop(self):
        """Stop the async processing loop."""
        self._running = False
        # Process remaining logs
        while not self._queue.empty():
            try:
                record = self._queue.get_nowait()
                for handler in self._handlers:
                    try:
                        handler.emit(record)
                    except Exception:
                        pass
            except queue.Empty:
                break


class ChimeraLogger:
    """
    Advanced structured logging system for Quantum Chimera LLM.
    
    Features:
    - Multiple output formats (JSON, pretty console)
    - Log rotation with configurable policies
    - Async logging for performance
    - Contextual logging with correlation IDs
    """
    
    def __init__(
        self,
        name: str = "chimera",
        log_dir: str = "./logs",
        console_level: int = logging.INFO,
        file_level: int = logging.DEBUG,
        max_bytes: int = 100 * 1024 * 1024,  # 100MB
        backup_count: int = 10,
        use_json_format: bool = True,
        enable_async: bool = True
    ):
        self.name = name
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        # Create logger
        self._logger = logging.getLogger(name)
        self._logger.setLevel(logging.DEBUG)
        self._logger.handlers = []  # Clear existing handlers
        
        # Console handler (pretty format)
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(console_level)
        console_handler.setFormatter(PrettyFormatter())
        self._logger.addHandler(console_handler)
        
        # File handler (JSON format with rotation)
        log_file = self.log_dir / f"{name}.log"
        file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=max_bytes,
            backupCount=backup_count
        )
        file_handler.setLevel(file_level)
        file_handler.setFormatter(JSONFormatter() if use_json_format else PrettyFormatter())
        self._logger.addHandler(file_handler)
        
        # Error file handler (separate file for errors)
        error_log_file = self.log_dir / f"{name}_errors.log"
        error_handler = logging.handlers.RotatingFileHandler(
            error_log_file,
            maxBytes=max_bytes // 2,
            backupCount=backup_count
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(JSONFormatter() if use_json_format else PrettyFormatter())
        self._logger.addHandler(error_handler)
        
        # Async handler (optional)
        self._async_handler: Optional[AsyncLogHandler] = None
        if enable_async:
            self._async_handler = AsyncLogHandler()
            self._async_handler.add_handler(file_handler)
            self._async_handler.add_handler(error_handler)
            self._logger.removeHandler(file_handler)
            self._logger.removeHandler(error_handler)
            self._logger.addHandler(self._async_handler)
        
        self._initialized = True
        self.info("Logger initialized", extra={
            "log_dir": str(log_dir),
            "console_level": logging.getLevelName(console_level),
            "file_level": logging.getLevelName(file_level)
        })
    
    def _log(
        self,
        level: int,
        message: str,
        extra: Optional[Dict[str, Any]] = None,
        exc_info: Optional[tuple] = None
    ):
        """Internal logging method."""
        extra_dict = extra or {}
        extra_dict['correlation_id'] = _correlation_id.get()
        extra_dict['session_id'] = _session_id.get()
        extra_dict['request_id'] = _request_id.get()
        
        self._logger.log(level, message, extra=extra_dict, exc_info=exc_info)
    
    def debug(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """Log debug message."""
        self._log(logging.DEBUG, message, extra)
    
    def info(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """Log info message."""
        self._log(logging.INFO, message, extra)
    
    def warning(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """Log warning message."""
        self._log(logging.WARNING, message, extra)
    
    def error(self, message: str, extra: Optional[Dict[str, Any]] = None, exc_info: bool = True):
        """Log error message."""
        self._log(logging.ERROR, message, extra, sys.exc_info() if exc_info else None)
    
    def critical(self, message: str, extra: Optional[Dict[str, Any]] = None, exc_info: bool = True):
        """Log critical message."""
        self._log(logging.CRITICAL, message, extra, sys.exc_info() if exc_info else None)
    
    def exception(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """Log exception with traceback."""
        self._log(logging.ERROR, message, extra, sys.exc_info())
    
    async def start_async(self):
        """Start async logging."""
        if self._async_handler:
            await self._async_handler.start()
    
    def stop_async(self):
        """Stop async logging."""
        if self._async_handler:
            self._async_handler.stop()
    
    def get_logger(self) -> logging.Logger:
        """Get underlying logger."""
        return self._logger


# Context management functions
def set_correlation_id(correlation_id: str):
    """Set correlation ID for current context."""
    _correlation_id.set(correlation_id)


def set_session_id(session_id: str):
    """Set session ID for current context."""
    _session_id.set(session_id)


def set_request_id(request_id: str):
    """Set request ID for current context."""
    _request_id.set(request_id)


def get_correlation_id() -> str:
    """Get current correlation ID."""
    return _correlation_id.get()


def get_session_id() -> str:
    """Get current session ID."""
    return _session_id.get()


def get_request_id() -> str:
    """Get current request ID."""
    return _request_id.get()


def clear_context():
    """Clear all context variables."""
    _correlation_id.set('')
    _session_id.set('')
    _request_id.set('')


# Global logger instance
_logger: Optional[ChimeraLogger] = None


def get_logger(
    name: str = "chimera",
    log_dir: str = "./logs",
    **kwargs
) -> ChimeraLogger:
    """Get or create global logger instance."""
    global _logger
    if _logger is None:
        _logger = ChimeraLogger(name=name, log_dir=log_dir, **kwargs)
    return _logger


def configure_logging(
    console_level: int = logging.INFO,
    file_level: int = logging.DEBUG,
    **kwargs
):
    """Configure global logging settings."""
    global _logger
    _logger = ChimeraLogger(
        console_level=console_level,
        file_level=file_level,
        **kwargs
    )
    return _logger
