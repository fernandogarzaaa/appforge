/**
 * Persistence Sync Verification Script
 * 
 * This script demonstrates how the persistence layer works:
 * 1. Saves data to backend via persistence API
 * 2. Clears localStorage to simulate a new device/session
 * 3. Loads data from backend, syncing it back to localStorage
 * 4. Verifies data persists across sessions
 */

import { persistenceService } from './src/api/services.js';
import { loadPersistedState, savePersistedState } from './src/services/persistenceStore.js';

// Test configuration
const STORAGE_KEY = 'appforge_test_integration';
const STATE_KEY = 'testIntegration';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${ step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test 1: Save state to backend
 */
async function testSaveState() {
  logStep('TEST 1', 'Save State to Backend');
  
  const testData = {
    integrations: [
      {
        id: 'github-' + Date.now(),
        name: 'GitHub',
        status: 'active',
        endpoint: 'https://api.github.com',
        createdAt: new Date().toISOString()
      },
      {
        id: 'gitlab-' + Date.now(),
        name: 'GitLab',
        status: 'pending',
        endpoint: 'https://gitlab.com/api',
        createdAt: new Date().toISOString()
      }
    ],
    metadata: {
      version: '1.0.0',
      lastSync: new Date().toISOString()
    }
  };

  log('Test data created:', 'blue');
  console.log(JSON.stringify(testData, null, 2));

  try {
    // Save using the persistence store helper
    await savePersistedState({
      storageKey: STORAGE_KEY,
      stateKey: STATE_KEY,
      value: testData
    });
    
    logSuccess('Data saved successfully');
    
    // Verify it's in localStorage
    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData) {
      logSuccess('Confirmed: Data exists in localStorage');
    }
    
    return true;
  } catch (error) {
    logError(`Failed to save: ${error.message}`);
    logWarning('Backend may not be running or authentication required');
    return false;
  }
}

/**
 * Test 2: Clear localStorage (simulate new device)
 */
async function testClearLocalStorage() {
  logStep('TEST 2', 'Clear localStorage (Simulate New Device)');
  
  const beforeData = localStorage.getItem(STORAGE_KEY);
  if (beforeData) {
    log(`Data before clear: ${beforeData.substring(0, 100)}...`, 'blue');
  }
  
  localStorage.removeItem(STORAGE_KEY);
  
  const afterData = localStorage.getItem(STORAGE_KEY);
  if (!afterData) {
    logSuccess('localStorage cleared successfully');
    return true;
  } else {
    logError('Failed to clear localStorage');
    return false;
  }
}

/**
 * Test 3: Load state from backend (should restore to localStorage)
 */
async function testLoadState() {
  logStep('TEST 3', 'Load State from Backend');
  
  try {
    const loadedData = await loadPersistedState({
      storageKey: STORAGE_KEY,
      stateKey: STATE_KEY,
      fallback: { integrations: [] }
    });
    
    if (loadedData && loadedData.integrations && loadedData.integrations.length > 0) {
      logSuccess('Data loaded from backend successfully');
      log('Loaded data:', 'blue');
      console.log(JSON.stringify(loadedData, null, 2));
      
      // Verify it's now back in localStorage
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        logSuccess('Data synced back to localStorage');
        return true;
      } else {
        logWarning('Data loaded but not in localStorage');
        return false;
      }
    } else {
      logWarning('No data loaded from backend (using fallback)');
      return false;
    }
  } catch (error) {
    logError(`Failed to load: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: Verify cross-session persistence
 */
async function testCrossSessionPersistence() {
  logStep('TEST 4', 'Verify Cross-Session Persistence');
  
  // Save original data
  const originalData = {
    integrations: [{
      id: 'cross-session-test',
      name: 'Cross-Session Test',
      timestamp: Date.now()
    }]
  };
  
  log('Saving original data...', 'blue');
  await savePersistedState({
    storageKey: STORAGE_KEY,
    stateKey: STATE_KEY,
    value: originalData
  });
  
  await delay(500);
  
  // Clear localStorage
  log('Clearing localStorage...', 'blue');
  localStorage.removeItem(STORAGE_KEY);
  
  await delay(500);
  
  // Load from backend
  log('Loading from backend...', 'blue');
  const restoredData = await loadPersistedState({
    storageKey: STORAGE_KEY,
    stateKey: STATE_KEY,
    fallback: { integrations: [] }
  });
  
  // Verify
  if (restoredData.integrations && 
      restoredData.integrations.some(i => i.id === 'cross-session-test')) {
    logSuccess('Cross-session persistence verified!');
    logSuccess('Data survives localStorage clear (backed by server)');
    return true;
  } else {
    logWarning('Cross-session persistence could not be verified');
    logWarning('Backend may not be persisting data (MongoDB not connected)');
    return false;
  }
}

/**
 * Test 5: API Direct Test
 */
async function testDirectAPI() {
  logStep('TEST 5', 'Direct API Communication Test');
  
  try {
    // Test health endpoint
    log('Testing /api/health...', 'blue');
    const response = await fetch('http://localhost:5000/api/health');
    if (response.ok) {
      const data = await response.json();
      logSuccess(`Backend health: ${data.status}`);
    }
    
    // Test persistence endpoint (will require auth)
    log('Testing /api/persistence/user-state...', 'blue');
    const persistResponse = await fetch('http://localhost:5000/api/persistence/user-state', {
      credentials: 'include'
    });
    
    if (persistResponse.status === 401) {
      logWarning('Persistence API requires authentication (expected)');
      log('To fully test: implement authentication flow', 'blue');
    } else if (persistResponse.ok) {
      logSuccess('Persistence API accessible without auth');
    }
    
    return true;
  } catch (error) {
    logError(`API test failed: ${error.message}`);
    logError('Make sure backend is running on http://localhost:5000');
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log('═══════════════════════════════════════════════════════', 'cyan');
  log('    AppForge Persistence Sync Verification Tests', 'cyan');
  log('═══════════════════════════════════════════════════════', 'cyan');
  
  log('\nNote: These tests require:', 'yellow');
  log('1. Backend running on http://localhost:5000', 'yellow');
  log('2. MongoDB connected (for full persistence)', 'yellow');
  log('3. Authentication (or auth bypass for testing)\n', 'yellow');
  
  const results = {
    total: 5,
    passed: 0,
    failed: 0
  };
  
  // Run all tests
  const tests = [
    { name: 'Save State', fn: testSaveState },
    { name: 'Clear localStorage', fn: testClearLocalStorage },
    { name: 'Load State', fn: testLoadState },
    { name: 'Cross-Session Persistence', fn: testCrossSessionPersistence },
    { name: 'Direct API', fn: testDirectAPI }
  ];
  
  for (const test of tests) {
    try {
      const passed = await test.fn();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
      await delay(1000); // Pause between tests
    } catch (error) {
      logError(`Test "${test.name}" threw error: ${error.message}`);
      results.failed++;
    }
  }
  
  // Summary
  log('\n═══════════════════════════════════════════════════════', 'cyan');
  log('                    Test Summary', 'cyan');
  log('═══════════════════════════════════════════════════════', 'cyan');
  log(`Total tests: ${results.total}`, 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  
  if (results.failed === 0) {
    log('\n✅ All tests passed! Persistence sync is working.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Check backend connectivity and MongoDB.', 'yellow');
  }
}

// Export for use in modules
export { runTests };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}
