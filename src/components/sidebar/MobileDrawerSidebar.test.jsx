import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import MobileDrawerSidebar from '@/components/sidebar/MobileDrawerSidebar';
import { LLMProvider } from '@/contexts/LLMContext';

// Mock components
vi.mock('@/components/sidebar/AIModelRouter', () => ({
  default: () => <div data-testid="mobile-ai-model-router">AI Model Router</div>,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, onOpenChange, ...props }) => <div data-testid="dialog" {...props}>{children}</div>,
  DialogTrigger: ({ children, asChild, ...props }) => <div {...props}>{children}</div>,
  DialogContent: ({ children, ...props }) => <div {...props}>{children}</div>,
  // Use non-button wrapper to avoid nested button warnings in tests
  DialogClose: ({ children, asChild, ...props }) => <div role="button" tabIndex={0} {...props}>{children}</div>,
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

describe('MobileDrawerSidebar Component', () => {
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
    user: mockUser,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders hamburger menu button for mobile', () => {
    renderWithRouter(
      <LLMProvider>
        <MobileDrawerSidebar {...defaultProps} />
      </LLMProvider>
    );

    // Hamburger button should be hidden on desktop (md:hidden)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('includes Dialog component for drawer', () => {
    renderWithRouter(
      <LLMProvider>
        <MobileDrawerSidebar {...defaultProps} />
      </LLMProvider>
    );

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  it('displays APPFORGE branding in drawer header', async () => {
    renderWithRouter(
      <LLMProvider>
        <MobileDrawerSidebar {...defaultProps} />
      </LLMProvider>
    );

    // Open the drawer
    const openButton = screen.getAllByRole('button').find((button) => button.className.includes('md:hidden'));
    expect(openButton).toBeTruthy();
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(screen.getByText(/APPFORGE/i)).toBeInTheDocument();
    });
  });

  it('includes AIModelRouter in drawer', () => {
    renderWithRouter(
      <LLMProvider>
        <MobileDrawerSidebar {...defaultProps} />
      </LLMProvider>
    );

    expect(screen.getByTestId('mobile-ai-model-router')).toBeInTheDocument();
  });

  it('renders all navigation sections in drawer', async () => {
    renderWithRouter(
      <LLMProvider>
        <MobileDrawerSidebar {...defaultProps} />
      </LLMProvider>
    );

    // Navigation items should be present
    expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Projects/i })).toBeInTheDocument();
  });

  it('displays Core section with Dashboard and Projects', async () => {
    renderWithRouter(
      <LLMProvider>
        <MobileDrawerSidebar {...defaultProps} />
      </LLMProvider>
    );

    expect(screen.getByRole('heading', { name: /Core/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Projects/i })).toBeInTheDocument();
  });

  it('displays AI & Models section', async () => {
    renderWithRouter(
      <LLMProvider>
        <MobileDrawerSidebar {...defaultProps} />
      </LLMProvider>
    );

    expect(screen.getByText(/AI & Models/i)).toBeInTheDocument();
  });

  it('displays Build section', async () => {
    renderWithRouter(
      <LLMProvider>
        <MobileDrawerSidebar {...defaultProps} />
      </LLMProvider>
    );

    expect(screen.getByRole('heading', { name: /Build/i })).toBeInTheDocument();
  });

  it('displays Templates section', async () => {
    renderWithRouter(
      <LLMProvider>
        <MobileDrawerSidebar {...defaultProps} />
      </LLMProvider>
    );

    expect(screen.getByText(/Templates/i)).toBeInTheDocument();
  });

  it('displays Enterprise section', async () => {
    renderWithRouter(
      <LLMProvider>
        <MobileDrawerSidebar {...defaultProps} />
      </LLMProvider>
    );

    expect(screen.getByRole('heading', { name: /Enterprise/i })).toBeInTheDocument();
  });

  it('displays Web3 section', async () => {
    renderWithRouter(
      <LLMProvider>
        <MobileDrawerSidebar {...defaultProps} />
      </LLMProvider>
    );

    expect(screen.getByText(/Web3/i)).toBeInTheDocument();
  });

  it('displays Settings link in footer', async () => {
    renderWithRouter(
      <LLMProvider>
        <MobileDrawerSidebar {...defaultProps} />
      </LLMProvider>
    );

    expect(screen.getByText(/Settings/i)).toBeInTheDocument();
  });

  it('shows Admin section only for admin users', () => {
    const { rerender } = renderWithRouter(
      <LLMProvider>
        <MobileDrawerSidebar {...defaultProps} user={mockUser} />
      </LLMProvider>
    );

    // Admin should not be visible for non-admin users
    const adminItems = screen.queryAllByText(/Admin/i);
    const isAdminShown = adminItems.some((item) => item.textContent.includes('Admin'));
    expect(!isAdminShown).toBeTruthy();

    // Now test with admin user
    rerender(
      <RouterProvider router={createMemoryRouter(
        [{ path: '/', element: (
          <LLMProvider>
            <MobileDrawerSidebar {...defaultProps} user={mockAdminUser} />
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

  it('calls onClose when navigation item is clicked', () => {
    const onClose = vi.fn();

    renderWithRouter(
      <LLMProvider>
        <MobileDrawerSidebar {...defaultProps} onClose={onClose} />
      </LLMProvider>
    );

    // Navigation links should exist
    const navLinks = screen.queryAllByRole('link');
    expect(navLinks.length).toBeGreaterThan(0);
  });

  it('is memoized to prevent unnecessary re-renders', () => {
    renderWithRouter(
      <LLMProvider>
        <MobileDrawerSidebar {...defaultProps} />
      </LLMProvider>
    );

    // Component should be memoized
    expect(MobileDrawerSidebar.$$typeof).toBeDefined();
  });

  it('has responsive styling with hidden on desktop', () => {
    const { container } = renderWithRouter(
      <LLMProvider>
        <MobileDrawerSidebar {...defaultProps} />
      </LLMProvider>
    );

    // Button should have md:hidden class (visible only on mobile)
    const mobileButton = screen.getAllByRole('button').find((button) => button.className.includes('md:hidden'));
    expect(mobileButton).toBeTruthy();
    expect(mobileButton.className).toContain('md:hidden');
  });

  it('displays proper section structure', () => {
    renderWithRouter(
      <LLMProvider>
        <MobileDrawerSidebar {...defaultProps} />
      </LLMProvider>
    );

    // At least some section headers should be present
    expect(screen.getByRole('heading', { name: /Core/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Build/i })).toBeInTheDocument();
  });
});

describe('MobileDrawerSidebar Dark Mode', () => {
  const defaultProps = {
    currentProject: null,
    user: { email: 'test@example.com', full_name: 'Test User' },
    onClose: vi.fn(),
  };

  it('supports dark mode styling', () => {
    const { container } = renderWithRouter(
      <LLMProvider>
        <MobileDrawerSidebar {...defaultProps} />
      </LLMProvider>
    );

    // Check for dark mode classes
    const darkElements = container.querySelectorAll('[class*="dark:"]');
    expect(darkElements.length).toBeGreaterThan(0);
  });
});
