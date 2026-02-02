// @ts-nocheck
/**
 * Toggle Project Favorite
 * Add/remove projects from favorites list
 */

import { createClientFromRequest } from '@base44/sdk';

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    const { projectId } = await req.json();
    if (!projectId) {
      return new Response(JSON.stringify({ error: 'projectId is required' }), { status: 400 });
    }

    const project = await base44.entities.Project?.get(projectId).catch(() => null);
    const nextFavorite = !(project?.is_favorite ?? false);

    await base44.entities.Project?.update(projectId, {
      is_favorite: nextFavorite,
      favorite_updated_at: new Date().toISOString(),
    }).catch(() => null);

    return new Response(
      JSON.stringify({
        success: true,
        projectId,
        isFavorite: nextFavorite,
        message: nextFavorite ? 'Added to favorites' : 'Removed from favorites',
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
