import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const FeatureFlagContext = createContext({});

export function FeatureFlagProvider({ children }) {
  const [flags, setFlags] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    try {
      // Get all flags from database
      const allFlags = await base44.entities.FeatureFlag.list();
      const flagMap = {};
      
      for (const flag of allFlags) {
        // Check each flag for current user
        const result = await base44.functions.invoke('checkFeatureFlag', {
          flag_name: flag.name
        });
        flagMap[flag.name] = result.data?.enabled || false;
      }
      
      setFlags(flagMap);
    } catch (error) {
      console.error('Failed to load feature flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const isEnabled = (flagName) => {
    return flags[flagName] === true;
  };

  return (
    <FeatureFlagContext.Provider value={{ flags, isEnabled, loading }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlag(flagName) {
  const { flags, loading } = useContext(FeatureFlagContext);
  return {
    enabled: flags[flagName] === true,
    loading
  };
}

export function useFeatureFlags() {
  return useContext(FeatureFlagContext);
}