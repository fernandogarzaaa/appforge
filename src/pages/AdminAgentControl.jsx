import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Bot, Power, Settings, Trash2, RefreshCw } from 'lucide-react';

export default function AdminAgentControl() {
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['adminAgents'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') throw new Error('Admin access required');
      
      const customAgents = await base44.asServiceRole.entities.CustomAgent.list('-updated_date', 50);
      const agentConfigs = await base44.asServiceRole.entities.AIAgentConfig.list('-updated_date', 50);
      return [...(customAgents || []), ...(agentConfigs || [])];
    }
  });

  const updateAgentMutation = useMutation({
    mutationFn: async ({ agentId, data, type = 'CustomAgent' }) => {
      const entity = type === 'CustomAgent' ? 'CustomAgent' : 'AIAgentConfig';
      return await base44.asServiceRole.entities[entity].update(agentId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAgents'] });
    }
  });

  const deleteAgentMutation = useMutation({
    mutationFn: async ({ agentId, type = 'CustomAgent' }) => {
      const entity = type === 'CustomAgent' ? 'CustomAgent' : 'AIAgentConfig';
      return await base44.asServiceRole.entities[entity].delete(agentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAgents'] });
      setSelectedAgent(null);
    }
  });

  const filteredAgents = agents.filter(agent =>
    (agent.name || agent.agent_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleStatus = (agent) => {
    const newStatus = agent.status === 'active' ? 'disabled' : 'active';
    updateAgentMutation.mutate({
      agentId: agent.id,
      data: { status: newStatus },
      type: agent.name ? 'CustomAgent' : 'AIAgentConfig'
    });
  };

  const handleDelete = (agent) => {
    if (confirm(`Delete agent "${agent.name || agent.agent_name}"?`)) {
      deleteAgentMutation.mutate({
        agentId: agent.id,
        type: agent.name ? 'CustomAgent' : 'AIAgentConfig'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Bot className="w-6 h-6" />
        <h1 className="text-3xl font-bold">AI Agent Control</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Manage Agents ({agents.length})</CardTitle>
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['adminAgents'] })} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />

          {isLoading ? (
            <p className="text-center py-8 text-gray-500">Loading agents...</p>
          ) : filteredAgents.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No agents found</p>
          ) : (
            <div className="space-y-3">
              {filteredAgents.map(agent => (
                <div key={agent.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedAgent(agent)}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold">{agent.name || agent.agent_name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{agent.description || 'No description'}</p>
                      {agent.version && <p className="text-xs text-gray-500 mt-1">v{agent.version}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                        {agent.status || 'unknown'}
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(agent);
                          }}
                          className="gap-2"
                        >
                          <Power className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(agent);
                          }}
                          className="gap-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedAgent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Agent Details: {selectedAgent.name || selectedAgent.agent_name}</CardTitle>
              <Button variant="ghost" onClick={() => setSelectedAgent(null)}>×</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-semibold">{selectedAgent.status || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-semibold text-xs">{new Date(selectedAgent.created_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="font-semibold text-xs">{new Date(selectedAgent.updated_date).toLocaleDateString()}</p>
              </div>
              {selectedAgent.version && (
                <div>
                  <p className="text-sm text-gray-600">Version</p>
                  <p className="font-semibold">v{selectedAgent.version}</p>
                </div>
              )}
            </div>
            <div className="pt-4 border-t space-y-3 flex gap-2">
              <Button
                variant={selectedAgent.status === 'active' ? 'destructive' : 'default'}
                onClick={() => handleToggleStatus(selectedAgent)}
                className="gap-2"
              >
                <Power className="w-4 h-4" />
                {selectedAgent.status === 'active' ? 'Disable' : 'Enable'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(selectedAgent)}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Agent
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}