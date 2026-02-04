/**
 * Notifications Service
 * Webhook delivery with retries and optional signing
 */

import axios from 'axios';
import crypto from 'crypto';
import logger from '../utils/logger.js';

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RETRIES = 3;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const signPayload = (payload, secret) => {
  if (!secret) return null;
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
};

export const deliverWebhook = async ({
  url,
  payload,
  secret,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  retries = DEFAULT_RETRIES,
  headers = {}
}) => {
  const signature = signPayload(payload, secret);
  const finalHeaders = {
    'Content-Type': 'application/json',
    'User-Agent': 'AppForge-Alerts/1.0',
    ...(signature ? { 'X-Webhook-Signature': signature } : {}),
    ...headers
  };

  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);

  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await axios.post(url, body, {
        timeout: timeoutMs,
        headers: finalHeaders,
        validateStatus: () => true
      });

      if (response.status >= 200 && response.status < 300) {
        return {
          success: true,
          status: response.status,
          data: response.data
        };
      }

      lastError = new Error(`Webhook failed with status ${response.status}`);
      logger.warn('Webhook delivery returned non-2xx response', {
        url,
        status: response.status,
        attempt
      });
    } catch (error) {
      lastError = error;
      logger.warn('Webhook delivery attempt failed', {
        url,
        attempt,
        error: error.message
      });
    }

    if (attempt < retries) {
      await sleep(500 * attempt);
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Webhook delivery failed'
  };
};
