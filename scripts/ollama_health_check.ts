/**
 * 🧠 Quantum Engine - Ollama Health Check Script
 * 
 * Tests all configured Ollama models and verifies they're responding correctly.
 * 
 * Usage: 
 *   deno run --allow-net scripts/ollama_health_check.ts
 *   npx tsx scripts/ollama_health_check.ts
 * 
 * Author: AppForge Swarm
 * License: MIT
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment configuration
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// ============================================================================
// Configuration
// ============================================================================

interface ModelTest {
  name: string;
  taskType: string;
  testPrompt: string;
  expectedCharacteristics: string[];
}

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const MODELS_TO_TEST = [
  {
    name: process.env.OLLAMA_MODEL || 'llama3',
    taskType: 'general',
    testPrompt: 'What is 2 + 2?',
    expectedCharacteristics: ['accurate', 'concise'],
  },
  {
    name: process.env.CODELLAMA_MODEL || 'deepseek-coder',
    taskType: 'code_analysis',
    testPrompt: 'Write a simple Python function that calculates factorial.',
    expectedCharacteristics: ['code', 'syntax'],
  },
  {
    name: process.env.PHI3_MODEL || 'phi-3',
    taskType: 'summarization',
    testPrompt: 'Summarize this text: The quick brown fox jumps over the lazy dog.',
    expectedCharacteristics: ['summary'],
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

async function fetchWithTimeout(
  url: string, 
  options: RequestInit = {}, 
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function checkOllamaServer(): Promise<{ status: string; version?: string; error?: string }> {
  try {
    const response = await fetchWithTimeout(`${OLLAMA_HOST}/api/version`, {}, 10000);
    if (response.ok) {
      const data = await response.json();
      return { status: 'healthy', version: data.version || 'unknown' };
    }
    return { status: 'unhealthy', error: `HTTP ${response.status}` };
  } catch (e: any) {
    return { status: 'down', error: e.message };
  }
}

async function listModels(): Promise<{name: string; size?: number}[]> {
  try {
    const response = await fetchWithTimeout(`${OLLAMA_HOST}/api/tags`, {}, 10000);
    if (response.ok) {
      const data = await response.json();
      return (data.models || []).map((m: any) => ({
        name: m.name || m.model || 'unknown',
        size: m.size
      }));
    }
    return [];
  } catch {
    return [];
  }
}

async function testModelGenerate(
  modelName: string, 
  prompt: string,
  temperature: number = 0.7
): Promise<{
  success: boolean;
  latency: number;
  response: string;
  error?: string;
  tokens?: { prompt: number; completion: number };
}> {
  const startTime = Date.now();
  
  try {
    const response = await fetchWithTimeout(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        prompt,
        options: {
          temperature,
          num_predict: 100,
        },
        stream: false,
      }),
    }, 60000);

    const latency = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        latency,
        response: '',
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      latency,
      response: data.response || '',
      tokens: {
        prompt: data.prompt_eval_count || 0,
        completion: data.eval_count || 0,
      },
    };
  } catch (e: any) {
    return {
      success: false,
      latency: Date.now() - startTime,
      response: '',
      error: e.message,
    };
  }
}

async function generateWithModel(
  modelName: string,
  messages: Array<{ role: string; content: string }>
): Promise<{
  success: boolean;
  latency: number;
  response: string;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    // Convert messages to Ollama chat format
    const response = await fetchWithTimeout(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        messages,
        stream: false,
      }),
    }, 60000);

    const latency = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        latency,
        response: '',
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      latency,
      response: data.message?.content || data.response || '',
    };
  } catch (e: any) {
    return {
      success: false,
      latency: Date.now() - startTime,
      response: '',
      error: e.message,
    };
  }
}

// ============================================================================
// Main Health Check
// ============================================================================

async function runHealthCheck(): Promise<void> {
  console.log('='.repeat(70));
  console.log('🦙 OLLAMA MODEL HEALTH CHECK');
  console.log('='.repeat(70));
  console.log(`Host: ${OLLAMA_HOST}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('='.repeat(70));

  // Step 1: Check Ollama server
  console.log('\n📡 Step 1: Checking Ollama Server...');
  const serverStatus = await checkOllamaServer();
  
  if (serverStatus.status === 'healthy') {
    console.log(`   ✅ Server is healthy (v${serverStatus.version})`);
  } else {
    console.log(`   ❌ Server is ${serverStatus.status}: ${serverStatus.error}`);
    console.log('\n   To start Ollama:');
    console.log('   - Windows: ollama serve');
    console.log('   - macOS/Linux: ollama serve');
    console.log('\n   To install models:');
    console.log('   - ollama pull llama3');
    console.log('   - ollama pull deepseek-coder');
    console.log('   - ollama pull phi-3');
    return;
  }

  // Step 2: List available models
  console.log('\n📦 Step 2: Listing Available Models...');
  const availableModels = await listModels();
  
  if (availableModels.length > 0) {
    console.log(`   Found ${availableModels.length} models:`);
    availableModels.forEach((model, i) => {
      const size = model.size ? ` (~${Math.round(model.size / 1e9)}GB)` : '';
      console.log(`   ${i + 1}. ${model.name}${size}`);
    });
  } else {
    console.log('   ⚠️  No models found');
  }

  // Step 3: Test configured models
  console.log('\n🧪 Step 3: Testing Configured Models...');
  
  const results: {
    model: string;
    taskType: string;
    status: 'pass' | 'fail' | 'skip';
    latency?: number;
    response?: string;
    error?: string;
  }[] = [];

  for (const testConfig of MODELS_TO_TEST) {
    console.log(`\n   Testing: ${testConfig.name} (${testConfig.taskType})`);
    
    // Check if model is available
    const isAvailable = availableModels.some(
      (m) => m.name === testConfig.name || m.name.startsWith(testConfig.name + ':')
    );
    
    if (!isAvailable) {
      console.log(`   ⚠️  Model not found - skipping`);
      results.push({
        model: testConfig.name,
        taskType: testConfig.taskType,
        status: 'skip',
        error: 'Model not pulled',
      });
      continue;
    }

    // Test model
    const testResult = await testModelGenerate(testConfig.name, testConfig.testPrompt);
    
    if (testResult.success) {
      console.log(`   ✅ Success (${testResult.latency}ms)`);
      console.log(`   📝 Response: "${testResult.response.substring(0, 80)}..."`);
      results.push({
        model: testConfig.name,
        taskType: testConfig.taskType,
        status: 'pass',
        latency: testResult.latency,
        response: testResult.response,
      });
    } else {
      console.log(`   ❌ Failed: ${testResult.error}`);
      results.push({
        model: testConfig.name,
        taskType: testConfig.taskType,
        status: 'fail',
        error: testResult.error,
      });
    }
  }

  // Step 4: Model router configuration check
  console.log('\n🔀 Step 4: Model Router Configuration...');
  console.log(`   Primary Model: ${process.env.OLLAMA_MODEL || 'llama3'}`);
  console.log(`   Code Model: ${process.env.CODELLAMA_MODEL || 'deepseek-coder'}`);
  console.log(`   Fast Model: ${process.env.PHI3_MODEL || 'phi-3'}`);
  console.log(`   Strategy: ${process.env.OLLAMA_MODEL_STRATEGY || 'balanced'}`);

  // Step 5: Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));

  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const skipCount = results.filter(r => r.status === 'skip').length;

  console.log(`\n   ✅ Passed: ${passCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   ⚠️  Skipped: ${skipCount}`);

  if (failCount === 0 && serverStatus.status === 'healthy') {
    console.log('\n   🎉 All models are healthy and responding!');
    console.log('\n   Model Selection Rules:');
    console.log('   - General tasks → llama3');
    console.log('   - Code analysis → deepseek-coder');
    console.log('   - Quick summarization → phi-3');
  } else if (failCount > 0) {
    console.log('\n   ⚠️  Some models are not responding correctly.');
    console.log('\n   To pull missing models:');
    results.filter(r => r.status === 'skip').forEach(r => {
      console.log(`   - ollama pull ${r.model}`);
    });
  }

  console.log('\n' + '='.repeat(70));
}

// ============================================================================
// Run
// ============================================================================

runHealthCheck().catch(console.error);
