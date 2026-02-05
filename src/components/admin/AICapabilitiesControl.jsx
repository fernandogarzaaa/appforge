import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Brain, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AICapabilitiesControl() {
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState(null);

  const { data: agents = [] } = useQuery({
    queryKey: ['customAgents'],
    queryFn: () => base44.asServiceRole.entities.CustomAgent.list(),
  });

  const toggleAgentMutation = useMutation({
    mutationFn: async ({ agentId, newStatus }) => {
      return base44.asServiceRole.entities.CustomAgent.update(agentId, { is_active: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customAgents'] });
      toast.success('Agent status updated');
    },
  });

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
        <CheckCircle className="w-3 h-3" /> Active
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> Inactive
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-500 to-indigo-600">
        <CardContent className="p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">AI Capabilities</h2>
              <p className="text-purple-100 text-sm">
                Manage and control AI features and agents
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agents Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Active Agents ({agents.length})
          </CardTitle>
          <CardDescription>Manage deployed AI agents and their capabilities</CardDescription>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No agents deployed yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agents.map((agent) => (
                <Card key={agent.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                        <p className="text-xs text-gray-600 mt-1">{agent.description}</p>
                      </div>
                      {getStatusBadge(agent.is_active)}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className="text-xs text-gray-500">Status:</span>
                      <Switch
                        checked={agent.is_active}
                        onCheckedChange={(checked) => {
                          toggleAgentMutation.mutate({
                            agentId: agent.id,
                            newStatus: checked
                          });
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4 text-sm text-blue-800">
          <p className="font-semibold mb-2">ℹ️ AI Capabilities Management</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>Enable or disable AI agents on demand</li>
            <li>Control which features are available to users</li>
            <li>Monitor agent performance and health</li>
            <li>Configure advanced AI settings per agent</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}