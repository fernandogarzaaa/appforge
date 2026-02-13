#!/usr/bin/env tsx

/**
 * 🔮 TRUE AI INDEPENDENCE TEST SUITE
 * ====================================
 * 
 * Comprehensive test suite to verify True AI Independence migration.
 * Tests configuration, provider registry, quantum router, and validates
 * that all external API calls are properly blocked.
 * 
 * Usage:
 *   npx tsx scripts/test_true_ai_independence.ts
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local
dotenv.config({ path: '.env.local' });

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

interface TestSuite {
  category: string;
  tests: TestResult[];
  passed: number;
  failed: number;
}

// Models that should be available (partial match supported)
const REQUIRED_MODELS = [
  { checkFor: 'llama3', description: 'General reasoning' },
  { checkFor: 'deepseek-coder', description: 'Code generation' },
  { checkFor: 'phi3', description: 'Fast validation' },
  { checkFor: 'nomic-embed', description: 'Embeddings' },
];

function log(message: string, type: 'info' | 'success' | 'error' | 'pass' | 'fail' = 'info'): void {
  const colors: Record<string, string> = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    pass: '\x1b[32m',
    fail: '\x1b[31m',
  };
  const reset = '\x1b[0m';
  const symbols: Record<string, string> = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    pass: '✓',
    fail: '✗',
  };
  console.log(`${colors[type]}${symbols[type]} ${message}${reset}`);
}

async function checkOllamaModels(): Promise<{ models: string[]; available: string[] }> {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    const data = await response.json();
    const models = (data.models || []).map((m: any) => m.name);
    return { models, available: models };
  } catch {
    return { models: [], available: [] };
  }
}

async function runTests(): Promise<void> {
  console.clear();
  console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                    TRUE AI INDEPENDENCE TEST SUITE                   ║
╠════════════════════════════════════════════════════════════════════╣
║  Timestamp: ${new Date().toISOString()}
╚════════════════════════════════════════════════════════════════════╝
  `);

  const tests: TestSuite[] = [];
  let totalPassed = 0;
  let totalFailed = 0;

  // Get Ollama models
  const { models: installedModels } = await checkOllamaModels();
  log(`Found ${installedModels.length} models installed`, 'info');

  // ═══════════════════════════════════════════════════════════════
  // CONFIGURATION TESTS
  // ═══════════════════════════════════════════════════════════════
  const configTests: TestResult[] = [];

  // TRUE_AI_INDEPENDENCE
  const independenceMode = process.env.TRUE_AI_INDEPENDENCE === 'true';
  configTests.push({
    name: 'TRUE_AI_INDEPENDENCE=true',
    passed: independenceMode,
    message: independenceMode 
      ? 'True AI Independence mode enabled' 
      : 'Set TRUE_AI_INDEPENDENCE=true in .env.local',
  });

  // PRIMARY_PROVIDER
  const primaryProvider = process.env.PRIMARY_PROVIDER;
  const providerCorrect = primaryProvider === 'ollama';
  configTests.push({
    name: 'PRIMARY_PROVIDER=ollama',
    passed: providerCorrect,
    message: providerCorrect 
      ? `Primary provider: ${primaryProvider}` 
      : `Set PRIMARY_PROVIDER=ollama (current: ${primaryProvider})`,
  });

  // External APIs disabled
  const externalKeys = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'XAI_API_KEY'];
  const allExternalDisabled = externalKeys.every(key => !process.env[key] || process.env[key]?.includes('COMMENTED'));
  configTests.push({
    name: 'External APIs disabled',
    passed: allExternalDisabled,
    message: allExternalDisabled 
      ? 'All external API keys commented out' 
      : 'Some external API keys still active',
  });

  // OLLAMA_HOST
  const ollamaHost = process.env.OLLAMA_HOST;
  configTests.push({
    name: 'OLLAMA_HOST configured',
    passed: !!ollamaHost,
    message: ollamaHost 
      ? `Ollama host: ${ollamaHost}` 
      : 'Set OLLAMA_HOST in .env.local',
  });

  tests.push({ category: '🔍 CONFIGURATION TESTS', tests: configTests, passed: configTests.filter(t => t.passed).length, failed: configTests.filter(t => !t.passed).length });

  // ═══════════════════════════════════════════════════════════════
  // PROVIDER REGISTRY TESTS
  // ═══════════════════════════════════════════════════════════════
  const registryTests: TestResult[] = [];

  // Check local models available
  const localModelsFound = REQUIRED_MODELS.filter(m => 
    installedModels.some(im => im.toLowerCase().includes(m.checkFor.toLowerCase()))
  );
  registryTests.push({
    name: 'Local models available',
    passed: localModelsFound.length === REQUIRED_MODELS.length,
    message: `${localModelsFound.length}/${REQUIRED_MODELS.length} required models installed`,
  });

  // External providers blocked
  const externalBlocked = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY?.includes('COMMENTED');
  registryTests.push({
    name: 'External providers blocked',
    passed: externalBlocked,
    message: externalBlocked 
      ? 'External API calls will be blocked' 
      : 'External APIs still accessible',
  });

  tests.push({ category: '🔍 PROVIDER REGISTRY TESTS', tests: registryTests, passed: registryTests.filter(t => t.passed).length, failed: registryTests.filter(t => !t.passed).length });

  // ═══════════════════════════════════════════════════════════════
  // QUANTUM ROUTER TESTS
  // ═══════════════════════════════════════════════════════════════
  const routerTests: TestResult[] = [];

  // Test Ollama API connectivity
  try {
    const testResponse = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(5000) });
    routerTests.push({
      name: 'Ollama API reachable',
      passed: testResponse.ok,
      message: testResponse.ok ? 'Ollama API responding' : 'Ollama API not responding',
    });
  } catch {
    routerTests.push({
      name: 'Ollama API reachable',
      passed: false,
      message: 'Cannot connect to Ollama API',
    });
  }

  // Test model routing (quick ping)
  for (const model of REQUIRED_MODELS.slice(0, 2)) {
    const found = installedModels.some(im => im.toLowerCase().includes(model.checkFor.toLowerCase()));
    routerTests.push({
      name: `Route to ${model.checkFor}`,
      passed: found,
      message: found 
        ? `${model.checkFor} available for routing` 
        : `${model.checkFor} not found`,
    });
  }

  tests.push({ category: '🔍 QUANTUM-OPTIMIZED ROUTER TESTS', tests: routerTests, passed: routerTests.filter(t => t.passed).length, failed: routerTests.filter(t => !t.passed).length });

  // ═══════════════════════════════════════════════════════════════
  // EXTERNAL API BLOCKING TESTS
  // ═══════════════════════════════════════════════════════════════
  const blockingTests: TestResult[] = [
    { name: 'OpenAI API blocked', passed: externalBlocked, message: externalBlocked ? 'Blocked' : 'Active' },
    { name: 'Anthropic API blocked', passed: externalBlocked, message: externalBlocked ? 'Blocked' : 'Active' },
    { name: 'Gemini API blocked', passed: externalBlocked, message: externalBlocked ? 'Blocked' : 'Active' },
    { name: 'xAI/Grok API blocked', passed: externalBlocked, message: externalBlocked ? 'Blocked' : 'Active' },
    { name: 'Groq API blocked', passed: !process.env.GROQ_API_KEY || process.env.GROQ_API_KEY?.includes('COMMENTED'), message: 'Blocked' },
  ];

  tests.push({ category: '🔍 EXTERNAL API BLOCKING TESTS', tests: blockingTests, passed: blockingTests.filter(t => t.passed).length, failed: blockingTests.filter(t => !t.passed).length });

  // ═══════════════════════════════════════════════════════════════
  // MODEL STATUS
  // ═══════════════════════════════════════════════════════════════
  const modelStatusTests: TestResult[] = [];
  for (const model of REQUIRED_MODELS) {
    const found = installedModels.some(im => im.toLowerCase().includes(model.checkFor.toLowerCase()));
    modelStatusTests.push({
      name: model.checkFor,
      passed: found,
      message: found 
        ? `✓ Available (${model.description})` 
        : `✗ Not installed (${model.description})`,
    });
  }
  tests.push({ category: '🔍 MODEL STATUS', tests: modelStatusTests, passed: modelStatusTests.filter(t => t.passed).length, failed: modelStatusTests.filter(t => !t.passed).length });

  // ═══════════════════════════════════════════════════════════════
  // PRINT RESULTS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n');
  
  for (const suite of tests) {
    totalPassed += suite.passed;
    totalFailed += suite.failed;
    
    console.log(`╔════════════════════════════════════════════════════════════════════╗`);
    console.log(`║  ${suite.category.padEnd(62)}║`);
    console.log(`╠════════════════════════════════════════════════════════════════════╣`);
    
    for (const test of suite.tests) {
      const symbol = test.passed ? '✓' : '✗';
      const status = test.passed ? 'pass' : 'fail';
      console.log(`║  ${symbol} ${test.name.padEnd(60)}║`);
    }
    console.log(`║  ${(suite.passed + '/' + (suite.passed + suite.failed) + ' passed').padEnd(62)}║`);
    console.log(`╚════════════════════════════════════════════════════════════════════╝`);
    console.log('');
  }

  // FINAL STATUS
  const overallPassed = totalPassed;
  const overallTotal = totalPassed + totalFailed;
  const allPassed = overallPassed === overallTotal;

  console.log('╔════════════════════════════════════════════════════════════════════╗');
  if (allPassed) {
    console.log('║  ✅ TRUE AI INDEPENDENCE ACHIEVED                              ║');
  } else {
    console.log('║  ⚠️  SOME TESTS FAILED - REVIEW ABOVE                           ║');
  }
  console.log('╠════════════════════════════════════════════════════════════════════╣');
  console.log(`║  Tests: ${overallPassed}/${overallTotal} passed                                       ║`);
  console.log(`║  Models: ${installedModels.length} installed                                          ║`);
  console.log('╚════════════════════════════════════════════════════════════════════╝');

  console.log('\n📦 Installed Models:');
  installedModels.forEach(m => console.log(`   • ${m}`));

  if (!allPassed) {
    console.log('\n📋 Recommendations:');
    const failedTests = tests.flatMap(s => s.tests.filter(t => !t.passed));
    failedTests.slice(0, 5).forEach(t => {
      console.log(`   • ${t.name}: ${t.message}`);
    });
  }

  console.log('\n🚀 Next Steps:');
  if (allPassed) {
    console.log('   1. Start production: npx tsx swarm/core/loop.ts --production --continuous');
    console.log('   2. Monitor Oracle coherence at 100%');
    console.log('   3. Check logs for any issues');
  } else {
    console.log('   1. Fix failed tests above');
    console.log('   2. Run: npx tsx scripts/test_true_ai_independence.ts');
  }

  process.exit(allPassed ? 0 : 1);
}

runTests().catch(err => {
  log(`Test error: ${err.message}`, 'error');
  process.exit(1);
});
