import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import ConsolidatedAISidebar from '@/components/sidebar/ConsolidatedAISidebar';
import { LLMProvider } from '@/contexts/LLMContext';

// Mock components and dependencies
vi.mock('@/components/sidebar/AIModelRouter', () => ({
  default: () => <div data-testid="ai-model-router">AI Model Router</div>,
}));

vi.mock('@/components/ui/accordion', () => ({
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
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }) => <div>{children}</div>,
  TooltipTrigger: ({ children }) => <div>{children}</div>,
  TooltipContent: ({ children }) => <div>{children}</div>,
  TooltipProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }) => (
    <button {...props} onClick={onClick}>
      {children}
    </button>
  ),
}));

const renderWithRouter = (ui) => {
  const router = createMemoryRouter(
    [{ path: '/', element: ui }],
    {
      initialEntries: ['/'],
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      },
    }
  );

  return render(<RouterProvider router={router} />);
};

describe('ConsolidatedAISidebar Component', () => {
  const mockUser = {
    email: 'test@example.com',
    full_name: 'Test User',
  };

  const mockAdminUser = {
    email: 'fernandogarzaaa@gmail.com',
    full_name: 'Admin User',
  };

  const defaultProps = {
    currentProject: null,
    collapsed: false,
    onToggle: vi.fn(),
    user: mockUser,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithRouter(
      <LLMProvider>
        <ConsolidatedAISidebar {...defaultProps} />
      </LLMProvider>
    );

    expect(screen.getByText(/APPFORGE/i)).toBeInTheDocument();
  });

  it('displays header with APPFORGE branding', () => {
    renderWithRouter(
      <LLMProvider>
        <ConsolidatedAISidebar {...defaultProps} />
      </LLMProvider>
    );

    expect(screen.getByText(/APPFORGE/i)).toBeInTheDocument();
  });

  it('shows collapse button in expanded state', () => {
    renderWithRouter(
      <LLMProvider>
        <ConsolidatedAISidebar {...defaultProps} />
      </LLMProvider>
    );

    const collapseButtons = screen.getAllByRole('button', {
      name: /Collapse sidebar/i,
    });
    expect(collapseButtons.length).toBeGreaterThan(0);
  });

  it('renders all accordion sections', () => {
    renderWithRouter(
      <LLMProvider>
        <ConsolidatedAISidebar {...defaultProps} />
      </LLMProvider>
    );

    expect(screen.getByRole('tab', { name: /Core/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /AI & Models/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Build/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Templates/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Enterprise/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Web3/i })).toBeInTheDocument();
  });

  it('includes AIModelRouter component', () => {
    renderWithRouter(
      <LLMProvider>
        <ConsolidatedAISidebar {...defaultProps} />
      </LLMProvider>
    );

    expect(screen.getByTestId('ai-model-router')).toBeInTheDocument();
  });

  it('displays admin section only for admin users', () => {
    const { rerender } = renderWithRouter(
      <LLMProvider>
        <ConsolidatedAISidebar {...defaultProps} user={mockUser} />
      </LLMProvider>
    );

    expect(screen.queryByText(/Admin/i)).not.toBeInTheDocument();

    rerender(
      <RouterProvider router={createMemoryRouter(
        [{ path: '/', element: (
          <LLMProvider>
            <ConsolidatedAISidebar {...defaultProps} user={mockAdminUser} />
          </LLMProvider>
        ) }],
        {
          initialEntries: ['/'],
          future: {
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          },
        }
      )} />
    );

    expect(screen.getByText(/Admin/i)).toBeInTheDocument();
  });

  it('calls onToggle when collapse button is clicked', () => {
    const onToggle = vi.fn();

    renderWithRouter(
      <LLMProvider>
        <ConsolidatedAISidebar {...defaultProps} onToggle={onToggle} />
      </LLMProvider>
    );

    const collapseButtons = screen.getAllByRole('button', {
      name: /Collapse sidebar/i,
    });

    if (collapseButtons.length > 0) {
      fireEvent.click(collapseButtons[0]);
      expect(onToggle).toHaveBeenCalled();
    }
  });

  it('renders collapsed state when collapsed prop is true', () => {
    const { container } = renderWithRouter(
      <LLMProvider>
        <ConsolidatedAISidebar {...defaultProps} collapsed={true} />
      </LLMProvider>
    );

    // Collapsed sidebar should have width-80 instead of full width
    const sidebar = container.querySelector('[style*="width"]');
    expect(sidebar).toBeInTheDocument();
  });

  it('shows Settings link in footer', () => {
    renderWithRouter(
      <LLMProvider>
        <ConsolidatedAISidebar {...defaultProps} />
      </LLMProvider>
    );

    expect(screen.getByRole('link', { name: /Settings/i })).toBeInTheDocument();
  });

  it('contains Core navigation items', () => {
    renderWithRouter(
      <LLMProvider>
        <ConsolidatedAISidebar {...defaultProps} />
      </LLMProvider>
    );

    expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Projects/i })).toBeInTheDocument();
  });

  it('contains Build section items', () => {
    renderWithRouter(
      <LLMProvider>
        <ConsolidatedAISidebar {...defaultProps} />
      </LLMProvider>
    );

    expect(screen.getByRole('link', { name: /Bot Builder/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Workflows/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Mobile Studio/i })).toBeInTheDocument();
  });

  it('contains Enterprise section items', () => {
    renderWithRouter(
      <LLMProvider>
        <ConsolidatedAISidebar {...defaultProps} />
      </LLMProvider>
    );

    expect(screen.getByRole('link', { name: /Data Privacy/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Observability/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Search Analytics/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Team/i })).toBeInTheDocument();
  });

  it('is memoized to prevent unnecessary re-renders', () => {
    const { rerender } = renderWithRouter(
      <LLMProvider>
        <ConsolidatedAISidebar {...defaultProps} />
      </LLMProvider>
    );

    // Component should be memoized
    expect(ConsolidatedAISidebar.$$typeof).toBeDefined();
  });
});

describe('ConsolidatedAISidebar Collapsed State', () => {
  const defaultProps = {
    currentProject: null,
    collapsed: true,
    onToggle: vi.fn(),
    user: { email: 'test@example.com', full_name: 'Test User' },
  };

  it('renders collapsed sidebar with icons only', () => {
    renderWithRouter(
      <LLMProvider>
        <ConsolidatedAISidebar {...defaultProps} />
      </LLMProvider>
    );

    // Collapsed sidebar should still render navigation
    const expandButtons = screen.queryAllByRole('button', {
      name: /Expand/i,
    });
    expect(expandButtons.length).toBeGreaterThan(0);
  });

  it('shows expand button in collapsed state', () => {
    renderWithRouter(
      <LLMProvider>
        <ConsolidatedAISidebar {...defaultProps} />
      </LLMProvider>
    );

    const expandButtons = screen.queryAllByRole('button', {
      name: /Expand/i,
    });
    expect(expandButtons.length).toBeGreaterThan(0);
  });
});
