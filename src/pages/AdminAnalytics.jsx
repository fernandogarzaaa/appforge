import React, { useState, useEffect } from 'react';
import { base44, hasServiceToken } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Activity, Zap } from 'lucide-react';

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const buildMonthlySeries = (items, months = 6) => {
    const now = new Date();
    const buckets = [];
    for (let i = months - 1; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${date.getFullYear()}-${date.getMonth()}`,
        month: date.toLocaleString('en-US', { month: 'short' })
      });
    }

    const counts = new Map(buckets.map(bucket => [bucket.key, 0]));
    items.forEach((item) => {
      const rawDate = item?.created_date || item?.created_at || item?.updated_date || item?.updated_at;
      if (!rawDate) return;
      const date = new Date(rawDate);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (counts.has(key)) {
        counts.set(key, counts.get(key) + 1);
      }
    });

    return buckets.map(bucket => ({
      month: bucket.month,
      count: counts.get(bucket.key) || 0
    }));
  };

  const loadAnalytics = async () => {
    try {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') throw new Error('Admin only');

      if (!hasServiceToken) {
        setStats({ totalProjects: 0, totalAgents: 0, totalUsers: 0, activeProjects: 0 });
        setChartData([]);
        return;
      }

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

      const projectSeries = buildMonthlySeries(projects);
      const agentSeries = buildMonthlySeries(agents);
      const userSeries = buildMonthlySeries(users);

      const series = projectSeries.map((bucket, index) => ({
        month: bucket.month,
        projects: bucket.count,
        agents: agentSeries[index]?.count || 0,
        users: userSeries[index]?.count || 0
      }));

      setChartData(series);
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
        {!hasServiceToken && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Admin analytics require a service token. Set `VITE_BASE44_SERVICE_TOKEN` to enable.
          </div>
        )}

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
