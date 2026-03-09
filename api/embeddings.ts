import { getAuthHeaders, getLlmConfig } from './_lib/llmProvider';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { text, model } = req.body || {};

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ success: false, error: 'Text is required' });
  }

  const { baseUrl, embeddingModel } = getLlmConfig();

  try {
    const upstream = await fetch(`${baseUrl}/embeddings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        model: model || embeddingModel,
        input: text,
      }),
    });

    const raw = await upstream.text();
    let parsed: any = {};

    try {
      parsed = raw ? JSON.parse(raw) : {};
    } catch {
      parsed = {};
    }

    if (!upstream.ok) {
      const message = parsed?.error?.message || parsed?.message || `Embedding upstream error (${upstream.status})`;
      return res.status(upstream.status).json({ success: false, error: message });
    }

    const embedding = parsed?.data?.[0]?.embedding || [];

    return res.status(200).json({
      success: true,
      data: {
        embedding,
        dimension: Array.isArray(embedding) ? embedding.length : 0,
        model: parsed?.model || model || embeddingModel,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Embedding request failed' });
  }
}
