import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { description, projectName } = await req.json();

        if (!description) {
            return Response.json({ error: 'Description is required' }, { status: 400 });
        }

        // Use InvokeLLM to generate comprehensive project structure
        const projectPlan = await base44.integrations.Core.InvokeLLM({
            prompt: `You are an expert full-stack architect. Analyze this project description and create a complete, production-ready application structure.

Project Description: "${description}"

Generate a comprehensive plan including:
1. Project metadata (name, description, icon, color)
2. Entities with complete schemas (properties, validations, relationships)
3. Pages with layout structure and components needed
4. Workflows/automations that would be valuable
5. Sample data for each entity (3-5 realistic items per entity)

Return a structured JSON with the following format:
{
  "project": {
    "name": "string (smart extraction from description)",
    "description": "string (polished version)",
    "icon": "emoji that represents the project",
    "color": "hex color code"
  },
  "entities": [
    {
      "name": "EntityName",
      "description": "what this entity represents",
      "icon": "emoji",
      "fields": [
        {
          "name": "field_name",
          "type": "string|number|boolean|date|array|object",
          "required": boolean,
          "description": "field purpose",
          "default_value": "optional default",
          "enum_values": ["optional", "list"],
          "validation": {"optional validation rules"}
        }
      ],
      "sample_data": [
        {"field1": "value1", "field2": "value2"}
      ]
    }
  ],
  "pages": [
    {
      "name": "PageName",
      "path": "/path",
      "icon": "emoji",
      "is_home": boolean,
      "description": "page purpose and what it displays",
      "layout": {
        "sections": ["hero", "features", "cta"],
        "entities_used": ["Entity1"]
      }
    }
  ],
  "workflows": [
    {
      "name": "workflow name",
      "trigger": "schedule|entity_change",
      "description": "what it automates"
    }
  ]
}

Make it production-ready with realistic sample data, proper validations, and intelligent relationships between entities.`,
            add_context_from_internet: false,
            response_json_schema: {
                type: "object",
                properties: {
                    project: {
                        type: "object",
                        properties: {
                            name: { type: "string" },
                            description: { type: "string" },
                            icon: { type: "string" },
                            color: { type: "string" }
                        }
                    },
                    entities: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                description: { type: "string" },
                                icon: { type: "string" },
                                fields: { type: "array" },
                                sample_data: { type: "array" }
                            }
                        }
                    },
                    pages: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                path: { type: "string" },
                                icon: { type: "string" },
                                is_home: { type: "boolean" },
                                description: { type: "string" },
                                layout: { type: "object" }
                            }
                        }
                    },
                    workflows: { type: "array" }
                }
            }
        });

        const plan = projectPlan;

        // Create the project
        const project = await base44.asServiceRole.entities.Project.create({
            name: projectName || plan.project.name,
            description: plan.project.description,
            icon: plan.project.icon || '✨',
            color: plan.project.color || '#8b5cf6',
            status: 'development',
            metadata: {
                ai_generated: true,
                generation_timestamp: new Date().toISOString(),
                original_description: description
            }
        });

        // Create entities with schemas
        const createdEntities = [];
        for (const entityPlan of (plan.entities || [])) {
            try {
                const properties = {};
                const required = [];

                for (const field of (entityPlan.fields || [])) {
                    properties[field.name] = {
                        type: field.type || 'string',
                        description: field.description
                    };

                    if (field.enum_values && field.enum_values.length > 0) {
                        properties[field.name].enum = field.enum_values;
                    }

                    if (field.default_value !== undefined) {
                        properties[field.name].default = field.default_value;
                    }

                    if (field.required) {
                        required.push(field.name);
                    }
                }

                const entity = await base44.asServiceRole.entities.Entity.create({
                    project_id: project.id,
                    name: entityPlan.name,
                    description: entityPlan.description,
                    icon: entityPlan.icon || '📦',
                    fields: entityPlan.fields
                });

                createdEntities.push({
                    entity,
                    sample_data: entityPlan.sample_data || []
                });
            } catch (entityError) {
                console.error(`Failed to create entity ${entityPlan.name}:`, entityError);
            }
        }

        // Populate sample data
        let totalSampleItems = 0;
        for (const { entity, sample_data } of createdEntities) {
            for (const item of sample_data) {
                try {
                    await base44.asServiceRole.entities[entity.name].create(item);
                    totalSampleItems++;
                } catch (dataError) {
                    console.error(`Failed to create sample data for ${entity.name}:`, dataError);
                }
            }
        }

        // Generate and create pages with React code
        const createdPages = [];
        for (const pagePlan of (plan.pages || [])) {
            try {
                const pageCodeResult = await base44.integrations.Core.InvokeLLM({
                    prompt: `Generate production-ready React code for a page:

Page: ${pagePlan.name}
Purpose: ${pagePlan.description}
Sections: ${JSON.stringify(pagePlan.layout?.sections || [])}
Entities: ${JSON.stringify(pagePlan.layout?.entities_used || [])}

Requirements:
- Import base44: import { base44 } from '@/api/base44Client';
- Use React Query: useQuery, useMutation
- Use shadcn/ui components
- Use Lucide icons
- Responsive with Tailwind
- Loading/error states
- Export default function

Available: ${createdEntities.map(e => e.entity.name).join(', ')}

Return ONLY the React code, no explanations.`
                });

                const pageCode = pageCodeResult || `import React from 'react';

export default function ${pagePlan.name}() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold">${pagePlan.name}</h1>
    </div>
  );
}`;

                const page = await base44.asServiceRole.entities.Page.create({
                    project_id: project.id,
                    name: pagePlan.name,
                    path: pagePlan.path || `/${pagePlan.name.toLowerCase()}`,
                    icon: pagePlan.icon || '📄',
                    is_home: pagePlan.is_home || false,
                    code: pageCode,
                    layout: pagePlan.layout || {}
                });

                createdPages.push(page);
            } catch (pageError) {
                console.error(`Failed to create page ${pagePlan.name}:`, pageError);
            }
        }

        // Create workflows
        const createdWorkflows = [];
        for (const workflowPlan of (plan.workflows || []).slice(0, 3)) {
            try {
                const automation = await base44.asServiceRole.entities.Automation.create({
                    name: workflowPlan.name,
                    description: workflowPlan.description,
                    trigger_type: workflowPlan.trigger || 'manual',
                    status: 'draft',
                    metadata: {
                        project_id: project.id,
                        ai_generated: true
                    }
                });
                createdWorkflows.push(automation);
            } catch (err) {
                console.error(`Workflow error:`, err);
            }
        }

        return Response.json({
            success: true,
            project,
            summary: {
                entities_created: createdEntities.length,
                pages_created: createdPages.length,
                sample_items_added: totalSampleItems,
                workflows_created: createdWorkflows.length
            },
            plan: {
                entities: plan.entities?.map(e => e.name) || [],
                pages: plan.pages?.map(p => p.name) || []
            },
            urls: {
                project: `/projects?projectId=${project.id}`,
                pages: createdPages.map(p => ({ name: p.name, url: `/projects?projectId=${project.id}&page=${p.id}` }))
            }
        });

    } catch (error) {
        console.error('Project generation error:', error);
        return Response.json({ 
            error: error.message
        }, { status: 500 });
    }
});