import { getLlmConfig } from '../_lib/llmProvider';

const maskUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch {
    return '';
  }
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { baseUrl, apiKey, model, embeddingModel } = getLlmConfig();
  const hasApiKey = Boolean(apiKey);
  const configured = Boolean(baseUrl && hasApiKey && model && embeddingModel);

  return res.status(200).json({
    configured,
    hasApiKey,
    baseUrl: maskUrl(baseUrl),
    model,
    embeddingModel,
    timestamp: new Date().toISOString(),
  });
}
