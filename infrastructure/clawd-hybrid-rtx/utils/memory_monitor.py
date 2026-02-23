"""
Memory Monitor for Clawd Hybrid RTX
Monitors GPU/CPU memory and triggers automatic fallback strategies.
"""

import os
import logging
from typing import Dict, Any, Optional, Callable
from dataclasses import dataclass
import threading
import time

logger = logging.getLogger(__name__)

# Try to import nvidia-ml-py for GPU monitoring
try:
    import pynvml
    PYNVML_AVAILABLE = True
except ImportError:
    PYNVML_AVAILABLE = False
    logger.warning("pynvml not available, GPU monitoring disabled")

# Try to import psutil for CPU memory monitoring
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False
    logger.warning("psutil not available, CPU memory monitoring disabled")


@dataclass
class MemoryStats:
    """Memory statistics snapshot."""
    gpu_total_mb: float = 0.0
    gpu_used_mb: float = 0.0
    gpu_free_mb: float = 0.0
    gpu_utilization: float = 0.0
    cpu_total_mb: float = 0.0
    cpu_used_mb: float = 0.0
    cpu_available_mb: float = 0.0
    cpu_percent: float = 0.0
    timestamp: float = 0.0
    
    @property
    def gpu_percent(self) -> float:
        """GPU memory usage percentage."""
        if self.gpu_total_mb > 0:
            return (self.gpu_used_mb / self.gpu_total_mb) * 100
        return 0.0


class MemoryMonitor:
    """
    Monitors system memory (GPU and CPU) and triggers callbacks on thresholds.
    
    Designed for RTX 2060 6GB VRAM constraint:
    - Hard limit: 1GB VRAM for embeddings
    - Soft limit: 2GB total local processing
    - Automatic fallback to CPU when GPU is busy
    """
    
    DEFAULT_THRESHOLDS = {
        "gpu_critical_mb": 5120,   # 5GB (leave 1GB headroom on 6GB card)
        "gpu_warning_mb": 4096,    # 4GB
        "gpu_embed_max_mb": 1024,  # 1GB for embeddings
        "cpu_critical_percent": 90,
        "cpu_warning_percent": 80,
    }
    
    def __init__(
        self, 
        thresholds: Optional[Dict[str, float]] = None,
        check_interval_seconds: float = 5.0
    ):
        """
        Initialize memory monitor.
        
        Args:
            thresholds: Memory thresholds for warnings
            check_interval_seconds: How often to check memory
        """
        self.thresholds = {**self.DEFAULT_THRESHOLDS, **(thresholds or {})}
        self.check_interval = check_interval_seconds
        
        self._callbacks: Dict[str, list] = {
            "gpu_critical": [],
            "gpu_warning": [],
            "cpu_critical": [],
            "cpu_warning": [],
        }
        
        self._nvml_handle = None
        self._device_count = 0
        self._monitoring = False
        self._monitor_thread: Optional[threading.Thread] = None
        
        self._current_stats = MemoryStats()
        self._stats_history: list = []
        self._max_history = 100
        
        self._init_nvml()
    
    def _init_nvml(self) -> None:
        """Initialize NVIDIA Management Library."""
        if not PYNVML_AVAILABLE:
            return
        
        try:
            pynvml.nvmlInit()
            self._device_count = pynvml.nvmlDeviceGetCount()
            if self._device_count > 0:
                self._nvml_handle = pynvml.nvmlDeviceGetHandleByIndex(0)
                logger.info(f"NVML initialized, found {self._device_count} GPU(s)")
        except Exception as e:
            logger.error(f"Failed to initialize NVML: {e}")
            self._nvml_handle = None
    
    def register_callback(
        self, 
        event: str, 
        callback: Callable[[MemoryStats], None]
    ) -> None:
        """
        Register a callback for memory events.
        
        Args:
            event: One of 'gpu_critical', 'gpu_warning', 'cpu_critical', 'cpu_warning'
            callback: Function to call when event triggers
        """
        if event in self._callbacks:
            self._callbacks[event].append(callback)
            logger.debug(f"Registered callback for {event}")
    
    def unregister_callback(
        self, 
        event: str, 
        callback: Callable[[MemoryStats], None]
    ) -> bool:
        """Unregister a callback."""
        if event in self._callbacks and callback in self._callbacks[event]:
            self._callbacks[event].remove(callback)
            return True
        return False
    
    def start_monitoring(self) -> None:
        """Start background memory monitoring."""
        if self._monitoring:
            return
        
        self._monitoring = True
        self._monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self._monitor_thread.start()
        logger.info("Memory monitoring started")
    
    def stop_monitoring(self) -> None:
        """Stop background memory monitoring."""
        self._monitoring = False
        if self._monitor_thread:
            self._monitor_thread.join(timeout=2.0)
        logger.info("Memory monitoring stopped")
    
    def _monitor_loop(self) -> None:
        """Background monitoring loop."""
        while self._monitoring:
            try:
                stats = self.get_stats()
                self._check_thresholds(stats)
                
                # Store history
                self._stats_history.append(stats)
                if len(self._stats_history) > self._max_history:
                    self._stats_history.pop(0)
                
                time.sleep(self.check_interval)
            except Exception as e:
                logger.error(f"Error in monitor loop: {e}")
                time.sleep(self.check_interval)
    
    def _check_thresholds(self, stats: MemoryStats) -> None:
        """Check memory against thresholds and trigger callbacks."""
        # GPU Critical
        if stats.gpu_used_mb > self.thresholds["gpu_critical_mb"]:
            for callback in self._callbacks["gpu_critical"]:
                try:
                    callback(stats)
                except Exception as e:
                    logger.error(f"Callback error: {e}")
        
        # GPU Warning
        elif stats.gpu_used_mb > self.thresholds["gpu_warning_mb"]:
            for callback in self._callbacks["gpu_warning"]:
                try:
                    callback(stats)
                except Exception as e:
                    logger.error(f"Callback error: {e}")
        
        # CPU Critical
        if stats.cpu_percent > self.thresholds["cpu_critical_percent"]:
            for callback in self._callbacks["cpu_critical"]:
                try:
                    callback(stats)
                except Exception as e:
                    logger.error(f"Callback error: {e}")
        
        # CPU Warning
        elif stats.cpu_percent > self.thresholds["cpu_warning_percent"]:
            for callback in self._callbacks["cpu_warning"]:
                try:
                    callback(stats)
                except Exception as e:
                    logger.error(f"Callback error: {e}")
    
    def get_stats(self) -> MemoryStats:
        """Get current memory statistics."""
        stats = MemoryStats(timestamp=time.time())
        
        # GPU Stats
        if PYNVML_AVAILABLE and self._nvml_handle:
            try:
                info = pynvml.nvmlDeviceGetMemoryInfo(self._nvml_handle)
                stats.gpu_total_mb = info.total / (1024 * 1024)
                stats.gpu_used_mb = info.used / (1024 * 1024)
                stats.gpu_free_mb = info.free / (1024 * 1024)
                
                # Try to get utilization
                try:
                    util = pynvml.nvmlDeviceGetUtilizationRates(self._nvml_handle)
                    stats.gpu_utilization = util.gpu
                except:
                    pass
            except Exception as e:
                logger.error(f"Error getting GPU stats: {e}")
        
        # CPU Stats
        if PSUTIL_AVAILABLE:
            try:
                mem = psutil.virtual_memory()
                stats.cpu_total_mb = mem.total / (1024 * 1024)
                stats.cpu_used_mb = mem.used / (1024 * 1024)
                stats.cpu_available_mb = mem.available / (1024 * 1024)
                stats.cpu_percent = mem.percent
            except Exception as e:
                logger.error(f"Error getting CPU stats: {e}")
        
        self._current_stats = stats
        return stats
    
    def is_gpu_available_for_embeddings(self) -> bool:
        """
        Check if GPU has enough free memory for embeddings.
        
        Returns:
            True if GPU can handle embedding workload
        """
        stats = self.get_stats()
        
        # Need at least embedding max + some buffer
        required_mb = self.thresholds["gpu_embed_max_mb"] + 256  # 256MB buffer
        
        return stats.gpu_free_mb >= required_mb
    
    def recommend_device(self) -> str:
        """
        Recommend device (cuda/cpu) based on current memory.
        
        Returns:
            'cuda' if GPU is available, 'cpu' otherwise
        """
        if self.is_gpu_available_for_embeddings():
            return "cuda"
        return "cpu"
    
    def get_history(self, seconds: Optional[float] = None) -> list:
        """
        Get historical memory statistics.
        
        Args:
            seconds: If provided, only return stats from last N seconds
        
        Returns:
            List of MemoryStats objects
        """
        if seconds is None:
            return self._stats_history.copy()
        
        cutoff = time.time() - seconds
        return [s for s in self._stats_history if s.timestamp >= cutoff]
    
    def get_summary(self) -> Dict[str, Any]:
        """Get a summary of memory status."""
        stats = self.get_stats()
        
        return {
            "gpu": {
                "total_mb": round(stats.gpu_total_mb, 1),
                "used_mb": round(stats.gpu_used_mb, 1),
                "free_mb": round(stats.gpu_free_mb, 1),
                "utilization": round(stats.gpu_utilization, 1),
                "percent": round(stats.gpu_percent, 1),
                "available_for_embeddings": self.is_gpu_available_for_embeddings(),
            },
            "cpu": {
                "total_mb": round(stats.cpu_total_mb, 1),
                "used_mb": round(stats.cpu_used_mb, 1),
                "available_mb": round(stats.cpu_available_mb, 1),
                "percent": round(stats.cpu_percent, 1),
            },
            "recommendation": self.recommend_device(),
        }
    
    def __enter__(self):
        """Context manager entry."""
        self.start_monitoring()
        return self
    
    def __exit__(self, *args):
        """Context manager exit."""
        self.stop_monitoring()
    
    def shutdown(self) -> None:
        """Clean up resources."""
        self.stop_monitoring()
        
        if PYNVML_AVAILABLE:
            try:
                pynvml.nvmlShutdown()
            except:
                pass


# Convenience function
def create_monitor(
    thresholds: Optional[Dict[str, float]] = None,
    check_interval_seconds: float = 5.0
) -> MemoryMonitor:
    """Factory function to create a memory monitor."""
    return MemoryMonitor(thresholds, check_interval_seconds)


# Standalone CLI for testing
if __name__ == "__main__":
    import json
    
    logging.basicConfig(level=logging.INFO)
    
    print("Clawd Memory Monitor - Press Ctrl+C to exit\n")
    
    monitor = create_monitor(check_interval_seconds=2.0)
    
    # Example callbacks
    def on_gpu_critical(stats):
        print(f"⚠️  GPU CRITICAL: {stats.gpu_used_mb:.0f}MB used!")
    
    def on_gpu_warning(stats):
        print(f"⚡ GPU Warning: {stats.gpu_used_mb:.0f}MB used")
    
    monitor.register_callback("gpu_critical", on_gpu_critical)
    monitor.register_callback("gpu_warning", on_gpu_warning)
    
    try:
        monitor.start_monitoring()
        
        while True:
            time.sleep(5)
            summary = monitor.get_summary()
            print(json.dumps(summary, indent=2))
            print("-" * 40)
    
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        monitor.shutdown()
