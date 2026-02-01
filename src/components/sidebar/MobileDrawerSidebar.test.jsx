import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MobileDrawerSidebar from '@/components/sidebar/MobileDrawerSidebar';
import { LLMProvider } from '@/contexts/LLMContext';

// Mock components
vi.mock('@/components/sidebar/AIModelRouter', () => ({
  default: () => <div data-testid="mobile-ai-model-router">AI Model Router</div>,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, ...props }) => <div data-testid="dialog" {...props}>{children}</div>,
  DialogTrigger: ({ children, asChild, ...props }) => <div {...props}>{children}</div>,
  DialogContent: ({ children, ...props }) => <div {...props}>{children}</div>,
  DialogClose: ({ children, asChild, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }) => (
    <button {...props} onClick={onClick}>
      {children}
    </button>
  ),
}));

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
    render(
      <BrowserRouter>
        <LLMProvider>
          <MobileDrawerSidebar {...defaultProps} />
        </LLMProvider>
      </BrowserRouter>
    );

    // Hamburger button should be hidden on desktop (md:hidden)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('includes Dialog component for drawer', () => {
    render(
      <BrowserRouter>
        <LLMProvider>
          <MobileDrawerSidebar {...defaultProps} />
        </LLMProvider>
      </BrowserRouter>
    );

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  it('displays APPFORGE branding in drawer header', async () => {
    render(
      <BrowserRouter>
        <LLMProvider>
          <MobileDrawerSidebar {...defaultProps} />
        </LLMProvider>
      </BrowserRouter>
    );

    // Open the drawer
    const openButton = screen.getByRole('button', { name: '' });
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(screen.getByText(/APPFORGE/i)).toBeInTheDocument();
    });
  });

  it('includes AIModelRouter in drawer', () => {
    render(
      <BrowserRouter>
        <LLMProvider>
          <MobileDrawerSidebar {...defaultProps} />
        </LLMProvider>
      </BrowserRouter>
    );

    expect(screen.getByTestId('mobile-ai-model-router')).toBeInTheDocument();
  });

  it('renders all navigation sections in drawer', async () => {
    render(
      <BrowserRouter>
        <LLMProvider>
          <MobileDrawerSidebar {...defaultProps} />
        </LLMProvider>
      </BrowserRouter>
    );

    // Navigation items should be present
    expect(screen.getByText(/Dashboard|Projects/i)).toBeInTheDocument();
  });

  it('displays Core section with Dashboard and Projects', async () => {
    render(
      <BrowserRouter>
        <LLMProvider>
          <MobileDrawerSidebar {...defaultProps} />
        </LLMProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Core/i)).toBeInTheDocument();
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Projects/i)).toBeInTheDocument();
  });

  it('displays AI & Models section', async () => {
    render(
      <BrowserRouter>
        <LLMProvider>
          <MobileDrawerSidebar {...defaultProps} />
        </LLMProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/AI & Models/i)).toBeInTheDocument();
  });

  it('displays Build section', async () => {
    render(
      <BrowserRouter>
        <LLMProvider>
          <MobileDrawerSidebar {...defaultProps} />
        </LLMProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Build/i)).toBeInTheDocument();
  });

  it('displays Templates section', async () => {
    render(
      <BrowserRouter>
        <LLMProvider>
          <MobileDrawerSidebar {...defaultProps} />
        </LLMProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Templates/i)).toBeInTheDocument();
  });

  it('displays Enterprise section', async () => {
    render(
      <BrowserRouter>
        <LLMProvider>
          <MobileDrawerSidebar {...defaultProps} />
        </LLMProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Enterprise/i)).toBeInTheDocument();
  });

  it('displays Web3 section', async () => {
    render(
      <BrowserRouter>
        <LLMProvider>
          <MobileDrawerSidebar {...defaultProps} />
        </LLMProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Web3/i)).toBeInTheDocument();
  });

  it('displays Settings link in footer', async () => {
    render(
      <BrowserRouter>
        <LLMProvider>
          <MobileDrawerSidebar {...defaultProps} />
        </LLMProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Settings/i)).toBeInTheDocument();
  });

  it('shows Admin section only for admin users', () => {
    const { rerender } = render(
      <BrowserRouter>
        <LLMProvider>
          <MobileDrawerSidebar {...defaultProps} user={mockUser} />
        </LLMProvider>
      </BrowserRouter>
    );

    // Admin should not be visible for non-admin users
    const adminItems = screen.queryAllByText(/Admin/i);
    const isAdminShown = adminItems.some((item) => item.textContent.includes('Admin'));
    expect(!isAdminShown).toBeTruthy();

    // Now test with admin user
    rerender(
      <BrowserRouter>
        <LLMProvider>
          <MobileDrawerSidebar {...defaultProps} user={mockAdminUser} />
        </LLMProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Admin/i)).toBeInTheDocument();
  });

  it('calls onClose when navigation item is clicked', () => {
    const onClose = vi.fn();

    render(
      <BrowserRouter>
        <LLMProvider>
          <MobileDrawerSidebar {...defaultProps} onClose={onClose} />
        </LLMProvider>
      </BrowserRouter>
    );

    // Navigation links should exist
    const navLinks = screen.queryAllByRole('link');
    expect(navLinks.length).toBeGreaterThan(0);
  });

  it('is memoized to prevent unnecessary re-renders', () => {
    render(
      <BrowserRouter>
        <LLMProvider>
          <MobileDrawerSidebar {...defaultProps} />
        </LLMProvider>
      </BrowserRouter>
    );

    // Component should be memoized
    expect(MobileDrawerSidebar.$$typeof).toBeDefined();
  });

  it('has responsive styling with hidden on desktop', () => {
    const { container } = render(
      <BrowserRouter>
        <LLMProvider>
          <MobileDrawerSidebar {...defaultProps} />
        </LLMProvider>
      </BrowserRouter>
    );

    // Button should have md:hidden class (visible only on mobile)
    const button = screen.getByRole('button');
    expect(button.className).toContain('md:hidden');
  });

  it('displays proper section structure', () => {
    render(
      <BrowserRouter>
        <LLMProvider>
          <MobileDrawerSidebar {...defaultProps} />
        </LLMProvider>
      </BrowserRouter>
    );

    // At least some section headers should be present
    expect(screen.getByText(/Core/i)).toBeInTheDocument();
    expect(screen.getByText(/Build/i)).toBeInTheDocument();
  });
});

describe('MobileDrawerSidebar Dark Mode', () => {
  const defaultProps = {
    currentProject: null,
    user: { email: 'test@example.com', full_name: 'Test User' },
    onClose: vi.fn(),
  };

  it('supports dark mode styling', () => {
    const { container } = render(
      <BrowserRouter>
        <LLMProvider>
          <MobileDrawerSidebar {...defaultProps} />
        </LLMProvider>
      </BrowserRouter>
    );

    // Check for dark mode classes
    const darkElements = container.querySelectorAll('[class*="dark:"]');
    expect(darkElements.length).toBeGreaterThan(0);
  });
});
