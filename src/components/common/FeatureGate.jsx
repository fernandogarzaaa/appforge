import React from 'react';
import { useFeatureFlag } from './FeatureFlagProvider';

export default function FeatureGate({ flag, fallback = null, children }) {
  const { enabled, loading } = useFeatureFlag(flag);

  if (loading) {
    return fallback;
  }

  return enabled ? children : fallback;
}