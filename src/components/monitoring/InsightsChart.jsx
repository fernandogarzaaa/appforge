import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function InsightsTrendChart({ insights }) {
  const data = insights.reduce((acc, insight) => {
    const date = new Date(insight.created_date).toLocaleDateString();
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.count += 1;
      existing[insight.severity] = (existing[insight.severity] || 0) + 1;
    } else {
      acc.push({ 
        date, 
        count: 1,
        [insight.severity]: 1
      });
    }
    return acc;
  }, []).slice(-7);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Insights Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function SeverityDistribution({ insights }) {
  const data = ['critical', 'high', 'medium', 'low'].map(severity => ({
    name: severity,
    value: insights.filter(i => i.severity === severity).length
  }));

  const COLORS = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#3b82f6'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Severity Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function InsightTypeChart({ insights }) {
  const data = ['anomaly', 'opportunity', 'trend', 'pattern', 'alert'].map(type => ({
    type,
    count: insights.filter(i => i.insight_type === type).length
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Insight Types</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}