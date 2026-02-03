/**
 * k6 Stress Testing Script
 * Tests breaking point of the system
 */

import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 500 },   // Warm up
    { duration: '3m', target: 1000 },  
    { duration: '3m', target: 2000 },  
    { duration: '3m', target: 3000 },  // Push to limits
    { duration: '2m', target: 0 },     // Recovery
  ],
  
  thresholds: {
    'http_req_failed': ['rate<0.20'],  // Allow 20% errors at extreme load
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  const payload = JSON.stringify({
    code: 'console.log("stress test");',
    language: 'javascript'
  });
  
  const response = http.post(
    `${BASE_URL}/api/quantum/analyze`,
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(response, {
    'status is not 500': (r) => r.status !== 500,
  });
}
