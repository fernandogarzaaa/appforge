/**
 * 🔑 API Key Manager - Real Integrations
 * 
 * IMPORTANT: Add your API keys to .env.local
 * 
 * Required keys:
 * - GITHUB_TOKEN (GitHub trending)
 * - BINANCE_API_KEY & BINANCE_SECRET_KEY (crypto trading)
 * - COINBASE_API_KEY & COINBASE_SECRET_KEY (crypto trading)
 * - YOUTUBE_API_KEY & YOUTUBE_CLIENT_ID & YOUTUBE_CLIENT_SECRET (video posting)
 * - TWITTER_API_KEY & TWITTER_API_SECRET & TWITTER_ACCESS_TOKEN & TWITTER_ACCESS_SECRET (tweets)
 * - TIKTOK_CLIENT_KEY & TIKTOK_CLIENT_SECRET (video posting)
 * - UPWORK_CLIENT_ID & UPWORK_CLIENT_SECRET (freelance)
 * - FIVERR_CLIENT_ID & FIVERR_CLIENT_SECRET (freelance)
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

export interface APIKeys {
  // GitHub
  github?: {
    token: string;
  };

  // Crypto Trading
  binance?: {
    apiKey: string;
    secretKey: string;
  };
  coinbase?: {
    apiKey: string;
    secretKey: string;
  };
  
  // Social Media
  youtube?: {
    apiKey: string;
    clientId: string;
    clientSecret: string;
    refreshToken?: string;
  };
  twitter?: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessSecret: string;
  };
  tiktok?: {
    clientKey: string;
    clientSecret: string;
    accessToken?: string;
  };
  instagram?: {
    accessToken: string;
  };
  facebook?: {
    accessToken: string;
    appId: string;
    appSecret: string;
  };
  
  // Freelance
  upwork?: {
    clientId: string;
    clientSecret: string;
    refreshToken?: string;
  };
  fiverr?: {
    clientId: string;
    clientSecret: string;
    accessToken?: string;
  };
}

class APIKeyManager {
  private keys: APIKeys | null = null;

  constructor() {
    this.loadKeys();
  }

  private loadKeys() {
    try {
      // GitHub
      this.keys = {
        github: process.env.GITHUB_TOKEN ? {
          token: process.env.GITHUB_TOKEN!
        } : undefined,
        
        // Crypto Trading
        binance: process.env.BINANCE_API_KEY ? {
          apiKey: process.env.BINANCE_API_KEY!,
          secretKey: process.env.BINANCE_SECRET_KEY!
        } : undefined,
        
        coinbase: process.env.COINBASE_API_KEY ? {
          apiKey: process.env.COINBASE_API_KEY!,
          secretKey: process.env.COINBASE_SECRET_KEY!
        } : undefined,
        
        // Social Media
        youtube: process.env.YOUTUBE_API_KEY ? {
          apiKey: process.env.YOUTUBE_API_KEY!,
          clientId: process.env.YOUTUBE_CLIENT_ID!,
          clientSecret: process.env.YOUTUBE_CLIENT_SECRET!,
          refreshToken: process.env.YOUTUBE_REFRESH_TOKEN
        } : undefined,
        
        twitter: process.env.TWITTER_API_KEY ? {
          apiKey: process.env.TWITTER_API_KEY!,
          apiSecret: process.env.TWITTER_API_SECRET!,
          accessToken: process.env.TWITTER_ACCESS_TOKEN!,
          accessSecret: process.env.TWITTER_ACCESS_SECRET!
        } : undefined,
        
        tiktok: process.env.TIKTOK_CLIENT_KEY ? {
          clientKey: process.env.TIKTOK_CLIENT_KEY!,
          clientSecret: process.env.TIKTOK_CLIENT_SECRET!,
          accessToken: process.env.TIKTOK_ACCESS_TOKEN
        } : undefined,
        
        instagram: process.env.INSTAGRAM_ACCESS_TOKEN ? {
          accessToken: process.env.INSTAGRAM_ACCESS_TOKEN!
        } : undefined,
        
        facebook: process.env.FACEBOOK_ACCESS_TOKEN ? {
          accessToken: process.env.FACEBOOK_ACCESS_TOKEN!,
          appId: process.env.FACEBOOK_APP_ID!,
          appSecret: process.env.FACEBOOK_APP_SECRET!
        } : undefined,
        
        // Freelance
        upwork: process.env.UPWORK_CLIENT_ID ? {
          clientId: process.env.UPWORK_CLIENT_ID!,
          clientSecret: process.env.UPWORK_CLIENT_SECRET!,
          refreshToken: process.env.UPWORK_REFRESH_TOKEN
        } : undefined,
        
        fiverr: process.env.FIVERR_CLIENT_ID ? {
          clientId: process.env.FIVERR_CLIENT_ID!,
          clientSecret: process.env.FIVERR_CLIENT_SECRET!,
          accessToken: process.env.FIVERR_ACCESS_TOKEN
        } : undefined
      };
    } catch (error) {
      console.warn('⚠️ API Key Manager: Error loading keys:', error);
      this.keys = {};
    }
  }

  get(key: keyof APIKeys) {
    return this.keys?.[key];
  }

  isConfigured(service: keyof APIKeys): boolean {
    const key = this.keys?.[service];
    if (!key) return false;
    
    if (typeof key === 'object') {
      return Object.values(key).some(v => v !== undefined && v !== '');
    }
    
    return !!key;
  }

  getConfiguredServices(): string[] {
    const services: string[] = [];
    
    if (this.isConfigured('github')) services.push('github');
    if (this.isConfigured('binance')) services.push('binance');
    if (this.isConfigured('coinbase')) services.push('coinbase');
    if (this.isConfigured('youtube')) services.push('youtube');
    if (this.isConfigured('twitter')) services.push('twitter');
    if (this.isConfigured('tiktok')) services.push('tiktok');
    if (this.isConfigured('instagram')) services.push('instagram');
    if (this.isConfigured('facebook')) services.push('facebook');
    if (this.isConfigured('upwork')) services.push('upwork');
    if (this.isConfigured('fiverr')) services.push('fiverr');
    
    return services;
  }
}

// Singleton instance
export const apiKeys = new APIKeyManager();

// Export individual key getters for convenience
export const getGitHubToken = () => apiKeys.get('github');
export const getBinanceKeys = () => apiKeys.get('binance');
export const getCoinbaseKeys = () => apiKeys.get('coinbase');
export const getYouTubeKeys = () => apiKeys.get('youtube');
export const getTwitterKeys = () => apiKeys.get('twitter');
export const getTikTokKeys = () => apiKeys.get('tiktok');
export const getInstagramKeys = () => apiKeys.get('instagram');
export const getFacebookKeys = () => apiKeys.get('facebook');
export const getUpworkKeys = () => apiKeys.get('upwork');
export const getFiverrKeys = () => apiKeys.get('fiverr');
