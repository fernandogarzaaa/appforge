import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function RuleTriggersChart({ rules }) {
  const data = rules.map(rule => ({
    name: rule.name.substring(0, 15) + '...',
    triggers: rule.triggers_count || 0,
    active: rule.is_active ? 1 : 0
  })).slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Monitoring Rules by Triggers</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="triggers" fill="#6366f1" name="Trigger Count" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function DataSourceDistribution({ rules }) {
  const data = ['database', 'email', 'api', 'workflow'].map(source => ({
    source,
    count: rules.filter(r => r.data_source === source).length
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Sources Monitored</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="source" type="category" />
            <Tooltip />
            <Bar dataKey="count" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}