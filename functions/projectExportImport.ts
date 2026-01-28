// deno-lint-ignore-file
// @ts-nocheck
/**
 * Project Export/Import System
 * Export projects as ZIP files and import from various sources
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {  action, projectId, format, includeData, source } = await req.json();

    switch (action) {
      case 'export': {
        if (!projectId) {
          return Response.json({ error: 'Missing projectId' }, { status: 400 });
        }

        // Get project data
        const project = await base44.entities.Project.get(projectId);
        if (!project) {
          return Response.json({ error: 'Project not found' }, { status: 404 });
        }

        // Get all related entities
        const entities = await base44.entities.Entity.list(
          undefined,
          1000,
          { project_id: projectId }
        );

        const pages = await base44.entities.Page.list(
          undefined,
          1000,
          { project_id: projectId }
        );

        const components = await base44.entities.Component.list(
          undefined,
          1000,
          { project_id: projectId }
        );

        const functions = await base44.entities.Function.list(
          undefined,
          1000,
          { project_id: projectId }
        );

        // Build export package
        const exportData = {
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          exportedBy: user.email,
          project: {
            name: project.name,
            description: project.description,
            settings: project.settings,
            created_date: project.created_date,
            updated_date: project.updated_date
          },
          entities: entities.map(e => ({
            name: e.name,
            fields: e.fields,
            settings: e.settings,
            created_date: e.created_date
          })),
          pages: pages.map(p => ({
            name: p.name,
            route: p.route,
            content: p.content,
            settings: p.settings,
            created_date: p.created_date
          })),
          components: components.map(c => ({
            name: c.name,
            code: c.code,
            props: c.props,
            settings: c.settings,
            created_date: c.created_date
          })),
          functions: functions.map(f => ({
            name: f.name,
            code: f.code,
            trigger: f.trigger,
            settings: f.settings,
            created_date: f.created_date
          }))
        };

        // Include actual data if requested
        if (includeData) {
          const data = {};
          for (const entity of entities) {
            try {
              const records = await base44.entities[entity.name].list(undefined, 1000);
              data[entity.name] = records;
            } catch (e) {
              console.error(`Failed to export data for ${entity.name}:`, e);
            }
          }
          exportData.data = data;
        }

        // Convert to requested format
        let content, filename, contentType;

        if (format === 'zip') {
          // In production, use JSZip or similar
          // For now, return JSON with instructions
          content = JSON.stringify(exportData, null, 2);
          filename = `${project.name.replace(/[^a-z0-9]/gi, '_')}_export.json`;
          contentType = 'application/json';
        } else {
          // Default to JSON
          content = JSON.stringify(exportData, null, 2);
          filename = `${project.name.replace(/[^a-z0-9]/gi, '_')}_export.json`;
          contentType = 'application/json';
        }

        return new Response(content, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${filename}"`,
            'X-Export-Version': '1.0.0',
            'X-Export-Items': `${entities.length} entities, ${pages.length} pages, ${components.length} components, ${functions.length} functions`
          }
        });
      }

      case 'import': {
        // Import project from various sources
        const importData = await req.json();

        if (!importData || !importData.project) {
          return Response.json({ error: 'Invalid import data' }, { status: 400 });
        }

        // Validate import data
        const validatedData = validateImportData(importData);
        if (!validatedData.valid) {
          return Response.json({ 
            error: 'Invalid import data',
            details: validatedData.errors 
          }, { status: 400 });
        }

        // Create new project
        const newProject = await base44.entities.Project.create({
          name: importData.project.name + ' (Imported)',
          description: importData.project.description || 'Imported project',
          settings: importData.project.settings || {},
          owner_id: user.id
        });

        const results = {
          project: newProject,
          entities: [],
          pages: [],
          components: [],
          functions: [],
          errors: []
        };

        // Import entities
        for (const entity of importData.entities || []) {
          try {
            const created = await base44.entities.Entity.create({
              ...entity,
              project_id: newProject.id,
              owner_id: user.id
            });
            results.entities.push(created);
          } catch (error) {
            results.errors.push({
              type: 'entity',
              name: entity.name,
              error: error.message
            });
          }
        }

        // Import pages
        for (const page of importData.pages || []) {
          try {
            const created = await base44.entities.Page.create({
              ...page,
              project_id: newProject.id,
              owner_id: user.id
            });
            results.pages.push(created);
          } catch (error) {
            results.errors.push({
              type: 'page',
              name: page.name,
              error: error.message
            });
          }
        }

        // Import components
        for (const component of importData.components || []) {
          try {
            const created = await base44.entities.Component.create({
              ...component,
              project_id: newProject.id,
              owner_id: user.id
            });
            results.components.push(created);
          } catch (error) {
            results.errors.push({
              type: 'component',
              name: component.name,
              error: error.message
            });
          }
        }

        // Import functions
        for (const func of importData.functions || []) {
          try {
            const created = await base44.entities.Function.create({
              ...func,
              project_id: newProject.id,
              owner_id: user.id
            });
            results.functions.push(created);
          } catch (error) {
            results.errors.push({
              type: 'function',
              name: func.name,
              error: error.message
            });
          }
        }

        // Import data if included
        if (importData.data) {
          for (const [entityName, records] of Object.entries(importData.data)) {
            try {
              for (const record of records as any[]) {
                await base44.entities[entityName].create(record);
              }
            } catch (error) {
              results.errors.push({
                type: 'data',
                name: entityName,
                error: error.message
              });
            }
          }
        }

        return Response.json({
          success: true,
          project: newProject,
          imported: {
            entities: results.entities.length,
            pages: results.pages.length,
            components: results.components.length,
            functions: results.functions.length
          },
          errors: results.errors
        }, { status: 200 });
      }

      case 'importFromGitHub': {
        // Import project from GitHub repository
        if (!source || !source.repo) {
          return Response.json({ error: 'Missing GitHub repository' }, { status: 400 });
        }

        // Fetch repository structure
        const repoUrl = `https://api.github.com/repos/${source.repo}/contents`;
        const response = await fetch(repoUrl, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'AppForge-Importer'
          }
        });

        if (!response.ok) {
          return Response.json({ error: 'Failed to fetch GitHub repository' }, { status: 500 });
        }

        const files = await response.json();

        // Create project
        const project = await base44.entities.Project.create({
          name: source.repo.split('/').pop(),
          description: `Imported from GitHub: ${source.repo}`,
          settings: { source: 'github', repo: source.repo },
          owner_id: user.id
        });

        // Process files and create entities
        // This is a simplified version - in production, you'd parse package.json,
        // analyze file structure, etc.

        return Response.json({
          success: true,
          project,
          message: 'GitHub import initiated',
          files: files.length
        }, { status: 200 });
      }

      case 'validateImport': {
        // Validate import data before actually importing
        const importData = await req.json();
        const validation = validateImportData(importData);

        return Response.json(validation, { status: 200 });
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Export/Import error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Validate import data structure
 */
function validateImportData(data: any) {
  const errors = [];

  if (!data.project) {
    errors.push('Missing project information');
  }

  if (!data.version) {
    errors.push('Missing version information');
  }

  if (data.entities && !Array.isArray(data.entities)) {
    errors.push('Entities must be an array');
  }

  if (data.pages && !Array.isArray(data.pages)) {
    errors.push('Pages must be an array');
  }

  if (data.components && !Array.isArray(data.components)) {
    errors.push('Components must be an array');
  }

  if (data.functions && !Array.isArray(data.functions)) {
    errors.push('Functions must be an array');
  }

  // Validate entity structure
  if (data.entities) {
    data.entities.forEach((entity: any, index: number) => {
      if (!entity.name) {
        errors.push(`Entity at index ${index} missing name`);
      }
      if (!entity.fields) {
        errors.push(`Entity ${entity.name || index} missing fields`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
    summary: {
      entities: data.entities?.length || 0,
      pages: data.pages?.length || 0,
      components: data.components?.length || 0,
      functions: data.functions?.length || 0,
      hasData: !!data.data
    }
  };
}
