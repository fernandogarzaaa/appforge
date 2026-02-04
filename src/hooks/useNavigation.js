/**
 * Navigation Hook
 * Provides easy access to navigation context
 * Licensed under the Apache License, Version 2.0. See LICENSE for details.
 */
import { useContext } from 'react';
import { NavigationContext } from '@/contexts/NavigationContext';

export function useNavigation() {
  const context = useContext(NavigationContext);
  
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  
  return context;
}
