import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Settings, Activity, Lock } from 'lucide-react';

export default function CoachingSystemAdmin() {
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

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
        loadLogs();
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
          Coaching System Admin
        </h1>
        <Badge className="bg-green-600">Active</Badge>
      </div>

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

      {/* Recent Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Audit Logs (Last 20)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.slice(0, 20).map((log) => (
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}