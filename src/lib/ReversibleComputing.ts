// TypeScript adapter for reversible computing WASM module
// Provides type-safe access to Toffoli gates, state snapshots, and time-travel debugging

let wasmModule: any = null;

// Safe JSON parsing utilities
const safeParse = (jsonString: string) => {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error('Failed to parse JSON from WASM:', e);
    return null;
  }
};

const safeStringify = (obj: any) => {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    console.error('Failed to stringify object for WASM:', e);
    return '{}';
  }
};

// Type definitions
export interface ReversibleStateData {
  amplitudes: number[];
  phase: number;
  iteration: number;
  metadata: Record<string, any>;
}

export interface SnapshotMetadata {
  iteration: number;
  timestamp: number;
  description: string;
  phase: number;
}

export interface TimelineEntry {
  iteration: number;
  timestamp: number;
  description: string;
  phase: number;
}

// WASM module initialization
export const initReversibleComputing = async () => {
  if (wasmModule) return wasmModule;

  try {
    // @ts-ignore - WASM module will be available after build
    const wasm = await import('@/quantum-core/pkg/quantum_core');
    wasmModule = wasm;
    return wasm;
  } catch (error) {
    console.error('Failed to initialize reversible computing WASM:', error);
    return null;
  }
};

// ReversibleState wrapper
export const createReversibleState = async (size: number) => {
  const wasm = await initReversibleComputing();
  if (!wasm) return null;

  try {
    return new wasm.ReversibleState(size);
  } catch (error) {
    console.error('Failed to create reversible state:', error);
    return null;
  }
};

export const applyToffoli = (
  state: any,
  control1: number,
  control2: number,
  target: number
): boolean => {
  if (!state) return false;

  try {
    return state.apply_toffoli(control1, control2, target);
  } catch (error) {
    console.error('Failed to apply Toffoli gate:', error);
    return false;
  }
};

export const reversibleIncrement = (state: any, index: number): boolean => {
  if (!state) return false;

  try {
    return state.reversible_increment(index);
  } catch (error) {
    console.error('Failed to apply reversible increment:', error);
    return false;
  }
};

export const getReversibleStateData = (state: any): ReversibleStateData | null => {
  if (!state) return null;

  try {
    const jsonString = state.to_json();
    return safeParse(jsonString);
  } catch (error) {
    console.error('Failed to get state data:', error);
    return null;
  }
};

export const getStateIteration = (state: any): number => {
  if (!state) return 0;
  try {
    return state.iteration;
  } catch (error) {
    return 0;
  }
};

export const getStatePhase = (state: any): number => {
  if (!state) return 0;
  try {
    return state.phase;
  } catch (error) {
    return 0;
  }
};

// StateHistory wrapper
export const createStateHistory = async (
  maxSnapshots: number = 100,
  snapshotInterval: number = 10
) => {
  const wasm = await initReversibleComputing();
  if (!wasm) return null;

  try {
    return new wasm.StateHistory(maxSnapshots, snapshotInterval);
  } catch (error) {
    console.error('Failed to create state history:', error);
    return null;
  }
};

export const recordSnapshot = (
  history: any,
  state: any,
  description: string = ''
): boolean => {
  if (!history || !state) return false;

  try {
    return history.record_snapshot(state, description);
  } catch (error) {
    console.error('Failed to record snapshot:', error);
    return false;
  }
};

export const rollbackTo = (
  history: any,
  targetIteration: number
): ReversibleStateData | null => {
  if (!history) return null;

  try {
    const jsonString = history.rollback_to(targetIteration);
    if (!jsonString) return null;
    return safeParse(jsonString);
  } catch (error) {
    console.error('Failed to rollback state:', error);
    return null;
  }
};

export const getTimeline = (history: any): TimelineEntry[] => {
  if (!history) return [];

  try {
    const jsonString = history.get_timeline();
    const timeline = safeParse(jsonString);
    return timeline || [];
  } catch (error) {
    console.error('Failed to get timeline:', error);
    return [];
  }
};

export const clearHistory = (history: any): void => {
  if (!history) return;

  try {
    history.clear();
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
};

export const getSnapshotCount = (history: any): number => {
  if (!history) return 0;

  try {
    return history.snapshot_count;
  } catch (error) {
    return 0;
  }
};

// High-level playback utilities
export interface PlaybackControls {
  play: () => void;
  pause: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  jumpToIteration: (iteration: number) => void;
  setPlaybackSpeed: (speed: number) => void;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentIteration: number;
  totalIterations: number;
  playbackSpeed: number; // Multiplier (1.0 = normal speed)
}

// Compute state diff for visualization
export const computeStateDiff = (
  prevState: ReversibleStateData | null,
  currentState: ReversibleStateData | null
): { added: string[]; removed: string[]; modified: string[] } => {
  const diff = { added: [] as string[], removed: [] as string[], modified: [] as string[] };
  
  if (!prevState || !currentState) return diff;

  // Compare amplitudes
  for (let i = 0; i < Math.max(prevState.amplitudes.length, currentState.amplitudes.length); i++) {
    const prevAmp = prevState.amplitudes[i] ?? 0;
    const currAmp = currentState.amplitudes[i] ?? 0;
    
    if (prevAmp === undefined && currAmp !== undefined) {
      diff.added.push(`amplitude[${i}] = ${currAmp.toFixed(3)}`);
    } else if (prevAmp !== undefined && currAmp === undefined) {
      diff.removed.push(`amplitude[${i}]`);
    } else if (Math.abs(prevAmp - currAmp) > 1e-10) {
      diff.modified.push(`amplitude[${i}]: ${prevAmp.toFixed(3)} → ${currAmp.toFixed(3)}`);
    }
  }

  // Compare phase
  if (Math.abs(prevState.phase - currentState.phase) > 1e-10) {
    diff.modified.push(`phase: ${prevState.phase.toFixed(3)} → ${currentState.phase.toFixed(3)}`);
  }

  return diff;
};

// Format timestamp for display
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    fractionalSecondDigits: 3
  });
};

export default {
  initReversibleComputing,
  createReversibleState,
  applyToffoli,
  reversibleIncrement,
  getReversibleStateData,
  getStateIteration,
  getStatePhase,
  createStateHistory,
  recordSnapshot,
  rollbackTo,
  getTimeline,
  clearHistory,
  getSnapshotCount,
  computeStateDiff,
  formatTimestamp,
};
