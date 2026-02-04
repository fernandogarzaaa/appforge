import { useState, useCallback } from 'react';

/**
 * Hook for NFT template management
 * @returns {Object} NFT utilities
 */
export const useNFTTemplates = () => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);

  const createNFT = useCallback(async (metadata) => {
    setLoading(true);
    try {
      const nft = {
        tokenId: Math.floor(Math.random() * 1000000),
        tokenURI: `ipfs://Qm${Math.random().toString(36).substring(2, 48)}`,
        metadata,
        owner: `0x${Math.random().toString(16).substring(2, 42)}`,
        mintedAt: new Date().toISOString(),
      };
      setNfts(prev => [...prev, nft]);
      return nft;
    } finally {
      setLoading(false);
    }
  }, []);

  const transferNFT = useCallback(async (tokenId, toAddress) => {
    setLoading(true);
    try {
      setNfts(prev => prev.map(nft =>
        nft.tokenId === tokenId ? { ...nft, owner: toAddress } : nft
      ));
      return { success: true, txHash: `0x${Math.random().toString(16).substring(2, 66)}` };
    } finally {
      setLoading(false);
    }
  }, []);

  return { nfts, loading, createNFT, transferNFT };
};
