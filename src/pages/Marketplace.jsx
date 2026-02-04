import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MarketplaceExplorer from '@/components/marketplace/MarketplaceExplorer';
import { Store, TrendingUp } from 'lucide-react';

export default function Marketplace() {
  const [selectedAsset, setSelectedAsset] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Store className="w-8 h-8" />
            AI Solutions Marketplace
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover, share, and community-drive the evolution of AI agents and workflows
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-green-200">
            <CardContent className="p-4">
              <p className="text-xs text-gray-600 mb-1">Community Contributors</p>
              <p className="text-2xl font-bold text-green-600">1,240</p>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="p-4">
              <p className="text-xs text-gray-600 mb-1">Assets Published</p>
              <p className="text-2xl font-bold text-green-600">3,847</p>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="p-4">
              <p className="text-xs text-gray-600 mb-1">Total Downloads</p>
              <p className="text-2xl font-bold text-green-600">45.2K</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="explore" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="explore" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Explore
            </TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="my-assets">My Assets</TabsTrigger>
          </TabsList>

          <TabsContent value="explore">
            <MarketplaceExplorer onSelectAsset={setSelectedAsset} />
          </TabsContent>

          <TabsContent value="trending">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-600">Top-rated assets by community downloads and engagement</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-assets">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-600">Your published assets and analytics</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}