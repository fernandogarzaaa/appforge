/**
 * k6 Spike Testing Script
 * Tests sudden traffic spikes (simulating viral moments)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 50 },    // Normal traffic
    { duration: '10s', target: 2000 },  // Sudden spike!
    { duration: '30s', target: 2000 },  // Sustained spike
    { duration: '10s', target: 50 },    // Back to normal
    { duration: '10s', target: 0 },     // Cool down
  ],
  
  thresholds: {
    'http_req_duration': ['p(99)<5000'], // 99% < 5s during spike
    'http_req_failed': ['rate<0.10'],    // Allow 10% errors during spike
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  const response = http.get(`${BASE_URL}/health`);
  
  check(response, {
    'status is 200': (r) => r.status === 200,
  });
  
  sleep(0.5);
}
