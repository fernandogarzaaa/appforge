import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Download, Filter, Search, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function AuditLog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Get audit logs
  const { data: logs } = useQuery({
    queryKey: ['audit-logs', searchTerm, actionFilter, dateRange],
    queryFn: async () => {
      const response = await base44.functions.execute('auditLog', {
        action: 'search',
        filters: {
          action: actionFilter || undefined,
          startDate: dateRange.start || undefined,
          endDate: dateRange.end || undefined
        }
      });
      return response.data;
    }
  });

  // Get statistics
  const { data: stats } = useQuery({
    queryKey: ['audit-stats'],
    queryFn: async () => {
      const response = await base44.functions.execute('auditLog', {
        action: 'getStats'
      });
      return response.data;
    }
  });

  // Get timeline
  const { data: timeline } = useQuery({
    queryKey: ['audit-timeline'],
    queryFn: async () => {
      const response = await base44.functions.execute('auditLog', {
        action: 'getTimeline',
        days: 7
      });
      return response.data;
    }
  });

  const exportLogs = async (format) => {
    const response = await base44.functions.execute('auditLog', {
      action: 'export',
      format,
      filters: {
        action: actionFilter || undefined,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined
      }
    });

    // Download file
    const blob = new Blob([response.data.content], { 
      type: format === 'csv' ? 'text/csv' : 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${new Date().toISOString()}.${format}`;
    a.click();
  };

  const getActionColor = (action) => {
    const colors = {
      create: 'bg-green-500',
      update: 'bg-blue-500',
      delete: 'bg-red-500',
      login: 'bg-purple-500',
      logout: 'bg-gray-500'
    };
    return colors[action] || 'bg-gray-500';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Activity Audit Log</h1>
        <p className="text-muted-foreground">
          Comprehensive activity tracking with search, export, and analytics capabilities.
        </p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Activities</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.today}</div>
              <div className="text-sm text-muted-foreground">Today</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.thisWeek}</div>
              <div className="text-sm text-muted-foreground">This Week</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <Label>Action Type</Label>
              <select 
                className="w-full border rounded-md px-3 py-2"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="">All Actions</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
              </select>
            </div>

            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>

            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => exportLogs('csv')}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => exportLogs('json')}>
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Activity Logs ({logs?.logs?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {logs?.logs?.map((log, idx) => (
                  <div key={idx} className="border rounded-lg p-3 hover:bg-muted/50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                        <span className="text-sm font-semibold">{log.resource}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>User: {log.userId}</div>
                      {log.details && <div>Details: {log.details}</div>}
                      <div className="flex items-center gap-2 text-xs">
                        <span>IP: {log.ipAddress}</span>
                        {log.success !== undefined && (
                          <Badge variant={log.success ? 'default' : 'destructive'} className="text-xs">
                            {log.success ? 'Success' : 'Failed'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Activity Timeline (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeline && (
              <div className="space-y-3">
                {Object.entries(timeline).map(([date, count]) => (
                  <div key={date} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{new Date(date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${(count / Math.max(...Object.values(timeline))) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
