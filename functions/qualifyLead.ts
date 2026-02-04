import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { lead_id, lead_email, lead_name, lead_company } = await req.json();

    if (!lead_email) {
      return Response.json({ error: 'Missing lead email' }, { status: 400 });
    }

    // Use AI to qualify lead
    const qualification = await base44.integrations.Core.InvokeLLM({
      prompt: `Qualify this sales lead. Respond with JSON.
      
Name: ${lead_name || 'Unknown'}
Email: ${lead_email}
Company: ${lead_company || 'Unknown'}

Provide:
- qualification_score (0-100, higher = better fit)
- reason (brief explanation)
- should_contact (true/false)

Consider: industry fit, company size, engagement likelihood.`,
      response_json_schema: {
        type: 'object',
        properties: {
          qualification_score: { type: 'number' },
          reason: { type: 'string' },
          should_contact: { type: 'boolean' }
        }
      }
    });

    const leadData = {
      qualification_score: qualification.qualification_score,
      qualification_reason: qualification.reason,
      status: qualification.should_contact ? 'qualified' : 'rejected',
      qualified_at: new Date().toISOString()
    };

    // Update or create lead
    if (lead_id) {
      await base44.asServiceRole.entities.Lead.update(lead_id, leadData);
    } else {
      const existingLead = await base44.asServiceRole.entities.Lead.filter({ email: lead_email });
      if (existingLead.length > 0) {
        await base44.asServiceRole.entities.Lead.update(existingLead[0].id, leadData);
      } else {
        await base44.asServiceRole.entities.Lead.create({
          email: lead_email,
          name: lead_name,
          company: lead_company,
          ...leadData
        });
      }
    }

    return Response.json({
      success: true,
      ...qualification
    });
  } catch (error) {
    console.error('Lead qualification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});