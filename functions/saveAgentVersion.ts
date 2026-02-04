import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agentId, changeMessage } = await req.json();

    // Fetch agent
    const agents = await base44.asServiceRole.entities.CustomAgent.filter({ id: agentId });
    if (agents.length === 0) {
      return Response.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = agents[0];

    // Get latest version number
    const versions = await base44.asServiceRole.entities.AgentVersion.filter(
      { agent_id: agentId },
      '-version_number',
      1
    );
    const nextVersion = (versions.length > 0 ? versions[0].version_number : 0) + 1;

    // Create version
    const newVersion = await base44.asServiceRole.entities.AgentVersion.create({
      agent_id: agentId,
      version_number: nextVersion,
      agent_snapshot: {
        name: agent.agent_name,
        goal: agent.goal,
        parameters: agent.parameters,
        training_data: agent.training_data,
        performance_metrics: agent.performance_metrics
      },
      change_message: changeMessage || `Version ${nextVersion}`,
      created_by: user.email,
      performance_metrics: agent.performance_metrics || {}
    });

    return Response.json({
      success: true,
      versionNumber: nextVersion,
      versionId: newVersion.id
    });

  } catch (error) {
    console.error('Save version error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});