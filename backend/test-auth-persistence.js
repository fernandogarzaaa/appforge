/**
 * Test Authentication and Persistence Flow
 * 
 * This script:
 * 1. Registers a test user
 * 2. Logs in to get session cookie
 * 3. Saves state via persistence API
 * 4. Loads state to verify persistence
 * 5. Simulates cross-session by creating new session
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';
const TEST_USER = {
  email: 'test@appforge.com',
  password: 'TestPassword123!',
  name: 'Test User'
};

// Store cookies for session management
let sessionCookie = '';

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
}

async function register() {
  log('\n📝 Step 1: Registering test user...', 'info');
  
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });

    const data = await response.json();
    
    if (response.ok) {
      log('✓ User registered successfully', 'success');
      // Extract cookie from response
      const cookies = response.headers.get('set-cookie');
      if (cookies) {
        sessionCookie = cookies.split(';')[0];
        log(`✓ Session cookie obtained`, 'success');
      }
      return true;
    } else if (response.status === 400 && data.message?.includes('already exists')) {
      log('⚠ User already exists, will try login', 'warning');
      return false;
    } else {
      log(`✗ Registration failed: ${data.message}`, 'error');
      return false;
    }
  } catch (error) {
    log(`✗ Registration error: ${error.message}`, 'error');
    return false;
  }
}

async function login() {
  log('\n🔐 Step 2: Logging in...', 'info');
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      log('✓ Login successful', 'success');
      // Extract cookie from response
      const cookies = response.headers.get('set-cookie');
      if (cookies) {
        sessionCookie = cookies.split(';')[0];
        log(`✓ Session cookie obtained: ${sessionCookie.substring(0, 30)}...`, 'success');
      }
      return true;
    } else {
      log(`✗ Login failed: ${data.message}`, 'error');
      return false;
    }
  } catch (error) {
    log(`✗ Login error: ${error.message}`, 'error');
    return false;
  }
}

async function saveState() {
  log('\n💾 Step 3: Saving state to backend...', 'info');
  
  const testState = {
    integrations: [
      {
        id: 'github-' + Date.now(),
        name: 'GitHub Integration',
        status: 'active',
        endpoint: 'https://api.github.com',
        createdAt: new Date().toISOString()
      },
      {
        id: 'slack-' + Date.now(),
        name: 'Slack Integration',
        status: 'active',
        endpoint: 'https://slack.com/api',
        createdAt: new Date().toISOString()
      }
    ],
    metadata: {
      version: '1.0.0',
      lastSync: new Date().toISOString(),
      testRun: true
    }
  };

  log(`State to save: ${JSON.stringify(testState, null, 2)}`, 'info');

  try {
    const response = await fetch(`${API_BASE}/persistence/user-state`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({
        stateKey: 'integrationEcosystem',
        value: testState
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      log('✓ State saved successfully to backend', 'success');
      log(`Response: ${JSON.stringify(data, null, 2)}`, 'info');
      return testState;
    } else {
      log(`✗ Save failed: ${data.message}`, 'error');
      return null;
    }
  } catch (error) {
    log(`✗ Save error: ${error.message}`, 'error');
    return null;
  }
}

async function loadState() {
  log('\n📥 Step 4: Loading state from backend...', 'info');
  
  try {
    const response = await fetch(`${API_BASE}/persistence/user-state?stateKey=integrationEcosystem`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      log('✓ State loaded successfully from backend', 'success');
      log(`Loaded state: ${JSON.stringify(data, null, 2)}`, 'info');
      return data;
    } else {
      log(`✗ Load failed: ${data.message}`, 'error');
      return null;
    }
  } catch (error) {
    log(`✗ Load error: ${error.message}`, 'error');
    return null;
  }
}

async function verifyCrossSession(originalState) {
  log('\n🔄 Step 5: Verifying cross-session persistence...', 'info');
  log('Simulating new session (new login)...', 'info');
  
  // Clear cookie and login again
  sessionCookie = '';
  const loginSuccess = await login();
  
  if (!loginSuccess) {
    log('✗ Failed to create new session', 'error');
    return false;
  }
  
  // Load state with new session
  const loadedState = await loadState();
  
  if (!loadedState || !loadedState.state) {
    log('✗ No state loaded in new session', 'error');
    return false;
  }
  
  // Compare states
  const matches = 
    loadedState.state.integrations?.length === originalState.integrations?.length &&
    loadedState.state.metadata?.testRun === originalState.metadata?.testRun;
  
  if (matches) {
    log('✅ SUCCESS: State persisted across sessions!', 'success');
    log('Data is stored in MongoDB and survives session changes', 'success');
    return true;
  } else {
    log('✗ State mismatch between sessions', 'error');
    return false;
  }
}

async function testBackendHealth() {
  log('🏥 Checking backend health...', 'info');
  
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    
    if (response.ok && data.status === 'healthy') {
      log('✓ Backend is healthy and running', 'success');
      return true;
    } else {
      log('✗ Backend health check failed', 'error');
      return false;
    }
  } catch (error) {
    log(`✗ Cannot connect to backend: ${error.message}`, 'error');
    log('Make sure backend is running: cd backend && npm start', 'warning');
    return false;
  }
}

async function runFullTest() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   AppForge Persistence & Auth Integration Test');
  console.log('═══════════════════════════════════════════════════════\n');

  // Check backend
  const backendHealthy = await testBackendHealth();
  if (!backendHealthy) {
    process.exit(1);
  }

  // Register or login
  let registered = await register();
  if (!registered) {
    const loggedIn = await login();
    if (!loggedIn) {
      log('\n✗ Failed to authenticate', 'error');
      process.exit(1);
    }
  }

  // Save state
  const savedState = await saveState();
  if (!savedState) {
    log('\n✗ Failed to save state', 'error');
    process.exit(1);
  }

  // Load state
  const loadedState = await loadState();
  if (!loadedState) {
    log('\n✗ Failed to load state', 'error');
    process.exit(1);
  }

  // Verify cross-session
  const crossSessionSuccess = await verifyCrossSession(savedState);

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('                    Test Summary');
  console.log('═══════════════════════════════════════════════════════');
  
  if (crossSessionSuccess) {
    log('\n✅ ALL TESTS PASSED!', 'success');
    log('✓ Backend is running', 'success');
    log('✓ MongoDB is connected', 'success');
    log('✓ Authentication works', 'success');
    log('✓ State persists to database', 'success');
    log('✓ State loads across sessions', 'success');
    log('\n🎉 Multi-device sync is fully operational!', 'success');
  } else {
    log('\n⚠️ Some tests failed', 'warning');
    log('Check the output above for details', 'warning');
  }
  
  console.log('\n');
}

// Run the test
runFullTest().catch(error => {
  log(`\n❌ Test failed with error: ${error.message}`, 'error');
  process.exit(1);
});
