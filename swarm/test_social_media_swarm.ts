/**
 * Test Social Media Swarm
 */

import { SocialMediaSwarm } from './agents/SocialMediaSwarm.js';

async function testSocialMediaSwarm() {
    console.log('📱════════════════════════════════════════════════════════════📱');
    console.log('    TESTING SOCIAL MEDIA REVENUE SWARM');
    console.log('📱════════════════════════════════════════════════════════════📱\n');

    // Create swarm instance
    const socialSwarm = new SocialMediaSwarm({
        tiktok: {
            enabled: true,
            autoUpload: false,
            scheduleTimes: ['09:00', '15:00', '21:00']
        },
        youtube: {
            enabled: true,
            autoUpload: false,
            scheduleTimes: ['12:00', '18:00']
        },
        facebook: {
            enabled: true,
            autoUpload: false,
            scheduleTimes: ['10:00', '16:00', '22:00']
        },
        contentGeneration: {
            style: 'viral',
            dailyQuota: 5,
            topics: ['ai', 'tech', 'coding', 'business']
        },
        monetization: {
            affiliateLinks: [],
            brandPartnerships: [],
            crossPromote: true
        }
    });

    console.log('📚 Training swarm agents...\n');

    // Train all agents
    await socialSwarm.train();

    console.log('\n🚀 Running Social Media Swarm cycle...\n');

    // Run one cycle
    await socialSwarm.runCycle();

    // Get revenue report
    const report = await socialSwarm.getRevenueReport();

    console.log('\n💰════════════════════════════════════════════════════════════💰');
    console.log('    REVENUE REPORT');
    console.log('💰════════════════════════════════════════════════════════════💰\n');

    console.log('📱 TikTok:');
    console.log(`   Views: ${report.tiktok.views}`);
    console.log(`   Followers: ${report.tiktok.followers}`);
    console.log(`   Revenue: $${report.tiktok.revenue.toFixed(2)}`);

    console.log('\n🎥 YouTube:');
    console.log(`   Views: ${report.youtube.views}`);
    console.log(`   Subscribers: ${report.youtube.subscribers}`);
    console.log(`   Revenue: $${report.youtube.revenue.toFixed(2)}`);

    console.log('\n👥 Facebook:');
    console.log(`   Reach: ${report.facebook.reach}`);
    console.log(`   Followers: ${report.facebook.followers}`);
    console.log(`   Revenue: $${report.facebook.revenue.toFixed(2)}`);

    console.log('\n💵 TOTAL REVENUE: $' + report.totalRevenue.toFixed(2));

    console.log('\n✅ Social Media Swarm test complete!');
}

testSocialMediaSwarm().catch(console.error);
