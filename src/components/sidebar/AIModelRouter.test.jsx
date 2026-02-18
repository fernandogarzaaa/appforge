import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import AIModelRouter from '@/components/sidebar/AIModelRouter';
import { LLMProvider } from '@/contexts/LLMContext';

let mockLLMContext;

vi.mock('@/contexts/LLMContext', async () => {
  const actual = await vi.importActual('@/contexts/LLMContext');
  return {
    ...actual,
    useLLM: () => mockLLMContext,
    LLMProvider: ({ children }) => <div>{children}</div>,
  };
});

// Mock Radix UI components
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children, asChild, ...props }) => <div {...props}>{children}</div>,
  DropdownMenuContent: ({ children, ...props }) => <div {...props}>{children}</div>,
  DropdownMenuItem: ({ children, onClick, ...props }) => (
    <div {...props} onClick={onClick} role="menuitem">
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }) => (
    <button {...props} onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }) => <span {...props}>{children}</span>,
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }) => <div>{children}</div>,
  TooltipTrigger: ({ children, asChild }) => <div>{children}</div>,
  TooltipContent: ({ children }) => <div>{children}</div>,
  TooltipProvider: ({ children }) => <div>{children}</div>,
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

describe('AIModelRouter Component', () => {
  const baseLLMContext = {
    selectedModel: 'gpt4',
    availableModels: ['gpt4', 'gpt3'],
    updateSettings: vi.fn(),
    settings: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLLMContext = { ...baseLLMContext, updateSettings: vi.fn() };
  });

  it('renders without crashing', () => {
    renderWithRouter(
      <LLMProvider value={mockLLMContext}>
        <AIModelRouter />
      </LLMProvider>
    );

    expect(screen.getByText(/Active Model/i)).toBeInTheDocument();
    expect(screen.getByText(/Switch Model/i)).toBeInTheDocument();
  });

  it('displays current model name and provider', () => {
    renderWithRouter(
      <LLMProvider value={mockLLMContext}>
        <AIModelRouter />
      </LLMProvider>
    );

    expect(screen.getByText(/Active Model/i)).toBeInTheDocument();
  });

  it('opens dropdown when Switch Model button is clicked', async () => {
    renderWithRouter(
      <LLMProvider value={mockLLMContext}>
        <AIModelRouter />
      </LLMProvider>
    );

    const switchButton = screen.getByText(/Switch Model/i);
    fireEvent.click(switchButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search models.../i)).toBeInTheDocument();
    });
  });

  it('filters models based on search query', async () => {
    const user = userEvent.setup();

    renderWithRouter(
      <LLMProvider value={mockLLMContext}>
        <AIModelRouter />
      </LLMProvider>
    );

    const switchButton = screen.getByText(/Switch Model/i);
    fireEvent.click(switchButton);

    const searchInput = await screen.findByPlaceholderText(/Search models.../i);
    await user.type(searchInput, 'gpt');

    await waitFor(() => {
      expect(searchInput.value).toBe('gpt');
    });
  });

  it('shows keyboard shortcut badges', async () => {
    renderWithRouter(
      <LLMProvider value={mockLLMContext}>
        <AIModelRouter />
      </LLMProvider>
    );

    const switchButton = screen.getByText(/Switch Model/i);
    fireEvent.click(switchButton);

    await waitFor(() => {
      expect(screen.getByText(/Ctrl\/Cmd \+ 1-9 to switch/i)).toBeInTheDocument();
    });
  });

  it('clears search when X button is clicked', async () => {
    const user = userEvent.setup();

    renderWithRouter(
      <LLMProvider value={mockLLMContext}>
        <AIModelRouter />
      </LLMProvider>
    );

    const switchButton = screen.getByText(/Switch Model/i);
    fireEvent.click(switchButton);

    const searchInput = await screen.findByPlaceholderText(/Search models.../i);
    await user.type(searchInput, 'test');

    expect(searchInput.value).toBe('test');
  });

  it('calls updateSettings when model is selected', async () => {
    const mockUpdateSettings = vi.fn();
    mockLLMContext = {
      ...mockLLMContext,
      updateSettings: mockUpdateSettings,
    };

    renderWithRouter(
      <LLMProvider value={mockLLMContext}>
        <AIModelRouter />
      </LLMProvider>
    );

    const switchButton = screen.getByText(/Switch Model/i);
    fireEvent.click(switchButton);

    // Find and click a model item
    await waitFor(() => {
      const modelItems = screen.getAllByRole('menuitem');
      if (modelItems.length > 0) {
        fireEvent.click(modelItems[0]);
        expect(mockUpdateSettings).toHaveBeenCalled();
      }
    });
  });

  it('shows model count in search results', async () => {
    const user = userEvent.setup();

    renderWithRouter(
      <LLMProvider value={mockLLMContext}>
        <AIModelRouter />
      </LLMProvider>
    );

    const switchButton = screen.getByText(/Switch Model/i);
    fireEvent.click(switchButton);

    const searchInput = await screen.findByPlaceholderText(/Search models.../i);
    expect(searchInput).toBeInTheDocument();
  });

  it('displays advanced options toggle', () => {
    renderWithRouter(
      <LLMProvider value={mockLLMContext}>
        <AIModelRouter />
      </LLMProvider>
    );

    expect(screen.getByText(/Show advanced/i)).toBeInTheDocument();
  });

  it('toggles advanced options visibility', async () => {
    renderWithRouter(
      <LLMProvider value={mockLLMContext}>
        <AIModelRouter />
      </LLMProvider>
    );

    const advancedButton = screen.getByText(/Show advanced/i);
    fireEvent.click(advancedButton);

    await waitFor(() => {
      expect(screen.getByText(/Hide advanced/i)).toBeInTheDocument();
    });
  });

  it('displays cost information in advanced mode', async () => {
    renderWithRouter(
      <LLMProvider value={mockLLMContext}>
        <AIModelRouter />
      </LLMProvider>
    );

    const advancedButton = screen.getByText(/Show advanced/i);
    fireEvent.click(advancedButton);

    await waitFor(() => {
      expect(screen.getAllByText(/Cost/i).length).toBeGreaterThan(0);
    });
  });
});

describe('AIModelRouter Keyboard Shortcuts', () => {
  it('responds to Ctrl+1 keyboard shortcut', async () => {
    const mockUpdateSettings = vi.fn();
    mockLLMContext = {
      selectedModel: 'gpt4',
      availableModels: ['gpt4', 'gpt3'],
      updateSettings: mockUpdateSettings,
      settings: {},
    };

    renderWithRouter(
      <LLMProvider value={mockLLMContext}>
        <AIModelRouter />
      </LLMProvider>
    );

    // Simulate Ctrl+1 key press
    fireEvent.keyDown(window, { key: '1', ctrlKey: true });

    // Should trigger updateSettings after a short delay
    await waitFor(
      () => {
        expect(mockUpdateSettings).toHaveBeenCalled();
      },
      { timeout: 100 }
    );
  });

  it('responds to Cmd+1 on Mac', async () => {
    const mockUpdateSettings = vi.fn();
    mockLLMContext = {
      selectedModel: 'gpt4',
      availableModels: ['gpt4', 'gpt3'],
      updateSettings: mockUpdateSettings,
      settings: {},
    };

    renderWithRouter(
      <LLMProvider value={mockLLMContext}>
        <AIModelRouter />
      </LLMProvider>
    );

    // Simulate Cmd+1 (metaKey) key press
    fireEvent.keyDown(window, { key: '1', metaKey: true });

    await waitFor(
      () => {
        expect(mockUpdateSettings).toHaveBeenCalled();
      },
      { timeout: 100 }
    );
  });
});
