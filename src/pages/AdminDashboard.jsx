import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Users, Activity, Rocket, Brain, Code, Shield, Layout, 
  TrendingUp, AlertCircle, CheckCircle, Zap
} from 'lucide-react';
import GlobalInsightsPanel from '@/components/admin/GlobalInsightsPanel';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      if (userData?.role === 'admin') {
        const [projects, agents, deployments, users] = await Promise.all([
          base44.asServiceRole.entities.Project.list(),
          base44.asServiceRole.entities.CustomAgent.list(),
          base44.asServiceRole.entities.AgentDeployment.list(),
          base44.asServiceRole.entities.User.list()
        ]);

        setStats({
          projects: projects.length,
          agents: agents.length,
          deployments: deployments.length,
          users: users.length,
          activeAgents: agents.filter(a => a.is_active).length,
          activeDeployments: deployments.filter(d => d.status === 'active').length
        });
      }
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading admin dashboard...</p>
      </div>
    </div>;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <Card className="border-red-200 max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-900 mb-2">Access Denied</h2>
            <p className="text-red-700 mb-6">This area requires administrator privileges</p>
            <Link to={createPageUrl('Dashboard')}>
              <Button>Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const adminSections = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: Users,
      href: createPageUrl('AdminUserManagement'),
      color: 'from-blue-500 to-cyan-600',
      stat: stats?.users || 0
    },
    {
      title: 'AI Capabilities',
      description: 'Configure AI features and settings',
      icon: Brain,
      href: createPageUrl('AdminAIControl'),
      color: 'from-purple-500 to-pink-600',
      stat: stats?.activeAgents || 0
    },
    {
      title: 'Agent Control',
      description: 'Manage AI agents and permissions',
      icon: Zap,
      href: createPageUrl('AdminAgentControl'),
      color: 'from-orange-500 to-red-600',
      stat: stats?.agents || 0
    },
    {
      title: 'Deployments',
      description: 'Monitor all deployments',
      icon: Rocket,
      href: createPageUrl('AdminDeployments'),
      color: 'from-green-500 to-emerald-600',
      stat: stats?.deployments || 0
    },
    {
      title: 'Templates',
      description: 'Manage project templates',
      icon: Layout,
      href: createPageUrl('AdminTemplates'),
      color: 'from-indigo-500 to-purple-600',
      stat: stats?.projects || 0
    },
    {
      title: 'Coaching System',
      description: 'Configure coaching and subscriptions',
      icon: TrendingUp,
      href: createPageUrl('AdminCoaching'),
      color: 'from-cyan-500 to-blue-600',
      stat: 'Active'
    },
    {
      title: 'System Settings',
      description: 'Platform-wide configuration',
      icon: Shield,
      href: createPageUrl('AdminSystemConfig'),
      color: 'from-gray-600 to-gray-800',
      stat: 'Online'
    },
    {
      title: 'Analytics',
      description: 'Usage metrics and insights',
      icon: Activity,
      href: createPageUrl('AdminAnalytics'),
      color: 'from-yellow-500 to-orange-600',
      stat: '↑ 24%'
    },
    {
      title: 'Agents & Permissions',
      description: 'Control AI agents and admin access',
      icon: Zap,
      href: createPageUrl('AdminAgents'),
      color: 'from-indigo-500 to-blue-600',
      stat: '8 Active'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-purple-950/20 dark:to-pink-950/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Admin Control Center
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Complete system management and configuration</p>
          </div>
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm px-4 py-2">
            <CheckCircle className="w-4 h-4 mr-1" />
            System Operational
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-6">
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <div className="text-3xl font-bold text-blue-900">{stats?.users || 0}</div>
              <div className="text-sm text-blue-700">Total Users</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-6">
              <Brain className="w-8 h-8 text-purple-600 mb-2" />
              <div className="text-3xl font-bold text-purple-900">{stats?.agents || 0}</div>
              <div className="text-sm text-purple-700">AI Agents</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <Rocket className="w-8 h-8 text-green-600 mb-2" />
              <div className="text-3xl font-bold text-green-900">{stats?.deployments || 0}</div>
              <div className="text-sm text-green-700">Deployments</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
            <CardContent className="p-6">
              <Code className="w-8 h-8 text-orange-600 mb-2" />
              <div className="text-3xl font-bold text-orange-900">{stats?.projects || 0}</div>
              <div className="text-sm text-orange-700">Projects</div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Sections Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Administration Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {adminSections.map((section) => {
                const Icon = section.icon;
                return (
                  <Link key={section.title} to={section.href}>
                    <Card className="h-full hover:shadow-xl hover:scale-105 transition-all cursor-pointer border-2 hover:border-purple-300">
                      <CardContent className="p-6">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center mb-4`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{section.title}</h3>
                        <p className="text-xs text-gray-600 mb-3">{section.description}</p>
                        <Badge variant="outline" className="text-xs">{section.stat}</Badge>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-semibold">API Services</span>
                <Badge className="bg-green-600">Operational</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-semibold">Database</span>
                <Badge className="bg-green-600">Operational</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-semibold">AI Services</span>
                <Badge className="bg-green-600">Operational</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-semibold">Storage</span>
                <Badge className="bg-green-600">Operational</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                View All Users
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Activity className="w-4 h-4 mr-2" />
                System Logs
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="w-4 h-4 mr-2" />
                Security Settings
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Global Insights */}
        <GlobalInsightsPanel />
      </div>
    </div>
  );
}