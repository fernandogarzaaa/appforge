#!/usr/bin/env node

/**
 * Initialize API Key Rotation on Server Startup
 * Sets up automated rotation scheduler and cleanup jobs
 */

import { initializeRotationScheduler } from '../src/services/apiKeyRotation.js';

console.log('🔑 Initializing API Key Rotation Service...');

try {
  initializeRotationScheduler();
  console.log('✅ API Key Rotation Service initialized successfully');
  console.log('   - 90-day rotation schedule configured');
  console.log('   - 24-hour cleanup job started');
  console.log('   - Notification system ready');
} catch (error) {
  console.error('❌ Failed to initialize API Key Rotation Service:', error.message);
  process.exit(1);
}
