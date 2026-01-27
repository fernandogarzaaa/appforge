import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MoreHorizontal, ExternalLink, Copy, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import NetworkBadge from './NetworkBadge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const statusStyles = {
  draft: 'bg-gray-100 text-gray-600',
  deploying: 'bg-amber-100 text-amber-600',
  deployed: 'bg-emerald-100 text-emerald-600',
  failed: 'bg-red-100 text-red-600',
};

const typeColors = {
  ERC20: 'from-blue-500 to-cyan-500',
  ERC721: 'from-purple-500 to-pink-500',
  ERC1155: 'from-orange-500 to-red-500',
};

export default function TokenCard({ token, index, onDelete }) {
  const copyAddress = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(token.contract_address);
    toast.success('Address copied!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={createPageUrl('TokenCreator') + `?projectId=${token.project_id}&tokenId=${token.id}`}
        className="block group"
      >
        <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-gray-100/50 hover:border-indigo-100 transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
                typeColors[token.type] || typeColors.ERC20
              )}>
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {token.name}
                  </h3>
                  <Badge variant="outline" className="font-mono text-xs">
                    {token.symbol}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={cn("text-xs", statusStyles[token.status])}>
                    {token.status}
                  </Badge>
                  <NetworkBadge network={token.network} size="sm" />
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                {token.contract_address && (
                  <>
                    <DropdownMenuItem onClick={copyAddress} className="rounded-lg cursor-pointer">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Address
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-lg cursor-pointer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on Explorer
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem
                  onClick={(e) => { e.preventDefault(); onDelete?.(token); }}
                  className="rounded-lg cursor-pointer text-red-600 focus:text-red-600"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Type</p>
              <p className="font-medium">{token.type}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Supply</p>
              <p className="font-medium font-mono">
                {token.total_supply ? Number(token.total_supply).toLocaleString() : '-'}
              </p>
            </div>
          </div>

          {token.contract_address && (
            <div className="mt-4 pt-4 border-t border-gray-50">
              <p className="text-xs text-gray-500 mb-1">Contract Address</p>
              <p className="font-mono text-xs text-gray-700 truncate">
                {token.contract_address}
              </p>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}