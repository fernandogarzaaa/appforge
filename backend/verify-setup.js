/**
 * Setup Verification Script
 * Verifies that all components are properly configured
 */

import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

console.log('\n' + '='.repeat(60));
console.log('🔍 VERIFYING QUANTUM LLM + BOT SYSTEM SETUP');
console.log('='.repeat(60) + '\n');

let allGood = true;

// Check Environment Variables
console.log('📋 Checking Environment Variables...\n');

const requiredEnvVars = {
  'OPENAI_API_KEY': 'OpenAI (REQUIRED)',
  'ANTHROPIC_API_KEY': 'Anthropic Claude (Recommended)',
  'GEMINI_API_KEY': 'Google Gemini (Recommended)',
  'GROK_API_KEY': 'X.AI Grok (Recommended)',
  'QUANTUM_DEFAULT_MODE': 'Quantum Mode',
  'MONGODB_URI': 'MongoDB Connection',
};

for (const [key, name] of Object.entries(requiredEnvVars)) {
  const value = process.env[key];
  if (value && value !== 'your-openai-api-key-here' && value !== 'your-anthropic-api-key-here' && value !== 'your-gemini-api-key-here' && value !== 'your-grok-api-key-here') {
    console.log(`  ✅ ${name}: Configured`);
    if (key.includes('KEY')) {
      console.log(`     Key: ${value.substring(0, 10)}...${value.substring(value.length - 4)}`);
    } else {
      console.log(`     Value: ${value}`);
    }
  } else {
    if (key === 'OPENAI_API_KEY') {
      console.log(`  ❌ ${name}: NOT CONFIGURED (REQUIRED!)`);
      allGood = false;
    } else {
      console.log(`  ⚠️  ${name}: Not configured (Optional)`);
    }
  }
}

console.log('\n' + '='.repeat(60));
console.log('📁 Checking Required Files...\n');

const requiredFiles = [
  { path: './src/models/Bot.js', name: 'Bot Model' },
  { path: './src/models/BotExecution.js', name: 'BotExecution Model' },
  { path: './src/models/BotKnowledge.js', name: 'BotKnowledge Model' },
  { path: './src/models/BotFeedback.js', name: 'BotFeedback Model' },
  { path: './src/routes/botRoutes.js', name: 'Bot Routes' },
  { path: './src/routes/webhookRoutes.js', name: 'Webhook Routes' },
  { path: './src/controllers/botController.js', name: 'Bot Controller' },
  { path: './src/services/botScheduler.js', name: 'Bot Scheduler' },
  { path: './src/services/quantumLLMService.js', name: 'Quantum LLM Service' },
  { path: './src/services/multiLLMService.js', name: 'Multi-LLM Service' },
  { path: './src/services/channelService.js', name: 'Channel Service' },
];

import { existsSync } from 'fs';

for (const file of requiredFiles) {
  if (existsSync(file.path)) {
    console.log(`  ✅ ${file.name}`);
  } else {
    console.log(`  ❌ ${file.name} - MISSING!`);
    allGood = false;
  }
}

console.log('\n' + '='.repeat(60));
console.log('📦 Checking Dependencies...\n');

import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
const dependencies = packageJson.dependencies || {};

const requiredDeps = ['node-cron', 'uuid', 'mongoose', 'express'];

for (const dep of requiredDeps) {
  if (dependencies[dep]) {
    console.log(`  ✅ ${dep}: ${dependencies[dep]}`);
  } else {
    console.log(`  ❌ ${dep}: NOT INSTALLED!`);
    allGood = false;
  }
}

console.log('\n' + '='.repeat(60));
console.log('⚙️  Configuration Summary\n');

const configuredProviders = [];
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
  configuredProviders.push('OpenAI');
}
if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your-anthropic-api-key-here') {
  configuredProviders.push('Claude');
}
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here') {
  configuredProviders.push('Gemini');
}
if (process.env.GROK_API_KEY && process.env.GROK_API_KEY !== 'your-grok-api-key-here') {
  configuredProviders.push('Grok');
}

console.log(`  Configured LLM Providers: ${configuredProviders.length}/4`);
console.log(`  Providers: ${configuredProviders.join(', ') || 'None'}`);
console.log(`  Quantum Mode: ${process.env.QUANTUM_DEFAULT_MODE || 'Not set'}`);
console.log(`  Default Model: ${process.env.OPENAI_MODEL || 'gpt-3.5-turbo'}`);

console.log('\n' + '='.repeat(60));

if (allGood && configuredProviders.length >= 1) {
  console.log('\n✅ SETUP VERIFICATION PASSED!\n');
  console.log('🚀 You can now start the server:\n');
  console.log('   npm run dev\n');
  console.log('📊 Expected logs on startup:');
  console.log('   - ✅ MongoDB connected');
  console.log(`   - [MultiLLMService] OpenAI: ✓ Configured`);
  if (configuredProviders.includes('Claude')) {
    console.log(`   - [MultiLLMService] Claude: ✓ Configured`);
  }
  if (configuredProviders.includes('Gemini')) {
    console.log(`   - [MultiLLMService] Gemini: ✓ Configured`);
  }
  if (configuredProviders.includes('Grok')) {
    console.log(`   - [MultiLLMService] Grok: ✓ Configured`);
  }
  console.log('   - [Base44Service] Quantum LLM mode: ENABLED ✓');
  console.log('   - ✅ Bot scheduler started\n');

  if (configuredProviders.length >= 3) {
    console.log('💡 Quantum Ensemble: ENABLED');
    console.log('   With ' + configuredProviders.length + ' providers, you\'ll get:');
    console.log('   - Hallucination detection');
    console.log('   - Multi-provider consensus');
    console.log('   - High accuracy responses\n');
  } else if (configuredProviders.length === 2) {
    console.log('💡 Quantum Ensemble: PARTIAL');
    console.log('   Add 1 more provider for full quantum consensus\n');
  } else {
    console.log('💡 Single Provider Mode');
    console.log('   Add more providers for quantum ensemble\n');
  }
} else {
  console.log('\n❌ SETUP VERIFICATION FAILED!\n');
  console.log('Please fix the issues above before starting the server.\n');
  process.exit(1);
}

console.log('='.repeat(60) + '\n');
