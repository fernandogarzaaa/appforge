import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Image, TrendingUp, Heart, ShoppingCart, 
  Eye, Wallet, Award, Filter
} from 'lucide-react';
import { toast } from 'sonner';

const nfts = [
  { id: 1, name: 'Cosmic Explorer #1234', collection: 'Cosmic', price: 2.5, image: '🌌', likes: 342, views: 1240 },
  { id: 2, name: 'CyberPunk Ape #456', collection: 'CyberApes', price: 1.8, image: '🦍', likes: 567, views: 2340 },
  { id: 3, name: 'Digital Dream #789', collection: 'Dreams', price: 3.2, image: '🎨', likes: 234, views: 890 },
  { id: 4, name: 'Pixel Warrior #101', collection: 'Warriors', price: 1.5, image: '⚔️', likes: 456, views: 1560 },
  { id: 5, name: 'Abstract Art #202', collection: 'Abstract', price: 4.1, image: '🖼️', likes: 789, views: 3240 },
  { id: 6, name: 'Neon City #303', collection: 'Cities', price: 2.9, image: '🌆', likes: 623, views: 2120 }
];

const collections = [
  { name: 'Cosmic', floor: 2.1, volume: '1,240 ETH', items: 10000, image: '🌌' },
  { name: 'CyberApes', floor: 1.5, volume: '890 ETH', items: 8888, image: '🦍' },
  { name: 'Dreams', floor: 2.8, volume: '760 ETH', items: 5000, image: '🎨' }
];

export default function NFTMarketplace() {
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [showMintDialog, setShowMintDialog] = useState(false);
  const [liked, setLiked] = useState([]);

  const handleBuy = (nft) => {
    setSelectedNFT(nft);
    setShowBuyDialog(true);
  };

  const confirmPurchase = () => {
    toast.success(`Successfully purchased ${selectedNFT.name}!`);
    setShowBuyDialog(false);
  };

  const toggleLike = (nftId) => {
    if (liked.includes(nftId)) {
      setLiked(liked.filter(id => id !== nftId));
    } else {
      setLiked([...liked, nftId]);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">NFT Marketplace</h1>
          <p className="text-gray-500">Discover, collect, and trade unique digital assets</p>
        </div>
        <Button onClick={() => setShowMintDialog(true)}>
          <Award className="w-4 h-4 mr-2" />
          Mint NFT
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold">8,240 ETH</div>
            <p className="text-sm text-gray-600">Total Volume</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Image className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold">124K</div>
            <p className="text-sm text-gray-600">Total NFTs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold">42K</div>
            <p className="text-sm text-gray-600">Total Owners</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold">2.4 ETH</div>
            <p className="text-sm text-gray-600">Avg. Price</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="explore" className="space-y-6">
        <TabsList>
          <TabsTrigger value="explore">Explore</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="my-nfts">My NFTs</TabsTrigger>
        </TabsList>

        <TabsContent value="explore">
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <Input placeholder="Search NFTs..." className="max-w-sm" />
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* NFT Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nfts.map(nft => (
              <Card key={nft.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                <div className="aspect-square bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-8xl">
                  {nft.image}
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{nft.name}</CardTitle>
                      <p className="text-xs text-gray-600 mt-1">{nft.collection}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLike(nft.id)}
                      className={liked.includes(nft.id) ? 'text-red-500' : ''}
                    >
                      <Heart className={`w-4 h-4 ${liked.includes(nft.id) ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-xs text-gray-600">Current Price</div>
                      <div className="text-lg font-bold">{nft.price} ETH</div>
                    </div>
                    <Button onClick={() => handleBuy(nft)} size="sm">
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      Buy
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {nft.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {nft.views}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="collections">
          <div className="space-y-4">
            {collections.map((collection, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-6">
                    <div className="text-6xl">{collection.image}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{collection.name}</h3>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Floor Price</div>
                          <div className="font-semibold">{collection.floor} ETH</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Volume</div>
                          <div className="font-semibold">{collection.volume}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Items</div>
                          <div className="font-semibold">{collection.items.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                    <Button>View Collection</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trending">
          <div className="text-center py-20">
            <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Trending NFTs</h3>
            <p className="text-gray-500">Check back soon for trending collections</p>
          </div>
        </TabsContent>

        <TabsContent value="my-nfts">
          <div className="text-center py-20">
            <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No NFTs Yet</h3>
            <p className="text-gray-500 mb-4">Start collecting NFTs to see them here</p>
            <Button>Browse Marketplace</Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Buy Dialog */}
      <Dialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase NFT</DialogTitle>
          </DialogHeader>
          {selectedNFT && (
            <div className="space-y-4">
              <div className="aspect-square bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-8xl rounded-lg">
                {selectedNFT.image}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{selectedNFT.name}</h3>
                <p className="text-sm text-gray-600">{selectedNFT.collection}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Price</span>
                  <span className="font-semibold">{selectedNFT.price} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gas Fee (est.)</span>
                  <span className="font-semibold">0.003 ETH</span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg">{(selectedNFT.price + 0.003).toFixed(3)} ETH</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBuyDialog(false)}>Cancel</Button>
            <Button onClick={confirmPurchase}>Confirm Purchase</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mint Dialog */}
      <Dialog open={showMintDialog} onOpenChange={setShowMintDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mint NFT</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">NFT Name</label>
              <Input placeholder="My Awesome NFT" className="mt-1" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Upload Image</label>
              <Input type="file" accept="image/*" className="mt-1" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Description</label>
              <Input placeholder="Describe your NFT..." className="mt-1" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Price (ETH)</label>
              <Input type="number" placeholder="1.0" className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMintDialog(false)}>Cancel</Button>
            <Button onClick={() => {
              toast.success('NFT minted successfully!');
              setShowMintDialog(false);
            }}>
              Mint NFT
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}