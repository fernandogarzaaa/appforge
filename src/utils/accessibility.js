/**
 * Accessibility Utilities
 * WCAG 2.1 AA compliance helpers
 */

/**
 * Manage focus trapping for modals and dialogs
 */
export class FocusTrap {
  constructor(element) {
    this.element = element;
    this.focusableElements = [];
    this.firstFocusable = null;
    this.lastFocusable = null;
    this.previousActiveElement = null;
  }

  activate() {
    this.previousActiveElement = document.activeElement;
    this.updateFocusableElements();
    
    if (this.firstFocusable) {
      this.firstFocusable.focus();
    }

    this.element.addEventListener('keydown', this.handleKeyDown);
  }

  deactivate() {
    this.element.removeEventListener('keydown', this.handleKeyDown);
    
    if (this.previousActiveElement) {
      this.previousActiveElement.focus();
    }
  }

  updateFocusableElements() {
    const selector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    this.focusableElements = Array.from(this.element.querySelectorAll(selector));
    this.firstFocusable = this.focusableElements[0];
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];
  }

  handleKeyDown = (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === this.firstFocusable) {
        e.preventDefault();
        this.lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === this.lastFocusable) {
        e.preventDefault();
        this.firstFocusable?.focus();
      }
    }
  };
}

/**
 * Announce messages to screen readers
 */
export class LiveRegion {
  constructor(politeness = 'polite') {
    this.region = document.createElement('div');
    this.region.setAttribute('role', 'status');
    this.region.setAttribute('aria-live', politeness);
    this.region.setAttribute('aria-atomic', 'true');
    this.region.className = 'sr-only';
    document.body.appendChild(this.region);
  }

  announce(message, clearDelay = 3000) {
    this.region.textContent = message;
    
    if (clearDelay) {
      setTimeout(() => {
        this.region.textContent = '';
      }, clearDelay);
    }
  }

  destroy() {
    this.region.remove();
  }
}

/**
 * Check color contrast ratio (WCAG AA requires 4.5:1 for normal text)
 */
export function getContrastRatio(foreground, background) {
  const getLuminance = (color) => {
    const rgb = color.match(/\d+/g).map(Number);
    const [r, g, b] = rgb.map(val => {
      const normalized = val / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Generate unique IDs for ARIA labelledby/describedby
 */
let idCounter = 0;
export function generateAriaId(prefix = 'aria') {
  return `${prefix}-${++idCounter}-${Date.now()}`;
}

/**
 * Keyboard navigation helper for lists/grids
 */
export class KeyboardNavigator {
  constructor(container, items, options = {}) {
    this.container = container;
    this.items = items;
    this.currentIndex = 0;
    this.orientation = options.orientation || 'vertical'; // 'vertical', 'horizontal', 'grid'
    this.wrap = options.wrap !== false;
    this.onNavigate = options.onNavigate;
  }

  handleKeyDown(e) {
    const { key } = e;
    let handled = false;

    switch (this.orientation) {
      case 'vertical':
        if (key === 'ArrowDown') {
          this.next();
          handled = true;
        } else if (key === 'ArrowUp') {
          this.previous();
          handled = true;
        }
        break;

      case 'horizontal':
        if (key === 'ArrowRight') {
          this.next();
          handled = true;
        } else if (key === 'ArrowLeft') {
          this.previous();
          handled = true;
        }
        break;

      case 'grid':
        // Grid navigation requires columns count
        handled = this.handleGridNavigation(key);
        break;
    }

    if (handled) {
      e.preventDefault();
      this.focusCurrent();
      this.onNavigate?.(this.currentIndex, this.items[this.currentIndex]);
    }

    // Home/End for all orientations
    if (key === 'Home') {
      e.preventDefault();
      this.currentIndex = 0;
      this.focusCurrent();
    } else if (key === 'End') {
      e.preventDefault();
      this.currentIndex = this.items.length - 1;
      this.focusCurrent();
    }
  }

  next() {
    if (this.currentIndex < this.items.length - 1) {
      this.currentIndex++;
    } else if (this.wrap) {
      this.currentIndex = 0;
    }
  }

  previous() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else if (this.wrap) {
      this.currentIndex = this.items.length - 1;
    }
  }

  focusCurrent() {
    const item = this.items[this.currentIndex];
    if (item && item.focus) {
      item.focus();
    }
  }

  handleGridNavigation(key) {
    // Simplified grid navigation - would need columns count for full implementation
    if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'ArrowLeft' || key === 'ArrowRight') {
      // This would need to calculate based on columns
      return true;
    }
    return false;
  }
}

/**
 * Skip link helper for keyboard users
 */
export function addSkipLinks() {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.textContent = 'Skip to main content';
  skipLink.className = 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-indigo-600 focus:text-white focus:px-4 focus:py-2 focus:rounded';
  
  document.body.insertBefore(skipLink, document.body.firstChild);
}

/**
 * Ensure sufficient touch target size (44x44px minimum)
 */
export function checkTouchTargetSize(element) {
  const rect = element.getBoundingClientRect();
  const MIN_SIZE = 44;
  
  return {
    width: rect.width,
    height: rect.height,
    meetsMinimum: rect.width >= MIN_SIZE && rect.height >= MIN_SIZE,
    recommendation: rect.width < MIN_SIZE || rect.height < MIN_SIZE
      ? `Increase size to at least ${MIN_SIZE}x${MIN_SIZE}px`
      : null,
  };
}

/**
 * Detect reduced motion preference
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Detect high contrast mode
 */
export function prefersHighContrast() {
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Create accessible tooltip
 */
export function createTooltip(trigger, content, options = {}) {
  const tooltipId = generateAriaId('tooltip');
  const tooltip = document.createElement('div');
  tooltip.id = tooltipId;
  tooltip.setAttribute('role', 'tooltip');
  tooltip.textContent = content;
  tooltip.className = options.className || 'tooltip';
  
  trigger.setAttribute('aria-describedby', tooltipId);
  
  const show = () => {
    document.body.appendChild(tooltip);
    // Position tooltip
    const rect = trigger.getBoundingClientRect();
    tooltip.style.position = 'absolute';
    tooltip.style.top = `${rect.bottom + 8}px`;
    tooltip.style.left = `${rect.left}px`;
  };
  
  const hide = () => {
    tooltip.remove();
  };
  
  trigger.addEventListener('mouseenter', show);
  trigger.addEventListener('focus', show);
  trigger.addEventListener('mouseleave', hide);
  trigger.addEventListener('blur', hide);
  
  return { tooltip, destroy: () => {
    trigger.removeEventListener('mouseenter', show);
    trigger.removeEventListener('focus', show);
    trigger.removeEventListener('mouseleave', hide);
    trigger.removeEventListener('blur', hide);
    hide();
  }};
}

export default {
  FocusTrap,
  LiveRegion,
  getContrastRatio,
  generateAriaId,
  KeyboardNavigator,
  addSkipLinks,
  checkTouchTargetSize,
  prefersReducedMotion,
  prefersHighContrast,
  createTooltip,
};
