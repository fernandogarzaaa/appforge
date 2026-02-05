import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Save } from 'lucide-react';

export default function AgentCollaborationBuilder({ userEmail, onWorkflowCreated }) {
  const [agents, setAgents] = useState([]);
  const [workflowName, setWorkflowName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [steps, setSteps] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUserAgents();
  }, [userEmail]);

  const fetchUserAgents = async () => {
    try {
      const data = await base44.entities.CustomAgent.filter(
        { user_id: userEmail },
        '-updated_date',
        20
      );
      setAgents(data || []);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const toggleAgentSelection = (agentId) => {
    setSelectedAgents(prev =>
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const addStep = () => {
    const newStep = {
      step_id: `step_${Date.now()}`,
      agent_id: '',
      action: '',
      trigger_event: 'manual',
      data_mapping: {},
      depends_on: []
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (stepId, field, value) => {
    setSteps(steps.map(s =>
      s.step_id === stepId ? { ...s, [field]: value } : s
    ));
  };

  const removeStep = (stepId) => {
    setSteps(steps.filter(s => s.step_id !== stepId));
  };

  const createWorkflow = async () => {
    if (!workflowName || selectedAgents.length === 0) {
      alert('Provide workflow name and select at least 2 agents');
      return;
    }

    setIsSaving(true);
    try {
      const workflow = await base44.entities.AgentCollaboration.create({
        user_id: userEmail,
        workflow_name: workflowName,
        description,
        agent_ids: selectedAgents,
        workflow_steps: steps,
        status: 'draft',
        shared_context: {},
        execution_history: []
      });

      onWorkflowCreated?.(workflow);
      setWorkflowName('');
      setDescription('');
      setSelectedAgents([]);
      setSteps([]);
    } catch (error) {
      console.error('Failed to create workflow:', error);
      alert('Failed to create workflow');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-indigo-200 bg-indigo-50/30">
      <CardHeader>
        <CardTitle className="text-sm">Create Agent Collaboration Workflow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Workflow Info */}
        <div>
          <label className="text-xs font-semibold block mb-1">Workflow Name</label>
          <Input
            placeholder="e.g., Data Analysis Pipeline"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1">Description</label>
          <textarea
            placeholder="Describe what this collaboration does"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border rounded-lg h-16"
          />
        </div>

        {/* Agent Selection */}
        <div>
          <label className="text-xs font-semibold block mb-2">Select Agents to Collaborate</label>
          <div className="grid grid-cols-2 gap-2">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => toggleAgentSelection(agent.id)}
                className={`p-2 rounded-lg border-2 transition-all text-xs text-left ${
                  selectedAgents.includes(agent.id)
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold">{agent.agent_name}</p>
                <p className="text-gray-600 text-xs mt-0.5">{agent.goal.substring(0, 30)}...</p>
              </button>
            ))}
          </div>
        </div>

        {/* Workflow Steps */}
        {selectedAgents.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold">Workflow Steps</label>
              <Button size="sm" variant="outline" onClick={addStep}>
                <Plus className="w-3 h-3 mr-1" />
                Add Step
              </Button>
            </div>

            <div className="space-y-2">
              {steps.map((step, idx) => (
                <div key={step.step_id} className="p-2 border rounded-lg bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold">Step {idx + 1}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeStep(step.step_id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>

                  <select
                    value={step.agent_id}
                    onChange={(e) => updateStep(step.step_id, 'agent_id', e.target.value)}
                    className="w-full px-2 py-1 text-xs border rounded mb-1"
                  >
                    <option value="">Select Agent</option>
                    {agents
                      .filter(a => selectedAgents.includes(a.id))
                      .map(a => (
                        <option key={a.id} value={a.id}>
                          {a.agent_name}
                        </option>
                      ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Action/goal for this step"
                    value={step.action}
                    onChange={(e) => updateStep(step.step_id, 'action', e.target.value)}
                    className="w-full px-2 py-1 text-xs border rounded"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={createWorkflow}
          disabled={isSaving || !workflowName || selectedAgents.length === 0}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
        >
          <Save className="w-3 h-3 mr-1" />
          {isSaving ? 'Creating...' : 'Create Workflow'}
        </Button>
      </CardContent>
    </Card>
  );
}