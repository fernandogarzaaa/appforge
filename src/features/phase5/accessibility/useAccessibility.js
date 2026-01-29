import { useState, useCallback, useEffect } from 'react';

/**
 * useAccessibility Hook
 * Manages accessibility features including keyboard navigation, ARIA labels, screen reader support
 * Implements WCAG 2.1 AA compliance standards
 */
export const useAccessibility = () => {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [highContrast, setHighContrast] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('appforge_high_contrast') === 'true';
  });

  const [screenReaderEnabled, setScreenReaderEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('appforge_screen_reader') === 'true';
  });

  const [keyboardNavigationEnabled, setKeyboardNavigationEnabled] = useState(true);
  const [focusVisible, setFocusVisible] = useState(true);
  const [announcements, setAnnouncements] = useState([]);

  // Detect system reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  /**
   * Announce message to screen readers
   */
  const announce = useCallback((message, priority = 'polite') => {
    setAnnouncements((prev) => [...prev, { message, priority, id: Date.now() }]);
    
    // Remove announcement after 5 seconds
    setTimeout(() => {
      setAnnouncements((prev) => prev.filter((a) => a.id !== Date.now()));
    }, 5000);
  }, []);

  /**
   * Create accessible button with keyboard support
   */
  const createAccessibleButton = useCallback((options = {}) => ({
    role: 'button',
    tabIndex: 0,
    'aria-label': options.label,
    'aria-pressed': options.pressed,
    'aria-disabled': options.disabled,
    onKeyDown: (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !options.disabled) {
        e.preventDefault();
        options.onClick?.();
      }
    },
  }), []);

  /**
   * Create accessible tab interface
   */
  const createAccessibleTab = useCallback((options = {}) => ({
    role: 'tab',
    tabIndex: options.selected ? 0 : -1,
    'aria-selected': options.selected,
    'aria-controls': options.panelId,
    id: options.tabId,
  }), []);

  /**
   * Create accessible tab panel
   */
  const createAccessibleTabPanel = useCallback((options = {}) => ({
    role: 'tabpanel',
    'aria-labelledby': options.tabId,
    id: options.panelId,
    hidden: !options.visible,
  }), []);

  /**
   * Create accessible dialog/modal
   */
  const createAccessibleDialog = useCallback((options = {}) => ({
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': options.titleId,
    'aria-describedby': options.descriptionId,
  }), []);

  /**
   * Create accessible list
   */
  const createAccessibleList = useCallback((options = {}) => ({
    role: options.ordered ? 'list' : 'list',
    'aria-label': options.label,
  }), []);

  /**
   * Create accessible list item
   */
  const createAccessibleListItem = useCallback(() => ({
    role: 'listitem',
  }), []);

  /**
   * Handle keyboard navigation in lists/menus
   */
  const handleKeyboardNavigation = useCallback((e, items, currentIndex, onSelect) => {
    if (!keyboardNavigationEnabled) return;

    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = (currentIndex + 1) % items.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = (currentIndex - 1 + items.length) % items.length;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = items.length - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect?.(items[currentIndex]);
        return;
      default:
        return;
    }

    onSelect?.(items[nextIndex], nextIndex);
  }, [keyboardNavigationEnabled]);

  /**
   * Focus trap for modals
   */
  const useFocusTrap = useCallback((containerRef) => {
    useEffect(() => {
      const container = containerRef?.current;
      if (!container) return;

      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleKeyDown = (e) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      container.addEventListener('keydown', handleKeyDown);
      firstElement?.focus();

      return () => container.removeEventListener('keydown', handleKeyDown);
    }, [containerRef]);
  }, []);

  /**
   * Create accessible progress bar
   */
  const createAccessibleProgressBar = useCallback((options = {}) => ({
    role: 'progressbar',
    'aria-valuenow': options.value,
    'aria-valuemin': options.min || 0,
    'aria-valuemax': options.max || 100,
    'aria-label': options.label,
  }), []);

  /**
   * Create accessible alert/notification
   */
  const createAccessibleAlert = useCallback((options = {}) => ({
    role: options.type === 'alert' ? 'alert' : 'status',
    'aria-live': options.live || 'polite',
    'aria-atomic': true,
  }), []);

  /**
   * Get animation settings based on user preference
   */
  const getAnimationSettings = useCallback(() => ({
    shouldAnimate: !reducedMotion,
    duration: reducedMotion ? 0 : 300,
    disableTransitions: reducedMotion,
  }), [reducedMotion]);

  /**
   * Toggle high contrast mode
   */
  const toggleHighContrast = useCallback(() => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    localStorage.setItem('appforge_high_contrast', String(newValue));
    if (newValue) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  /**
   * Toggle screen reader mode
   */
  const toggleScreenReader = useCallback(() => {
    const newValue = !screenReaderEnabled;
    setScreenReaderEnabled(newValue);
    localStorage.setItem('appforge_screen_reader', String(newValue));
  }, [screenReaderEnabled]);

  /**
   * Skip to main content link
   */
  const skipToMainContent = useCallback(() => {
    const mainContent = document.querySelector('main') || 
                       document.querySelector('[role="main"]');
    mainContent?.focus();
    mainContent?.scrollIntoView();
  }, []);

  /**
   * Create accessible form field
   */
  const createAccessibleFormField = useCallback((options = {}) => ({
    id: options.id,
    name: options.name,
    'aria-label': options.label,
    'aria-describedby': options.errorId ? `${options.id}-error` : undefined,
    'aria-invalid': options.hasError,
  }), []);

  /**
   * Create accessible label for form field
   */
  const createAccessibleLabel = useCallback((options = {}) => ({
    htmlFor: options.fieldId,
    className: options.required ? 'after:content-["*"]' : '',
  }), []);

  /**
   * Get screen reader announcement element
   */
  const getAnnouncementElement = useCallback(() => (
    <div
      className="sr-only"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {announcements.map((a) => (
        <div key={a.id}>{a.message}</div>
      ))}
    </div>
  ), [announcements]);

  return {
    // States
    reducedMotion,
    highContrast,
    screenReaderEnabled,
    keyboardNavigationEnabled,
    focusVisible,

    // Utilities
    announce,
    toggleHighContrast,
    toggleScreenReader,
    getAnimationSettings,
    skipToMainContent,

    // Accessible element creators
    createAccessibleButton,
    createAccessibleTab,
    createAccessibleTabPanel,
    createAccessibleDialog,
    createAccessibleList,
    createAccessibleListItem,
    createAccessibleProgressBar,
    createAccessibleAlert,
    createAccessibleFormField,
    createAccessibleLabel,

    // Advanced utilities
    handleKeyboardNavigation,
    useFocusTrap,
    getAnnouncementElement,
  };
};

export default useAccessibility;
