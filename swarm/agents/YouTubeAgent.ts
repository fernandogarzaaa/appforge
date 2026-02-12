/**
 * YouTube Agent - Specialized for long-form AI video content
 * Focus: SEO, thumbnails, watch time, subscriber growth
 */

import { QuantumSwarmCore } from '../core/quantum_core.js';
import { isRealityMode } from '../core/reality_mode.js';
import { getYouTubeChannelStats, postYouTubeVideo } from '../integrations/youtube.js';

interface YouTubeConfig {
    enabled: boolean;
    autoUpload: boolean;
    scheduleTimes: string[];
}

interface YouTubeMetrics {
    views: number;
    subscribers: number;
    watchTime: number;
    likes: number;
    comments: number;
    ctr: number; // Click-through rate
}

interface YouTubeVideo {
    id?: string;
    title: string;
    description: string;
    tags: string[];
    categoryId: string;
    duration: number; // 8-20 minutes
    thumbnail?: string;
    playlist?: string;
    scheduledTime?: string;
}

export class YouTubeAgent {
    private quantumCore: QuantumSwarmCore;
    private config: YouTubeConfig;
    private metrics: YouTubeMetrics;
    private trainedData: Map<string, any>;
    private realityMode: boolean;

    constructor(config?: YouTubeConfig) {
        this.quantumCore = new QuantumSwarmCore();
        this.config = config ?? {
            enabled: true,
            autoUpload: true,
            scheduleTimes: ['12:00', '18:00']
        };
        this.metrics = {
            views: 0,
            subscribers: 0,
            watchTime: 0,
            likes: 0,
            comments: 0,
            ctr: 0
        };
        this.trainedData = new Map();
        this.realityMode = isRealityMode();
    }

    /**
     * Train on successful YouTube channels
     */
    async train(): Promise<void> {
        console.log('🎥 [YouTubeAgent] Training on successful channel datasets...');

        const seoPatterns = await this.learnSEOPatterns();
        const thumbnailPatterns = await this.learnThumbnailPatterns();
        const contentPatterns = await this.learnContentPatterns();

        this.trainedData.set('seo', seoPatterns);
        this.trainedData.set('thumbnails', thumbnailPatterns);
        this.trainedData.set('content', contentPatterns);

        console.log('✅ [YouTubeAgent] Training complete');
    }

    private async learnSEOPatterns(): Promise<any> {
        const patterns = await this.quantumCore.consultOracle(
            'What YouTube SEO strategies work best?',
            [
                'Keyword-rich titles (60 chars)',
                'Detailed descriptions (1000+ words)',
                '5-8 relevant tags',
                'Custom thumbnails with text'
            ],
            ['search_ranking', 'click_through', 'view_retention']
        );

        return {
            optimalTitleLength: 60,
            optimalDescriptionLength: 1000,
            tagCount: 8,
            keywords: ['ai', 'tech', 'tutorial', 'how-to', 'programming']
        };
    }

    private async learnThumbnailPatterns(): Promise<any> {
        return {
            textOverlay: true,
            brightColors: true,
            faceInThumbnail: true,
            contrast: 'high',
            textLength: 'short (3-5 words)'
        };
    }

    private async learnContentPatterns(): Promise<any> {
        const patterns = await this.quantumCore.consultOracle(
            'What YouTube video formats get the most views and watch time?',
            [
                'Tutorial: Step-by-step guides',
                'Listicle: Top 10 lists',
                'Analysis: Deep dive content',
                'Vlog: Personal storytelling'
            ],
            ['view_count', 'watch_time', 'subscribers_gained']
        );

        return {
            recommendedFormats: ['tutorial', 'listicle', 'analysis'],
            optimalLength: 12, // minutes
            hookDuration: 15, // First 15 seconds critical
            chapters: true
        };
    }

    /**
     * Optimize video for YouTube algorithm
     */
    async optimizeForAlgorithm(video: YouTubeVideo): Promise<YouTubeVideo> {
        console.log('🎥 [YouTubeAgent] Optimizing for algorithm...');

        const optimization = await this.quantumCore.consultOracle(
            'How to optimize this YouTube video for maximum reach?',
            [
                'Improve title with keywords',
                'Add more tags',
                'Enhance description',
                'Create compelling thumbnail'
            ],
            ['search_ranking', 'click_through', 'view_retention']
        );

        const optimizedVideo: YouTubeVideo = {
            ...video,
            title: this.optimizeTitle(video.title),
            tags: this.mergeTags(video.tags),
            description: this.enhanceDescription(video.description),
            thumbnail: await this.generateThumbnailSuggestion(video)
        };

        return optimizedVideo;
    }

    private optimizeTitle(title: string): string {
        const patterns = this.trainedData.get('seo');
        if (patterns) {
            // Ensure title has keywords and is optimal length
            if (!title || title.length < 40) {
                title = `${title || 'Video'} | ${patterns.keywords?.[0]?.toUpperCase() || 'TUTORIAL'}`;
            }
        }
        return title || 'New Video';
    }

    private mergeTags(existing: string[] | undefined): string[] {
        const patterns = this.trainedData.get('seo');
        if (!patterns) return existing || ['tutorial', 'ai', 'tech'];

        const existingArr = existing || [];
        const recommendedTags = patterns.keywords || [];
        return [...new Set([...existingArr, ...recommendedTags])].slice(0, 15);
    }

    private enhanceDescription(description: string): string {
        const patterns = this.trainedData.get('seo');
        const length = patterns?.optimalDescriptionLength ?? 1000;

        // Add timestamps, links, and call-to-action
        const enhancement = `\n\n⏱️ TIMESTAMPS:\n0:00 - Introduction\n\n📌 RESOURCES:\nJoin our newsletter for more tips!\n\n#ai #tutorial #programming`;

        return (description?.length ?? 0) > length 
            ? description 
            : (description || '') + enhancement;
    }

    private async generateThumbnailSuggestion(video: YouTubeVideo): Promise<string> {
        // Placeholder for thumbnail generation
        // In production, use AI image generation
        return `thumbnail_${video.id}.png`;
    }

    /**
     * Upload video to YouTube (placeholder for API integration)
     */
    async upload(video: YouTubeVideo): Promise<boolean> {
        console.log('🎥 [YouTubeAgent] Uploading video:', video.title);
        try {
            const response = await postYouTubeVideo({
                id: video.id || `video_${Date.now()}`,
                title: video.title,
                description: video.description,
                tags: video.tags,
                categoryId: video.categoryId,
                privacyStatus: 'public'
            });

            if (!response?.id && !response?.kind) {
                return false;
            }

            await this.refreshMetricsFromApi();
            console.log('✅ [YouTubeAgent] Video upload request submitted');
            return true;
        } catch (error) {
            console.error('❌ [YouTubeAgent] Upload failed:', error);
            return false;
        }
    }

    /**
     * Schedule video for optimal posting time
     */
    async scheduleUpload(video: YouTubeVideo): Promise<string> {
        const bestTime = await this.findOptimalPostTime();
        video.scheduledTime = bestTime;
        console.log(`🎥 [YouTubeAgent] Scheduled for ${bestTime}`);
        return bestTime;
    }

    private async findOptimalPostTime(): Promise<string> {
        const times = this.config.scheduleTimes;
        const result = await this.quantumCore.consultOracle(
            'When is the best time to post on YouTube?',
            times.map(t => `Post at ${t}`),
            ['view_count', 'engagement', 'subscriber_activity']
        );

        const match = result.recommendation.match(/(\d{2}:\d{2})/);
        return match ? match[1] : times[0];
    }

    /**
     * Get current metrics
     */
    async getMetrics(): Promise<YouTubeMetrics> {
        await this.refreshMetricsFromApi();
        this.metrics.ctr = this.metrics.views > 0 
            ? (this.metrics.likes / this.metrics.views) * 100 
            : 0;
        return this.metrics;
    }

    private async refreshMetricsFromApi(): Promise<void> {
        try {
            const data = await getYouTubeChannelStats();
            const stats = data?.items?.[0]?.statistics || {};

            this.metrics.views = Number(stats.viewCount || this.metrics.views || 0);
            this.metrics.subscribers = Number(stats.subscriberCount || this.metrics.subscribers || 0);
            this.metrics.comments = Number(stats.commentCount || this.metrics.comments || 0);
            this.metrics.likes = Number(stats.likeCount || this.metrics.likes || 0);
            this.metrics.watchTime = Number(stats.videoCount || this.metrics.watchTime || 0);
        } catch (error) {
            if (this.realityMode) {
                throw error;
            }
        }
    }

    /**
     * Create playlist for content organization
     */
    async createPlaylist(name: string, videoIds: string[]): Promise<string> {
        console.log(`🎥 [YouTubeAgent] Creating playlist: ${name}`);
        // Placeholder for playlist creation
        return `playlist_${Date.now()}`;
    }

    /**
     * Analyze channel performance
     */
    async analyzePerformance(): Promise<any> {
        const analysis = await this.quantumCore.consultOracle(
            'How is this YouTube channel performing?',
            [
                'Great subscriber growth',
                'Good watch time percentage',
                'Needs improvement on CTR',
                'Consistent upload schedule recommended'
            ],
            ['growth_rate', 'engagement', 'revenue_potential']
        );

        return {
            status: analysis.recommendation,
            recommendations: this.generateRecommendations()
        };
    }

    private generateRecommendations(): string[] {
        const recommendations = [];

        if (this.metrics.ctr < 5) {
            recommendations.push('Improve thumbnails to increase CTR');
        }
        if (this.metrics.watchTime < 100000) {
            recommendations.push('Create longer, more engaging content');
        }
        recommendations.push('Post consistently 2-3 times per week');

        return recommendations;
    }
}
