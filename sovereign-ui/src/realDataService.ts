/**
 * Real Data Service for Sovereign Native App
 * Fetches actual system metrics from Quantum Engine and Oracle
 *
 * Uses real data from swarm_telemetry_server on port 3001
 */

import { io, Socket } from 'socket.io-client';

// Types for real system data
export interface SystemMetrics {
  coherence: number;
  latency: number;
  scalability: number;
  throughput: number;
  activeNodes: number;
  totalNodes: number;
  memoryUsage: number;
  cpuUsage: number;
  bridgeStatus?: { online: boolean; latency: number };
  compressionRatio?: number;
}

export interface SwarmData {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'training' | 'error';
  successRate: number;
  revenue: number;
  tasks: number;
  efficiency: number;
  agents: string[];
}

export interface EvolutionData {
  totalCycles: number;
  totalPRsCreated: number;
  totalMerges: number;
  lastMutationScore: number;
  mutationHistory: Array<{ cycle: number; score: number; timestamp: string }>;
}

export interface RealTimeData {
  systemMetrics: SystemMetrics;
  swarms: SwarmData[];
  evolution?: EvolutionData;
  lastUpdated: string;
  isDemo: boolean; // True when using simulated data
  bridgeStatus?: { online: boolean; latency: number };
}

// Real data service that connects to swarm_telemetry_server
class RealDataService {
  private socket: Socket | null = null;
  private callbacks: Set<(data: RealTimeData) => void> = new Set();
  private intervalId: number | null = null;
  private currentMetrics: SystemMetrics;
  private realSwarms: SwarmData[] = [];
  private isConnected: boolean = false;
  private currentEvolution?: EvolutionData;

  constructor() {
    this.currentMetrics = {
      coherence: 0.96,
      latency: 42,
      scalability: 0.94,
      throughput: 0.91,
      activeNodes: 6,
      totalNodes: 6,
      memoryUsage: 0.48,
      cpuUsage: 0.35,
      bridgeStatus: { online: true, latency: 45 },
      compressionRatio: 0.65
    };
  }

  // Initialize socket connection
  connect(): Promise<void> {
    return new Promise((resolve) => {
      try {
        this.socket = io('http://localhost:3001', {
          timeout: 5000,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000
        });

        this.socket.on('connect', () => {
          console.log('[RealDataService] Connected to telemetry server');
          this.isConnected = true;
          resolve();
        });

        this.socket.on('disconnect', () => {
          console.warn('[RealDataService] Disconnected from server');
          this.isConnected = false;
        });

        this.socket.on('connect_error', () => {
          console.warn('[RealDataService] Connection failed, using fallback data');
          this.isConnected = false;
          resolve();
        });

        // Listen for real-time updates
        this.socket.on('metrics', (data: Partial<SystemMetrics>) => {
          this.currentMetrics = { ...this.currentMetrics, ...data };
          this.notifyCallbacks();
        });

        // Listen for specific bridge updates
        this.socket.on('bridge_update', (data: { online: boolean, latency: number, compression?: number }) => {
          this.currentMetrics.bridgeStatus = { online: data.online, latency: data.latency };
          if (data.compression) this.currentMetrics.compressionRatio = data.compression;
          this.notifyCallbacks();
        });

        // Listen for swarm registry updates (REAL DATA FROM SERVER)
        this.socket.on('swarm_update', (swarms: SwarmData[]) => {
          console.log(`[RealDataService] Received ${swarms.length} swarms from server`);
          this.realSwarms = swarms;
          this.notifyCallbacks();
        });

        // Listen for evolution updates
        this.socket.on('evolution_update', (data: EvolutionData) => {
          console.log('[RealDataService] Evolution update received');
          this.currentEvolution = data;
          this.notifyCallbacks();
        });

        // Listen for swarm_state updates
        this.socket.on('swarm_state', (state: { coherence?: number, bridge?: any }) => {
          if (state.coherence) {
            this.currentMetrics.coherence = state.coherence;
          }
          if (state.bridge) {
            this.currentMetrics.bridgeStatus = state.bridge;
          }
          this.notifyCallbacks();
        });
      } catch {
        console.warn('[RealDataService] Socket unavailable, using fallback data');
        this.isConnected = false;
        resolve();
      }
    });
  }

  // Disconnect from socket
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.callbacks.clear();
  }

  // Subscribe to real-time updates
  subscribe(callback: (data: RealTimeData) => void): () => void {
    this.callbacks.add(callback);
    // Return unsubscribe function
    return () => this.callbacks.delete(callback);
  }

  // Notify all subscribers
  private notifyCallbacks(): void {
    const data = this.getRealTimeData();
    this.callbacks.forEach(cb => cb(data));
  }

  // Get current real-time data
  getRealTimeData(): RealTimeData {
    const hasRealData = this.isConnected && this.realSwarms.length > 0;
    return {
      systemMetrics: { ...this.currentMetrics },
      swarms: hasRealData ? this.realSwarms : [],
      evolution: this.currentEvolution || {
        totalCycles: 0,
        totalPRsCreated: 0,
        totalMerges: 0,
        lastMutationScore: 0,
        mutationHistory: []
      },
      lastUpdated: new Date().toISOString(),
      isDemo: !this.isConnected,
      bridgeStatus: this.currentMetrics.bridgeStatus
    };
  }

  // Default swarms - REMOVED for True Sovereignty
  private getDefaultSwarms(): SwarmData[] {
    return [];
  }

  // Default evolution state - REMOVED for True Sovereignty
  private getDefaultEvolution(): EvolutionData {
    return {
      totalCycles: 0,
      totalPRsCreated: 0,
      totalMerges: 0,
      lastMutationScore: 0,
      mutationHistory: []
    };
  }

  // Generate revenue data from REAL history only
  getRevenueData(): { time: number; value: number }[] {
    // Purged simulation: return empty if no real history
    return [];
  }

  // Get system coherence from quantum engine
  getCoherence(): number {
    return this.isConnected ? this.currentMetrics.coherence : 0;
  }

  // Get system latency from quantum engine
  getLatency(): number {
    return this.isConnected ? this.currentMetrics.latency : 0;
  }

  // Check if connected to real server
  isRealTimeConnected(): boolean {
    return this.isConnected;
  }

  // Purged: No longer auto-generating fake metric drifts
  startRealTimeUpdates(intervalMs: number = 5000): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    // Only poll or wait for socket events
  }

  // Get swarm data directly (returns array of swarms)
  getRealSwarmData(): SwarmData[] {
    return this.realSwarms.length > 0 ? this.realSwarms : this.getDefaultSwarms();
  }

  // Tune quantum parameters
  tuneQuantum(params: any): void {
    if (this.socket && this.isConnected) {
      console.log('[RealDataService] Sending tune request:', params);
      this.socket.emit('tune_quantum', params);
    } else {
      console.warn('[RealDataService] Cannot tune: not connected to telemetry server');
    }
  }
}

// Singleton instance
export const realDataService = new RealDataService();
