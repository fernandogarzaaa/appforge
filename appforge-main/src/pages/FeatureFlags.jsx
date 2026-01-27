import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Flag, Plus, Edit2, Trash2, Loader2, AlertCircle, Users, Percent } from 'lucide-react';

export default function FeatureFlags() {
  const [user, setUser] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingFlag, setEditingFlag] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    if (userData?.role !== 'admin') {
      setUnauthorized(true);
    } else {
      setUser(userData);
    }
  };

  const { data: flags, isLoading } = useQuery({
    queryKey: ['featureFlags'],
    queryFn: () => base44.entities.FeatureFlag.list('-created_date'),
    enabled: !!user
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FeatureFlag.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featureFlags'] });
    }
  });

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h1>
            <p className="text-slate-600">Only administrators can manage feature flags.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Feature Flags</h1>
            <p className="text-slate-600 mt-2">Control feature rollouts and A/B testing</p>
          </div>
          <Button
            onClick={() => {
              setEditingFlag(null);
              setShowForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Flag
          </Button>
        </div>

        {showForm && (
          <FlagForm
            flag={editingFlag}
            onClose={() => {
              setShowForm(false);
              setEditingFlag(null);
            }}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['featureFlags'] });
              setShowForm(false);
              setEditingFlag(null);
            }}
          />
        )}

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {flags?.map((flag) => (
              <Card key={flag.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Flag className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-slate-900">{flag.display_name}</h3>
                        <Badge className={flag.enabled ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
                          {flag.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{flag.description}</p>
                      <p className="text-xs font-mono text-slate-500 mb-4">Flag: {flag.name}</p>

                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4 text-purple-600" />
                          <span className="text-slate-600">Rollout:</span>
                          <span className="font-semibold text-slate-900">{flag.rollout_percentage}%</span>
                        </div>
                        {flag.target_user_emails?.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span className="text-slate-600">Target Users:</span>
                            <span className="font-semibold text-slate-900">{flag.target_user_emails.length}</span>
                          </div>
                        )}
                        {flag.target_roles?.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-100 text-blue-800">
                              Roles: {flag.target_roles.join(', ')}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingFlag(flag);
                          setShowForm(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => deleteMutation.mutate(flag.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {flags?.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Flag className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">No feature flags yet. Create one to get started.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FlagForm({ flag, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: flag?.name || '',
    display_name: flag?.display_name || '',
    description: flag?.description || '',
    enabled: flag?.enabled || false,
    rollout_percentage: flag?.rollout_percentage || 0,
    target_user_emails: flag?.target_user_emails?.join(', ') || '',
    target_roles: flag?.target_roles?.join(', ') || '',
    environment: flag?.environment || 'all'
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        target_user_emails: data.target_user_emails
          ? data.target_user_emails.split(',').map(e => e.trim()).filter(e => e)
          : [],
        target_roles: data.target_roles
          ? data.target_roles.split(',').map(r => r.trim()).filter(r => r)
          : []
      };

      if (flag) {
        return base44.entities.FeatureFlag.update(flag.id, payload);
      } else {
        return base44.entities.FeatureFlag.create(payload);
      }
    },
    onSuccess
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{flag ? 'Edit' : 'Create'} Feature Flag</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Flag Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="new_dashboard"
                required
                disabled={!!flag}
              />
              <p className="text-xs text-slate-500 mt-1">Unique identifier (lowercase, underscores)</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Display Name *</label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="New Dashboard"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What does this feature flag control?"
              rows={2}
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
            />
            <label className="text-sm font-semibold text-slate-700">
              Enabled {formData.enabled ? '(Active)' : '(Inactive)'}
            </label>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Rollout Percentage: {formData.rollout_percentage}%
            </label>
            <Slider
              value={[formData.rollout_percentage]}
              onValueChange={([value]) => setFormData({ ...formData, rollout_percentage: value })}
              max={100}
              step={5}
              className="mt-2"
            />
            <p className="text-xs text-slate-500 mt-1">Percentage of users to gradually roll out to</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Target User Emails</label>
            <Input
              value={formData.target_user_emails}
              onChange={(e) => setFormData({ ...formData, target_user_emails: e.target.value })}
              placeholder="user1@example.com, user2@example.com"
            />
            <p className="text-xs text-slate-500 mt-1">Comma-separated emails for beta testers</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Target Roles</label>
            <Input
              value={formData.target_roles}
              onChange={(e) => setFormData({ ...formData, target_roles: e.target.value })}
              placeholder="admin, beta_tester"
            />
            <p className="text-xs text-slate-500 mt-1">Comma-separated roles</p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending} className="bg-blue-600 hover:bg-blue-700">
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                flag ? 'Update Flag' : 'Create Flag'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}