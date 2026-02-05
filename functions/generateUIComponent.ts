import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { description, component_type, wireframe_url, project_id } = await req.json();

    if (!description) {
      return Response.json({ error: 'Description required' }, { status: 400 });
    }

    const componentPrompt = `You are an expert React and Tailwind CSS developer. Generate a production-ready component based on this description:

COMPONENT REQUEST:
${description}

${wireframe_url ? `WIREFRAME REFERENCE: ${wireframe_url}` : ''}
COMPONENT TYPE: ${component_type || 'auto-detect'}

Generate a COMPLETE, PRODUCTION-READY React component with:

1. **Modern Design**: Beautiful, responsive Tailwind CSS styling
2. **Functionality**: All interactions, state management, data fetching
3. **Accessibility**: ARIA labels, keyboard navigation, screen reader support
4. **Performance**: Optimized renders, lazy loading where appropriate
5. **Best Practices**: TypeScript-ready, proper hooks usage, error handling
6. **Integrations**: Base44 SDK for data operations if needed
7. **Icons**: Use lucide-react icons (only icons you know exist)
8. **Components**: Use shadcn/ui components from @/components/ui/

Return JSON with this structure:
{
  "component_name": "ComponentName",
  "component_code": "full React component code",
  "description": "what this component does",
  "dependencies": ["lucide-react icons used", "shadcn components used"],
  "props": [
    {
      "name": "propName",
      "type": "string|number|boolean|object|array",
      "required": true,
      "description": "what this prop does"
    }
  ],
  "usage_example": "code showing how to use this component",
  "features": ["feature 1", "feature 2"],
  "data_requirements": ["entity or API data needed"],
  "responsive": true,
  "accessibility_features": ["screen reader support", "keyboard navigation"],
  "integration_notes": "how to integrate with Base44"
}

CRITICAL:
- Import base44 from '@/api/base44Client'
- Use only existing lucide-react icons
- Use Tailwind CSS for all styling
- Include proper error handling
- Make it fully responsive
- Add loading states
- Include real functionality, not placeholders`;

    const fileUrls = wireframe_url ? [wireframe_url] : undefined;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: componentPrompt,
      file_urls: fileUrls,
      response_json_schema: {
        type: "object",
        properties: {
          component_name: { type: "string" },
          component_code: { type: "string" },
          description: { type: "string" },
          dependencies: { type: "array", items: { type: "string" } },
          props: { type: "array" },
          usage_example: { type: "string" },
          features: { type: "array", items: { type: "string" } },
          data_requirements: { type: "array", items: { type: "string" } },
          responsive: { type: "boolean" },
          accessibility_features: { type: "array", items: { type: "string" } },
          integration_notes: { type: "string" }
        }
      }
    });

    return Response.json({
      success: true,
      component: result
    });

  } catch (error) {
    console.error('Component generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});