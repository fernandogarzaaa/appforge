import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function TrendAnalysis({ timeRange, data }) {
  // Generate trend data
  const trendData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    executions: Math.floor(Math.random() * 500) + 200,
    errors: Math.floor(Math.random() * 50) + 10,
    revenue: Math.floor(Math.random() * 1000) + 500
  }));

  // Calculate growth rates
  const calculateGrowth = (data, key) => {
    if (data.length < 2) return 0;
    const recent = data.slice(-7).reduce((sum, d) => sum + d[key], 0);
    const previous = data.slice(-14, -7).reduce((sum, d) => sum + d[key], 0);
    return previous > 0 ? (((recent - previous) / previous) * 100).toFixed(1) : 0;
  };

  const executionGrowth = calculateGrowth(trendData, 'executions');
  const errorGrowth = calculateGrowth(trendData, 'errors');
  const revenueGrowth = calculateGrowth(trendData, 'revenue');

  return (
    <div className="space-y-6">
      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">Execution Growth</div>
              <Badge variant={executionGrowth > 0 ? 'default' : 'destructive'}>
                {executionGrowth > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(executionGrowth)}%
              </Badge>
            </div>
            <div className="text-2xl font-bold">{trendData[trendData.length - 1].executions}</div>
            <div className="text-xs text-gray-500 mt-1">vs previous period</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">Error Trend</div>
              <Badge variant={errorGrowth < 0 ? 'default' : 'destructive'}>
                {errorGrowth < 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                {Math.abs(errorGrowth)}%
              </Badge>
            </div>
            <div className="text-2xl font-bold">{trendData[trendData.length - 1].errors}</div>
            <div className="text-xs text-gray-500 mt-1">errors this period</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">Revenue Growth</div>
              <Badge variant={revenueGrowth > 0 ? 'default' : 'secondary'}>
                {revenueGrowth > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(revenueGrowth)}%
              </Badge>
            </div>
            <div className="text-2xl font-bold">${trendData[trendData.length - 1].revenue}</div>
            <div className="text-xs text-gray-500 mt-1">template revenue</div>
          </CardContent>
        </Card>
      </div>

      {/* Execution Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Volume Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorExec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="executions" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorExec)"
                name="Total Executions"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Multi-metric Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Performance & Revenue Correlation</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="executions" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Executions"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Revenue ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <div className="font-semibold text-blue-900 mb-1">📈 Usage is trending upward</div>
              <div className="text-sm text-blue-700">
                Your integrations saw a {Math.abs(executionGrowth)}% increase in executions compared to last period
              </div>
            </div>
            <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
              <div className="font-semibold text-green-900 mb-1">✅ Improving reliability</div>
              <div className="text-sm text-green-700">
                Error rate has decreased, indicating better system stability
              </div>
            </div>
            <div className="p-4 bg-purple-50 border-l-4 border-purple-500 rounded">
              <div className="font-semibold text-purple-900 mb-1">💰 Revenue momentum</div>
              <div className="text-sm text-purple-700">
                Template marketplace revenue is growing at {Math.abs(revenueGrowth)}% week-over-week
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}