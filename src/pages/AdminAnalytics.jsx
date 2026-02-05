import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Code, Rocket, AlertCircle } from 'lucide-react';

export default function AdminAnalytics() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  const usageData = [
    { date: 'Jan 29', users: 45, projects: 12, agents: 8 },
    { date: 'Jan 30', users: 52, projects: 15, agents: 11 },
    { date: 'Jan 31', users: 48, projects: 18, agents: 14 },
    { date: 'Feb 1', users: 61, projects: 22, agents: 17 },
    { date: 'Feb 2', users: 55, projects: 25, agents: 19 },
    { date: 'Feb 3', users: 67, projects: 28, agents: 23 },
    { date: 'Feb 4', users: 72, projects: 31, agents: 26 }
  ];

  const featureUsage = [
    { feature: 'AI Components', usage: 245 },
    { feature: 'Code Review', usage: 189 },
    { feature: 'Deployments', usage: 156 },
    { feature: 'Templates', usage: 134 },
    { feature: 'Bot Builder', usage: 98 }
  ];

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  if (user?.role !== 'admin') {
    return (
      <Card className="border-red-200 m-6">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 font-semibold">Admin Access Required</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-950 dark:to-purple-950/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Platform Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Usage metrics and insights</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <Badge className="bg-green-600">↑ 24%</Badge>
              </div>
              <div className="text-2xl font-bold">1,247</div>
              <div className="text-xs text-gray-600">Total Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Code className="w-5 h-5 text-purple-600" />
                <Badge className="bg-green-600">↑ 18%</Badge>
              </div>
              <div className="text-2xl font-bold">523</div>
              <div className="text-xs text-gray-600">Projects Created</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Rocket className="w-5 h-5 text-green-600" />
                <Badge className="bg-green-600">↑ 31%</Badge>
              </div>
              <div className="text-2xl font-bold">89</div>
              <div className="text-xs text-gray-600">Active Agents</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <Badge className="bg-green-600">↑ 42%</Badge>
              </div>
              <div className="text-2xl font-bold">1.2k</div>
              <div className="text-xs text-gray-600">Components Generated</div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Trends (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} />
                <Line type="monotone" dataKey="projects" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="agents" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Feature Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={featureUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="feature" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="usage" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}