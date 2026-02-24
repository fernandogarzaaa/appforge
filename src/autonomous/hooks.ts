/**
 * React Hooks for Autonomous System
 * 
 * Provides React integration for the autonomous system,
 * allowing UI components to interact with autonomous capabilities.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AutonomousSystem,
  getAutonomousSystem,
  AutonomousState,
  Goal,
  Task,
  HealthMetric,
  StrategicPlan,
} from './index';

interface UseAutonomousSystemReturn {
  // State
  state: AutonomousState | null;
  isLoading: boolean;
  error: Error | null;

  // Actions
  createGoal: (name: string, description: string, priority?: any) => Promise<Goal | null>;
  createTask: (name: string, payload: unknown, priority?: any) => Promise<Task | null>;
  setMode: (mode: 'passive' | 'active' | 'aggressive') => void;
  setEnabled: (enabled: boolean) => void;
  createStrategicPlan: (name: string, description: string, objectives: any[]) => Promise<StrategicPlan | null>;
  makeDecision: (description: string, actions: any[], context: any) => Promise<unknown>;
  updateHealthMetric: (metric: HealthMetric) => void;

  // Lifecycle
  pause: () => void;
  resume: () => void;
  shutdown: () => void;
}

/**
 * Hook for accessing the autonomous system
 */
export function useAutonomousSystem(): UseAutonomousSystemReturn {
  const [state, setState] = useState<AutonomousState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const systemRef = useRef<AutonomousSystem | null>(null);

  useEffect(() => {
    try {
      systemRef.current = getAutonomousSystem({ autoStart: true });
      setState(systemRef.current.getState());
      setIsLoading(false);

      // Subscribe to state updates
      const handleStateUpdate = () => {
        if (systemRef.current) {
          setState(systemRef.current.getState());
        }
      };

      systemRef.current.on('status:update', handleStateUpdate);
      systemRef.current.on('cycle:completed', handleStateUpdate);

      return () => {
        systemRef.current?.off('status:update', handleStateUpdate);
        systemRef.current?.off('cycle:completed', handleStateUpdate);
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
    }
  }, []);

  const createGoal = useCallback(async (
    name: string,
    description: string,
    priority: any = 'medium'
  ): Promise<Goal | null> => {
    if (!systemRef.current) return null;
    try {
      return await systemRef.current.createGoal(name, description, priority);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    }
  }, []);

  const createTask = useCallback(async (
    name: string,
    payload: unknown,
    priority: any = 'medium'
  ): Promise<Task | null> => {
    if (!systemRef.current) return null;
    try {
      return await systemRef.current.createTask(name, payload, priority);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    }
  }, []);

  const setMode = useCallback((mode: 'passive' | 'active' | 'aggressive') => {
    systemRef.current?.setMode(mode);
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    systemRef.current?.setEnabled(enabled);
  }, []);

  const createStrategicPlan = useCallback(async (
    name: string,
    description: string,
    objectives: any[]
  ): Promise<StrategicPlan | null> => {
    if (!systemRef.current) return null;
    try {
      return await systemRef.current.createStrategicPlan(name, description, objectives);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    }
  }, []);

  const makeDecision = useCallback(async (
    description: string,
    actions: any[],
    context: any
  ): Promise<unknown> => {
    if (!systemRef.current) return null;
    try {
      return await systemRef.current.makeDecision(description, actions, context);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    }
  }, []);

  const updateHealthMetric = useCallback((metric: HealthMetric) => {
    systemRef.current?.updateHealthMetric(metric);
  }, []);

  const pause = useCallback(() => {
    systemRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    systemRef.current?.resume();
  }, []);

  const shutdown = useCallback(() => {
    systemRef.current?.shutdown();
  }, []);

  return {
    state,
    isLoading,
    error,
    createGoal,
    createTask,
    setMode,
    setEnabled,
    createStrategicPlan,
    makeDecision,
    updateHealthMetric,
    pause,
    resume,
    shutdown,
  };
}

interface UseAutonomousStatsReturn {
  stats: {
    execution: {
      total: number;
      pending: number;
      running: number;
      completed: number;
      failed: number;
    };
    goals: {
      total: number;
      completed: number;
    };
    health: {
      status: string;
      components: number;
      activeHealing: number;
    };
    decisions: {
      total: number;
      active: number;
      successRate: number;
    };
  } | null;
  refresh: () => void;
}

/**
 * Hook for monitoring autonomous system statistics
 */
export function useAutonomousStats(): UseAutonomousStatsReturn {
  const [stats, setStats] = useState<UseAutonomousStatsReturn['stats']>(null);
  const systemRef = useRef(getAutonomousSystem());

  const refresh = useCallback(() => {
    const fullStats = systemRef.current.getStats();
    setStats({
      execution: {
        total: fullStats.execution.tasks.total,
        pending: fullStats.execution.tasks.pending,
        running: fullStats.execution.tasks.running,
        completed: fullStats.execution.tasks.completed,
        failed: fullStats.execution.tasks.failed,
      },
      goals: fullStats.execution.goals,
      health: {
        status: fullStats.healing.systemHealth,
        components: fullStats.healing.components,
        activeHealing: fullStats.healing.activeHealing,
      },
      decisions: {
        total: fullStats.decision.totalDecisions,
        active: fullStats.decision.activeDecisions,
        successRate: fullStats.decision.successRate,
      },
    });
  }, []);

  useEffect(() => {
    refresh();

    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { stats, refresh };
}

interface UseAutonomousHealthReturn {
  health: {
    status: string;
    components: Map<string, HealthMetric>;
    summary: { healthy: number; degraded: number; unhealthy: number; critical: number };
  } | null;
  registerComponent: (name: string) => void;
  updateMetric: (metric: HealthMetric) => void;
}

/**
 * Hook for monitoring and managing health
 */
export function useAutonomousHealth(): UseAutonomousHealthReturn {
  const [health, setHealth] = useState<UseAutonomousHealthReturn['health']>(null);
  const systemRef = useRef(getAutonomousSystem());

  useEffect(() => {
    const updateHealth = () => {
      const healingSystem = systemRef.current.getStats().healing;
      // Access healing system directly through internal reference
      // This is a simplified version - actual implementation would expose healing system state
    };

    systemRef.current.on('health:update', updateHealth);
    
    return () => {
      systemRef.current.off('health:update', updateHealth);
    };
  }, []);

  const registerComponent = useCallback((name: string) => {
    // Would register with healing system
  }, []);

  const updateMetric = useCallback((metric: HealthMetric) => {
    systemRef.current.updateHealthMetric(metric);
  }, []);

  return { health, registerComponent, updateMetric };
}

interface UseAutonomousModeReturn {
  mode: 'passive' | 'active' | 'aggressive';
  enabled: boolean;
  setMode: (mode: 'passive' | 'active' | 'aggressive') => void;
  toggleEnabled: () => void;
}

/**
 * Hook for controlling autonomous mode
 */
export function useAutonomousMode(): UseAutonomousModeReturn {
  const [mode, setModeState] = useState<'useAutonomousModeReturn['mode']>('active');
  const [enabled, setEnabledState] = useState(true);
  const systemRef = useRef(getAutonomousSystem());

  useEffect(() => {
    const state = systemRef.current.getState();
    setModeState(state.config.mode);
    setEnabledState(state.config.enabled);

    const handleModeChange = (newMode: any) => setModeState(newMode);
    const handleEnabledChange = (newEnabled: boolean) => setEnabledState(newEnabled);

    systemRef.current.on('mode:changed', handleModeChange);
    systemRef.current.on('enabled:changed', handleEnabledChange);

    return () => {
      systemRef.current.off('mode:changed', handleModeChange);
      systemRef.current.off('enabled:changed', handleEnabledChange);
    };
  }, []);

  const setMode = useCallback((newMode: 'passive' | 'active' | 'aggressive') => {
    systemRef.current.setMode(newMode);
  }, []);

  const toggleEnabled = useCallback(() => {
    systemRef.current.setEnabled(!enabled);
  }, [enabled]);

  return { mode, enabled, setMode, toggleEnabled };
}
