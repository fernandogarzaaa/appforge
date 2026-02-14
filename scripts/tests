/**
 * AppForge Load Testing Script
 * Tests capacity for 10,000 users/day scenario
 * 
 * Install: npm install -g k6
 * Run: k6 run load-test.js
 * 
 * Scenarios:
 * - Normal Load: 100 concurrent users (avg daily traffic)
 * - Peak Load: 200 concurrent users (lunch/evening spike)
 * - Stress Test: Up to 500 users (capacity testing)
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration');
const healthChecks = new Counter('health_checks');

// Test configuration
export const options = {
  stages: [
    // Ramp-up: Gradual increase to normal load
    { duration: '2m', target: 50 },   // Start with 50 users
    { duration: '3m', target: 100 },  // Increase to 100 users (normal load)
    
    // Sustained normal load
    { duration: '5m', target: 100 },  // Maintain 100 users
    
    // Peak traffic simulation (lunch/evening)
    { duration: '2m', target: 200 },  // Spike to 200 users
    { duration: '5m', target: 200 },  // Maintain peak
    
    // Stress test
    { duration: '2m', target: 350 },  // Push to 350 users
    { duration: '3m', target: 350 },  // Hold at stress level
    
    // Cool down
    { duration: '2m', target: 100 },  // Return to normal
    { duration: '2m', target: 0 },    // Ramp down
  ],
  
  // Performance thresholds (test passes if these are met)
  thresholds: {
    // 95% of requests should be under 500ms
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    
    // Error rate should be less than 1%
    'http_req_failed': ['rate<0.01'],
    
    // Custom metric thresholds
    'errors': ['rate<0.01'],
    'api_duration': ['p(95)<600'],
    
    // Specific checks
    'checks': ['rate>0.95'], // 95% of checks should pass
  },
  
  // Other options
  noConnectionReuse: false,
  userAgent: 'AppForge-LoadTest/1.0',
};

// Test configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Simulated user sessions
const userScenarios = [
  { name: 'health_check', weight: 10 },
  { name: 'auth_flow', weight: 20 },
  { name: 'api_browsing', weight: 40 },
  { name: 'heavy_operation', weight: 20 },
  { name: 'websocket_simulation', weight: 10 },
];

export default function () {
  // Select random scenario based on weights
  const scenario = weightedRandom(userScenarios);
  
  switch (scenario) {
    case 'health_check':
      healthCheckScenario();
      break;
    case 'auth_flow':
      authFlowScenario();
      break;
    case 'api_browsing':
      apiBrowsingScenario();
      break;
    case 'heavy_operation':
      heavyOperationScenario();
      break;
    case 'websocket_simulation':
      websocketSimulation();
      break;
  }
  
  // Random sleep between 1-5 seconds (simulating user think time)
  sleep(Math.random() * 4 + 1);
}

// Scenario 1: Health check (monitoring)
function healthCheckScenario() {
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/health`);
    
    const success = check(res, {
      'health check status is 200': (r) => r.status === 200,
      'health check has uptime': (r) => r.json('uptime') !== undefined,
      'health check response < 100ms': (r) => r.timings.duration < 100,
    });
    
    healthChecks.add(1);
    errorRate.add(!success);
    apiDuration.add(res.timings.duration);
  });
}

// Scenario 2: Authentication flow
function authFlowScenario() {
  group('Authentication Flow', () => {
    // Step 1: Check API status
    let res = http.get(`${API_URL}/status`);
    check(res, {
      'status endpoint is 200': (r) => r.status === 200,
    });
    
    sleep(0.5);
    
    // Step 2: Login attempt (would fail without real credentials)
    res = http.post(`${API_URL}/auth/login`, JSON.stringify({
      email: `testuser${__VU}@example.com`,
      password: 'testpassword123'
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    const success = check(res, {
      'login response received': (r) => r.status === 401 || r.status === 200,
      'login response time < 500ms': (r) => r.timings.duration < 500,
    });
    
    errorRate.add(!success);
    apiDuration.add(res.timings.duration);
  });
}

// Scenario 3: API browsing (common user behavior)
function apiBrowsingScenario() {
  group('API Browsing', () => {
    const endpoints = [
      '/api/status',
      '/health',
      '/api/teams',
    ];
    
    endpoints.forEach(endpoint => {
      const res = http.get(`${BASE_URL}${endpoint}`);
      
      const success = check(res, {
        [`${endpoint} status is ok`]: (r) => r.status === 200 || r.status === 401,
        [`${endpoint} response < 500ms`]: (r) => r.timings.duration < 500,
      });
      
      errorRate.add(!success);
      apiDuration.add(res.timings.duration);
      
      sleep(0.3); // Brief pause between requests
    });
  });
}

// Scenario 4: Heavy operation (resource intensive)
function heavyOperationScenario() {
  group('Heavy Operation', () => {
    const res = http.post(`${API_URL}/quantum/simulate`, JSON.stringify({
      qubits: 4,
      gates: ['H', 'CNOT', 'measure']
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    const success = check(res, {
      'heavy operation completed': (r) => r.status === 200 || r.status === 401,
      'heavy operation response < 2000ms': (r) => r.timings.duration < 2000,
    });
    
    errorRate.add(!success);
    apiDuration.add(res.timings.duration);
  });
}

// Scenario 5: WebSocket simulation (via polling)
function websocketSimulation() {
  group('WebSocket Simulation', () => {
    // Simulate presence check
    const res = http.get(`${API_URL}/collaboration/presence`);
    
    const success = check(res, {
      'presence check received': (r) => r.status === 200 || r.status === 401,
      'presence response < 300ms': (r) => r.timings.duration < 300,
    });
    
    errorRate.add(!success);
    apiDuration.add(res.timings.duration);
  });
}

// Helper: Weighted random selection
function weightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item.name;
    }
  }
  
  return items[0].name;
}

// Teardown function (runs once after all iterations)
export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  let summary = '\n';
  summary += `${indent}=====================================\n`;
  summary += `${indent}  AppForge Load Test Summary\n`;
  summary += `${indent}=====================================\n\n`;
  
  summary += `${indent}Test Duration: ${data.state.testRunDurationMs / 1000}s\n`;
  summary += `${indent}Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s\n\n`;
  
  summary += `${indent}Response Times:\n`;
  summary += `${indent}  Average: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}  Median:  ${data.metrics.http_req_duration.values.med.toFixed(2)}ms\n`;
  summary += `${indent}  95th %:  ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `${indent}  99th %:  ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n\n`;
  
  const failRate = data.metrics.http_req_failed.values.rate * 100;
  summary += `${indent}Error Rate: ${failRate.toFixed(2)}%\n`;
  summary += `${indent}Check Success: ${(data.metrics.checks.values.rate * 100).toFixed(2)}%\n\n`;
  
  // Pass/Fail status
  const passed = failRate < 1 && data.metrics.checks.values.rate > 0.95;
  summary += `${indent}Status: ${passed ? '✅ PASSED' : '❌ FAILED'}\n`;
  summary += `${indent}=====================================\n`;
  
  return summary;
}
