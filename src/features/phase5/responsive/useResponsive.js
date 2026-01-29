import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * useResponsive Hook
 * Provides responsive design utilities including breakpoint detection, mobile detection, orientation detection
 * Helps optimize layouts for all device sizes
 */
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState(() => {
    if (typeof window === 'undefined') return 'lg';
    return getScreenSize(window.innerWidth);
  });

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  const [isTablet, setIsTablet] = useState(() => {
    if (typeof window === 'undefined') return false;
    const width = window.innerWidth;
    return width >= 768 && width < 1024;
  });

  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1024;
  });

  const [orientation, setOrientation] = useState(() => {
    if (typeof window === 'undefined') return 'portrait';
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  });

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  const [windowHeight, setWindowHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 768
  );

  /**
   * Determine screen size category
   */
  function getScreenSize(width) {
    if (width < 640) return 'xs';
    if (width < 768) return 'sm';
    if (width < 1024) return 'md';
    if (width < 1280) return 'lg';
    if (width < 1536) return 'xl';
    return '2xl';
  }

  /**
   * Handle window resize
   */
  const handleResize = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    setWindowWidth(width);
    setWindowHeight(height);
    setScreenSize(getScreenSize(width));
    setIsMobile(width < 768);
    setIsTablet(width >= 768 && width < 1024);
    setIsDesktop(width >= 1024);
    setOrientation(height > width ? 'portrait' : 'landscape');
  }, []);

  /**
   * Debounced resize handler
   */
  useEffect(() => {
    let resizeTimer;

    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', debouncedResize);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', debouncedResize);
      clearTimeout(resizeTimer);
    };
  }, [handleResize]);

  /**
   * Check if screen size matches breakpoint
   */
  const matches = useCallback((breakpoint) => {
    const breakpoints = { xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 };
    return windowWidth >= (breakpoints[breakpoint] || 0);
  }, [windowWidth]);

  /**
   * Get columns for responsive grid
   */
  const getGridCols = useCallback(() => {
    if (isMobile) return 1;
    if (isTablet) return 2;
    return 3;
  }, [isMobile, isTablet]);

  /**
   * Get padding for responsive layout
   */
  const getResponsivePadding = useCallback(() => {
    if (isMobile) return 'px-3 py-2';
    if (isTablet) return 'px-4 py-3';
    return 'px-6 py-4';
  }, [isMobile, isTablet]);

  /**
   * Get font size scaling
   */
  const getFontSizeClass = useCallback((baseClass) => {
    if (isMobile) return baseClass.replace('text-', 'text-sm:');
    return baseClass;
  }, [isMobile]);

  /**
   * Get gap spacing for responsive layouts
   */
  const getResponsiveGap = useCallback(() => {
    if (isMobile) return 'gap-2';
    if (isTablet) return 'gap-3';
    return 'gap-4';
  }, [isMobile, isTablet]);

  /**
   * Hide/show element based on breakpoint
   */
  const shouldHide = useCallback((breakpoint) => {
    const breakpointValues = {
      onMobile: isMobile,
      onTablet: isTablet,
      onDesktop: isDesktop,
      belowTablet: isMobile,
      belowDesktop: isMobile || isTablet,
    };
    return breakpointValues[breakpoint];
  }, [isMobile, isTablet, isDesktop]);

  /**
   * Get optimal image size based on device
   */
  const getOptimalImageSize = useCallback(() => {
    if (isMobile) return { width: 400, height: 300 };
    if (isTablet) return { width: 600, height: 400 };
    return { width: 800, height: 600 };
  }, [isMobile, isTablet]);

  /**
   * Container width based on breakpoint
   */
  const getContainerWidth = useCallback(() => {
    if (isMobile) return 'w-full';
    if (isTablet) return 'w-full lg:max-w-3xl';
    return 'w-full lg:max-w-5xl';
  }, [isMobile, isTablet]);

  /**
   * Get responsive text size
   */
  const getResponsiveTextSize = useCallback(() => {
    if (isMobile) return 'text-base sm:text-lg';
    if (isTablet) return 'text-lg md:text-xl';
    return 'text-xl lg:text-2xl';
  }, [isMobile, isTablet]);

  /**
   * Stack or row layout based on breakpoint
   */
  const getFlexDirection = useCallback(() => {
    return isMobile ? 'flex-col' : 'flex-row';
  }, [isMobile]);

  /**
   * Number of items per row
   */
  const getItemsPerRow = useCallback(() => {
    if (isMobile) return 1;
    if (isTablet) return 2;
    return 4;
  }, [isMobile, isTablet]);

  /**
   * Get sidebar width
   */
  const getSidebarWidth = useCallback(() => {
    if (isMobile) return 'w-full';
    if (isTablet) return 'w-48';
    return 'w-64';
  }, [isMobile, isTablet]);

  /**
   * Get z-index for mobile overlay
   */
  const getMobileZIndex = useCallback(() => {
    return isMobile ? 'z-50' : 'z-10';
  }, [isMobile]);

  /**
   * Viewport aspect ratio
   */
  const getAspectRatio = useMemo(() => {
    return (windowHeight / windowWidth).toFixed(2);
  }, [windowHeight, windowWidth]);

  /**
   * Safe area handling (for notched devices)
   */
  const getSafeAreaInsets = useCallback(() => ({
    top: 'pt-safe',
    bottom: 'pb-safe',
    left: 'pl-safe',
    right: 'pr-safe',
  }), []);

  /**
   * Determine if touch device
   */
  const isTouchDevice = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return (
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      (navigator.msMaxTouchPoints > 0)
    );
  }, []);

  /**
   * Get touch-optimized spacing
   */
  const getTouchSpacing = useCallback(() => {
    // Minimum 44px for touch targets
    return isTouchDevice ? 'py-3 px-4' : 'py-2 px-3';
  }, [isTouchDevice]);

  /**
   * Print media query string
   */
  const getPrintStyles = useCallback(() => ({
    screen: '@media screen',
    print: '@media print',
    landscape: '@media (orientation: landscape)',
    portrait: '@media (orientation: portrait)',
  }), []);

  return {
    // Current screen info
    screenSize,
    isMobile,
    isTablet,
    isDesktop,
    orientation,
    windowWidth,
    windowHeight,
    isTouchDevice,
    aspectRatio: getAspectRatio,

    // Detection utilities
    matches,
    shouldHide,

    // Layout utilities
    getGridCols,
    getFlexDirection,
    getContainerWidth,
    getResponsivePadding,
    getResponsiveGap,
    getSidebarWidth,
    getItemsPerRow,

    // Typography utilities
    getFontSizeClass,
    getResponsiveTextSize,

    // Media utilities
    getOptimalImageSize,

    // Touch utilities
    getTouchSpacing,
    getSafeAreaInsets,

    // Visibility utilities
    getMobileZIndex,

    // Print utilities
    getPrintStyles,

    // For debugging
    getResponsiveDebug: () => ({
      screenSize,
      isMobile,
      isTablet,
      isDesktop,
      orientation,
      windowWidth,
      windowHeight,
      isTouchDevice,
    }),
  };
};

export default useResponsive;
