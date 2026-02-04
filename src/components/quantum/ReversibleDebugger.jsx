import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  RotateCcw, 
  Sparkles, 
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Zap
} from 'lucide-react';
import useReversibleComputing from '@/hooks/useReversibleComputing';
import TimeSlider from './TimeSlider';
import { computeStateDiff } from '@/lib/ReversibleComputing';

/**
 * Complete reversible debugging UI with timeline scrubbing and state inspection
 */
export function ReversibleDebugger() {
  const {
    isReady,
    error,
    currentState,
    snapshots,
    currentIndex,
    recordCurrentSnapshot: _recordCurrentSnapshot,
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
  } = useReversibleComputing(8, 100);

  const [expandedSections, setExpandedSections] = useState({
    amplitudes: true,
    metadata: false,
    diff: true,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Compute diff from previous snapshot
  const previousState = currentIndex > 0 && snapshots[currentIndex - 1]?.state 
    ? snapshots[currentIndex - 1].state 
    : null;
  const diff = currentState ? computeStateDiff(previousState, currentState) : null;

  if (error) {
    return (
      <Card className="p-8 text-center bg-destructive/10 border-destructive">
        <RotateCcw className="h-12 w-12 mx-auto mb-4 text-destructive" />
        <h3 className="text-lg font-semibold mb-2">Initialization Error</h3>
        <p className="text-sm text-muted-foreground">{error}</p>
      </Card>
    );
  }

  if (!isReady) {
    return (
      <Card className="p-8 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <RotateCcw className="h-12 w-12 mx-auto text-primary" />
        </motion.div>
        <p className="mt-4 text-sm text-muted-foreground">Initializing reversible computing engine...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <Card className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-semibold">Time-Reversed Debugger</h3>
            <Badge variant="outline" className="text-xs">
              {snapshotCount} snapshot{snapshotCount !== 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => applyOperation('toffoli', { control1: 0, control2: 1, target: 2 })}
              disabled={!isReady}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Apply Toffoli Gate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => applyOperation('increment', { index: 0 })}
              disabled={!isReady}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Reversible Increment
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={clearAllSnapshots}
              disabled={!isReady || snapshotCount === 0}
            >
              Clear Timeline
            </Button>
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="outline"
              onClick={stepBackward}
              disabled={currentIndex <= 0}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            {playbackState.isPlaying ? (
              <Button size="icon" variant="default" onClick={pause}>
                <Pause className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                size="icon" 
                variant="default" 
                onClick={play}
                disabled={currentIndex >= snapshots.length - 1}
              >
                <Play className="h-4 w-4" />
              </Button>
            )}

            <Button
              size="icon"
              variant="outline"
              onClick={stepForward}
              disabled={currentIndex >= snapshots.length - 1}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Speed:</span>
            {[0.5, 1, 2, 4].map(speed => (
              <Button
                key={speed}
                size="sm"
                variant={playbackState.playbackSpeed === speed ? 'default' : 'outline'}
                onClick={() => setPlaybackSpeed(speed)}
                className="px-2 py-1 text-xs"
              >
                {speed}x
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Main content: Timeline + State viewer */}
      <ResizablePanelGroup direction="vertical" className="min-h-[600px] rounded-lg border">
        {/* Timeline panel */}
        <ResizablePanel defaultSize={30} minSize={20}>
          <Card className="h-full p-4 rounded-none border-0">
            <TimeSlider
              snapshots={snapshots}
              currentIndex={currentIndex}
              onJumpToSnapshot={jumpToSnapshot}
            />
          </Card>
        </ResizablePanel>

        <ResizableHandle withHandle className="" />

        {/* State viewer panel */}
        <ResizablePanel defaultSize={70}>
          <Card className="h-full p-6 rounded-none border-0 overflow-auto">
            {currentState ? (
              <div className="space-y-6">
                {/* Current state metadata */}
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Current State</h4>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Iteration: {currentState.iteration}</span>
                      <span>Phase: {currentState.phase.toFixed(3)} rad</span>
                      <span>Amplitudes: {currentState.amplitudes.length}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>

                {/* Amplitudes section */}
                <div>
                  <button
                    onClick={() => toggleSection('amplitudes')}
                    className="flex items-center gap-2 w-full text-left mb-3 hover:text-primary transition-colors"
                  >
                    {expandedSections.amplitudes ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span className="text-sm font-semibold">Quantum Amplitudes</span>
                  </button>

                  <AnimatePresence>
                    {expandedSections.amplitudes && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="grid grid-cols-4 gap-2"
                      >
                        {currentState.amplitudes.map((amp, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: idx * 0.02 }}
                            className="p-2 bg-muted rounded border text-xs"
                          >
                            <div className="text-muted-foreground mb-1">|ψ[{idx}]⟩</div>
                            <div className="font-mono font-semibold">{amp.toFixed(3)}</div>
                            <div className="mt-1 h-1 bg-background rounded overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                                style={{ width: `${Math.abs(amp) * 100}%` }}
                              />
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* State diff section */}
                {diff && (diff.added.length > 0 || diff.removed.length > 0 || diff.modified.length > 0) && (
                  <div>
                    <button
                      onClick={() => toggleSection('diff')}
                      className="flex items-center gap-2 w-full text-left mb-3 hover:text-primary transition-colors"
                    >
                      {expandedSections.diff ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="text-sm font-semibold">State Changes</span>
                      <Badge variant="outline" className="text-xs">
                        {diff.added.length + diff.removed.length + diff.modified.length} change{diff.added.length + diff.removed.length + diff.modified.length !== 1 ? 's' : ''}
                      </Badge>
                    </button>

                    <AnimatePresence>
                      {expandedSections.diff && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-2"
                        >
                          {diff.added.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                              <span className="font-mono">+</span>
                              <span>{item}</span>
                            </div>
                          ))}
                          {diff.removed.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                              <span className="font-mono">-</span>
                              <span>{item}</span>
                            </div>
                          ))}
                          {diff.modified.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400">
                              <span className="font-mono">~</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>No state selected</p>
              </div>
            )}
          </Card>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export default ReversibleDebugger;
