import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';

export default function CreateTemplateModal({ open, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'ai_automation',
    trigger_type: 'schedule',
    difficulty_level: 'beginner',
    estimated_setup_time: 15,
    price: 0,
    is_premium: false,
    tags: [],
    use_cases: [],
    workflow_steps: [{ name: '', description: '', action_type: 'http_request' }]
  });
  const [tagInput, setTagInput] = useState('');

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return await base44.entities.BotTemplate.create({
        ...data,
        author_email: user.email,
        author_name: user.full_name,
        is_published: false,
        rating: 0,
        downloads_count: 0,
        review_count: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['botTemplates']);
      toast.success('Template created! Submit for review to publish.');
      onClose();
    }
  });

  const addWorkflowStep = () => {
    setFormData({
      ...formData,
      workflow_steps: [...formData.workflow_steps, { name: '', description: '', action_type: 'http_request' }]
    });
  };

  const removeWorkflowStep = (index) => {
    setFormData({
      ...formData,
      workflow_steps: formData.workflow_steps.filter((_, i) => i !== index)
    });
  };

  const updateWorkflowStep = (index, field, value) => {
    const updated = [...formData.workflow_steps];
    updated[index][field] = value;
    setFormData({ ...formData, workflow_steps: updated });
  };

  const addTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput] });
      setTagInput('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Bot Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label>Template Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Daily Sales Report Generator"
              />
            </div>

            <div>
              <Label>Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what your template does..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai_automation">AI Automation</SelectItem>
                    <SelectItem value="data_visualization">Data Visualization</SelectItem>
                    <SelectItem value="finance_automation">Finance Automation</SelectItem>
                    <SelectItem value="customer_service">Customer Service</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="sales_automation">Sales Automation</SelectItem>
                    <SelectItem value="hr_automation">HR Automation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Trigger Type</Label>
                <Select value={formData.trigger_type} onValueChange={(v) => setFormData({ ...formData, trigger_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="schedule">Schedule</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="entity_change">Entity Change</SelectItem>
                    <SelectItem value="form_submission">Form Submission</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Difficulty Level</Label>
                <Select value={formData.difficulty_level} onValueChange={(v) => setFormData({ ...formData, difficulty_level: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Setup Time (minutes)</Label>
                <Input
                  type="number"
                  value={formData.estimated_setup_time}
                  onChange={(e) => setFormData({ ...formData, estimated_setup_time: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* Workflow Steps */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Workflow Steps</Label>
              <Button size="sm" variant="outline" onClick={addWorkflowStep}>
                <Plus className="w-4 h-4 mr-1" />
                Add Step
              </Button>
            </div>
            <div className="space-y-3">
              {formData.workflow_steps.map((step, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium">Step {index + 1}</span>
                    {formData.workflow_steps.length > 1 && (
                      <Button size="sm" variant="ghost" onClick={() => removeWorkflowStep(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Step name"
                      value={step.name}
                      onChange={(e) => updateWorkflowStep(index, 'name', e.target.value)}
                    />
                    <Input
                      placeholder="Description"
                      value={step.description}
                      onChange={(e) => updateWorkflowStep(index, 'description', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tags..."
              />
              <Button onClick={addTag}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, i) => (
                <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                  {tag}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setFormData({ ...formData, tags: formData.tags.filter((_, idx) => idx !== i) })}
                  />
                </span>
              ))}
            </div>
          </div>

          {/* Monetization */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Monetization</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Premium Template</Label>
                  <p className="text-xs text-gray-500">Charge users to use this template</p>
                </div>
                <Switch
                  checked={formData.is_premium}
                  onCheckedChange={(v) => setFormData({ ...formData, is_premium: v })}
                />
              </div>

              {formData.is_premium && (
                <div>
                  <Label>Price (USD)</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">You'll receive 70% revenue share</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.name || !formData.description || createMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Template'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}