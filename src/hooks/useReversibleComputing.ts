import { useState, useEffect, useRef, useCallback } from 'react';
import {
  createReversibleState,
  createStateHistory,
  recordSnapshot,
  rollbackTo,
  getTimeline,
  clearHistory,
  getSnapshotCount,
  getReversibleStateData,
  computeStateDiff
} from '@/lib/ReversibleComputing';

export interface Snapshot {
  id: number;
  iteration: number;
  timestamp: number;
  description: string;
  phase: number;
  state: ReversibleStateData | null;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentIndex: number;
  playbackSpeed: number;
}

export interface UseReversibleComputingReturn {
  // Status
  isReady: boolean;
  error: string | null;
  
  // State
  currentState: ReversibleStateData | null;
  snapshots: Snapshot[];
  currentIndex: number;
  
  // Timeline operations
  recordCurrentSnapshot: (description?: string) => Promise<void>;
  jumpToSnapshot: (index: number) => Promise<void>;
  clearAllSnapshots: () => void;
  
  // Playback controls
  playbackState: PlaybackState;
  play: () => void;
  pause: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  setPlaybackSpeed: (speed: number) => void;
  
  // State operations (for demo purposes)
  applyOperation: (operation: 'toffoli' | 'increment', params?: any) => Promise<void>;
  
  // Stats
  snapshotCount: number;
}

/**
 * React hook for reversible computing with time-travel debugging
 * Manages WASM lifecycle, state snapshots, and playback controls
 */
export function useReversibleComputing(
  initialSize: number = 8,
  maxSnapshots: number = 100
): UseReversibleComputingReturn {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentState, setCurrentState] = useState<ReversibleStateData | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentIndex: -1,
    playbackSpeed: 1.0,
  });

  // Refs for WASM instances (persistent across renders)
  const stateRef = useRef<any>(null);
  const historyRef = useRef<any>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WASM module and create instances
  useEffect(() => {
    const initialize = async () => {
      try {
        // Create reversible state
        const state = await createReversibleState(initialSize);
        if (!state) {
          throw new Error('Failed to create reversible state');
        }
        stateRef.current = state;

        // Create state history manager
        const history = await createStateHistory(maxSnapshots, 5); // Full snapshot every 5 iterations
        if (!history) {
          throw new Error('Failed to create state history');
        }
        historyRef.current = history;

        // Get initial state
        const initialStateData = getReversibleStateData(state);
        setCurrentState(initialStateData);

        // Record initial snapshot
        const success = recordSnapshot(history, state, 'Initial state');
        if (success) {
          const timeline = getTimeline(history);
          const formattedSnapshots = timeline.map((entry, idx) => ({
            id: idx,
            iteration: entry.iteration,
            timestamp: entry.timestamp,
            description: entry.description,
            phase: entry.phase,
            state: idx === 0 ? initialStateData : null, // Only store current state
          }));
          setSnapshots(formattedSnapshots);
          setCurrentIndex(0);
        }

        setIsReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Initialization failed');
        console.error('Reversible computing initialization error:', err);
      }
    };

    initialize();

    // Cleanup
    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
      if (historyRef.current) {
        clearHistory(historyRef.current);
      }
    };
  }, [initialSize, maxSnapshots]);

  // Record current state as snapshot
  const recordCurrentSnapshot = useCallback(async (description: string = '') => {
    if (!isReady || !stateRef.current || !historyRef.current) return;

    try {
      const success = recordSnapshot(historyRef.current, stateRef.current, description);
      if (success) {
        // Update timeline
        const timeline = getTimeline(historyRef.current);
        const currentStateData = getReversibleStateData(stateRef.current);
        
        const formattedSnapshots = timeline.map((entry, idx) => ({
          id: idx,
          iteration: entry.iteration,
          timestamp: entry.timestamp,
          description: entry.description,
          phase: entry.phase,
          state: idx === timeline.length - 1 ? currentStateData : null,
        }));
        
        setSnapshots(formattedSnapshots);
        setCurrentIndex(formattedSnapshots.length - 1);
        setCurrentState(currentStateData);
      }
    } catch (err) {
      console.error('Failed to record snapshot:', err);
    }
  }, [isReady]);

  // Jump to specific snapshot
  const jumpToSnapshot = useCallback(async (index: number) => {
    if (!isReady || !historyRef.current || index < 0 || index >= snapshots.length) return;

    try {
      const targetSnapshot = snapshots[index];
      const restoredStateData = rollbackTo(historyRef.current, targetSnapshot.iteration);
      
      if (restoredStateData) {
        setCurrentState(restoredStateData);
        setCurrentIndex(index);
        setPlaybackState(prev => ({ ...prev, currentIndex: index }));
      }
    } catch (err) {
      console.error('Failed to jump to snapshot:', err);
    }
  }, [isReady, snapshots]);

  // Clear all snapshots
  const clearAllSnapshots = useCallback(() => {
    if (!historyRef.current) return;

    clearHistory(historyRef.current);
    setSnapshots([]);
    setCurrentIndex(-1);
    setCurrentState(null);
  }, []);

  // Playback controls
  const play = useCallback(() => {
    if (playbackTimerRef.current) return; // Already playing

    setPlaybackState(prev => ({ ...prev, isPlaying: true }));

    const interval = 1000 / playbackState.playbackSpeed; // Adjusted by speed
    playbackTimerRef.current = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = prevIndex + 1;
        if (nextIndex >= snapshots.length) {
          // End of timeline
          if (playbackTimerRef.current) {
            clearInterval(playbackTimerRef.current);
            playbackTimerRef.current = null;
          }
          setPlaybackState(prev => ({ ...prev, isPlaying: false }));
          return prevIndex;
        }
        
        jumpToSnapshot(nextIndex);
        return nextIndex;
      });
    }, interval);
  }, [playbackState.playbackSpeed, snapshots.length, jumpToSnapshot]);

  const pause = useCallback(() => {
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    setPlaybackState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const stepForward = useCallback(() => {
    if (currentIndex < snapshots.length - 1) {
      jumpToSnapshot(currentIndex + 1);
    }
  }, [currentIndex, snapshots.length, jumpToSnapshot]);

  const stepBackward = useCallback(() => {
    if (currentIndex > 0) {
      jumpToSnapshot(currentIndex - 1);
    }
  }, [currentIndex, jumpToSnapshot]);

  const setPlaybackSpeed = useCallback((speed: number) => {
    setPlaybackState(prev => ({ ...prev, playbackSpeed: speed }));
  }, []);

  // Apply operations to state (for demo)
  const applyOperation = useCallback(async (
    operation: 'toffoli' | 'increment',
    params?: any
  ) => {
    if (!isReady || !stateRef.current) return;

    try {
      if (operation === 'toffoli') {
        const { control1 = 0, control2 = 1, target = 2 } = params || {};
        stateRef.current.apply_toffoli(control1, control2, target);
      } else if (operation === 'increment') {
        const { index = 0 } = params || {};
        stateRef.current.reversible_increment(index);
      }

      // Record snapshot after operation
      await recordCurrentSnapshot(`Applied ${operation} operation`);
    } catch (err) {
      console.error('Failed to apply operation:', err);
    }
  }, [isReady, recordCurrentSnapshot]);

  const snapshotCount = historyRef.current ? getSnapshotCount(historyRef.current) : 0;

  return {
    isReady,
    error,
    currentState,
    snapshots,
    currentIndex,
    recordCurrentSnapshot,
    jumpToSnapshot,
    clearAllSnapshots,
    playbackState,
    play,
    pause,
    stepForward,
    stepBackward,
    setPlaybackSpeed,
    applyOperation,
    snapshotCount,
  };
}

export default useReversibleComputing;
