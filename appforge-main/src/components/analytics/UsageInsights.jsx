import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Code, Zap } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function UsageInsights({ projectId }) {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (projectId) {
      generateAnalytics();
    }
  }, [projectId]);

  const generateAnalytics = () => {
    // Simulated analytics data
    const data = {
      pageViews: Array.from({ length: 7 }, (_, i) => ({
        day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        views: Math.floor(Math.random() * 500) + 100
      })),
      featureUsage: [
        { name: 'AI Assistant', value: 45 },
        { name: 'Entity Designer', value: 25 },
        { name: 'Page Editor', value: 15 },
        { name: 'API Explorer', value: 10 },
        { name: 'Others', value: 5 }
      ],
      userActivity: Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        users: Math.floor(Math.random() * 50) + 5
      }))
    };
    setAnalytics(data);
  };

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">Total Views</span>
            </div>
            <div className="text-3xl font-bold">12.4K</div>
            <Badge className="mt-2 bg-green-600">+24% this week</Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-gray-600">Active Users</span>
            </div>
            <div className="text-3xl font-bold">892</div>
            <Badge className="mt-2 bg-green-600">+12% this week</Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Code className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-gray-600">AI Requests</span>
            </div>
            <div className="text-3xl font-bold">3.2K</div>
            <Badge className="mt-2 bg-green-600">+31% this week</Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">API Calls</span>
            </div>
            <div className="text-3xl font-bold">45.6K</div>
            <Badge className="mt-2 bg-green-600">+18% this week</Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Page Views (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.pageViews}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature Usage Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.featureUsage}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.featureUsage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Activity (24 Hours)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.userActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}