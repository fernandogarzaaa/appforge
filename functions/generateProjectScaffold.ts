import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { project_description, framework_preference } = await req.json();

    if (!project_description) {
      return Response.json({ error: 'Project description required' }, { status: 400 });
    }

    // Use AI to analyze and generate project structure
    const scaffoldPrompt = `You are an expert software architect. Analyze this project description and generate a complete, production-ready project structure.

PROJECT DESCRIPTION:
${project_description}

FRAMEWORK PREFERENCE: ${framework_preference || 'Auto-detect best fit'}

Generate a comprehensive project scaffold with:

1. **Project Metadata**: Name, description, tech stack
2. **Entities/Models**: Database schema definitions (JSON schema format)
3. **Pages**: React components for main views
4. **Components**: Reusable UI components
5. **Backend Functions**: API endpoints and business logic
6. **Configuration**: Any needed config files

IMPORTANT RULES:
- Use Base44 platform conventions (React + Tailwind for frontend, Deno for backend)
- Entity schemas must be valid JSON Schema
- Pages must be React functional components with hooks
- Backend functions must use Deno.serve pattern
- Include realistic sample data structures
- Add helpful comments explaining key decisions
- Keep code production-ready and clean

Return a JSON object with this EXACT structure:
{
  "project": {
    "name": "string",
    "description": "string",
    "tech_stack": ["React", "Tailwind", "..."],
    "estimated_build_time": "string"
  },
  "entities": [
    {
      "name": "EntityName",
      "schema": { ...full JSON schema... },
      "rationale": "Why this entity is needed"
    }
  ],
  "pages": [
    {
      "name": "PageName",
      "code": "full React component code",
      "route": "/page-route",
      "description": "What this page does"
    }
  ],
  "components": [
    {
      "name": "ComponentName",
      "code": "full React component code",
      "usage": "How to use this component"
    }
  ],
  "functions": [
    {
      "name": "functionName",
      "code": "full Deno function code",
      "endpoint": "/api/endpoint",
      "description": "What this function does"
    }
  ],
  "setup_instructions": [
    "Step 1...",
    "Step 2..."
  ]
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: scaffoldPrompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          project: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              tech_stack: { type: "array", items: { type: "string" } },
              estimated_build_time: { type: "string" }
            }
          },
          entities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                schema: { type: "object" },
                rationale: { type: "string" }
              }
            }
          },
          pages: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                code: { type: "string" },
                route: { type: "string" },
                description: { type: "string" }
              }
            }
          },
          components: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                code: { type: "string" },
                usage: { type: "string" }
              }
            }
          },
          functions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                code: { type: "string" },
                endpoint: { type: "string" },
                description: { type: "string" }
              }
            }
          },
          setup_instructions: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    return Response.json({
      success: true,
      scaffold: result,
      user_id: user.email
    });

  } catch (error) {
    console.error('Scaffold generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});