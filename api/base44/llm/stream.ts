import { getAuthHeaders, getLlmConfig } from '../../_lib/llmProvider';

const encoder = new TextEncoder();

const parseAndEmitChunks = async (
  upstreamBody: ReadableStream<Uint8Array>,
  emitChunk: (chunk: string) => void
) => {
  const reader = upstreamBody.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;

      const data = line.slice(6).trim();
      if (!data) continue;

      if (data === '[DONE]') {
        emitChunk('data: [DONE]\n\n');
        continue;
      }

      try {
        const parsed = JSON.parse(data);
        const chunk = parsed?.choices?.[0]?.delta?.content;
        if (chunk) {
          emitChunk(`data: ${JSON.stringify({ chunk })}\n\n`);
        }
      } catch {
        // Ignore malformed upstream chunks
      }
    }
  }
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { prompt, model, temperature = 0.7 } = req.body || {};

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ success: false, error: 'Prompt is required' });
  }

  const { baseUrl, model: defaultModel } = getLlmConfig();

  const payload = {
    model: model || defaultModel,
    messages: [{ role: 'user', content: prompt }],
    temperature,
    stream: true,
  };

  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!upstream.ok || !upstream.body) {
      const raw = await upstream.text().catch(() => '');
      return res.status(upstream.status || 500).json({
        success: false,
        error: raw || `LLM streaming upstream error (${upstream.status})`,
      });
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    const emitChunk = (chunk: string) => res.write(encoder.encode(chunk));
    await parseAndEmitChunks(upstream.body, emitChunk);
    return res.end();
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Streaming request failed' });
  }
}
