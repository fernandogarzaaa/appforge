
import fetch from 'node-fetch';

const API_URL = 'https://app.base44.com/api';

async function huntBugs(config) {
    const { appId, apiKey, reportEmail } = config;

    if (!appId || !apiKey) {
        console.error('❌ Bug Hunter: Missing credentials (appId or apiKey)');
        return;
    }

    const headers = { 'api_key': apiKey, 'Content-Type': 'application/json' };

    console.log('🐞 Bug Hunter: Analyzing feedback & logs...');

    try {
        // 1. Fetch User Feedback & Logs
        const feedbackRes = await fetch(`${API_URL}/apps/${appId}/entities/AIFeedback?sort=-created_at&limit=10`, { headers });
        const feedback = feedbackRes.ok ? await feedbackRes.json() : [];

        const logsRes = await fetch(`${API_URL}/apps/${appId}/entities/AuditLog?sort=-created_at&limit=20`, { headers });
        const logs = logsRes.ok ? await logsRes.json() : [];

        // 2. Simple Pattern Matching
        const potentialBugs = [];
        const negativeKeywords = ['crash', 'failed', 'error', 'broken', 'bug', 'not working'];

        if (Array.isArray(feedback)) {
            feedback.forEach(f => {
                if (f.feedback && negativeKeywords.some(k => f.feedback.toLowerCase().includes(k))) {
                    potentialBugs.push({
                        source: 'User Feedback',
                        text: f.feedback,
                        severity: 'high'
                    });
                }
            });
        }

        // 3. Report
        if (potentialBugs.length > 0) {
            console.log(`🔍 Found ${potentialBugs.length} potential bugs.`);
            // Send Report
            await fetch(`${API_URL}/apps/${appId}/integration-endpoints/Core/SendEmail`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    to: reportEmail || 'fernandogarzaaa@gmail.com',
                    subject: `[Bug Hunter] ${potentialBugs.length} Potential Issues Detected`,
                    body: `<h2>Bug Report</h2><ul>${potentialBugs.map(b => `<li>[${b.severity}] ${b.text}</li>`).join('')}</ul>`
                })
            });
            console.log('📧 Bug Report Sent.');
        } else {
            console.log('✅ No obvious bugs detected in recent feedback.');
        }

    } catch (e) {
        console.error('❌ Bug Hunter Error:', e);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const config = {
        appId: process.env.BASE44_APP_ID,
        apiKey: process.env.BASE44_API_KEY,
        reportEmail: 'fernandogarzaaa@gmail.com'
    };
    if (config.appId && config.apiKey) {
        huntBugs(config);
    } else {
        // console.log('Skipping direct run: Missing env vars');
    }
}

export { huntBugs };
