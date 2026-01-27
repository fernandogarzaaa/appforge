import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Coins, Plus, Search, Rocket, Settings2, Code,
  ChevronRight, Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import NetworkBadge from '@/components/web3/NetworkBadge';
import EmptyState from '@/components/common/EmptyState';
import DeploymentModal from '@/components/web3/DeploymentModal';
import WalletConnect from '@/components/web3/WalletConnect';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const tokenTypes = [
  { value: 'ERC20', label: 'ERC-20', description: 'Fungible token (currencies, points)', icon: '💰' },
  { value: 'ERC721', label: 'ERC-721', description: 'Non-fungible token (unique NFTs)', icon: '🖼️' },
  { value: 'ERC1155', label: 'ERC-1155', description: 'Multi-token (games, collectibles)', icon: '🎮' },
];

const networks = [
  { value: 'ethereum', label: 'Ethereum', icon: '⟠' },
  { value: 'polygon', label: 'Polygon', icon: '⬡' },
  { value: 'bsc', label: 'BNB Chain', icon: '⬡' },
  { value: 'arbitrum', label: 'Arbitrum', icon: '🔷' },
  { value: 'optimism', label: 'Optimism', icon: '🔴' },
  { value: 'base', label: 'Base', icon: '🔵' },
  { value: 'avalanche', label: 'Avalanche', icon: '🔺' },
];

const features = [
  { key: 'mintable', label: 'Mintable', description: 'Allow minting new tokens' },
  { key: 'burnable', label: 'Burnable', description: 'Allow burning tokens' },
  { key: 'pausable', label: 'Pausable', description: 'Pause all token transfers' },
  { key: 'permit', label: 'Permit', description: 'Gasless approvals (EIP-2612)' },
  { key: 'votes', label: 'Votes', description: 'On-chain voting support' },
  { key: 'flash_minting', label: 'Flash Minting', description: 'Flash loan capabilities' },
  { key: 'snapshots', label: 'Snapshots', description: 'Balance snapshots for governance' },
];

export default function TokenCreator() {
  const [selectedToken, setSelectedToken] = useState(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('config');
  const [wallet, setWallet] = useState(null);
  const [newToken, setNewToken] = useState({
    name: '',
    symbol: '',
    type: 'ERC20',
    network: 'ethereum',
    total_supply: '1000000',
    decimals: 18,
    features: {},
  });

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('projectId');
  const tokenIdFromUrl = urlParams.get('tokenId');

  const queryClient = useQueryClient();

  const { data: tokens = [], isLoading } = useQuery({
    queryKey: ['tokens', projectId],
    queryFn: () => base44.entities.Token.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  useEffect(() => {
    if (tokenIdFromUrl && tokens.length > 0) {
      const token = tokens.find(t => t.id === tokenIdFromUrl);
      if (token) setSelectedToken(token);
    }
  }, [tokenIdFromUrl, tokens]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Token.create(data),
    onSuccess: (newToken) => {
      queryClient.invalidateQueries({ queryKey: ['tokens', projectId] });
      setShowNewDialog(false);
      setNewToken({ name: '', symbol: '', type: 'ERC20', network: 'ethereum', total_supply: '1000000', decimals: 18, features: {} });
      setSelectedToken(newToken);
      toast.success('Token created!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Token.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens', projectId] });
      toast.success('Token updated!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Token.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens', projectId] });
      setSelectedToken(null);
      toast.success('Token deleted');
    },
  });

  const filteredTokens = tokens.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeploy = () => {
    setShowDeployModal(true);
  };

  const handleDeploymentComplete = async (deploymentData) => {
    const updatedToken = {
      ...selectedToken,
      ...deploymentData,
    };
    await updateMutation.mutateAsync({ id: selectedToken.id, data: updatedToken });
    setSelectedToken(updatedToken);
    toast.success('Token deployed successfully!');
  };

  const generateContractCode = () => {
    if (!selectedToken || !selectedToken.name || typeof selectedToken.name !== 'string') return '';
    const { name, symbol, type, features } = selectedToken;
    
    if (type === 'ERC20') {
      return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
${features?.burnable ? 'import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";' : ''}
${features?.pausable ? 'import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";' : ''}
${features?.permit ? 'import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";' : ''}
${features?.votes ? 'import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";' : ''}
import "@openzeppelin/contracts/access/Ownable.sol";

contract ${name.replace(/\s+/g, '')} is ERC20${features?.burnable ? ', ERC20Burnable' : ''}${features?.pausable ? ', ERC20Pausable' : ''}${features?.permit ? ', ERC20Permit' : ''}${features?.votes ? ', ERC20Votes' : ''}, Ownable {
    constructor(address initialOwner)
        ERC20("${name}", "${symbol}")
        ${features?.permit ? `ERC20Permit("${name}")` : ''}
        Ownable(initialOwner)
    {
        _mint(msg.sender, ${selectedToken.total_supply} * 10 ** decimals());
    }

    ${features?.mintable ? `function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }` : ''}
    
    ${features?.pausable ? `function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }` : ''}
}`;
    }
    return '// Select a token to view its contract code';
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState icon={Coins} title="No Project Selected" description="Please select a project to create tokens." />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Tokens Sidebar */}
      <div className="w-72 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Tokens</h2>
            <Button size="icon" variant="ghost" onClick={() => setShowNewDialog(true)} className="h-8 w-8 rounded-lg">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tokens..."
              className="pl-9 h-9 rounded-lg bg-gray-50 border-0"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredTokens.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                {searchQuery ? 'No tokens found' : 'No tokens yet'}
              </div>
            ) : (
              <AnimatePresence>
                {filteredTokens.map((token) => (
                  <motion.button
                    key={token.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setSelectedToken(token)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all mb-1",
                      selectedToken?.id === token.id
                        ? "bg-indigo-50 border border-indigo-200"
                        : "hover:bg-gray-50"
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Coins className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{token.name}</p>
                      <p className="text-xs text-gray-500">{token.symbol} • {token.type}</p>
                    </div>
                    <ChevronRight className={cn(
                      "w-4 h-4 text-gray-400 transition-transform",
                      selectedToken?.id === token.id && "rotate-90"
                    )} />
                  </motion.button>
                ))}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Token Editor */}
      <div className="flex-1 bg-gray-50/50 flex flex-col">
        {selectedToken ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Coins className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-semibold">{selectedToken.name}</h1>
                      <span className="font-mono text-gray-500">{selectedToken.symbol}</span>
                      {selectedToken.status === 'deployed' && (
                        <Badge className="bg-green-100 text-green-600">Deployed</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <NetworkBadge network={selectedToken.network} size="sm" />
                      <span className="text-sm text-gray-500">{selectedToken.type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <WalletConnect 
                    wallet={wallet} 
                    onConnect={setWallet} 
                    onDisconnect={() => setWallet(null)} 
                  />
                  <Button
                    onClick={() => updateMutation.mutate({ id: selectedToken.id, data: selectedToken })}
                    variant="outline"
                    className="rounded-xl"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    onClick={handleDeploy}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl"
                    disabled={selectedToken.status === 'deployed'}
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    {selectedToken.status === 'deployed' ? 'Deployed' : 'Deploy'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="bg-white border-b border-gray-100 px-4">
                <TabsList className="h-12 bg-transparent p-0 gap-4">
                  <TabsTrigger value="config" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none px-0">
                    <Settings2 className="w-4 h-4 mr-2" />
                    Configuration
                  </TabsTrigger>
                  <TabsTrigger value="features" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none px-0">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Features
                  </TabsTrigger>
                  <TabsTrigger value="code" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none px-0">
                    <Code className="w-4 h-4 mr-2" />
                    Contract Code
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="config" className="flex-1 m-0 p-6 overflow-auto">
                <div className="max-w-2xl space-y-6">
                  <Card className="rounded-2xl">
                    <CardHeader>
                      <CardTitle>Token Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-600 mb-1.5 block">Name</Label>
                          <Input
                            value={selectedToken.name}
                            onChange={(e) => setSelectedToken({ ...selectedToken, name: e.target.value })}
                            className="h-11 rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600 mb-1.5 block">Symbol</Label>
                          <Input
                            value={selectedToken.symbol}
                            onChange={(e) => setSelectedToken({ ...selectedToken, symbol: e.target.value.toUpperCase() })}
                            className="h-11 rounded-xl font-mono"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-600 mb-1.5 block">Total Supply</Label>
                          <Input
                            value={selectedToken.total_supply}
                            onChange={(e) => setSelectedToken({ ...selectedToken, total_supply: e.target.value })}
                            className="h-11 rounded-xl font-mono"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600 mb-1.5 block">Decimals</Label>
                          <Input
                            type="number"
                            value={selectedToken.decimals}
                            onChange={(e) => setSelectedToken({ ...selectedToken, decimals: parseInt(e.target.value) })}
                            className="h-11 rounded-xl"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl">
                    <CardHeader>
                      <CardTitle>Network</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-2">
                        {networks.map((network) => (
                          <button
                            key={network.value}
                            onClick={() => setSelectedToken({ ...selectedToken, network: network.value })}
                            className={cn(
                              "p-3 rounded-xl border text-center transition-all",
                              selectedToken.network === network.value
                                ? "border-indigo-500 bg-indigo-50"
                                : "border-gray-200 hover:bg-gray-50"
                            )}
                          >
                            <span className="text-xl block mb-1">{network.icon}</span>
                            <span className="text-sm">{network.label}</span>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="features" className="flex-1 m-0 p-6 overflow-auto">
                <div className="max-w-2xl">
                  <Card className="rounded-2xl">
                    <CardHeader>
                      <CardTitle>Token Features</CardTitle>
                      <CardDescription>Enable additional capabilities for your token</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {features.map((feature) => (
                        <div key={feature.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-medium">{feature.label}</p>
                            <p className="text-sm text-gray-500">{feature.description}</p>
                          </div>
                          <Switch
                            checked={selectedToken.features?.[feature.key] || false}
                            onCheckedChange={(v) => setSelectedToken({
                              ...selectedToken,
                              features: { ...selectedToken.features, [feature.key]: v }
                            })}
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="code" className="flex-1 m-0 p-0">
                <div className="h-full bg-[#1e1e1e] p-4">
                  <pre className="text-sm font-mono text-gray-300 overflow-auto h-full">
                    {generateContractCode()}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              icon={Coins}
              title="Select or create a token"
              description="Choose a token from the sidebar to edit, or create a new one."
              actionLabel="Create Token"
              onAction={() => setShowNewDialog(true)}
            />
          </div>
        )}
      </div>

      {/* Deployment Modal */}
      <DeploymentModal
        open={showDeployModal}
        onOpenChange={setShowDeployModal}
        contract={{ ...selectedToken, template: selectedToken?.type }}
        wallet={wallet}
        onDeploymentComplete={handleDeploymentComplete}
        onConnectWallet={() => {}}
      />

      {/* New Token Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create New Token</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm text-gray-600 mb-2 block">Token Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {tokenTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setNewToken({ ...newToken, type: type.value })}
                    className={cn(
                      "p-3 rounded-xl border text-center transition-all",
                      newToken.type === type.value
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <span className="text-2xl block mb-1">{type.icon}</span>
                    <span className="font-medium text-sm">{type.label}</span>
                    <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600 mb-1.5 block">Name</Label>
                <Input
                  value={newToken.name}
                  onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
                  placeholder="My Token"
                  className="h-11 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-600 mb-1.5 block">Symbol</Label>
                <Input
                  value={newToken.symbol}
                  onChange={(e) => setNewToken({ ...newToken, symbol: e.target.value.toUpperCase() })}
                  placeholder="MTK"
                  className="h-11 rounded-xl font-mono"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-600 mb-1.5 block">Network</Label>
              <Select value={newToken.network} onValueChange={(v) => setNewToken({ ...newToken, network: v })}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {networks.map((network) => (
                    <SelectItem key={network.value} value={network.value}>
                      <span className="flex items-center gap-2">
                        <span>{network.icon}</span>
                        <span>{network.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {newToken.type === 'ERC20' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600 mb-1.5 block">Total Supply</Label>
                  <Input
                    value={newToken.total_supply}
                    onChange={(e) => setNewToken({ ...newToken, total_supply: e.target.value })}
                    className="h-11 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 mb-1.5 block">Decimals</Label>
                  <Input
                    type="number"
                    value={newToken.decimals}
                    onChange={(e) => setNewToken({ ...newToken, decimals: parseInt(e.target.value) })}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate({ ...newToken, project_id: projectId, status: 'draft' })}
              disabled={!newToken.name || !newToken.symbol || createMutation.isPending}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Token'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}