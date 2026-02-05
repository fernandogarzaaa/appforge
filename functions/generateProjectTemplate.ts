import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { template_type, project_name, customizations } = await req.json();

    if (!template_type || !project_name) {
      return Response.json({ error: 'Template type and project name required' }, { status: 400 });
    }

    const templatePrompt = `You are an expert full-stack developer. Generate a COMPLETE, PRODUCTION-READY project structure for a ${template_type} application.

PROJECT NAME: ${project_name}
TEMPLATE TYPE: ${template_type}
CUSTOMIZATIONS: ${JSON.stringify(customizations || {})}

Generate a comprehensive project with:

1. **Entities**: Complete database schema with relationships
2. **Pages**: All necessary pages with routing
3. **Components**: Reusable UI components
4. **Functions**: Backend API functions
5. **AI Agents**: Configured AI assistants for this project type
6. **Workflows**: Common automation workflows

Return JSON with this structure:
{
  "project_name": "string",
  "description": "string",
  "template_type": "string",
  "entities": [
    {
      "name": "EntityName",
      "schema": {full JSON schema},
      "description": "what this entity is for"
    }
  ],
  "pages": [
    {
      "name": "PageName",
      "path": "/route",
      "code": "full React component code",
      "description": "what this page does"
    }
  ],
  "components": [
    {
      "name": "ComponentName",
      "code": "full React component code",
      "description": "what this component does"
    }
  ],
  "functions": [
    {
      "name": "functionName",
      "code": "full backend function code",
      "description": "what this function does"
    }
  ],
  "ai_agents": [
    {
      "name": "agentName",
      "config": {agent configuration},
      "description": "what this agent does"
    }
  ],
  "workflows": [
    {
      "name": "workflowName",
      "config": {workflow configuration},
      "description": "what this workflow does"
    }
  ],
  "setup_instructions": ["step 1", "step 2"],
  "features": ["feature 1", "feature 2"]
}

CRITICAL:
- Use Base44 SDK patterns
- Include proper authentication checks
- Use Tailwind CSS for styling
- Include loading/error states
- Make it production-ready
- Include all CRUD operations`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: templatePrompt,
      response_json_schema: {
        type: "object",
        properties: {
          project_name: { type: "string" },
          description: { type: "string" },
          template_type: { type: "string" },
          entities: { type: "array" },
          pages: { type: "array" },
          components: { type: "array" },
          functions: { type: "array" },
          ai_agents: { type: "array" },
          workflows: { type: "array" },
          setup_instructions: { type: "array", items: { type: "string" } },
          features: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Create the project
    const project = await base44.entities.Project.create({
      name: project_name,
      description: result.description,
      template_type,
      template_config: result,
      created_by: user.email
    });

    return Response.json({
      success: true,
      project_id: project.id,
      template: result
    });

  } catch (error) {
    console.error('Template generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});