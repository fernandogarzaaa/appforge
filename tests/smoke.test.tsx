import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// vi.mock needs to happen before the component that imports them is loaded
vi.mock('@/hooks/useSovereignStatus', () => ({
    useSovereignStatus: () => ({
        kernel: { version: '1.0.0', integrity: 'SECURE' },
        axioms: { 'REALITY_GUARD': true },
        throughput: 100
    })
}));

vi.mock('@/contexts/NavigationContext', () => ({
    useNavigation: () => ({
        currentProject: { name: 'TEST_PROJECT' }
    })
}));

// Mock lazy-loaded components
vi.mock('@/components/EvolutionMap', () => ({ default: () => <div data-testid="evolution-map" /> }));
vi.mock('@/components/CommandStream', () => ({ default: () => <div data-testid="command-stream" /> }));
vi.mock('@/components/RecordsVault', () => ({ default: () => <div data-testid="records-vault" /> }));

import CommandCenter from '../src/pages/CommandCenter';

describe('Product Smoke Tests', () => {
    it('renders the CommandCenter without crashing', async () => {
        render(<CommandCenter />);

        // Check for core UI elements using more robust matching
        expect(screen.getByText(/AppForge/i)).toBeDefined();
        // 'Sovereign' also appears multiple times (title and header)
        expect(screen.getAllByText(/Sovereign/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/TEST_PROJECT/i)).toBeDefined();
    });

    it('displays the Sovereign Kernel integrity status', () => {
        render(<CommandCenter />);
        // 'SECURE' appears in header handshake and kernel status
        const secureTags = screen.getAllByText(/SECURE/i);
        expect(secureTags.length).toBeGreaterThan(0);
    });

    it('renders lazy-loaded component containers after resolution', async () => {
        render(<CommandCenter />);
        // Use findBy to wait for Suspense to resolve the mocked lazy components
        expect(await screen.findByTestId('evolution-map')).toBeDefined();
        expect(await screen.findByTestId('command-stream')).toBeDefined();
        expect(await screen.findByTestId('records-vault')).toBeDefined();
    });
});
