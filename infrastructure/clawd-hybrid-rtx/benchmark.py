#!/usr/bin/env python3
"""
CHIMERA QUANTUM LLM - Production Benchmark Suite
Tests the multi-model consensus system with various query types.
"""

import asyncio
import json
import time
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

import httpx

# Test queries covering different domains
TEST_QUERIES = [
    {
        "name": "Coding Question",
        "category": "coding",
        "messages": [
            {"role": "system", "content": "You are a helpful coding assistant."},
            {"role": "user", "content": "Write a Python function to reverse a linked list. Include comments and explain the time complexity."}
        ],
    },
    {
        "name": "Science Explanation",
        "category": "science",
        "messages": [
            {"role": "system", "content": "You are a scientific expert."},
            {"role": "user", "content": "Explain how CRISPR gene editing works in simple terms. What are its potential applications and ethical concerns?"}
        ],
    },
    {
        "name": "Creative Writing",
        "category": "creative",
        "messages": [
            {"role": "system", "content": "You are a creative writing assistant."},
            {"role": "user", "content": "Write a short poem about artificial intelligence and human creativity. Make it thought-provoking."}
        ],
    },
    {
        "name": "Data Analysis",
        "category": "analysis",
        "messages": [
            {"role": "system", "content": "You are an analytical assistant."},
            {"role": "user", "content": "Analyze the pros and cons of remote work vs office work for tech companies. Provide structured insights."}
        ],
    },
    {
        "name": "General Knowledge",
        "category": "general",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "What are the main differences between Python and JavaScript? When would you choose one over the other?"}
        ],
    },
    {
        "name": "Math Problem",
        "category": "science",
        "messages": [
            {"role": "system", "content": "You are a math tutor."},
            {"role": "user", "content": "Solve this step by step: If a train travels 120 km in 2 hours, and then 180 km in 3 hours, what is the average speed for the entire journey?"}
        ],
    },
    {
        "name": "Debugging Help",
        "category": "coding",
        "messages": [
            {"role": "system", "content": "You are a debugging expert."},
            {"role": "user", "content": "I'm getting a 'KeyError: user_id' in my Python dictionary. What does this mean and how do I fix it?"}
        ],
    },
    {
        "name": "Historical Analysis",
        "category": "analysis",
        "messages": [
            {"role": "system", "content": "You are a history expert."},
            {"role": "user", "content": "Compare the Industrial Revolution with the current AI revolution. What similarities and differences do you see?"}
        ],
    },
    {
        "name": "Product Description",
        "category": "creative",
        "messages": [
            {"role": "system", "content": "You are a marketing copywriter."},
            {"role": "user", "content": "Write a compelling product description for a smart water bottle that tracks hydration and reminds you to drink."}
        ],
    },
    {
        "name": "Technical Architecture",
        "category": "coding",
        "messages": [
            {"role": "system", "content": "You are a system architect."},
            {"role": "user", "content": "Design a scalable notification system that can handle 1 million users. What components would you need and why?"}
        ],
    },
]

BASE_URL = "http://localhost:7860"


async def test_health():
    """Test the health endpoint."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/health", timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Health check passed")
                print(f"   Status: {data.get('status', 'unknown')}")
                print(f"   Version: {data.get('version', 'unknown')}")
                print(f"   Models: {data.get('models_configured', 0)} primary, {data.get('fallback_models', 0)} fallback")
                print(f"   Modules: {', '.join(data.get('modules_active', []))}")
                return True
            else:
                print(f"❌ Health check failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Health check error: {e}")
            return False


async def test_models_endpoint():
    """Test the models endpoint."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/v1/models", timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                models = data.get('data', [])
                print(f"✅ Models endpoint working ({len(models)} models available)")
                return True
            else:
                print(f"❌ Models endpoint failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Models endpoint error: {e}")
            return False


async def test_chat_completion(query: dict, index: int) -> dict:
    """Test a single chat completion."""
    async with httpx.AsyncClient() as client:
        start_time = time.time()
        try:
            response = await client.post(
                f"{BASE_URL}/v1/chat/completions",
                json={
                    "model": "chimera-quantum",
                    "messages": query["messages"],
                    "temperature": 0.7,
                    "max_tokens": 512,
                },
                timeout=120.0,
            )
            elapsed = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                choices = data.get("choices", [])
                if choices:
                    content = choices[0].get("message", {}).get("content", "")
                    model_used = data.get("model", "unknown")
                    
                    # Check if response is valid
                    is_valid = len(content.strip()) > 20
                    
                    print(f"  [{index+1}/10] {query['name']}: {'✅' if is_valid else '⚠️'} ({elapsed:.1f}s) - {model_used}")
                    
                    return {
                        "name": query["name"],
                        "category": query["category"],
                        "success": True,
                        "valid": is_valid,
                        "response_time": elapsed,
                        "model": model_used,
                        "content_length": len(content),
                    }
                else:
                    print(f"  [{index+1}/10] {query['name']}: ❌ (no choices)")
                    return {"name": query["name"], "success": False, "error": "no_choices"}
            else:
                print(f"  [{index+1}/10] {query['name']}: ❌ HTTP {response.status_code}")
                return {"name": query["name"], "success": False, "error": f"http_{response.status_code}"}
                
        except Exception as e:
            elapsed = time.time() - start_time
            print(f"  [{index+1}/10] {query['name']}: ❌ Error ({elapsed:.1f}s): {str(e)[:50]}")
            return {"name": query["name"], "success": False, "error": str(e)}


async def run_benchmark():
    """Run the full benchmark suite."""
    print("=" * 60)
    print("CHIMERA QUANTUM LLM - Production Benchmark Suite")
    print("=" * 60)
    print()
    
    # Test health endpoint
    print("Testing Health Endpoint...")
    if not await test_health():
        print("\n❌ Server is not healthy. Please start the server first:")
        print("   python -m uvicorn src.chimera_server:app --host 0.0.0.0 --port 7860")
        return
    print()
    
    # Test models endpoint
    print("Testing Models Endpoint...")
    await test_models_endpoint()
    print()
    
    # Run chat completion tests
    print("Running Chat Completion Tests...")
    results = []
    for i, query in enumerate(TEST_QUERIES):
        result = await test_chat_completion(query, i)
        results.append(result)
        await asyncio.sleep(1)  # Rate limiting
    
    # Summary
    print()
    print("=" * 60)
    print("BENCHMARK SUMMARY")
    print("=" * 60)
    
    successful = [r for r in results if r.get("success")]
    valid_responses = [r for r in results if r.get("valid")]
    failed = [r for r in results if not r.get("success")]
    
    print(f"Total Tests: {len(results)}")
    print(f"Successful: {len(successful)} ({len(successful)/len(results)*100:.1f}%)")
    print(f"Valid Responses: {len(valid_responses)} ({len(valid_responses)/len(results)*100:.1f}%)")
    print(f"Failed: {len(failed)}")
    
    if successful:
        avg_time = sum(r.get("response_time", 0) for r in successful) / len(successful)
        print(f"Average Response Time: {avg_time:.1f}s")
    
    # Category breakdown
    print()
    print("By Category:")
    categories = {}
    for r in results:
        cat = r.get("category", "unknown")
        if cat not in categories:
            categories[cat] = {"total": 0, "success": 0}
        categories[cat]["total"] += 1
        if r.get("success"):
            categories[cat]["success"] += 1
    
    for cat, stats in sorted(categories.items()):
        pct = stats["success"] / stats["total"] * 100
        print(f"  {cat}: {stats['success']}/{stats['total']} ({pct:.0f}%)")
    
    if failed:
        print()
        print("Failed Tests:")
        for r in failed:
            error = r.get("error", "unknown")
            print(f"  - {r['name']}: {error}")
    
    # Save results
    results_file = Path("benchmark_results.json")
    with open(results_file, "w") as f:
        json.dump({
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "summary": {
                "total": len(results),
                "successful": len(successful),
                "valid": len(valid_responses),
                "failed": len(failed),
            },
            "results": results,
        }, f, indent=2)
    print()
    print(f"Results saved to: {results_file}")
    
    # Production readiness assessment
    print()
    print("=" * 60)
    print("PRODUCTION READINESS ASSESSMENT")
    print("=" * 60)
    
    readiness_score = len(valid_responses) / len(results)
    if readiness_score >= 0.9:
        print("✅ EXCELLENT: Ready for production deployment")
    elif readiness_score >= 0.7:
        print("⚠️ GOOD: Minor issues, review before production")
    elif readiness_score >= 0.5:
        print("⚠️ FAIR: Significant issues, needs improvement")
    else:
        print("❌ POOR: Not ready for production")
    
    print(f"Readiness Score: {readiness_score*100:.1f}%")


if __name__ == "__main__":
    try:
        asyncio.run(run_benchmark())
    except KeyboardInterrupt:
        print("\n\nBenchmark interrupted by user.")
        sys.exit(1)
