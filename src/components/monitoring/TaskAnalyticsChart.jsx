import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export function TaskPriorityChart({ tasks }) {
  const data = ['urgent', 'high', 'medium', 'low'].map(priority => ({
    priority,
    count: tasks.filter(t => t.priority === priority).length,
    avgScore: tasks.filter(t => t.priority === priority).reduce((sum, t) => sum + (t.ai_priority_score || 0), 0) / (tasks.filter(t => t.priority === priority).length || 1)
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Priority Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="priority" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#6366f1" name="Task Count" />
            <Bar dataKey="avgScore" fill="#8b5cf6" name="Avg Priority Score" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function UrgencyFactorsRadar({ task }) {
  if (!task?.urgency_factors) return null;

  const data = [
    { factor: 'Deadline', value: (task.urgency_factors.deadline_proximity || 0) * 100 },
    { factor: 'Impact', value: (task.urgency_factors.business_impact || 0) * 100 },
    { factor: 'Dependencies', value: (task.urgency_factors.dependencies || 0) * 100 },
    { factor: 'Importance', value: (task.urgency_factors.user_importance || 0) * 100 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Urgency Factors</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="factor" />
            <PolarRadiusAxis domain={[0, 100]} />
            <Radar name="Urgency" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function PriorityScatterPlot({ tasks }) {
  const data = tasks.map(task => ({
    name: task.title,
    score: task.ai_priority_score || 0,
    impact: (task.urgency_factors?.business_impact || 0) * 100,
    urgency: (task.urgency_factors?.deadline_proximity || 0) * 100
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Priority Score vs Impact</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <ScatterChart>
            <CartesianGrid />
            <XAxis type="number" dataKey="score" name="Priority Score" />
            <YAxis type="number" dataKey="impact" name="Business Impact" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Tasks" data={data} fill="#6366f1" />
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}