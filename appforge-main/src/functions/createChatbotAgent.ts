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

    // Agent is now created via configuration file naming
    // The chatbot ID itself serves as agent reference
    
    return Response.json({
      success: true,
      agentId: chatbotId,
      message: 'Chatbot configured successfully'
    });
  } catch (error) {
    console.error('Error creating chatbot agent:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});