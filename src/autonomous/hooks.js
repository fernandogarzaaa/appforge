/**
 * React Hooks for Autonomous System
 *
 * Provides React integration for the autonomous system,
 * allowing UI components to interact with autonomous capabilities.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { getAutonomousSystem, } from './index';
/**
 * Hook for accessing the autonomous system
 */
export function useAutonomousSystem() {
    const [state, setState] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const systemRef = useRef(null);
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
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            setIsLoading(false);
        }
    }, []);
    const createGoal = useCallback(async (name, description, priority = 'medium') => {
        if (!systemRef.current)
            return null;
        try {
            return await systemRef.current.createGoal(name, description, priority);
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            return null;
        }
    }, []);
    const createTask = useCallback(async (name, payload, priority = 'medium') => {
        if (!systemRef.current)
            return null;
        try {
            return await systemRef.current.createTask(name, payload, priority);
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            return null;
        }
    }, []);
    const setMode = useCallback((mode) => {
        systemRef.current?.setMode(mode);
    }, []);
    const setEnabled = useCallback((enabled) => {
        systemRef.current?.setEnabled(enabled);
    }, []);
    const createStrategicPlan = useCallback(async (name, description, objectives) => {
        if (!systemRef.current)
            return null;
        try {
            return await systemRef.current.createStrategicPlan(name, description, objectives);
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            return null;
        }
    }, []);
    const makeDecision = useCallback(async (description, actions, context) => {
        if (!systemRef.current)
            return null;
        try {
            return await systemRef.current.makeDecision(description, actions, context);
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            return null;
        }
    }, []);
    const updateHealthMetric = useCallback((metric) => {
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
/**
 * Hook for monitoring autonomous system statistics
 */
export function useAutonomousStats() {
    const [stats, setStats] = useState(null);
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
/**
 * Hook for monitoring and managing health
 */
export function useAutonomousHealth() {
    const [health, setHealth] = useState(null);
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
    const registerComponent = useCallback((name) => {
        // Would register with healing system
    }, []);
    const updateMetric = useCallback((metric) => {
        systemRef.current.updateHealthMetric(metric);
    }, []);
    return { health, registerComponent, updateMetric };
}
/**
 * Hook for controlling autonomous mode
 */
export function useAutonomousMode() {
    const [mode, setModeState] = useState('active');
    const [enabled, setEnabledState] = useState(true);
    const systemRef = useRef(getAutonomousSystem());
    useEffect(() => {
        const state = systemRef.current.getState();
        setModeState(state.config.mode);
        setEnabledState(state.config.enabled);
        const handleModeChange = (newMode) => setModeState(newMode);
        const handleEnabledChange = (newEnabled) => setEnabledState(newEnabled);
        systemRef.current.on('mode:changed', handleModeChange);
        systemRef.current.on('enabled:changed', handleEnabledChange);
        return () => {
            systemRef.current.off('mode:changed', handleModeChange);
            systemRef.current.off('enabled:changed', handleEnabledChange);
        };
    }, []);
    const setMode = useCallback((newMode) => {
        systemRef.current.setMode(newMode);
    }, []);
    const toggleEnabled = useCallback(() => {
        systemRef.current.setEnabled(!enabled);
    }, [enabled]);
    return { mode, enabled, setMode, toggleEnabled };
}
