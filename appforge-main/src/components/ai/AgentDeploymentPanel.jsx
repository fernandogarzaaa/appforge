import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Zap, Play, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const AGENT_SUGGESTIONS = [
  {
    id: 'task_automation',
    name: 'Task Automation Agent',
    description: 'Automatically executes tasks based on triggers and conditions',
    icon: Zap,
    autonomyLevel: 'high',
    capabilities: ['Task execution', 'Conditional logic', 'Error handling']
  },
  {
    id: 'data_processor',
    name: 'Data Processing Agent',
    description: 'Processes and transforms data from multiple sources',
    icon: TrendingUp,
    autonomyLevel: 'medium',
    capabilities: ['Data transformation', 'Validation', 'Reporting']
  },
  {
    id: 'email_handler',
    name: 'Email Handler Agent',
    description: 'Manages email triggers and sends automated responses',
    icon: AlertCircle,
    autonomyLevel: 'medium',
    capabilities: ['Email parsing', 'Auto-response', 'Attachment handling']
  }
];

export default function AgentDeploymentPanel() {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [autonomyLevel, setAutonomyLevel] = useState(50); // 0-100 scale
  const [autoApprove, setAutoApprove] = useState(false);
  const [deploying, setDeploying] = useState(false);

  const queryClient = useQueryClient();

  const { data: deployedAgents = [] } = useQuery({
    queryKey: ['deployed-agents'],
    queryFn: async () => {
      try {
        return await base44.entities.Automation.filter({
          status: 'active',
          is_agent: true
        });
      } catch {
        return [];
      }
    }
  });

  const handleDeploy = async (agent) => {
    if (!agent) return;
    setDeploying(true);
    
    try {
      // Create automation with agent configuration
      const agentConfig = {
        name: agent.name,
        description: agent.description,
        is_agent: true,
        status: 'active',
        autonomy_level: autonomyLevel,
        auto_approve_actions: autoApprove,
        trigger_type: 'entity_change',
        trigger: {
          type: 'entity_change',
          config: {}
        },
        nodes: []
      };

      await base44.entities.Automation.create(agentConfig);
      
      queryClient.invalidateQueries({ queryKey: ['deployed-agents'] });
      toast.success(`${agent.name} deployed successfully!`);
      setSelectedAgent(null);
      setAutonomyLevel(50);
      setAutoApprove(false);
    } catch (error) {
      toast.error(`Failed to deploy agent: ${error.message}`);
    } finally {
      setDeploying(false);
    }
  };

  const getAutonomyDescription = (level) => {
    if (level < 30) return 'High supervision - Requires approval for most actions';
    if (level < 60) return 'Balanced - Approves routine actions, requires approval for critical ones';
    if (level < 80) return 'Self-directed - Makes decisions independently with occasional notifications';
    return 'Fully autonomous - Makes all decisions independently';
  };

  return (
    <div className="space-y-6">
      {/* Suggested Agents */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Suggested Agents</h3>
          <p className="text-sm text-gray-500">Deploy pre-configured agents to automate your workflows</p>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          {AGENT_SUGGESTIONS.map((agent) => {
            const Icon = agent.icon;
            const isSelected = selectedAgent?.id === agent.id;
            return (
              <Card
                key={agent.id}
                className={`cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedAgent(agent)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Icon className="w-5 h-5 text-indigo-600" />
                      </div>
                      <CardTitle className="text-base">{agent.name}</CardTitle>
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CardDescription className="text-sm">{agent.description}</CardDescription>
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities.map((cap) => (
                      <Badge key={cap} variant="outline" className="text-xs">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-600">
                      Default autonomy: <span className="font-semibold capitalize">{agent.autonomyLevel}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Autonomy Configuration */}
      {selectedAgent && (
        <Card className="border-indigo-200 bg-indigo-50/50">
          <CardHeader>
            <CardTitle className="text-lg">Autonomy Configuration</CardTitle>
            <CardDescription>Configure how independently this agent makes decisions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Autonomy Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-900">Autonomy Level</label>
                <span className="text-2xl font-bold text-indigo-600">{autonomyLevel}%</span>
              </div>
              <Slider
                value={[autonomyLevel]}
                onValueChange={(val) => setAutonomyLevel(val[0])}
                min={0}
                max={100}
                step={10}
                className="w-full"
              />
              <p className="text-sm text-gray-600 italic">{getAutonomyDescription(autonomyLevel)}</p>
            </div>

            {/* Auto-Approve Toggle */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-900">Auto-Approve Actions</p>
                <p className="text-xs text-gray-500 mt-1">Automatically approve routine operations</p>
              </div>
              <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
            </div>

            {/* Permission Summary */}
            <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Agent Permissions</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                  Can read and access data
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                  Can execute configured actions
                </li>
                <li className="flex items-center gap-2">
                  {autoApprove ? (
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                  ) : (
                    <Clock className="w-3 h-3 text-yellow-600" />
                  )}
                  {autoApprove ? 'Automatically approves' : 'Waits for approval on'} critical operations
                </li>
              </ul>
            </div>

            {/* Deploy Button */}
            <Button
              onClick={() => handleDeploy(selectedAgent)}
              disabled={deploying}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11"
            >
              <Play className="w-4 h-4 mr-2" />
              {deploying ? 'Deploying...' : 'Deploy Agent'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Deployed Agents */}
      {deployedAgents.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Agents</h3>
          <div className="space-y-3">
            {deployedAgents.map((agent) => (
              <Card key={agent.id} className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">{agent.name}</p>
                        <p className="text-sm text-gray-600">Autonomy: {agent.autonomy_level}%</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}