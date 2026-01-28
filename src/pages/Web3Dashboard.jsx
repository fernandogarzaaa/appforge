import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Coins, Image, FileCode, ArrowRight, Wallet, Activity, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import StatCard from '@/components/dashboard/StatCard';
import TokenCard from '@/components/web3/TokenCard';
import NFTCollectionCard from '@/components/web3/NFTCollectionCard';
import ContractCard from '@/components/web3/ContractCard';
import WalletConnect from '@/components/web3/WalletConnect';
import EmptyState from '@/components/common/EmptyState';
import { motion } from 'framer-motion';

export default function Web3Dashboard() {
  const [wallet, setWallet] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('projectId');

  const { data: tokens = [] } = useQuery({
    queryKey: ['tokens', projectId],
    queryFn: () => base44.entities.Token.filter({ project_id: projectId }, '-created_date', 3),
    enabled: !!projectId,
  });

  const { data: collections = [] } = useQuery({
    queryKey: ['nft-collections', projectId],
    queryFn: () => base44.entities.NFTCollection.filter({ project_id: projectId }, '-created_date', 3),
    enabled: !!projectId,
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', projectId],
    queryFn: () => base44.entities.SmartContract.filter({ project_id: projectId }, '-created_date', 3),
    enabled: !!projectId,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', projectId],
    queryFn: () => base44.entities.Transaction.filter({ project_id: projectId }, '-created_date', 5),
    enabled: !!projectId,
  });

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState
          icon={Wallet}
          title="No Project Selected"
          description="Please select a project to access Web3 features."
        />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Web3 Studio</h1>
          <p className="text-gray-500">Create tokens, NFTs, and smart contracts</p>
        </div>
        <WalletConnect 
          wallet={wallet} 
          onConnect={setWallet} 
          onDisconnect={() => setWallet(null)} 
        />
      </div>

      {/* Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <StatCard
          title="Tokens Created"
          value={tokens.length}
          icon={Coins}
          gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
        />
        <StatCard
          title="NFT Collections"
          value={collections.length}
          icon={Image}
          gradient="bg-gradient-to-br from-purple-500 to-pink-500"
        />
        <StatCard
          title="Smart Contracts"
          value={contracts.length}
          icon={FileCode}
          gradient="bg-gradient-to-br from-green-500 to-emerald-500"
        />
        <StatCard
          title="Transactions"
          value={transactions.length}
          icon={Activity}
          gradient="bg-gradient-to-br from-orange-500 to-red-500"
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
      >
        <Link to={createPageUrl('TokenCreator') + `?projectId=${projectId}`}>
          <Card className="hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  Create Token
                </h3>
                <p className="text-sm text-gray-500">ERC20, ERC721, ERC1155</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('NFTStudio') + `?projectId=${projectId}`}>
          <Card className="hover:shadow-lg hover:border-purple-200 transition-all cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Image className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                  NFT Collection
                </h3>
                <p className="text-sm text-gray-500">Launch your NFT project</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('ContractBuilder') + `?projectId=${projectId}`}>
          <Card className="hover:shadow-lg hover:border-green-200 transition-all cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <FileCode className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                  Smart Contract
                </h3>
                <p className="text-sm text-gray-500">Build & deploy contracts</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      {/* Recent Tokens */}
      {tokens.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Tokens</h2>
            <Link to={createPageUrl('TokenCreator') + `?projectId=${projectId}`}>
              <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700 rounded-xl">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tokens.map((token, index) => (
              <TokenCard key={token.id} token={token} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Collections */}
      {collections.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">NFT Collections</h2>
            <Link to={createPageUrl('NFTStudio') + `?projectId=${projectId}`}>
              <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700 rounded-xl">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((collection, index) => (
              <NFTCollectionCard key={collection.id} collection={collection} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Contracts */}
      {contracts.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Smart Contracts</h2>
            <Link to={createPageUrl('ContractBuilder') + `?projectId=${projectId}`}>
              <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700 rounded-xl">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contracts.map((contract, index) => (
              <ContractCard key={contract.id} contract={contract} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {tokens.length === 0 && collections.length === 0 && contracts.length === 0 && (
        <EmptyState
          icon={Zap}
          title="Start Building Web3"
          description="Create your first token, NFT collection, or smart contract to get started with Web3 development."
        />
      )}
    </div>
  );
}