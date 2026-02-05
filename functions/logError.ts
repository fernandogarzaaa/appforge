import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { error_code, message, stack_trace, page, context, severity = 'medium' } = body;

    const user = await base44.auth.me();

    const errorEntry = {
      error_code,
      message,
      stack_trace,
      user_id: user?.email,
      page,
      context,
      severity,
      occurred_at: new Date().toISOString(),
      resolved: false
    };

    const logged = await base44.asServiceRole.entities.ErrorLog.create(errorEntry);

    // Send alert if critical
    if (severity === 'critical') {
      await base44.integrations.Core.SendEmail({
        to: 'admin@example.com',
        subject: `[CRITICAL ERROR] ${error_code}`,
        body: `Error: ${message}\n\nPage: ${page}\n\nTime: ${errorEntry.occurred_at}`
      }).catch(() => {});
    }

    return Response.json({ success: true, logged });
  } catch (error) {
    console.error('Error logging failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});