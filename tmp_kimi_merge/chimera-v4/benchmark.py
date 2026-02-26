"""
Quantum Chimera LLM v4.0 - Comprehensive Benchmark Suite
=======================================================
Performance testing and benchmarking for all Chimera components.

Usage:
    python benchmark.py --all
    python benchmark.py --router
    python benchmark.py --cache
    python benchmark.py --token-optimizer
"""

import asyncio
import time
import random
import statistics
import argparse
from typing import Dict, List, Any, Callable
from dataclasses import dataclass
import sys

# Add src to path
sys.path.insert(0, './src')

from src.config import ChimeraConfig
from src.adaptive_router import MultiArmedBanditRouter, ThompsonSamplingRouter
from src.token_optimizer import TokenOptimizer
from src.rate_limit_optimizer import RateLimitOptimizer
from src.predictive_cache import PredictiveCache
from src.semantic_cache import SemanticCache
from src.model_tracker import ModelTracker
from src.response_scorer import ResponseScorer


@dataclass
class BenchmarkResult:
    """Benchmark result."""
    name: str
    iterations: int
    total_time_ms: float
    avg_time_ms: float
    min_time_ms: float
    max_time_ms: float
    p95_time_ms: float
    p99_time_ms: float
    throughput_per_sec: float
    success_rate: float
    details: Dict[str, Any] = None
    
    def print(self):
        """Print benchmark result."""
        print(f"\n{'='*60}")
        print(f"Benchmark: {self.name}")
        print(f"{'='*60}")
        print(f"  Iterations:        {self.iterations}")
        print(f"  Total time:        {self.total_time_ms:.2f} ms")
        print(f"  Average time:      {self.avg_time_ms:.2f} ms")
        print(f"  Min time:          {self.min_time_ms:.2f} ms")
        print(f"  Max time:          {self.max_time_ms:.2f} ms")
        print(f"  P95 time:          {self.p95_time_ms:.2f} ms")
        print(f"  P99 time:          {self.p99_time_ms:.2f} ms")
        print(f"  Throughput:        {self.throughput_per_sec:.2f} ops/sec")
        print(f"  Success rate:      {self.success_rate*100:.1f}%")
        if self.details:
            print(f"  Details:           {self.details}")


class BenchmarkRunner:
    """Benchmark runner for Chimera components."""
    
    def __init__(self):
        self.results: List[BenchmarkResult] = []
    
    async def run_benchmark(
        self,
        name: str,
        func: Callable,
        iterations: int = 1000,
        warmup: int = 100
    ) -> BenchmarkResult:
        """Run a benchmark."""
        print(f"\nRunning benchmark: {name} ({iterations} iterations)")
        
        # Warmup
        for _ in range(warmup):
            try:
                await func()
            except:
                pass
        
        # Benchmark
        times = []
        successes = 0
        
        for i in range(iterations):
            start = time.perf_counter()
            try:
                await func()
                successes += 1
            except Exception as e:
                pass
            elapsed = (time.perf_counter() - start) * 1000
            times.append(elapsed)
        
        # Calculate statistics
        times_sorted = sorted(times)
        p95_idx = int(iterations * 0.95)
        p99_idx = int(iterations * 0.99)
        
        result = BenchmarkResult(
            name=name,
            iterations=iterations,
            total_time_ms=sum(times),
            avg_time_ms=statistics.mean(times),
            min_time_ms=min(times),
            max_time_ms=max(times),
            p95_time_ms=times_sorted[min(p95_idx, len(times)-1)],
            p99_time_ms=times_sorted[min(p99_idx, len(times)-1)],
            throughput_per_sec=iterations / (sum(times) / 1000),
            success_rate=successes / iterations
        )
        
        self.results.append(result)
        result.print()
        return result
    
    async def benchmark_router(self):
        """Benchmark adaptive router."""
        print("\n" + "="*60)
        print("ADAPTIVE ROUTER BENCHMARKS")
        print("="*60)
        
        # Multi-Armed Bandit
        mab = MultiArmedBanditRouter(exploration_factor=0.1)
        models = ["model_a", "model_b", "model_c", "model_d", "model_e"]
        
        # Initialize with some data
        for model in models:
            mab.update_model_performance(model, latency_ms=100, success=True)
        
        await self.run_benchmark(
            "MAB Router - Select Model",
            lambda: asyncio.sleep(0) or mab.select_model(models),
            iterations=10000
        )
        
        await self.run_benchmark(
            "MAB Router - Update Performance",
            lambda: asyncio.sleep(0) or mab.update_model_performance(
                random.choice(models),
                latency_ms=random.randint(50, 200),
                success=random.random() > 0.1
            ),
            iterations=10000
        )
        
        # Thompson Sampling
        ts = ThompsonSamplingRouter()
        for model in models:
            ts.update_model_performance(model, latency_ms=100, success=True)
        
        await self.run_benchmark(
            "Thompson Sampling - Select Model",
            lambda: asyncio.sleep(0) or ts.select_model(models),
            iterations=10000
        )
    
    async def benchmark_token_optimizer(self):
        """Benchmark token optimizer."""
        print("\n" + "="*60)
        print("TOKEN OPTIMIZER BENCHMARKS")
        print("="*60)
        
        optimizer = TokenOptimizer()
        
        # Test messages
        messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Explain quantum computing in simple terms."},
            {"role": "assistant", "content": "Quantum computing uses quantum bits or qubits..."},
        ]
        
        await self.run_benchmark(
            "Token Optimizer - Estimate Tokens",
            lambda: asyncio.sleep(0) or optimizer.estimate_tokens(messages),
            iterations=10000
        )
        
        await self.run_benchmark(
            "Token Optimizer - Compress Prompt",
            lambda: asyncio.sleep(0) or optimizer.compress_prompt(messages),
            iterations=1000
        )
    
    async def benchmark_rate_limiter(self):
        """Benchmark rate limit optimizer."""
        print("\n" + "="*60)
        print("RATE LIMIT OPTIMIZER BENCHMARKS")
        print("="*60)
        
        optimizer = RateLimitOptimizer()
        model_id = "test_model"
        
        # Initialize
        optimizer.update_rate_limit(model_id, requests_per_minute=60)
        
        await self.run_benchmark(
            "Rate Limiter - Can Make Request",
            lambda: asyncio.sleep(0) or optimizer.can_make_request(model_id),
            iterations=10000
        )
        
        await self.run_benchmark(
            "Rate Limiter - Record Request",
            lambda: asyncio.sleep(0) or optimizer.record_request(model_id),
            iterations=10000
        )
    
    async def benchmark_predictive_cache(self):
        """Benchmark predictive cache."""
        print("\n" + "="*60)
        print("PREDICTIVE CACHE BENCHMARKS")
        print("="*60)
        
        cache = PredictiveCache()
        
        # Warm up with patterns
        queries = [
            "What is Python?",
            "How to learn Python?",
            "Python vs JavaScript",
            "Best Python libraries",
        ]
        
        for i, q in enumerate(queries):
            cache.record_query(q, f"session_{i % 3}")
        
        await self.run_benchmark(
            "Predictive Cache - Record Query",
            lambda: asyncio.sleep(0) or cache.record_query(
                random.choice(queries),
                "session_1"
            ),
            iterations=10000
        )
        
        await self.run_benchmark(
            "Predictive Cache - Predict",
            lambda: asyncio.sleep(0) or cache.predict_next_queries(
                random.choice(queries),
                "session_1"
            ),
            iterations=10000
        )
    
    async def benchmark_semantic_cache(self):
        """Benchmark semantic cache."""
        print("\n" + "="*60)
        print("SEMANTIC CACHE BENCHMARKS")
        print("="*60)
        
        cache = SemanticCache(
            similarity_threshold=0.85,
            max_size=1000,
            lazy_embeddings=True
        )
        
        # Pre-populate cache
        for i in range(100):
            messages = [{"role": "user", "content": f"Query number {i} about topic {i % 10}"}]
            await cache.set(
                messages=messages,
                response=f"Response for query {i}",
                model_used="test_model"
            )
        
        test_messages = [{"role": "user", "content": "Query number 5 about topic 5"}]
        
        await self.run_benchmark(
            "Semantic Cache - Get (cached)",
            lambda: cache.get(test_messages),
            iterations=1000
        )
        
        new_messages = [{"role": "user", "content": "Completely different query"}]
        await self.run_benchmark(
            "Semantic Cache - Get (miss)",
            lambda: cache.get(new_messages),
            iterations=1000
        )
        
        await self.run_benchmark(
            "Semantic Cache - Set",
            lambda: cache.set(
                messages=[{"role": "user", "content": f"New query {random.randint(0, 1000)}"}],
                response="Test response"
            ),
            iterations=1000
        )
    
    async def benchmark_model_tracker(self):
        """Benchmark model tracker."""
        print("\n" + "="*60)
        print("MODEL TRACKER BENCHMARKS")
        print("="*60)
        
        tracker = ModelTracker()
        models = [f"model_{i}" for i in range(10)]
        
        await self.run_benchmark(
            "Model Tracker - Record Request",
            lambda: tracker.record_request(
                model_id=random.choice(models),
                latency_ms=random.randint(50, 500),
                success=random.random() > 0.1,
                input_tokens=100,
                output_tokens=50
            ),
            iterations=10000
        )
        
        await self.run_benchmark(
            "Model Tracker - Get Best Model",
            lambda: tracker.get_best_model(models),
            iterations=10000
        )
    
    async def benchmark_response_scorer(self):
        """Benchmark response scorer."""
        print("\n" + "="*60)
        print("RESPONSE SCORER BENCHMARKS")
        print("="*60)
        
        scorer = ResponseScorer()
        
        queries = [
            "What is machine learning?",
            "How does a neural network work?",
            "Explain backpropagation",
        ]
        
        responses = [
            "Machine learning is a subset of artificial intelligence...",
            "A neural network is inspired by biological neurons...",
            "Backpropagation is an algorithm for training neural networks...",
        ]
        
        await self.run_benchmark(
            "Response Scorer - Score Response",
            lambda: asyncio.sleep(0) or scorer.score_response(
                random.choice(queries),
                random.choice(responses)
            ),
            iterations=10000
        )
    
    async def benchmark_end_to_end(self):
        """Benchmark end-to-end routing pipeline."""
        print("\n" + "="*60)
        print("END-TO-END PIPELINE BENCHMARK")
        print("="*60)
        
        # Initialize all components
        config = ChimeraConfig()
        router = MultiArmedBanditRouter()
        token_optimizer = TokenOptimizer()
        rate_limiter = RateLimitOptimizer()
        semantic_cache = SemanticCache(max_size=500)
        model_tracker = ModelTracker()
        
        models = ["model_a", "model_b", "model_c"]
        
        # Initialize router
        for model in models:
            router.update_model_performance(model, 100, True)
            rate_limiter.update_rate_limit(model, 60)
        
        async def pipeline():
            """Simulate routing pipeline."""
            messages = [
                {"role": "user", "content": f"Test query {random.randint(0, 100)}"}
            ]
            
            # 1. Token optimization
            optimized = token_optimizer.optimize_prompt(messages)
            
            # 2. Check cache
            cached = await semantic_cache.get(optimized)
            
            # 3. Select model
            model = router.select_model(models)
            
            # 4. Check rate limit
            can_proceed = rate_limiter.can_make_request(model)
            
            # 5. Record metrics
            if can_proceed:
                rate_limiter.record_request(model)
                model_tracker.record_request(model, 100, True, 10, 20)
                router.update_model_performance(model, 100, True)
        
        await self.run_benchmark(
            "End-to-End Pipeline",
            pipeline,
            iterations=5000
        )
    
    def print_summary(self):
        """Print benchmark summary."""
        print("\n" + "="*60)
        print("BENCHMARK SUMMARY")
        print("="*60)
        
        for result in self.results:
            status = "✓" if result.success_rate > 0.95 else "✗"
            print(f"{status} {result.name:40s} {result.avg_time_ms:8.2f} ms/op  {result.throughput_per_sec:8.2f} ops/sec")


async def main():
    """Main benchmark runner."""
    parser = argparse.ArgumentParser(description="Quantum Chimera LLM Benchmark Suite")
    parser.add_argument("--all", action="store_true", help="Run all benchmarks")
    parser.add_argument("--router", action="store_true", help="Benchmark router")
    parser.add_argument("--token-optimizer", action="store_true", help="Benchmark token optimizer")
    parser.add_argument("--rate-limiter", action="store_true", help="Benchmark rate limiter")
    parser.add_argument("--predictive-cache", action="store_true", help="Benchmark predictive cache")
    parser.add_argument("--semantic-cache", action="store_true", help="Benchmark semantic cache")
    parser.add_argument("--model-tracker", action="store_true", help="Benchmark model tracker")
    parser.add_argument("--response-scorer", action="store_true", help="Benchmark response scorer")
    parser.add_argument("--end-to-end", action="store_true", help="Benchmark end-to-end pipeline")
    
    args = parser.parse_args()
    
    # If no specific benchmark selected, run all
    if not any([
        args.router, args.token_optimizer, args.rate_limiter,
        args.predictive_cache, args.semantic_cache, args.model_tracker,
        args.response_scorer, args.end_to_end
    ]):
        args.all = True
    
    runner = BenchmarkRunner()
    
    if args.all or args.router:
        await runner.benchmark_router()
    
    if args.all or args.token_optimizer:
        await runner.benchmark_token_optimizer()
    
    if args.all or args.rate_limiter:
        await runner.benchmark_rate_limiter()
    
    if args.all or args.predictive_cache:
        await runner.benchmark_predictive_cache()
    
    if args.all or args.semantic_cache:
        await runner.benchmark_semantic_cache()
    
    if args.all or args.model_tracker:
        await runner.benchmark_model_tracker()
    
    if args.all or args.response_scorer:
        await runner.benchmark_response_scorer()
    
    if args.all or args.end_to_end:
        await runner.benchmark_end_to_end()
    
    runner.print_summary()


if __name__ == "__main__":
    asyncio.run(main())
