import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Shield, AlertTriangle, Lock, Users } from 'lucide-react';

export default function AgentPermissionsAdmin() {
  const [user, setUser] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      if (userData?.role === 'admin') {
        const allAgents = await base44.asServiceRole.entities.CustomAgent.list();
        setAgents(allAgents);
      }
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAgentStatus = async (agentId, currentStatus) => {
    try {
      await base44.asServiceRole.entities.CustomAgent.update(agentId, {
        is_active: !currentStatus
      });
      loadData();
    } catch (error) {
      console.error('Failed to update:', error);
      alert('Failed to update agent status');
    }
  };

  const updatePermissions = async (agentId, permissionType, value) => {
    try {
      const agent = agents.find(a => a.id === agentId);
      const updatedConfig = { ...agent.coding_config };
      
      if (permissionType.startsWith('file_')) {
        const key = permissionType.replace('file_', '');
        updatedConfig.file_permissions = {
          ...updatedConfig.file_permissions,
          [key]: value
        };
      } else if (permissionType.startsWith('system_')) {
        const key = permissionType.replace('system_', '');
        updatedConfig.system_permissions = {
          ...updatedConfig.system_permissions,
          [key]: value
        };
      }

      await base44.asServiceRole.entities.CustomAgent.update(agentId, {
        coding_config: updatedConfig
      });
      
      loadData();
    } catch (error) {
      console.error('Failed to update permissions:', error);
      alert('Failed to update permissions');
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-700 font-semibold">Admin Access Required</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const codingAgents = agents.filter(a => a.agent_type === 'coding_assistant');
  const regularAgents = agents.filter(a => a.agent_type !== 'coding_assistant');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="w-8 h-8" />
              Agent Permissions Admin
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage user agents and their system permissions
            </p>
          </div>
          <Badge className="bg-purple-600">
            <Users className="w-3 h-3 mr-1" />
            {agents.length} Total Agents
          </Badge>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{codingAgents.length}</div>
              <div className="text-xs text-gray-600">Coding Assistants</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{regularAgents.length}</div>
              <div className="text-xs text-gray-600">Regular Agents</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {agents.filter(a => a.is_active).length}
              </div>
              <div className="text-xs text-gray-600">Active</div>
            </CardContent>
          </Card>
        </div>

        {/* Coding Assistants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              Coding Assistants - High Risk Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {codingAgents.length === 0 ? (
              <p className="text-sm text-gray-600">No coding assistants created yet</p>
            ) : (
              <div className="space-y-4">
                {codingAgents.map(agent => (
                  <div key={agent.id} className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{agent.agent_name}</h3>
                        <p className="text-xs text-gray-600">Owner: {agent.user_id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={agent.is_active ? 'default' : 'outline'}>
                          {agent.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleAgentStatus(agent.id, agent.is_active)}
                        >
                          {agent.is_active ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    </div>

                    {agent.coding_config && (
                      <div className="grid grid-cols-2 gap-3">
                        {/* File Permissions */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-700">File Permissions</p>
                          {Object.entries(agent.coding_config.file_permissions || {}).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                              <span className="text-xs capitalize">{key.replace(/_/g, ' ')}</span>
                              <Switch
                                checked={value}
                                onCheckedChange={(checked) => updatePermissions(agent.id, `file_${key}`, checked)}
                              />
                            </div>
                          ))}
                        </div>

                        {/* System Permissions */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-700">System Permissions</p>
                          {Object.entries(agent.coding_config.system_permissions || {}).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                              <span className="text-xs capitalize">{key.replace(/_/g, ' ')}</span>
                              <Switch
                                checked={value}
                                onCheckedChange={(checked) => updatePermissions(agent.id, `system_${key}`, checked)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Regular Agents */}
        <Card>
          <CardHeader>
            <CardTitle>Regular Agents</CardTitle>
          </CardHeader>
          <CardContent>
            {regularAgents.length === 0 ? (
              <p className="text-sm text-gray-600">No regular agents</p>
            ) : (
              <div className="grid gap-3">
                {regularAgents.map(agent => (
                  <div key={agent.id} className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{agent.agent_name}</p>
                      <p className="text-xs text-gray-600">{agent.user_id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={agent.is_active ? 'default' : 'outline'}>
                        {agent.is_active ? 'Active' : 'Disabled'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAgentStatus(agent.id, agent.is_active)}
                      >
                        {agent.is_active ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}