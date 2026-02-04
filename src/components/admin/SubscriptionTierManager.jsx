import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, Edit, Trash2, Eye } from 'lucide-react';

export default function SubscriptionTierManager() {
  const [tiers, setTiers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    tier_name: '',
    tier_level: 1,
    description: '',
    price_sol: 0.1,
    features: [],
    is_active: true
  });

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    try {
      setIsLoading(true);
      const tiersList = await base44.entities.Subscription.list('-tier_level');
      setTiers(tiersList || []);
    } catch (error) {
      console.error('Error loading tiers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFeature = () => {
    setFormData({
      ...formData,
      features: [...formData.features, { feature_name: '', enabled: true, limit: null }]
    });
  };

  const handleUpdateFeature = (idx, field, value) => {
    const updated = [...formData.features];
    updated[idx][field] = value;
    setFormData({ ...formData, features: updated });
  };

  const handleRemoveFeature = (idx) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== idx)
    });
  };

  const handleSave = async () => {
    if (!formData.tier_name || formData.price_sol === null) {
      alert('Please fill in tier name and price');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingTier) {
        await base44.entities.Subscription.update(editingTier.id, formData);
      } else {
        await base44.entities.Subscription.create(formData);
      }
      await loadTiers();
      setShowDialog(false);
      setEditingTier(null);
      setFormData({
        tier_name: '',
        tier_level: 1,
        description: '',
        price_sol: 0.1,
        features: [],
        is_active: true
      });
    } catch (error) {
      console.error('Error saving tier:', error);
      alert('Failed to save tier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (tier) => {
    setEditingTier(tier);
    setFormData(tier);
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this tier?')) {
      try {
        await base44.entities.Subscription.delete(id);
        await loadTiers();
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Subscription Tiers</h3>
        <Button
          size="sm"
          onClick={() => {
            setEditingTier(null);
            setFormData({
              tier_name: '',
              tier_level: tiers.length + 1,
              description: '',
              price_sol: 0.1,
              features: [],
              is_active: true
            });
            setShowDialog(true);
          }}
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          New Tier
        </Button>
      </div>

      {tiers.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-gray-500">No subscription tiers yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tiers.map((tier) => (
            <Card key={tier.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{tier.tier_name}</h4>
                      {!tier.is_active && (
                        <Badge variant="outline" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{tier.description}</p>
                    <p className="text-sm font-bold text-purple-600">
                      {tier.price_sol} SOL/month
                    </p>
                    {tier.features?.length > 0 && (
                      <div className="mt-2 text-xs text-gray-600">
                        <p className="font-semibold mb-1">Features:</p>
                        <ul className="list-disc list-inside">
                          {tier.features.map((f, idx) => (
                            <li key={idx}>
                              {f.feature_name}
                              {f.limit && ` (${f.limit})`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(tier)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(tier.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTier ? 'Edit Tier' : 'Create Subscription Tier'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold block mb-1">Tier Name</label>
              <Input
                value={formData.tier_name}
                onChange={(e) =>
                  setFormData({ ...formData, tier_name: e.target.value })
                }
                placeholder="e.g., Premium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Tier Level</label>
              <Input
                type="number"
                value={formData.tier_level}
                onChange={(e) =>
                  setFormData({ ...formData, tier_level: parseInt(e.target.value) })
                }
                min="1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="What's included..."
                className="h-20"
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Price (SOL/month)</label>
              <Input
                type="number"
                value={formData.price_sol}
                onChange={(e) =>
                  setFormData({ ...formData, price_sol: parseFloat(e.target.value) })
                }
                min="0.01"
                step="0.01"
              />
            </div>

            {/* Features */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold">Features</label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddFeature}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {formData.features.map((feature, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      placeholder="Feature name"
                      value={feature.feature_name}
                      onChange={(e) =>
                        handleUpdateFeature(idx, 'feature_name', e.target.value)
                      }
                      className="text-xs"
                    />
                    <Input
                      placeholder="Limit"
                      type="number"
                      value={feature.limit || ''}
                      onChange={(e) =>
                        handleUpdateFeature(
                          idx,
                          'limit',
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      className="text-xs w-20"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveFeature(idx)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
              />
              <label>Active</label>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Tier'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}