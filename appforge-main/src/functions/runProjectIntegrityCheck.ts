import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { projectId } = await req.json();

    if (!projectId) {
      return Response.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Create a conversation with the integrity monitoring agent
    const conversation = await base44.asServiceRole.agents.createConversation({
      agent_name: 'project_integrity_monitor',
      metadata: {
        name: `Auto-check for project ${projectId}`,
        project_id: projectId,
        auto_generated: true
      }
    });

    // Ask the agent to check the project
    await base44.asServiceRole.agents.addMessage(conversation, {
      role: 'user',
      content: `Please perform a comprehensive integrity check on project ID: ${projectId}. Analyze all entities, pages, components, and functions. Provide a detailed health report with critical issues, warnings, and optimization suggestions.`
    });

    return Response.json({ 
      success: true,
      conversationId: conversation.id,
      message: 'Project integrity check initiated'
    });
  } catch (error) {
    console.error('Error running integrity check:', error);
    return Response.json({ 
      error: error.message,
      details: 'Failed to run project integrity check'
    }, { status: 500 });
  }
});