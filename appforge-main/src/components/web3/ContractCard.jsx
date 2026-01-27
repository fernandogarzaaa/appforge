import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  MoreHorizontal, ExternalLink, Copy, FileCode, CheckCircle,
  Clock, Users, Lock, Gift, Vote, Coins
} from 'lucide-react';
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
  compiling: 'bg-yellow-100 text-yellow-600',
  deploying: 'bg-amber-100 text-amber-600',
  deployed: 'bg-emerald-100 text-emerald-600',
  verified: 'bg-blue-100 text-blue-600',
  failed: 'bg-red-100 text-red-600',
};

const templateConfig = {
  custom: { icon: FileCode, color: 'from-gray-500 to-gray-600', label: 'Custom' },
  multisig: { icon: Users, color: 'from-blue-500 to-indigo-500', label: 'Multi-Sig' },
  vesting: { icon: Clock, color: 'from-purple-500 to-pink-500', label: 'Vesting' },
  staking: { icon: Coins, color: 'from-green-500 to-emerald-500', label: 'Staking' },
  governance: { icon: Vote, color: 'from-orange-500 to-red-500', label: 'Governance' },
  airdrop: { icon: Gift, color: 'from-pink-500 to-rose-500', label: 'Airdrop' },
  crowdsale: { icon: Coins, color: 'from-yellow-500 to-orange-500', label: 'Crowdsale' },
  timelock: { icon: Lock, color: 'from-cyan-500 to-blue-500', label: 'Timelock' },
};

export default function ContractCard({ contract, index, onDelete }) {
  const template = templateConfig[contract.template] || templateConfig.custom;
  const Icon = template.icon;

  const copyAddress = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(contract.contract_address);
    toast.success('Address copied!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={createPageUrl('ContractBuilder') + `?projectId=${contract.project_id}&contractId=${contract.id}`}
        className="block group"
      >
        <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-gray-100/50 hover:border-indigo-100 transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
                template.color
              )}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {contract.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={cn("text-xs", statusStyles[contract.status])}>
                    {contract.status}
                  </Badge>
                  {contract.verified && (
                    <Badge className="bg-blue-100 text-blue-600 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
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
                {contract.contract_address && (
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
                  onClick={(e) => { e.preventDefault(); onDelete?.(contract); }}
                  className="rounded-lg cursor-pointer text-red-600"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-sm text-gray-500 mb-4 line-clamp-2">
            {contract.description || 'No description'}
          </p>

          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {template.label}
            </Badge>
            <NetworkBadge network={contract.network} size="sm" />
          </div>

          {contract.contract_address && (
            <div className="mt-4 pt-4 border-t border-gray-50">
              <p className="text-xs text-gray-500 mb-1">Contract Address</p>
              <p className="font-mono text-xs text-gray-700 truncate">
                {contract.contract_address}
              </p>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}