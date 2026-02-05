import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminAuditViewer() {
  const [filter, setFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => base44.asServiceRole.entities.AuditLog.list('-timestamp', 100),
    enabled: true,
  });

  const filteredLogs = logs.filter(log => {
    const matchesText = log.performed_by.toLowerCase().includes(filter.toLowerCase()) ||
                       log.action_type.toLowerCase().includes(filter.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    return matchesText && matchesSeverity;
  });

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-blue-100 text-blue-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700'
    };
    return colors[severity] || colors.medium;
  };

  const handleExportCSV = () => {
    const csv = [
      ['Timestamp', 'Action', 'Resource', 'User', 'Severity', 'Compliance'],
      ...filteredLogs.map(log => [
        format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        log.action_type,
        log.resource_type,
        log.performed_by,
        log.severity,
        log.compliance_relevant ? 'Yes' : 'No'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <CardTitle>Audit Logs</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Input
              placeholder="Filter by user or action..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 min-w-64"
            />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-input"
            >
              <option value="all">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {isLoading ? (
              <p className="text-center text-gray-500 py-4">Loading logs...</p>
            ) : filteredLogs.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No logs found</p>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{log.action_type}</p>
                      <p className="text-xs text-gray-600 mt-1">{log.performed_by}</p>
                      <p className="text-xs text-gray-500 mt-1">{log.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(log.severity)}>
                        {log.severity}
                      </Badge>
                      {log.compliance_relevant && (
                        <Badge variant="outline" className="border-purple-300">
                          Compliance
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}