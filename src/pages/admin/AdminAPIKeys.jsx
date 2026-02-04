import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Key, Plus, Copy, Trash2, RefreshCw, Eye, EyeOff, Search, 
  Download, TrendingUp, AlertCircle, CheckCircle, Check,
  BarChart3, Activity, Clock, Shield, ArrowUpDown
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

export default function AdminAPIKeys() {
  const [apiKeys, setApiKeys] = useState([
    {
      id: '1',
      name: 'Production API',
      key: 'sk_live_abc123def456ghi789',
      maskedKey: 'sk_live_•••••••••••••89',
      created: '2026-01-15T10:00:00Z',
      lastUsed: '2026-02-04T08:30:00Z',
      usageCount: 15847,
      rateLimit: 1000,
      rateLimitUnit: 'hour',
      expiresAt: '2027-01-15T10:00:00Z',
      scopes: ['read', 'write'],
      status: 'active',
      user: 'fernando@appforge.dev',
      application: 'Production App'
    },
    {
      id: '2',
      name: 'Development API',
      key: 'sk_test_xyz789uvw456rst123',
      maskedKey: 'sk_test_•••••••••••••23',
      created: '2026-01-20T14:00:00Z',
      lastUsed: '2026-02-03T16:45:00Z',
      usageCount: 3251,
      rateLimit: 100,
      rateLimitUnit: 'hour',
      expiresAt: null,
      scopes: ['read'],
      status: 'active',
      user: 'dev@appforge.dev',
      application: 'Dev Environment'
    },
    {
      id: '3',
      name: 'Analytics Service',
      key: 'sk_live_mno123pqr456stu789',
      maskedKey: 'sk_live_•••••••••••••89',
      created: '2026-01-10T09:00:00Z',
      lastUsed: '2026-01-25T12:00:00Z',
      usageCount: 892,
      rateLimit: 500,
      rateLimitUnit: 'hour',
      expiresAt: '2026-12-31T23:59:59Z',
      scopes: ['read'],
      status: 'inactive',
      user: 'analytics@appforge.dev',
      application: 'Analytics Dashboard'
    },
    {
      id: '4',
      name: 'Admin Dashboard',
      key: 'sk_live_admin987fed654cba321',
      maskedKey: 'sk_live_•••••••••••••21',
      created: '2026-02-01T11:00:00Z',
      lastUsed: '2026-02-04T09:15:00Z',
      usageCount: 2456,
      rateLimit: 5000,
      rateLimitUnit: 'hour',
      expiresAt: null,
      scopes: ['read', 'write', 'admin'],
      status: 'active',
      user: 'admin@appforge.dev',
      application: 'Admin Panel'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterUser, setFilterUser] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterScope, setFilterScope] = useState('all');
  const [sortField, setSortField] = useState('created');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [visibleKeys, setVisibleKeys] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState(null);
  const [selectedKeyStats, setSelectedKeyStats] = useState(null);
  const [advancedMode, setAdvancedMode] = useState(false);

  // New key form state
  const [newKey, setNewKey] = useState({
    name: '',
    rateLimit: 1000,
    rateLimitUnit: 'hour',
    expiresAt: '',
    scopes: ['read']
  });

  // Mock usage stats data
  const [usageStats] = useState({
    last30Days: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      requests: Math.floor(Math.random() * 500) + 100,
      errors: Math.floor(Math.random() * 20)
    })),
    topEndpoints: [
      { endpoint: '/api/projects', calls: 4521, avgTime: '145ms' },
      { endpoint: '/api/auth/me', calls: 3892, avgTime: '67ms' },
      { endpoint: '/api/deployments', calls: 2341, avgTime: '234ms' },
      { endpoint: '/api/analytics', calls: 1876, avgTime: '189ms' },
      { endpoint: '/api/users', calls: 1234, avgTime: '98ms' }
    ]
  });

  // Filter and sort keys
  const filteredKeys = apiKeys
    .filter(key => {
      const matchesSearch = key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           key.maskedKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           key.user.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUser = filterUser === 'all' || key.user === filterUser;
      const matchesStatus = filterStatus === 'all' || key.status === filterStatus;
      const matchesScope = filterScope === 'all' || key.scopes.includes(filterScope);
      return matchesSearch && matchesUser && matchesStatus && matchesScope;
    })
    .sort((a, b) => {
      const aValue = sortField === 'created' || sortField === 'lastUsed' 
        ? new Date(a[sortField] || 0).getTime()
        : a[sortField];
      const bValue = sortField === 'created' || sortField === 'lastUsed'
        ? new Date(b[sortField] || 0).getTime()
        : b[sortField];
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key.key);
    setCopiedKey(key.id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleKeyVisibility = (id) => {
    setVisibleKeys(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCreateKey = async () => {
    // In production, this would call: POST /api/admin/keys
    const generatedKey = `sk_${newKey.scopes.includes('admin') ? 'live' : 'test'}_${Math.random().toString(36).substr(2, 21)}`;
    
    const key = {
      id: Date.now().toString(),
      name: newKey.name,
      key: generatedKey,
      maskedKey: generatedKey.substring(0, 8) + '•'.repeat(generatedKey.length - 10) + generatedKey.slice(-2),
      created: new Date().toISOString(),
      lastUsed: null,
      usageCount: 0,
      rateLimit: newKey.rateLimit,
      rateLimitUnit: newKey.rateLimitUnit,
      expiresAt: newKey.expiresAt || null,
      scopes: newKey.scopes,
      status: 'active',
      user: 'admin@appforge.dev',
      application: 'New Application'
    };

    setApiKeys([key, ...apiKeys]);
    setIsCreateDialogOpen(false);
    setNewKey({
      name: '',
      rateLimit: 1000,
      rateLimitUnit: 'hour',
      expiresAt: '',
      scopes: ['read']
    });

    // Auto-copy the new key
    navigator.clipboard.writeText(generatedKey);
    setCopiedKey(key.id);
    setTimeout(() => setCopiedKey(null), 3000);
  };

  const handleRotateKey = async (id) => {
    // In production, this would call: PUT /api/admin/keys/:id/rotate
    const keyToRotate = apiKeys.find(k => k.id === id);
    if (!keyToRotate) return;

    const newGeneratedKey = `sk_${keyToRotate.scopes.includes('admin') ? 'live' : 'test'}_${Math.random().toString(36).substr(2, 21)}`;
    
    const updatedKey = {
      ...keyToRotate,
      key: newGeneratedKey,
      maskedKey: newGeneratedKey.substring(0, 8) + '•'.repeat(newGeneratedKey.length - 10) + newGeneratedKey.slice(-2),
      created: new Date().toISOString()
    };

    setApiKeys(apiKeys.map(k => k.id === id ? updatedKey : k));
    
    // Auto-copy the new key
    navigator.clipboard.writeText(newGeneratedKey);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 3000);
  };

  const handleDeleteKey = async () => {
    // In production, this would call: DELETE /api/admin/keys/:id
    setApiKeys(apiKeys.filter(k => k.id !== keyToDelete));
    setIsDeleteDialogOpen(false);
    setKeyToDelete(null);
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedKeys.length} selected keys? This action cannot be undone.`)) {
      setApiKeys(apiKeys.filter(k => !selectedKeys.includes(k.id)));
      setSelectedKeys([]);
    }
  };

  const handleExportKeys = () => {
    const csv = [
      ['Name', 'Key', 'Created', 'Last Used', 'Usage Count', 'Rate Limit', 'Status', 'User', 'Application'],
      ...filteredKeys.map(k => [
        k.name,
        k.maskedKey,
        new Date(k.created).toLocaleString(),
        k.lastUsed ? new Date(k.lastUsed).toLocaleString() : 'Never',
        k.usageCount,
        `${k.rateLimit}/${k.rateLimitUnit}`,
        k.status,
        k.user,
        k.application
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-keys-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const toggleScopeSelection = (scope) => {
    setNewKey(prev => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter(s => s !== scope)
        : [...prev.scopes, scope]
    }));
  };

  const toggleSelectAll = () => {
    if (selectedKeys.length === filteredKeys.length) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(filteredKeys.map(k => k.id));
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800',
      inactive: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
      expired: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800',
      rotating: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
    };

    const icons = {
      active: <CheckCircle className="w-3 h-3 mr-1" />,
      inactive: <Clock className="w-3 h-3 mr-1" />,
      expired: <AlertCircle className="w-3 h-3 mr-1" />,
      rotating: <RefreshCw className="w-3 h-3 mr-1" />
    };

    return (
      <Badge variant="outline" className={variants[status]}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getScopeBadges = (scopes) => {
    const colors = {
      read: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      write: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      admin: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800'
    };

    return scopes.map((scope) => (
      <Badge key={scope} variant="outline" className={`${colors[scope]} text-xs`}>
        {scope}
      </Badge>
    ));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const uniqueUsers = [...new Set(apiKeys.map(k => k.user))];

  const stats = {
    total: apiKeys.length,
    active: apiKeys.filter(k => k.status === 'active').length,
    totalRequests: apiKeys.reduce((sum, k) => sum + k.usageCount, 0),
    avgRateLimit: Math.floor(apiKeys.reduce((sum, k) => sum + k.rateLimit, 0) / apiKeys.length)
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                <Key className="w-6 h-6 text-white" />
              </div>
              API Keys
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Create, manage, and monitor API keys</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdvancedMode(!advancedMode)}
              className="dark:border-slate-700 dark:hover:bg-slate-800 min-h-10"
            >
              <Shield className="w-4 h-4 mr-2" />
              {advancedMode ? 'Beginner' : 'Advanced'} Mode
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="min-h-10 bg-indigo-600 dark:bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  New Key
                </Button>
              </DialogTrigger>
              <DialogContent className="dark:bg-slate-900 dark:border-slate-800 max-w-md">
                <DialogHeader>
                  <DialogTitle className="dark:text-white">Create New API Key</DialogTitle>
                  <DialogDescription className="dark:text-gray-400">
                    Generate a new API key with specific scopes and rate limits
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="keyName" className="text-sm">
                      Key Name
                    </Label>
                    <Input
                      id="keyName"
                      value={newKey.name}
                      onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                      placeholder="My API Key"
                      className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Scopes</Label>
                    <div className="space-y-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                      {['read', 'write', 'admin'].map((scope) => (
                        <div key={scope} className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            defaultChecked={newKey.scopes.includes(scope)}
                            onChange={() => toggleScopeSelection(scope)}
                            id={`scope-${scope}`}
                            className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 dark:bg-slate-800 cursor-pointer"
                          />
                          <label
                            htmlFor={`scope-${scope}`}
                            className="text-sm capitalize cursor-pointer dark:text-gray-300"
                          >
                            {scope} Access
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="rateLimit" className="text-sm">
                        Rate Limit
                      </Label>
                      <Input
                        id="rateLimit"
                        type="number"
                        value={newKey.rateLimit}
                        onChange={(e) =>
                          setNewKey({ ...newKey, rateLimit: Number(e.target.value) })
                        }
                        className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rateLimitUnit" className="text-sm">
                        Per
                      </Label>
                      <Select
                        value={newKey.rateLimitUnit}
                        onValueChange={(value) =>
                          setNewKey({ ...newKey, rateLimitUnit: value })
                        }
                      >
                        <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                          <SelectItem value="minute">Minute</SelectItem>
                          <SelectItem value="hour">Hour</SelectItem>
                          <SelectItem value="day">Day</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiresAt" className="text-sm">
                      Expires At (Optional)
                    </Label>
                    <Input
                      id="expiresAt"
                      type="date"
                      value={newKey.expiresAt}
                      onChange={(e) =>
                        setNewKey({ ...newKey, expiresAt: e.target.value })
                      }
                      className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateKey}
                    className="bg-indigo-600 dark:bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-700 text-white"
                  >
                    Create Key
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Keys', value: stats.total, icon: Key, color: 'purple' },
            { label: 'Active Keys', value: stats.active, icon: CheckCircle, color: 'green' },
            { label: 'Total Requests', value: stats.totalRequests.toLocaleString(), icon: Activity, color: 'indigo' },
            { label: 'Avg Rate Limit', value: `${stats.avgRateLimit}/h`, icon: TrendingUp, color: 'cyan' }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            const colorClass = {
              purple: 'border-l-purple-500 dark:border-l-purple-400',
              green: 'border-l-green-500 dark:border-l-green-400',
              indigo: 'border-l-indigo-500 dark:border-l-indigo-400',
              cyan: 'border-l-cyan-500 dark:border-l-cyan-400'
            }[stat.color];

            return (
              <Card
                key={idx}
                className={`border-l-4 ${colorClass} bg-white dark:bg-slate-900 dark:border-slate-800`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {stat.label}
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
                        {stat.value}
                      </p>
                    </div>
                    <Icon className={`w-8 h-8 opacity-50 text-${stat.color}-500`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters and Search */}
        <Card className="bg-white dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, key, or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm"
                />
              </div>

              {advancedMode && (
                <>
                  <Select value={filterUser} onValueChange={setFilterUser}>
                    <SelectTrigger className="w-full md:w-[160px] dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm">
                      <SelectValue placeholder="User" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                      <SelectItem value="all">All Users</SelectItem>
                      {uniqueUsers.map((user) => (
                        <SelectItem key={user} value={user}>
                          {user}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-[160px] dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterScope} onValueChange={setFilterScope}>
                    <SelectTrigger className="w-full md:w-[160px] dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm">
                      <SelectValue placeholder="Scope" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                      <SelectItem value="all">All Scopes</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="write">Write</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}

              {selectedKeys.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="min-h-10"
                >
                  Delete ({selectedKeys.length})
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportKeys}
                className="dark:border-slate-700 dark:hover:bg-slate-800 min-h-10"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API Keys Table */}
        <Card className="bg-white dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="border-b border-gray-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="dark:text-white text-lg sm:text-xl">API Keys</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  {filteredKeys.length} key{filteredKeys.length !== 1 ? 's' : ''} found
                </CardDescription>
              </div>
              {advancedMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportKeys}
                  className="dark:border-slate-700 dark:hover:bg-slate-800 min-h-10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Mobile View */}
            <div className="block md:hidden divide-y divide-gray-200 dark:divide-slate-800">
              {filteredKeys.length === 0 ? (
                <div className="p-6 text-center">
                  <Key className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 text-sm">No API keys found</p>
                </div>
              ) : (
                filteredKeys.map((key) => (
                  <div
                    key={key.id}
                    className="p-4 space-y-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="checkbox"
                            defaultChecked={selectedKeys.includes(key.id)}
                            onChange={() =>
                              setSelectedKeys(
                                selectedKeys.includes(key.id)
                                  ? selectedKeys.filter((id) => id !== key.id)
                                  : [...selectedKeys, key.id]
                              )
                            }
                            id={`key-${key.id}`}
                            className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 dark:bg-slate-800 cursor-pointer"
                          />
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                            {key.name}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mb-2 truncate">
                          {key.maskedKey}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {getScopeBadges(key.scopes)}
                        </div>
                      </div>
                      {getStatusBadge(key.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500 dark:text-gray-500">Created</p>
                        <p className="text-gray-900 dark:text-gray-300 font-medium">
                          {formatDate(key.created)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-500">Last Used</p>
                        <p className="text-gray-900 dark:text-gray-300 font-medium">
                          {formatDate(key.lastUsed)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-500">Usage</p>
                        <p className="text-gray-900 dark:text-gray-300 font-medium">
                          {key.usageCount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-500">Rate Limit</p>
                        <p className="text-gray-900 dark:text-gray-300 font-medium">
                          {key.rateLimit}/{key.rateLimitUnit}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1.5 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyKey(key)}
                        className="flex-1 dark:hover:bg-slate-800 min-h-9 text-xs"
                      >
                        {copiedKey === key.id ? (
                          <>
                            <Check className="w-3 h-3 mr-1 text-green-500" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRotateKey(key.id)}
                        className="flex-1 dark:hover:bg-slate-800 min-h-9 text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Rotate
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setKeyToDelete(key.id);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="flex-1 dark:hover:bg-slate-800 dark:hover:text-red-400 min-h-9 text-xs text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                    <th className="w-12 dark:text-gray-300 px-4 py-2 text-left">
                      <input
                        type="checkbox"
                        defaultChecked={selectedKeys.length === filteredKeys.length && filteredKeys.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 dark:bg-slate-800 cursor-pointer"
                      />
                    </th>
                    <th className="dark:text-gray-300 px-4 py-2 text-left">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm"
                      >
                        Name
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="dark:text-gray-300 px-4 py-2 text-left">API Key</th>
                    <th className="dark:text-gray-300 px-4 py-2 text-left">
                      <button
                        onClick={() => handleSort('created')}
                        className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm"
                      >
                        Created
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="dark:text-gray-300 px-4 py-2 text-left">
                      <button
                        onClick={() => handleSort('lastUsed')}
                        className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm"
                      >
                        Last Used
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="dark:text-gray-300 px-4 py-2 text-left">
                      <button
                        onClick={() => handleSort('usageCount')}
                        className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm"
                      >
                        Usage
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="dark:text-gray-300 px-4 py-2 text-left">Rate Limit</th>
                    {advancedMode && <th className="dark:text-gray-300 px-4 py-2 text-left">User</th>}
                    <th className="dark:text-gray-300 px-4 py-2 text-left">Scopes</th>
                    <th className="dark:text-gray-300 px-4 py-2 text-left">Status</th>
                    <th className="text-right dark:text-gray-300 px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKeys.map((key) => (
                    <tr
                      key={key.id}
                      className="border-b border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="dark:text-gray-300 px-4 py-2">
                        <input
                          type="checkbox"
                          defaultChecked={selectedKeys.includes(key.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSelectedKeys(
                              checked
                                ? [...selectedKeys, key.id]
                                : selectedKeys.filter((id) => id !== key.id)
                            );
                          }}
                          className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 dark:bg-slate-800 cursor-pointer"
                        />
                      </td>
                      <td className="font-medium dark:text-white text-sm px-4 py-2">
                        {key.name}
                      </td>
                      <td className="dark:text-gray-300 px-4 py-2">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded font-mono dark:text-gray-300">
                            {visibleKeys[key.id] ? key.key : key.maskedKey}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleKeyVisibility(key.id)}
                            className="h-8 w-8 p-0 dark:hover:bg-slate-700 min-h-8"
                          >
                            {visibleKeys[key.id] ? (
                              <EyeOff className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            ) : (
                              <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </td>
                      <td className="text-sm text-gray-600 dark:text-gray-400 px-4 py-2">
                        {formatDate(key.created)}
                      </td>
                      <td className="text-sm text-gray-600 dark:text-gray-400 px-4 py-2">
                        {formatDate(key.lastUsed)}
                      </td>
                      <td className="dark:text-gray-300 px-4 py-2">
                        <button
                          onClick={() => setSelectedKeyStats(key)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-sm"
                        >
                          {key.usageCount.toLocaleString()}
                        </button>
                      </td>
                      <td className="text-sm text-gray-600 dark:text-gray-400 px-4 py-2">
                        {key.rateLimit.toLocaleString()}/{key.rateLimitUnit}
                      </td>
                      {advancedMode && (
                        <td className="text-sm text-gray-600 dark:text-gray-400 px-4 py-2">
                          {key.user}
                        </td>
                      )}
                      <td className="dark:text-gray-300 px-4 py-2">
                        <div className="flex gap-1 flex-wrap">
                          {getScopeBadges(key.scopes)}
                        </div>
                      </td>
                      <td className="dark:text-gray-300 px-4 py-2">
                        {getStatusBadge(key.status)}
                      </td>
                      <td className="text-right dark:text-gray-300 px-4 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyKey(key)}
                            className="h-9 w-9 p-0 dark:hover:bg-slate-700 min-h-9"
                            title="Copy API key"
                          >
                            {copiedKey === key.id ? (
                              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRotateKey(key.id)}
                            className="h-9 w-9 p-0 dark:hover:bg-slate-700 min-h-9"
                            title="Rotate API key"
                          >
                            <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setKeyToDelete(key.id);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="h-9 w-9 p-0 dark:hover:bg-slate-700 dark:hover:text-red-400 min-h-9 text-red-600 hover:text-red-700"
                            title="Delete API key"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredKeys.length === 0 && (
                <div className="text-center py-12">
                  <Key className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No API keys found
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {searchTerm || filterUser !== 'all' || filterStatus !== 'all' || filterScope !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Create your first API key to get started'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        {advancedMode && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white dark:bg-slate-900 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  API Requests (Last 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={usageStats.last30Days}>
                    <defs>
                      <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        color: '#e2e8f0'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="requests" 
                      stroke="#9333ea" 
                      fillOpacity={1} 
                      fill="url(#colorRequests)"
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="errors" 
                      stroke="#ef4444" 
                      fillOpacity={1} 
                      fill="url(#colorErrors)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  Top API Endpoints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usageStats.topEndpoints.map((endpoint, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <code className="text-xs font-mono bg-gray-100 dark:bg-slate-800 dark:text-gray-300 px-2 py-1 rounded">
                          {endpoint.endpoint}
                        </code>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 dark:text-gray-400">{endpoint.avgTime}</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {endpoint.calls.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"
                          style={{ 
                            width: `${(endpoint.calls / usageStats.topEndpoints[0].calls) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Key Usage Stats Dialog */}
        <Dialog open={!!selectedKeyStats} onOpenChange={() => setSelectedKeyStats(null)}>
          <DialogContent className="max-w-2xl dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Usage Statistics - {selectedKeyStats?.name}</DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                Detailed usage metrics for this API key
              </DialogDescription>
            </DialogHeader>
            
            {selectedKeyStats && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-400">
                      {selectedKeyStats.usageCount.toLocaleString()}
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Total Requests</p>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-400">
                      {selectedKeyStats.rateLimit}
                    </p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">Rate Limit / {selectedKeyStats.rateLimitUnit}</p>
                  </div>
                  <div className="text-center p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                    <p className="text-2xl font-bold text-cyan-900 dark:text-cyan-400">
                      {Math.floor(Math.random() * 100)}%
                    </p>
                    <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">Success Rate</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Request History (7 Days)</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={usageStats.last30Days.slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b',
                          border: '1px solid #475569',
                          borderRadius: '8px',
                          color: '#e2e8f0'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="requests" 
                        stroke="#9333ea" 
                        strokeWidth={2}
                        dot={{ fill: '#9333ea', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Key Information</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">User:</span>
                      <span className="ml-2 font-medium dark:text-gray-300">{selectedKeyStats.user}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Application:</span>
                      <span className="ml-2 font-medium dark:text-gray-300">{selectedKeyStats.application}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Created:</span>
                      <span className="ml-2 font-medium dark:text-gray-300">
                        {new Date(selectedKeyStats.created).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Expires:</span>
                      <span className="ml-2 font-medium dark:text-gray-300">
                        {selectedKeyStats.expiresAt 
                          ? new Date(selectedKeyStats.expiresAt).toLocaleDateString()
                          : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedKeyStats(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                Delete API Key
              </DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                Are you sure you want to delete this API key? This action cannot be undone and will immediately revoke access.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteKey}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
