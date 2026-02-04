import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agentId, versionId } = await req.json();

    // Fetch version
    const versions = await base44.asServiceRole.entities.AgentVersion.filter({ id: versionId });
    if (versions.length === 0) {
      return Response.json({ error: 'Version not found' }, { status: 404 });
    }

    const version = versions[0];

    // Mark all versions of this agent as not deployed
    const allVersions = await base44.asServiceRole.entities.AgentVersion.filter({
      agent_id: agentId
    });

    for (const v of allVersions) {
      if (v.is_deployed) {
        await base44.asServiceRole.entities.AgentVersion.update(v.id, { is_deployed: false });
      }
    }

    // Mark this version as deployed
    await base44.asServiceRole.entities.AgentVersion.update(versionId, { is_deployed: true });

    // Update agent to reflect deployed version
    const agent = await base44.asServiceRole.entities.CustomAgent.update(agentId, {
      version: version.version_number
    });

    return Response.json({
      success: true,
      deployedVersion: version.version_number,
      agentId
    });

  } catch (error) {
    console.error('Deploy error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});