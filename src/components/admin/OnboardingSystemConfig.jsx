import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Sparkles, Users, Target, Award, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function OnboardingSystemConfig() {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['onboardingConfig'],
    queryFn: async () => {
      const configs = await base44.asServiceRole.entities.OnboardingConfig.list();
      return configs[0] || null;
    }
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['onboardingStats'],
    queryFn: async () => {
      const allProgress = await base44.asServiceRole.entities.OnboardingProgress.list();
      return {
        total: allProgress.length,
        completed: allProgress.filter(p => p.completed).length,
        active: allProgress.filter(p => !p.completed).length,
        completionRate: allProgress.length > 0
          ? Math.round((allProgress.filter(p => p.completed).length / allProgress.length) * 100)
          : 0
      };
    }
  });

  const updateConfig = useMutation({
    mutationFn: async (data) => {
      if (config) {
        return base44.asServiceRole.entities.OnboardingConfig.update(config.id, data);
      } else {
        return base44.asServiceRole.entities.OnboardingConfig.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboardingConfig'] });
      toast.success('Onboarding configuration updated');
    }
  });

  const resetOnboarding = useMutation({
    mutationFn: async (userId) => {
      const progress = await base44.asServiceRole.entities.OnboardingProgress.filter({
        user_id: userId,
        completed: false
      });

      if (progress.length > 0) {
        await base44.asServiceRole.entities.OnboardingProgress.delete(progress[0].id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboardingStats'] });
      toast.success('User onboarding reset');
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Onboarding System</h2>
        <p className="text-gray-600">Configure personalized onboarding for new users</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="p-6">
            <Users className="w-8 h-8 text-blue-600 mb-2" />
            <div className="text-3xl font-bold text-blue-900">{stats?.total || 0}</div>
            <div className="text-sm text-blue-700">Total Users</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <Target className="w-8 h-8 text-green-600 mb-2" />
            <div className="text-3xl font-bold text-green-900">{stats?.active || 0}</div>
            <div className="text-sm text-green-700">Active</div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <Award className="w-8 h-8 text-purple-600 mb-2" />
            <div className="text-3xl font-bold text-purple-900">{stats?.completed || 0}</div>
            <div className="text-sm text-purple-700">Completed</div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
          <CardContent className="p-6">
            <Sparkles className="w-8 h-8 text-orange-600 mb-2" />
            <div className="text-3xl font-bold text-orange-900">{stats?.completionRate || 0}%</div>
            <div className="text-sm text-orange-700">Completion Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            System Configuration
          </CardTitle>
          <CardDescription>Control onboarding behavior and features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Onboarding */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
            <div>
              <div className="font-semibold text-gray-900">Enable AI Onboarding</div>
              <p className="text-sm text-gray-600">Automatically guide new users through the platform</p>
            </div>
            <Switch
              checked={config?.onboarding_enabled ?? true}
              onCheckedChange={(checked) => {
                updateConfig.mutate({ onboarding_enabled: checked });
              }}
            />
          </div>

          {/* Personalization */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-semibold text-gray-900">Role-Based Personalization</div>
              <p className="text-sm text-gray-600">Customize onboarding based on user role and context</p>
            </div>
            <Switch
              checked={config?.personalization_enabled ?? true}
              onCheckedChange={(checked) => {
                updateConfig.mutate({ personalization_enabled: checked });
              }}
            />
          </div>

          {/* Proactive Assistance */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-semibold text-gray-900">Proactive AI Assistance</div>
              <p className="text-sm text-gray-600">AI offers help when users need it during onboarding</p>
            </div>
            <Switch
              checked={config?.proactive_assistance ?? true}
              onCheckedChange={(checked) => {
                updateConfig.mutate({ proactive_assistance: checked });
              }}
            />
          </div>

          {/* Skip Allowed */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-semibold text-gray-900">Allow Skip</div>
              <p className="text-sm text-gray-600">Let users skip onboarding if they prefer</p>
            </div>
            <Switch
              checked={config?.skip_allowed ?? true}
              onCheckedChange={(checked) => {
                updateConfig.mutate({ skip_allowed: checked });
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4 text-sm text-blue-800">
          <p className="font-semibold mb-2">ℹ️ How AI Onboarding Works</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>AI analyzes user role and initial project idea</li>
            <li>Generates personalized 5-step onboarding journey</li>
            <li>Provides context-specific tutorials and tips</li>
            <li>Offers proactive assistance when users need help</li>
            <li>Tracks progress and adapts guidance accordingly</li>
            <li>Guides users to complete their first project quickly</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}