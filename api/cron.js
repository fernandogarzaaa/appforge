export default async function handler(request, response) {
    const apiKey = process.env.BASE44_API_KEY;
    const apiUrl = process.env.BASE44_API_URL;

    if (!apiKey || !apiUrl) {
        return response.status(500).json({
            error: 'Missing Configuration',
            details: 'Please set BASE44_API_KEY and BASE44_API_URL in Vercel Environment Variables.'
        });
    }

    try {
        const targetUrl = `${apiUrl}/functions/v1/autonomousCycle`;
        console.log(`[Cron] Pinging: ${targetUrl}`);

        const res = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const errorText = await res.text();
            return response.status(res.status).json({ error: 'Function Call Failed', details: errorText });
        }

        const data = await res.json();
        return response.status(200).json({ success: true, daemons_awakened: true, data });

    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
}
