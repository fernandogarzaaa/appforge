import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Plus, Save } from 'lucide-react';

export default function CustomAgentBuilder({ userEmail, onAgentCreated }) {
  const [step, setStep] = useState('setup'); // setup, configure, review
  const [formData, setFormData] = useState({
    agent_name: '',
    goal: '',
    description: '',
    personality: '',
    expertise_domain: '',
    response_style: 'professional',
    temperature: 0.7,
    creativity: 0.6,
    accuracy: 0.8,
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const createAgent = async () => {
    if (!formData.agent_name || !formData.goal) {
      alert('Agent name and goal are required');
      return;
    }

    setIsCreating(true);
    try {
      const agent = await base44.entities.CustomAgent.create({
        user_id: userEmail,
        agent_name: formData.agent_name,
        goal: formData.goal,
        description: formData.description,
        parameters: {
          personality: formData.personality,
          expertise_domain: formData.expertise_domain,
          response_style: formData.response_style,
          temperature: Number(formData.temperature),
          creativity: Number(formData.creativity),
          accuracy: Number(formData.accuracy),
        },
        training_data: [],
        performance_metrics: {
          accuracy: 0,
          user_satisfaction: 0,
          training_iterations: 0,
        },
      });

      onAgentCreated?.(agent);
      setFormData({
        agent_name: '',
        goal: '',
        description: '',
        personality: '',
        expertise_domain: '',
        response_style: 'professional',
        temperature: 0.7,
        creativity: 0.6,
        accuracy: 0.8,
      });
      setStep('setup');
    } catch (error) {
      console.error('Failed to create agent:', error);
      alert('Failed to create agent');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="border-purple-200 bg-purple-50/30">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Create Custom Agent
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'setup' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-700">Agent Name</label>
              <Input
                placeholder="e.g., Code Reviewer Bot"
                value={formData.agent_name}
                onChange={(e) => handleInputChange('agent_name', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Primary Goal</label>
              <Input
                placeholder="e.g., Review code for best practices"
                value={formData.goal}
                onChange={(e) => handleInputChange('goal', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Description</label>
              <Textarea
                placeholder="Describe what your agent will do..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="mt-1 h-20"
              />
            </div>

            <Button
              onClick={() => setStep('configure')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
            >
              Configure Parameters
            </Button>
          </div>
        )}

        {step === 'configure' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-700">Personality</label>
              <Input
                placeholder="e.g., analytical, friendly, formal"
                value={formData.personality}
                onChange={(e) => handleInputChange('personality', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Expertise Domain</label>
              <Input
                placeholder="e.g., software engineering, data science"
                value={formData.expertise_domain}
                onChange={(e) => handleInputChange('expertise_domain', e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-semibold text-gray-700">Temperature</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => handleInputChange('temperature', e.target.value)}
                  className="w-full mt-1"
                />
                <p className="text-xs text-gray-500 text-center">{Number(formData.temperature).toFixed(1)}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Creativity</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.creativity}
                  onChange={(e) => handleInputChange('creativity', e.target.value)}
                  className="w-full mt-1"
                />
                <p className="text-xs text-gray-500 text-center">{Number(formData.creativity).toFixed(1)}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Accuracy</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.accuracy}
                  onChange={(e) => handleInputChange('accuracy', e.target.value)}
                  className="w-full mt-1"
                />
                <p className="text-xs text-gray-500 text-center">{Number(formData.accuracy).toFixed(1)}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('setup')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep('review')}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
              >
                Review
              </Button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-white border border-purple-200 space-y-2">
              <div>
                <p className="text-xs text-gray-600">Name</p>
                <p className="font-semibold text-sm">{formData.agent_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Goal</p>
                <p className="text-sm">{formData.goal}</p>
              </div>
              <div className="flex flex-wrap gap-1 pt-2">
                <Badge variant="outline">{formData.response_style}</Badge>
                <Badge variant="outline">{formData.expertise_domain}</Badge>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('configure')}
                className="flex-1"
              >
                Edit
              </Button>
              <Button
                onClick={createAgent}
                disabled={isCreating}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
              >
                <Save className="w-3 h-3 mr-1" />
                Create Agent
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}