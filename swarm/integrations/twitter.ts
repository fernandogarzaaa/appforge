/**
 * 🐦 Twitter/X API v2 Integration
 *
 * In SWARM_REALITY_MODE=true, simulation fallbacks are blocked.
 */

import crypto from 'crypto';
import https from 'https';
import { existsSync } from 'fs';
import dotenv from 'dotenv';
import { isRealityMode } from '../core/reality_mode.js';

function loadEnv(): void {
  if (existsSync('.env.local')) {
    dotenv.config({ path: '.env.local', override: false });
  }
  if (existsSync('.env')) {
    dotenv.config({ path: '.env', override: false });
  }
}

loadEnv();

interface TwitterConfig {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
}

interface Tweet {
  text: string;
  mediaIds?: string[];
  replySettings?: 'everyone' | 'mentionedUsers' | 'following';
}

type TwitterMode = 'LIVE' | 'SIMULATION' | 'MISCONFIGURED';

class TwitterIntegration {
  private baseUrl = 'https://api.twitter.com/2';
  private config: TwitterConfig | null = null;
  private realityMode = isRealityMode();

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    const apiKey = process.env.TWITTER_API_KEY;
    const apiSecret = process.env.TWITTER_API_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessSecret = process.env.TWITTER_ACCESS_SECRET;

    if (apiKey && apiSecret && accessToken && accessSecret) {
      this.config = { apiKey, apiSecret, accessToken, accessSecret };
      console.log('✅ [Twitter] API keys configured');
      return;
    }

    if (this.realityMode) {
      console.error('❌ [Twitter] Reality mode active: API keys missing. Simulation disabled.');
    } else {
      console.warn('⚠️ [Twitter] API keys not configured - using simulation mode');
    }
  }

  private isConfigured(): boolean {
    return !!this.config?.apiKey;
  }

  private requireConfiguredForReality(): void {
    if (this.realityMode && !this.isConfigured()) {
      throw new Error('[Twitter] SWARM_REALITY_MODE=true but Twitter API credentials are missing');
    }
  }

  private generateAuthHeader(method: string, url: string): string {
    if (!this.config) {
      throw new Error('Twitter API not configured');
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomBytes(16).toString('hex');

    const oauthParams = {
      oauth_consumer_key: this.config.apiKey,
      oauth_token: this.config.accessToken,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp.toString(),
      oauth_nonce: nonce,
      oauth_version: '1.0'
    };

    const signatureBase = [
      method.toUpperCase(),
      url,
      new URLSearchParams(Object.entries(oauthParams).sort()).toString()
    ].join('&');

    const signingKey = `${this.config.apiSecret}&${this.config.accessSecret}`;
    const signature = crypto
      .createHmac('sha1', signingKey)
      .update(signatureBase)
      .digest('base64');

    const authHeader = {
      ...oauthParams,
      oauth_signature: signature
    };

    return 'OAuth ' + Object.entries(authHeader)
      .map(([k, v]) => `${k}="${encodeURIComponent(v)}"`)
      .join(', ');
  }

  private async request(method: string, endpoint: string, body?: any): Promise<any> {
    this.requireConfiguredForReality();

    if (!this.isConfigured()) {
      return this.simulateResponse(method, endpoint, body);
    }

    const url = `${this.baseUrl}${endpoint}`;
    const authHeader = this.generateAuthHeader(method, url);

    return new Promise((resolve, reject) => {
      const req = https.request(url, {
        method,
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            resolve(parsed);
          } catch (error) {
            reject(new Error(`[Twitter] Invalid JSON response from ${endpoint}`));
          }
        });
      });

      req.on('error', (error) => {
        if (this.realityMode) {
          reject(new Error(`[Twitter] API request failed: ${error.message}`));
          return;
        }

        console.error('❌ [Twitter] API error:', error);
        resolve(this.simulateResponse(method, endpoint, body));
      });

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  async postTweet(tweet: Tweet): Promise<any> {
    const body: any = { text: tweet.text };
    if (tweet.mediaIds?.length) {
      body.media = { media_ids: tweet.mediaIds };
    }

    return this.request('POST', '/tweets', body);
  }

  async postThread(tweets: string[]): Promise<any[]> {
    const results: any[] = [];
    let previousTweetId: string | undefined;

    for (const text of tweets) {
      const body: any = { text };
      if (previousTweetId) {
        body.reply = { in_reply_to_tweet_id: previousTweetId };
      }

      const result = await this.request('POST', '/tweets', body);
      results.push(result);
      previousTweetId = result.data?.id;
    }

    return results;
  }

  async getUserTimeline(userId: string, maxResults: number = 10): Promise<any> {
    return this.request('GET', `/users/${userId}/tweets?max_results=${maxResults}`);
  }

  async getMyStats(): Promise<any> {
    this.requireConfiguredForReality();

    if (!this.isConfigured()) {
      return { followers: 0, following: 0, tweets: 0 };
    }

    return this.request('GET', '/users/me?user.fields=public_metrics');
  }

  private simulateResponse(method: string, endpoint: string, body?: any): any {
    if (this.realityMode) {
      throw new Error('[Twitter] Simulation response requested while reality mode is enabled');
    }

    if (endpoint.includes('/tweets') && method === 'POST') {
      return {
        data: {
          id: 'tw_' + Date.now(),
          text: body?.text || 'Simulation tweet',
          created_at: new Date().toISOString()
        }
      };
    }
    return { data: [] };
  }

  getStatus(): { configured: boolean; mode: TwitterMode } {
    return {
      configured: this.isConfigured(),
      mode: this.isConfigured() ? 'LIVE' : (this.realityMode ? 'MISCONFIGURED' : 'SIMULATION')
    };
  }
}

export const twitter = new TwitterIntegration();
export const isTwitterConfigured = () => twitter.getStatus().configured;
export const postTweet = (text: string) => twitter.postTweet({ text });
export const postThread = (tweets: string[]) => twitter.postThread(tweets);
export const getTwitterStats = () => twitter.getMyStats();
