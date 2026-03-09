import { getAuthHeaders, getLlmConfig } from '../_lib/llmProvider';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const {
    prompt,
    model,
    temperature = 0.7,
    maxTokens = 2000,
    jsonSchema,
  } = req.body || {};

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ success: false, error: 'Prompt is required' });
  }

  const { baseUrl, model: defaultModel } = getLlmConfig();

  const payload: Record<string, unknown> = {
    model: model || defaultModel,
    messages: [{ role: 'user', content: prompt }],
    temperature,
    max_tokens: maxTokens,
    stream: false,
  };

  if (jsonSchema && typeof jsonSchema === 'object') {
    payload.response_format = {
      type: 'json_schema',
      json_schema: {
        name: 'appforge_schema',
        schema: jsonSchema,
      },
    };
  }

  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const raw = await upstream.text();
    let parsed: any = {};

    try {
      parsed = raw ? JSON.parse(raw) : {};
    } catch {
      parsed = {};
    }

    if (!upstream.ok) {
      const message = parsed?.error?.message || parsed?.message || `LLM upstream error (${upstream.status})`;
      return res.status(upstream.status).json({ success: false, error: message });
    }

    const text = parsed?.choices?.[0]?.message?.content || '';
    const resolvedModel = parsed?.model || model || defaultModel;

    return res.status(200).json({
      success: true,
      data: {
        text,
        model: resolvedModel,
        usage: parsed?.usage || null,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'LLM request failed' });
  }
}
