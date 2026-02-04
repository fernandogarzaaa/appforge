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
  const { viewMode, toggleViewMode, isBeginnerMode, isAdvancedMode } = useViewMode();

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
                rounded-full shadow-lg transition-all duration-200
                ${isAdvancedMode 
                  ? 'spectrum-gradient-primary text-white hover:shadow-xl' 
                  : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
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
              <span className="font-medium">
                {isBeginnerMode ? 'Basic View' : 'Advanced Mode'}
              </span>
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <p className="font-semibold mb-1">
            {isBeginnerMode ? '🎯 Switch to Advanced Mode' : '🧘 Switch to Basic View'}
          </p>
          <p className="text-sm text-muted-foreground">
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
