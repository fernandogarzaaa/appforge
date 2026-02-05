import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Activity, Zap } from 'lucide-react';

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') throw new Error('Admin only');

      const [projects, agents, users] = await Promise.all([
        base44.asServiceRole.entities.Project.list('-created_date'),
        base44.asServiceRole.entities.CustomAgent.list('-created_date'),
        base44.asServiceRole.entities.User.list('-created_date')
      ]);

      setStats({
        totalProjects: projects.length,
        totalAgents: agents.length,
        totalUsers: users.length,
        activeProjects: projects.filter(p => p.status === 'published').length
      });

      // Generate mock chart data
      const mockData = [
        { month: 'Jan', projects: 4, agents: 2, users: 24 },
        { month: 'Feb', projects: 3, agents: 1, users: 13 },
        { month: 'Mar', projects: 2, agents: 9, users: 9 },
        { month: 'Apr', projects: 5, agents: 8, users: 39 },
        { month: 'May', projects: 4, agents: 3, users: 28 },
        { month: 'Jun', projects: 8, agents: 7, users: 48 }
      ];
      setChartData(mockData);
    } catch (error) {
      console.error('Analytics load error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-yellow-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Platform metrics and usage insights</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Zap className="w-8 h-8 text-purple-600 mb-2" />
              <div className="text-3xl font-bold">{stats?.totalAgents || 0}</div>
              <div className="text-sm text-gray-600">AI Agents</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Activity className="w-8 h-8 text-green-600 mb-2" />
              <div className="text-3xl font-bold">{stats?.totalProjects || 0}</div>
              <div className="text-sm text-gray-600">Projects</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <TrendingUp className="w-8 h-8 text-orange-600 mb-2" />
              <div className="text-3xl font-bold">{stats?.activeProjects || 0}</div>
              <div className="text-sm text-gray-600">Published</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Projects Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="projects" stroke="#8b5cf6" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="users" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}