"""
Batch Manager Module for Clawd Hybrid RTX
Handles request batching and deduplication for efficient cloud API usage.
"""

import asyncio
import hashlib
from typing import List, Dict, Any, Optional, Callable, Awaitable
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class BatchStatus(Enum):
    """Status of a batched request."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class BatchRequest:
    """Represents a single request in a batch."""
    id: str
    query: str
    priority: int = 0
    timestamp: datetime = field(default_factory=datetime.now)
    status: BatchStatus = BatchStatus.PENDING
    response: Optional[str] = None
    error: Optional[str] = None
    callback: Optional[Callable[[str], Awaitable[None]]] = None
    
    def __post_init__(self):
        if not self.id:
            self.id = hashlib.sha256(
                f"{self.query}:{self.timestamp.isoformat()}".encode()
            ).hexdigest()[:16]


@dataclass
class BatchResult:
    """Result of a batch processing operation."""
    batch_id: str
    requests: List[BatchRequest]
    completed_at: datetime
    total_tokens: int = 0
    cost_estimate: float = 0.0


class BatchManager:
    """
    Manages batching and deduplication of inference requests.
    
    Features:
    - Automatic batching with configurable size and timeout
    - Request deduplication (identical queries batched together)
    - Priority queuing
    - Streaming results to callbacks
    - Adaptive batch sizing based on response times
    """
    
    DEFAULT_CONFIG = {
        "max_batch_size": 10,
        "batch_timeout_ms": 100,  # Wait up to 100ms to fill batch
        "max_concurrent_batches": 3,
        "deduplicate_requests": True,
        "adaptive_batching": True,
        "min_batch_size": 1,
        "target_response_time_ms": 2000,
    }
    
    def __init__(
        self, 
        process_fn: Callable[[List[str]], Awaitable[List[str]]],
        config: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize the batch manager.
        
        Args:
            process_fn: Async function that takes a list of queries and returns responses
            config: Optional configuration dictionary
        """
        self.process_fn = process_fn
        self.config = {**self.DEFAULT_CONFIG, **(config or {})}
        
        self._queue: asyncio.Queue[BatchRequest] = asyncio.Queue()
        self._pending_requests: Dict[str, BatchRequest] = {}
        self._processing = False
        self._batch_task: Optional[asyncio.Task] = None
        self._semaphore = asyncio.Semaphore(self.config["max_concurrent_batches"])
        
        # Metrics
        self._total_requests = 0
        self._total_batches = 0
        self._deduplicated_count = 0
        self._avg_batch_size = 0.0
        self._avg_response_time_ms = 0.0
    
    async def start(self) -> None:
        """Start the batch processing loop."""
        if self._processing:
            return
        
        self._processing = True
        self._batch_task = asyncio.create_task(self._batch_loop())
        logger.info("Batch manager started")
    
    async def stop(self) -> None:
        """Stop the batch processing loop."""
        self._processing = False
        if self._batch_task:
            self._batch_task.cancel()
            try:
                await self._batch_task
            except asyncio.CancelledError:
                pass
        logger.info("Batch manager stopped")
    
    async def submit(
        self, 
        query: str, 
        priority: int = 0,
        callback: Optional[Callable[[str], Awaitable[None]]] = None,
        wait_for_result: bool = True
    ) -> Optional[str]:
        """
        Submit a query for batched processing.
        
        Args:
            query: The query string to process
            priority: Priority level (higher = processed sooner)
            callback: Optional async callback for streaming result
            wait_for_result: If True, await and return result; if False, return immediately
        
        Returns:
            The response string if wait_for_result=True, None otherwise
        """
        # Check for existing identical pending request (deduplication)
        if self.config["deduplicate_requests"]:
            existing = self._find_duplicate(query)
            if existing:
                self._deduplicated_count += 1
                logger.debug(f"Deduplicated request: {query[:50]}...")
                
                if wait_for_result:
                    # Wait for the existing request to complete
                    return await self._wait_for_result(existing.id)
                else:
                    return None
        
        request = BatchRequest(
            query=query,
            priority=priority,
            callback=callback
        )
        
        self._pending_requests[request.id] = request
        await self._queue.put(request)
        self._total_requests += 1
        
        logger.debug(f"Submitted request {request.id}: {query[:50]}...")
        
        if wait_for_result:
            return await self._wait_for_result(request.id)
        return None
    
    async def submit_batch(
        self, 
        queries: List[str], 
        priority: int = 0
    ) -> List[str]:
        """
        Submit multiple queries as a batch.
        
        Args:
            queries: List of query strings
            priority: Priority level
        
        Returns:
            List of response strings in same order as queries
        """
        # Create futures for all queries
        futures = []
        for query in queries:
            future = asyncio.Future()
            
            async def callback(result: str, fut=future):
                fut.set_result(result)
            
            await self.submit(query, priority, callback, wait_for_result=False)
            futures.append(future)
        
        # Wait for all to complete
        responses = await asyncio.gather(*futures, return_exceptions=True)
        
        # Convert exceptions to error strings
        results = []
        for r in responses:
            if isinstance(r, Exception):
                results.append(f"Error: {str(r)}")
            else:
                results.append(r)
        
        return results
    
    async def _batch_loop(self) -> None:
        """Main batch processing loop."""
        while self._processing:
            batch: List[BatchRequest] = []
            
            # Wait for first request
            try:
                first_request = await asyncio.wait_for(
                    self._queue.get(),
                    timeout=1.0
                )
                batch.append(first_request)
            except asyncio.TimeoutError:
                continue
            
            # Collect more requests until batch is full or timeout
            deadline = asyncio.get_event_loop().time() + (
                self.config["batch_timeout_ms"] / 1000.0
            )
            
            while len(batch) < self.config["max_batch_size"]:
                timeout = max(0, deadline - asyncio.get_event_loop().time())
                try:
                    request = await asyncio.wait_for(
                        self._queue.get(),
                        timeout=timeout
                    )
                    
                    # Check for deduplication within the batch itself
                    if self.config["deduplicate_requests"]:
                        duplicate_in_batch = any(
                            r.query == request.query for r in batch
                        )
                        if duplicate_in_batch:
                            self._deduplicated_count += 1
                            # Link this request to the one in batch
                            request.status = BatchStatus.PROCESSING
                            continue
                    
                    batch.append(request)
                except asyncio.TimeoutError:
                    break
            
            if len(batch) >= self.config["min_batch_size"]:
                # Process batch
                asyncio.create_task(self._process_batch(batch))
            else:
                # Put requests back and wait for more
                for request in batch:
                    await self._queue.put(request)
    
    async def _process_batch(self, batch: List[BatchRequest]) -> None:
        """Process a batch of requests."""
        async with self._semaphore:
            start_time = asyncio.get_event_loop().time()
            
            # Mark all as processing
            for request in batch:
                request.status = BatchStatus.PROCESSING
            
            queries = [r.query for r in batch]
            batch_id = hashlib.sha256(
                "".join(queries).encode()
            ).hexdigest()[:16]
            
            logger.info(f"Processing batch {batch_id} with {len(batch)} requests")
            
            try:
                responses = await self.process_fn(queries)
                
                # Update requests with responses
                for request, response in zip(batch, responses):
                    request.response = response
                    request.status = BatchStatus.COMPLETED
                    
                    # Notify callback if provided
                    if request.callback:
                        try:
                            await request.callback(response)
                        except Exception as e:
                            logger.error(f"Callback error: {e}")
                
                # Update metrics
                elapsed_ms = (asyncio.get_event_loop().time() - start_time) * 1000
                self._update_metrics(len(batch), elapsed_ms)
                self._total_batches += 1
                
                logger.info(f"Batch {batch_id} completed in {elapsed_ms:.1f}ms")
                
            except Exception as e:
                logger.error(f"Batch {batch_id} failed: {e}")
                
                for request in batch:
                    request.error = str(e)
                    request.status = BatchStatus.FAILED
                    
                    if request.callback:
                        try:
                            await request.callback(f"Error: {str(e)}")
                        except Exception:
                            pass
    
    async def _wait_for_result(self, request_id: str, timeout: float = 60.0) -> str:
        """Wait for a request to complete and return its result."""
        start_time = asyncio.get_event_loop().time()
        
        while request_id in self._pending_requests:
            request = self._pending_requests[request_id]
            
            if request.status == BatchStatus.COMPLETED:
                del self._pending_requests[request_id]
                return request.response
            
            if request.status == BatchStatus.FAILED:
                del self._pending_requests[request_id]
                raise Exception(request.error or "Unknown error")
            
            if asyncio.get_event_loop().time() - start_time > timeout:
                raise TimeoutError(f"Request {request_id} timed out")
            
            await asyncio.sleep(0.01)  # 10ms polling
        
        raise KeyError(f"Request {request_id} not found")
    
    def _find_duplicate(self, query: str) -> Optional[BatchRequest]:
        """Find an identical pending request for deduplication."""
        for request in self._pending_requests.values():
            if request.query == query and request.status == BatchStatus.PENDING:
                return request
        return None
    
    def _update_metrics(self, batch_size: int, response_time_ms: float) -> None:
        """Update running metrics."""
        # Exponential moving average
        alpha = 0.3
        self._avg_batch_size = (
            alpha * batch_size + (1 - alpha) * self._avg_batch_size
        )
        self._avg_response_time_ms = (
            alpha * response_time_ms + (1 - alpha) * self._avg_response_time_ms
        )
        
        # Adaptive batch sizing
        if self.config["adaptive_batching"]:
            if response_time_ms > self.config["target_response_time_ms"]:
                # Reduce batch size if too slow
                self.config["max_batch_size"] = max(
                    self.config["min_batch_size"],
                    self.config["max_batch_size"] - 1
                )
            elif response_time_ms < self.config["target_response_time_ms"] * 0.5:
                # Increase batch size if very fast
                self.config["max_batch_size"] = min(
                    50,  # Hard cap
                    self.config["max_batch_size"] + 1
                )
    
    def get_stats(self) -> Dict[str, Any]:
        """Get batch manager statistics."""
        return {
            "total_requests": self._total_requests,
            "total_batches": self._total_batches,
            "deduplicated_count": self._deduplicated_count,
            "avg_batch_size": round(self._avg_batch_size, 2),
            "avg_response_time_ms": round(self._avg_response_time_ms, 2),
            "pending_requests": len(self._pending_requests),
            "current_max_batch_size": self.config["max_batch_size"],
        }
    
    def clear_pending(self) -> int:
        """Clear all pending requests. Returns count cleared."""
        count = len(self._pending_requests)
        self._pending_requests.clear()
        
        # Drain the queue
        while not self._queue.empty():
            try:
                self._queue.get_nowait()
            except asyncio.QueueEmpty:
                break
        
        logger.info(f"Cleared {count} pending requests")
        return count


# Utility function for simple batch processing
def create_batch_processor(
    process_fn: Callable[[List[str]], Awaitable[List[str]]],
    config: Optional[Dict[str, Any]] = None
) -> BatchManager:
    """
    Factory function to create a batch manager.
    
    Example:
        async def process_queries(queries: List[str]) -> List[str]:
            # Call your LLM API here
            return [f"Response to: {q}" for q in queries]
        
        manager = create_batch_processor(process_queries)
        await manager.start()
        
        response = await manager.submit("Hello, world!")
    """
    return BatchManager(process_fn, config)
