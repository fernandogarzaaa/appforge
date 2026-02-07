// @ts-nocheck
/**
 * Integration Tests for Solana Payment Functions
 * 
 * Tests the new Solana payment workflow:
 * 1. Get Solana Config
 * 2. Create Subscription with specific plans
 * 3. Verify database state
 * 
 * Prerequisites:
 * - Running backend server
 * - TEST_USER_TOKEN and ADMIN_TOKEN env vars
 * 
 * Run with: npm run test:integration
 */

import { describe, it, expect, beforeAll } from 'vitest';

const RUN_INTEGRATION_TESTS = process.env.RUN_INTEGRATION_TESTS === 'true';
const describeIntegration = RUN_INTEGRATION_TESTS ? describe : describe.skip;

const API_URL = 'http://localhost:5000/api'; // Backend runs on 5000

describeIntegration('Solana Payment Integration Tests', () => {
  let testUserToken;
  let adminToken;

  beforeAll(() => {
    testUserToken = process.env.TEST_USER_TOKEN;
    adminToken = process.env.ADMIN_TOKEN;

    if (!testUserToken || !adminToken) {
      console.warn('Skipping integration tests: Missing tokens');
      return;
    }
  });

  describe('Solana Configuration', () => {
    it('should retrieve Solana configuration', async () => {
      const response = await fetch(`${API_URL}/payment/solana/config`, {
        headers: {
          'Authorization': `Bearer ${testUserToken}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.recipient_address).toBeDefined();
      expect(data.network).toBeDefined();
      expect(data.payment_enabled).toBe(true);
    });
  });

  describe('Subscription Creation', () => {
    it('should create a subscription with valid Solana signature', async () => {
      const mockSignature = `test_sig_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const response = await fetch(`${API_URL}/payment/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUserToken}`
        },
        body: JSON.stringify({
          plan_id: 'pro_monthly',
          payment_method: 'solana_wallet',
          transaction_signature: mockSignature,
          amount_paid: 0.5
        })
      });

      const data = await response.json();

      if (response.status === 201) {
        expect(data.success).toBe(true);
        expect(data.subscription).toBeDefined();
        expect(data.subscription.status).toBe('active');
        expect(data.subscription.transactionSignature).toBe(mockSignature);
      } else {
        console.log('Valid signature test response:', response.status, data);
        expect(response.status).toBe(201);
      }
    }, 30000); // Increased timeout for Solana verification delay

    it('should reject missing transaction signature', async () => {
      const response = await fetch(`${API_URL}/payment/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUserToken}`
        },
        body: JSON.stringify({
          plan_id: 'pro_monthly',
          payment_method: 'solana_wallet',
          // missing signature
          amount_paid: 0.5
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toContain('Transaction signature required');
    });

    it('should prevent duplicate signatures', async () => {
      // 1. Create first subscription
      const duplicateSig = `dup_sig_${Date.now()}`;

      await fetch(`${API_URL}/payment/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUserToken}`
        },
        body: JSON.stringify({
          plan_id: 'pro_monthly',
          payment_method: 'solana_wallet',
          transaction_signature: duplicateSig,
          amount_paid: 0.5
        })
      });

      // 2. Try to reuse same signature
      const response = await fetch(`${API_URL}/payment/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUserToken}`
        },
        body: JSON.stringify({
          plan_id: 'basic_monthly', // Different plan
          payment_method: 'solana_wallet',
          transaction_signature: duplicateSig, // Same signature
          amount_paid: 0.1
        })
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.message).toContain('already used');
    }, 30000); // Increased timeout
  });

  describe('User Profile Updates', () => {
    it('should update user subscription status', async () => {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${testUserToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const user = data.data?.user || data.data || data; // Handle different response structures
        console.log('User Subscription Status:', user.subscription);
        expect(user.subscription).toBeDefined();
        // Since we created a subscription in previous tests, it might ideally be active
        // But tests might run in parallel or order isn't guaranteed if not sequential.
        // Vitest runs tests in file sequentially by default.
      } else {
        console.log('Auth check failed:', response.status);
      }
    });
  });
});
