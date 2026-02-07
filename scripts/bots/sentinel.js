
import fetch from 'node-fetch';
import { writeSignal } from './utils/memory.js';

const API_URL = 'https://app.base44.com/api';

async function checkSecurty(config) {
    const { appId, apiKey, reportEmail } = config;

    if (!appId || !apiKey) {
        console.error('❌ Sentinel Bot: Missing credentials (appId or apiKey)');
        return;
    }

    const headers = {
        'api_key': apiKey,
        'Content-Type': 'application/json'
    };

    console.log('🛡️ Sentinel Bot: Scanning System Security...');
    const errors = [];
    const warnings = [];

    try {
        // 1. Check Integrations for Errors
        const integrationsRes = await fetch(`${API_URL}/apps/${appId}/entities/ExternalBotIntegration`, { headers });
        if (integrationsRes.ok) {
            const integrations = await integrationsRes.json();
            for (const integration of integrations) {
                if (integration.error_count > 50) {
                    errors.push(`CRITICAL: Integration "${integration.name}" has ${integration.error_count} errors!`);
                }
                if (!integration.webhook_url && integration.is_active) {
                    warnings.push(`WARNING: Active integration "${integration.name}" missing Webhook URL.`);
                }
            }
        }

        // 2. Check for "High Severity" App Errors
        const errorsRes = await fetch(`${API_URL}/apps/${appId}/entities/AppError?limit=20&sort=-created_at`, { headers });
        if (errorsRes.ok) {
            const recentErrors = await errorsRes.json();
            const criticalErrors = recentErrors.filter(e => e.severity === 'critical');
            if (criticalErrors.length > 0) {
                const msg = `CRITICAL: ${criticalErrors.length} critical application errors detected in last 20 logs.`;
                errors.push(msg);

                // SWARM SIGNAL: Trigger God Mode to investigate
                writeSignal('SENTINEL', 'SECURITY_INCIDENT', 'CRITICAL', {
                    description: msg,
                    trace: criticalErrors[0].stack_trace || 'No trace available'
                });
            }
        }

        // Report Findings
        if (errors.length > 0 || warnings.length > 0) {
            console.log('⚠️ Security Issues Detected:');
            errors.forEach(e => console.error(e));
            warnings.forEach(w => console.warn(w));

            // Send Alert Email
            await sendAlert(errors, warnings, config, headers);
        } else {
            console.log('✅ System Secure. No critical issues found.');
        }

    } catch (error) {
        console.error('❌ Sentinel Bot Error:', error);
    }
}

async function sendAlert(errors, warnings, config, headers) {
    const { appId, reportEmail } = config;
    const emailBody = `
        <h2>🛡️ Sentinel Bot Security Alert</h2>
        <h3>Critical Issues (${errors.length})</h3>
        <ul>${errors.map(e => `<li style="color:red">${e}</li>`).join('')}</ul>
        <h3>Warnings (${warnings.length})</h3>
        <ul>${warnings.map(w => `<li style="color:orange">${w}</li>`).join('')}</ul>
    `;

    await fetch(`${API_URL}/apps/${appId}/integration-endpoints/Core/SendEmail`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            to: reportEmail || 'fernandogarzaaa@gmail.com',
            subject: `[Sentinel] Security Alert - ${errors.length} Critical Issues`,
            body: emailBody
        })
    });
    console.log('📧 Security Alert Email Sent.');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const config = {
        appId: process.env.BASE44_APP_ID,
        apiKey: process.env.BASE44_API_KEY,
        reportEmail: 'fernandogarzaaa@gmail.com'
    };
    if (config.appId && config.apiKey) {
        checkSecurty(config);
    }
}

export { checkSecurty };
