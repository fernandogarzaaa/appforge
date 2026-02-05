import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic, style, wordCount = 1500, existingContent = null, action = 'generate' } = await req.json();

    if (!topic || !action) {
      return Response.json({ error: 'Missing required fields: topic, action' }, { status: 400 });
    }

    let prompt = '';

    if (action === 'generate') {
      prompt = `Create a compelling, SEO-optimized blog post on the topic: "${topic}".
        
Writing style: ${style || 'professional'}
Target word count: ${wordCount}

Requirements:
1. Write a complete, engaging blog post
2. Include an engaging title
3. Structure with clear headings and sections
4. Generate 5-8 relevant SEO tags
5. Create meta description (160 characters max)
6. Include a compelling meta title
7. Format response as JSON with these fields:
   - title: Blog post title
   - meta_title: SEO title (60 chars max)
   - meta_description: SEO description (160 chars max)
   - content: Full blog post content
   - tags: Array of 5-8 relevant tags
   - categories: Array of 2-3 relevant categories
   - slug: URL-friendly slug`;
    } else if (action === 'refine') {
      if (!existingContent) {
        return Response.json({ error: 'existingContent required for refine action' }, { status: 400 });
      }
      prompt = `Refine and improve this blog post. Change the tone to "${style || 'professional'}". 
Keep the core content but enhance it for better readability, engagement, and SEO.

Original content:
${existingContent}

Requirements:
1. Maintain the original topic but improve writing quality
2. Enhance with better structure and flow
3. Update tags for better SEO relevance
4. Update meta title and description
5. Format response as JSON with these fields:
   - title: Refined blog post title
   - meta_title: Updated SEO title
   - meta_description: Updated SEO description
   - content: Refined blog post content
   - tags: Improved array of tags
   - categories: Array of categories
   - slug: URL-friendly slug`;
    }

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          meta_title: { type: 'string' },
          meta_description: { type: 'string' },
          content: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          categories: { type: 'array', items: { type: 'string' } },
          slug: { type: 'string' },
        },
        required: ['title', 'content', 'tags', 'slug'],
      },
    });

    return Response.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
      action,
    });
  } catch (error) {
    console.error('Error generating blog post:', error);
    return Response.json(
      { error: error.message || 'Failed to generate blog post' },
      { status: 500 }
    );
  }
});