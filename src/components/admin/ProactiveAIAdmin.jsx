import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Target, TrendingUp, Lightbulb, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function ProactiveAIAdmin() {
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ['proactiveAIConfig'],
    queryFn: async () => {
      const configs = await base44.asServiceRole.entities.ProactiveAIConfig.list();
      return configs[0] || null;
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['proactiveAIStats'],
    queryFn: async () => {
      const assistance = await base44.asServiceRole.entities.ProactiveAssistance.list();
      return {
        total: assistance.length,
        accepted: assistance.filter(a => a.user_action === 'accepted').length,
        dismissed: assistance.filter(a => a.user_action === 'dismissed').length,
        acceptanceRate: assistance.length > 0
          ? Math.round((assistance.filter(a => a.user_action === 'accepted').length / assistance.length) * 100)
          : 0
      };
    }
  });

  const updateConfig = useMutation({
    mutationFn: async (data) => {
      if (config) {
        return base44.asServiceRole.entities.ProactiveAIConfig.update(config.id, data);
      } else {
        return base44.asServiceRole.entities.ProactiveAIConfig.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proactiveAIConfig'] });
      toast.success('Configuration updated');
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Proactive AI Assistance</h2>
        <p className="text-gray-600">Contextual tips and suggestions throughout the application</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="p-6">
            <Lightbulb className="w-8 h-8 text-blue-600 mb-2" />
            <div className="text-3xl font-bold text-blue-900">{stats?.total || 0}</div>
            <div className="text-sm text-blue-700">Total Tips Shown</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <Target className="w-8 h-8 text-green-600 mb-2" />
            <div className="text-3xl font-bold text-green-900">{stats?.accepted || 0}</div>
            <div className="text-sm text-green-700">Accepted</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
          <CardContent className="p-6">
            <Zap className="w-8 h-8 text-red-600 mb-2" />
            <div className="text-3xl font-bold text-red-900">{stats?.dismissed || 0}</div>
            <div className="text-sm text-red-700">Dismissed</div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
            <div className="text-3xl font-bold text-purple-900">{stats?.acceptanceRate || 0}%</div>
            <div className="text-sm text-purple-700">Acceptance Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Configuration
          </CardTitle>
          <CardDescription>Control proactive AI behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
            <div>
              <div className="font-semibold text-gray-900">Enable Proactive AI</div>
              <p className="text-sm text-gray-600">Show contextual tips throughout the app</p>
            </div>
            <Switch
              checked={config?.enabled ?? true}
              onCheckedChange={(checked) => {
                updateConfig.mutate({ enabled: checked });
              }}
            />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Assistance Frequency</label>
            <Select
              value={config?.frequency || 'medium'}
              onValueChange={(value) => {
                updateConfig.mutate({ frequency: value });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (45s delay)</SelectItem>
                <SelectItem value="medium">Medium (20s delay)</SelectItem>
                <SelectItem value="high">High (10s delay)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">How quickly AI offers assistance</p>
          </div>

          {/* Auto Detect Roadblocks */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-semibold text-gray-900">Auto-Detect Roadblocks</div>
              <p className="text-sm text-gray-600">AI detects when users are stuck and offers help</p>
            </div>
            <Switch
              checked={config?.auto_detect_roadblocks ?? true}
              onCheckedChange={(checked) => {
                updateConfig.mutate({ auto_detect_roadblocks: checked });
              }}
            />
          </div>

          {/* Feature Suggestions */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-semibold text-gray-900">Suggest Features</div>
              <p className="text-sm text-gray-600">Recommend relevant features based on context</p>
            </div>
            <Switch
              checked={config?.suggest_features ?? true}
              onCheckedChange={(checked) => {
                updateConfig.mutate({ suggest_features: checked });
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4 text-sm text-blue-800">
          <p className="font-semibold mb-2">ℹ️ How Proactive AI Works</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>Monitors user activity and time spent on pages</li>
            <li>Analyzes project context and recent actions</li>
            <li>Generates contextual tips using QuantumAI</li>
            <li>Appears at optimal moments based on frequency setting</li>
            <li>Learns from user acceptance/dismissal patterns</li>
            <li>Helps users discover features and overcome obstacles</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}