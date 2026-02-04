import React, { createContext, useState, useContext, useEffect } from 'react';

const ViewModeContext = createContext();

/**
 * View Mode Provider - Manages beginner/advanced mode switching
 * 
 * Beginner Mode:
 * - Simplified UI with larger touch targets
 * - Hides advanced features
 * - Educational hints and tooltips
 * - Limited configuration options
 * 
 * Advanced Mode:
 * - Full feature set visible
 * - Compact layouts
 * - Advanced settings exposed
 * - Power user shortcuts
 */
export function ViewModeProvider({ children }) {
  const [viewMode, setViewMode] = useState(() => {
    // Load from localStorage or default to 'beginner'
    const stored = localStorage.getItem('appforge_view_mode');
    return stored || 'beginner';
  });

  const [unlockedFeatures, setUnlockedFeatures] = useState(() => {
    const stored = localStorage.getItem('appforge_unlocked_features');
    return stored ? JSON.parse(stored) : [];
  });

  // Persist view mode changes
  useEffect(() => {
    localStorage.setItem('appforge_view_mode', viewMode);
  }, [viewMode]);

  // Persist unlocked features
  useEffect(() => {
    localStorage.setItem('appforge_unlocked_features', JSON.stringify(unlockedFeatures));
  }, [unlockedFeatures]);

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'beginner' ? 'advanced' : 'beginner');
  };

  const setMode = (mode) => {
    if (mode === 'beginner' || mode === 'advanced') {
      setViewMode(mode);
    }
  };

  const unlockFeature = (featureId) => {
    if (!unlockedFeatures.includes(featureId)) {
      setUnlockedFeatures(prev => [...prev, featureId]);
    }
  };

  const isFeatureUnlocked = (featureId) => {
    return unlockedFeatures.includes(featureId);
  };

  const isBeginnerMode = viewMode === 'beginner';
  const isAdvancedMode = viewMode === 'advanced';

  const value = {
    viewMode,
    isBeginnerMode,
    isAdvancedMode,
    toggleViewMode,
    setMode,
    unlockedFeatures,
    unlockFeature,
    isFeatureUnlocked,
  };

  return (
    <ViewModeContext.Provider value={value}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}
