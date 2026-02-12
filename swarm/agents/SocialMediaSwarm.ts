/**
 * Social Media Revenue Swarm
 * Generates and uploads AI content to TikTok, YouTube, Facebook, Instagram, and Twitter/X for revenue
 */

import { QuantumSwarmCore } from '../core/quantum_core.js';
import { isRealityMode } from '../core/reality_mode.js';
import { TikTokAgent } from './TikTokAgent.js';
import { YouTubeAgent } from './YouTubeAgent.js';
import { FacebookAgent } from './FacebookAgent.js';
import { InstagramAgent } from './InstagramAgent.js';
import { TwitterAgent } from './TwitterAgent.js';
import { ContentGeneratorAgent } from './ContentGeneratorAgent.js';
import { ViralTrendAnalyzer } from './ViralTrendAnalyzer.js';
import { isTwitterConfigured } from '../integrations/twitter.js';
import { isYouTubeConfigured } from '../integrations/youtube.js';

interface SocialMediaConfig {
    tiktok: {
        enabled: boolean;
        autoUpload: boolean;
        scheduleTimes: string[];
    };
    youtube: {
        enabled: boolean;
        autoUpload: boolean;
        scheduleTimes: string[];
    };
    facebook: {
        enabled: boolean;
        autoUpload: boolean;
        scheduleTimes: string[];
    };
    instagram: {
        enabled: boolean;
        autoUpload: boolean;
        scheduleTimes: string[];
    };
    twitter: {
        enabled: boolean;
        autoPost: boolean;
        scheduleTimes: string[];
    };
    contentGeneration: {
        style: 'viral' | 'educational' | 'entertainment' | 'mixed';
        dailyQuota: number;
        topics: string[];
    };
    monetization: {
        affiliateLinks: string[];
        brandPartnerships: string[];
        crossPromote: boolean;
    };
}

interface RevenueMetrics {
    tiktok: {
        views: number;
        followers: number;
        revenue: number;
        engagement: number;
    };
    youtube: {
        views: number;
        subscribers: number;
        revenue: number;
        watchTime: number;
    };
    facebook: {
        reach: number;
        followers: number;
        revenue: number;
        engagement: number;
    };
    instagram: {
        reach: number;
        followers: number;
        revenue: number;
        engagement: number;
    };
    twitter: {
        impressions: number;
        followers: number;
        revenue: number;
        engagement: number;
    };
    totalRevenue: number;
}

export class SocialMediaSwarm {
    private quantumCore: QuantumSwarmCore;
    private config: SocialMediaConfig;
    private tiktokAgent: TikTokAgent;
    private youtubeAgent: YouTubeAgent;
    private facebookAgent: FacebookAgent;
    private instagramAgent: InstagramAgent;
    private twitterAgent: TwitterAgent;
    private contentGenerator: ContentGeneratorAgent;
    private trendAnalyzer: ViralTrendAnalyzer;
    private revenueMetrics: RevenueMetrics;
    private realityMode: boolean;

    constructor(config?: Partial<SocialMediaConfig>) {
        this.quantumCore = new QuantumSwarmCore();
        this.realityMode = isRealityMode();
        
        this.config = {
            tiktok: config?.tiktok ?? {
                enabled: true,
                autoUpload: true,
                scheduleTimes: ['09:00', '15:00', '21:00']
            },
            youtube: config?.youtube ?? {
                enabled: true,
                autoUpload: true,
                scheduleTimes: ['12:00', '18:00']
            },
            facebook: config?.facebook ?? {
                enabled: true,
                autoUpload: true,
                scheduleTimes: ['10:00', '16:00', '22:00']
            },
            instagram: config?.instagram ?? {
                enabled: true,
                autoUpload: true,
                scheduleTimes: ['09:00', '13:00', '20:00']
            },
            twitter: config?.twitter ?? {
                enabled: true,
                autoPost: true,
                scheduleTimes: ['08:00', '12:00', '18:00', '21:00']
            },
            contentGeneration: config?.contentGeneration ?? {
                style: 'mixed',
                dailyQuota: 5,
                topics: ['tech', 'ai', 'business', 'lifestyle', 'gaming']
            },
            monetization: config?.monetization ?? {
                affiliateLinks: [],
                brandPartnerships: [],
                crossPromote: true
            }
        };

        if (this.realityMode) {
            // These platforms are currently simulation-only in this codebase.
            this.config.tiktok.enabled = false;
            this.config.facebook.enabled = false;
            this.config.instagram.enabled = false;

            if (!isTwitterConfigured()) {
                this.config.twitter.enabled = false;
                this.config.twitter.autoPost = false;
            }
            if (!isYouTubeConfigured()) {
                this.config.youtube.enabled = false;
                this.config.youtube.autoUpload = false;
            }

            console.log('🌍 [SocialMediaSwarm] Reality mode active: TikTok/Facebook/Instagram disabled (no live connector).');
            console.log(`🌍 [SocialMediaSwarm] Live connectors: YouTube=${this.config.youtube.enabled}, Twitter=${this.config.twitter.enabled}`);
        }

        // Initialize agents
        this.tiktokAgent = new TikTokAgent(this.config.tiktok);
        this.youtubeAgent = new YouTubeAgent(this.config.youtube);
        this.facebookAgent = new FacebookAgent(this.config.facebook);
        this.instagramAgent = new InstagramAgent(this.config.instagram);
        this.twitterAgent = new TwitterAgent(this.config.twitter);
        this.contentGenerator = new ContentGeneratorAgent(this.config.contentGeneration);
        this.trendAnalyzer = new ViralTrendAnalyzer();

        this.revenueMetrics = {
            tiktok: { views: 0, followers: 0, revenue: 0, engagement: 0 },
            youtube: { views: 0, subscribers: 0, revenue: 0, watchTime: 0 },
            facebook: { reach: 0, followers: 0, revenue: 0, engagement: 0 },
            instagram: { reach: 0, followers: 0, revenue: 0, engagement: 0 },
            twitter: { impressions: 0, followers: 0, revenue: 0, engagement: 0 },
            totalRevenue: 0
        };
    }

    /**
     * Main autonomous loop for social media swarm
     */
    async runCycle(): Promise<void> {
        console.log('📱 [SocialMediaSwarm] Starting autonomous cycle...');

        if (
            this.realityMode
            && !this.config.youtube.enabled
            && !this.config.twitter.enabled
        ) {
            throw new Error('[SocialMediaSwarm] Reality mode enabled but no live social connectors are configured');
        }

        // Step 1: Analyze trends
        console.log('📊 [SocialMediaSwarm] Analyzing viral trends...');
        const trends = await this.trendAnalyzer.analyzeTrends();

        // Step 2: Generate content based on trends
        console.log('🎬 [SocialMediaSwarm] Generating AI content...');
        const contentPlans = await this.contentGenerator.generateContentPlan(trends);
        const planFor = (platform: string) =>
            contentPlans.find((plan) => plan.platform === platform) || contentPlans[0];

        // Step 3: Create and upload to each platform
        if (this.config.tiktok.enabled && planFor('tiktok')) {
            await this.processTikTok(planFor('tiktok'));
        }
        if (this.config.youtube.enabled && planFor('youtube')) {
            await this.processYouTube(planFor('youtube'));
        }
        if (this.config.facebook.enabled && planFor('facebook')) {
            await this.processFacebook(planFor('facebook'));
        }
        if (this.config.instagram.enabled && planFor('instagram')) {
            await this.processInstagram(planFor('instagram'));
        }
        if (this.config.twitter.enabled && planFor('twitter')) {
            await this.processTwitter(planFor('twitter'));
        }

        // Step 4: Calculate and report revenue
        await this.calculateRevenue();

        // Step 5: Consult Oracle for optimization
        await this.optimizeStrategy();

        console.log('✅ [SocialMediaSwarm] Cycle complete');
    }

    private async processTikTok(contentPlan: any): Promise<void> {
        console.log('📱 [TikTok] Processing content...');
        
        // Generate short-form video (15-60 seconds)
        const video = await this.contentGenerator.generateShortFormVideo(contentPlan);
        
        // Optimize for TikTok algorithm
        const optimizedVideo = await this.tiktokAgent.optimizeForAlgorithm(video);
        
        // Upload if auto-upload enabled
        if (this.config.tiktok.autoUpload) {
            await this.tiktokAgent.upload(optimizedVideo);
        }

        // Track metrics
        const metrics = await this.tiktokAgent.getMetrics();
        this.revenueMetrics.tiktok = {
            views: metrics.views,
            followers: metrics.followers,
            revenue: this.calculateTikTokRevenue(metrics),
            engagement: metrics.engagement
        };
    }

    private async processYouTube(contentPlan: any): Promise<void> {
        console.log('🎥 [YouTube] Processing content...');
        
        // Generate long-form video (8-20 minutes)
        const video = await this.contentGenerator.generateLongFormVideo(contentPlan);
        
        // Optimize for YouTube algorithm
        const optimizedVideo = await this.youtubeAgent.optimizeForAlgorithm(video);
        
        // Upload if auto-upload enabled
        if (this.config.youtube.autoUpload) {
            await this.youtubeAgent.upload(optimizedVideo);
        }

        // Track metrics
        const metrics = await this.youtubeAgent.getMetrics();
        this.revenueMetrics.youtube = {
            views: metrics.views,
            subscribers: metrics.subscribers,
            revenue: this.calculateYouTubeRevenue(metrics),
            watchTime: metrics.watchTime
        };
    }

    private async processFacebook(contentPlan: any): Promise<void> {
        console.log('👥 [Facebook] Processing content...');
        
        // Generate video optimized for Facebook
        const video = await this.contentGenerator.generateFacebookVideo(contentPlan);
        
        // Optimize for Facebook algorithm
        const optimizedVideo = await this.facebookAgent.optimizeForAlgorithm(video);
        
        // Upload if auto-upload enabled
        if (this.config.facebook.autoUpload) {
            await this.facebookAgent.upload(optimizedVideo);
        }

        // Track metrics
        const metrics = await this.facebookAgent.getMetrics();
        this.revenueMetrics.facebook = {
            reach: metrics.reach,
            followers: metrics.followers,
            revenue: this.calculateFacebookRevenue(metrics),
            engagement: metrics.engagement
        };
    }

    private async processInstagram(contentPlan: any): Promise<void> {
        console.log('📸 [Instagram] Processing content...');

        const post = {
            caption: contentPlan?.script || `Insights about ${contentPlan?.topic || 'technology'}`,
            hashtags: contentPlan?.hashtags || ['#instagram', '#reels', '#creator'],
            type: 'reel' as const,
            mediaUrls: ['reel_clip.mp4']
        };

        const optimizedPost = await this.instagramAgent.optimizeForAlgorithm(post);

        if (this.config.instagram.autoUpload) {
            await this.instagramAgent.upload(optimizedPost);
        }

        const metrics = await this.instagramAgent.getMetrics();
        this.revenueMetrics.instagram = {
            reach: metrics.reach,
            followers: metrics.followers,
            revenue: this.calculateInstagramRevenue(metrics),
            engagement: metrics.engagement
        };
    }

    private async processTwitter(contentPlan: any): Promise<void> {
        console.log('🐦 [Twitter/X] Processing content...');

        const thread = await this.twitterAgent.createThread(contentPlan?.topic || 'ai');

        if (this.config.twitter.autoPost) {
            for (const tweet of thread.slice(0, 3)) {
                const optimizedTweet = await this.twitterAgent.optimizeTweet(tweet);
                await this.twitterAgent.post(optimizedTweet);
            }
        }

        const metrics = await this.twitterAgent.getMetrics();
        this.revenueMetrics.twitter = {
            impressions: metrics.impressions,
            followers: metrics.followers,
            revenue: this.calculateTwitterRevenue(metrics),
            engagement: metrics.engagement
        };
    }

    private calculateTikTokRevenue(metrics: any): number {
        // TikTok Creator Fund: ~$0.02-$0.04 per 1000 views
        // Brand sponsorships: variable
        // Affiliate marketing: commission based
        return (metrics.views / 1000) * 0.03 + (metrics.engagement * 0.5);
    }

    private calculateYouTubeRevenue(metrics: any): number {
        // YouTube AdSense: ~$3-$5 per 1000 views (varies by niche)
        // YouTube Premium: share of subscription revenue
        return (metrics.views / 1000) * 4 + (metrics.watchTime / 1000) * 0.5;
    }

    private calculateFacebookRevenue(metrics: any): number {
        // Facebook in-stream ads: ~$1-$2 per 1000 views
        // Stars: viewer donations
        return (metrics.reach / 1000) * 1.5 + (metrics.engagement * 0.3);
    }

    private calculateInstagramRevenue(metrics: any): number {
        // Sponsorship + affiliate blend by reach/engagement
        return (metrics.reach / 1000) * 1.8 + (metrics.engagement * 0.45);
    }

    private calculateTwitterRevenue(metrics: any): number {
        // Sponsorship + creator program blend by impressions/engagement
        return (metrics.impressions / 1000) * 0.9 + (metrics.engagement * 0.25);
    }

    private async calculateRevenue(): Promise<void> {
        this.revenueMetrics.totalRevenue = 
            this.revenueMetrics.tiktok.revenue +
            this.revenueMetrics.youtube.revenue +
            this.revenueMetrics.facebook.revenue +
            this.revenueMetrics.instagram.revenue +
            this.revenueMetrics.twitter.revenue;

        console.log('💰 [SocialMediaSwarm] Revenue Report:');
        console.log(`   TikTok: $${this.revenueMetrics.tiktok.revenue.toFixed(2)}`);
        console.log(`   YouTube: $${this.revenueMetrics.youtube.revenue.toFixed(2)}`);
        console.log(`   Facebook: $${this.revenueMetrics.facebook.revenue.toFixed(2)}`);
        console.log(`   Instagram: $${this.revenueMetrics.instagram.revenue.toFixed(2)}`);
        console.log(`   Twitter/X: $${this.revenueMetrics.twitter.revenue.toFixed(2)}`);
        console.log(`   TOTAL: $${this.revenueMetrics.totalRevenue.toFixed(2)}`);

        // Report to main swarm
        await this.quantumCore.reportOutcome('social_media_revenue', true, {
            revenue: this.revenueMetrics,
            timestamp: new Date().toISOString()
        });
    }

    private async optimizeStrategy(): Promise<void> {
        const recommendation = await this.quantumCore.consultOracle(
            'How can the social media swarm improve engagement and revenue?',
            [
                'Focus on trending topics in tech and AI',
                'Increase video production quality',
                'Optimize posting times based on audience',
                'Cross-promote content between platforms',
                'Scale Instagram and Twitter/X thread cadence'
            ],
            ['revenue_increase', 'engagement_rate', 'cost_efficiency']
        );

        console.log('🎯 [SocialMediaSwarm] Optimization:', recommendation.recommendation);
    }

    async getRevenueReport(): Promise<RevenueMetrics> {
        return this.revenueMetrics;
    }

    async train(): Promise<void> {
        console.log('📚 [SocialMediaSwarm] Training on datasets...');
        
        // Train each agent
        await this.tiktokAgent.train();
        await this.youtubeAgent.train();
        await this.facebookAgent.train();
        await this.instagramAgent.train();
        await this.twitterAgent.train();
        await this.contentGenerator.train();
        await this.trendAnalyzer.train();

        console.log('✅ [SocialMediaSwarm] Training complete');
    }
}

// Export individual agents for standalone use
export { TikTokAgent } from './TikTokAgent.js';
export { YouTubeAgent } from './YouTubeAgent.js';
export { FacebookAgent } from './FacebookAgent.js';
export { InstagramAgent } from './InstagramAgent.js';
export { TwitterAgent } from './TwitterAgent.js';
export { ContentGeneratorAgent } from './ContentGeneratorAgent.js';
export { ViralTrendAnalyzer } from './ViralTrendAnalyzer.js';
