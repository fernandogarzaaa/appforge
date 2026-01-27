import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, XCircle, AlertCircle } from 'lucide-react';

export default function ErrorTracker({ timeRange, logs }) {
  const errorLogs = logs.filter(l => l.status === 'failed');

  // Error distribution by type
  const errorTypes = errorLogs.reduce((acc, log) => {
    const errorType = log.error_message?.split(':')[0] || 'Unknown Error';
    acc[errorType] = (acc[errorType] || 0) + 1;
    return acc;
  }, {});

  const errorDistribution = Object.entries(errorTypes).map(([name, value]) => ({ name, value }));

  // Recent errors
  const recentErrors = errorLogs.slice(0, 10);

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16'];

  return (
    <div className="space-y-6">
      {/* Error Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-3 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Errors</div>
                <div className="text-2xl font-bold">{errorLogs.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Error Rate</div>
                <div className="text-2xl font-bold">
                  {logs.length > 0 ? ((errorLogs.length / logs.length) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Unique Errors</div>
                <div className="text-2xl font-bold">{Object.keys(errorTypes).length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Error Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {errorDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={errorDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {errorDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No errors to display
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Errors Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={errorDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Errors */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentErrors.map((error, idx) => (
              <div key={idx} className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-900">
                      {error.error_message?.substring(0, 50) || 'Unknown Error'}
                    </span>
                  </div>
                  <Badge variant="destructive">Error</Badge>
                </div>
                <div className="text-sm text-red-700 ml-7">
                  {new Date(error.created_date).toLocaleString()} • Integration: {error.integration_id}
                </div>
              </div>
            ))}
            {recentErrors.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>No errors in the selected time range</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}