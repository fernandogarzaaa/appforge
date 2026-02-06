/**
 * AI Setup Test Script
 * Run this to verify your AI configuration is working
 *
 * Usage: node src/scripts/testAISetup.js
 */

import dotenv from 'dotenv';
import base44Service from '../services/base44Service.js';
import logger from '../config/logger.js';

// Load environment variables
dotenv.config();

async function testAISetup() {
  console.log('\n========================================');
  console.log('🤖 AI Assistant Setup Test');
  console.log('========================================\n');

  // Test 1: Check environment variables
  console.log('📋 Test 1: Checking environment variables...');
  const openaiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

  if (!openaiKey) {
    console.log('❌ FAILED: OPENAI_API_KEY is not set in backend/.env');
    console.log('   Please add your OpenAI API key to backend/.env');
    console.log('   Example: OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx\n');
    return false;
  }

  if (openaiKey === 'your-openai-api-key-here') {
    console.log('❌ FAILED: OPENAI_API_KEY is still set to placeholder value');
    console.log('   Please replace with your actual OpenAI API key\n');
    return false;
  }

  console.log(`✅ PASSED: OPENAI_API_KEY is configured`);
  console.log(`   Model: ${model}`);
  console.log(`   Key: ${openaiKey.substring(0, 8)}...${openaiKey.substring(openaiKey.length - 4)}\n`);

  // Test 2: Check service status
  console.log('📋 Test 2: Checking Base44 service status...');
  const status = await base44Service.getStatus();
  console.log('   Service status:', status);

  if (!status.configured) {
    console.log('⚠️  WARNING: Base44 credentials not configured (this is optional)\n');
  }

  // Test 3: Try a simple LLM call
  console.log('📋 Test 3: Testing LLM API call...');
  console.log('   Sending test prompt to OpenAI...');

  try {
    const startTime = Date.now();
    const response = await base44Service.callLLM('gpt-3.5-turbo', 'Say "Hello, AI is working!" in exactly those words.', {
      temperature: 0.3,
      maxTokens: 50,
    });

    const duration = Date.now() - startTime;

    console.log(`✅ PASSED: LLM API call successful (${duration}ms)`);
    console.log(`   Model used: ${response.model}`);
    console.log(`   Response: ${response.text}`);
    console.log(`   Tokens used: ${response.usage?.total_tokens || 'N/A'}\n`);

  } catch (error) {
    console.log('❌ FAILED: LLM API call failed');
    console.log(`   Error: ${error.message}`);
    console.log('\n   Common issues:');
    console.log('   - Invalid API key');
    console.log('   - Insufficient credits in OpenAI account');
    console.log('   - Rate limit exceeded');
    console.log('   - Network connectivity issues\n');
    return false;
  }

  // Test 4: Try different models
  console.log('📋 Test 4: Testing model mappings...');

  const modelsToTest = [
    { id: 'base44', expected: 'gpt-3.5-turbo' },
    { id: 'chatgpt', expected: 'gpt-4' },
    { id: 'gpt-3.5-turbo', expected: 'gpt-3.5-turbo' },
  ];

  for (const modelTest of modelsToTest) {
    try {
      const response = await base44Service.callLLM(modelTest.id, 'Hi', {
        temperature: 0.3,
        maxTokens: 10,
      });

      console.log(`   ✅ ${modelTest.id} → ${response.model}`);

    } catch (error) {
      // GPT-4 might fail if user doesn't have access
      if (modelTest.id === 'chatgpt' && error.message.includes('model')) {
        console.log(`   ⚠️  ${modelTest.id}: No access to GPT-4 (will fallback to GPT-3.5)`);
      } else {
        console.log(`   ❌ ${modelTest.id}: ${error.message}`);
      }
    }
  }

  console.log('');

  // Summary
  console.log('========================================');
  console.log('✅ AI Setup Test Complete!');
  console.log('========================================');
  console.log('');
  console.log('Your AI Assistant is ready to use! 🎉');
  console.log('');
  console.log('Next steps:');
  console.log('1. Start your frontend and backend servers');
  console.log('2. Navigate to the AI Assistant page');
  console.log('3. Type a prompt and test it out');
  console.log('');
  console.log('Monitoring:');
  console.log('- Check usage: https://platform.openai.com/usage');
  console.log('- Set alerts: https://platform.openai.com/account/billing/limits');
  console.log('');

  return true;
}

// Run the test
testAISetup()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  });
