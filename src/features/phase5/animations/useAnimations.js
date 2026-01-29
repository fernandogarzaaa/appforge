import { useCallback } from 'react';

/**
 * useAnimations Hook
 * Provides reusable animation and transition variants for Framer Motion
 * Supports dashboard transitions, toggle animations, panel slides, and more
 */
export const useAnimations = () => {
  /**
   * Container animations for dashboard elements
   */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  /**
   * Item animations for staggered effects
   */
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12,
      },
    },
  };

  /**
   * Card flip animation for dashboard cards
   */
  const cardFlipVariants = {
    hidden: { rotateY: -90, opacity: 0 },
    visible: {
      rotateY: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 120,
        damping: 20,
        duration: 0.6,
      },
    },
  };

  /**
   * Scale bounce effect for interactive elements
   */
  const scaleBounceVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 150,
        damping: 12,
      },
    },
    hover: {
      scale: 1.05,
      transition: { duration: 0.2 },
    },
    tap: {
      scale: 0.95,
      transition: { duration: 0.1 },
    },
  };

  /**
   * Slide in from left animation
   */
  const slideInLeftVariants = {
    hidden: { x: -60, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
    exit: {
      x: -60,
      opacity: 0,
      transition: { duration: 0.3 },
    },
  };

  /**
   * Slide in from right animation
   */
  const slideInRightVariants = {
    hidden: { x: 60, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
    exit: {
      x: 60,
      opacity: 0,
      transition: { duration: 0.3 },
    },
  };

  /**
   * Fade in animation (simple opacity)
   */
  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.5 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.3 },
    },
  };

  /**
   * Toggle switch animation (smooth height and opacity)
   */
  const toggleVariants = {
    hidden: { height: 0, opacity: 0, marginTop: 0 },
    visible: {
      height: 'auto',
      opacity: 1,
      marginTop: 16,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
    exit: {
      height: 0,
      opacity: 0,
      marginTop: 0,
      transition: { duration: 0.3 },
    },
  };

  /**
   * Modal backdrop animation
   */
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 },
    },
  };

  /**
   * Modal content animation (scale + fade)
   */
  const modalVariants = {
    hidden: { scale: 0.5, opacity: 0, y: 40 },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 120,
        damping: 20,
        duration: 0.4,
      },
    },
    exit: {
      scale: 0.5,
      opacity: 0,
      y: 40,
      transition: { duration: 0.2 },
    },
  };

  /**
   * Tab switch animation
   */
  const tabVariants = {
    hidden: { opacity: 0, x: 10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
    exit: {
      opacity: 0,
      x: -10,
      transition: { duration: 0.2 },
    },
  };

  /**
   * Rotate animation for loading spinners
   */
  const rotateVariants = {
    visible: {
      rotate: 360,
      transition: {
        repeat: Infinity,
        duration: 1,
        ease: 'linear',
      },
    },
  };

  /**
   * Pulse animation for notifications
   */
  const pulseVariants = {
    visible: {
      opacity: [1, 0.5, 1],
      transition: {
        repeat: Infinity,
        duration: 2,
        ease: 'easeInOut',
      },
    },
  };

  /**
   * Bounce animation for attention-grabbing
   */
  const bounceVariants = {
    visible: {
      y: [0, -8, 0],
      transition: {
        repeat: Infinity,
        duration: 0.6,
        ease: 'easeInOut',
      },
    },
  };

  /**
   * Shimmer loading animation
   */
  const shimmerVariants = {
    visible: {
      backgroundPosition: ['0% 0%', '100% 100%'],
      transition: {
        repeat: Infinity,
        duration: 2,
        ease: 'linear',
      },
    },
  };

  /**
   * Slide up from bottom (for modals, overlays)
   */
  const slideUpVariants = {
    hidden: { y: 100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
    exit: {
      y: 100,
      opacity: 0,
      transition: { duration: 0.3 },
    },
  };

  /**
   * Stagger container for lists
   */
  const listContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  /**
   * List item animation
   */
  const listItemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12,
      },
    },
  };

  /**
   * Progress bar animation
   */
  const progressVariants = {
    visible: (targetWidth) => ({
      width: targetWidth,
      transition: {
        type: 'spring',
        stiffness: 50,
        damping: 20,
        duration: 0.8,
      },
    }),
  };

  /**
   * Button press animation
   */
  const buttonVariants = {
    hover: { scale: 1.03, transition: { duration: 0.2 } },
    tap: { scale: 0.97, transition: { duration: 0.1 } },
  };

  /**
   * Utility function: Get animation preset by name
   */
  const getAnimationPreset = useCallback((name) => {
    const presets = {
      container: containerVariants,
      item: itemVariants,
      cardFlip: cardFlipVariants,
      scaleBounce: scaleBounceVariants,
      slideLeft: slideInLeftVariants,
      slideRight: slideInRightVariants,
      fadeIn: fadeInVariants,
      toggle: toggleVariants,
      backdrop: backdropVariants,
      modal: modalVariants,
      tab: tabVariants,
      rotate: rotateVariants,
      pulse: pulseVariants,
      bounce: bounceVariants,
      shimmer: shimmerVariants,
      slideUp: slideUpVariants,
      listContainer: listContainerVariants,
      listItem: listItemVariants,
      progress: progressVariants,
      button: buttonVariants,
    };
    return presets[name] || fadeInVariants;
  }, []);

  return {
    // Variants
    containerVariants,
    itemVariants,
    cardFlipVariants,
    scaleBounceVariants,
    slideInLeftVariants,
    slideInRightVariants,
    fadeInVariants,
    toggleVariants,
    backdropVariants,
    modalVariants,
    tabVariants,
    rotateVariants,
    pulseVariants,
    bounceVariants,
    shimmerVariants,
    slideUpVariants,
    listContainerVariants,
    listItemVariants,
    progressVariants,
    buttonVariants,
    // Utility
    getAnimationPreset,
  };
};

export default useAnimations;
