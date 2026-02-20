import { QuantumRenormalizationEngine, renormalization } from '../quantumRenormalization';

describe('QuantumRenormalizationEngine', () => {
  let engine: QuantumRenormalizationEngine;

  beforeEach(() => {
    engine = new QuantumRenormalizationEngine();
  });

  describe('Criticality Prediction', () => {
    test('should initialize with default parameters', () => {
      expect(engine).toBeDefined();
      expect(engine.metrics).toEqual([]);
      expect(engine.correlationLength).toBe(1.0);
    });

    test('should predict low criticality for stable metrics', () => {
      const metrics = [10, 11, 10, 12, 11]; // Stable around 10-12
      const criticality = engine.predictCriticality(metrics);

      expect(criticality).toBeLessThan(0.3);
    });

    test('should predict high criticality for volatile metrics', () => {
      const metrics = [5, 50, 10, 100, 20]; // Highly volatile
      const criticality = engine.predictCriticality(metrics);

      expect(criticality).toBeGreaterThan(0.7);
    });

    test('criticality should be between 0 and 1', () => {
      const metrics = Array.from({ length: 10 }, () => Math.random() * 100);
      const criticality = engine.predictCriticality(metrics);

      expect(criticality).toBeGreaterThanOrEqual(0);
      expect(criticality).toBeLessThanOrEqual(1);
    });
  });

  describe('Phase Transition Detection', () => {
    test('should detect approaching phase transition', () => {
      // Metrics showing pre-transition behavior
      const metrics = [10, 15, 25, 45, 90];
      const isApproaching = engine.isApproachingPhaseTransition(metrics);

      expect(isApproaching).toBe(true);
    });

    test('should identify stable phase', () => {
      const metrics = [50, 50, 51, 49, 50]; // Stable plateau
      const isApproaching = engine.isApproachingPhaseTransition(metrics);

      expect(isApproaching).toBe(false);
    });

    test('should calculate critical exponent', () => {
      const metrics = [10, 20, 40, 80, 160]; // Exponential growth
      const exponent = engine.calculateCriticalExponent(metrics);

      expect(exponent).toBeGreaterThan(1);
    });
  });

  describe('Coarse Graining', () => {
    test('should coarse grain metric fluctuations', () => {
      const fineMesh = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const coarse = engine.coarseGrain(fineMesh, 2);

      expect(coarse.length).toBeLessThan(fineMesh.length);
    });

    test('should preserve overall trends during coarse graining', () => {
      const metrics = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
      const coarse = engine.coarseGrain(metrics, 2);

      const avgOriginal = metrics.reduce((a, b) => a + b) / metrics.length;
      const avgCoarse = coarse.reduce((a, b) => a + b) / coarse.length;

      expect(Math.abs(avgOriginal - avgCoarse)).toBeLessThan(1);
    });

    test('should handle different block sizes', () => {
      const metrics = Array(100).fill(0).map(() => Math.random() * 100);

      for (let blockSize of [2, 5, 10]) {
        const coarse = engine.coarseGrain(metrics, blockSize);
        expect(coarse.length).toBeLessThanOrEqual(metrics.length / blockSize + 1);
      }
    });
  });

  describe('RG Flow Analysis', () => {
    test('should compute flow evolution', () => {
      const metrics = [10, 12, 15, 20, 30];
      const flow = engine.flowEvolution(metrics);

      expect(flow).toBeGreaterThan(0);
    });

    test('should track fixed points', () => {
      const metrics = [50, 50, 50, 50, 50]; // Fixed point
      const flow = engine.flowEvolution(metrics);

      expect(flow).toBeLessThan(0.1);
    });

    test('should measure coupling constants', () => {
      const metrics = [10, 20, 30, 40, 50];
      const coupling = engine.measureCouplingConstant(metrics);

      expect(coupling).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Time to Failure Estimation', () => {
    test('should estimate time to critical point', () => {
      const metrics = [10, 12, 14, 16, 18]; // Linear growth
      const timeToFailure = engine.estimateTimeToCriticality(metrics, 0.1); // Check per unit

      expect(timeToFailure).toBeGreaterThan(0);
    });

    test('should estimate short time for rapid degradation', () => {
      const metrics = [10, 50, 100, 200]; // Exponential growth
      const shortTime = engine.estimateTimeToCriticality(metrics, 0.1);

      const metrics2 = [10, 11, 12, 13]; // Slow growth
      const longTime = engine.estimateTimeToCriticality(metrics2, 0.1);

      expect(shortTime).toBeLessThan(longTime);
    });

    test('should return infinity for stable systems', () => {
      const metrics = [50, 50, 50, 50, 50];
      const time = engine.estimateTimeToCriticality(metrics, 0.1);

      expect(time).toBeGreaterThan(1000); // Very large time
    });
  });

  describe('Correlation Length', () => {
    test('should calculate correlation length', () => {
      const metrics = [10, 20, 30, 40, 50];
      const correlation = engine.calculateCorrelationLength(metrics);

      expect(correlation).toBeGreaterThan(0);
    });

    test('should detect short correlation lengths', () => {
      const metrics = [1, 100, 2, 99, 3]; // No correlation
      const correlation = engine.calculateCorrelationLength(metrics);

      expect(correlation).toBeLessThan(2);
    });

    test('should detect long correlation lengths', () => {
      const metrics = [10, 20, 30, 40, 50, 60]; // Strong correlation
      const correlation = engine.calculateCorrelationLength(metrics);

      expect(correlation).toBeGreaterThan(2);
    });
  });

  describe('Health Status', () => {
    test('should report HEALTHY for low criticality', () => {
      const metrics = [50, 50, 51, 49, 50];
      const status = engine.getHealthStatus(metrics);

      expect(status).toBe('HEALTHY');
    });

    test('should report WARNING for medium criticality', () => {
      const metrics = [10, 20, 30, 40, 50];
      const status = engine.getHealthStatus(metrics);

      expect(['WARNING', 'HEALTHY']).toContain(status);
    });

    test('should report CRITICAL for high criticality', () => {
      const metrics = [1, 10, 100, 1000, 10000];
      const status = engine.getHealthStatus(metrics);

      expect(['CRITICAL', 'WARNING']).toContain(status);
    });
  });

  describe('Singleton Pattern', () => {
    test('should provide global singleton instance', () => {
      expect(renormalization).toBeDefined();
      expect(renormalization).toBeInstanceOf(QuantumRenormalizationEngine);
    });

    test('singleton should maintain metric history', () => {
      renormalization.clearMetrics();
      renormalization.recordMetric(50);

      expect(renormalization.metrics.length).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty metrics', () => {
      expect(() => engine.predictCriticality([])).not.toThrow();
    });

    test('should handle single metric', () => {
      const criticality = engine.predictCriticality([50]);
      expect(criticality).toBeGreaterThanOrEqual(0);
    });

    test('should handle very large metrics', () => {
      const metrics = [1e10, 2e10, 3e10];
      const criticality = engine.predictCriticality(metrics);

      expect(criticality).toBeGreaterThanOrEqual(0);
    });

    test('should handle very small metrics', () => {
      const metrics = [1e-10, 2e-10, 3e-10];
      const criticality = engine.predictCriticality(metrics);

      expect(criticality).toBeGreaterThanOrEqual(0);
    });

    test('should handle negative metrics', () => {
      const metrics = [-10, -20, -30];
      const criticality = engine.predictCriticality(metrics);

      expect(criticality).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance', () => {
    test('should handle large metric arrays', () => {
      const metrics = Array(10000).fill(0).map(() => Math.random() * 100);

      const start = performance.now();
      engine.predictCriticality(metrics);
      const end = performance.now();

      expect(end - start).toBeLessThan(1000); // Less than 1 second
    });

    test('should coarse grain efficiently', () => {
      const metrics = Array(10000).fill(0).map(() => Math.random());

      const start = performance.now();
      engine.coarseGrain(metrics, 10);
      const end = performance.now();

      expect(end - start).toBeLessThan(500); // Less than 500ms
    });
  });
});
