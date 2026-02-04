import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, Send, CheckCircle2 } from 'lucide-react';
import HyperparameterTuningPanel from './HyperparameterTuningPanel';
import AgentFeedbackCollector from './AgentFeedbackCollector';

export default function CustomAgentTrainer({ agentId, onTrainingComplete }) {
  const [agent, setAgent] = useState(null);
  const [trainingInput, setTrainingInput] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [feedback, setFeedback] = useState('good');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingResult, setTrainingResult] = useState(null);

  useEffect(() => {
    fetchAgent();
  }, [agentId]);

  const fetchAgent = async () => {
    try {
      const agents = await base44.entities.CustomAgent.filter({ id: agentId });
      if (agents.length > 0) {
        setAgent(agents[0]);
      }
    } catch (error) {
      console.error('Failed to fetch agent:', error);
    }
  };

  const submitTraining = async () => {
    if (!trainingInput || !expectedOutput) {
      alert('Please fill in training input and expected output');
      return;
    }

    setIsTraining(true);
    try {
      const response = await base44.functions.invoke('trainCustomAgent', {
        agentId,
        trainingInput,
        expectedOutput,
        feedback,
      });

      setTrainingResult(response.data);
      setTrainingInput('');
      setExpectedOutput('');
      setFeedback('good');
      
      fetchAgent();
      onTrainingComplete?.(response.data);
    } catch (error) {
      console.error('Training failed:', error);
      alert('Training failed');
    } finally {
      setIsTraining(false);
    }
  };

  if (!agent) {
    return <p className="text-sm text-gray-500">Loading agent...</p>;
  }

  const metrics = agent.performance_metrics || {};
  const readyForDeploy = metrics.training_iterations >= 3;

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Train: {agent.agent_name}
          </CardTitle>
          {readyForDeploy && (
            <Badge className="bg-green-600 text-white">
              Ready for Deploy
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Feedback Collection */}
        <AgentFeedbackCollector agentId={agentId} agentName={agent.agent_name} />

        {/* Hyperparameter Tuning */}
        <HyperparameterTuningPanel agentId={agentId} />

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Training Progress</span>
            <span className="font-semibold">{metrics.training_iterations} iterations</span>
          </div>
          <Progress value={Math.min(100, (metrics.training_iterations / 5) * 100)} />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded bg-white border border-blue-200">
            <p className="text-xs text-gray-600">Accuracy</p>
            <p className="font-semibold text-sm">{(metrics.accuracy * 100).toFixed(0)}%</p>
          </div>
          <div className="p-2 rounded bg-white border border-blue-200">
            <p className="text-xs text-gray-600">Satisfaction</p>
            <p className="font-semibold text-sm">{(metrics.user_satisfaction * 100).toFixed(0)}%</p>
          </div>
        </div>

        {/* Training Form */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-700">Example Input</label>
            <Textarea
              placeholder="Provide an example input for your agent..."
              value={trainingInput}
              onChange={(e) => setTrainingInput(e.target.value)}
              className="mt-1 h-16"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Expected Output</label>
            <Textarea
              placeholder="What should the agent output for this input..."
              value={expectedOutput}
              onChange={(e) => setExpectedOutput(e.target.value)}
              className="mt-1 h-16"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Feedback</label>
            <div className="flex gap-2 mt-1">
              {['good', 'ok', 'poor'].map((option) => (
                <Button
                  key={option}
                  size="sm"
                  variant={feedback === option ? 'default' : 'outline'}
                  onClick={() => setFeedback(option)}
                  className="flex-1 capitalize"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={submitTraining}
            disabled={isTraining}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600"
          >
            <Send className="w-3 h-3 mr-1" />
            {isTraining ? 'Training...' : 'Submit Training'}
          </Button>
        </div>

        {/* Training Result */}
        {trainingResult && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-green-900">Training Complete!</p>
                <p className="text-green-800 mt-1">
                  Accuracy: {(trainingResult.accuracy * 100).toFixed(0)}% | 
                  Iteration: {trainingResult.trainingIteration}
                </p>
                {trainingResult.improvements?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-green-700 font-semibold">Improvements:</p>
                    {trainingResult.improvements.map((imp, idx) => (
                      <p key={idx} className="text-green-700">• {imp}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}