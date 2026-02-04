import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Play, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function GuidedWorkflowPlayer({ agentId }) {
  const [workflows, setWorkflows] = useState([]);
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWorkflows();
  }, [agentId]);

  const fetchWorkflows = async () => {
    try {
      const data = await base44.entities.GuidedLearningWorkflow.filter(
        { agent_id: agentId },
        '-updated_date',
        10
      );
      setWorkflows(data || []);
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startWorkflow = async (workflowId) => {
    try {
      const wfList = await base44.entities.GuidedLearningWorkflow.filter({ id: workflowId });
      if (wfList.length > 0) {
        await base44.entities.GuidedLearningWorkflow.update(workflowId, {
          status: 'in_progress',
          current_step: 1
        });
        setActiveWorkflow(wfList[0]);
        fetchWorkflows();
      }
    } catch (error) {
      console.error('Start error:', error);
    }
  };

  const advanceStep = async (workflowId, currentStep, totalSteps) => {
    try {
      const nextStep = currentStep + 1;
      const isComplete = nextStep > totalSteps;
      
      await base44.entities.GuidedLearningWorkflow.update(workflowId, {
        current_step: isComplete ? totalSteps : nextStep,
        completion_percentage: (nextStep / totalSteps) * 100,
        status: isComplete ? 'completed' : 'in_progress'
      });
      
      fetchWorkflows();
      if (isComplete) {
        setActiveWorkflow(null);
      }
    } catch (error) {
      console.error('Advance error:', error);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading workflows...</p>;
  }

  if (activeWorkflow) {
    const currentStep = activeWorkflow.steps?.[activeWorkflow.current_step - 1];
    const completion = (activeWorkflow.current_step / activeWorkflow.steps?.length) * 100;

    return (
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              {activeWorkflow.workflow_name}
            </span>
            <Badge className="bg-blue-600">
              {activeWorkflow.current_step}/{activeWorkflow.steps?.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Progress</span>
              <span className="font-semibold">{Math.round(completion)}%</span>
            </div>
            <Progress value={completion} />
          </div>

          {currentStep && (
            <div className="p-3 border rounded-lg bg-white">
              <h4 className="font-semibold text-xs mb-1">{currentStep.title}</h4>
              <p className="text-xs text-gray-600 mb-2">{currentStep.description}</p>
              {currentStep.parameters && (
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-20">
                  {JSON.stringify(currentStep.parameters, null, 2)}
                </pre>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveWorkflow(null)}
              className="flex-1"
            >
              Pause
            </Button>
            <Button
              size="sm"
              onClick={() => advanceStep(activeWorkflow.id, activeWorkflow.current_step, activeWorkflow.steps?.length)}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
            >
              {activeWorkflow.current_step >= activeWorkflow.steps?.length ? (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Complete
                </>
              ) : (
                <>
                  <ChevronRight className="w-3 h-3 mr-1" />
                  Next Step
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Guided Learning Workflows
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {workflows.length === 0 ? (
          <p className="text-xs text-gray-500">No workflows available</p>
        ) : (
          <div className="space-y-2">
            {workflows
              .filter(w => w.status !== 'in_progress')
              .map((workflow) => (
                <div key={workflow.id} className="p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="font-semibold text-xs">{workflow.workflow_name}</p>
                      <p className="text-xs text-gray-600">{workflow.steps?.length || 0} steps</p>
                    </div>
                    <Badge className="text-xs bg-green-100 text-green-800">
                      +{workflow.predicted_improvement || 0}%
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{workflow.description}</p>
                  <Button
                    size="sm"
                    onClick={() => startWorkflow(workflow.id)}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Start Learning
                  </Button>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}