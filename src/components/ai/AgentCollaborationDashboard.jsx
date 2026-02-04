import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, BarChart3, Zap } from 'lucide-react';

export default function AgentCollaborationDashboard({ userEmail }) {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    fetchWorkflows();
    const interval = setInterval(fetchWorkflows, 5000);
    return () => clearInterval(interval);
  }, [userEmail]);

  const fetchWorkflows = async () => {
    try {
      const data = await base44.entities.AgentCollaboration.filter(
        { user_id: userEmail },
        '-updated_date',
        20
      );
      setWorkflows(data || []);
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    }
  };

  const executeWorkflow = async (workflowId) => {
    setIsExecuting(true);
    try {
      const response = await base44.functions.invoke('executeAgentCollaboration', {
        workflowId,
        triggerData: {}
      });
      
      if (response.data) {
        setSelectedWorkflow(response.data);
        fetchWorkflows();
      }
    } catch (error) {
      console.error('Execution error:', error);
      alert('Workflow execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const statusColor = {
    draft: 'bg-gray-100 text-gray-800',
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    paused: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Agent Collaboration Workflows</h3>

      {workflows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-gray-600">No workflows created yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {workflows.map((workflow) => (
            <Card
              key={workflow.id}
              className={`cursor-pointer transition-all ${
                selectedWorkflow?.id === workflow.id ? 'ring-2 ring-indigo-500' : ''
              }`}
              onClick={() => setSelectedWorkflow(workflow)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-sm">{workflow.workflow_name}</h4>
                    <p className="text-xs text-gray-600">{workflow.description}</p>
                  </div>
                  <Badge className={statusColor[workflow.status]}>
                    {workflow.status}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="p-2 rounded bg-gray-50">
                    <p className="text-xs text-gray-600">Agents</p>
                    <p className="font-semibold text-sm">{workflow.agent_ids?.length || 0}</p>
                  </div>
                  <div className="p-2 rounded bg-green-50">
                    <p className="text-xs text-gray-600">Success</p>
                    <p className="font-semibold text-sm text-green-700">{workflow.success_count || 0}</p>
                  </div>
                  <div className="p-2 rounded bg-red-50">
                    <p className="text-xs text-gray-600">Failed</p>
                    <p className="font-semibold text-sm text-red-700">{workflow.failure_count || 0}</p>
                  </div>
                </div>

                {/* Execution History */}
                {workflow.execution_history?.length > 0 && (
                  <div className="mb-3 p-2 bg-gray-50 rounded">
                    <p className="text-xs font-semibold mb-2">Recent Execution</p>
                    <div className="space-y-1">
                      {workflow.execution_history.slice(-3).map((exec, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <span className={`w-2 h-2 rounded-full ${
                            exec.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span className="text-gray-600">Step {idx + 1}: {exec.status}</span>
                          <span className="text-gray-400">{exec.duration_ms}ms</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    executeWorkflow(workflow.id);
                  }}
                  disabled={isExecuting}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  {isExecuting ? 'Executing...' : 'Execute Workflow'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detailed View */}
      {selectedWorkflow && (
        <Card className="border-indigo-200 bg-indigo-50/30 col-span-full">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Workflow Details: {selectedWorkflow.workflow_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Shared Context */}
            {selectedWorkflow.shared_context && Object.keys(selectedWorkflow.shared_context).length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-1">Shared Context</p>
                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                  {JSON.stringify(selectedWorkflow.shared_context, null, 2)}
                </pre>
              </div>
            )}

            {/* Execution Timeline */}
            {selectedWorkflow.execution_history?.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2">Execution Timeline</p>
                <div className="space-y-1">
                  {selectedWorkflow.execution_history.map((exec, idx) => (
                    <div key={idx} className="text-xs border-l-2 border-indigo-300 pl-2 py-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${
                          exec.status === 'success' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {exec.step_id} - {exec.status.toUpperCase()}
                        </span>
                        <span className="text-gray-500">{exec.duration_ms}ms</span>
                      </div>
                      {exec.output && (
                        <pre className="text-xs bg-white p-1 rounded mt-1 max-h-20 overflow-y-auto">
                          {JSON.stringify(exec.output, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}