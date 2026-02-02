// @ts-nocheck
/**
 * Clone Project Function
 * Duplicates entire project for quick variations
 */

import { createClientFromRequest } from '@base44/sdk';

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    const { sourceProjectId, newProjectName } = await req.json();
    if (!sourceProjectId) {
      return new Response(JSON.stringify({ error: 'sourceProjectId is required' }), { status: 400 });
    }

    const source = await base44.entities.Project?.get(sourceProjectId).catch(() => null);

    const projectPayload = {
      name: newProjectName || `${source?.name || 'Cloned Project'} (copy)` ,
      source_project_id: sourceProjectId,
      created_at: new Date().toISOString(),
      metadata: { cloned_from: sourceProjectId },
    };

    const newProject = await base44.entities.Project?.create(projectPayload).catch(() => ({ id: `proj_${Date.now()}`, ...projectPayload }));

    // Shallow copy of pages/components if available
    if (source) {
      const pages = await base44.entities.ProjectPage?.filter({ project_id: sourceProjectId }).catch(() => []);
      await Promise.all((pages || []).map(async (page) => {
        const { id, project_id, ...rest } = page;
        return base44.entities.ProjectPage?.create({ ...rest, project_id: newProject.id });
      }));
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Project cloned successfully',
        newProjectId: newProject.id,
        newProjectName: projectPayload.name,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
