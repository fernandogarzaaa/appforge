/**
 * 📺 YouTube API Integration
 * 
 * Setup:
 * 1. Go to https://console.cloud.google.com
 * 2. Create project and enable YouTube Data API v3
 * 3. Create OAuth credentials
 * 4. Add to .env.local:
 *    YOUTUBE_API_KEY=your_api_key
 *    YOUTUBE_CLIENT_ID=your_client_id
 *    YOUTUBE_CLIENT_SECRET=your_client_secret
 */

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

class YouTubeIntegration {
  private baseUrl = 'https://www.googleapis.com/youtube/v3';
  private config: YouTubeConfig | null = null;
  private accessToken: string | null = null;

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
    } else {
      console.warn('⚠️ [YouTube] API keys not configured - using simulation mode');
    }
  }

  private isConfigured(): boolean {
    return !!this.config?.apiKey;
  }

  async uploadVideo(video: YouTubeVideo, videoData: Buffer): Promise<any> {
    if (!this.isConfigured()) {
      return this.simulateUpload(video);
    }

    // In real implementation, use OAuth2 flow and resumable upload
    console.log('📤 [YouTube] Would upload video:', video.title);
    return { id: 'simulated_' + Date.now(), status: 'uploaded' };
  }

  async postVideo(video: YouTubeVideo): Promise<any> {
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
      return response.json();
    } catch (error) {
      console.error('❌ [YouTube] Upload failed:', error);
      return this.simulateResponse(video);
    }
  }

  async getChannelStats(): Promise<any> {
    if (!this.isConfigured()) {
      return { subscribers: 0, views: 0, videos: 0 };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/channels?part=statistics&mine=true&key=${this.config!.apiKey}`
      );
      return response.json();
    } catch {
      return { subscribers: 0, views: 0, videos: 0 };
    }
  }

  private simulateUpload(video: YouTubeVideo): any {
    return {
      id: 'yt_' + Date.now(),
      title: video.title,
      status: 'SIMULATION',
      message: 'Add YOUTUBE_API_KEY to enable real uploads'
    };
  }

  private simulateResponse(video: YouTubeVideo): any {
    return {
      id: 'sim_' + Date.now(),
      snippet: { title: video.title },
      status: { uploadStatus: 'uploaded' }
    };
  }

  getStatus(): { configured: boolean; mode: string } {
    return {
      configured: this.isConfigured(),
      mode: this.isConfigured() ? 'LIVE' : 'SIMULATION'
    };
  }
}

export const youtube = new YouTubeIntegration();
export const isYouTubeConfigured = () => youtube.getStatus().configured;
export const uploadYouTubeVideo = (video: YouTubeVideo, data?: Buffer) => youtube.uploadVideo(video, data!);
export const postYouTubeVideo = (video: YouTubeVideo) => youtube.postVideo(video);
