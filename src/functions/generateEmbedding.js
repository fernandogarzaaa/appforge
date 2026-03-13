import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const payload = await req.json().catch(() => ({}));
        const { text } = payload || {};
        if (!text) {
            return Response.json({ error: 'Missing text' }, { status: 400 });
        }
        const apiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('EMBEDDINGS_API_KEY');
        const apiUrl = Deno.env.get('EMBEDDINGS_API_URL') || 'https://api.openai.com/v1/embeddings';
        const model = Deno.env.get('EMBEDDINGS_MODEL') || 'text-embedding-3-small';
        if (!apiKey) {
            return Response.json({ error: 'Embedding provider not configured' }, { status: 400 });
        }
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model,
                input: text
            })
        });
        const data = await response.json();
        if (!response.ok) {
            return Response.json({ error: data?.error?.message || 'Embedding request failed' }, { status: 500 });
        }
        const embedding = data?.data?.[0]?.embedding || data?.embedding;
        if (!embedding) {
            return Response.json({ error: 'Embedding not returned by provider' }, { status: 500 });
        }
        return Response.json({ embedding, model });
    }
    catch (error) {
        return Response.json({ error: error.message || 'Embedding generation failed' }, { status: 500 });
    }
});
