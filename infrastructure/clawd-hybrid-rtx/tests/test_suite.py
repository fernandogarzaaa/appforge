"""
Test Suite for Clawd Hybrid RTX
Comprehensive tests for semantic cache, batch manager, and hybrid engine.
"""

import pytest
import asyncio
import numpy as np
from unittest.mock import Mock, patch, AsyncMock
import tempfile
import os
from pathlib import Path

# Import modules to test
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from semantic_cache import SemanticCache, CacheEntry, create_cache
from batch_manager import BatchManager, BatchStatus, create_batch_processor
from hybrid_engine import HybridInferenceEngine, InferenceResult, create_engine


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def temp_cache_dir():
    """Provide a temporary directory for cache files."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield tmpdir


@pytest.fixture
async def semantic_cache(temp_cache_dir):
    """Create a semantic cache instance for testing."""
    config = {
        "persist_path": os.path.join(temp_cache_dir, "test_cache.pkl"),
        "similarity_threshold": 0.9,
        "embedding_dimension": 384,
        "use_gpu": False,
    }
    cache = create_cache(config)
    yield cache
    await asyncio.get_event_loop().run_in_executor(None, cache.close)


@pytest.fixture
async def batch_manager():
    """Create a batch manager with a mock processor."""
    async def mock_process(queries):
        return [f"Response to: {q}" for q in queries]
    
    config = {
        "max_batch_size": 3,
        "batch_timeout_ms": 50,
    }
    manager = create_batch_processor(mock_process, config)
    await manager.start()
    yield manager
    await manager.stop()


@pytest.fixture
async def mock_engine():
    """Create a mock hybrid engine for testing."""
    config = {
        "cache_similarity_threshold": 0.9,
        "use_gpu_for_embeddings": False,
        "batch_max_size": 2,
    }
    engine = HybridInferenceEngine(config)
    
    # Mock the session and cache
    engine._session = Mock()
    engine._cache = Mock()
    engine._batch_manager = Mock()
    engine._initialized = True
    
    yield engine


# ============================================================================
# Semantic Cache Tests
# ============================================================================

class TestSemanticCache:
    """Test suite for semantic caching."""
    
    @pytest.mark.asyncio
    async def test_cache_basic_operations(self, semantic_cache):
        """Test basic cache put and get operations."""
        # Initial get should miss
        result = await semantic_cache.get("test query")
        assert result is None
        
        # Put a value
        await semantic_cache.put("test query", "test response", model_used="test-model")
        
        # Get should now hit
        result = await semantic_cache.get("test query")
        assert result is not None
        assert result.response == "test response"
        assert result.model_used == "test-model"
        assert result.hit_count == 1
    
    @pytest.mark.asyncio
    async def test_cache_semantic_similarity(self, semantic_cache):
        """Test that semantically similar queries hit the cache."""
        # Store original query
        await semantic_cache.put(
            "What is the capital of France?",
            "The capital of France is Paris."
        )
        
        # Similar query should hit (above threshold)
        result = await semantic_cache.get("What's France's capital city?")
        assert result is not None
        assert "Paris" in result.response
    
    @pytest.mark.asyncio
    async def test_cache_ttl_expiration(self, temp_cache_dir):
        """Test that cache entries expire after TTL."""
        config = {
            "persist_path": os.path.join(temp_cache_dir, "ttl_test.pkl"),
            "default_ttl_seconds": 0,  # Immediate expiration
        }
        cache = create_cache(config)
        
        await cache.put("query", "response", ttl_seconds=0)
        
        # Small delay to ensure expiration
        await asyncio.sleep(0.1)
        
        # Should be expired
        result = await cache.get("query")
        assert result is None
        
        await asyncio.get_event_loop().run_in_executor(None, cache.close)
    
    @pytest.mark.asyncio
    async def test_cache_invalidation(self, semantic_cache):
        """Test cache invalidation."""
        await semantic_cache.put("query1", "response1")
        await semantic_cache.put("query2", "response2")
        
        # Invalidate specific query
        count = await asyncio.get_event_loop().run_in_executor(
            None, lambda: semantic_cache.invalidate("query1")
        )
        assert count == 1
        
        # query1 should be gone
        assert await semantic_cache.get("query1") is None
        # query2 should still exist
        assert await semantic_cache.get("query2") is not None
        
        # Invalidate all
        await asyncio.get_event_loop().run_in_executor(
            None, lambda: semantic_cache.invalidate()
        )
        assert await semantic_cache.get("query2") is None
    
    @pytest.mark.asyncio
    async def test_cache_lru_eviction(self, temp_cache_dir):
        """Test LRU eviction when cache is full."""
        config = {
            "persist_path": os.path.join(temp_cache_dir, "lru_test.pkl"),
            "max_entries": 2,
        }
        cache = create_cache(config)
        
        # Add entries up to max
        await cache.put("query1", "response1")
        await cache.put("query2", "response2")
        
        # Access query1 to make it more recently used
        await cache.get("query1")
        
        # Add third entry - should evict query2
        await cache.put("query3", "response3")
        
        # query1 should still exist
        assert await cache.get("query1") is not None
        # query2 should be evicted
        assert await cache.get("query2") is None
        # query3 should exist
        assert await cache.get("query3") is not None
        
        await asyncio.get_event_loop().run_in_executor(None, cache.close)
    
    def test_cache_stats(self, semantic_cache):
        """Test cache statistics."""
        stats = semantic_cache.get_stats()
        
        assert "total_entries" in stats
        assert "total_hits" in stats
        assert "memory_mb" in stats
        assert "config" in stats
    
    @pytest.mark.asyncio
    async def test_cache_persistence(self, temp_cache_dir):
        """Test cache persistence to disk."""
        persist_path = os.path.join(temp_cache_dir, "persist_test.pkl")
        config = {"persist_path": persist_path}
        
        # Create and populate cache
        cache1 = create_cache(config)
        await cache1.put("persisted_query", "persisted_response")
        await asyncio.get_event_loop().run_in_executor(None, cache1.close)
        
        # Create new cache instance - should load from disk
        cache2 = create_cache(config)
        result = await cache2.get("persisted_query")
        
        assert result is not None
        assert result.response == "persisted_response"
        
        await asyncio.get_event_loop().run_in_executor(None, cache2.close)


# ============================================================================
# Batch Manager Tests
# ============================================================================

class TestBatchManager:
    """Test suite for request batching."""
    
    @pytest.mark.asyncio
    async def test_batch_basic_processing(self, batch_manager):
        """Test basic batch request processing."""
        response = await batch_manager.submit("Hello")
        assert response == "Response to: Hello"
    
    @pytest.mark.asyncio
    async def test_batch_multiple_requests(self, batch_manager):
        """Test processing multiple requests."""
        queries = ["Query 1", "Query 2", "Query 3"]
        
        # Submit all at once
        futures = [batch_manager.submit(q) for q in queries]
        responses = await asyncio.gather(*futures)
        
        for query, response in zip(queries, responses):
            assert response == f"Response to: {query}"
    
    @pytest.mark.asyncio
    async def test_batch_deduplication(self):
        """Test request deduplication."""
        process_count = 0
        
        async def counting_process(queries):
            nonlocal process_count
            process_count += len(queries)
            return [f"Response to: {q}" for q in queries]
        
        config = {
            "max_batch_size": 5,
            "batch_timeout_ms": 100,
            "deduplicate_requests": True,
        }
        manager = create_batch_processor(counting_process, config)
        await manager.start()
        
        # Submit same query multiple times
        futures = [manager.submit("same query") for _ in range(3)]
        responses = await asyncio.gather(*futures)
        
        # All should get same response
        assert all(r == "Response to: same query" for r in responses)
        
        # Should only process once
        assert process_count == 1
        
        await manager.stop()
    
    @pytest.mark.asyncio
    async def test_batch_priority(self):
        """Test priority queuing."""
        processed = []
        
        async def tracking_process(queries):
            processed.extend(queries)
            return [f"Response to: {q}" for q in queries]
        
        config = {"max_batch_size": 1, "batch_timeout_ms": 50}
        manager = create_batch_processor(tracking_process, config)
        await manager.start()
        
        # Submit with different priorities (fire and forget first)
        await manager.submit("low priority", priority=0, wait_for_result=False)
        await manager.submit("high priority", priority=10, wait_for_result=False)
        
        # Wait for processing
        await asyncio.sleep(0.2)
        
        await manager.stop()
    
    @pytest.mark.asyncio
    async def test_batch_error_handling(self):
        """Test error handling in batch processing."""
        async def failing_process(queries):
            if "fail" in queries[0]:
                raise ValueError("Intentional error")
            return ["Success"]
        
        config = {"max_batch_size": 1}
        manager = create_batch_processor(failing_process, config)
        await manager.start()
        
        response = await manager.submit("fail this")
        assert "Error:" in response
        
        await manager.stop()
    
    @pytest.mark.asyncio
    async def test_batch_stats(self, batch_manager):
        """Test batch manager statistics."""
        # Process some requests
        await batch_manager.submit("test1")
        await batch_manager.submit("test2")
        
        stats = batch_manager.get_stats()
        
        assert stats["total_requests"] == 2
        assert "avg_batch_size" in stats
        assert "avg_response_time_ms" in stats


# ============================================================================
# Hybrid Engine Tests
# ============================================================================

class TestHybridEngine:
    """Test suite for hybrid inference engine."""
    
    @pytest.mark.asyncio
    async def test_engine_initialization(self):
        """Test engine initialization."""
        engine = HybridInferenceEngine()
        await engine.initialize()
        
        assert engine._initialized
        assert engine._cache is not None
        assert engine._batch_manager is not None
        
        await engine.close()
    
    @pytest.mark.asyncio
    async def test_engine_context_manager(self):
        """Test engine as async context manager."""
        async with HybridInferenceEngine().session() as engine:
            assert engine._initialized
            stats = engine.get_stats()
            assert "requests" in stats
    
    @pytest.mark.asyncio
    async def test_engine_cache_routing(self, mock_engine):
        """Test that engine routes cache hits correctly."""
        # Mock cache hit
        mock_entry = Mock()
        mock_entry.response = "Cached response"
        mock_entry.model_used = "cache"
        mock_entry.hit_count = 5
        
        mock_engine._cache.get = AsyncMock(return_value=mock_entry)
        
        response = await mock_engine.generate("test query")
        
        assert response == "Cached response"
        assert mock_engine._cache_hit_count == 1
    
    @pytest.mark.asyncio
    async def test_engine_cloud_routing(self, mock_engine):
        """Test that engine routes cache misses to cloud."""
        # Mock cache miss
        mock_engine._cache.get = AsyncMock(return_value=None)
        mock_engine._batch_manager.submit = AsyncMock(
            return_value="Cloud response"
        )
        
        response = await mock_engine.generate("new query")
        
        assert response == "Cloud response"
        assert mock_engine._cloud_request_count == 1
        # Should cache the response
        mock_engine._cache.put.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_engine_streaming(self, mock_engine):
        """Test streaming response generation."""
        mock_engine._cache.get = AsyncMock(return_value=None)
        mock_engine._batch_manager.submit = AsyncMock(
            return_value="Streaming test response"
        )
        mock_engine._cache.put = AsyncMock()
        
        chunks = []
        async for chunk in await mock_engine.generate("test", stream=True):
            chunks.append(chunk)
        
        # Should get chunks
        assert len(chunks) > 0
        assert "".join(chunks) == "Streaming test response"
    
    @pytest.mark.asyncio
    async def test_engine_batch_generation(self, mock_engine):
        """Test batch generation."""
        mock_engine._cache.get = AsyncMock(return_value=None)
        mock_engine._batch_manager.submit_batch = AsyncMock(
            return_value=["Response 1", "Response 2"]
        )
        
        results = await mock_engine.generate_batch(["Query 1", "Query 2"])
        
        assert len(results) == 2
        assert results[0].response == "Response 1"
        assert results[1].response == "Response 2"
    
    @pytest.mark.asyncio
    async def test_engine_stats(self, mock_engine):
        """Test engine statistics."""
        stats = mock_engine.get_stats()
        
        assert "requests" in stats
        assert "cache" in stats
        assert "batch" in stats
        assert "config" in stats
    
    @pytest.mark.asyncio
    async def test_engine_invalidation(self, mock_engine):
        """Test cache invalidation through engine."""
        mock_engine._cache.invalidate = Mock(return_value=1)
        
        count = await mock_engine.invalidate_cache("test query")
        
        assert count == 1
        mock_engine._cache.invalidate.assert_called_once_with("test query")


# ============================================================================
# Performance Tests
# ============================================================================

class TestPerformance:
    """Performance benchmarks."""
    
    @pytest.mark.asyncio
    async def test_cache_latency(self, semantic_cache):
        """Test cache hit latency is under 50ms."""
        # Pre-populate cache
        await semantic_cache.put("speed test", "fast response")
        
        import time
        start = time.perf_counter()
        result = await semantic_cache.get("speed test")
        elapsed_ms = (time.perf_counter() - start) * 1000
        
        assert result is not None
        assert elapsed_ms < 50, f"Cache hit took {elapsed_ms:.1f}ms (expected <50ms)"
    
    @pytest.mark.asyncio
    async def test_memory_usage(self, temp_cache_dir):
        """Test memory usage stays within bounds."""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Create cache with many entries
        config = {
            "persist_path": os.path.join(temp_cache_dir, "mem_test.pkl"),
            "max_entries": 1000,
        }
        cache = create_cache(config)
        
        # Add entries
        for i in range(100):
            await cache.put(f"query_{i}", f"response_{i}" * 100)
        
        memory_after = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = memory_after - initial_memory
        
        # Should use less than 100MB for 100 cached responses
        assert memory_increase < 100, f"Memory increased by {memory_increase:.1f}MB"
        
        await asyncio.get_event_loop().run_in_executor(None, cache.close)


# ============================================================================
# Integration Tests
# ============================================================================

class TestIntegration:
    """Integration tests for the full system."""
    
    @pytest.mark.asyncio
    async def test_end_to_end_workflow(self, temp_cache_dir):
        """Test complete workflow: query → cache miss → cloud → cache hit."""
        # This would require mocking the cloud API
        pass  # Placeholder for full integration test
    
    @pytest.mark.asyncio
    async def test_fallback_provider(self):
        """Test fallback to secondary provider when primary fails."""
        pass  # Placeholder for fallback test


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
