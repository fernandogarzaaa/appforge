export const getLlmConfig = () => {
  const baseUrl = (process.env.APPFORGE_LLM_BASE_URL || process.env.OPENAI_BASE_URL || 'https://llm.appforge.io/v1').replace(/\/+$/, '');
  const apiKey = process.env.APPFORGE_LLM_API_KEY || process.env.OPENAI_API_KEY || '';
  const model = process.env.APPFORGE_LLM_MODEL || process.env.OPENAI_MODEL || 'chimera-auto';
  const embeddingModel = process.env.APPFORGE_EMBEDDING_MODEL || process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

  return { baseUrl, apiKey, model, embeddingModel };
};

export const getAuthHeaders = () => {
  const { apiKey } = getLlmConfig();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
};
