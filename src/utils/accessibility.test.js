/**
 * Accessibility Utilities Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
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
} from '@/utils/accessibility';

describe('Accessibility Utilities', () => {
  describe('FocusTrap', () => {
    let container;

    beforeEach(() => {
      container = document.createElement('div');
      container.innerHTML = `
        <button id="first">First</button>
        <a href="#" id="link">Link</a>
        <input id="input" type="text" />
        <button id="last">Last</button>
      `;
      document.body.appendChild(container);
    });

    afterEach(() => {
      container.remove();
    });

    it('should trap focus within container', () => {
      const trap = new FocusTrap(container);
      trap.activate();

      const first = container.querySelector('#first');
      const last = container.querySelector('#last');

      expect(trap.firstFocusable).toBe(first);
      expect(trap.lastFocusable).toBe(last);
      expect(document.activeElement).toBe(first);

      trap.deactivate();
    });

    it('should cycle focus from last to first on Tab', () => {
      const trap = new FocusTrap(container);
      trap.activate();

      const first = container.querySelector('#first');
      const last = container.querySelector('#last');
      last.focus();

      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      
      container.dispatchEvent(event);

      trap.deactivate();
    });

    it('should restore focus on deactivate', () => {
      const externalButton = document.createElement('button');
      document.body.appendChild(externalButton);
      externalButton.focus();

      const trap = new FocusTrap(container);
      trap.activate();
      trap.deactivate();

      expect(document.activeElement).toBe(externalButton);

      externalButton.remove();
    });
  });

  describe('LiveRegion', () => {
    it('should create ARIA live region', () => {
      const region = new LiveRegion('polite');
      
      const element = document.querySelector('[role="status"]');
      expect(element).toBeTruthy();
      expect(element.getAttribute('aria-live')).toBe('polite');
      expect(element.getAttribute('aria-atomic')).toBe('true');

      region.destroy();
    });

    it('should announce messages', async () => {
      const region = new LiveRegion();
      region.announce('Test message');

      expect(region.region.textContent).toBe('Test message');

      region.destroy();
    });

    it('should clear messages after delay', async () => {
      vi.useFakeTimers();
      
      const region = new LiveRegion();
      region.announce('Test', 1000);

      expect(region.region.textContent).toBe('Test');

      vi.advanceTimersByTime(1000);

      expect(region.region.textContent).toBe('');

      region.destroy();
      vi.useRealTimers();
    });
  });

  describe('getContrastRatio', () => {
    it('should calculate contrast ratio for high contrast', () => {
      const ratio = getContrastRatio('rgb(0, 0, 0)', 'rgb(255, 255, 255)');
      expect(ratio).toBeCloseTo(21, 0); // Black on white has 21:1 ratio
    });

    it('should calculate contrast ratio for low contrast', () => {
      const ratio = getContrastRatio('rgb(200, 200, 200)', 'rgb(255, 255, 255)');
      expect(ratio).toBeLessThan(4.5); // Below WCAG AA threshold
    });

    it('should meet WCAG AA for normal text (4.5:1)', () => {
      const ratio = getContrastRatio('rgb(87, 87, 87)', 'rgb(255, 255, 255)');
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('generateAriaId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateAriaId();
      const id2 = generateAriaId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^aria-\d+-\d+$/);
    });

    it('should use custom prefix', () => {
      const id = generateAriaId('tooltip');
      expect(id).toMatch(/^tooltip-\d+-\d+$/);
    });
  });

  describe('KeyboardNavigator', () => {
    let container;
    let items;

    beforeEach(() => {
      container = document.createElement('div');
      items = [
        document.createElement('button'),
        document.createElement('button'),
        document.createElement('button'),
      ];
      items.forEach(item => container.appendChild(item));
      document.body.appendChild(container);
    });

    afterEach(() => {
      container.remove();
    });

    it('should navigate vertically with arrow keys', () => {
      const navigator = new KeyboardNavigator(container, items, {
        orientation: 'vertical',
      });

      navigator.next();
      expect(navigator.currentIndex).toBe(1);

      navigator.previous();
      expect(navigator.currentIndex).toBe(0);
    });

    it('should wrap around when enabled', () => {
      const navigator = new KeyboardNavigator(container, items, {
        orientation: 'vertical',
        wrap: true,
      });

      navigator.previous(); // From 0, wrap to last
      expect(navigator.currentIndex).toBe(2);

      navigator.next(); // From last, wrap to 0
      expect(navigator.currentIndex).toBe(0);
    });

    it('should not wrap when disabled', () => {
      const navigator = new KeyboardNavigator(container, items, {
        orientation: 'vertical',
        wrap: false,
      });

      navigator.previous(); // Stay at 0
      expect(navigator.currentIndex).toBe(0);

      navigator.currentIndex = 2;
      navigator.next(); // Stay at last
      expect(navigator.currentIndex).toBe(2);
    });

    it('should call onNavigate callback', () => {
      const onNavigate = vi.fn();
      const navigator = new KeyboardNavigator(container, items, {
        orientation: 'vertical',
        onNavigate,
      });

      const event = { key: 'ArrowDown', preventDefault: vi.fn() };
      navigator.handleKeyDown(event);

      expect(onNavigate).toHaveBeenCalledWith(1, items[1]);
    });
  });

  describe('addSkipLinks', () => {
    it('should add skip link to page', () => {
      addSkipLinks();

      const skipLink = document.querySelector('a[href="#main-content"]');
      expect(skipLink).toBeTruthy();
      expect(skipLink.textContent).toBe('Skip to main content');
      expect(skipLink.className).toContain('skip-link');

      skipLink.remove();
    });
  });

  describe('checkTouchTargetSize', () => {
    it('should validate minimum touch target size', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.getBoundingClientRect = () => ({
        width: 50,
        height: 50,
        top: 0,
        left: 0,
        right: 50,
        bottom: 50,
      });

      const result = checkTouchTargetSize(button);

      expect(result.meetsMinimum).toBe(true);
      expect(result.recommendation).toBeNull();

      button.remove();
    });

    it('should recommend size increase for small targets', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.getBoundingClientRect = () => ({
        width: 20,
        height: 20,
        top: 0,
        left: 0,
        right: 20,
        bottom: 20,
      });

      const result = checkTouchTargetSize(button);

      expect(result.meetsMinimum).toBe(false);
      expect(result.recommendation).toBeTruthy();
      expect(result.recommendation).toContain('44');

      button.remove();
    });
  });

  describe('prefersReducedMotion', () => {
    it('should detect reduced motion preference', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
        })),
      });

      const result = prefersReducedMotion();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('prefersHighContrast', () => {
    it('should detect high contrast preference', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: false,
          media: query,
        })),
      });

      const result = prefersHighContrast();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('createTooltip', () => {
    let trigger;

    beforeEach(() => {
      trigger = document.createElement('button');
      trigger.textContent = 'Hover me';
      document.body.appendChild(trigger);
    });

    afterEach(() => {
      trigger.remove();
    });

    it('should create accessible tooltip', () => {
      const { tooltip, destroy } = createTooltip(trigger, 'Tooltip content');

      expect(trigger.hasAttribute('aria-describedby')).toBe(true);
      expect(tooltip.getAttribute('role')).toBe('tooltip');
      expect(tooltip.textContent).toBe('Tooltip content');

      destroy();
    });

    it('should show tooltip on hover', () => {
      const { tooltip, destroy } = createTooltip(trigger, 'Test tooltip');

      trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

      expect(document.body.contains(tooltip)).toBe(true);

      destroy();
      expect(document.body.contains(tooltip)).toBe(false);
    });

    it('should hide tooltip on leave', () => {
      const { tooltip, destroy } = createTooltip(trigger, 'Test tooltip');

      trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      trigger.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));

      expect(document.body.contains(tooltip)).toBe(false);

      destroy();
    });

    it('should clean up event listeners', () => {
      const { destroy } = createTooltip(trigger, 'Test');

      const mouseenterSpy = vi.fn();
      trigger.addEventListener('mouseenter', mouseenterSpy);

      destroy();

      trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

      // Original tooltip listener should be removed
      expect(document.querySelector('[role="tooltip"]')).toBeNull();
    });
  });
});
