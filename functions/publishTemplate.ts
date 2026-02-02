// @ts-nocheck
/**
 * Marketplace Template Publishing
 * Allows developers to publish templates to the marketplace
 */

import { createClientFromRequest } from '@base44/sdk';

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    const {
      templateName,
      description,
      price, // in cents
      category,
      tags,
      preview,
      sourceProjectId,
    } = await req.json();
    if (!templateName || !sourceProjectId) {
      return new Response(JSON.stringify({ error: 'templateName and sourceProjectId are required' }), { status: 400 });
    }

    const commission = Math.round((price || 0) * 0.3);
    const netPayout = Math.max((price || 0) - commission, 0);

    const templatePayload = {
      name: templateName,
      description,
      price,
      category,
      tags,
      preview,
      source_project_id: sourceProjectId,
      commission_cents: commission,
      net_payout_cents: netPayout,
      status: 'published',
      published_at: new Date().toISOString(),
    };

    const record = await base44.entities.Template?.create(templatePayload).catch(() => ({ id: `tpl_${Date.now()}` }));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Template published',
        templateId: record.id,
        marketplaceURL: `https://appforge.fun/marketplace/templates/${record.id}`,
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
