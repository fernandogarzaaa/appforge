"""
Basic Usage Examples for Clawd Hybrid RTX
"""

import asyncio
import os
from typing import List

# Ensure the parent directory is in path
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from hybrid_engine import create_engine, HybridInferenceEngine


async def example_basic_query():
    """Example 1: Simple query and response."""
    print("=" * 50)
    print("Example 1: Basic Query")
    print("=" * 50)
    
    engine = await create_engine()
    
    query = "What is Python programming language?"
    print(f"Query: {query}\n")
    
    response = await engine.generate(query)
    print(f"Response: {response}\n")
    
    await engine.close()


async def example_streaming():
    """Example 2: Streaming response."""
    print("=" * 50)
    print("Example 2: Streaming Response")
    print("=" * 50)
    
    engine = await create_engine()
    
    query = "Explain neural networks in simple terms."
    print(f"Query: {query}\n")
    print("Response: ", end="", flush=True)
    
    # Stream response chunks
    async for chunk in await engine.generate(query, stream=True):
        print(chunk, end="", flush=True)
    
    print("\n")
    await engine.close()


async def example_batch_processing():
    """Example 3: Batch processing multiple queries."""
    print("=" * 50)
    print("Example 3: Batch Processing")
    print("=" * 50)
    
    engine = await create_engine()
    
    queries = [
        "What is machine learning?",
        "What is deep learning?",
        "What is reinforcement learning?",
        "What is supervised learning?",
        "What is unsupervised learning?",
    ]
    
    print(f"Processing {len(queries)} queries...\n")
    
    results = await engine.generate_batch(queries)
    
    for i, result in enumerate(results, 1):
        print(f"{i}. {result.query}")
        print(f"   Source: {result.source}")
        print(f"   Response: {result.response[:100]}...\n")
    
    await engine.close()


async def example_caching_behavior():
    """Example 4: Demonstrate caching behavior."""
    print("=" * 50)
    print("Example 4: Caching Behavior")
    print("=" * 50)
    
    engine = await create_engine()
    
    query = "What is the capital of France?"
    
    # First query - should be cache miss
    print(f"Query 1 (cache miss expected): {query}")
    response1 = await engine.generate(query)
    print(f"Response: {response1[:100]}...\n")
    
    # Same query - should be cache hit
    print(f"Query 2 (cache hit expected): {query}")
    response2 = await engine.generate(query)
    print(f"Response: {response2[:100]}...\n")
    
    # Similar query - semantic match
    similar_query = "What's the capital city of France?"
    print(f"Query 3 (semantic match): {similar_query}")
    response3 = await engine.generate(similar_query)
    print(f"Response: {response3[:100]}...\n")
    
    # Check stats
    stats = engine.get_stats()
    print(f"Cache hits: {stats['requests']['cache_hits']}")
    print(f"Total requests: {stats['requests']['total']}")
    print(f"Cache hit rate: {stats['requests']['cache_hit_rate']:.1%}\n")
    
    await engine.close()


async def example_with_callback():
    """Example 5: Using callbacks for real-time updates."""
    print("=" * 50)
    print("Example 5: Callback Function")
    print("=" * 50)
    
    engine = await create_engine()
    
    chunks_received = []
    
    def on_chunk(chunk: str):
        """Called for each chunk received."""
        chunks_received.append(chunk)
        # Could update UI, write to file, etc.
    
    query = "List the planets in our solar system."
    print(f"Query: {query}\n")
    
    response = await engine.generate(query, callback=on_chunk)
    
    print(f"Total chunks received: {len(chunks_received)}")
    print(f"Total response length: {len(response)} characters\n")
    
    await engine.close()


async def example_custom_config():
    """Example 6: Custom configuration."""
    print("=" * 50)
    print("Example 6: Custom Configuration")
    print("=" * 50)
    
    config = {
        # Use GPU for faster embeddings (if VRAM available)
        "use_gpu_for_embeddings": True,
        
        # More aggressive caching
        "cache_similarity_threshold": 0.88,
        "cache_ttl_seconds": 7200,  # 2 hours
        
        # Larger batches for throughput
        "batch_max_size": 10,
        "batch_timeout_ms": 100,
        
        # Provider preference
        "primary_provider": "together",
        "fallback_provider": "openrouter",
    }
    
    engine = await create_engine(config)
    
    query = "Explain quantum computing."
    print(f"Query: {query}\n")
    
    response = await engine.generate(query)
    print(f"Response: {response[:200]}...\n")
    
    # Show configuration
    stats = engine.get_stats()
    print(f"Active config: {stats['config']['primary_provider']}")
    print(f"GPU enabled: {stats['config']['use_gpu_for_embeddings']}\n")
    
    await engine.close()


async def example_context_manager():
    """Example 7: Using context manager for automatic cleanup."""
    print("=" * 50)
    print("Example 7: Context Manager")
    print("=" * 50)
    
    # Engine automatically initializes and closes
    async with HybridInferenceEngine().session() as engine:
        query = "What are the benefits of async programming?"
        print(f"Query: {query}\n")
        
        response = await engine.generate(query)
        print(f"Response: {response[:150]}...\n")
    
    print("Engine automatically closed.\n")


async def example_stats_and_monitoring():
    """Example 8: Monitoring engine statistics."""
    print("=" * 50)
    print("Example 8: Statistics and Monitoring")
    print("=" * 50)
    
    engine = await create_engine()
    
    # Generate some traffic
    queries = [f"Question {i}" for i in range(5)]
    for query in queries:
        await engine.generate(query)
    
    # Get comprehensive stats
    stats = engine.get_stats()
    
    print("Engine Statistics:")
    print(f"  Total Requests: {stats['requests']['total']}")
    print(f"  Cache Hits: {stats['requests']['cache_hits']}")
    print(f"  Cloud Requests: {stats['requests']['cloud_requests']}")
    print(f"  Cache Hit Rate: {stats['requests']['cache_hit_rate']:.1%}")
    
    print("\nCache Statistics:")
    cache_stats = stats['cache']
    print(f"  Total Entries: {cache_stats.get('total_entries', 0)}")
    print(f"  Memory Usage: {cache_stats.get('memory_mb', 0):.2f} MB")
    
    print("\nBatch Statistics:")
    batch_stats = stats['batch']
    print(f"  Total Batches: {batch_stats.get('total_batches', 0)}")
    print(f"  Avg Batch Size: {batch_stats.get('avg_batch_size', 0):.2f}")
    print(f"  Deduplicated: {batch_stats.get('deduplicated_count', 0)}\n")
    
    await engine.close()


async def example_cache_invalidation():
    """Example 9: Cache invalidation."""
    print("=" * 50)
    print("Example 9: Cache Invalidation")
    print("=" * 50)
    
    engine = await create_engine()
    
    # Add something to cache
    query = "What is the current weather?"
    await engine.generate(query)
    
    # Check cache stats
    stats1 = engine.get_stats()
    print(f"Cache entries before: {stats1['cache']['total_entries']}")
    
    # Invalidate specific query
    count = await engine.invalidate_cache(query)
    print(f"Invalidated entries: {count}")
    
    # Check cache stats
    stats2 = engine.get_stats()
    print(f"Cache entries after: {stats2['cache']['total_entries']}\n")
    
    # Add more entries
    await engine.generate("Query 1")
    await engine.generate("Query 2")
    
    # Invalidate all
    count = await engine.invalidate_cache()  # No query = all
    print(f"Invalidated all entries: {count}\n")
    
    await engine.close()


async def example_memory_monitoring():
    """Example 10: Memory monitoring integration."""
    print("=" * 50)
    print("Example 10: Memory Monitoring")
    print("=" * 50)
    
    from utils.memory_monitor import create_monitor
    
    # Create memory monitor
    monitor = create_monitor(check_interval_seconds=1.0)
    
    # Register warning callback
    def on_gpu_warning(stats):
        print(f"⚠️  GPU Memory Warning: {stats.gpu_used_mb:.0f}MB used")
    
    monitor.register_callback("gpu_warning", on_gpu_warning)
    
    # Get current stats
    summary = monitor.get_summary()
    
    print("Memory Status:")
    print(f"  GPU: {summary['gpu']['used_mb']:.0f} / {summary['gpu']['total_mb']:.0f} MB")
    print(f"  GPU Utilization: {summary['gpu']['utilization']:.1f}%")
    print(f"  CPU: {summary['cpu']['percent']:.1f}%")
    print(f"  Recommendation: Use '{summary['recommendation']}' for embeddings\n")
    
    monitor.shutdown()


async def main():
    """Run all examples."""
    
    # Check for API keys
    if not os.getenv("OPENROUTER_API_KEY") and not os.getenv("TOGETHER_API_KEY"):
        print("=" * 50)
        print("WARNING: No API keys found!")
        print("=" * 50)
        print("\nPlease set one of these environment variables:")
        print("  export OPENROUTER_API_KEY='your-key'")
        print("  export TOGETHER_API_KEY='your-key'")
        print("\nExamples requiring API calls will fail.")
        print("=" * 50 + "\n")
        return
    
    examples = [
        ("Basic Query", example_basic_query),
        ("Streaming", example_streaming),
        ("Batch Processing", example_batch_processing),
        ("Caching Behavior", example_caching_behavior),
        ("Callback Function", example_with_callback),
        ("Custom Config", example_custom_config),
        ("Context Manager", example_context_manager),
        ("Statistics", example_stats_and_monitoring),
        ("Cache Invalidation", example_cache_invalidation),
        ("Memory Monitoring", example_memory_monitoring),
    ]
    
    print("\n" + "=" * 50)
    print("Clawd Hybrid RTX - Usage Examples")
    print("=" * 50 + "\n")
    
    for i, (name, example_func) in enumerate(examples, 1):
        try:
            await example_func()
        except Exception as e:
            print(f"Error in example '{name}': {e}\n")
        
        # Small delay between examples
        if i < len(examples):
            await asyncio.sleep(0.5)
    
    print("=" * 50)
    print("All examples completed!")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
