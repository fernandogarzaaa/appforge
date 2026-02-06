/**
 * Shared UI Component Mocks
 * Reusable mocks for common UI components to reduce duplication across tests
 */

import { vi } from 'vitest';

/**
 * Mock for Button component
 * Usage: vi.mock('@/components/ui/button', () => mockButton)
 */
export const mockButton = {
  Button: ({ children, onClick, ...props }) => (
    <button {...props} onClick={onClick}>
      {children}
    </button>
  ),
};

/**
 * Mock for Tooltip component
 * Usage: vi.mock('@/components/ui/tooltip', () => mockTooltip)
 */
export const mockTooltip = {
  Tooltip: ({ children }) => <div>{children}</div>,
  TooltipTrigger: ({ children, asChild }) => <div>{children}</div>,
  TooltipContent: ({ children }) => <div>{children}</div>,
  TooltipProvider: ({ children }) => <div>{children}</div>,
};

/**
 * Mock for Dialog component
 * Usage: vi.mock('@/components/ui/dialog', () => mockDialog)
 */
export const mockDialog = {
  Dialog: ({ children, onOpenChange, ...props }) => (
    <div data-testid="dialog" {...props}>
      {children}
    </div>
  ),
  DialogTrigger: ({ children, asChild, ...props }) => <div {...props}>{children}</div>,
  DialogContent: ({ children, ...props }) => <div {...props}>{children}</div>,
  DialogClose: ({ children, asChild, ...props }) => (
    <div role="button" tabIndex={0} {...props}>
      {children}
    </div>
  ),
};

/**
 * Mock for DropdownMenu component
 * Usage: vi.mock('@/components/ui/dropdown-menu', () => mockDropdownMenu)
 */
export const mockDropdownMenu = {
  DropdownMenu: ({ children }) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children, asChild, ...props }) => <div {...props}>{children}</div>,
  DropdownMenuContent: ({ children, ...props }) => <div {...props}>{children}</div>,
  DropdownMenuItem: ({ children, onClick, ...props }) => (
    <div {...props} onClick={onClick} role="menuitem">
      {children}
    </div>
  ),
};

/**
 * Mock for Badge component
 * Usage: vi.mock('@/components/ui/badge', () => mockBadge)
 */
export const mockBadge = {
  Badge: ({ children, ...props }) => <span {...props}>{children}</span>,
};

/**
 * Mock for Accordion component
 * Usage: vi.mock('@/components/ui/accordion', () => mockAccordion)
 */
export const mockAccordion = {
  Accordion: ({ children }) => <div data-testid="accordion">{children}</div>,
  AccordionItem: ({ children, value }) => (
    <div data-testid={`accordion-item-${value}`}>{children}</div>
  ),
  AccordionTrigger: ({ children, onClick }) => (
    <button onClick={onClick} role="tab">
      {children}
    </button>
  ),
  AccordionContent: ({ children }) => <div role="tabpanel">{children}</div>,
};

/**
 * Helper function to setup common UI mocks
 * Call this in your test file's setup to mock all common UI components
 */
export function setupCommonUIMocks() {
  vi.mock('@/components/ui/button', () => mockButton);
  vi.mock('@/components/ui/tooltip', () => mockTooltip);
  vi.mock('@/components/ui/dialog', () => mockDialog);
  vi.mock('@/components/ui/badge', () => mockBadge);
}

/**
 * Mock for AIModelRouter component
 * Usage: vi.mock('@/components/sidebar/AIModelRouter', () => mockAIModelRouter)
 */
export const mockAIModelRouter = {
  default: () => <div data-testid="ai-model-router">AI Model Router</div>,
};

export default {
  mockButton,
  mockTooltip,
  mockDialog,
  mockDropdownMenu,
  mockBadge,
  mockAccordion,
  mockAIModelRouter,
  setupCommonUIMocks,
};
