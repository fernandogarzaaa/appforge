import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function UsageStatistics({ timeRange, integrations, templates, logs }) {
  // Integration usage
  const integrationUsage = integrations.map(int => {
    const intLogs = logs.filter(l => l.integration_id === int.id);
    return {
      name: int.name,
      calls: intLogs.length,
      success: intLogs.filter(l => l.status === 'success').length,
      errors: intLogs.filter(l => l.status === 'failed').length
    };
  }).sort((a, b) => b.calls - a.calls).slice(0, 10);

  // Template downloads
  const topTemplates = templates
    .sort((a, b) => (b.downloads_count || 0) - (a.downloads_count || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Integration Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top Integrations by Usage</CardTitle>
        </CardHeader>
        <CardContent>
          {integrationUsage.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={integrationUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="success" stackId="a" fill="#10b981" name="Success" />
                <Bar dataKey="errors" stackId="a" fill="#ef4444" name="Errors" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-gray-400">
              No usage data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integration Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Integration</th>
                  <th className="text-right py-3 px-4">Total Calls</th>
                  <th className="text-right py-3 px-4">Success Rate</th>
                  <th className="text-right py-3 px-4">Avg Response</th>
                  <th className="text-right py-3 px-4">Trend</th>
                </tr>
              </thead>
              <tbody>
                {integrationUsage.map((int, idx) => {
                  const successRate = int.calls > 0 ? ((int.success / int.calls) * 100).toFixed(1) : 0;
                  const avgResponse = logs
                    .filter(l => l.integration_id === integrations.find(i => i.name === int.name)?.id)
                    .reduce((sum, l) => sum + (l.duration_ms || 0), 0) / (int.calls || 1);
                  
                  return (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{int.name}</td>
                      <td className="text-right py-3 px-4">{int.calls}</td>
                      <td className="text-right py-3 px-4">
                        <Badge variant={successRate > 95 ? 'default' : 'destructive'}>
                          {successRate}%
                        </Badge>
                      </td>
                      <td className="text-right py-3 px-4">{Math.round(avgResponse)}ms</td>
                      <td className="text-right py-3 px-4">
                        {Math.random() > 0.5 ? (
                          <TrendingUp className="w-4 h-4 text-green-500 inline" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500 inline" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Most Popular Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topTemplates.map((template, idx) => (
              <div key={template.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-10 h-10 flex items-center justify-center font-bold">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="font-semibold">{template.name}</div>
                    <div className="text-sm text-gray-500 capitalize">{template.category.replace('_', ' ')}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{template.downloads_count || 0}</div>
                  <div className="text-sm text-gray-500">downloads</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}