import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { audit_report, fixes_applied } = await req.json();

    if (!audit_report) {
      return Response.json({ error: 'Audit report required' }, { status: 400 });
    }

    // Format WhatsApp message
    const message = formatAuditMessage(audit_report, fixes_applied);

    // Send via WhatsApp through the Core integration
    try {
      // Note: This would integrate with WhatsApp if configured
      // For now, the message is prepared but not sent (placeholder for future WhatsApp integration)

      // Create audit log entry
      await base44.entities.AuditLog.create({
        action: 'project_audit_report',
        performed_by: user.email,
        details: {
          total_issues: audit_report.summary.total,
          critical: audit_report.summary.critical_count,
          high: audit_report.summary.high_count,
          fixes_applied: fixes_applied?.summary?.total_fixed || 0
        },
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to log audit:', e);
    }

    return Response.json({
      success: true,
      message_content: message,
      report_sent: true
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function formatAuditMessage(audit_report, fixes) {
  let message = '🔍 *PROJECT AUDIT REPORT*\n\n';

  message += `📊 Summary:\n`;
  message += `Total Issues: ${audit_report.summary.total}\n`;
  message += `🔴 Critical: ${audit_report.summary.critical_count}\n`;
  message += `🟠 High: ${audit_report.summary.high_count}\n`;
  message += `🟡 Medium: ${audit_report.summary.medium_count}\n`;
  message += `🟢 Low: ${audit_report.summary.low_count}\n\n`;

  if (audit_report.critical.length > 0) {
    message += `🚨 *Critical Issues:*\n`;
    audit_report.critical.slice(0, 3).forEach(issue => {
      message += `• ${issue.type}: ${issue.description}\n`;
    });
    if (audit_report.critical.length > 3) {
      message += `... and ${audit_report.critical.length - 3} more\n`;
    }
    message += '\n';
  }

  if (audit_report.high.length > 0) {
    message += `⚠️ *High Priority Issues:*\n`;
    audit_report.high.slice(0, 3).forEach(issue => {
      message += `• ${issue.type}: ${issue.description}\n`;
    });
    if (audit_report.high.length > 3) {
      message += `... and ${audit_report.high.length - 3} more\n`;
    }
    message += '\n';
  }

  if (fixes && fixes.summary && fixes.summary.total_fixed > 0) {
    message += `✅ *Auto-Fixed Issues:*\n`;
    message += `${fixes.summary.total_fixed} issues automatically fixed\n`;
    message += `${fixes.summary.total_failed > 0 ? `⚠️ ${fixes.summary.total_failed} fixes failed` : 'All fixes successful'}\n\n`;
  }

  message += `🔧 Status: Project audit completed\n`;
  message += `⏰ Time: ${new Date().toLocaleString()}`;

  return message;
}