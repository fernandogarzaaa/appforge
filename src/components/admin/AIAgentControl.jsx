import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, Play, Pause, Settings, Mail, Clock, CheckCircle2, 
  AlertTriangle, Zap, Activity, Shield, TrendingUp, RefreshCw, Github
} from 'lucide-react';
import { toast } from 'sonner';
import GitHubIntegrationSetup from './GitHubIntegrationSetup';

export default function AIAgentControl() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch AI agent config
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['aiAgentConfig'],
    queryFn: () => base44.entities.AIAgentConfig.list(),
  });

  const config = configs[0];

  // Fetch recent reports
  const { data: reports = [] } = useQuery({
    queryKey: ['healthReports'],
    queryFn: () => base44.entities.ProjectHealthReport.list('-scan_timestamp', 10),
  });

  // Create/Update config mutation
  const configMutation = useMutation({
    mutationFn: async (data) => {
      if (config) {
        return base44.entities.AIAgentConfig.update(config.id, data);
      } else {
        return base44.entities.AIAgentConfig.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiAgentConfig'] });
      toast.success('AI Agent settings updated');
    },
  });

  // Test run mutation
  const testRunMutation = useMutation({
    mutationFn: () => base44.functions.invoke('projectHealthMonitor', {}),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['healthReports'] });
      toast.success(`Scan complete! Monitored ${result.data.scanned} projects`);
    },
  });

  if (user?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">Admin access required</p>
        </CardContent>
      </Card>
    );
  }

  const totalIssuesFixed = reports.reduce((sum, r) => 
    sum + (r.issues_found?.filter(i => i.auto_fixed).length || 0), 0
  );

  const avgHealthScore = reports.length > 0
    ? Math.round(reports.reduce((sum, r) => sum + (r.health_score || 0), 0) / reports.length)
    : 0;

  return (
    <Tabs defaultValue="dashboard" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3 max-w-md">
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="config">Configuration</TabsTrigger>
        <TabsTrigger value="github">GitHub</TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard" className="space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-purple-500 to-indigo-600">
        <CardContent className="p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">AI Agent Control Center</h2>
                <p className="text-purple-100 text-sm">
                  Autonomous 24/7 project monitoring & optimization
                </p>
              </div>
            </div>
            <Badge className={`${config?.autonomous_fixes_enabled ? 'bg-green-500' : 'bg-yellow-500'} text-white border-0 text-sm px-3 py-1`}>
              {config?.autonomous_fixes_enabled ? '🤖 Autonomous' : '👀 Monitoring'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalIssuesFixed}</div>
                <div className="text-xs text-gray-600">Issues Fixed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{avgHealthScore}/100</div>
                <div className="text-xs text-gray-600">Avg Health</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{reports.length}</div>
                <div className="text-xs text-gray-600">Recent Scans</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">5min</div>
                <div className="text-xs text-gray-600">Scan Interval</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={`${
                        report.health_score >= 80 ? 'bg-green-100 text-green-700' :
                        report.health_score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      } border-0`}>
                        {report.health_score}/100
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(report.scan_timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {report.actions_taken?.length > 0 && (
                        <div className="text-sm text-green-700">
                          ✅ {report.actions_taken.filter(a => a.success).length} actions taken
                        </div>
                      )}
                      {report.issues_found?.length > 0 && (
                        <div className="text-sm text-gray-600">
                          📊 {report.issues_found.length} issues found
                          {report.issues_found.filter(i => i.auto_fixed).length > 0 && (
                            <span className="text-green-600 ml-2">
                              ({report.issues_found.filter(i => i.auto_fixed).length} fixed)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {report.email_sent && (
                    <Badge variant="outline" className="text-xs">
                      <Mail className="w-3 h-3 mr-1" />
                      Sent
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {reports.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No reports yet. Agent will start monitoring automatically.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="config">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Agent Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Autonomous Mode */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
              <div>
                <div className="font-semibold text-gray-900">Autonomous Fixes</div>
                <p className="text-sm text-gray-600">Allow AI to automatically fix detected issues</p>
              </div>
              <Switch
                checked={config?.autonomous_fixes_enabled ?? true}
                onCheckedChange={(checked) => {
                  configMutation.mutate({ autonomous_fixes_enabled: checked });
                }}
              />
            </div>

            {/* Email Configuration */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail className="w-4 h-4" />
                Notification Email
              </label>
              <Input
                type="email"
                placeholder="admin@example.com"
                value={config?.notification_email || ''}
                onChange={(e) => {
                  configMutation.mutate({ notification_email: e.target.value });
                }}
              />
            </div>

            {/* Auto-fix Categories */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Auto-Fix Categories</label>
              <div className="grid grid-cols-2 gap-3">
                {['validation', 'indexing', 'security', 'performance', 'best_practices', 'code_quality'].map((cat) => (
                  <div key={cat} className="flex items-center gap-2">
                    <Switch
                      checked={config?.auto_fix_categories?.includes(cat) ?? false}
                      onCheckedChange={(checked) => {
                        const current = config?.auto_fix_categories || [];
                        const updated = checked
                          ? [...current, cat]
                          : current.filter((c) => c !== cat);
                        configMutation.mutate({ auto_fix_categories: updated });
                      }}
                    />
                    <span className="text-sm text-gray-700 capitalize">{cat.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Approval */}
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div>
                <div className="font-semibold text-gray-900">Require Approval for Critical</div>
                <p className="text-sm text-gray-600">Manual approval needed for critical changes</p>
              </div>
              <Switch
                checked={config?.require_approval_for_critical ?? false}
                onCheckedChange={(checked) => {
                  configMutation.mutate({ require_approval_for_critical: checked });
                }}
              />
            </div>

            {/* Test Run */}
            <Button
              onClick={() => testRunMutation.mutate()}
              disabled={testRunMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              {testRunMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Running Scan...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Manual Scan
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="github">
        <GitHubIntegrationSetup />
      </TabsContent>
    </Tabs>
  );
}