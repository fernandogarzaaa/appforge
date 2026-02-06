import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * AI-Powered REST API Code Generator
 * Takes natural language description and generates REST API spec + scaffold
 */

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { description, language = 'typescript' } = await req.json();
    if (!description || description.trim().length < 8) {
      return Response.json({ error: 'Provide a longer description for the API' }, { status: 400 });
    }

    const prompt = `You are a senior backend engineer. Generate a REST API design and code scaffold.

Description:
${description}

Language/framework preference: ${language}

Return JSON with:
{
  "service_name": "string",
  "description": "string",
  "endpoints": [
    {
      "method": "GET|POST|PUT|PATCH|DELETE",
      "path": "/resource",
      "description": "string",
      "request_schema": "short JSON schema summary",
      "response_schema": "short JSON schema summary"
    }
  ],
  "code": "concise scaffold code"
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          service_name: { type: 'string' },
          description: { type: 'string' },
          endpoints: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                method: { type: 'string' },
                path: { type: 'string' },
                description: { type: 'string' },
                request_schema: { type: 'string' },
                response_schema: { type: 'string' }
              },
              required: ['method', 'path', 'description']
            }
          },
          code: { type: 'string' }
        },
        required: ['service_name', 'description', 'endpoints', 'code']
      }
    });

    return Response.json({
      success: true,
      ...response
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
