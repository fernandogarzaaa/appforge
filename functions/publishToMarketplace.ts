import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assetType, agentId, workflowId, title, description, domain, tags } = await req.json();

    // Fetch asset data
    let assetData = null;
    if (assetType === 'custom_agent') {
      const agents = await base44.asServiceRole.entities.CustomAgent.filter({ id: agentId });
      assetData = agents[0];
    }

    if (!assetData) {
      return Response.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Create marketplace listing
    const listing = await base44.asServiceRole.entities.MarketplaceAsset.create({
      creator_id: user.email,
      asset_type: assetType,
      title,
      description,
      domain,
      tags: tags || [],
      asset_data: {
        name: assetData.agent_name,
        parameters: assetData.parameters,
        goal: assetData.goal,
        training_samples: assetData.training_data?.length || 0,
      },
      version: '1.0.0',
      is_public: true,
    });

    return Response.json({
      success: true,
      assetId: listing.id,
      title: listing.title,
      url: `/marketplace?asset=${listing.id}`,
    });
  } catch (error) {
    console.error('Publish error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});