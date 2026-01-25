import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { feedback, context = '' } = await req.json();

    if (!feedback) {
      return Response.json({ error: 'Feedback text is required' }, { status: 400 });
    }

    const prompt = `Analyze the sentiment and emotions in the following user feedback. ${context ? `Context: ${context}` : ''}

Feedback:
"${feedback}"

Provide:
1. Overall sentiment (positive/negative/neutral/mixed)
2. Sentiment score (0-100, where 0 is most negative, 100 is most positive)
3. Key emotional indicators
4. Topics/issues mentioned
5. Actionable insights
6. Recommended response`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          sentiment: { type: 'string' },
          score: { type: 'number' },
          emotions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                emotion: { type: 'string' },
                intensity: { type: 'string' }
              }
            }
          },
          topics: {
            type: 'array',
            items: { type: 'string' }
          },
          issues: {
            type: 'array',
            items: { type: 'string' }
          },
          insights: {
            type: 'array',
            items: { type: 'string' }
          },
          recommended_response: { type: 'string' }
        }
      }
    });

    return Response.json({
      success: true,
      analysis: result
    });
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});