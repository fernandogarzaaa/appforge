import React from 'react';
import { motion } from 'framer-motion';
import * as Slider from '@radix-ui/react-slider';
import { formatTimestamp } from '@/lib/ReversibleComputing';
import { Clock, Milestone } from 'lucide-react';

/**
 * Interactive timeline slider for time-travel debugging
 * Uses Radix UI Slider with Framer Motion animations
 */
export function TimeSlider({ snapshots, currentIndex, onJumpToSnapshot, className = '' }) {
  if (!snapshots || snapshots.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 text-muted-foreground ${className}`}>
        <Clock className="mr-2 h-5 w-5" />
        <span>No timeline snapshots available</span>
      </div>
    );
  }

  const handleValueChange = (value) => {
    const index = value[0];
    if (index !== currentIndex) {
      onJumpToSnapshot(index);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Timeline header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Milestone className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Execution Timeline</span>
          <span className="text-xs text-muted-foreground">
            ({snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''})
          </span>
        </div>
        
        {currentIndex >= 0 && currentIndex < snapshots.length && (
          <div className="text-xs text-muted-foreground">
            Iteration {snapshots[currentIndex].iteration} • {formatTimestamp(snapshots[currentIndex].timestamp)}
          </div>
        )}
      </div>

      {/* Slider container */}
      <div className="relative px-2 py-4">
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={[currentIndex]}
          max={snapshots.length - 1}
          min={0}
          step={1}
          onValueChange={handleValueChange}
        >
          {/* Track */}
          <Slider.Track className="bg-muted relative grow rounded-full h-2">
            <Slider.Range className="absolute bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full h-full" />
          </Slider.Track>

          {/* Tick marks for snapshots */}
          {snapshots.map((snapshot, idx) => (
            <div
              key={snapshot.id}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${(idx / (snapshots.length - 1)) * 100}%` }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ 
                  scale: idx === currentIndex ? 1.5 : 1,
                  opacity: idx === currentIndex ? 1 : 0.5,
                }}
                transition={{ duration: 0.2 }}
                className={`w-2 h-2 rounded-full ${
                  idx === currentIndex 
                    ? 'bg-indigo-400 ring-2 ring-indigo-300' 
                    : 'bg-purple-300'
                }`}
              />
            </div>
          ))}

          {/* Playhead thumb */}
          <Slider.Thumb
            className="block w-5 h-5 bg-white shadow-lg border-2 border-indigo-500 rounded-full hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 cursor-grab active:cursor-grabbing"
            aria-label="Timeline position"
          />
        </Slider.Root>

        {/* Snapshot labels (show on hover) */}
        <div className="absolute -bottom-1 left-0 right-0 flex justify-between px-2">
          {currentIndex >= 0 && currentIndex < snapshots.length && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-popover border rounded-md shadow-md text-xs whitespace-nowrap"
              style={{ left: `${(currentIndex / (snapshots.length - 1)) * 100}%` }}
            >
              <div className="font-medium">{snapshots[currentIndex].description || 'Snapshot'}</div>
              <div className="text-muted-foreground">
                Phase: {snapshots[currentIndex].phase.toFixed(3)}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Timeline bounds */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Start</span>
        <span>End</span>
      </div>
    </div>
  );
}

export default TimeSlider;
