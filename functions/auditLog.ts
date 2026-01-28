// deno-lint-ignore-file
/**
 * Activity Audit Log System
 * Comprehensive logging of all user actions with search and export
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Audit log storage (use database in production)
const auditLogs = [];

interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, filters, limit, offset } = await req.json();

    switch (action) {
      case 'log': {
        // Log an activity
        const { 
          actionType, 
          resource, 
          resourceId, 
          details, 
          success = true,
          errorMessage 
        } = await req.json();

        const entry: AuditLogEntry = {
          id: crypto.randomUUID(),
          userId: user.id,
          userEmail: user.email,
          action: actionType,
          resource,
          resourceId,
          details,
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
          userAgent: req.headers.get('user-agent'),
          timestamp: new Date(),
          success,
          errorMessage
        };

        auditLogs.push(entry);

        // Keep only last 10000 entries (in production, use database with rotation)
        if (auditLogs.length > 10000) {
          auditLogs.shift();
        }

        return Response.json({ success: true, logId: entry.id }, { status: 200 });
      }

      case 'search': {
        // Search audit logs
        let results = auditLogs.filter(log => log.userId === user.id);

        // Apply filters
        if (filters) {
          if (filters.action) {
            results = results.filter(log => 
              log.action.toLowerCase().includes(filters.action.toLowerCase())
            );
          }

          if (filters.resource) {
            results = results.filter(log => 
              log.resource.toLowerCase().includes(filters.resource.toLowerCase())
            );
          }

          if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            results = results.filter(log => log.timestamp >= startDate);
          }

          if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            results = results.filter(log => log.timestamp <= endDate);
          }

          if (filters.success !== undefined) {
            results = results.filter(log => log.success === filters.success);
          }
        }

        // Sort by timestamp descending
        results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        // Pagination
        const total = results.length;
        const start = offset || 0;
        const end = start + (limit || 50);
        const paginatedResults = results.slice(start, end);

        return Response.json({
          results: paginatedResults,
          total,
          limit: limit || 50,
          offset: start
        }, { status: 200 });
      }

      case 'export': {
        // Export audit logs
        const { format = 'json', filters: exportFilters } = await req.json();

        let logs = auditLogs.filter(log => log.userId === user.id);

        // Apply filters
        if (exportFilters) {
          if (exportFilters.startDate) {
            const startDate = new Date(exportFilters.startDate);
            logs = logs.filter(log => log.timestamp >= startDate);
          }

          if (exportFilters.endDate) {
            const endDate = new Date(exportFilters.endDate);
            logs = logs.filter(log => log.timestamp <= endDate);
          }
        }

        if (format === 'csv') {
          const csv = convertToCSV(logs);
          return new Response(csv, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': 'attachment; filename="audit-log.csv"'
            }
          });
        } else {
          return Response.json(logs, {
            headers: {
              'Content-Disposition': 'attachment; filename="audit-log.json"'
            }
          });
        }
      }

      case 'getStats': {
        // Get activity statistics
        const userLogs = auditLogs.filter(log => log.userId === user.id);

        const stats = {
          total: userLogs.length,
          today: userLogs.filter(log => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return log.timestamp >= today;
          }).length,
          thisWeek: userLogs.filter(log => {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return log.timestamp >= weekAgo;
          }).length,
          successful: userLogs.filter(log => log.success).length,
          failed: userLogs.filter(log => !log.success).length,
          byAction: {},
          byResource: {},
          recentActivity: userLogs.slice(-10).reverse()
        };

        // Count by action type
        userLogs.forEach(log => {
          stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
          stats.byResource[log.resource] = (stats.byResource[log.resource] || 0) + 1;
        });

        return Response.json(stats, { status: 200 });
      }

      case 'getTimeline': {
        // Get activity timeline
        const userLogs = auditLogs.filter(log => log.userId === user.id);
        const { days = 7 } = await req.json();

        const timeline = [];
        const now = new Date();

        for (let i = 0; i < days; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);

          const nextDay = new Date(date);
          nextDay.setDate(nextDay.getDate() + 1);

          const dayLogs = userLogs.filter(log => 
            log.timestamp >= date && log.timestamp < nextDay
          );

          timeline.push({
            date: date.toISOString().split('T')[0],
            count: dayLogs.length,
            successful: dayLogs.filter(log => log.success).length,
            failed: dayLogs.filter(log => !log.success).length
          });
        }

        return Response.json({ timeline: timeline.reverse() }, { status: 200 });
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Audit log error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Convert audit logs to CSV format
 */
function convertToCSV(logs: AuditLogEntry[]): string {
  const headers = ['Timestamp', 'Action', 'Resource', 'Resource ID', 'Success', 'IP Address', 'Details'];
  const rows = [headers];

  logs.forEach(log => {
    rows.push([
      log.timestamp.toISOString(),
      log.action,
      log.resource,
      log.resourceId || '',
      log.success.toString(),
      log.ipAddress || '',
      JSON.stringify(log.details || {})
    ]);
  });

  return rows.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
}

// Auto-cleanup old logs every hour
setInterval(() => {
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  // Keep only logs from last month
  const validLogs = auditLogs.filter(log => log.timestamp >= monthAgo);
  auditLogs.length = 0;
  auditLogs.push(...validLogs);
}, 60 * 60 * 1000);
