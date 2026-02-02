import { QuantumZenoMonitor, zeno } from '../quantumZeno';

describe('QuantumZenoMonitor', () => {
  let monitor: QuantumZenoMonitor;

  beforeEach(() => {
    monitor = new QuantumZenoMonitor();
  });

  describe('Stability Calculation', () => {
    test('should initialize with default parameters', () => {
      expect(monitor).toBeDefined();
      expect(monitor.testFrequency).toBe(1.0);
      expect(monitor.stabilityHistory).toEqual([]);
    });

    test('should calculate high stability with frequent testing', () => {
      const stability = monitor.calculateStability(
        10.0, // High test frequency (Hz)
        0.5   // 50% time since last test
      );

      expect(stability).toBeGreaterThan(0.8);
    });

    test('should calculate low stability with infrequent testing', () => {
      const stability = monitor.calculateStability(
        0.1,  // Low test frequency (Hz)
        5.0   // Long time since last test
      );

      expect(stability).toBeLessThan(0.3);
    });

    test('stability should be between 0 and 1', () => {
      const stability = monitor.calculateStability(2.0, 1.0);
      expect(stability).toBeGreaterThanOrEqual(0);
      expect(stability).toBeLessThanOrEqual(1);
    });
  });

  describe('Zeno Effect Detection', () => {
    test('should detect Zeno effect when active', () => {
      monitor.recordObservation(0.95); // High stability
      monitor.recordObservation(0.94);
      monitor.recordObservation(0.96);

      const isActive = monitor.isStateFreezen();
      expect(isActive).toBe(true);
    });

    test('should detect degradation without frequent observation', () => {
      monitor.recordObservation(0.9);
      monitor.recordObservation(0.8);
      monitor.recordObservation(0.7);
      monitor.recordObservation(0.6);

      const isActive = monitor.isStateFreezen();
      expect(isActive).toBe(false);
    });

    test('should calculate degradation timeline', () => {
      for (let i = 0; i < 10; i++) {
        monitor.recordObservation(0.9 - i * 0.05);
      }

      const timeline = monitor.calculateDegradationTimeline();
      expect(timeline.timeToFailure).toBeGreaterThan(0);
    });
  });

  describe('Testing Strategy', () => {
    test('should recommend optimal test frequency', () => {
      monitor.recordObservation(0.8);
      monitor.recordObservation(0.75);

      const recommendation = monitor.recommendTestFrequency();
      expect(recommendation).toBeGreaterThan(0);
      expect(recommendation).toBeLessThan(100);
    });

    test('should identify critical observation windows', () => {
      const windows = monitor.findCriticalObservationWindows();
      expect(Array.isArray(windows)).toBe(true);
    });

    test('should calculate optimal observation pattern', () => {
      const pattern = monitor.calculateOptimalObservationPattern(1.0);
      expect(pattern.frequency).toBeGreaterThan(0);
      expect(pattern.duration).toBeGreaterThan(0);
    });
  });

  describe('Freeze Depth Measurement', () => {
    test('should measure freeze depth correctly', () => {
      monitor.recordObservation(0.99);
      monitor.recordObservation(0.98);
      monitor.recordObservation(0.99);

      const depth = monitor.measureFreezeDepth();
      expect(depth).toBeGreaterThan(0.9); // Very frozen
    });

    test('should show shallow freeze for varied observations', () => {
      monitor.recordObservation(0.8);
      monitor.recordObservation(0.5);
      monitor.recordObservation(0.7);

      const depth = monitor.measureFreezeDepth();
      expect(depth).toBeLessThan(0.6);
    });
  });

  describe('State Evolution', () => {
    test('should track state evolution over time', () => {
      const states = [];
      for (let i = 0; i < 5; i++) {
        const stability = 0.9 - i * 0.1;
        monitor.recordObservation(stability);
        states.push(stability);
      }

      expect(monitor.stabilityHistory.length).toBe(5);
    });

    test('should predict future stability', () => {
      monitor.recordObservation(0.95);
      monitor.recordObservation(0.94);
      monitor.recordObservation(0.93);

      const prediction = monitor.predictFutureStability(5); // 5 seconds ahead
      expect(prediction).toBeGreaterThan(0);
      expect(prediction).toBeLessThan(1);
    });
  });

  describe('Singleton Pattern', () => {
    test('should provide global singleton instance', () => {
      expect(zeno).toBeDefined();
      expect(zeno).toBeInstanceOf(QuantumZenoMonitor);
    });

    test('singleton should maintain observation history', () => {
      zeno.clearHistory();
      zeno.recordObservation(0.9);

      expect(zeno.stabilityHistory.length).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero test frequency', () => {
      const stability = monitor.calculateStability(0, 1.0);
      expect(stability).toBeGreaterThanOrEqual(0);
    });

    test('should handle very high observations', () => {
      monitor.recordObservation(0.9999);
      expect(monitor.stabilityHistory.length).toBe(1);
    });

    test('should handle very low observations', () => {
      monitor.recordObservation(0.0001);
      expect(monitor.stabilityHistory.length).toBe(1);
    });

    test('should handle consecutive identical observations', () => {
      for (let i = 0; i < 100; i++) {
        monitor.recordObservation(0.75);
      }

      const depth = monitor.measureFreezeDepth();
      expect(depth).toBeGreaterThan(0.9);
    });
  });

  describe('Performance', () => {
    test('should handle large observation datasets', () => {
      const start = performance.now();
      
      for (let i = 0; i < 10000; i++) {
        monitor.recordObservation(Math.random());
      }
      
      const end = performance.now();
      expect(end - start).toBeLessThan(1000); // Less than 1 second
    });

    test('should calculate stability quickly', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        monitor.calculateStability(Math.random() * 10, Math.random() * 5);
      }
      
      const end = performance.now();
      expect(end - start).toBeLessThan(500); // Less than 500ms
    });
  });
});
