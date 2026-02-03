import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CommandPalette } from '@/features/commandPalette/CommandPalette';

describe('CommandPalette', () => {
  it('opens with Ctrl+K and shows search input', () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    );

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    expect(
      screen.getByPlaceholderText('Search commands... (Cmd+K)')
    ).toBeInTheDocument();
  });

  it('filters commands based on search input', () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    );

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    fireEvent.change(screen.getByPlaceholderText('Search commands... (Cmd+K)'), {
      target: { value: 'analytics' },
    });

    expect(screen.getByText('Go to Analytics')).toBeInTheDocument();
  });
});
