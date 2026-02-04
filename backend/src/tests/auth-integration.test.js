/**
 * Authentication Integration Tests
 * Tests the complete auth flow including login, registration, and protected routes
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import axios from 'axios';
import app from '../server.js';
import { closeServer } from '../server.js';

const BASE_URL = 'http://localhost:5000/api';
let server;

beforeAll(async () => {
  // Note: Server starts automatically when imported
  // Just get a reference to it
  await new Promise(resolve => setTimeout(resolve, 1000));
});

afterAll(async () => {
  try {
    await closeServer();
  } catch (err) {
    console.error('Error closing server:', err);
  }
});

describe('Auth Routes Integration Tests', () => {
  const testUser = {
    email: 'testuser@example.com',
    password: 'TestPassword123!',
    name: 'Test User'
  };

  let authToken = null;
  let cookieJar = null;

  it('POST /auth/register - should register a new user', async () => {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      email: testUser.email,
      password: testUser.password,
      name: testUser.name
    });

    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('success', true);
    expect(response.data).toHaveProperty('data');
    expect(response.data.data).toHaveProperty('user');
    expect(response.data.data).toHaveProperty('token');
    expect(response.data.data.user.email).toBe(testUser.email);

    authToken = response.data.data.token;
    cookieJar = response.headers['set-cookie'];
  });

  it('POST /auth/login - should login user with correct credentials', async () => {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('success', true);
    expect(response.data.data).toHaveProperty('user');
    expect(response.data.data).toHaveProperty('token');
    expect(response.data.data.user.email).toBe(testUser.email);

    authToken = response.data.data.token;
  });

  it('POST /auth/login - should reject invalid credentials', async () => {
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: testUser.email,
        password: 'wrongpassword'
      });
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.response.status).toBe(401);
      expect(error.response.data.success).toBe(false);
    }
  });

  it('GET /auth/me - should return authenticated user with valid token', async () => {
    const response = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('success', true);
    expect(response.data.data).toHaveProperty('user');
    expect(response.data.data.user.email).toBe(testUser.email);
  });

  it('GET /auth/me - should reject request without token', async () => {
    try {
      await axios.get(`${BASE_URL}/auth/me`);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.response.status).toBe(401);
      expect(error.response.data.success).toBe(false);
    }
  });

  it('GET /auth/me - should reject request with invalid token', async () => {
    try {
      await axios.get(`${BASE_URL}/auth/me`, {
        headers: {
          Authorization: 'Bearer invalid.token.here'
        }
      });
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.response.status).toBe(401);
      expect(error.response.data.success).toBe(false);
    }
  });

  it('POST /auth/logout - should logout authenticated user', async () => {
    const response = await axios.post(`${BASE_URL}/auth/logout`, {}, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('success', true);
  });

  it('POST /auth/logout - should reject request without token', async () => {
    try {
      await axios.post(`${BASE_URL}/auth/logout`);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.response.status).toBe(401);
    }
  });

  it('POST /auth/refresh - should refresh expired token', async () => {
    // Get a valid token first
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });

    const originalToken = loginResponse.data.data.token;

    // Refresh the token
    const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {
      token: originalToken
    });

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.data).toHaveProperty('success', true);
    expect(refreshResponse.data.data).toHaveProperty('token');
    expect(refreshResponse.data.data.token).toBeDefined();
    expect(refreshResponse.data.data.token).not.toBe(originalToken);
  });
});

describe('Response Format Validation', () => {
  it('All auth endpoints should return consistent response format', async () => {
    // Register response format
    const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
      email: `user${Date.now()}@test.com`,
      password: 'TestPass123!',
      name: 'Test'
    });

    expect(registerRes.data).toMatchObject({
      success: true,
      message: expect.any(String),
      data: expect.any(Object),
      timestamp: expect.any(String)
    });

    // Login response format
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: registerRes.data.data.user.email,
      password: 'TestPass123!'
    });

    expect(loginRes.data).toMatchObject({
      success: true,
      message: expect.any(String),
      data: expect.any(Object),
      timestamp: expect.any(String)
    });
  });

  it('Error responses should include success: false', async () => {
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'nonexistent@test.com',
        password: 'WrongPass123!'
      });
    } catch (error) {
      expect(error.response.data).toMatchObject({
        success: false,
        error: expect.any(String),
        message: expect.any(String),
        timestamp: expect.any(String)
      });
    }
  });
});
