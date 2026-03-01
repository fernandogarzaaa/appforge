import { useState, useCallback } from 'react';

export interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error' | 'starting';
  pid?: number;
  uptime?: number;
  memory?: number;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'busy' | 'offline';
  lastActivity: Date;
  tasksCompleted: number;
}

export interface QuantumMetrics {
  superpositionStates: number;
  entanglementPairs: number;
  tunnelingEvents: number;
  coherenceTime: number;
  errorRate: number;
}

export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  source: string;
}

export interface AppConfig {
  installPath: string;
  apiKeys: Record<string, string>;
  services: {
    backend: boolean;
    quantumCore: boolean;
    swarm: boolean;
  };
  theme: 'dark' | 'light' | 'system';
}

// Simple state store using React hooks
export function useAppStore() {
  const [isFirstRun, setIsFirstRun] = useState(true);
  const [config, setConfig] = useState<AppConfig>({
    installPath: '',
    apiKeys: {},
    services: {
      backend: true,
      quantumCore: true,
      swarm: true,
    },
    theme: 'dark',
  });

  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Backend', status: 'stopped' },
    { name: 'Quantum Core', status: 'stopped' },
    { name: 'Swarm', status: 'stopped' },
    { name: 'Gateway', status: 'stopped' },
  ]);

  const [agents, setAgents] = useState<Agent[]>([
    { id: '1', name: 'ProductOwner', role: 'The Brain', status: 'idle', lastActivity: new Date(), tasksCompleted: 0 },
    { id: '2', name: 'God Mode', role: 'The Coder', status: 'idle', lastActivity: new Date(), tasksCompleted: 0 },
    { id: '3', name: 'Sentinel', role: 'Security', status: 'idle', lastActivity: new Date(), tasksCompleted: 0 },
    { id: '4', name: 'BugHunter', role: 'QA', status: 'idle', lastActivity: new Date(), tasksCompleted: 0 },
    { id: '5', name: 'Optimizer', role: 'Speed', status: 'idle', lastActivity: new Date(), tasksCompleted: 0 },
  ]);

  const [quantumMetrics, setQuantumMetrics] = useState<QuantumMetrics>({
    superpositionStates: 0,
    entanglementPairs: 0,
    tunnelingEvents: 0,
    coherenceTime: 0,
    errorRate: 0,
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);

  const updateConfig = useCallback((newConfig: Partial<AppConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  const updateServiceStatus = useCallback((name: string, status: Partial<ServiceStatus>) => {
    setServices((prev) =>
      prev.map((s) => (s.name === name ? { ...s, ...status } : s))
    );
  }, []);

  const startService = useCallback(async (name: string) => {
    setServices((prev) =>
      prev.map((s) => (s.name === name ? { ...s, status: 'starting' } : s))
    );

    await new Promise((resolve) => setTimeout(resolve, 1500));

    setServices((prev) =>
      prev.map((s) =>
        s.name === name
          ? { ...s, status: 'running', pid: Math.floor(Math.random() * 10000) + 1000 }
          : s
      )
    );

    addLog({
      level: 'info',
      message: `${name} service started successfully`,
      source: 'system',
    });
  }, []);

  const stopService = useCallback(async (name: string) => {
    setServices((prev) =>
      prev.map((s) =>
        s.name === name ? { ...s, status: 'stopped', pid: undefined } : s
      )
    );

    addLog({
      level: 'info',
      message: `${name} service stopped`,
      source: 'system',
    });
  }, []);

  const updateAgent = useCallback((id: string, updates: Partial<Agent>) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  }, []);

  const updateQuantumMetrics = useCallback((metrics: Partial<QuantumMetrics>) => {
    setQuantumMetrics((prev) => ({ ...prev, ...metrics }));
  }, []);

  const addLog = useCallback((log: Omit<LogEntry, 'timestamp'>) => {
    setLogs((prev) => [
      { ...log, timestamp: new Date() },
      ...prev.slice(0, 499),
    ]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const initializeApp = useCallback(async () => {
    if (config.installPath) {
      setIsFirstRun(false);
    }

    addLog({
      level: 'info',
      message: 'AppForge Desktop initialized',
      source: 'system',
    });
  }, [config.installPath]);

  const shutdownApp = useCallback(async () => {
    for (const service of services) {
      if (service.status === 'running') {
        await stopService(service.name);
      }
    }
  }, [services, stopService]);

  return {
    isFirstRun,
    setFirstRun: setIsFirstRun,
    config,
    updateConfig,
    services,
    updateServiceStatus,
    startService,
    stopService,
    agents,
    updateAgent,
    quantumMetrics,
    updateQuantumMetrics,
    logs,
    addLog,
    clearLogs,
    initializeApp,
    shutdownApp,
  };
}
