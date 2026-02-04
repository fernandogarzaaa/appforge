import React from 'react';
import { motion } from 'framer-motion';
import { Zap, ZapOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useViewMode } from '@/contexts/ViewModeContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * View Mode Toggle - Switches between Beginner and Advanced modes
 * Fixed position bottom-left corner
 */
export function ViewModeToggle() {
  const { toggleViewMode, isBeginnerMode, isAdvancedMode } = useViewMode();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className="fixed bottom-6 left-6 z-50"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              onClick={toggleViewMode}
              variant={isAdvancedMode ? 'default' : 'outline'}
              size="lg"
              className={`
                rounded-full shadow-lg transition-all duration-200 min-h-11 px-4
                ${isAdvancedMode 
                  ? 'spectrum-gradient-primary text-white hover:shadow-xl dark:shadow-indigo-900/50' 
                  : 'bg-white dark:bg-slate-900 dark:border-slate-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
                }
              `}
            >
              <motion.div
                initial={false}
                animate={{ rotate: isAdvancedMode ? 0 : 180 }}
                transition={{ duration: 0.3 }}
                className="mr-2"
              >
                {isAdvancedMode ? (
                  <Zap className="h-5 w-5" />
                ) : (
                  <ZapOff className="h-5 w-5" />
                )}
              </motion.div>
              <span className="font-medium text-sm">
                {isBeginnerMode ? 'Basic View' : 'Advanced'}
              </span>
            </Button>
          </motion.div>
        </TooltipTrigger>
        {/* @ts-ignore */}
        <TooltipContent side="right" className="max-w-xs dark:bg-slate-900 dark:border-slate-800 dark:text-white">
          <p className="font-semibold mb-1">
            {isBeginnerMode ? '🎯 Switch to Advanced Mode' : '🧘 Switch to Basic View'}
          </p>
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            {isBeginnerMode
              ? 'Access all features, compact layouts, and power user shortcuts'
              : 'Simplified UI with educational hints and larger controls'
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
