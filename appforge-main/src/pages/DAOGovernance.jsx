import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Vote, Plus, TrendingUp, Wallet, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import NetworkBadge from '@/components/web3/NetworkBadge';
import EmptyState from '@/components/common/EmptyState';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function DAOGovernance() {
  const [showDialog, setShowDialog] = useState(false);
  const [newDAO, setNewDAO] = useState({
    name: '',
    description: '',
    network: 'ethereum',
    governance_token: '',
    voting_power: {
      quorum: 10,
      threshold: 51,
      voting_period: 7
    }
  });

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('projectId');

  const queryClient = useQueryClient();

  const { data: daos = [] } = useQuery({
    queryKey: ['daos', projectId],
    queryFn: () => base44.entities.DAO.filter({ project_id: projectId }),
    enabled: !!projectId
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DAO.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daos', projectId] });
      setShowDialog(false);
      setNewDAO({
        name: '',
        description: '',
        network: 'ethereum',
        governance_token: '',
        voting_power: { quorum: 10, threshold: 51, voting_period: 7 }
      });
      toast.success('DAO created');
    }
  });

  const handleCreate = () => {
    createMutation.mutate({ ...newDAO, project_id: projectId });
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState icon={Users} title="No Project Selected" description="Select a project to create DAOs" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-[#fafbfc]">
      <div className="bg-white/60 backdrop-blur-xl border-b border-gray-200/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900 mb-1">DAO Governance</h1>
            <p className="text-[11px] text-gray-500">Create and manage decentralized organizations</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="h-8 bg-gray-900 hover:bg-gray-800 text-[13px]">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                New DAO
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-lg max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base">Create DAO</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-[12px]">DAO Name</Label>
                  <Input
                    value={newDAO.name}
                    onChange={(e) => setNewDAO({ ...newDAO, name: e.target.value })}
                    className="h-9 text-[13px]"
                    placeholder="Community DAO"
                  />
                </div>
                <div>
                  <Label className="text-[12px]">Description</Label>
                  <Textarea
                    value={newDAO.description}
                    onChange={(e) => setNewDAO({ ...newDAO, description: e.target.value })}
                    className="text-[13px]"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[12px]">Network</Label>
                    <Select value={newDAO.network} onValueChange={(v) => setNewDAO({ ...newDAO, network: v })}>
                      <SelectTrigger className="h-9 text-[13px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ethereum">Ethereum</SelectItem>
                        <SelectItem value="polygon">Polygon</SelectItem>
                        <SelectItem value="arbitrum">Arbitrum</SelectItem>
                        <SelectItem value="optimism">Optimism</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[12px]">Gov Token</Label>
                    <Input
                      value={newDAO.governance_token}
                      onChange={(e) => setNewDAO({ ...newDAO, governance_token: e.target.value })}
                      className="h-9 text-[13px]"
                      placeholder="TOKEN"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-[11px]">Quorum %</Label>
                    <Input
                      type="number"
                      value={newDAO.voting_power.quorum}
                      onChange={(e) => setNewDAO({ 
                        ...newDAO, 
                        voting_power: { ...newDAO.voting_power, quorum: parseInt(e.target.value) }
                      })}
                      className="h-8 text-[12px]"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Threshold %</Label>
                    <Input
                      type="number"
                      value={newDAO.voting_power.threshold}
                      onChange={(e) => setNewDAO({ 
                        ...newDAO, 
                        voting_power: { ...newDAO.voting_power, threshold: parseInt(e.target.value) }
                      })}
                      className="h-8 text-[12px]"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Period (days)</Label>
                    <Input
                      type="number"
                      value={newDAO.voting_power.voting_period}
                      onChange={(e) => setNewDAO({ 
                        ...newDAO, 
                        voting_power: { ...newDAO.voting_power, voting_period: parseInt(e.target.value) }
                      })}
                      className="h-8 text-[12px]"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={!newDAO.name}
                  className="w-full h-9 bg-gray-900 hover:bg-gray-800 text-[13px]"
                >
                  Create DAO
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {daos.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No DAOs Yet"
            description="Create your first decentralized autonomous organization"
            actionLabel="Create DAO"
            onAction={() => setShowDialog(true)}
          />
        ) : (
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            {daos.map((dao, i) => (
              <motion.div
                key={dao.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-[14px]">{dao.name}</CardTitle>
                          <NetworkBadge network={dao.network} />
                        </div>
                      </div>
                      <Badge className="bg-indigo-100 text-indigo-700 text-[10px]">
                        {dao.status}
                      </Badge>
                    </div>
                    {dao.description && (
                      <p className="text-[11px] text-gray-500">{dao.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500">Members</span>
                      <span className="text-[13px] font-semibold">{dao.member_count || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500">Governance Token</span>
                      <Badge variant="outline" className="text-[10px]">
                        {dao.governance_token || 'N/A'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500">Quorum</p>
                        <p className="text-[12px] font-semibold">{dao.voting_power?.quorum}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500">Threshold</p>
                        <p className="text-[12px] font-semibold">{dao.voting_power?.threshold}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500">Period</p>
                        <p className="text-[12px] font-semibold">{dao.voting_power?.voting_period}d</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}