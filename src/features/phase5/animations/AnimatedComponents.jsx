import React from 'react';
import { motion } from 'framer-motion';
import { useAnimations } from './useAnimations';

/**
 * AnimatedDashboard Component
 * Wraps dashboard components with smooth transitions and animations
 * Provides consistent animation behavior across all dashboards
 */
export const AnimatedDashboard = ({ children, title, icon: Icon }) => {
  const animations = useAnimations();

  return (
    <motion.div
      variants={animations.containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Animated Header */}
      <motion.div
        variants={animations.itemVariants}
        className="flex items-center gap-3"
      >
        {Icon && <Icon className="w-6 h-6 text-blue-400" />}
        <h2 className="text-2xl font-bold text-white">{title}</h2>
      </motion.div>

      {/* Animated Content */}
      <motion.div
        variants={animations.itemVariants}
        className="space-y-4"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

/**
 * AnimatedCard Component
 * Individual card with hover and tap animations
 */
export const AnimatedCard = ({ children, className = '' }) => {
  const animations = useAnimations();

  return (
    <motion.div
      variants={animations.scaleBounceVariants}
      whileHover="hover"
      whileTap="tap"
      className={`bg-slate-800 rounded-lg border border-slate-700 p-4 ${className}`}
    >
      {children}
    </motion.div>
  );
};

/**
 * AnimatedTab Component
 * Smooth tab switching with fade transitions
 */
export const AnimatedTab = ({ isActive, children }) => {
  const animations = useAnimations();

  return (
    <motion.div
      variants={animations.tabVariants}
      initial={isActive ? 'hidden' : 'visible'}
      animate={isActive ? 'visible' : 'hidden'}
      exit="exit"
    >
      {children}
    </motion.div>
  );
};

/**
 * AnimatedList Component
 * Staggered list item animations
 */
export const AnimatedList = ({ items, renderItem, className = '' }) => {
  const animations = useAnimations();

  return (
    <motion.div
      variants={animations.listContainerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {items.map((item, idx) => (
        <motion.div
          key={item.id || idx}
          variants={animations.listItemVariants}
        >
          {renderItem(item)}
        </motion.div>
      ))}
    </motion.div>
  );
};

/**
 * AnimatedToggle Component
 * Smooth collapse/expand animation for toggle content
 */
export const AnimatedToggle = ({ isOpen, children }) => {
  const animations = useAnimations();

  return (
    <motion.div
      variants={animations.toggleVariants}
      initial={isOpen ? 'visible' : 'hidden'}
      animate={isOpen ? 'visible' : 'hidden'}
      exit="exit"
    >
      {children}
    </motion.div>
  );
};

/**
 * AnimatedButton Component
 * Button with hover and tap feedback
 */
export const AnimatedButton = ({
  children,
  onClick,
  className = '',
  disabled = false,
}) => {
  const animations = useAnimations();

  return (
    <motion.button
      variants={animations.buttonVariants}
      whileHover={!disabled ? 'hover' : {}}
      whileTap={!disabled ? 'tap' : {}}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </motion.button>
  );
};

/**
 * AnimatedProgress Component
 * Animated progress bar
 */
export const AnimatedProgress = ({ value, max = 100 }) => {
  const animations = useAnimations();
  const percentage = (value / max) * 100;

  return (
    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
      <motion.div
        custom={`${percentage}%`}
        variants={animations.progressVariants}
        initial={{ width: 0 }}
        animate="visible"
        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
      />
    </div>
  );
};

/**
 * AnimatedLoader Component
 * Rotating loader with pulse effect
 */
export const AnimatedLoader = () => {
  const animations = useAnimations();

  return (
    <div className="flex items-center justify-center">
      <motion.div
        variants={animations.rotateVariants}
        animate="visible"
        className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full"
      />
    </div>
  );
};

/**
 * AnimatedModal Component
 * Modal with backdrop and content animations
 */
export const AnimatedModal = ({
  isOpen,
  onClose,
  children,
  title,
}) => {
  const animations = useAnimations();

  if (!isOpen) return null;

  return (
    <motion.div
      variants={animations.backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClose}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <motion.div
        variants={animations.modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 rounded-lg border border-slate-700 p-6 max-w-md w-full mx-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </motion.button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
};

/**
 * AnimatedNotification Component
 * Toast-style notification with slide in/out
 */
export const AnimatedNotification = ({
  message,
  type = 'info',
  onClose,
  duration = 3000,
}) => {
  const animations = useAnimations();

  React.useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colorMap = {
    success: 'bg-green-500/10 border-green-500/50 text-green-400',
    error: 'bg-red-500/10 border-red-500/50 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/50 text-blue-400',
    warning: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400',
  };

  return (
    <motion.div
      variants={animations.slideInRightVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`border rounded-lg p-4 ${colorMap[type]}`}
    >
      {message}
    </motion.div>
  );
};

export default AnimatedDashboard;
