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

    // TODO: Implement search
    // 1. Normalize search query
    // 2. Build search index
    // 3. Implement fuzzy matching
    // 4. Filter by type if specified
    // 5. Sort by relevance
    // 6. Return top results
    // 7. Highlight matches

    return new Response(
      JSON.stringify({
        success: true,
        query,
        results: [
          {
            id: 'proj_xxxxx',
            type: 'project',
            name: 'My Project',
            description: 'Project description',
            relevance: 0.95,
          },
        ],
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
