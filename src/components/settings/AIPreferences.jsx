import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { toast } from 'sonner';

export default function AIPreferences() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: prefs = [] } = useQuery({
    queryKey: ['userPrefs'],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.UserPreference.filter({ user_id: user.email });
    },
    enabled: !!user
  });

  const preference = prefs[0];

  const updatePref = useMutation({
    mutationFn: async (data) => {
      if (preference) {
        return base44.entities.UserPreference.update(preference.id, data);
      } else {
        return base44.entities.UserPreference.create({
          user_id: user.email,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPrefs'] });
      toast.success('Preferences updated');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          AI Preferences
        </CardTitle>
        <CardDescription>Control how AI assists you</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900">Use QuantumAI</h4>
              <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0">
                🔮 Enhanced
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              Analyze requests across multiple parallel timelines for optimal results
            </p>
          </div>
          <Switch
            checked={preference?.use_quantum_ai ?? true}
            onCheckedChange={(checked) => {
              updatePref.mutate({ use_quantum_ai: checked });
            }}
          />
        </div>

        <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
          <p className="font-semibold mb-1">ℹ️ How it works:</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li><strong>Enabled:</strong> All AI features use quantum enhancement (recommended)</li>
            <li><strong>Disabled:</strong> Uses standard AI for faster but simpler responses</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}