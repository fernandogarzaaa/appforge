import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bot, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const AGENT_CONFIGS = [
  // Core AppForge Agents
  { id: 'admin_system', name: 'Admin System', icon: '⚙️', color: 'purple' },
  { id: 'project_auditor', name: 'Project Auditor', icon: '🔍', color: 'blue' },
  { id: 'github_automation', name: 'GitHub Automation', icon: '🐙', color: 'gray' },
  { id: 'security_scanner', name: 'Security Scanner', icon: '🔐', color: 'red' },
  { id: 'deployment_manager', name: 'Deployment Manager', icon: '🚀', color: 'orange' },
  { id: 'data_analyst', name: 'Data Analyst', icon: '📊', color: 'green' },
  { id: 'performance_optimizer', name: 'Performance Optimizer', icon: '⚡', color: 'yellow' },
  { id: 'ai_assistant', name: 'AI Assistant', icon: '🤖', color: 'cyan' },
  
  // God Swarm & Base Swarms (2026-02-24)
  { id: 'god_swarm', name: 'God Swarm (Meta-Orchestrator)', icon: '👑', color: 'purple' },
  { id: 'swarm_feature_forge', name: 'Feature Forge Swarm', icon: '🔨', color: 'blue' },
  { id: 'swarm_deep_research', name: 'Deep Research Swarm', icon: '📚', color: 'green' },
  { id: 'swarm_code_archaeology', name: 'Code Archaeology Swarm', icon: '🏛️', color: 'gray' },
  { id: 'swarm_content_studio', name: 'Content Studio Swarm', icon: '🎨', color: 'pink' },
  { id: 'swarm_incident_response', name: 'Incident Response Swarm', icon: '🚨', color: 'red' },
  { id: 'swarm_security_audit', name: 'Security Audit Swarm', icon: '🛡️', color: 'red' },
  { id: 'swarm_knowledge_synthesis', name: 'Knowledge Synthesis Swarm', icon: '🧠', color: 'cyan' },
  { id: 'swarm_devops_pipeline', name: 'DevOps Pipeline Swarm', icon: '⚙️', color: 'orange' },
  { id: 'swarm_design_system', name: 'Design System Swarm', icon: '🎯', color: 'purple' },
  { id: 'swarm_data_engineering', name: 'Data Engineering Swarm', icon: '💾', color: 'blue' },
  { id: 'swarm_api_crafting', name: 'API Crafting Swarm', icon: '🔌', color: 'green' },
  { id: 'swarm_learning_adaptation', name: 'Learning & Adaptation Swarm', icon: '📈', color: 'yellow' },
];

export default function AgentManagementHub() {
  const queryClient = useQueryClient();
  const [agentStates, setAgentStates] = useState({});

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['customAgents'],
    queryFn: () => base44.asServiceRole.entities.CustomAgent.list().catch(() => []),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ agentId, newStatus }) => {
      const agent = agents.find(a => a.id === agentId);
      if (agent) {
        return base44.asServiceRole.entities.CustomAgent.update(agentId, { is_active: newStatus });
      }
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customAgents'] });
      toast.success('Agent status updated');
    },
  });

  const getColorClass = (color) => {
    const colors = {
      purple: 'bg-purple-100 text-purple-800 border-purple-300',
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      gray: 'bg-gray-100 text-gray-800 border-gray-300',
      red: 'bg-red-100 text-red-800 border-red-300',
      orange: 'bg-orange-100 text-orange-800 border-orange-300',
      green: 'bg-green-100 text-green-800 border-green-300',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      cyan: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      pink: 'bg-pink-100 text-pink-800 border-pink-300',
    };
    return colors[color] || colors.blue;
  };

  const isAgentActive = (agentId) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.is_active : true;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-indigo-500 to-purple-600">
        <CardContent className="p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Agent Management Hub</h2>
              <p className="text-indigo-100 text-sm">Monitor and control all deployed AI agents</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {AGENT_CONFIGS.map((config) => {
          const isActive = isAgentActive(config.id);
          return (
            <Card key={config.id} className={`border-2 ${getColorClass(config.color)}`}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{config.icon}</span>
                      <div>
                        <h3 className="font-semibold text-sm">{config.name}</h3>
                      </div>
                    </div>
                    {isActive ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-gray-600">Status:</span>
                    <Switch
                      checked={isActive}
                      onCheckedChange={(checked) => {
                        toggleMutation.mutate({
                          agentId: config.id,
                          newStatus: checked
                        });
                      }}
                    />
                  </div>

                  <Badge className={isActive ? 'bg-green-600' : 'bg-gray-500'}>
                    {isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Agent Configuration
          </CardTitle>
          <CardDescription>Manage agent capabilities and permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <p className="font-semibold text-sm text-indigo-900 mb-2">Total Agents</p>
              <p className="text-3xl font-bold text-indigo-600">{AGENT_CONFIGS.length}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="font-semibold text-sm text-green-900 mb-2">Active</p>
              <p className="text-3xl font-bold text-green-600">
                {AGENT_CONFIGS.filter(c => isAgentActive(c.id)).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
