#!/usr/bin/env python3
"""
Clawd Hybrid RTX - Performance Monitor
Tracks GPU memory, cache hit rates, API usage, and performance metrics
Optimized for RTX 2060 (6GB VRAM)
"""

import os
import sys
import time
import json
import asyncio
import logging
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Callable
from collections import deque
import threading
import queue

# Third-party imports
try:
    import pynvml
    NVML_AVAILABLE = True
except ImportError:
    NVML_AVAILABLE = False
    print("Warning: pynvml not available. GPU monitoring disabled.")

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

import yaml
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# =============================================================================
# Configuration
# =============================================================================

@dataclass
class MonitorConfig:
    """Configuration for the performance monitor"""
    # GPU Settings (RTX 2060 optimized)
    gpu_id: int = 0
    vram_warning_threshold: float = 0.85  # 85% of 6GB
    vram_critical_threshold: float = 0.95  # 95% of 6GB
    
    # Monitoring intervals
    gpu_poll_interval: float = 1.0  # seconds
    system_poll_interval: float = 5.0  # seconds
    api_poll_interval: float = 60.0  # seconds
    
    # Cache settings
    cache_stats_window: int = 1000  # number of requests to track
    
    # Metrics retention
    metrics_retention_hours: int = 24
    
    # Alerting
    enable_alerts: bool = True
    alert_webhook: Optional[str] = None
    
    # Cost tracking
    track_api_costs: bool = True
    cost_per_1k_tokens: Dict[str, float] = None
    
    def __post_init__(self):
        if self.cost_per_1k_tokens is None:
            self.cost_per_1k_tokens = {
                "openai_gpt4": 0.03,
                "openai_gpt4_turbo": 0.01,
                "openai_gpt3_5": 0.0015,
                "anthropic_claude3_opus": 0.015,
                "anthropic_claude3_sonnet": 0.003,
                "local_rtx2060": 0.0,  # Free (electricity cost negligible)
            }


# =============================================================================
# GPU Monitor
# =============================================================================

class GPUMonitor:
    """Monitors NVIDIA GPU statistics using NVML"""
    
    def __init__(self, gpu_id: int = 0):
        self.gpu_id = gpu_id
        self.handle = None
        self.initialized = False
        self.metrics_history: deque = deque(maxlen=3600)  # 1 hour at 1s interval
        
        if NVML_AVAILABLE:
            self._init_nvml()
    
    def _init_nvml(self):
        """Initialize NVML library"""
        try:
            pynvml.nvmlInit()
            device_count = pynvml.nvmlDeviceGetCount()
            
            if self.gpu_id >= device_count:
                logging.error(f"GPU {self.gpu_id} not found. Found {device_count} GPUs.")
                return
            
            self.handle = pynvml.nvmlDeviceGetHandleByIndex(self.gpu_id)
            self.initialized = True
            
            name = pynvml.nvmlDeviceGetName(self.handle)
            logging.info(f"GPU Monitor initialized: {name} (ID: {self.gpu_id})")
            
        except pynvml.NVMLError as e:
            logging.error(f"Failed to initialize NVML: {e}")
    
    def get_gpu_info(self) -> Dict:
        """Get static GPU information"""
        if not self.initialized:
            return {"error": "NVML not initialized"}
        
        try:
            name = pynvml.nvmlDeviceGetName(self.handle)
            memory = pynvml.nvmlDeviceGetMemoryInfo(self.handle)
            
            return {
                "name": name,
                "total_memory_mb": memory.total // (1024 * 1024),
                "gpu_id": self.gpu_id,
            }
        except pynvml.NVMLError as e:
            return {"error": str(e)}
    
    def get_metrics(self) -> Dict:
        """Get current GPU metrics"""
        if not self.initialized:
            return {"available": False}
        
        try:
            # Memory
            memory = pynvml.nvmlDeviceGetMemoryInfo(self.handle)
            memory_used_mb = memory.used // (1024 * 1024)
            memory_total_mb = memory.total // (1024 * 1024)
            memory_free_mb = memory.free // (1024 * 1024)
            memory_util = memory.used / memory.total if memory.total > 0 else 0
            
            # Utilization
            utilization = pynvml.nvmlDeviceGetUtilizationRates(self.handle)
            
            # Temperature
            temperature = pynvml.nvmlDeviceGetTemperature(
                self.handle, pynvml.NVML_TEMPERATURE_GPU
            )
            
            # Power
            try:
                power_draw = pynvml.nvmlDeviceGetPowerUsage(self.handle) / 1000.0  # Convert to watts
                power_limit = pynvml.nvmlDeviceGetEnforcedPowerLimit(self.handle) / 1000.0
            except pynvml.NVMLError:
                power_draw = 0
                power_limit = 0
            
            # Clock speeds
            try:
                clock_graphics = pynvml.nvmlDeviceGetClockInfo(
                    self.handle, pynvml.NVML_CLOCK_GRAPHICS
                )
                clock_sm = pynvml.nvmlDeviceGetClockInfo(
                    self.handle, pynvml.NVML_CLOCK_SM
                )
                clock_mem = pynvml.nvmlDeviceGetClockInfo(
                    self.handle, pynvml.NVML_CLOCK_MEM
                )
            except pynvml.NVMLError:
                clock_graphics = clock_sm = clock_mem = 0
            
            # Fan speed
            try:
                fan_speed = pynvml.nvmlDeviceGetFanSpeed(self.handle)
            except pynvml.NVMLError:
                fan_speed = 0
            
            metrics = {
                "timestamp": datetime.now().isoformat(),
                "available": True,
                "memory": {
                    "used_mb": memory_used_mb,
                    "total_mb": memory_total_mb,
                    "free_mb": memory_free_mb,
                    "utilization_percent": round(memory_util * 100, 2),
                },
                "utilization": {
                    "gpu_percent": utilization.gpu,
                    "memory_percent": utilization.memory,
                },
                "temperature_c": temperature,
                "power": {
                    "draw_w": round(power_draw, 2),
                    "limit_w": round(power_limit, 2),
                },
                "clocks": {
                    "graphics_mhz": clock_graphics,
                    "sm_mhz": clock_sm,
                    "memory_mhz": clock_mem,
                },
                "fan_speed_percent": fan_speed,
            }
            
            # Store in history
            self.metrics_history.append(metrics)
            
            return metrics
            
        except pynvml.NVMLError as e:
            logging.error(f"NVML error: {e}")
            return {"available": False, "error": str(e)}
    
    def get_memory_trend(self, window_seconds: int = 60) -> Dict:
        """Get memory usage trend over time window"""
        if len(self.metrics_history) < 2:
            return {"trend": "unknown", "samples": 0}
        
        cutoff_time = datetime.now() - timedelta(seconds=window_seconds)
        recent_metrics = [
            m for m in self.metrics_history
            if datetime.fromisoformat(m["timestamp"]) > cutoff_time
        ]
        
        if len(recent_metrics) < 2:
            return {"trend": "insufficient_data", "samples": len(recent_metrics)}
        
        memory_values = [m["memory"]["used_mb"] for m in recent_metrics]
        avg_memory = sum(memory_values) / len(memory_values)
        max_memory = max(memory_values)
        min_memory = min(memory_values)
        
        # Determine trend
        first_half = memory_values[:len(memory_values)//2]
        second_half = memory_values[len(memory_values)//2:]
        first_avg = sum(first_half) / len(first_half) if first_half else 0
        second_avg = sum(second_half) / len(second_half) if second_half else 0
        
        diff = second_avg - first_avg
        if diff > 50:  # MB increasing
            trend = "increasing"
        elif diff < -50:  # MB decreasing
            trend = "decreasing"
        else:
            trend = "stable"
        
        return {
            "trend": trend,
            "change_mb": round(diff, 2),
            "average_mb": round(avg_memory, 2),
            "max_mb": max_memory,
            "min_mb": min_memory,
            "samples": len(recent_metrics),
        }
    
    def shutdown(self):
        """Clean up NVML"""
        if self.initialized and NVML_AVAILABLE:
            try:
                pynvml.nvmlShutdown()
                logging.info("GPU Monitor shutdown complete")
            except pynvml.NVMLError as e:
                logging.error(f"Error shutting down NVML: {e}")


# =============================================================================
# Cache Monitor
# =============================================================================

class CacheMonitor:
    """Tracks cache hit rates and performance"""
    
    def __init__(self, max_history: int = 1000):
        self.max_history = max_history
        self.requests: deque = deque(maxlen=max_history)
        self.hits: deque = deque(maxlen=max_history)
        self.total_requests = 0
        self.total_hits = 0
        self.lock = threading.Lock()
    
    def record_request(self, cache_key: str, hit: bool, response_time_ms: float = 0):
        """Record a cache request"""
        with self.lock:
            self.total_requests += 1
            if hit:
                self.total_hits += 1
            
            entry = {
                "timestamp": datetime.now().isoformat(),
                "key": cache_key,
                "hit": hit,
                "response_time_ms": response_time_ms,
            }
            self.requests.append(entry)
            self.hits.append(hit)
    
    def get_stats(self, window_size: Optional[int] = None) -> Dict:
        """Get cache statistics"""
        with self.lock:
            if window_size is None:
                window_size = len(self.hits)
            
            window_size = min(window_size, len(self.hits))
            
            if window_size == 0:
                return {
                    "hit_rate": 0.0,
                    "total_requests": self.total_requests,
                    "total_hits": self.total_hits,
                    "window_requests": 0,
                    "window_hits": 0,
                }
            
            recent_hits = list(self.hits)[-window_size:]
            window_hits = sum(recent_hits)
            hit_rate = window_hits / window_size
            
            # Calculate recent response times
            recent_requests = list(self.requests)[-window_size:]
            response_times = [r["response_time_ms"] for r in recent_requests if r["response_time_ms"] > 0]
            
            avg_response_time = sum(response_times) / len(response_times) if response_times else 0
            
            return {
                "hit_rate": round(hit_rate * 100, 2),
                "hit_rate_formatted": f"{hit_rate * 100:.2f}%",
                "total_requests": self.total_requests,
                "total_hits": self.total_hits,
                "total_hit_rate": round((self.total_hits / self.total_requests * 100), 2) if self.total_requests > 0 else 0.0,
                "window_requests": window_size,
                "window_hits": window_hits,
                "avg_response_time_ms": round(avg_response_time, 2),
            }
    
    def reset_stats(self):
        """Reset all statistics"""
        with self.lock:
            self.requests.clear()
            self.hits.clear()
            self.total_requests = 0
            self.total_hits = 0


# =============================================================================
# API Cost Tracker
# =============================================================================

class APICostTracker:
    """Tracks API usage and costs across different providers"""
    
    def __init__(self, cost_config: Dict[str, float]):
        self.cost_config = cost_config
        self.usage: Dict[str, Dict] = {}
        self.daily_usage: Dict[str, Dict] = {}
        self.lock = threading.Lock()
    
    def record_usage(self, provider: str, model: str, input_tokens: int, output_tokens: int = 0):
        """Record API usage"""
        with self.lock:
            key = f"{provider}:{model}"
            total_tokens = input_tokens + output_tokens
            
            # Get cost per 1k tokens
            cost_per_1k = self.cost_config.get(key, 0.0)
            if cost_per_1k == 0:
                cost_per_1k = self.cost_config.get(model, 0.0)
            
            cost = (total_tokens / 1000) * cost_per_1k
            
            # Update usage
            if key not in self.usage:
                self.usage[key] = {
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "total_tokens": 0,
                    "total_cost": 0.0,
                    "requests": 0,
                }
            
            self.usage[key]["input_tokens"] += input_tokens
            self.usage[key]["output_tokens"] += output_tokens
            self.usage[key]["total_tokens"] += total_tokens
            self.usage[key]["total_cost"] += cost
            self.usage[key]["requests"] += 1
            
            # Update daily usage
            today = datetime.now().strftime("%Y-%m-%d")
            if today not in self.daily_usage:
                self.daily_usage[today] = {
                    "tokens": 0,
                    "cost": 0.0,
                    "requests": 0,
                }
            
            self.daily_usage[today]["tokens"] += total_tokens
            self.daily_usage[today]["cost"] += cost
            self.daily_usage[today]["requests"] += 1
            
            return cost
    
    def get_usage_stats(self) -> Dict:
        """Get comprehensive usage statistics"""
        with self.lock:
            total_cost = sum(u["total_cost"] for u in self.usage.values())
            total_tokens = sum(u["total_tokens"] for u in self.usage.values())
            total_requests = sum(u["requests"] for u in self.usage.values())
            
            return {
                "total_cost_usd": round(total_cost, 4),
                "total_tokens": total_tokens,
                "total_requests": total_requests,
                "providers": self.usage,
                "daily_summary": self.daily_usage,
            }
    
    def get_daily_cost(self, date: Optional[str] = None) -> float:
        """Get cost for a specific date (defaults to today)"""
        if date is None:
            date = datetime.now().strftime("%Y-%m-%d")
        
        with self.lock:
            return self.daily_usage.get(date, {}).get("cost", 0.0)
    
    def reset_daily_usage(self):
        """Reset daily usage counters"""
        with self.lock:
            self.daily_usage.clear()


# =============================================================================
# System Monitor
# =============================================================================

class SystemMonitor:
    """Monitor system resources (CPU, RAM, Disk)"""
    
    def __init__(self):
        self.initialized = PSUTIL_AVAILABLE
    
    def get_metrics(self) -> Dict:
        """Get current system metrics"""
        if not self.initialized:
            return {"available": False}
        
        # CPU
        cpu_percent = psutil.cpu_percent(interval=0.1)
        cpu_count = psutil.cpu_count()
        cpu_freq = psutil.cpu_freq()
        
        # Memory
        memory = psutil.virtual_memory()
        
        # Disk
        disk = psutil.disk_usage('/')
        
        # Network
        net_io = psutil.net_io_counters()
        
        return {
            "timestamp": datetime.now().isoformat(),
            "available": True,
            "cpu": {
                "percent": cpu_percent,
                "count": cpu_count,
                "freq_mhz": cpu_freq.current if cpu_freq else 0,
            },
            "memory": {
                "total_gb": round(memory.total / (1024**3), 2),
                "available_gb": round(memory.available / (1024**3), 2),
                "percent": memory.percent,
            },
            "disk": {
                "total_gb": round(disk.total / (1024**3), 2),
                "free_gb": round(disk.free / (1024**3), 2),
                "percent": disk.percent,
            },
            "network": {
                "bytes_sent": net_io.bytes_sent,
                "bytes_recv": net_io.bytes_recv,
            },
        }


# =============================================================================
# Performance Dashboard
# =============================================================================

class PerformanceDashboard:
    """Main dashboard coordinating all monitors"""
    
    def __init__(self, config: Optional[MonitorConfig] = None):
        self.config = config or MonitorConfig()
        
        # Initialize monitors
        self.gpu_monitor = GPUMonitor(self.config.gpu_id)
        self.cache_monitor = CacheMonitor(self.config.cache_stats_window)
        self.cost_tracker = APICostTracker(self.config.cost_per_1k_tokens)
        self.system_monitor = SystemMonitor()
        
        # Threading
        self.running = False
        self.threads: List[threading.Thread] = []
        self.alert_callbacks: List[Callable] = []
        
        # Setup logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
    
    def register_alert_callback(self, callback: Callable):
        """Register a callback for alerts"""
        self.alert_callbacks.append(callback)
    
    def _alert(self, level: str, message: str, data: Optional[Dict] = None):
        """Send alert through all registered callbacks"""
        alert = {
            "timestamp": datetime.now().isoformat(),
            "level": level,
            "message": message,
            "data": data or {},
        }
        
        for callback in self.alert_callbacks:
            try:
                callback(alert)
            except Exception as e:
                self.logger.error(f"Alert callback error: {e}")
    
    def _gpu_monitoring_loop(self):
        """Background thread for GPU monitoring"""
        while self.running:
            try:
                metrics = self.gpu_monitor.get_metrics()
                
                # Check thresholds
                if metrics.get("available"):
                    memory_util = metrics["memory"]["utilization_percent"] / 100
                    
                    if memory_util > self.config.vram_critical_threshold:
                        self._alert(
                            "CRITICAL",
                            f"GPU memory at {memory_util*100:.1f}% - Critical threshold exceeded!",
                            metrics
                        )
                    elif memory_util > self.config.vram_warning_threshold:
                        self._alert(
                            "WARNING",
                            f"GPU memory at {memory_util*100:.1f}% - Approaching limit",
                            metrics
                        )
                    
                    # Temperature alert
                    if metrics["temperature_c"] > 85:
                        self._alert(
                            "WARNING",
                            f"GPU temperature high: {metrics['temperature_c']}°C",
                            metrics
                        )
                
                time.sleep(self.config.gpu_poll_interval)
                
            except Exception as e:
                self.logger.error(f"GPU monitoring error: {e}")
                time.sleep(5)
    
    def _system_monitoring_loop(self):
        """Background thread for system monitoring"""
        while self.running:
            try:
                metrics = self.system_monitor.get_metrics()
                time.sleep(self.config.system_poll_interval)
            except Exception as e:
                self.logger.error(f"System monitoring error: {e}")
                time.sleep(5)
    
    def start(self):
        """Start all monitoring threads"""
        self.running = True
        
        # GPU monitoring thread
        gpu_thread = threading.Thread(target=self._gpu_monitoring_loop, daemon=True)
        gpu_thread.start()
        self.threads.append(gpu_thread)
        
        # System monitoring thread
        sys_thread = threading.Thread(target=self._system_monitoring_loop, daemon=True)
        sys_thread.start()
        self.threads.append(sys_thread)
        
        self.logger.info("Performance Dashboard started")
    
    def stop(self):
        """Stop all monitoring threads"""
        self.running = False
        
        for thread in self.threads:
            thread.join(timeout=5)
        
        self.gpu_monitor.shutdown()
        self.logger.info("Performance Dashboard stopped")
    
    def get_full_report(self) -> Dict:
        """Get comprehensive performance report"""
        return {
            "timestamp": datetime.now().isoformat(),
            "gpu": self.gpu_monitor.get_metrics(),
            "gpu_trend": self.gpu_monitor.get_memory_trend(),
            "system": self.system_monitor.get_metrics(),
            "cache": self.cache_monitor.get_stats(),
            "api_costs": self.cost_tracker.get_usage_stats(),
            "config": asdict(self.config),
        }
    
    def print_report(self):
        """Print formatted report to console"""
        report = self.get_full_report()
        
        print("\n" + "="*60)
        print(" CLAWD HYBRID RTX 2060 - PERFORMANCE REPORT")
        print("="*60)
        
        # GPU Status
        gpu = report["gpu"]
        print(f"\n📊 GPU Status")
        print(f"   Device: {gpu.get('name', 'N/A')}")
        if gpu.get("available"):
            mem = gpu["memory"]
            print(f"   Memory: {mem['used_mb']}/{mem['total_mb']} MB ({mem['utilization_percent']}%)")
            print(f"   Utilization: {gpu['utilization']['gpu_percent']}% GPU, {gpu['utilization']['memory_percent']}% Memory")
            print(f"   Temperature: {gpu['temperature_c']}°C")
            print(f"   Power: {gpu['power']['draw_w']}W / {gpu['power']['limit_w']}W")
            
            trend = report["gpu_trend"]
            print(f"   Trend: {trend['trend']} (Δ{trend['change_mb']:+.1f} MB)")
        else:
            print("   GPU monitoring not available")
        
        # Cache Stats
        cache = report["cache"]
        print(f"\n💾 Cache Statistics")
        print(f"   Hit Rate: {cache['hit_rate_formatted']}")
        print(f"   Total Requests: {cache['total_requests']}")
        print(f"   Avg Response Time: {cache['avg_response_time_ms']}ms")
        
        # API Costs
        costs = report["api_costs"]
        print(f"\n💰 API Costs (USD)")
        print(f"   Total Cost: ${costs['total_cost_usd']:.4f}")
        print(f"   Total Tokens: {costs['total_tokens']:,}")
        print(f"   Total Requests: {costs['total_requests']:,}")
        
        # System
        sys = report["system"]
        if sys.get("available"):
            print(f"\n🖥️  System")
            print(f"   CPU: {sys['cpu']['percent']}%")
            print(f"   Memory: {sys['memory']['percent']}% ({sys['memory']['available_gb']} GB free)")
            print(f"   Disk: {sys['disk']['percent']}% ({sys['disk']['free_gb']} GB free)")
        
        print("\n" + "="*60)


# =============================================================================
# CLI Interface
# =============================================================================

def main():
    """Main CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Clawd Hybrid RTX Performance Monitor")
    parser.add_argument("--config", "-c", help="Path to config file")
    parser.add_argument("--interval", "-i", type=float, default=5.0, help="Report interval in seconds")
    parser.add_argument("--once", "-o", action="store_true", help="Print report once and exit")
    parser.add_argument("--output", help="Output file for JSON reports")
    parser.add_argument("--web", action="store_true", help="Start web dashboard")
    parser.add_argument("--port", type=int, default=9090, help="Web dashboard port")
    
    args = parser.parse_args()
    
    # Load config
    config = MonitorConfig()
    if args.config and os.path.exists(args.config):
        with open(args.config, 'r') as f:
            config_dict = yaml.safe_load(f)
            if config_dict:
                for key, value in config_dict.items():
                    if hasattr(config, key):
                        setattr(config, key, value)
    
    # Initialize dashboard
    dashboard = PerformanceDashboard(config)
    
    if args.once:
        dashboard.print_report()
        return
    
    if args.web:
        # Start web server
        try:
            from fastapi import FastAPI
            import uvicorn
            
            app = FastAPI(title="Clawd RTX Monitor")
            
            @app.get("/health")
            def health():
                return {"status": "healthy", "gpu": dashboard.gpu_monitor.get_metrics().get("available", False)}
            
            @app.get("/metrics")
            def metrics():
                return dashboard.get_full_report()
            
            @app.get("/metrics/gpu")
            def gpu_metrics():
                return dashboard.gpu_monitor.get_metrics()
            
            @app.get("/metrics/cache")
            def cache_metrics():
                return dashboard.cache_monitor.get_stats()
            
            @app.get("/metrics/costs")
            def cost_metrics():
                return dashboard.cost_tracker.get_usage_stats()
            
            @app.post("/cache/record")
            def record_cache(key: str, hit: bool, response_time_ms: float = 0):
                dashboard.cache_monitor.record_request(key, hit, response_time_ms)
                return {"status": "recorded"}
            
            @app.post("/api/usage")
            def record_api_usage(provider: str, model: str, input_tokens: int, output_tokens: int = 0):
                cost = dashboard.cost_tracker.record_usage(provider, model, input_tokens, output_tokens)
                return {"cost_usd": cost}
            
            dashboard.start()
            print(f"Web dashboard running at http://localhost:{args.port}")
            uvicorn.run(app, host="0.0.0.0", port=args.port)
            
        except ImportError:
            print("Error: FastAPI/uvicorn not installed. Install with: pip install fastapi uvicorn")
            return
    
    else:
        # Console mode
        dashboard.start()
        
        try:
            while True:
                dashboard.print_report()
                
                if args.output:
                    report = dashboard.get_full_report()
                    with open(args.output, 'w') as f:
                        json.dump(report, f, indent=2, default=str)
                
                time.sleep(args.interval)
                
        except KeyboardInterrupt:
            print("\nShutting down...")
        finally:
            dashboard.stop()


if __name__ == "__main__":
    main()
