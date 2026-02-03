/**
 * k6 Load Testing Script - AppForge Backend
 * Tests 1000+ concurrent users on quantum analysis endpoints
 * 
 * Installation:
 *   choco install k6
 * 
 * Usage:
 *   k6 run load-test.js
 *   k6 run --vus 1000 --duration 5m load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const quantumAnalysisDuration = new Trend('quantum_analysis_duration');
const successfulRequests = new Counter('successful_requests');
const failedRequests = new Counter('failed_requests');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 100 },   // Ramp up to 100 users
    { duration: '2m', target: 500 },   // Ramp up to 500 users
    { duration: '2m', target: 1000 },  // Ramp up to 1000 users
    { duration: '3m', target: 1000 },  // Stay at 1000 users
    { duration: '1m', target: 500 },   // Ramp down to 500 users
    { duration: '1m', target: 0 },     // Ramp down to 0 users
  ],
  
  thresholds: {
    'http_req_duration': ['p(95)<2000'], // 95% of requests < 2s
    'errors': ['rate<0.05'],              // Error rate < 5%
    'http_req_failed': ['rate<0.05'],    // Failed requests < 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Sample code for quantum analysis
const SAMPLE_CODES = [
  {
    language: 'javascript',
    code: `
      function fibonacci(n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
      }
      
      console.log(fibonacci(10));
    `
  },
  {
    language: 'python',
    code: `
      def quick_sort(arr):
          if len(arr) <= 1:
              return arr
          pivot = arr[len(arr) // 2]
          left = [x for x in arr if x < pivot]
          middle = [x for x in arr if x == pivot]
          right = [x for x in arr if x > pivot]
          return quick_sort(left) + middle + quick_sort(right)
      
      print(quick_sort([3,6,8,10,1,2,1]))
    `
  },
  {
    language: 'typescript',
    code: `
      interface User {
        id: number;
        name: string;
        email: string;
      }
      
      class UserService {
        private users: User[] = [];
        
        addUser(user: User): void {
          this.users.push(user);
        }
        
        findUser(id: number): User | undefined {
          return this.users.find(u => u.id === id);
        }
      }
    `
  }
];

// Test user authentication
function login() {
  const payload = JSON.stringify({
    email: `loadtest${__VU}@example.com`,
    password: 'LoadTest123!@#'
  });
  
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };
  
  const response = http.post(`${BASE_URL}/api/auth/login`, payload, params);
  
  check(response, {
    'login status is 200': (r) => r.status === 200,
    'login returns token': (r) => r.json('token') !== undefined,
  }) || errorRate.add(1);
  
  return response.json('token');
}

// Main test function
export default function () {
  // 1. Health check
  const healthCheck = http.get(`${BASE_URL}/health`);
  
  check(healthCheck, {
    'health check is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  sleep(1);
  
  // 2. API status check
  const statusCheck = http.get(`${BASE_URL}/api/status`);
  
  check(statusCheck, {
    'status check is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  sleep(1);
  
  // 3. Quantum analysis (main load test)
  const randomCode = SAMPLE_CODES[Math.floor(Math.random() * SAMPLE_CODES.length)];
  
  const analysisPayload = JSON.stringify({
    code: randomCode.code,
    language: randomCode.language,
    options: {
      includeSecurityAnalysis: true,
      includePerformanceSuggestions: true,
    }
  });
  
  const analysisParams = {
    headers: { 'Content-Type': 'application/json' },
  };
  
  const analysisStart = Date.now();
  const analysisResponse = http.post(
    `${BASE_URL}/api/quantum/analyze`,
    analysisPayload,
    analysisParams
  );
  const analysisDuration = Date.now() - analysisStart;
  
  const analysisSuccess = check(analysisResponse, {
    'analysis status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'analysis returns result': (r) => r.json('consensus') !== undefined || r.json('result') !== undefined,
    'analysis response time < 5s': (r) => r.timings.duration < 5000,
  });
  
  if (analysisSuccess) {
    successfulRequests.add(1);
    quantumAnalysisDuration.add(analysisDuration);
  } else {
    failedRequests.add(1);
    errorRate.add(1);
  }
  
  sleep(Math.random() * 3 + 1); // Random sleep 1-4 seconds
  
  // 4. Queue status check (10% of requests)
  if (Math.random() < 0.1) {
    const queueStatus = http.get(`${BASE_URL}/api/batch/jobs`);
    
    check(queueStatus, {
      'queue status is 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  }
  
  sleep(1);
}

// Teardown function
export function teardown(data) {
  console.log('Load test completed!');
  console.log(`Successful requests: ${successfulRequests.value}`);
  console.log(`Failed requests: ${failedRequests.value}`);
}
