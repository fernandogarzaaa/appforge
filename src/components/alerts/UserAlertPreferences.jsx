import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function UserAlertPreferences() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
    loadPreferences(userData.email);
  };

  const { data: preferences } = useQuery({
    queryKey: ['alert-preferences', user?.email],
    queryFn: () => base44.entities.AlertPreference.filter({ user_email: user?.email }),
    enabled: !!user?.email
  });

  const loadPreferences = async (email) => {
    const prefs = await base44.entities.AlertPreference.filter({ user_email: email });
    if (prefs.length > 0) {
      setFormData(prefs[0]);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (formData.id) {
        return base44.entities.AlertPreference.update(formData.id, data);
      } else {
        return base44.entities.AlertPreference.create({
          user_email: user.email,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-preferences'] });
      toast.success('Preferences saved');
    }
  });

  if (!user) return null;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="channels" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="channels">Notification Channels</TabsTrigger>
          <TabsTrigger value="quiet-hours">Quiet Hours</TabsTrigger>
          <TabsTrigger value="routing">Alert Routing</TabsTrigger>
        </TabsList>

        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-base mb-3 block">Preferred Channels</Label>
                <div className="space-y-2">
                  {['email', 'webhook', 'in_app', 'sms', 'slack'].map(channel => (
                    <div key={channel} className="flex items-center gap-2">
                      <Checkbox
                        checked={(formData.preferred_channels || []).includes(channel)}
                        onCheckedChange={(checked) => {
                          const channels = formData.preferred_channels || [];
                          setFormData({
                            ...formData,
                            preferred_channels: checked
                              ? [...channels, channel]
                              : channels.filter(c => c !== channel)
                          });
                        }}
                      />
                      <Label className="capitalize">{channel}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base mb-2 block">Minimum Severity Level</Label>
                <Select value={formData.severity_filter || 'all'} onValueChange={(v) => setFormData({...formData, severity_filter: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="medium_and_above">Medium and Above</SelectItem>
                    <SelectItem value="high_and_above">High and Above</SelectItem>
                    <SelectItem value="critical_only">Critical Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={() => saveMutation.mutate(formData)} disabled={saveMutation.isPending}>
                Save Channel Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quiet-hours">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Quiet Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.quiet_hours_enabled || false}
                  onCheckedChange={(checked) => setFormData({...formData, quiet_hours_enabled: checked})}
                />
                <Label>Enable quiet hours</Label>
              </div>

              {formData.quiet_hours_enabled && (
                <div className="space-y-4 ml-6">
                  <div>
                    <Label className="text-sm mb-1 block">Start Time (HH:mm)</Label>
                    <Input
                      type="time"
                      value={(formData.quiet_hours?.start_time || '').substring(0, 5)}
                      onChange={(e) => setFormData({
                        ...formData,
                        quiet_hours: {...(formData.quiet_hours || {}), start_time: e.target.value}
                      })}
                    />
                  </div>

                  <div>
                    <Label className="text-sm mb-1 block">End Time (HH:mm)</Label>
                    <Input
                      type="time"
                      value={(formData.quiet_hours?.end_time || '').substring(0, 5)}
                      onChange={(e) => setFormData({
                        ...formData,
                        quiet_hours: {...(formData.quiet_hours || {}), end_time: e.target.value}
                      })}
                    />
                  </div>

                  <div>
                    <Label className="text-sm mb-1 block">Timezone</Label>
                    <Input
                      value={formData.quiet_hours?.timezone || 'UTC'}
                      onChange={(e) => setFormData({
                        ...formData,
                        quiet_hours: {...(formData.quiet_hours || {}), timezone: e.target.value}
                      })}
                      placeholder="UTC"
                    />
                  </div>
                </div>
              )}

              <Button onClick={() => saveMutation.mutate(formData)} disabled={saveMutation.isPending}>
                Save Quiet Hours
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Alert Routing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.auto_assign || false}
                  onCheckedChange={(checked) => setFormData({...formData, auto_assign: checked})}
                />
                <Label>Auto-assign alerts to me</Label>
              </div>

              <div>
                <Label className="text-sm mb-2 block">Routing Priority (1=highest)</Label>
                <Input
                  type="number"
                  value={formData.routing_priority || ''}
                  onChange={(e) => setFormData({...formData, routing_priority: parseInt(e.target.value) || 0})}
                  min="1"
                  placeholder="Priority"
                />
              </div>

              <div>
                <Label className="text-sm mb-2 block">Escalation Group</Label>
                <Input
                  value={formData.escalation_group || ''}
                  onChange={(e) => setFormData({...formData, escalation_group: e.target.value})}
                  placeholder="Escalation group email"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.vacation_mode || false}
                  onCheckedChange={(checked) => setFormData({...formData, vacation_mode: checked})}
                />
                <Label>On vacation</Label>
              </div>

              {formData.vacation_mode && (
                <div>
                  <Label className="text-sm mb-2 block">Until</Label>
                  <Input
                    type="datetime-local"
                    value={(formData.vacation_until || '').substring(0, 16)}
                    onChange={(e) => setFormData({...formData, vacation_until: e.target.value})}
                  />
                </div>
              )}

              <Button onClick={() => saveMutation.mutate(formData)} disabled={saveMutation.isPending}>
                Save Routing Rules
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}