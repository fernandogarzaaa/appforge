/**
 * 📺 YouTube API Integration
 *
 * In SWARM_REALITY_MODE=true, simulation fallbacks are blocked.
 */

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

interface YouTubeConfig {
  apiKey: string;
  clientId: string;
  clientSecret: string;
  refreshToken?: string;
}

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  tags: string[];
  categoryId: string;
  privacyStatus: 'public' | 'private' | 'unlisted';
}

type YouTubeMode = 'LIVE' | 'SIMULATION' | 'MISCONFIGURED';

class YouTubeIntegration {
  private baseUrl = 'https://www.googleapis.com/youtube/v3';
  private config: YouTubeConfig | null = null;
  private realityMode = isRealityMode();

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

    if (apiKey && clientId && clientSecret) {
      this.config = { apiKey, clientId, clientSecret, refreshToken: process.env.YOUTUBE_REFRESH_TOKEN };
      console.log('✅ [YouTube] API keys configured');
      return;
    }

    if (this.realityMode) {
      console.error('❌ [YouTube] Reality mode active: API keys missing. Simulation disabled.');
    } else {
      console.warn('⚠️ [YouTube] API keys not configured - using simulation mode');
    }
  }

  private isConfigured(): boolean {
    return !!this.config?.apiKey;
  }

  private requireConfiguredForReality(): void {
    if (this.realityMode && !this.isConfigured()) {
      throw new Error('[YouTube] SWARM_REALITY_MODE=true but YouTube API credentials are missing');
    }
  }

  async uploadVideo(video: YouTubeVideo, videoData: Buffer): Promise<any> {
    this.requireConfiguredForReality();

    if (!this.isConfigured()) {
      return this.simulateUpload(video);
    }

    // NOTE: Full binary upload requires OAuth upload flow.
    // We keep this explicit in reality mode instead of simulating success.
    if (this.realityMode) {
      throw new Error('[YouTube] Real upload requires OAuth upload flow; use postVideo metadata call or integrate resumable upload.');
    }

    console.log('📤 [YouTube] Would upload video:', video.title);
    return { id: 'simulated_' + Date.now(), status: 'uploaded' };
  }

  async postVideo(video: YouTubeVideo): Promise<any> {
    this.requireConfiguredForReality();

    if (!this.isConfigured()) {
      return this.simulateResponse(video);
    }

    try {
      const response = await fetch(`${this.baseUrl}/videos?part=snippet,status&key=${this.config!.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snippet: {
            title: video.title,
            description: video.description,
            tags: video.tags,
            categoryId: video.categoryId
          },
          status: { privacyStatus: video.privacyStatus }
        })
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`[YouTube] API error (${response.status}): ${body.slice(0, 200)}`);
      }

      return response.json();
    } catch (error: any) {
      if (this.realityMode) {
        throw new Error(`[YouTube] Upload failed in reality mode: ${error.message || error}`);
      }

      console.error('❌ [YouTube] Upload failed:', error);
      return this.simulateResponse(video);
    }
  }

  async getChannelStats(): Promise<any> {
    this.requireConfiguredForReality();

    if (!this.isConfigured()) {
      return { subscribers: 0, views: 0, videos: 0 };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/channels?part=statistics&mine=true&key=${this.config!.apiKey}`
      );

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`[YouTube] Stats API error (${response.status}): ${body.slice(0, 200)}`);
      }

      return response.json();
    } catch (error: any) {
      if (this.realityMode) {
        throw new Error(`[YouTube] Failed to fetch channel stats in reality mode: ${error.message || error}`);
      }

      return { subscribers: 0, views: 0, videos: 0 };
    }
  }

  private simulateUpload(video: YouTubeVideo): any {
    if (this.realityMode) {
      throw new Error('[YouTube] Simulation upload requested while reality mode is enabled');
    }

    return {
      id: 'yt_' + Date.now(),
      title: video.title,
      status: 'SIMULATION',
      message: 'Add YOUTUBE_API_KEY to enable real uploads'
    };
  }

  private simulateResponse(video: YouTubeVideo): any {
    if (this.realityMode) {
      throw new Error('[YouTube] Simulation response requested while reality mode is enabled');
    }

    return {
      id: 'sim_' + Date.now(),
      snippet: { title: video.title },
      status: { uploadStatus: 'uploaded' }
    };
  }

  getStatus(): { configured: boolean; mode: YouTubeMode } {
    return {
      configured: this.isConfigured(),
      mode: this.isConfigured() ? 'LIVE' : (this.realityMode ? 'MISCONFIGURED' : 'SIMULATION')
    };
  }
}

export const youtube = new YouTubeIntegration();
export const isYouTubeConfigured = () => youtube.getStatus().configured;
export const uploadYouTubeVideo = (video: YouTubeVideo, data?: Buffer) => youtube.uploadVideo(video, data!);
export const postYouTubeVideo = (video: YouTubeVideo) => youtube.postVideo(video);
export const getYouTubeChannelStats = () => youtube.getChannelStats();
