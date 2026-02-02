import { HolographicConsensusAnalyzer, holographicConsensus } from '../holographicConsensus';

describe('HolographicConsensusAnalyzer', () => {
  let analyzer: HolographicConsensusAnalyzer;

  beforeEach(() => {
    analyzer = new HolographicConsensusAnalyzer();
  });

  describe('Basic Functionality', () => {
    test('should initialize with default parameters', () => {
      expect(analyzer).toBeDefined();
      expect(analyzer.dimension).toBe(3);
      expect(analyzer.responses).toEqual([]);
    });

    test('should add model responses', async () => {
      analyzer.addResponse('gpt4', 'Response from GPT-4');
      analyzer.addResponse('claude', 'Response from Claude');
      
      expect(analyzer.responses.length).toBe(2);
      expect(analyzer.responses[0].model).toBe('gpt4');
    });

    test('should compute consensus with multiple responses', async () => {
      analyzer.addResponse('gpt4', 'Same core idea');
      analyzer.addResponse('claude', 'Same core idea');
      analyzer.addResponse('gemini', 'Same core idea');

      const result = await analyzer.computeConsensus();
      
      expect(result).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.qualityScore).toBeGreaterThan(0);
    });

    test('should handle conflicting responses', async () => {
      analyzer.addResponse('gpt4', 'Response A - completely different');
      analyzer.addResponse('claude', 'Response B - completely different');
      analyzer.addResponse('gemini', 'Response C - completely different');

      const result = await analyzer.computeConsensus();
      
      expect(result).toBeDefined();
      expect(result.entropy).toBeGreaterThan(0.5);
    });
  });

  describe('Entropy Calculation', () => {
    test('should calculate low entropy for similar responses', () => {
      analyzer.addResponse('gpt4', 'Identical response');
      analyzer.addResponse('claude', 'Identical response');
      
      const entropy = analyzer.calculateEntropy();
      expect(entropy).toBeLessThan(0.3);
    });

    test('should calculate high entropy for diverse responses', () => {
      analyzer.addResponse('gpt4', 'Completely different response A');
      analyzer.addResponse('claude', 'Completely different response B');
      analyzer.addResponse('gemini', 'Completely different response C');
      
      const entropy = analyzer.calculateEntropy();
      expect(entropy).toBeGreaterThan(0.7);
    });

    test('entropy should be between 0 and 1', () => {
      analyzer.addResponse('gpt4', 'Test');
      analyzer.addResponse('claude', 'Test');
      
      const entropy = analyzer.calculateEntropy();
      expect(entropy).toBeGreaterThanOrEqual(0);
      expect(entropy).toBeLessThanOrEqual(1);
    });
  });

  describe('Coherence Measurement', () => {
    test('should measure coherence of tensor network', async () => {
      analyzer.addResponse('gpt4', 'Coherent response 1');
      analyzer.addResponse('claude', 'Coherent response 2');
      analyzer.addResponse('gemini', 'Coherent response 3');

      const coherence = analyzer.measureCoherence();
      
      expect(coherence).toBeGreaterThanOrEqual(0);
      expect(coherence).toBeLessThanOrEqual(1);
    });

    test('should return high coherence for aligned responses', () => {
      analyzer.addResponse('gpt4', 'The answer is 42');
      analyzer.addResponse('claude', 'The answer is 42');
      analyzer.addResponse('gemini', 'The answer is 42');

      const coherence = analyzer.measureCoherence();
      expect(coherence).toBeGreaterThan(0.8);
    });
  });

  describe('Singleton Pattern', () => {
    test('should provide global singleton instance', () => {
      expect(holographicConsensus).toBeDefined();
      expect(holographicConsensus).toBeInstanceOf(HolographicConsensusAnalyzer);
    });

    test('singleton should maintain state across calls', () => {
      holographicConsensus.clearResponses();
      holographicConsensus.addResponse('gpt4', 'Test response');
      
      expect(holographicConsensus.responses.length).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty responses', () => {
      expect(() => analyzer.calculateEntropy()).not.toThrow();
    });

    test('should handle single response', async () => {
      analyzer.addResponse('gpt4', 'Only response');
      const result = await analyzer.computeConsensus();
      
      expect(result).toBeDefined();
      expect(result.qualityScore).toBeGreaterThan(0);
    });

    test('should handle very long responses', () => {
      const longResponse = 'A'.repeat(10000);
      analyzer.addResponse('gpt4', longResponse);
      
      expect(analyzer.responses[0].content.length).toBe(10000);
    });

    test('should handle special characters in responses', () => {
      analyzer.addResponse('gpt4', '!@#$%^&*()_+-=[]{}|;:,.<>?');
      
      expect(analyzer.responses.length).toBe(1);
    });
  });

  describe('Performance', () => {
    test('should compute consensus within reasonable time', async () => {
      analyzer.addResponse('gpt4', 'Response 1');
      analyzer.addResponse('claude', 'Response 2');
      analyzer.addResponse('gemini', 'Response 3');

      const start = performance.now();
      await analyzer.computeConsensus();
      const end = performance.now();

      expect(end - start).toBeLessThan(1000); // Less than 1 second
    });

    test('should handle multiple computations efficiently', async () => {
      for (let i = 0; i < 10; i++) {
        analyzer.addResponse(`model${i}`, `Response ${i}`);
      }

      const start = performance.now();
      for (let i = 0; i < 5; i++) {
        await analyzer.computeConsensus();
      }
      const end = performance.now();

      expect(end - start).toBeLessThan(5000); // Less than 5 seconds for 5 calls
    });
  });
});
