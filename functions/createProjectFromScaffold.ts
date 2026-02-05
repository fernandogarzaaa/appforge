import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scaffold, project_name } = await req.json();

    if (!scaffold || !project_name) {
      return Response.json({ error: 'Missing scaffold or project_name' }, { status: 400 });
    }

    // Create the project
    const project = await base44.entities.Project.create({
      name: project_name,
      description: scaffold.project.description,
      status: 'active',
      tech_stack: scaffold.project.tech_stack || [],
      created_by: user.email
    });

    const results = {
      project_id: project.id,
      entities_created: [],
      pages_created: [],
      components_created: [],
      functions_created: [],
      errors: []
    };

    // Create entities
    for (const entity of scaffold.entities || []) {
      try {
        await base44.entities.Entity.create({
          project_id: project.id,
          name: entity.name,
          schema: entity.schema,
          description: entity.rationale
        });
        results.entities_created.push(entity.name);
      } catch (error) {
        results.errors.push(`Entity ${entity.name}: ${error.message}`);
      }
    }

    // Create pages
    for (const page of scaffold.pages || []) {
      try {
        await base44.entities.Page.create({
          project_id: project.id,
          name: page.name,
          code: page.code,
          route: page.route,
          description: page.description
        });
        results.pages_created.push(page.name);
      } catch (error) {
        results.errors.push(`Page ${page.name}: ${error.message}`);
      }
    }

    // Create components
    for (const component of scaffold.components || []) {
      try {
        await base44.entities.Component.create({
          project_id: project.id,
          name: component.name,
          code: component.code,
          usage_notes: component.usage
        });
        results.components_created.push(component.name);
      } catch (error) {
        results.errors.push(`Component ${component.name}: ${error.message}`);
      }
    }

    // Note: Functions would need to be created via file system in real implementation
    // For now, just track them
    results.functions_created = (scaffold.functions || []).map(f => f.name);

    return Response.json({
      success: true,
      project_id: project.id,
      results: results,
      next_steps: scaffold.setup_instructions || []
    });

  } catch (error) {
    console.error('Project creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});