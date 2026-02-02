// @ts-nocheck
/**
 * Integration Services - All external API connectors
 * Stripe, SendGrid, Twilio, Slack, GitHub, etc.
 */

import crypto from 'crypto';
import { PAYMENT_CONFIG } from '@/config/payment.config';

const getEnv = (name: string, fallback?: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[name]) return process.env[name];
  if (typeof import !== 'undefined' && typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) {
    return import.meta.env[name];
  }
  if (fallback) return fallback;
  throw new Error(`${name} is not configured`);
};

const hasFetch = (): typeof fetch => {
  if (typeof fetch !== 'function') {
    throw new Error('fetch is not available in this runtime');
  }
  return fetch;
};

const constantTimeCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};

// ============================================
// STRIPE PAYMENT INTEGRATION
// ============================================

export interface StripeConfig {
  secretKey: string;
  publicKey: string;
}

export async function createStripeCheckout(
  amount: number,
  description: string,
  successUrl: string = PAYMENT_CONFIG.SUCCESS_URL,
  cancelUrl: string = PAYMENT_CONFIG.CANCEL_URL
): Promise<{ checkoutUrl: string; sessionId: string }> {
  const stripeKey = getEnv('STRIPE_SECRET_KEY');
  const fetcher = hasFetch();

  const body = new URLSearchParams({
    success_url: successUrl,
    cancel_url: cancelUrl,
    mode: 'payment',
    'line_items[0][price_data][currency]': PAYMENT_CONFIG.CURRENCY.toLowerCase(),
    'line_items[0][price_data][unit_amount]': Math.round(amount * 100).toString(),
    'line_items[0][price_data][product_data][name]': description,
    'line_items[0][quantity]': '1',
  });

  const response = await fetcher('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Stripe checkout failed: ${response.status} ${errorText}`);
  }

  const session = await response.json();
  return {
    checkoutUrl: session.url,
    sessionId: session.id,
  };
}

export async function handleStripeWebhook(body: string, signature: string): Promise<void> {
  const webhookSecret = getEnv('STRIPE_WEBHOOK_SECRET');
  const [, timestampPart] = signature.split('t=');
  const timestamp = timestampPart?.split(',')[0];
  const v1 = signature.split('v1=')[1];

  if (!timestamp || !v1) {
    throw new Error('Invalid Stripe signature header');
  }

  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(`${timestamp}.${body}`)
    .digest('hex');

  if (!constantTimeCompare(expected, v1)) {
    throw new Error('Stripe webhook signature verification failed');
  }

  const event = JSON.parse(body);

  switch (event.type) {
    case 'payment_intent.succeeded':
      // Update subscription or order status here
      console.info('Payment succeeded for', event.data?.object?.id);
      break;
    case 'payment_intent.payment_failed':
      console.warn('Payment failed for', event.data?.object?.id);
      break;
    default:
      console.info('Unhandled Stripe event', event.type);
  }
}

// ============================================
// SENDGRID EMAIL INTEGRATION
// ============================================

export interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

export async function sendTransactionalEmail(
  to: string,
  subject: string,
  htmlBody: string,
  templateId?: string
): Promise<{ messageId: string; status: string }> {
  const fetcher = hasFetch();
  const apiKey = getEnv('SENDGRID_API_KEY');
  const fromEmail = getEnv('SENDGRID_FROM_EMAIL', 'no-reply@appforge.com');
  const fromName = getEnv('SENDGRID_FROM_NAME', 'AppForge');

  const payload = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: fromEmail, name: fromName },
    subject,
    content: [{ type: 'text/html', value: htmlBody }],
    ...(templateId ? { template_id: templateId } : {}),
  };

  const response = await fetcher('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid error: ${response.status} ${errorText}`);
  }

  const messageId = response.headers.get('x-message-id') || 'sendgrid-message';
  return {
    messageId,
    status: 'sent',
  };
}

// ============================================
// TWILIO SMS INTEGRATION
// ============================================

export interface SMSConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export async function sendSMS(phoneNumber: string, message: string, config?: Partial<SMSConfig>): Promise<{ sid: string }> {
  const fetcher = hasFetch();
  const accountSid = config?.accountSid || getEnv('TWILIO_ACCOUNT_SID');
  const authToken = config?.authToken || getEnv('TWILIO_AUTH_TOKEN');
  const fromNumber = config?.fromNumber || getEnv('TWILIO_FROM_NUMBER');

  const body = new URLSearchParams({
    To: phoneNumber,
    From: fromNumber,
    Body: message,
  });

  const response = await fetcher(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio SMS failed: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return { sid: result.sid };
}

// ============================================
// SLACK INTEGRATION
// ============================================

export interface SlackConfig {
  botToken: string;
  signingSecret: string;
}

export async function sendSlackMessage(
  channelId: string,
  text: string,
  blocks?: unknown[]
): Promise<{ ts: string; channelId: string }> {
  const fetcher = hasFetch();
  const botToken = getEnv('SLACK_BOT_TOKEN');

  const response = await fetcher('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${botToken}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      channel: channelId,
      text,
      ...(blocks ? { blocks } : {}),
    }),
  });

  const result = await response.json();
  if (!result.ok) {
    throw new Error(`Slack error: ${result.error}`);
  }

  return {
    ts: result.ts,
    channelId,
  };
}

// ============================================
// GITHUB INTEGRATION
// ============================================

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

export async function triggerGitHubAction(
  workflowId: string,
  ref: string,
  inputs: Record<string, string>
): Promise<{ runId: number; status: string }> {
  const fetcher = hasFetch();
  const token = getEnv('GITHUB_TOKEN');
  const owner = getEnv('GITHUB_OWNER');
  const repo = getEnv('GITHUB_REPO');

  const response = await fetcher(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ref, inputs }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub dispatch failed: ${response.status} ${errorText}`);
  }

  return {
    runId: Date.now(),
    status: 'queued',
  };
}

export async function createGitHubRelease(
  tagName: string,
  releaseName: string,
  body: string
): Promise<{ releaseId: number; releaseUrl: string }> {
  const fetcher = hasFetch();
  const token = getEnv('GITHUB_TOKEN');
  const owner = getEnv('GITHUB_OWNER');
  const repo = getEnv('GITHUB_REPO');

  const response = await fetcher(`https://api.github.com/repos/${owner}/${repo}/releases`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tag_name: tagName,
      name: releaseName,
      body,
      draft: false,
      prerelease: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub release failed: ${response.status} ${errorText}`);
  }

  const json = await response.json();
  return {
    releaseId: json.id,
    releaseUrl: json.html_url,
  };
}

// ============================================
// GOOGLE ANALYTICS INTEGRATION
// ============================================

export interface AnalyticsConfig {
  propertyId: string;
  measurementId: string;
}

export async function trackAnalyticsEvent(
  eventName: string,
  parameters: Record<string, string | number>
): Promise<{ success: boolean }> {
  const fetcher = hasFetch();
  const measurementId = getEnv('GA_MEASUREMENT_ID');
  const apiSecret = getEnv('GA_API_SECRET');

  const body = {
    client_id: 'appforge-web',
    events: [
      {
        name: eventName,
        params: parameters,
      },
    ],
  };

  const response = await fetcher(
    `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GA event failed: ${response.status} ${errorText}`);
  }

  return { success: true };
}

// ============================================
// DATADOG INTEGRATION
// ============================================

export interface DatadogConfig {
  apiKey: string;
  appKey: string;
  site: string;
}

export async function sendDatadogMetric(
  metricName: string,
  value: number,
  tags: string[]
): Promise<{ status: string }> {
  const fetcher = hasFetch();
  const apiKey = getEnv('DATADOG_API_KEY');
  const site = getEnv('DATADOG_SITE', 'datadoghq.com');

  const body = {
    series: [
      {
        metric: metricName,
        points: [[Math.floor(Date.now() / 1000), value]],
        type: 'gauge',
        tags,
      },
    ],
  };

  const response = await fetcher(`https://api.${site}/api/v2/series`, {
    method: 'POST',
    headers: {
      'DD-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Datadog error: ${response.status} ${errorText}`);
  }

  return { status: 'submitted' };
}

// ============================================
// DISCORD INTEGRATION
// ============================================

export interface DiscordConfig {
  botToken: string;
  webhookUrl: string;
}

export async function sendDiscordMessage(
  channelId: string,
  content: string,
  embeds?: unknown[]
): Promise<{ messageId: string }> {
  const fetcher = hasFetch();
  const webhookUrl = getEnv('DISCORD_WEBHOOK_URL', '');

  if (webhookUrl) {
    const response = await fetcher(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, embeds }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Discord webhook failed: ${response.status} ${errorText}`);
    }

    return { messageId: 'webhook' };
  }

  const botToken = getEnv('DISCORD_BOT_TOKEN');
  const response = await fetcher(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, embeds }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Discord bot send failed: ${response.status} ${errorText}`);
  }

  const json = await response.json();
  return { messageId: json.id };
}

// ============================================
// AWS S3 INTEGRATION
// ============================================

export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region: string;
}

export async function uploadToS3(
  key: string,
  body: Buffer | string,
  contentType: string
): Promise<{ url: string; key: string }> {
  const fetcher = hasFetch();
  const presignedBase = getEnv('S3_PRESIGNED_BASE_URL');
  const uploadUrl = `${presignedBase.replace(/\/$/, '')}/${encodeURIComponent(key)}`;

  const response = await fetcher(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`S3 upload failed: ${response.status} ${errorText}`);
  }

  return {
    url: uploadUrl.split('?')[0],
    key,
  };
}

// ============================================
// FIREBASE INTEGRATION
// ============================================

export interface FirebaseConfig {
  projectId: string;
  apiKey: string;
  databaseURL: string;
}

export async function syncFirebaseData(
  path: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; ref: string }> {
  const fetcher = hasFetch();
  const databaseURL = getEnv('FIREBASE_DATABASE_URL');
  const authToken = getEnv('FIREBASE_AUTH_TOKEN');
  const normalizedPath = path.replace(/^\//, '');

  const response = await fetcher(`${databaseURL}/${normalizedPath}.json?auth=${authToken}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firebase sync failed: ${response.status} ${errorText}`);
  }

  return {
    success: true,
    ref: `/${normalizedPath}`,
  };
}

export default {
  // Stripe
  createStripeCheckout,
  handleStripeWebhook,

  // SendGrid
  sendTransactionalEmail,

  // Twilio
  sendSMS,

  // Slack
  sendSlackMessage,

  // GitHub
  triggerGitHubAction,
  createGitHubRelease,

  // Google Analytics
  trackAnalyticsEvent,

  // Datadog
  sendDatadogMetric,

  // Discord
  sendDiscordMessage,

  // AWS S3
  uploadToS3,

  // Firebase
  syncFirebaseData,
};
