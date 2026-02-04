#!/usr/bin/env node
/**
 * AppForge Backend API Integration Test Suite
 * Tests all 6 AI endpoints
 */

const http = require('http');
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
let testToken = null;

// Helper to make HTTP requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(testToken && { 'Authorization': `Bearer ${testToken}` }),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data ? JSON.parse(data) : null,
        });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Test runner
async function runTests() {
  console.log(`${colors.cyan}
  ╔════════════════════════════════════════╗
  ║  AppForge Backend Integration Tests    ║
  ╚════════════════════════════════════════╝
${colors.reset}`);

  let passed = 0;
  let failed = 0;

  // Test 1: Health Check
  console.log(`\n${colors.blue}[TEST 1]${colors.reset} Health Check`);
  try {
    const response = await makeRequest('GET', '/health');
    if (response.status === 200 && response.body.status === 'ok') {
      console.log(`${colors.green}✓ PASSED${colors.reset} - Server is healthy`);
      passed++;
    } else {
      console.log(`${colors.red}✗ FAILED${colors.reset} - Unexpected response`);
      failed++;
    }
  } catch (err) {
    console.log(`${colors.red}✗ FAILED${colors.reset} - ${err.message}`);
    console.log(`${colors.yellow}  Make sure server is running on ${BASE_URL}${colors.reset}`);
    failed++;
  }

  // Test 2: Generate Test Token
  console.log(`\n${colors.blue}[TEST 2]${colors.reset} Generate JWT Token`);
  try {
    const response = await makeRequest('POST', '/api/auth/test-token', {
      userId: 1,
      email: 'test@appforge.fun',
    });

    if (response.status === 200 && response.body.token) {
      testToken = response.body.token;
      console.log(`${colors.green}✓ PASSED${colors.reset} - Token generated`);
      console.log(`  Token: ${testToken.substring(0, 20)}...`);
      passed++;
    } else {
      console.log(`${colors.red}✗ FAILED${colors.reset} - Could not generate token`);
      failed++;
    }
  } catch (err) {
    console.log(`${colors.red}✗ FAILED${colors.reset} - ${err.message}`);
    failed++;
  }

  if (!testToken) {
    console.log(`${colors.yellow}⚠️  Skipping AI tests - no valid token${colors.reset}`);
    process.exit(1);
  }

  // Test 3: Generate Code
  console.log(`\n${colors.blue}[TEST 3]${colors.reset} Generate Code`);
  try {
    const response = await makeRequest('POST', '/api/ai/generate-code', {
      description: 'A simple function that adds two numbers together',
      language: 'javascript',
      complexity: 'simple',
    });

    if (response.status === 200 && response.body.success && response.body.code) {
      console.log(`${colors.green}✓ PASSED${colors.reset} - Code generated`);
      console.log(`  Lines: ${response.body.code.split('\n').length}`);
      console.log(`  Tokens: ${response.body.tokens.output}`);
      passed++;
    } else {
      console.log(`${colors.red}✗ FAILED${colors.reset} - ${response.body?.error || 'Unexpected response'}`);
      failed++;
    }
  } catch (err) {
    console.log(`${colors.red}✗ FAILED${colors.reset} - ${err.message}`);
    failed++;
  }

  // Test 4: Explain Code
  console.log(`\n${colors.blue}[TEST 4]${colors.reset} Explain Code`);
  try {
    const response = await makeRequest('POST', '/api/ai/explain-code', {
      code: 'function add(a, b) { return a + b; }',
      language: 'javascript',
      depth: 'intermediate',
    });

    if (response.status === 200 && response.body.success && response.body.explanation) {
      console.log(`${colors.green}✓ PASSED${colors.reset} - Code explained`);
      console.log(`  Length: ${response.body.explanation.length} chars`);
      passed++;
    } else {
      console.log(`${colors.red}✗ FAILED${colors.reset} - ${response.body?.error || 'Unexpected response'}`);
      failed++;
    }
  } catch (err) {
    console.log(`${colors.red}✗ FAILED${colors.reset} - ${err.message}`);
    failed++;
  }

  // Test 5: Analyze Code
  console.log(`\n${colors.blue}[TEST 5]${colors.reset} Analyze Code`);
  try {
    const response = await makeRequest('POST', '/api/ai/analyze-code', {
      code: 'var x = 5; x = x + 1;',
      language: 'javascript',
      analysisType: 'quality',
    });

    if (response.status === 200 && response.body.success && response.body.analysis) {
      console.log(`${colors.green}✓ PASSED${colors.reset} - Code analyzed`);
      console.log(`  Analysis type: ${response.body.analysisType}`);
      passed++;
    } else {
      console.log(`${colors.red}✗ FAILED${colors.reset} - ${response.body?.error || 'Unexpected response'}`);
      failed++;
    }
  } catch (err) {
    console.log(`${colors.red}✗ FAILED${colors.reset} - ${err.message}`);
    failed++;
  }

  // Test 6: Generate Tests
  console.log(`\n${colors.blue}[TEST 6]${colors.reset} Generate Tests`);
  try {
    const response = await makeRequest('POST', '/api/ai/generate-tests', {
      code: 'function multiply(a, b) { return a * b; }',
      language: 'javascript',
      testFramework: 'jest',
      coverage: 'comprehensive',
    });

    if (response.status === 200 && response.body.success && response.body.tests) {
      console.log(`${colors.green}✓ PASSED${colors.reset} - Tests generated`);
      console.log(`  Framework: ${response.body.framework}`);
      console.log(`  Coverage: ${response.body.coverage}`);
      passed++;
    } else {
      console.log(`${colors.red}✗ FAILED${colors.reset} - ${response.body?.error || 'Unexpected response'}`);
      failed++;
    }
  } catch (err) {
    console.log(`${colors.red}✗ FAILED${colors.reset} - ${err.message}`);
    failed++;
  }

  // Test 7: Refactor Code
  console.log(`\n${colors.blue}[TEST 7]${colors.reset} Refactor Code`);
  try {
    const response = await makeRequest('POST', '/api/ai/refactor-code', {
      code: 'for(var i=0;i<10;i++){console.log(i);}',
      language: 'javascript',
      goals: ['readability', 'performance'],
    });

    if (response.status === 200 && response.body.success && response.body.refactoredCode) {
      console.log(`${colors.green}✓ PASSED${colors.reset} - Code refactored`);
      console.log(`  Goals: ${response.body.goals.join(', ')}`);
      passed++;
    } else {
      console.log(`${colors.red}✗ FAILED${colors.reset} - ${response.body?.error || 'Unexpected response'}`);
      failed++;
    }
  } catch (err) {
    console.log(`${colors.red}✗ FAILED${colors.reset} - ${err.message}`);
    failed++;
  }

  // Test 8: Validate Code
  console.log(`\n${colors.blue}[TEST 8]${colors.reset} Validate Code`);
  try {
    const response = await makeRequest('POST', '/api/ai/validate-code', {
      code: 'function test() { return 42; }',
      language: 'javascript',
    });

    if (response.status === 200 && response.body.success && response.body.validation) {
      console.log(`${colors.green}✓ PASSED${colors.reset} - Code validated`);
      console.log(`  Rules: ${response.body.rules.join(', ')}`);
      passed++;
    } else {
      console.log(`${colors.red}✗ FAILED${colors.reset} - ${response.body?.error || 'Unexpected response'}`);
      failed++;
    }
  } catch (err) {
    console.log(`${colors.red}✗ FAILED${colors.reset} - ${err.message}`);
    failed++;
  }

  // Summary
  console.log(`\n${colors.cyan}
  ╔════════════════════════════════════════╗
  ║         Test Summary                   ║
  ╚════════════════════════════════════════╝
${colors.reset}`);

  console.log(`  ${colors.green}✓ Passed: ${passed}${colors.reset}`);
  console.log(`  ${colors.red}✗ Failed: ${failed}${colors.reset}`);
  console.log(`  Total:  ${passed + failed}`);

  if (failed === 0) {
    console.log(`\n${colors.green}🎉 All tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}❌ Some tests failed${colors.reset}\n`);
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, err.message);
  process.exit(1);
});
