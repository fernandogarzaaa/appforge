import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Image, Plus, Search, Upload, Rocket, Settings2,
  ChevronRight, Grid3X3, Percent, Users, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
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
import NFTCollectionCard from '@/components/web3/NFTCollectionCard';
import NetworkBadge from '@/components/web3/NetworkBadge';
import EmptyState from '@/components/common/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const networks = [
  { value: 'ethereum', label: 'Ethereum', icon: '⟠' },
  { value: 'polygon', label: 'Polygon', icon: '⬡' },
  { value: 'base', label: 'Base', icon: '🔵' },
  { value: 'arbitrum', label: 'Arbitrum', icon: '🔷' },
  { value: 'optimism', label: 'Optimism', icon: '🔴' },
];

export default function NFTStudio() {
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [newCollection, setNewCollection] = useState({
    name: '',
    symbol: '',
    description: '',
    network: 'ethereum',
    contract_type: 'ERC721',
    max_supply: 10000,
    mint_price: '0.05',
    royalty_percentage: 5,
    features: { public_mint: true },
  });

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('projectId');
  const collectionIdFromUrl = urlParams.get('collectionId');

  const queryClient = useQueryClient();

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['nft-collections', projectId],
    queryFn: () => base44.entities.NFTCollection.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  useEffect(() => {
    if (collectionIdFromUrl && collections.length > 0) {
      const collection = collections.find(c => c.id === collectionIdFromUrl);
      if (collection) setSelectedCollection(collection);
    }
  }, [collectionIdFromUrl, collections]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.NFTCollection.create(data),
    onSuccess: (newCollection) => {
      queryClient.invalidateQueries({ queryKey: ['nft-collections', projectId] });
      setShowNewDialog(false);
      setNewCollection({
        name: '', symbol: '', description: '', network: 'ethereum', contract_type: 'ERC721',
        max_supply: 10000, mint_price: '0.05', royalty_percentage: 5, features: { public_mint: true },
      });
      setSelectedCollection(newCollection);
      toast.success('Collection created!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.NFTCollection.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nft-collections', projectId] });
      toast.success('Collection updated!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.NFTCollection.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nft-collections', projectId] });
      setSelectedCollection(null);
      toast.success('Collection deleted');
    },
  });

  const filteredCollections = collections.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setSelectedCollection({ ...selectedCollection, cover_image: file_url });
    toast.success('Image uploaded!');
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState icon={Image} title="No Project Selected" description="Please select a project to create NFT collections." />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Collections Sidebar */}
      <div className="w-72 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Collections</h2>
            <Button size="icon" variant="ghost" onClick={() => setShowNewDialog(true)} className="h-8 w-8 rounded-lg">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search collections..."
              className="pl-9 h-9 rounded-lg bg-gray-50 border-0"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredCollections.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                {searchQuery ? 'No collections found' : 'No collections yet'}
              </div>
            ) : (
              <AnimatePresence>
                {filteredCollections.map((collection) => (
                  <motion.button
                    key={collection.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setSelectedCollection(collection)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all mb-1",
                      selectedCollection?.id === collection.id
                        ? "bg-purple-50 border border-purple-200"
                        : "hover:bg-gray-50"
                    )}
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                      {collection.cover_image ? (
                        <img src={collection.cover_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Image className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{collection.name}</p>
                      <p className="text-xs text-gray-500">{collection.symbol} • {collection.max_supply} items</p>
                    </div>
                    <ChevronRight className={cn(
                      "w-4 h-4 text-gray-400 transition-transform",
                      selectedCollection?.id === collection.id && "rotate-90"
                    )} />
                  </motion.button>
                ))}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Collection Editor */}
      <div className="flex-1 bg-gray-50/50 flex flex-col">
        {selectedCollection ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                    {selectedCollection.cover_image ? (
                      <img src={selectedCollection.cover_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-semibold">{selectedCollection.name}</h1>
                      <span className="font-mono text-gray-500">{selectedCollection.symbol}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <NetworkBadge network={selectedCollection.network} size="sm" />
                      <span className="text-sm text-gray-500">{selectedCollection.contract_type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => updateMutation.mutate({ id: selectedCollection.id, data: selectedCollection })}
                    variant="outline"
                    className="rounded-xl"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl"
                    disabled={selectedCollection.status === 'deployed'}
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    {selectedCollection.status === 'deployed' ? 'Deployed' : 'Deploy'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="bg-white border-b border-gray-100 px-4">
                <TabsList className="h-12 bg-transparent p-0 gap-4">
                  <TabsTrigger value="details" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none px-0">
                    <Settings2 className="w-4 h-4 mr-2" />
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="minting" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none px-0">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Minting
                  </TabsTrigger>
                  <TabsTrigger value="royalties" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none px-0">
                    <Percent className="w-4 h-4 mr-2" />
                    Royalties
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="details" className="flex-1 m-0 p-6 overflow-auto">
                <div className="max-w-2xl space-y-6">
                  <Card className="rounded-2xl">
                    <CardHeader>
                      <CardTitle>Collection Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Cover Image */}
                      <div>
                        <Label className="text-sm text-gray-600 mb-2 block">Cover Image</Label>
                        <div className="flex items-center gap-4">
                          <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                            {selectedCollection.cover_image ? (
                              <img src={selectedCollection.cover_image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Image className="w-8 h-8 text-white/50" />
                            )}
                          </div>
                          <label className="cursor-pointer">
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            <Button variant="outline" className="rounded-xl" asChild>
                              <span><Upload className="w-4 h-4 mr-2" />Upload Image</span>
                            </Button>
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-600 mb-1.5 block">Name</Label>
                          <Input
                            value={selectedCollection.name}
                            onChange={(e) => setSelectedCollection({ ...selectedCollection, name: e.target.value })}
                            className="h-11 rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600 mb-1.5 block">Symbol</Label>
                          <Input
                            value={selectedCollection.symbol}
                            onChange={(e) => setSelectedCollection({ ...selectedCollection, symbol: e.target.value.toUpperCase() })}
                            className="h-11 rounded-xl font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm text-gray-600 mb-1.5 block">Description</Label>
                        <Textarea
                          value={selectedCollection.description || ''}
                          onChange={(e) => setSelectedCollection({ ...selectedCollection, description: e.target.value })}
                          className="rounded-xl resize-none h-24"
                        />
                      </div>

                      <div>
                        <Label className="text-sm text-gray-600 mb-1.5 block">Network</Label>
                        <div className="grid grid-cols-5 gap-2">
                          {networks.map((network) => (
                            <button
                              key={network.value}
                              onClick={() => setSelectedCollection({ ...selectedCollection, network: network.value })}
                              className={cn(
                                "p-3 rounded-xl border text-center transition-all",
                                selectedCollection.network === network.value
                                  ? "border-purple-500 bg-purple-50"
                                  : "border-gray-200 hover:bg-gray-50"
                              )}
                            >
                              <span className="text-lg block">{network.icon}</span>
                              <span className="text-xs">{network.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="minting" className="flex-1 m-0 p-6 overflow-auto">
                <div className="max-w-2xl space-y-6">
                  <Card className="rounded-2xl">
                    <CardHeader>
                      <CardTitle>Minting Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-600 mb-1.5 block">Max Supply</Label>
                          <Input
                            type="number"
                            value={selectedCollection.max_supply || ''}
                            onChange={(e) => setSelectedCollection({ ...selectedCollection, max_supply: parseInt(e.target.value) })}
                            className="h-11 rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600 mb-1.5 block">Mint Price (ETH)</Label>
                          <Input
                            value={selectedCollection.mint_price || ''}
                            onChange={(e) => setSelectedCollection({ ...selectedCollection, mint_price: e.target.value })}
                            className="h-11 rounded-xl font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-medium">Public Minting</p>
                            <p className="text-sm text-gray-500">Allow anyone to mint</p>
                          </div>
                          <Switch
                            checked={selectedCollection.features?.public_mint || false}
                            onCheckedChange={(v) => setSelectedCollection({
                              ...selectedCollection,
                              features: { ...selectedCollection.features, public_mint: v }
                            })}
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-medium">Whitelist</p>
                            <p className="text-sm text-gray-500">Enable whitelist for early access</p>
                          </div>
                          <Switch
                            checked={selectedCollection.features?.whitelist || false}
                            onCheckedChange={(v) => setSelectedCollection({
                              ...selectedCollection,
                              features: { ...selectedCollection.features, whitelist: v }
                            })}
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-medium">Delayed Reveal</p>
                            <p className="text-sm text-gray-500">Hide metadata until reveal</p>
                          </div>
                          <Switch
                            checked={selectedCollection.features?.reveal || false}
                            onCheckedChange={(v) => setSelectedCollection({
                              ...selectedCollection,
                              features: { ...selectedCollection.features, reveal: v }
                            })}
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm text-gray-600 mb-1.5 block">Max Per Wallet</Label>
                        <Input
                          type="number"
                          value={selectedCollection.features?.max_per_wallet || ''}
                          onChange={(e) => setSelectedCollection({
                            ...selectedCollection,
                            features: { ...selectedCollection.features, max_per_wallet: parseInt(e.target.value) }
                          })}
                          placeholder="Unlimited"
                          className="h-11 rounded-xl"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="royalties" className="flex-1 m-0 p-6 overflow-auto">
                <div className="max-w-2xl">
                  <Card className="rounded-2xl">
                    <CardHeader>
                      <CardTitle>Royalty Settings</CardTitle>
                      <CardDescription>Earn royalties on secondary sales</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm text-gray-600">Royalty Percentage</Label>
                          <span className="text-lg font-semibold">{selectedCollection.royalty_percentage || 0}%</span>
                        </div>
                        <Slider
                          value={[selectedCollection.royalty_percentage || 0]}
                          onValueChange={([v]) => setSelectedCollection({ ...selectedCollection, royalty_percentage: v })}
                          max={15}
                          step={0.5}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-2">Recommended: 2.5% - 10%</p>
                      </div>

                      <div>
                        <Label className="text-sm text-gray-600 mb-1.5 block">Royalty Recipient Address</Label>
                        <Input
                          value={selectedCollection.royalty_recipient || ''}
                          onChange={(e) => setSelectedCollection({ ...selectedCollection, royalty_recipient: e.target.value })}
                          placeholder="0x..."
                          className="h-11 rounded-xl font-mono"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              icon={Image}
              title="Select or create a collection"
              description="Choose a collection from the sidebar to edit, or create a new one."
              actionLabel="Create Collection"
              onAction={() => setShowNewDialog(true)}
            />
          </div>
        )}
      </div>

      {/* New Collection Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create NFT Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600 mb-1.5 block">Name</Label>
                <Input
                  value={newCollection.name}
                  onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                  placeholder="My Collection"
                  className="h-11 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-600 mb-1.5 block">Symbol</Label>
                <Input
                  value={newCollection.symbol}
                  onChange={(e) => setNewCollection({ ...newCollection, symbol: e.target.value.toUpperCase() })}
                  placeholder="MYC"
                  className="h-11 rounded-xl font-mono"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-600 mb-1.5 block">Description</Label>
              <Textarea
                value={newCollection.description}
                onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
                placeholder="Describe your collection..."
                className="rounded-xl resize-none h-20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600 mb-1.5 block">Max Supply</Label>
                <Input
                  type="number"
                  value={newCollection.max_supply}
                  onChange={(e) => setNewCollection({ ...newCollection, max_supply: parseInt(e.target.value) })}
                  className="h-11 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-600 mb-1.5 block">Mint Price (ETH)</Label>
                <Input
                  value={newCollection.mint_price}
                  onChange={(e) => setNewCollection({ ...newCollection, mint_price: e.target.value })}
                  className="h-11 rounded-xl font-mono"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-600 mb-1.5 block">Network</Label>
              <Select value={newCollection.network} onValueChange={(v) => setNewCollection({ ...newCollection, network: v })}>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate({ ...newCollection, project_id: projectId, status: 'draft', minted_count: 0 })}
              disabled={!newCollection.name || !newCollection.symbol || createMutation.isPending}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Collection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}