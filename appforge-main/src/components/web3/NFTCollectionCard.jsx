import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MoreHorizontal, ExternalLink, Image, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import NetworkBadge from './NetworkBadge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const statusStyles = {
  draft: 'bg-gray-100 text-gray-600',
  deploying: 'bg-amber-100 text-amber-600',
  deployed: 'bg-emerald-100 text-emerald-600',
  minting: 'bg-blue-100 text-blue-600',
  sold_out: 'bg-purple-100 text-purple-600',
};

export default function NFTCollectionCard({ collection, index, onDelete }) {
  const mintProgress = collection.max_supply 
    ? ((collection.minted_count || 0) / collection.max_supply) * 100 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={createPageUrl('NFTStudio') + `?projectId=${collection.project_id}&collectionId=${collection.id}`}
        className="block group"
      >
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-100/50 hover:border-indigo-100 transition-all">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-br from-purple-500 to-pink-500 relative">
            {collection.cover_image ? (
              <img 
                src={collection.cover_image} 
                alt={collection.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Image className="w-12 h-12 text-white/50" />
              </div>
            )}
            <div className="absolute top-3 right-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                  <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg bg-white/90 hover:bg-white">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem className="rounded-lg cursor-pointer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on OpenSea
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => { e.preventDefault(); onDelete?.(collection); }}
                    className="rounded-lg cursor-pointer text-red-600"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {collection.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={cn("text-xs", statusStyles[collection.status])}>
                    {collection.status?.replace('_', ' ')}
                  </Badge>
                  <NetworkBadge network={collection.network} size="sm" />
                </div>
              </div>
              <Badge variant="outline" className="font-mono">
                {collection.symbol}
              </Badge>
            </div>

            {collection.max_supply && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500">Minted</span>
                  <span className="font-medium">
                    {collection.minted_count || 0} / {collection.max_supply}
                  </span>
                </div>
                <Progress value={mintProgress} className="h-2" />
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-gray-500">
                <Users className="w-4 h-4" />
                <span>{collection.minted_count || 0} owners</span>
              </div>
              {collection.mint_price && (
                <span className="font-medium">
                  {collection.mint_price} ETH
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}