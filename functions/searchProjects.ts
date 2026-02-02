// @ts-nocheck
/**
 * Global Search Projects & Functions
 * Fuzzy search across all user projects and functions
 */

import { createClientFromRequest } from '@base44/sdk';

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';
    const type = url.searchParams.get('type'); // project, function, page, component
    const normalized = query.trim().toLowerCase();

    const searchAcross = async () => {
      switch (type) {
        case 'function':
          return base44.entities.Function?.filter({ name__icontains: normalized }).catch(() => []);
        case 'page':
          return base44.entities.ProjectPage?.filter({ name__icontains: normalized }).catch(() => []);
        case 'component':
          return base44.entities.Component?.filter({ name__icontains: normalized }).catch(() => []);
        default:
          return base44.entities.Project?.filter({ name__icontains: normalized }).catch(() => []);
      }
    };

    const results = await searchAcross();

    return new Response(
      JSON.stringify({
        success: true,
        query,
        results: (results || []).map((r) => ({
          id: r.id,
          type: type || 'project',
          name: r.name,
          description: r.description,
          relevance: 0.9,
        })),
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
