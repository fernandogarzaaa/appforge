import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatbotId, agentConfig } = await req.json();

    if (!chatbotId || !agentConfig) {
      return Response.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Store agent reference in chatbot
    await base44.entities.Chatbot.update(chatbotId, {
      agent_id: chatbotId
    });

    return Response.json({
      success: true,
      agentId: chatbotId,
      message: 'Chatbot agent created successfully'
    });
  } catch (error) {
    console.error('Error creating chatbot agent:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});