import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import HelpTooltip from '@/components/help/HelpTooltip';
import { 
  Key, Plus, Copy, Trash2, RefreshCw, Eye, EyeOff, Search, 
  Download, TrendingUp, AlertCircle, CheckCircle, 
  BarChart3, Activity, Clock, Shield, ArrowUpDown, X
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  const [usageStats, setUsageStats] = useState({
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
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      expired: 'bg-red-100 text-red-800 border-red-200',
      rotating: 'bg-yellow-100 text-yellow-800 border-yellow-200'
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
      read: 'bg-blue-100 text-blue-800 border-blue-200',
      write: 'bg-purple-100 text-purple-800 border-purple-200',
      admin: 'bg-red-100 text-red-800 border-red-200'
    };

    return scopes.map(scope => (
      <Badge key={scope} variant="outline" className={`${colors[scope]} text-xs`}>
        {scope}
      </Badge>
    ));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                <Key className="w-6 h-6 text-white" />
              </div>
              API Keys Management
            </h1>
            <p className="text-sm text-gray-600 mt-2">Create, manage, and monitor API keys and access tokens</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdvancedMode(!advancedMode)}
              className="border-purple-200 hover:bg-purple-50"
            >
              <Shield className="w-4 h-4 mr-2" />
              {advancedMode ? 'Beginner' : 'Advanced'} Mode
            </Button>
            <HelpTooltip 
              content="Manage API keys, set rate limits, monitor usage, and control access permissions. Keys can be rotated, revoked, or scoped to specific permissions."
              title="API Keys Management"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Keys</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <Key className="w-8 h-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Active Keys</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.active}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-indigo-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Requests</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.totalRequests.toLocaleString()}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-indigo-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-cyan-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Avg Rate Limit</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.avgRateLimit}<span className="text-sm text-gray-500">/h</span>
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-cyan-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, key, or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {advancedMode && (
                <>
                  <Select value={filterUser} onValueChange={setFilterUser}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {uniqueUsers.map(user => (
                        <SelectItem key={user} value={user}>{user}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterScope} onValueChange={setFilterScope}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Scope" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Scopes</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="write">Write</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Key
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New API Key</DialogTitle>
                    <DialogDescription>
                      Generate a new API key with custom rate limits and permissions
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="keyName">Key Name *</Label>
                      <Input
                        id="keyName"
                        placeholder="e.g., Production API Key"
                        value={newKey.name}
                        onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="rateLimit">Rate Limit *</Label>
                        <Input
                          id="rateLimit"
                          type="number"
                          placeholder="1000"
                          value={newKey.rateLimit}
                          onChange={(e) => setNewKey({ ...newKey, rateLimit: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rateLimitUnit">Per</Label>
                        <Select value={newKey.rateLimitUnit} onValueChange={(value) => setNewKey({ ...newKey, rateLimitUnit: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minute">Minute</SelectItem>
                            <SelectItem value="hour">Hour</SelectItem>
                            <SelectItem value="day">Day</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
                      <Input
                        id="expiresAt"
                        type="date"
                        value={newKey.expiresAt}
                        onChange={(e) => setNewKey({ ...newKey, expiresAt: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Permissions / Scopes *</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="scope-read"
                            checked={newKey.scopes.includes('read')}
                            onCheckedChange={() => toggleScopeSelection('read')}
                          />
                          <label htmlFor="scope-read" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Read - View data and resources
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="scope-write"
                            checked={newKey.scopes.includes('write')}
                            onCheckedChange={() => toggleScopeSelection('write')}
                          />
                          <label htmlFor="scope-write" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Write - Create and modify resources
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="scope-admin"
                            checked={newKey.scopes.includes('admin')}
                            onCheckedChange={() => toggleScopeSelection('admin')}
                          />
                          <label htmlFor="scope-admin" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Admin - Full administrative access
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateKey}
                      disabled={!newKey.name || newKey.scopes.length === 0}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Generate Key
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {selectedKeys.length > 0 && (
              <div className="mt-4 flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <span className="text-sm font-medium text-purple-900">
                  {selectedKeys.length} key{selectedKeys.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedKeys([])}
                    className="border-purple-300"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete Selected
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Keys Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>
                  {filteredKeys.length} key{filteredKeys.length !== 1 ? 's' : ''} found
                </CardDescription>
              </div>
              {advancedMode && (
                <Button variant="outline" size="sm" onClick={handleExportKeys}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedKeys.length === filteredKeys.length && filteredKeys.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 hover:text-purple-600"
                      >
                        Name
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>API Key</TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('created')}
                        className="flex items-center gap-1 hover:text-purple-600"
                      >
                        Created
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('lastUsed')}
                        className="flex items-center gap-1 hover:text-purple-600"
                      >
                        Last Used
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('usageCount')}
                        className="flex items-center gap-1 hover:text-purple-600"
                      >
                        Usage
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>Rate Limit</TableHead>
                    {advancedMode && <TableHead>User</TableHead>}
                    <TableHead>Scopes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKeys.map((key) => (
                    <TableRow key={key.id} className="hover:bg-purple-50/30">
                      <TableCell>
                        <Checkbox
                          checked={selectedKeys.includes(key.id)}
                          onCheckedChange={(checked) => {
                            setSelectedKeys(
                              checked
                                ? [...selectedKeys, key.id]
                                : selectedKeys.filter(id => id !== key.id)
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                            {visibleKeys[key.id] ? key.key : key.maskedKey}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleKeyVisibility(key.id)}
                            className="h-6 w-6 p-0"
                          >
                            {visibleKeys[key.id] ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(key.created)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(key.lastUsed)}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => setSelectedKeyStats(key)}
                          className="text-purple-600 hover:text-purple-800 font-medium"
                        >
                          {key.usageCount.toLocaleString()}
                        </button>
                      </TableCell>
                      <TableCell className="text-sm">
                        {key.rateLimit.toLocaleString()}/{key.rateLimitUnit}
                      </TableCell>
                      {advancedMode && (
                        <TableCell className="text-sm text-gray-600">{key.user}</TableCell>
                      )}
                      <TableCell>
                        <div className="flex gap-1">
                          {getScopeBadges(key.scopes)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(key.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyKey(key)}
                            className="h-8 w-8 p-0"
                          >
                            {copiedKey === key.id ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRotateKey(key.id)}
                            className="h-8 w-8 p-0"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setKeyToDelete(key.id);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="h-8 w-8 p-0 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredKeys.length === 0 && (
                <div className="text-center py-12">
                  <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No API keys found</h3>
                  <p className="text-sm text-gray-600 mb-4">
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  Top API Endpoints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usageStats.topEndpoints.map((endpoint, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                          {endpoint.endpoint}
                        </code>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">{endpoint.avgTime}</span>
                          <span className="text-sm font-medium text-gray-900">
                            {endpoint.calls.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Usage Statistics - {selectedKeyStats?.name}</DialogTitle>
              <DialogDescription>
                Detailed usage metrics for this API key
              </DialogDescription>
            </DialogHeader>
            
            {selectedKeyStats && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-2xl font-bold text-purple-900">
                      {selectedKeyStats.usageCount.toLocaleString()}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">Total Requests</p>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <p className="text-2xl font-bold text-indigo-900">
                      {selectedKeyStats.rateLimit}
                    </p>
                    <p className="text-xs text-indigo-600 mt-1">Rate Limit / {selectedKeyStats.rateLimitUnit}</p>
                  </div>
                  <div className="text-center p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                    <p className="text-2xl font-bold text-cyan-900">
                      {Math.floor(Math.random() * 100)}%
                    </p>
                    <p className="text-xs text-cyan-600 mt-1">Success Rate</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-gray-900">Request History (7 Days)</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={usageStats.last30Days.slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
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
                  <h4 className="font-semibold text-gray-900">Key Information</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">User:</span>
                      <span className="ml-2 font-medium">{selectedKeyStats.user}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Application:</span>
                      <span className="ml-2 font-medium">{selectedKeyStats.application}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <span className="ml-2 font-medium">
                        {new Date(selectedKeyStats.created).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Expires:</span>
                      <span className="ml-2 font-medium">
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                Delete API Key
              </DialogTitle>
              <DialogDescription>
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
