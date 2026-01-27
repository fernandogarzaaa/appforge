import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bugs } = await req.json();

    if (!Array.isArray(bugs) || bugs.length === 0) {
      return Response.json({ error: 'Invalid or empty bugs array' }, { status: 400 });
    }

    const createdTickets = [];
    const failedTickets = [];

    // Create tickets for each detected bug
    for (const bug of bugs) {
      try {
        // Check if similar ticket already exists to avoid duplicates
        const existingTickets = await base44.entities.SupportTicket.filter({
          title: bug.title
        });

        if (existingTickets.length > 0) {
          // Update severity if new one is higher
          const existing = existingTickets[0];
          const severityMap = { critical: 4, high: 3, medium: 2, low: 1 };
          
          if ((severityMap[bug.severity] || 0) > (severityMap[existing.severity] || 0)) {
            await base44.entities.SupportTicket.update(existing.id, {
              severity: bug.severity,
              priority: bug.priority
            });
          }
          continue;
        }

        // Create new ticket
        const ticket = await base44.entities.SupportTicket.create({
          title: `🐛 [AUTO] ${bug.title}`,
          description: `
${bug.description}

**Affected Components:** ${bug.affected_components.join(', ')}
**Severity:** ${bug.severity}
**Detection Confidence:** ${bug.likelihood}%
**Suggested Fix:** ${bug.suggested_fix}

---
*This ticket was automatically created by proactive bug detection AI.*
          `,
          severity: bug.severity,
          priority: bug.priority,
          category: 'bug',
          status: 'open',
          assigned_to: user.email,
          tags: ['auto-detected', 'proactive', `severity-${bug.severity}`]
        });

        createdTickets.push({
          ticket_id: ticket.id,
          title: bug.title,
          severity: bug.severity,
          priority: bug.priority
        });
      } catch (e) {
        failedTickets.push({
          title: bug.title,
          error: e.message
        });
      }
    }

    // Create audit log
    await base44.entities.AuditLog.create({
      action: 'proactive_bugs_ticketed',
      performed_by: user.email,
      description: `Created ${createdTickets.length} bug tickets from proactive analysis`,
      changes: {
        created_count: createdTickets.length,
        failed_count: failedTickets.length,
        tickets: createdTickets
      }
    });

    return Response.json({
      success: true,
      created_tickets: createdTickets.length,
      tickets: createdTickets,
      failed: failedTickets,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});