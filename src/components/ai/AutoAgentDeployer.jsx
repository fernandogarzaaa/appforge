import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Zap, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';

export default function AutoAgentDeployer({ userEmail, onAgentsDeployed }) {
  const [deployments, setDeployments] = useState([]);
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    fetchDeployments();
    const interval = setInterval(fetchDeployments, 10000);
    return () => clearInterval(interval);
  }, [userEmail]);

  const fetchDeployments = async () => {
    try {
      const agents = await base44.entities.AgentDeployment.filter({
        user_id: userEmail,
      }, '-updated_date', 20);
      setDeployments(agents || []);
    } catch (error) {
      console.error('Failed to fetch deployments:', error);
    }
  };

  const optimizeAgent = async (agentId, feedbackScore) => {
    try {
      const response = await base44.functions.invoke('optimizeDeployedAgent', {
        agentId,
        feedbackScore,
        result: '',
        executionTimeMs: 1000,
      });

      if (response.data) {
        fetchDeployments();
        return response.data;
      }
    } catch (error) {
      console.error('Optimization failed:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'optimizing':
        return <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      quantum: 'bg-cyan-100 text-cyan-800',
      analysis: 'bg-blue-100 text-blue-800',
      generation: 'bg-purple-100 text-purple-800',
      optimization: 'bg-green-100 text-green-800',
      monitoring: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Active AI Agents
            </span>
            <Badge variant="outline" className="bg-white">
              {deployments.length} deployed
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {deployments.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              AI agents deploy automatically based on your prompts
            </p>
          ) : (
            deployments.map((agent) => (
              <div key={agent.id} className="p-3 rounded-lg bg-white border border-green-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(agent.status)}
                    <div>
                      <p className="font-medium text-sm text-gray-900">{agent.agent_name}</p>
                      <p className="text-xs text-gray-500">{agent.prompt?.slice(0, 50)}...</p>
                    </div>
                  </div>
                  <Badge className={getTypeColor(agent.agent_type)}>
                    {agent.agent_type}
                  </Badge>
                </div>

                {agent.performance && (
                  <div className="space-y-2 mb-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Satisfaction</span>
                        <span className="text-gray-900 font-semibold">
                          {(agent.performance.user_satisfaction * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress
                        value={agent.performance.user_satisfaction * 100}
                        className="h-1.5"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">Efficiency</p>
                        <p className="text-gray-900 font-semibold">
                          {(agent.performance.efficiency * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Accuracy</p>
                        <p className="text-gray-900 font-semibold">
                          {(agent.performance.accuracy * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Iterations</p>
                        <p className="text-gray-900 font-semibold">
                          {agent.performance.iterations}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => optimizeAgent(agent.id, 0.9)}
                    className="flex-1 text-xs h-7"
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Good
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => optimizeAgent(agent.id, 0.5)}
                    className="flex-1 text-xs h-7"
                  >
                    Neutral
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => optimizeAgent(agent.id, 0.2)}
                    className="flex-1 text-xs h-7"
                  >
                    Improve
                  </Button>
                </div>
              </div>
            ))
          )}

          {deployments.length > 0 && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-xs text-blue-800">
                💡 Agents optimize based on your feedback. Higher satisfaction = better future performance.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}