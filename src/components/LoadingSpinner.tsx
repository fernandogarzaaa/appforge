import React from 'react';
import { motion } from 'framer-motion';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'default' | 'primary' | 'secondary' | 'minimal';

export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: SpinnerSize;
  /** Visual variant */
  variant?: SpinnerVariant;
  /** Optional text shown below the spinner */
  label?: string;
  /** Whether to take up the full screen (fixed overlay) */
  fullScreen?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Size / Variant Configs
// ============================================================================

const sizeMap: Record<SpinnerSize, { spinner: string; text: string; border: string }> = {
  xs: { spinner: 'w-4 h-4', text: 'text-xs', border: 'border-2' },
  sm: { spinner: 'w-6 h-6', text: 'text-xs', border: 'border-2' },
  md: { spinner: 'w-10 h-10', text: 'text-sm', border: 'border-[3px]' },
  lg: { spinner: 'w-12 h-12', text: 'text-sm', border: 'border-4' },
  xl: { spinner: 'w-16 h-16', text: 'text-base', border: 'border-4' },
};

const variantMap: Record<SpinnerVariant, { ring: string; accent: string }> = {
  default: {
    ring: 'border-slate-200 dark:border-slate-700',
    accent: 'border-t-slate-800 dark:border-t-slate-200',
  },
  primary: {
    ring: 'border-indigo-200 dark:border-indigo-800',
    accent: 'border-t-indigo-600 dark:border-t-indigo-400',
  },
  secondary: {
    ring: 'border-purple-200 dark:border-purple-800',
    accent: 'border-t-purple-600 dark:border-t-purple-400',
  },
  minimal: {
    ring: 'border-transparent',
    accent: 'border-t-slate-500 dark:border-t-slate-400',
  },
};

// ============================================================================
// LoadingSpinner Component
// ============================================================================

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  label,
  fullScreen = false,
  className = '',
}) => {
  const sizeConfig = sizeMap[size];
  const variantConfig = variantMap[variant];

  const spinner = (
    <motion.div
      className={`flex flex-col items-center gap-3 ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative">
        {/* Background ring */}
        <div
          className={`${sizeConfig.spinner} ${sizeConfig.border} ${variantConfig.ring} rounded-full`}
        />
        {/* Spinning accent */}
        <div
          className={`absolute top-0 left-0 ${sizeConfig.spinner} ${sizeConfig.border} border-transparent ${variantConfig.accent} rounded-full animate-spin`}
        />
      </div>
      {label && (
        <p className={`${sizeConfig.text} text-slate-500 dark:text-slate-400 font-medium`}>
          {label}
        </p>
      )}
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      {spinner}
    </div>
  );
};

export default LoadingSpinner;
