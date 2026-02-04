import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SystemHealthDashboard from '@/components/admin/SystemHealthDashboard';
import APIKeyManagement from '@/components/admin/APIKeyManagement';
import AdminSettings from '@/components/admin/AdminSettings';
import UserManagement from '@/components/admin/UserManagement';
import HelpTooltip from '@/components/help/HelpTooltip';
import { Shield, Key, Settings, Users, Activity, Database, Clock, AlertTriangle, TrendingUp, FileText, BarChart3, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeUsers, setActiveUsers] = useState(0);
  const [systemLoad, setSystemLoad] = useState({ cpu: 0, memory: 0, requests: 0 });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      setLastUpdated(new Date());
      setActiveUsers(Math.floor(Math.random() * 50) + 20);
      setSystemLoad({
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        requests: Math.floor(Math.random() * 1000) + 100
      });
    }, 30000); // Update every 30 seconds

    // Load initial activity
    setRecentActivity([
      { id: 1, type: 'user_login', user: 'admin@appforge.dev', timestamp: new Date(Date.now() - 120000), status: 'success' },
      { id: 2, type: 'api_call', user: 'system', timestamp: new Date(Date.now() - 300000), status: 'success' },
      { id: 3, type: 'config_change', user: 'fernando@appforge.dev', timestamp: new Date(Date.now() - 600000), status: 'warning' },
      { id: 4, type: 'subscription_update', user: 'john@example.com', timestamp: new Date(Date.now() - 900000), status: 'success' },
      { id: 5, type: 'api_error', user: 'system', timestamp: new Date(Date.now() - 1200000), status: 'error' }
    ]);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', value);
    setSearchParams(nextParams, { replace: true });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_login': return <Users className="w-4 h-4" />;
      case 'api_call': return <Key className="w-4 h-4" />;
      case 'config_change': return <Settings className="w-4 h-4" />;
      case 'subscription_update': return <TrendingUp className="w-4 h-4" />;
      case 'api_error': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30';
      case 'error': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/50';
    }
  };

  const getCPUStatus = (cpu) => {
    if (cpu > 80) return { color: 'bg-red-500', status: 'Critical' };
    if (cpu > 60) return { color: 'bg-yellow-500', status: 'Warning' };
    return { color: 'bg-green-500', status: 'Healthy' };
  };

  const cpuStatus = getCPUStatus(systemLoad.cpu);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-gray-950 dark:via-slate-900 dark:to-gray-950">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="border-b bg-white/80 dark:bg-slate-900/80 dark:border-slate-800 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  Admin Control Center
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Comprehensive system management and monitoring</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs dark:border-slate-700 dark:text-gray-300">
                  <Clock className="w-3 h-3 mr-1" />
                  Updated: {lastUpdated.toLocaleTimeString()}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setLastUpdated(new Date())} className="dark:hover:bg-slate-800">
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <HelpTooltip 
                  content="Access admin controls to manage API keys, system settings, users, and monitor system health. All changes require admin privileges."
                  title="Admin Dashboard"
                />
              </div>
            </div>
            
            <TabsList className="grid w-full max-w-4xl grid-cols-7 bg-gray-100 dark:bg-slate-800">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="health" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Health</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="api-keys" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                <span className="hidden sm:inline">API Keys</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Activity</span>
              </TabsTrigger>
              <TabsTrigger value="database" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Database</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Overview Tab - New comprehensive dashboard */}
        <TabsContent value="overview" className="border-0">
          <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
            {/* System Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-blue-500 dark:bg-slate-800/50 dark:border-l-blue-400">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{activeUsers}</div>
                    <Users className="w-8 h-8 text-blue-500 dark:text-blue-400 opacity-50" />
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">↑ 12% from yesterday</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500 dark:bg-slate-800/50 dark:border-l-purple-400">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">CPU Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{systemLoad.cpu.toFixed(1)}%</div>
                    <Activity className="w-8 h-8 text-purple-500 dark:text-purple-400 opacity-50" />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`w-2 h-2 rounded-full ${cpuStatus.color}`}></div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{cpuStatus.status}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 dark:bg-slate-800/50 dark:border-l-green-400">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">API Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{systemLoad.requests.toLocaleString()}</div>
                    <TrendingUp className="w-8 h-8 text-green-500 dark:text-green-400 opacity-50" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Last hour</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500 dark:bg-slate-800/50 dark:border-l-orange-400">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Memory Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{systemLoad.memory.toFixed(1)}%</div>
                    <Database className="w-8 h-8 text-orange-500 dark:text-orange-400 opacity-50" />
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-orange-500 dark:bg-orange-400 h-2 rounded-full transition-all" 
                      style={{ width: `${systemLoad.memory}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div 
                      key={activity.id} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getActivityColor(activity.status)}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">
                            {activity.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </p>
                          <p className="text-xs text-gray-600">{activity.user}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={activity.status === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                          {activity.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Users className="w-12 h-12 mx-auto text-blue-500 mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Manage Users</h3>
                    <p className="text-sm text-gray-600">View and manage user accounts</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Shield className="w-12 h-12 mx-auto text-purple-500 mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">System Health</h3>
                    <p className="text-sm text-gray-600">Monitor system performance</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Key className="w-12 h-12 mx-auto text-green-500 mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">API Management</h3>
                    <p className="text-sm text-gray-600">Generate and manage API keys</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="health" className="border-0">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <SystemHealthDashboard />
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="border-0">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <UserManagement />
          </div>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="border-0">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <APIKeyManagement />
          </div>
        </TabsContent>

        {/* Activity Log Tab - New */}
        <TabsContent value="activity" className="border-0">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Audit Trail & Activity Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Filters */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">All Activities</Button>
                    <Button variant="ghost" size="sm">User Actions</Button>
                    <Button variant="ghost" size="sm">System Events</Button>
                    <Button variant="ghost" size="sm">API Calls</Button>
                    <Button variant="ghost" size="sm">Errors</Button>
                  </div>

                  {/* Activity List */}
                  <div className="space-y-2">
                    {recentActivity.map((activity) => (
                      <div 
                        key={activity.id} 
                        className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-lg ${getActivityColor(activity.status)}`}>
                            {getActivityIcon(activity.type)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {activity.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </p>
                            <p className="text-sm text-gray-600">{activity.user}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {activity.timestamp.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={activity.status === 'error' ? 'destructive' : 'secondary'}>
                            {activity.status}
                          </Badge>
                          <Button variant="ghost" size="sm">View Details</Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center pt-4">
                    <Button variant="outline">Load More Activities</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Database Tab - New */}
        <TabsContent value="database" className="border-0">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Database Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-2">Total Records</h3>
                      <p className="text-3xl font-bold text-blue-600">1,247,583</p>
                      <p className="text-xs text-blue-600 mt-2">Across all tables</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-green-900 mb-2">Storage Used</h3>
                      <p className="text-3xl font-bold text-green-600">847 GB</p>
                      <p className="text-xs text-green-600 mt-2">72% of quota</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <h3 className="font-semibold text-purple-900 mb-2">Active Connections</h3>
                      <p className="text-3xl font-bold text-purple-600">23</p>
                      <p className="text-xs text-purple-600 mt-2">Max: 100</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Users Table</p>
                        <p className="text-sm text-gray-600">234,567 records</p>
                      </div>
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Projects Table</p>
                        <p className="text-sm text-gray-600">89,234 records</p>
                      </div>
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Automations Table</p>
                        <p className="text-sm text-gray-600">45,123 records</p>
                      </div>
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <Button variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Backup Database
                    </Button>
                    <Button variant="outline">
                      <Activity className="w-4 h-4 mr-2" />
                      Run Optimization
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="border-0">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <AdminSettings />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}