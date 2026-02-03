#!/usr/bin/env node

/**
 * CI/CD Security Audit Runner
 * Runs security audit and blocks CI/CD if critical issues found
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BACKEND_DIR = join(__dirname, '..');
const AUDIT_SCRIPT = join(BACKEND_DIR, 'src', 'scripts', 'securityAudit.js');

console.log('🔒 Starting security audit...\n');

// Run security audit
const auditProcess = spawn('node', [AUDIT_SCRIPT], {
  cwd: BACKEND_DIR,
  stdio: 'inherit',
});

auditProcess.on('close', (code) => {
  console.log('\n' + '='.repeat(60));
  
  if (code === 0) {
    console.log('✅ Security audit passed - no critical issues found');
    console.log('='.repeat(60));
    process.exit(0);
  } else {
    console.log('❌ Security audit failed - critical issues detected');
    console.log('='.repeat(60));
    console.log('\n⚠️  Please review and fix the issues above before proceeding.\n');
    process.exit(1);
  }
});

auditProcess.on('error', (error) => {
  console.error('❌ Failed to run security audit:', error);
  process.exit(1);
});
