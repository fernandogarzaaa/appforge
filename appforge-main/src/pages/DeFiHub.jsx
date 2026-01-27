import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  TrendingUp, Coins, DollarSign, Plus, Activity, 
  Droplets, BarChart3, Zap, Network
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import NetworkBadge from '@/components/web3/NetworkBadge';
import EmptyState from '@/components/common/EmptyState';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const protocolIcons = {
  dex: Network,
  lending: DollarSign,
  staking: Coins,
  yield_farming: TrendingUp,
  liquidity_pool: Droplets
};

export default function DeFiHub() {
  const [showDialog, setShowDialog] = useState(false);
  const [newProtocol, setNewProtocol] = useState({
    name: '',
    protocol_type: 'dex',
    network: 'ethereum',
    apy: 0,
    status: 'development'
  });

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('projectId');

  const queryClient = useQueryClient();

  const { data: protocols = [] } = useQuery({
    queryKey: ['defi-protocols', projectId],
    queryFn: () => base44.entities.DeFiProtocol.filter({ project_id: projectId }),
    enabled: !!projectId
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DeFiProtocol.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defi-protocols', projectId] });
      setShowDialog(false);
      setNewProtocol({ name: '', protocol_type: 'dex', network: 'ethereum', apy: 0, status: 'development' });
      toast.success('Protocol created');
    }
  });

  const handleCreate = () => {
    createMutation.mutate({ ...newProtocol, project_id: projectId });
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState
          icon={TrendingUp}
          title="No Project Selected"
          description="Select a project to build DeFi protocols"
        />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-[#fafbfc]">
      <div className="bg-white/60 backdrop-blur-xl border-b border-gray-200/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900 mb-1">DeFi Hub</h1>
            <p className="text-[11px] text-gray-500">Build decentralized finance protocols</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="h-8 bg-gray-900 hover:bg-gray-800 text-[13px]">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                New Protocol
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-lg">
              <DialogHeader>
                <DialogTitle className="text-base">Create DeFi Protocol</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-[12px]">Protocol Name</Label>
                  <Input
                    value={newProtocol.name}
                    onChange={(e) => setNewProtocol({ ...newProtocol, name: e.target.value })}
                    className="h-9 text-[13px]"
                    placeholder="UniSwap Clone"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[12px]">Type</Label>
                    <Select value={newProtocol.protocol_type} onValueChange={(v) => setNewProtocol({ ...newProtocol, protocol_type: v })}>
                      <SelectTrigger className="h-9 text-[13px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dex">DEX</SelectItem>
                        <SelectItem value="lending">Lending</SelectItem>
                        <SelectItem value="staking">Staking</SelectItem>
                        <SelectItem value="yield_farming">Yield Farming</SelectItem>
                        <SelectItem value="liquidity_pool">Liquidity Pool</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[12px]">Network</Label>
                    <Select value={newProtocol.network} onValueChange={(v) => setNewProtocol({ ...newProtocol, network: v })}>
                      <SelectTrigger className="h-9 text-[13px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ethereum">Ethereum</SelectItem>
                        <SelectItem value="polygon">Polygon</SelectItem>
                        <SelectItem value="bsc">BSC</SelectItem>
                        <SelectItem value="arbitrum">Arbitrum</SelectItem>
                        <SelectItem value="optimism">Optimism</SelectItem>
                        <SelectItem value="base">Base</SelectItem>
                        <SelectItem value="solana">Solana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-[12px]">APY (%)</Label>
                  <Input
                    type="number"
                    value={newProtocol.apy}
                    onChange={(e) => setNewProtocol({ ...newProtocol, apy: parseFloat(e.target.value) })}
                    className="h-9 text-[13px]"
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={!newProtocol.name}
                  className="w-full h-9 bg-gray-900 hover:bg-gray-800 text-[13px]"
                >
                  Create Protocol
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {protocols.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No Protocols Yet"
            description="Create your first DeFi protocol to get started"
            actionLabel="Create Protocol"
            onAction={() => setShowDialog(true)}
          />
        ) : (
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {protocols.map((protocol, i) => {
              const Icon = protocolIcons[protocol.protocol_type] || Network;
              return (
                <motion.div
                  key={protocol.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-[14px]">{protocol.name}</CardTitle>
                            <p className="text-[11px] text-gray-500 capitalize">
                              {protocol.protocol_type.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700 text-[10px]">
                          {protocol.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-gray-500">Network</span>
                        <NetworkBadge network={protocol.network} />
                      </div>
                      {protocol.apy > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-gray-500">APY</span>
                          <span className="text-[13px] font-semibold text-green-600">
                            {protocol.apy}%
                          </span>
                        </div>
                      )}
                      {protocol.total_value_locked && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-gray-500">TVL</span>
                          <span className="text-[13px] font-semibold text-gray-900">
                            ${protocol.total_value_locked}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}