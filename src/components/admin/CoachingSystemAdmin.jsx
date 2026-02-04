import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Settings, Activity, Lock, Wallet, TrendingUp, Users, Zap, RefreshCw, Copy, Download } from 'lucide-react';
import MarketingBotPanel from './MarketingBotPanel';

export default function CoachingSystemAdmin() {
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState(null);
  const [solanaConfig, setSolanaConfig] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [logFilter, setLogFilter] = useState('');
  const [copied, setCopied] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    verifyAdmin();
  }, []);

  const verifyAdmin = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      setIsAdmin(userData?.role === 'admin');
      if (userData?.role === 'admin') {
        loadConfig();
        loadSolanaConfig();
        loadMetrics();
        loadLogs();
        loadTransactions();
      }
    } catch (error) {
      console.error('Admin verification error:', error);
    }
  };

  const loadConfig = async () => {
    try {
      const configs = await base44.entities.CoachingSystemConfig.list();
      if (configs.length > 0) {
        setConfig(configs[0]);
      } else {
        setConfig({
          accuracy_threshold: 0.85,
          satisfaction_threshold: 0.8,
          min_feedback_count: 3,
          recommendations_enabled: true,
          workflow_auto_generation_enabled: true,
          rate_limit_per_hour: 10,
          audit_logging_enabled: true,
          system_status: 'active'
        });
      }
    } catch (error) {
      console.error('Config load error:', error);
    }
  };

  const loadSolanaConfig = async () => {
    try {
      const configs = await base44.entities.SolanaPaymentConfig.list();
      if (configs.length > 0) {
        setSolanaConfig(configs[0]);
      } else {
        setSolanaConfig({
          wallet_address: '',
          network: 'mainnet-beta',
          payment_enabled: false,
          price_per_analysis: 0.1,
          price_per_workflow: 0.05,
          total_received_sol: 0,
          total_transactions: 0
        });
      }
    } catch (error) {
      console.error('Solana config load error:', error);
    }
  };

  const loadMetrics = async () => {
    try {
      const metricsData = await base44.entities.CoachingSystemMetrics.list(
        '-metric_date',
        1
      );
      if (metricsData.length > 0) {
        setMetrics(metricsData[0]);
      }
    } catch (error) {
      console.error('Metrics load error:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const txns = await base44.entities.SolanaTransaction.list(
        '-updated_date',
        20
      );
      setTransactions(txns || []);
    } catch (error) {
      console.error('Transactions load error:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const logEntries = await base44.entities.CoachingAuditLog.list(
        '-updated_date',
        50
      );
      setLogs(logEntries || []);
    } catch (error) {
      console.error('Logs load error:', error);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const configs = await base44.entities.CoachingSystemConfig.list();
      if (configs.length > 0) {
        await base44.entities.CoachingSystemConfig.update(configs[0].id, config);
      } else {
        await base44.entities.CoachingSystemConfig.create(config);
      }
      alert('Configuration saved!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const saveSolanaConfig = async () => {
    setIsSaving(true);
    try {
      const configs = await base44.entities.SolanaPaymentConfig.list();
      if (configs.length > 0) {
        await base44.entities.SolanaPaymentConfig.update(configs[0].id, solanaConfig);
      } else {
        await base44.entities.SolanaPaymentConfig.create(solanaConfig);
      }
      alert('Solana configuration saved!');
      loadSolanaConfig();
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save Solana configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const refreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([loadConfig(), loadSolanaConfig(), loadMetrics(), loadLogs(), loadTransactions()]);
    setIsRefreshing(false);
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const exportLogs = () => {
    const csv = 'Action Type,User,Agent,Status,Timestamp,Error\n' +
      logs.map(l => `"${l.action_type}","${l.user_id}","${l.agent_id || ''}","${l.success ? 'Success' : 'Failed'}","${l.timestamp}","${l.error_message || ''}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredLogs = logs.filter(log => 
    log.action_type.includes(logFilter.toLowerCase()) || 
    (log.user_id && log.user_id.includes(logFilter)) ||
    (log.agent_id && log.agent_id.includes(logFilter))
  );

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <Lock className="w-8 h-8 mx-auto mb-2 text-red-600" />
        <p className="text-red-600">Admin access required</p>
      </div>
    );
  }

  // Chart data
  const actionCounts = {};
  logs.forEach(log => {
    actionCounts[log.action_type] = (actionCounts[log.action_type] || 0) + 1;
  });
  const chartData = Object.entries(actionCounts).map(([type, count]) => ({
    name: type.replace('_', ' '),
    count
  }));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Admin Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            disabled={isRefreshing}
            className="gap-1"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Badge className={config?.system_status === 'active' ? 'bg-green-600' : config?.system_status === 'maintenance' ? 'bg-yellow-600' : 'bg-red-600'}>
            {config?.system_status || 'Active'}
          </Badge>
        </div>
      </div>

      {/* System Health Metrics */}
      {metrics && (
        <div className="grid grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Active Users</p>
                  <p className="text-2xl font-bold">{metrics.active_users}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Active Agents</p>
                  <p className="text-2xl font-bold">{metrics.active_agents}</p>
                </div>
                <Zap className="w-8 h-8 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Uptime</p>
                  <p className="text-2xl font-bold">{(metrics.system_uptime_percentage || 100).toFixed(1)}%</p>
                </div>
                <Activity className="w-8 h-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Avg Improvement</p>
                  <p className="text-2xl font-bold">+{(metrics.avg_coaching_improvement || 0).toFixed(0)}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">System Config</TabsTrigger>
          <TabsTrigger value="payments">
            <Wallet className="w-4 h-4 mr-2" />
            Solana Config
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <TrendingUp className="w-4 h-4 mr-2" />
            Transactions ({transactions.length})
          </TabsTrigger>
          <TabsTrigger value="marketing">
            <Zap className="w-4 h-4 mr-2" />
            Marketing Bot
          </TabsTrigger>
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">

          {/* Configuration */}
          {config && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">System Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Accuracy Threshold */}
            <div>
              <label className="text-sm font-semibold">
                Accuracy Threshold: {(config.accuracy_threshold * 100).toFixed(0)}%
              </label>
              <Slider
                value={[config.accuracy_threshold]}
                onValueChange={(val) =>
                  setConfig({ ...config, accuracy_threshold: val[0] })
                }
                min={0}
                max={1}
                step={0.05}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Recommendations trigger when accuracy falls below this threshold
              </p>
            </div>

            {/* Satisfaction Threshold */}
            <div>
              <label className="text-sm font-semibold">
                Satisfaction Threshold: {(config.satisfaction_threshold * 100).toFixed(0)}%
              </label>
              <Slider
                value={[config.satisfaction_threshold]}
                onValueChange={(val) =>
                  setConfig({ ...config, satisfaction_threshold: val[0] })
                }
                min={0}
                max={1}
                step={0.05}
                className="mt-2"
              />
            </div>

            {/* Rate Limit */}
            <div>
              <label className="text-sm font-semibold">
                Rate Limit (analyses per hour): {config.rate_limit_per_hour}
              </label>
              <Slider
                value={[config.rate_limit_per_hour]}
                onValueChange={(val) =>
                  setConfig({ ...config, rate_limit_per_hour: val[0] })
                }
                min={1}
                max={50}
                step={1}
                className="mt-2"
              />
            </div>

            {/* Toggles */}
            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Enable Recommendations</span>
                <Switch
                  checked={config.recommendations_enabled}
                  onCheckedChange={(val) =>
                    setConfig({ ...config, recommendations_enabled: val })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Enable Auto Workflows</span>
                <Switch
                  checked={config.workflow_auto_generation_enabled}
                  onCheckedChange={(val) =>
                    setConfig({ ...config, workflow_auto_generation_enabled: val })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Enable Audit Logging</span>
                <Switch
                  checked={config.audit_logging_enabled}
                  onCheckedChange={(val) =>
                    setConfig({ ...config, audit_logging_enabled: val })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">System Status</span>
                <select
                  value={config.system_status}
                  onChange={(e) =>
                    setConfig({ ...config, system_status: e.target.value })
                  }
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>

            <Button
              onClick={saveConfig}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </CardContent>
        </Card>
      )}

          {/* Activity Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Action Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="payments">
          {solanaConfig && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Solana Payment Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Wallet Address */}
                <div>
                 <label className="text-sm font-semibold">Wallet Address</label>
                 <div className="flex gap-2 mt-2">
                   <Input
                     value={solanaConfig.wallet_address}
                     onChange={(e) =>
                       setSolanaConfig({ ...solanaConfig, wallet_address: e.target.value })
                     }
                     placeholder="Enter your Solana wallet address"
                   />
                   {solanaConfig.wallet_address && (
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => copyToClipboard(solanaConfig.wallet_address, 'wallet')}
                       className="gap-1"
                     >
                       <Copy className="w-4 h-4" />
                       {copied === 'wallet' ? 'Copied!' : 'Copy'}
                     </Button>
                   )}
                 </div>
                 <p className="text-xs text-gray-500 mt-1">
                   Public key where payments will be received
                 </p>
                </div>

                {/* Network Selection */}
                <div>
                  <label className="text-sm font-semibold">Network</label>
                  <select
                    value={solanaConfig.network}
                    onChange={(e) =>
                      setSolanaConfig({ ...solanaConfig, network: e.target.value })
                    }
                    className="w-full text-sm border rounded px-3 py-2 mt-2"
                  >
                    <option value="mainnet-beta">Mainnet Beta</option>
                    <option value="devnet">Devnet (Testing)</option>
                    <option value="testnet">Testnet</option>
                  </select>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold">
                      Price per Analysis (SOL): {solanaConfig.price_per_analysis}
                    </label>
                    <Slider
                      value={[solanaConfig.price_per_analysis]}
                      onValueChange={(val) =>
                        setSolanaConfig({ ...solanaConfig, price_per_analysis: val[0] })
                      }
                      min={0.01}
                      max={1}
                      step={0.01}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">
                      Price per Workflow (SOL): {solanaConfig.price_per_workflow}
                    </label>
                    <Slider
                      value={[solanaConfig.price_per_workflow]}
                      onValueChange={(val) =>
                        setSolanaConfig({ ...solanaConfig, price_per_workflow: val[0] })
                      }
                      min={0.01}
                      max={1}
                      step={0.01}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Enable Payments */}
                <div className="pt-4 border-t flex items-center justify-between">
                  <span className="text-sm font-semibold">Enable Solana Payments</span>
                  <Switch
                    checked={solanaConfig.payment_enabled}
                    onCheckedChange={(val) =>
                      setSolanaConfig({ ...solanaConfig, payment_enabled: val })
                    }
                  />
                </div>

                {/* Stats */}
                {solanaConfig.total_transactions > 0 && (
                  <div className="p-3 bg-blue-50 rounded border border-blue-200 space-y-1">
                    <p className="text-sm font-semibold">Payment Stats</p>
                    <p className="text-xs">Total Transactions: {solanaConfig.total_transactions}</p>
                    <p className="text-xs">Total Received: {solanaConfig.total_received_sol} SOL</p>
                    {solanaConfig.last_transaction_date && (
                      <p className="text-xs text-gray-600">
                        Last Transaction: {new Date(solanaConfig.last_transaction_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                <Button
                  onClick={saveSolanaConfig}
                  disabled={isSaving || !solanaConfig.wallet_address}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  {isSaving ? 'Saving...' : 'Save Solana Config'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Solana Transactions</CardTitle>
                  <p className="text-xs text-gray-500 mt-1">Real-time payment tracking</p>
                </div>
                {transactions.length > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {transactions.reduce((sum, t) => sum + (t.amount_sol || 0), 0).toFixed(2)} SOL
                    </p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-8">No transactions yet</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 border rounded bg-gradient-to-r from-purple-50 to-pink-50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge className={tx.status === 'confirmed' ? 'bg-green-600' : 'bg-yellow-600'}>
                            {tx.status}
                          </Badge>
                          <span className="text-sm font-semibold">{tx.amount_sol} SOL</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(tx.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">User: {tx.user_id}</p>
                      <p className="text-xs text-gray-600">Type: {tx.payment_type}</p>
                      <p className="text-xs text-gray-500 mt-1 break-all font-mono">
                        {tx.transaction_signature}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing">
          <MarketingBotPanel />
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Recent Audit Logs ({filteredLogs.length})</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportLogs}
                  className="gap-1"
                  disabled={logs.length === 0}
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
              </div>
              <Input
                placeholder="Filter by action, user, or agent..."
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="mt-4"
              />
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredLogs.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center">No logs match filter</p>
                ) : (
                filteredLogs.slice(0, 20).map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 border rounded text-xs ${
                      log.success ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="font-semibold">{log.action_type}</span>
                      <span className="text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-600">User: {log.user_id}</p>
                    {log.agent_id && <p className="text-gray-600">Agent: {log.agent_id}</p>}
                    {log.error_message && (
                      <p className="text-red-600">Error: {log.error_message}</p>
                    )}
                  </div>
                ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}