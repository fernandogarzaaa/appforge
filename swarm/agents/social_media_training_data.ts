/**
 * Social Media Swarm Training Datasets
 * Knowledge base for training TikTokAgent, YouTubeAgent, FacebookAgent
 */

export const trainingDatasets = {
    // TikTok viral content patterns
    tiktok: {
        viralFormats: [
            {
                name: 'Hook-First',
                description: 'Attention-grabbing first 3 seconds',
                examples: ['POV: You finally...', 'Wait for it...', 'Stop doing this!'],
                successRate: 0.85,
                optimalDuration: [15, 30, 60]
            },
            {
                name: 'Tutorial',
                description: 'How-to educational content',
                examples: ['How to use AI tools', '5 tips for...', 'Complete guide to...'],
                successRate: 0.72,
                optimalDuration: [30, 60]
            },
            {
                name: 'Reaction',
                description: 'React to trending content',
                examples: ['When you see this...', 'My reaction to...', 'Unpopular opinion...'],
                successRate: 0.78,
                optimalDuration: [15, 30]
            }
        ],
        trendingHashtags: {
            discovery: ['#fyp', '#foryou', '#foryoupage', '#explore', '#discover'],
            niche: {
                tech: ['#tech', '#technology', '#coding', '#programming', '#developer', '#ai', '#machinelearning'],
                business: ['#business', '#entrepreneur', '#success', '#motivation', '#money', '#hustle'],
                lifestyle: ['#lifestyle', '#life', '#daily', '#vibes', '#aesthetic']
            }
        },
        optimalTimes: ['9:00 AM', '12:00 PM', '3:00 PM', '7:00 PM', '9:00 PM'],
        algorithmFactors: {
            watchTime: 0.4,
            engagement: 0.3,
            shares: 0.2,
            comments: 0.1
        }
    },

    // YouTube content patterns
    youtube: {
        videoFormats: [
            {
                name: 'Tutorial',
                description: 'Step-by-step educational content',
                examples: ['How to build an AI app', 'Complete Python course', 'React tutorial'],
                successRate: 0.75,
                optimalLength: [10, 20], // minutes
                ctrBenchmark: 0.08
            },
            {
                name: 'Listicle',
                description: 'Top 10/5/3 format',
                examples: ['Top 10 AI tools', '5 best coding practices', '3 tips for success'],
                successRate: 0.68,
                optimalLength: [8, 15],
                ctrBenchmark: 0.10
            },
            {
                name: 'Analysis',
                description: 'Deep dive and breakdown',
                examples: ['Why AI is the future', 'Analysis of new technology', 'Deep dive into...'],
                successRate: 0.62,
                optimalLength: [15, 25],
                ctrBenchmark: 0.06
            }
        ],
        seoBestPractices: {
            titleLength: [50, 60],
            descriptionLength: [500, 1000],
            tagCount: [5, 10],
            keywords: ['ai', 'tutorial', 'how-to', 'guide', 'tips', 'best', 'top']
        },
        thumbnailBestPractices: {
            textOverlay: true,
            faceVisibility: true,
            brightColors: true,
            contrast: 'high',
            textLength: 'short (3-5 words)'
        },
        optimalTimes: ['2:00 PM', '5:00 PM', '8:00 PM'],
        algorithmFactors: {
            watchTime: 0.35,
            ctr: 0.25,
            engagement: 0.20,
            subscribersGained: 0.20
        }
    },

    // Facebook content patterns
    facebook: {
        contentFormats: [
            {
                name: 'Question',
                description: 'Engage with questions',
                examples: ['What do you think?', 'Comment below!', 'Tag someone...'],
                successRate: 0.70,
                optimalLength: [60, 180]
            },
            {
                name: 'Emotional',
                description: 'Inspiring or emotional content',
                examples: ['Success story', 'Transformation', 'Journey'],
                successRate: 0.80,
                optimalLength: [60, 120]
            },
            {
                name: 'Behind-the-Scenes',
                description: 'Exclusive peek into process',
                examples: ['How we made...', 'Day in the life', 'Behind the scenes'],
                successRate: 0.65,
                optimalLength: [90, 180]
            }
        ],
        targetingOptions: {
            interests: ['technology', 'business', 'education', 'entertainment'],
            ageRange: '25-54',
            demographics: ['professionals', 'students', 'entrepreneurs']
        },
        optimalTimes: ['9:00 AM', '1:00 PM', '7:00 PM'],
        algorithmFactors: {
            reach: 0.30,
            engagement: 0.35,
            shares: 0.25,
            comments: 0.10
        }
    },

    // Cross-platform strategies
    crossPlatform: {
        contentRepurposing: {
            workflow: [
                'Create long-form YouTube video',
                'Extract key moments for TikTok clips',
                'Create Facebook post with teaser',
                'Share Twitter thread with highlights',
                'Post Instagram Reel with highlights'
            ],
            adaptationTips: [
                'Crop to 9:16 for TikTok/Reels',
                'Add platform-specific captions',
                'Adjust hook for each platform',
                'Use native aspect ratios'
            ]
        },
        monetizationStrategies: {
            tiktok: ['Creator Fund', 'Brand sponsorships', 'Affiliate marketing', 'Live gifts'],
            youtube: ['AdSense', 'Channel memberships', 'Super Chats', 'Merchandise shelf'],
            facebook: ['In-stream ads', 'Stars', 'Brand collaborations', 'Fan subscriptions']
        },
        affiliatePrograms: [
            { name: 'Amazon Associates', category: 'General' },
            { name: 'ShareASale', category: 'Various' },
            { name: 'Impact', category: 'Multiple' },
            { name: 'CJ Affiliate', category: 'Multiple' }
        ]
    },

    // AI Video Generation Tools
    videoGenerationTools: {
        textToVideo: [
            { name: 'RunwayML', type: 'cloud', cost: '$0.05/second', quality: 'high' },
            { name: 'Pika Labs', type: 'cloud', cost: 'Freemium', quality: 'high' },
            { name: 'Stable Video Diffusion', type: 'open-source', cost: 'Free', quality: 'medium' },
            { name: 'Luma Dream Machine', type: 'cloud', cost: 'Freemium', quality: 'high' }
        ],
        imageToVideo: [
            { name: 'Runway Gen-2', type: 'cloud', cost: '$0.05/second', quality: 'high' },
            { name: 'Pika', type: 'cloud', cost: 'Freemium', quality: 'high' }
        ],
        voiceover: [
            { name: 'ElevenLabs', type: 'cloud', cost: '$5/month', quality: 'ultra-realistic' },
            { name: 'Murf.ai', type: 'cloud', cost: '$19/month', quality: 'high' },
            { name: 'OpenAI TTS', type: 'cloud', cost: '$15/million chars', quality: 'high' }
        ],
        thumbnailGeneration: [
            { name: 'Canva', type: 'template', cost: 'Freemium', easeOfUse: 'easy' },
            { name: 'Midjourney', type: 'AI', cost: '$10/month', quality: 'high' },
            { name: 'DALL-E', type: 'AI', cost: 'Pay-per-use', quality: 'high' }
        ]
    },

    // Best practices for engagement
    engagementBestPractices: {
        ctaStrategies: [
            'Subscribe for more content',
            'Comment your thoughts',
            'Share with a friend',
            'Save for later',
            'Follow for daily updates'
        ],
        commentEngagement: [
            'Respond to top comments',
            'Ask questions in comments',
            'Pin valuable comments',
            'Create comment-driven content'
        ],
        postingFrequency: {
            tiktok: '3-4 times per day',
            youtube: '2-3 times per week',
            facebook: '1-2 times per day'
        }
    },

    // Analytics and tracking
    metricsToTrack: {
        tiktok: ['views', 'likes', 'comments', 'shares', 'followers', 'profile visits'],
        youtube: ['views', 'watch time', 'subscribers', 'likes', 'comments', 'CTR'],
        facebook: ['reach', 'impressions', 'engagement', 'followers', 'shares', 'comments']
    }
};

export default trainingDatasets;
