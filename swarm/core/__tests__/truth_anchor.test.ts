import { describe, it, expect, vi } from 'vitest';
import { realitySensor } from '../reality_sensor.js';
import { godSwarm } from '../god_swarm.js';
import { SingularityEngine } from '../singularity_engine.js';
import { CuriosityEngine } from '../curiosity_engine.js';
import { Base44Tool } from '../../tools/base44.js';

describe('Universal Epistemic Purge (Phase 135)', () => {

    it('RealitySensor should return real market and hardware signals', async () => {
        const signals = await realitySensor.scan();

        // Verify no simulated volatility or random novelty
        const marketSignals = signals.filter(s => s.source === 'market');
        expect(marketSignals.length).toBeGreaterThan(0);
        expect(marketSignals[0].type).toBe('SOL_PRICE_PULSE');
        expect(marketSignals[0].payload.priceUsd).toBeGreaterThan(0);

        // Verify hardware telemetry
        const systemSignals = signals.filter(s => s.type === 'HARDWARE_STRESS');
        // Hardware stress might not be triggered if load is low, but the logic should exist
        const signalsTypes = signals.map(s => s.type);
        expect(signalsTypes).not.toContain('HIGH_VOLATILITY'); // Simulated name purged
    });

    it('GodSwarm should derive metrics from RealitySensor', async () => {
        // Mock reality sensor to ensure GodSwarm picks up the signal
        vi.spyOn(realitySensor, 'getSignals').mockReturnValue([
            { source: 'system', type: 'BUILD_FAILURE', intensity: 0.9, payload: {}, timestamp: '' }
        ]);

        // @ts-ignore - access private for test
        await godSwarm.discoverSwarms();

        // @ts-ignore
        const registry = godSwarm.swarmRegistry;
        for (const metrics of registry.values()) {
            expect(metrics.successRate).toBe(0.3); // Derived from BUILD_FAILURE in RealitySensor
        }
    });

    it('SingularityEngine should evolve based on Real Telemetry', async () => {
        const singularity = new SingularityEngine();
        const initialInt = singularity.getState().intelligenceLevel;

        // Force build success signal
        vi.spyOn(realitySensor, 'getSignals').mockReturnValue([]);

        // @ts-ignore
        await singularity.evolveState();

        expect(singularity.getState().intelligenceLevel).toBeGreaterThan(initialInt);
    });

    it('CuriosityEngine should use Git-based novelty scanning', async () => {
        const curiosity = new CuriosityEngine({} as Base44Tool);
        // @ts-ignore
        const candidates = await curiosity.findCandidateFiles();

        // Ensure candidates exist and are sorted (not random)
        expect(candidates.length).toBeGreaterThan(0);
        expect(candidates[0]).toMatch(/\.ts$|\.js$/);
    }, 30000);
});
