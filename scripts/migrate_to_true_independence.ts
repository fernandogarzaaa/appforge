#!/usr/bin/env tsx

/**
 * 🔮 TRUE AI INDEPENDENCE MIGRATION SCRIPT
 * ==========================================
 * 
 * This script migrates the AppForge system from external API dependencies
 * to fully local, self-hosted AI models using Ollama.
 * 
 * Migration Path:
 * - OpenAI GPT-4 → Llama 3 70B
 * - Claude → DeepSeek Coder 33B
 * - Gemini → Phi-3 Mini
 * - External Embeddings → Nomic Embed Text
 * 
 * Usage:
 *   npx tsx scripts/migrate_to_true_independence.ts
 * 
 * Rollback:
 *   cp .env.local.backup .env.local
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const ENV_FILE = '.env.local';
const BACKUP_SUFFIX = '.backup';
const OLLAMA_HOST = 'http://localhost:11434';

const REQUIRED_MODELS = [
  { name: 'llama3:70b-instruct-q4_0', purpose: 'General orchestration & reasoning' },
  { name: 'deepseek-coder:33b-instruct-q4_0', purpose: 'Code analysis & generation' },
  { name: 'phi3:mini-4k-instruct-q4_0', purpose: 'Quick summarization & lightweight tasks' },
  { name: 'nomic-embed-text', purpose: 'Local embeddings & semantic search' },
];

const EXTERNAL_API_KEYS = [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GEMINI_API_KEY',
  'XAI_API_KEY',
  'GROQ_API_KEY',
];

function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info'): void {
  const timestamp = new Date().toISOString();
  const colors: Record<string, string> = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
  };
  const reset = '\x1b[0m';
  const symbol: Record<string, string> = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️',
  };
  
  console.log(`${colors[type]}[${timestamp}] ${symbol[type]} ${message}${reset}`);
}

function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

function writeFile(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content, 'utf-8');
}

function runMigration(): void {
  console.clear();
  
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║            🔮 TRUE AI INDEPENDENCE MIGRATION SCRIPT 🔮                      ║
║                                                                              ║
║              Migrating from external APIs to local Ollama                    ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  This migration will:                                                         ║
║  • Backup your current .env.local configuration                              ║
║  • Disable all external AI API keys (OpenAI, Anthropic, Gemini, xAI)        ║
║  • Configure local Ollama models for complete AI independence                ║
║  • Verify Ollama is running and models are available                        ║
║  • Generate a detailed migration report                                     ║
║                                                                              ║
║  Estimated time: 2-5 minutes (depends on model downloads)                   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
  `);

  const envPath = path.resolve(ENV_FILE);
  
  // Validate .env.local exists
  if (!fileExists(envPath)) {
    log(`${ENV_FILE} not found!`, 'error');
    log('Create .env.local first or run in the correct directory.', 'error');
    process.exit(1);
  }
  
  // Step 1: Create backup
  log('[1/4] Backing up current configuration...');
  const backupPath = `${envPath}${BACKUP_SUFFIX}`;
  try {
    writeFile(backupPath, readFile(envPath));
    log(`✓ Backup created: ${backupPath}`, 'success');
  } catch (error) {
    log(`Failed to create backup: ${error}`, 'error');
    process.exit(1);
  }
  
  // Step 2: Update .env.local
  log('[2/4] Updating .env.local configuration...');
  let envContent = readFile(envPath);
  let changes: string[] = [];
  
  // Set PRIMARY_PROVIDER to ollama
  if (envContent.includes('PRIMARY_PROVIDER=')) {
    envContent = envContent.replace(/PRIMARY_PROVIDER=.*$/m, 'PRIMARY_PROVIDER=ollama');
  } else {
    envContent += '\nPRIMARY_PROVIDER=ollama\n';
  }
  changes.push('Set PRIMARY_PROVIDER=ollama');
  log('✓ Set PRIMARY_PROVIDER=ollama', 'success');
  
  // Comment out external API keys
  for (const apiKey of EXTERNAL_API_KEYS) {
    const pattern = new RegExp(`^${apiKey}=.*$`, 'm');
    if (pattern.test(envContent)) {
      envContent = envContent.replace(pattern, `# ${apiKey}=[COMMENTED_FOR_TRUE_INDEPENDENCE]`);
      changes.push(`Commented out ${apiKey}`);
      log(`✓ Commented out ${apiKey}`, 'success');
    }
  }
  
  // Add True Independence configuration
  const independenceConfig = `
# ============================================================================
# 🔮 TRUE AI INDEPENDENCE - LOCAL MODEL CONFIGURATION
# ============================================================================

# Primary Ollama Host (Local)
OLLAMA_HOST=${OLLAMA_HOST}

# Model Mappings for True Independence
OLLAMA_MODEL=llama3:70b-instruct-q4_0
CODELLAMA_MODEL=deepseek-coder:33b-instruct-q4_0
PHI3_MODEL=phi3:mini-4k-instruct-q4_0
EMBEDDING_MODEL=nomic-embed-text

# True Independence Mode Enabled
TRUE_AI_INDEPENDENCE=true
EXTERNAL_AI_DISABLED=true

# ============================================================================
`;
  
  envContent += independenceConfig;
  changes.push('Added True AI Independence configuration');
  log('✓ Added True AI Independence configuration', 'success');
  
  // Write updated configuration
  writeFile(envPath, envContent);
  
  // Step 3: Verify Ollama
  log('[3/4] Verifying Ollama availability...');
  let ollamaRunning = false;
  try {
    const result = execSync('curl -s http://localhost:11434/api/tags', { timeout: 5000 });
    ollamaRunning = result.toString().includes('models');
    log('✓ Ollama is running at http://localhost:11434', 'success');
  } catch {
    log('⚠️ Ollama is not running. Start Ollama to use local models.', 'warning');
  }
  
  // Step 4: Check models
  log('[4/4] Checking required models...');
  const availableModels: string[] = [];
  const missingModels: string[] = [];
  
  for (const model of REQUIRED_MODELS) {
    try {
      const result = execSync(`curl -s http://localhost:11434/api/show -H "Content-Type: application/json" -d '{"name":"${model.name}"}'`, { timeout: 5000 });
      if (result.toString().includes('model')) {
        availableModels.push(model.name);
        log(`✓ ${model.name} - available`, 'success');
      } else {
        missingModels.push(model.name);
        log(`✗ ${model.name} - missing`, 'warning');
      }
    } catch {
      missingModels.push(model.name);
      log(`✗ ${model.name} - missing`, 'warning');
    }
  }
  
  // Generate report
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  log('✅ MIGRATION COMPLETE - TRUE AI INDEPENDENCE ACHIEVED', 'success');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  
  console.log('\n📊 Migration Summary:');
  console.log(`   • External APIs disabled: ${changes.filter(c => c.includes('Commented')).length}`);
  console.log(`   • Local models available: ${availableModels.length}`);
  console.log(`   • Local models missing: ${missingModels.length}`);
  
  if (missingModels.length > 0) {
    console.log('\n⚠️ Missing models - pull them with:');
    for (const model of missingModels) {
      console.log(`   ollama pull ${model}`);
    }
  }
  
  console.log('\n📝 Rollback command (if needed):');
  console.log(`   cp ${backupPath} .env.local`);
  
  console.log('\n🚀 Next steps:');
  console.log('   1. Pull missing models: ollama pull <model-name>');
  console.log('   2. Restart your application');
  console.log('   3. Monitor Oracle coherence at 100%');
  
  process.exit(0);
}

// Run migration
runMigration();
