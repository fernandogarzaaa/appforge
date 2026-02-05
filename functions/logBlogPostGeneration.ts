import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event } = body;

    if (event.type !== 'create') {
      return Response.json({ skipped: true });
    }

    // Log is already created, just ensure it's tracked
    // This function is called on entity creation via automation
    
    return Response.json({ success: true, logged: event.entity_id });
  } catch (error) {
    console.error('Blog post logging error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});