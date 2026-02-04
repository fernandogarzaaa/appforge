import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agentId, versionId } = await req.json();

    // Fetch version to revert to
    const versions = await base44.asServiceRole.entities.AgentVersion.filter({ id: versionId });
    if (versions.length === 0) {
      return Response.json({ error: 'Version not found' }, { status: 404 });
    }

    const targetVersion = versions[0];

    // Update agent with snapshot data
    const updated = await base44.asServiceRole.entities.CustomAgent.update(agentId, {
      agent_name: targetVersion.agent_snapshot.name,
      goal: targetVersion.agent_snapshot.goal,
      parameters: targetVersion.agent_snapshot.parameters,
      training_data: targetVersion.agent_snapshot.training_data,
      performance_metrics: targetVersion.agent_snapshot.performance_metrics
    });

    // Save current state as new version before revert
    const allVersions = await base44.asServiceRole.entities.AgentVersion.filter(
      { agent_id: agentId },
      '-version_number',
      1
    );
    const nextVersion = (allVersions.length > 0 ? allVersions[0].version_number : 0) + 1;

    await base44.asServiceRole.entities.AgentVersion.create({
      agent_id: agentId,
      version_number: nextVersion,
      agent_snapshot: targetVersion.agent_snapshot,
      change_message: `Reverted to version ${targetVersion.version_number}`,
      created_by: user.email
    });

    return Response.json({
      success: true,
      agentId,
      revertedToVersion: targetVersion.version_number,
      newVersionNumber: nextVersion
    });

  } catch (error) {
    console.error('Revert error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});