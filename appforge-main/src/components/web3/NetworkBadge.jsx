import React from 'react';
import { cn } from '@/lib/utils';

const networkConfig = {
  ethereum: { name: 'Ethereum', color: 'bg-blue-500', icon: '⟠' },
  polygon: { name: 'Polygon', color: 'bg-purple-500', icon: '⬡' },
  bsc: { name: 'BNB Chain', color: 'bg-yellow-500', icon: '⬡' },
  arbitrum: { name: 'Arbitrum', color: 'bg-blue-400', icon: '🔷' },
  optimism: { name: 'Optimism', color: 'bg-red-500', icon: '🔴' },
  base: { name: 'Base', color: 'bg-blue-600', icon: '🔵' },
  avalanche: { name: 'Avalanche', color: 'bg-red-600', icon: '🔺' },
};

export default function NetworkBadge({ network, size = 'default' }) {
  const config = networkConfig[network] || networkConfig.ethereum;
  
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-medium",
      size === 'sm' ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
      "bg-gray-100 text-gray-700"
    )}>
      <span className={cn(
        "rounded-full",
        size === 'sm' ? "w-2 h-2" : "w-2.5 h-2.5",
        config.color
      )} />
      {config.name}
    </div>
  );
}