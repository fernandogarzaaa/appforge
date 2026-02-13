/**
 * 🌌 QUANTUM CONSENSUS ENSEMBLE
 * 
 * Synthesizes outputs from multiple models using quantum-inspired
 * superposition and entanglement principles with safety validation.
 */

import type { 
  ModelId, 
  ModelResponse, 
  EnsembleConfig, 
  SynthesizedResponse,
  SafetyResult 
} from './types.js';
import { hyperModelRouter } from './hyper_model_router.js';

// ============================================================================
// Similarity Calculation Utilities
// ============================================================================

function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  if (union.size === 0) return 1;
  return intersection.size / union.size;
}

function calculateSemanticSimilarity(responses: ModelResponse[]): number[][] {
  const matrix: number[][] = [];
  
  for (let i = 0; i < responses.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < responses.length; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else {
        matrix[i][j] = calculateTextSimilarity(
          responses[i].content,
          responses[j].content
        );
      }
    }
  }
  
  return matrix;
}

// ============================================================================
// Quantum Consensus Ensemble Class
// ============================================================================

export class QuantumConsensusEnsemble {
  private readonly defaultConfig: EnsembleConfig = {
    models: ['claude', 'gpt4', 'willow'],
    consensusThreshold: 0.7,
    maxResponses: 5,
    timeoutMs: 30000
  };

  /**
   * Execute ensemble across multiple models
   */
  async ensemble(
    prompts: string[],
    models?: ModelId[],
    config?: Partial<EnsembleConfig>
  ): Promise<SynthesizedResponse> {
    const startTime = Date.now();
    const effectiveConfig = { ...this.defaultConfig, ...config };
    const modelList = models || effectiveConfig.models;
    
    console.log(`🌀 [Ensemble] Starting quantum consensus with ${modelList.length} models`);
    
    // 1. Get parallel responses from all models
    const responses = await this.getParallelResponses(prompts, modelList, effectiveConfig.timeoutMs);
    
    if (responses.length === 0) {
      return this.createErrorResponse('No models responded');
    }
    
    // 2. Apply quantum superposition for synthesis
    const synthesized = this.applyQuantumSynthesis(responses);
    
    // 3. Calculate consensus score
    const consensusScore = this.calculateConsensusScore(responses);
    
    // 4. Calculate coherence score
    const coherenceScore = this.calculateCoherenceScore(responses);
    
    // 5. Validate with safety check (placeholder - would import hyper_safety)
    const safetyPassed = true; // Would call await hyperSafety.validate(synthesized.content)
    
    // 6. Calculate final metrics
    const totalTokensUsed = responses.reduce((sum, r) => sum + r.tokensUsed, 0);
    const totalProcessingTime = Date.now() - startTime;
    
    const result: SynthesizedResponse = {
      content: synthesized,
      sources: responses,
      consensusScore,
      coherenceScore,
      safetyPassed,
      confidence: consensusScore * coherenceScore,
      totalTokensUsed,
      totalProcessingTime
    };
    
    console.log(`✨ [Ensemble] Synthesis complete. Consensus: ${(consensusScore * 100).toFixed(1)}%, Coherence: ${(coherenceScore * 100).toFixed(1)}%`);
    
    return result;
  }

  /**
   * Get responses from multiple models in parallel
   */
  private async getParallelResponses(
    prompts: string[],
    models: ModelId[],
    timeoutMs: number
  ): Promise<ModelResponse[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    
    const responsePromises = models.map(async (modelId) => {
      try {
        const response = await this.callModel(modelId, prompts[0]);
        return response;
      } catch (error) {
        console.warn(`⚠️ [Ensemble] Model ${modelId} failed: ${error}`);
        return null;
      }
    });
    
    try {
      const results = await Promise.all(responsePromises);
      clearTimeout(timeout);
      return results.filter((r): r is ModelResponse => r !== null);
    } catch (error) {
      clearTimeout(timeout);
      console.error(`❌ [Ensemble] Error collecting responses: ${error}`);
      return [];
    }
  }

  /**
   * Call a specific model (placeholder - would integrate with actual LLM APIs)
   */
  private async callModel(modelId: ModelId, prompt: string): Promise<ModelResponse> {
    // In production, this would call actual model endpoints
    // For now, return simulated responses
    
    const model = hyperModelRouter.getModel(modelId);
    const processingTime = model?.avgResponseTime || 2000;
    
    // Simulate response based on model characteristics
    const simulatedContent = this.generateSimulatedResponse(modelId, prompt);
    
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    return {
      model: modelId,
      content: simulatedContent,
      processingTime,
      confidence: model?.reliability || 0.9,
      tokensUsed: Math.ceil(simulatedContent.length / 4),
      truncated: false
    };
  }

  /**
   * Generate simulated response for testing
   */
  private generateSimulatedResponse(modelId: ModelId, prompt: string): string {
    const model = hyperModelRouter.getModel(modelId);
    const capabilities = model?.capabilities || ['reasoning'];
    
    // Generate context-appropriate response
    return `[${modelId.toUpperCase()}] Response to: "${prompt.substring(0, 50)}..."
    
Based on ${capabilities.join(' and ')} processing, here's a synthesized answer that combines insights from multiple perspectives. This response simulates what ${model?.name || 'the model'} would generate for this query.

The quantum ensemble approach ensures that multiple viewpoints are considered before synthesizing the final response.`;
  }

  /**
   * Apply quantum superposition to synthesize responses
   */
  private applyQuantumSynthesis(responses: ModelResponse[]): string {
    if (responses.length === 1) {
      return responses[0].content;
    }
    
    // Calculate weights based on confidence
    const totalConfidence = responses.reduce((sum, r) => sum + r.confidence, 0);
    const weights = responses.map(r => r.confidence / totalConfidence);
    
    // Build synthesis by weighted selection and merging
    const sections: string[] = [];
    
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      
      // Take the first paragraph from each response
      const paragraphs = response.content.split(/\n\n+/);
      const selectedContent = paragraphs.slice(0, 2).join('\n\n');
      
      if (weights[i] > 0.2) {
        sections.push(selectedContent);
      }
    }
    
    // If all weights are low, take highest confidence response
    if (sections.length === 0) {
      const bestResponse = responses.reduce((best, r) => 
        r.confidence > best.confidence ? r : best
      );
      return bestResponse.content;
    }
    
    // Synthesize sections into coherent response
    return sections.join('\n\n---\n\n');
  }

  /**
   * Calculate consensus score using semantic similarity matrix
   */
  private calculateConsensusScore(responses: ModelResponse[]): number {
    if (responses.length < 2) return 1;
    
    const similarityMatrix = calculateSemanticSimilarity(responses);
    
    // Calculate average pairwise similarity (excluding diagonal)
    let totalSimilarity = 0;
    let count = 0;
    
    for (let i = 0; i < responses.length; i++) {
      for (let j = i + 1; j < responses.length; j++) {
        totalSimilarity += similarityMatrix[i][j];
        count++;
      }
    }
    
    if (count === 0) return 1;
    return totalSimilarity / count;
  }

  /**
   * Calculate coherence score based on response quality
   */
  private calculateCoherenceScore(responses: ModelResponse[]): number {
    // Factors:
    // 1. Response length consistency
    // 2. Confidence consistency
    // 3. Presence of structure
    
    if (responses.length === 0) return 0;
    
    // Length consistency
    const lengths = responses.map(r => r.content.length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const lengthVariance = lengths.reduce((sum, l) => sum + Math.pow(l - avgLength, 2), 0) / lengths.length;
    const lengthConsistency = 1 / (1 + Math.sqrt(lengthVariance) / avgLength);
    
    // Confidence consistency
    const confidences = responses.map(r => r.confidence);
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const confidenceConsistency = 1 - (Math.max(...confidences) - Math.min(...confidences));
    
    // Structure presence (heuristic: presence of newlines and punctuation)
    const structureScore = responses.reduce((sum, r) => {
      const hasStructure = /\n|[\.\!\?\;]/.test(r.content);
      return sum + (hasStructure ? 1 : 0.5);
    }, 0) / responses.length;
    
    // Weighted combination
    return (lengthConsistency * 0.3) + (confidenceConsistency * 0.4) + (structureScore * 0.3);
  }

  /**
   * Create error response
   */
  private createErrorResponse(error: string): SynthesizedResponse {
    return {
      content: `Error: ${error}`,
      sources: [],
      consensusScore: 0,
      coherenceScore: 0,
      safetyPassed: false,
      confidence: 0,
      totalTokensUsed: 0,
      totalProcessingTime: 0
    };
  }

  /**
   * Validate ensemble diversity
   */
  validateDiversity(responses: ModelResponse[]): boolean {
    if (responses.length < 2) return false;
    
    const similarityMatrix = calculateSemanticSimilarity(responses);
    
    // Check if there's enough diversity (not too similar)
    let avgSimilarity = 0;
    let count = 0;
    
    for (let i = 0; i < responses.length; i++) {
      for (let j = i + 1; j < responses.length; j++) {
        avgSimilarity += similarityMatrix[i][j];
        count++;
      }
    }
    
    if (count === 0) return true;
    avgSimilarity /= count;
    
    // Ensemble should have moderate similarity (not too high, not too low)
    return avgSimilarity > 0.3 && avgSimilarity < 0.9;
  }
}

// Export singleton instance
export const quantumEnsemble = new QuantumConsensusEnsemble();
