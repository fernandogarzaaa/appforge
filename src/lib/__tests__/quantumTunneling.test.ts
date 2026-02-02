import { QuantumTunnelingAnalyzer, tunneling } from '../quantumTunneling';

describe('QuantumTunnelingAnalyzer', () => {
  let analyzer: QuantumTunnelingAnalyzer;

  beforeEach(() => {
    analyzer = new QuantumTunnelingAnalyzer();
  });

  describe('Penetration Testing', () => {
    test('should initialize scanner', () => {
      expect(analyzer).toBeDefined();
      expect(analyzer.barriers).toEqual([]);
    });

    test('should calculate low tunneling probability for strong barrier', () => {
      const probability = analyzer.calculateTunnelingProbability(
        0.1, // Low particle energy
        0.8, // High barrier height
        1.0  // Barrier width
      );

      expect(probability).toBeLessThan(0.1);
    });

    test('should calculate high tunneling probability for weak barrier', () => {
      const probability = analyzer.calculateTunnelingProbability(
        0.9, // High particle energy
        0.2, // Low barrier height
        0.1  // Narrow barrier
      );

      expect(probability).toBeGreaterThan(0.5);
    });

    test('should handle edge case - zero energy', () => {
      const probability = analyzer.calculateTunnelingProbability(0, 0.5, 1.0);
      expect(probability).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Security Analysis', () => {
    test('should identify critical vulnerabilities', async () => {
      const barriers = [0.3, 0.2, 0.25]; // Weak barriers
      const result = await analyzer.runPenetrationTest(barriers);

      expect(result).toBeDefined();
      expect(result.riskLevel).toBeGreaterThan('LOW');
    });

    test('should identify strong security', async () => {
      const barriers = [0.9, 0.95, 0.92]; // Strong barriers
      const result = await analyzer.runPenetrationTest(barriers);

      expect(result).toBeDefined();
      expect(result.riskLevel).toBe('LOW');
    });

    test('should find critical weakness in barrier set', () => {
      analyzer.addBarrier(0.8);
      analyzer.addBarrier(0.2); // Weak point
      analyzer.addBarrier(0.85);

      const weakness = analyzer.findCriticalWeakness();
      expect(weakness).toBeCloseTo(0.2, 1);
    });
  });

  describe('WKB Approximation', () => {
    test('should calculate reflection coefficient correctly', () => {
      // For high energies, reflection should be low
      const reflection = analyzer.calculateReflectionCoefficient(0.9, 0.5, 1.0);
      expect(reflection).toBeLessThan(0.3);
    });

    test('should calculate transmission coefficient correctly', () => {
      // Transmission + Reflection = 1
      const energy = 0.7;
      const height = 0.4;
      const width = 0.8;

      const reflection = analyzer.calculateReflectionCoefficient(energy, height, width);
      const transmission = analyzer.calculateTunnelingProbability(energy, height, width);

      expect(Math.abs(reflection + transmission - 1.0)).toBeLessThan(0.05);
    });
  });

  describe('Attack Vector Analysis', () => {
    test('should identify most likely attack vector', async () => {
      const vectors = [
        { vector: 'sql-injection', barrier: 0.7 },
        { vector: 'xss-attack', barrier: 0.3 },
        { vector: 'csrf', barrier: 0.8 },
      ];

      const mostLikely = await analyzer.findMostLikelyVector(vectors);
      expect(mostLikely.vector).toBe('xss-attack');
    });

    test('should score attack difficulty', () => {
      const score = analyzer.scoreAttackDifficulty(0.85); // High barrier = hard to attack
      expect(score).toBeLessThan(50); // Low difficulty score for hard attacks
    });
  });

  describe('Singleton Pattern', () => {
    test('should provide global singleton instance', () => {
      expect(tunneling).toBeDefined();
      expect(tunneling).toBeInstanceOf(QuantumTunnelingAnalyzer);
    });

    test('singleton should maintain barrier state', () => {
      tunneling.clearBarriers();
      tunneling.addBarrier(0.5);

      expect(tunneling.barriers.length).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle boundary probabilities', () => {
      const prob1 = analyzer.calculateTunnelingProbability(1.0, 0, 0);
      const prob2 = analyzer.calculateTunnelingProbability(0, 1.0, 1.0);

      expect(prob1).toBeGreaterThanOrEqual(0);
      expect(prob2).toBeGreaterThanOrEqual(0);
    });

    test('should handle invalid barrier width', () => {
      expect(() => {
        analyzer.calculateTunnelingProbability(0.5, 0.5, -1);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    test('should complete penetration test within time limit', async () => {
      const barriers = Array(100).fill(0).map(() => Math.random());
      
      const start = performance.now();
      await analyzer.runPenetrationTest(barriers);
      const end = performance.now();

      expect(end - start).toBeLessThan(2000); // Less than 2 seconds
    });
  });
});
