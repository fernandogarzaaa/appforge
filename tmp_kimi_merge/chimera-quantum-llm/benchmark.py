#!/usr/bin/env python3
"""
Quantum Chimera LLM - Benchmark Script
======================================
End-to-end benchmark for catching regressions.
"""

import json
import sys
import time
from typing import Dict, List, Any

import requests


# Test queries covering different use cases
TEST_QUERIES = [
    {
        "name": "Simple Greeting",
        "messages": [{"role": "user", "content": "Hello! How are you today?"}],
    },
    {
        "name": "Coding Question",
        "messages": [{"role": "user", "content": "Write a Python function to reverse a string without using the built-in reverse method."}],
    },
    {
        "name": "Science Question",
        "messages": [{"role": "user", "content": "Explain how photosynthesis works in simple terms."}],
    },
    {
        "name": "Creative Writing",
        "messages": [{"role": "user", "content": "Write a short poem about the ocean at sunset."}],
    },
    {
        "name": "Multi-step Reasoning",
        "messages": [{"role": "user", "content": "If a train travels 120 km in 2 hours, and another train travels 150 km in 3 hours, which train is faster and by how much?"}],
    },
    {
        "name": "Analysis Request",
        "messages": [{"role": "user", "content": "Compare the pros and cons of renewable energy versus fossil fuels."}],
    },
    {
        "name": "Technical Explanation",
        "messages": [{"role": "user", "content": "What is the difference between REST and GraphQL APIs?"}],
    },
    {
        "name": "Math Problem",
        "messages": [{"role": "user", "content": "What is the factorial of 5?"}],
    },
    {
        "name": "General Knowledge",
        "messages": [{"role": "user", "content": "Who wrote the novel '1984' and when was it published?"}],
    },
    {
        "name": "Code Debug",
        "messages": [{"role": "user", "content": "What's wrong with this code: for i in range(10): print(i) i += 1"}],
    },
]

API_URL = "http://localhost:7860/v1/chat/completions"


def make_request(messages: List[Dict[str, str]]) -> Dict[str, Any]:
    """Make a request to the Chimera API."""
    payload = {
        "model": "chimera-auto",
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 1024,
        "stream": False,
    }
    
    start_time = time.time()
    
    try:
        response = requests.post(
            API_URL,
            json=payload,
            timeout=120,
        )
        
        elapsed_ms = (time.time() - start_time) * 1000
        
        if response.status_code != 200:
            return {
                "success": False,
                "error": f"HTTP {response.status_code}",
                "response_time_ms": elapsed_ms,
            }
        
        data = response.json()
        
        # Extract info
        content = ""
        if data.get("choices"):
            content = data["choices"][0].get("message", {}).get("content", "")
        
        model_used = data.get("model", "unknown")
        cached = data.get("cached", False)
        
        # Check if empty
        is_empty = not content or not content.strip()
        
        return {
            "success": True,
            "error": None,
            "response_time_ms": elapsed_ms,
            "model_used": model_used,
            "cached": cached,
            "content_length": len(content),
            "content_preview": content[:100] if content else "",
            "is_empty": is_empty,
        }
    
    except requests.Timeout:
        elapsed_ms = (time.time() - start_time) * 1000
        return {
            "success": False,
            "error": "Timeout",
            "response_time_ms": elapsed_ms,
        }
    
    except Exception as e:
        elapsed_ms = (time.time() - start_time) * 1000
        return {
            "success": False,
            "error": str(e),
            "response_time_ms": elapsed_ms,
        }


def run_benchmark():
    """Run the benchmark."""
    print("=" * 80)
    print("Quantum Chimera LLM - Benchmark")
    print("=" * 80)
    print()
    
    results = []
    
    for i, test in enumerate(TEST_QUERIES, 1):
        print(f"[{i}/{len(TEST_QUERIES)}] Testing: {test['name']}")
        
        result = make_request(test["messages"])
        result["test_name"] = test["name"]
        results.append(result)
        
        # Print immediate result
        status = "✓ PASS" if result["success"] and not result.get("is_empty") else "✗ FAIL"
        print(f"    {status} - {result['response_time_ms']:.0f}ms - {result.get('model_used', 'N/A')}")
        
        if result.get("error"):
            print(f"    Error: {result['error']}")
        
        print()
    
    # Print summary
    print("=" * 80)
    print("Summary")
    print("=" * 80)
    
    total = len(results)
    successful = sum(1 for r in results if r["success"] and not r.get("is_empty"))
    failed = total - successful
    
    response_times = [r["response_time_ms"] for r in results if r["success"]]
    avg_response_time = sum(response_times) / len(response_times) if response_times else 0
    
    cache_hits = sum(1 for r in results if r.get("cached"))
    cache_hit_rate = (cache_hits / total) * 100
    
    kimi_fallbacks = sum(1 for r in results if "kimi" in r.get("model_used", "").lower())
    
    print(f"Total Requests:     {total}")
    print(f"Successful:         {successful}")
    print(f"Failed:             {failed}")
    print(f"Success Rate:       {(successful/total)*100:.1f}%")
    print(f"Avg Response Time:  {avg_response_time:.0f}ms")
    print(f"Cache Hit Rate:     {cache_hit_rate:.1f}%")
    print(f"Kimi Fallbacks:     {kimi_fallbacks}")
    print()
    
    # Detailed results table
    print("Detailed Results:")
    print("-" * 80)
    print(f"{'Test':<25} {'Status':<8} {'Time':<8} {'Model':<20} {'Preview'}")
    print("-" * 80)
    
    for r in results:
        status = "PASS" if r["success"] and not r.get("is_empty") else "FAIL"
        model = r.get("model_used", "N/A")[:18]
        preview = r.get("content_preview", "")[:30].replace("\n", " ")
        print(f"{r['test_name']:<25} {status:<8} {r['response_time_ms']:<8.0f} {model:<20} {preview}")
    
    print()
    
    # Exit with error code if more than 3 failures
    if failed > 3:
        print(f"ERROR: {failed} tests failed (threshold: 3)")
        sys.exit(1)
    
    print("Benchmark completed successfully!")
    sys.exit(0)


if __name__ == "__main__":
    run_benchmark()
