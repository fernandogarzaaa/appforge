import axios from 'axios';

export default async function handler(request, response) {
    const apiKey = process.env.BASE44_API_KEY;
    const apiUrl = process.env.BASE44_API_URL;

    console.log('[Cron] Config Check:', {
        hasKey: !!apiKey,
        hasUrl: !!apiUrl,
        urlValue: apiUrl
    });

    if (!apiKey || !apiUrl) {
        console.error('[Cron] Missing Config');
        return response.status(400).json({
            error: 'Missing Configuration',
            details: 'Please set BASE44_API_KEY and BASE44_API_URL in Vercel Environment Variables.'
        });
    }

    try {
        let baseUrl = apiUrl;
        if (!baseUrl.startsWith('http')) {
            baseUrl = `https://${baseUrl}`;
        }
        const targetUrl = `${baseUrl}/functions/autonomousCycle`;
        console.log(`[Cron] Pinging: ${targetUrl}`);

        const res = await axios.post(targetUrl, {}, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'api_key': apiKey, // Add this to support standard API keys
                'Content-Type': 'application/json'
            }
        });

        return response.status(200).json({
            success: true,
            daemons_awakened: true,
            data: res.data
        });

    } catch (error) {
        console.error('[Cron] Execution Failed:', error.message);
        if (error.response) {
            console.error('[Cron] Response Error:', error.response.status, error.response.data);
            return response.status(error.response.status).json({
                error: 'Upstream Error',
                status: error.response.status,
                data: error.response.data
            });
        }
        return response.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
            stack: error.stack
        });
    }
}
