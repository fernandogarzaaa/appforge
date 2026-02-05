import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenant_id } = await req.json();

    // Check for cross-tenant data access
    const securityEvents = await base44.asServiceRole.entities.SecurityEvent.filter({
      tenant_id,
      event_type: 'unauthorized_access'
    }, '-created_date', 50);

    // Calculate isolation score
    const violations = securityEvents.filter(e => 
      e.severity === 'high' || e.severity === 'critical'
    );

    const isolationScore = Math.max(0, 100 - (violations.length * 5));

    // Update or create tenant isolation record
    const existingRecords = await base44.asServiceRole.entities.TenantIsolation.filter({
      tenant_id
    });

    const isolationData = {
      tenant_id,
      isolation_status: violations.length > 10 ? 'quarantined' : 'active',
      data_isolation_score: isolationScore,
      last_audit_date: new Date().toISOString(),
      violations: violations.map(v => ({
        type: v.event_type,
        description: v.ai_analysis?.reasoning || 'Unauthorized access attempt',
        timestamp: v.created_date
      })),
      access_controls: {
        network_isolation: true,
        data_encryption: true,
        api_restrictions: isolationScore < 80
      }
    };

    if (existingRecords.length > 0) {
      await base44.asServiceRole.entities.TenantIsolation.update(
        existingRecords[0].id,
        isolationData
      );
    } else {
      await base44.asServiceRole.entities.TenantIsolation.create(isolationData);
    }

    return Response.json({
      success: true,
      isolation_score: isolationScore,
      violations_count: violations.length,
      status: isolationData.isolation_status
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});