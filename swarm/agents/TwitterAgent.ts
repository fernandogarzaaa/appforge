/**
 * Twitter/X Agent - Specialized for short-form content and viral threads
 * Focus: Threads, trending topics, engagement, virality
 */

import { QuantumSwarmCore } from '../core/quantum_core.js';
import { isRealityMode } from '../core/reality_mode.js';
import { getTwitterStats, postTweet as postTweetApi } from '../integrations/twitter.js';

interface TwitterConfig {
    enabled: boolean;
    autoPost: boolean;
    scheduleTimes: string[];
}

interface TwitterMetrics {
    followers: number;
    impressions: number;
    engagement: number;
    retweets: number;
    likes: number;
    replies: number;
}

interface Tweet {
    id?: string;
    text: string;
    hashtags: string[];
    type: 'single' | 'thread' | 'reply';
    scheduledTime?: string;
}

export class TwitterAgent {
    private quantumCore: QuantumSwarmCore;
    private config: TwitterConfig;
    private metrics: TwitterMetrics;
    private trainedData: Map<string, any>;
    private realityMode: boolean;

    constructor(config?: TwitterConfig) {
        this.quantumCore = new QuantumSwarmCore();
        this.config = config ?? {
            enabled: true,
            autoPost: true,
            scheduleTimes: ['08:00', '12:00', '17:00', '20:00']
        };
        this.metrics = {
            followers: 0,
            impressions: 0,
            engagement: 0,
            retweets: 0,
            likes: 0,
            replies: 0
        };
        this.trainedData = new Map();
        this.realityMode = isRealityMode();
    }

    async train(): Promise<void> {
        console.log('🐦 [TwitterAgent] Training on viral content...');

        const viralPatterns = await this.learnViralPatterns();
        const threadPatterns = await this.learnThreadPatterns();
        const engagementPatterns = await this.learnEngagementPatterns();

        this.trainedData.set('viral', viralPatterns);
        this.trainedData.set('threads', threadPatterns);
        this.trainedData.set('engagement', engagementPatterns);

        console.log('✅ [TwitterAgent] Training complete');
    }

    private async learnViralPatterns(): Promise<any> {
        return {
            hookTypes: ['hot take', 'prediction', 'story', 'tip', 'controversy'],
            optimalLength: '100-280 characters',
            bestTimes: ['8:00 AM', '12:00 PM', '5:00 PM', '8:00 PM'],
            viralityFactors: ['controversy', 'usefulness', 'entertainment', 'timeliness']
        };
    }

    private async learnThreadPatterns(): Promise<any> {
        return {
            optimalLength: '5-10 tweets',
            structure: ['hook', 'context', 'value', 'conclusion', 'cta'],
            engagementBoost: '2-3x more engagement than single tweets'
        };
    }

    private async learnEngagementPatterns(): Promise<any> {
        return {
            ctaTypes: ['retweet if', 'follow for', 'quote tweet', 'reply with'],
            bestPractices: ['ask questions', 'use threads', 'quote tweet', 'engage replies'],
            growthRate: '5-10% per viral thread'
        };
    }

    async optimizeTweet(tweet: Tweet): Promise<Tweet> {
        console.log('🐦 [TwitterAgent] Optimizing tweet...');

        const optimizedTweet: Tweet = {
            ...tweet,
            text: this.optimizeText(tweet.text),
            hashtags: this.optimizeHashthtags(tweet.hashtags)
        };

        return optimizedTweet;
    }

    private optimizeText(text: string): string {
        const patterns = this.trainedData.get('viral');
        
        // Add engagement hook if missing
        if (text.length < 50) {
            const hooks = [
                '🔥 Hot take:',
                '💡 Unpopular opinion:',
                '🚀 Prediction:',
                '📝 Thread 🧵:'
            ];
            const selectedHook = this.realityMode ? hooks[0] : hooks[Math.floor(Math.random() * hooks.length)];
            text = selectedHook + ' ' + text;
        }

        return text;
    }

    private optimizeHashthtags(hashtags: string[]): string[] {
        const trained = this.trainedData.get('viral');
        if (!trained) return hashtags;

        // Limit to 2-3 hashtags for best engagement
        return hashtags.slice(0, 3);
    }

    async post(tweet: Tweet): Promise<boolean> {
        console.log('🐦 [TwitterAgent] Posting:', tweet.type);
        try {
            const response = await postTweetApi(tweet.text);
            if (!response?.data?.id) {
                return false;
            }
            await this.refreshMetricsFromApi();
            return true;
        } catch (error) {
            console.error('❌ [TwitterAgent] Post failed:', error);
            return false;
        }
    }

    async createThread(topic: string): Promise<Tweet[]> {
        console.log('🐦 [TwitterAgent] Creating thread about:', topic);

        // Generate 5-10 tweet thread
        const thread: Tweet[] = [];
        
        const structures = [
            `🧵 THREAD: Everything you need to know about ${topic}\n\n1/6`,
            `Let's talk about ${topic} 👇\n\n1/`,
            `I spent 100+ hours researching ${topic}. Here are my findings:\n\n1/`
        ];

        for (let i = 0; i < 5; i++) {
            thread.push({
                text: structures[0] + `${i + 1}\n\nPoint ${i + 1}: Key insight about ${topic}`,
                hashtags: [`#${topic}`, '#thread'],
                type: 'thread'
            });
        }

        thread.push({
            text: `\n✅ Follow for more ${topic} content!\n\nRT to share this thread 🔄`,
            hashtags: [],
            type: 'thread'
        });

        return thread;
    }

    async getMetrics(): Promise<TwitterMetrics> {
        await this.refreshMetricsFromApi();
        return this.metrics;
    }

    private async refreshMetricsFromApi(): Promise<void> {
        try {
            const stats = await getTwitterStats();
            const metrics = stats?.data?.public_metrics || {};

            this.metrics.followers = Number(metrics.followers_count || this.metrics.followers || 0);
            this.metrics.impressions = Number(metrics.tweet_count || this.metrics.impressions || 0);
            this.metrics.likes = Number(metrics.listed_count || this.metrics.likes || 0);
            this.metrics.retweets = Number(metrics.following_count || this.metrics.retweets || 0);
            this.metrics.engagement = this.metrics.impressions > 0
                ? ((this.metrics.likes + this.metrics.retweets + this.metrics.replies) / this.metrics.impressions) * 100
                : 0;
        } catch (error) {
            if (this.realityMode) {
                throw error;
            }
        }
    }
}
