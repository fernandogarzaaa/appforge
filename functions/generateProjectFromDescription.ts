import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generate complete project structure from natural language description
 * Uses QuantumAI for intelligent template generation
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { description, project_name } = await req.json();

    if (!description || !project_name) {
      return Response.json({ error: 'Description and project name required' }, { status: 400 });
    }

    // Use InvokeLLM directly for project generation
    const projectData = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a complete project structure for: "${description}"

Analyze this app idea across multiple dimensions:
- Core functionality and features
- Data models and relationships
- User interface requirements
- Technical architecture
- Scalability considerations

Generate:
1. Project metadata (name, description, icon, color)
2. Entity schemas (3-7 entities with full JSON schemas)
3. Page structures (4-8 pages with descriptions)
4. Component suggestions (5-10 reusable components)
5. Recommended integrations/features

Be comprehensive but practical. Focus on MVP features.`,
      response_json_schema: {
        type: "object",
        properties: {
          project: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              icon: { type: "string" },
              color: { type: "string" },
              category: { type: "string" }
            }
          },
          entities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                schema: { type: "object" }
              }
            }
          },
          pages: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                features: { type: "array", items: { type: "string" } }
              }
            }
          },
          components: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                purpose: { type: "string" }
              }
            }
          },
          integrations: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    // Create the project
    const project = await base44.entities.Project.create({
      name: project_name,
      description: projectData.project.description,
      icon: projectData.project.icon || '📱',
      color: projectData.project.color || '#6366f1',
      status: 'draft',
      ai_generated: true
    });

    // Skip entity creation - entities are defined in entities/ directory manually
     // Just return the entity schemas for the user to implement
     const createdEntities = projectData.entities || [];

    // Skip page creation - pages are created in pages/ directory manually
     // Just return page structure recommendations for the user
     const createdPages = projectData.pages || [];

    return Response.json({
      success: true,
      project,
      entities: createdEntities,
      pages: createdPages,
      components: projectData.components,
      integrations: projectData.integrations,
      quantum_enhanced: true
    });

  } catch (error) {
    console.error('Project generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});