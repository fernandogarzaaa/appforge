#!/usr/bin/env node
/**
 * API Key Environment Validation Script
 * 
 * Validates that required API keys are present in the environment.
 * Run this script to check if all necessary keys are configured.
 * 
 * Usage: node scripts/validate_api_keys.cjs
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Required API keys for core functionality
const requiredKeys = [
  {
    name: 'OPENAI_API_KEY',
    description: 'OpenAI GPT-4 for general AI reasoning',
    required: true,
    url: 'https://platform.openai.com/api-keys'
  },
  {
    name: 'ANTHROPIC_API_KEY',
    description: 'Anthropic Claude-3 for advanced reasoning',
    required: true,
    url: 'https://console.anthropic.com/api-keys'
  }
];

// Optional API keys for enhanced functionality
const optionalKeys = [
  {
    name: 'GROQ_API_KEY',
    description: 'Groq for ultra-fast inference',
    required: false,
    url: 'https://console.groq.com/keys'
  },
  {
    name: 'GEMINI_API_KEY',
    description: 'Google Gemini for multimodal AI',
    required: false,
    url: 'https://aistudio.google.com/app/apikey'
  },
  {
    name: 'XAI_API_KEY',
    description: 'xAI Grok for real-time knowledge',
    required: false,
    url: 'https://console.x.ai/api-key'
  }
];

/**
 * Check if an API key is valid (non-empty and not a placeholder)
 */
function isValidKey(key, value) {
  if (!value || value.trim() === '') return false;
  if (value.startsWith('YOUR_') || value.includes('placeholder')) return false;
  // Basic pattern check for common API key formats
  return value.length >= 10;
}

/**
 * Load environment from .env.local file
 */
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log(`${colors.yellow}Warning: .env.local not found${colors.reset}`);
    return {};
  }
  
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return env;
}

/**
 * Validate all API keys
 */
function validateKeys() {
  console.log(`${colors.cyan}${colors.bold}`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🔐 API Key Environment Validation');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`${colors.reset}\n`);
  
  const env = loadEnvFile();
  let allRequiredPresent = true;
  let missingKeys = [];
  let presentKeys = [];
  
  // Check required keys
  console.log(`${colors.bold}📋 Required Keys:${colors.reset}`);
  console.log('─'.repeat(50));
  
  for (const keyInfo of requiredKeys) {
    const value = process.env[keyInfo.name] || env[keyInfo.name];
    const isPresent = isValidKey(keyInfo.name, value);
    
    if (isPresent) {
      presentKeys.push(keyInfo.name);
      console.log(`  ${colors.green}✓${colors.reset} ${keyInfo.name}`);
    } else {
      allRequiredPresent = false;
      missingKeys.push(keyInfo.name);
      console.log(`  ${colors.red}✗${colors.reset} ${keyInfo.name} ${colors.yellow}(missing)${colors.reset}`);
      console.log(`    → ${keyInfo.description}`);
      console.log(`    → Get key: ${keyInfo.url}`);
    }
  }
  
  console.log(`\n${colors.bold}📋 Optional Keys:${colors.reset}`);
  console.log('─'.repeat(50));
  
  for (const keyInfo of optionalKeys) {
    const value = process.env[keyInfo.name] || env[keyInfo.name];
    const isPresent = isValidKey(keyInfo.name, value);
    
    if (isPresent) {
      console.log(`  ${colors.green}✓${colors.reset} ${keyInfo.name}`);
    } else {
      console.log(`  ${colors.yellow}○${colors.reset} ${keyInfo.name} ${colors.reset}(not configured)`);
    }
  }
  
  // Summary
  console.log(`\n${colors.bold}═══════════════════════════════════════════════════════════════`);
  console.log('  Summary');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`${colors.reset}`);
  
  if (allRequiredPresent) {
    console.log(`${colors.green}✅ All required API keys are present!${colors.reset}`);
    console.log(`   Ready for real AI operations.\n`);
    return 0;
  } else {
    console.log(`${colors.red}❌ Missing required API keys:${colors.reset}`);
    missingKeys.forEach(key => console.log(`   - ${key}`));
    console.log(`\n   Please configure these keys before running AI operations.\n`);
    return 1;
  }
}

// Run validation
const exitCode = validateKeys();
process.exit(exitCode);
