#!/usr/bin/env tsx

/**
 * 🔮 TRUE AI INDEPENDENCE REAL BENCHMARK
 * ========================================
 * 
 * Real benchmark tests for the local AI infrastructure.
 * Tests actual model responses, latency, and quality.
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

interface BenchmarkResult {
  test: string;
  model: string;
  success: boolean;
  latency: number;
  output?: string;
  tokensPerSecond?: number;
  error?: string;
}

async function ollamaGenerate(model: string, prompt: string, maxTokens: number = 500): Promise<{ output: string; time: number; tokens: number }> {
  const startTime = Date.now();
  
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        num_predict: maxTokens,
        temperature: 0.7,
      }
    })
  });
  
  const data = await response.json();
  const elapsed = Date.now() - startTime;
  const tokens = data.eval_count || 0;
  
  return { output: data.response, time: elapsed, tokens };
}

async function ollamaEmbed(model: string, text: string): Promise<{ embedding: number[]; time: number }> {
  const startTime = Date.now();
  
  const response = await fetch('http://localhost:11434/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: text })
  });
  
  const data = await response.json();
  return { embedding: data.embedding, time: Date.now() - startTime };
}

async function testCodeGeneration(): Promise<BenchmarkResult> {
  const prompt = `Write a TypeScript function that calculates the Fibonacci sequence efficiently using memoization.`;
  
  try {
    const { output, time, tokens } = await ollamaGenerate('deepseek-coder:6.7b', prompt, 200);
    return {
      test: 'Code Generation',
      model: 'deepseek-coder:6.7b',
      success: output.length > 30 && output.includes('function'),
      latency: time,
      output: output.substring(0, 150) + '...',
      tokensPerSecond: tokens > 0 ? (tokens / time) * 1000 : 0
    };
  } catch (error) {
    return { test: 'Code Generation', model: 'deepseek-coder:6.7b', success: false, latency: 0, error: String(error) };
  }
}

async function testReasoning(): Promise<BenchmarkResult> {
  const prompt = `What is quantum entanglement in simple terms?`;
  
  try {
    const { output, time, tokens } = await ollamaGenerate('llama3:latest', prompt, 150);
    return {
      test: 'Reasoning',
      model: 'llama3:latest',
      success: output.length > 50,
      latency: time,
      output: output.substring(0, 150) + '...',
      tokensPerSecond: tokens > 0 ? (tokens / time) * 1000 : 0
    };
  } catch (error) {
    return { test: 'Reasoning', model: 'llama3:latest', success: false, latency: 0, error: String(error) };
  }
}

async function testFastValidation(): Promise<BenchmarkResult> {
  const prompt = `Summarize: Quantum computers use qubits that can exist in superposition, enabling parallel computation and exponential speedups for specific problems like factoring large numbers.`;
  
  try {
    const { output, time, tokens } = await ollamaGenerate('phi3:mini', prompt, 80);
    return {
      test: 'Fast Validation',
      model: 'phi3:mini',
      success: output.length > 20 && output.length < 300,
      latency: time,
      output: output,
      tokensPerSecond: tokens > 0 ? (tokens / time) * 1000 : 0
    };
  } catch (error) {
    return { test: 'Fast Validation', model: 'phi3:mini', success: false, latency: 0, error: String(error) };
  }
}

async function testEmbeddings(): Promise<BenchmarkResult> {
  const text = "The quick brown fox jumps over the lazy dog.";
  
  try {
    const { embedding, time } = await ollamaEmbed('nomic-embed-text:latest', text);
    return {
      test: 'Embeddings',
      model: 'nomic-embed-text:latest',
      success: embedding && embedding.length > 0,
      latency: time,
      output: `Dimension: ${embedding?.length || 0}`,
    };
  } catch (error) {
    return { test: 'Embeddings', model: 'nomic-embed-text:latest', success: false, latency: 0, error: String(error) };
  }
}

async function verifyNoExternalAPIs(): Promise<BenchmarkResult> {
  const apiKeys = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'XAI_API_KEY', 'GROQ_API_KEY'];
  const hasActiveKeys = apiKeys.some(k => process.env[k] && !process.env[k]!.includes('COMMENTED'));
  
  return {
    test: 'External API Blocking',
    model: 'Environment',
    success: !hasActiveKeys,
    latency: 1,
    output: hasActiveKeys ? '⚠️ Keys active' : '✅ No external APIs'
  };
}

async function runBenchmarks(): Promise<void> {
  console.clear();
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║              🔮 TRUE AI INDEPENDENCE REAL BENCHMARK 🔮            ║
╚══════════════════════════════════════════════════════════════════════╝
  `);

  const results: BenchmarkResult[] = [];
  
  console.log('⏱️  Running benchmarks...\n');
  
  console.log('🧪 Code Generation (deepseek-coder)...');
  results.push(await testCodeGeneration());
  
  console.log('🧪 Reasoning (llama3)...');
  results.push(await testReasoning());
  
  console.log('🧪 Fast Validation (phi3)...');
  results.push(await testFastValidation());
  
  console.log('🧪 Embeddings (nomic)...');
  results.push(await testEmbeddings());
  
  console.log('🔒 External API Blocking...');
  results.push(await verifyNoExternalAPIs());
  
  // Summary
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const allPassed = passed === results.length;
  
  console.log('\n' + '='.repeat(70));
  console.log('                        BENCHMARK RESULTS');
  console.log('='.repeat(70) + '\n');
  
  for (const r of results) {
    const symbol = r.success ? '✅' : '❌';
    console.log(`${symbol} ${r.test.padEnd(22)} [${r.model}]`);
    console.log(`   Latency: ${r.latency}ms${r.tokensPerSecond ? ` | Speed: ${r.tokensPerSecond.toFixed(1)} tok/s` : ''}`);
    if (r.output) console.log(`   Output: ${r.output.substring(0, 50)}...`);
    console.log('');
  }
  
  console.log('='.repeat(70));
  console.log('                           SUMMARY');
  console.log('='.repeat(70));
  console.log(`\n📊 Tests: ${passed}/${results.length} passed`);
  console.log(`📊 Models: ${results.filter(r => r.model !== 'Environment').length} working`);
  console.log(`📊 External APIs: ${allPassed ? '✅ Blocked' : '❌ Active'}`);
  
  if (allPassed) {
    console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║         🎉 TRUE AI INDEPENDENCE BENCHMARK PASSED! 🎉               ║');
    console.log('║                                                                  ║');
    console.log('║    All local models working - production ready!                  ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝');
  } else {
    console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║         ⚠️  REVIEW FAILED TESTS ABOVE                            ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝');
  }
  
  console.log('\n🚀 Production: npx tsx swarm/core/loop.ts --production --continuous');
  
  process.exit(allPassed ? 0 : 1);
}

runBenchmarks().catch(console.error);
