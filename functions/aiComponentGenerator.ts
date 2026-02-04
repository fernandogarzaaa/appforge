import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, componentType, requirements, framework = 'react' } = await req.json();

    if (!projectId || !componentType || !requirements) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // AI-powered component generation
    const prompt = `Generate a production-ready ${framework} component for: ${componentType}

Requirements: ${requirements}

Include:
1. TypeScript/JSX code with proper typing
2. Tailwind CSS styling (responsive, dark mode support)
3. Accessibility features (ARIA labels, keyboard navigation)
4. Error handling and loading states
5. JSDoc comments explaining the component
6. Example usage

Return as JSON: { "code": "...", "name": "ComponentName", "props": [...], "dependencies": [...] }`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          name: { type: 'string' },
          props: { type: 'array', items: { type: 'object' } },
          dependencies: { type: 'array', items: { type: 'string' } },
          exports: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      success: true,
      component: response,
      componentCode: response.code,
      componentName: response.name
    });
  } catch (error) {
    console.error('Component generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});