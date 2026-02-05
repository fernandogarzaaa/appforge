import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Edit2 } from 'lucide-react';

export default function SubscriptionPlanManager() {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tier: 'basic',
    price_per_month_sol: 0.1,
    price_per_month_usd: 10,
    max_agents: 5,
    max_recommendations_per_month: 10,
    max_workflows_per_month: 5,
    max_api_calls_per_month: 1000,
    support_level: 'email'
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const plansList = await base44.entities.SubscriptionPlan.list('-updated_date', 50);
      setPlans(plansList || []);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await base44.asServiceRole.entities.SubscriptionPlan.update(editingPlan.id, formData);
      } else {
        await base44.asServiceRole.entities.SubscriptionPlan.create({
          ...formData,
          is_active: true
        });
      }
      await loadPlans();
      setShowForm(false);
      setEditingPlan(null);
      resetForm();
    } catch (error) {
      console.error('Error saving plan:', error);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      await base44.asServiceRole.entities.SubscriptionPlan.update(planId, { is_active: false });
      await loadPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      tier: plan.tier,
      price_per_month_sol: plan.price_per_month_sol,
      price_per_month_usd: plan.price_per_month_usd,
      max_agents: plan.max_agents || 5,
      max_recommendations_per_month: plan.max_recommendations_per_month || 10,
      max_workflows_per_month: plan.max_workflows_per_month || 5,
      max_api_calls_per_month: plan.max_api_calls_per_month || 1000,
      support_level: plan.support_level || 'email'
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      tier: 'basic',
      price_per_month_sol: 0.1,
      price_per_month_usd: 10,
      max_agents: 5,
      max_recommendations_per_month: 10,
      max_workflows_per_month: 5,
      max_api_calls_per_month: 1000,
      support_level: 'email'
    });
  };

  const activePlans = plans.filter(p => p.is_active !== false);
  const tierColors = {
    free: 'bg-gray-100 text-gray-800',
    basic: 'bg-blue-100 text-blue-800',
    premium: 'bg-purple-100 text-purple-800',
    enterprise: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Subscription Plans</h2>
        <Button
          onClick={() => {
            resetForm();
            setEditingPlan(null);
            setShowForm(!showForm);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Plan
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <form onSubmit={handleSavePlan} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1">Plan Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Premium Plus"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Tier</label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                    className="w-full text-sm border rounded px-2 py-1.5"
                  >
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Plan description"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1">Price/Month (SOL)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price_per_month_sol}
                    onChange={(e) => setFormData({ ...formData, price_per_month_sol: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Price/Month (USD)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price_per_month_usd}
                    onChange={(e) => setFormData({ ...formData, price_per_month_usd: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1">Max Agents</label>
                  <Input
                    type="number"
                    value={formData.max_agents}
                    onChange={(e) => setFormData({ ...formData, max_agents: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Max Recommendations/mo</label>
                  <Input
                    type="number"
                    value={formData.max_recommendations_per_month}
                    onChange={(e) => setFormData({ ...formData, max_recommendations_per_month: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1">Max Workflows/mo</label>
                  <Input
                    type="number"
                    value={formData.max_workflows_per_month}
                    onChange={(e) => setFormData({ ...formData, max_workflows_per_month: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Max API Calls/mo</label>
                  <Input
                    type="number"
                    value={formData.max_api_calls_per_month}
                    onChange={(e) => setFormData({ ...formData, max_api_calls_per_month: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Support Level</label>
                <select
                  value={formData.support_level}
                  onChange={(e) => setFormData({ ...formData, support_level: e.target.value })}
                  className="w-full text-sm border rounded px-2 py-1.5"
                >
                  <option value="none">None</option>
                  <option value="email">Email</option>
                  <option value="priority">Priority</option>
                  <option value="dedicated">Dedicated</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 bg-blue-600">
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPlan(null);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Plans List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : activePlans.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No plans created yet</p>
        ) : (
          activePlans.map((plan) => (
            <Card key={plan.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{plan.name}</p>
                      <Badge className={tierColors[plan.tier] || 'bg-gray-100'}>
                        {plan.tier}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{plan.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                      <span>💰 {plan.price_per_month_sol} SOL / ${plan.price_per_month_usd}</span>
                      <span>🤖 {plan.max_agents} agents</span>
                      <span>📊 {plan.max_recommendations_per_month} rec/mo</span>
                      <span>⚙️ {plan.max_workflows_per_month} wf/mo</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditPlan(plan)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeletePlan(plan.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}