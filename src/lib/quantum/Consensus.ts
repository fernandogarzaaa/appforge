import HolographicConsensusEngine from '../holographicConsensus';

let holoEngine: HolographicConsensusEngine | null = null;

async function initializeHolographicEngine(): Promise<HolographicConsensusEngine> {
  if (holoEngine) return holoEngine;
  
  holoEngine = new HolographicConsensusEngine(1536, 0.95);
  console.log('⚛️ Holographic Consensus Engine Initialized');
  return holoEngine;
}

/**
 * Executes Holographic Consensus on multiple model responses
 */
export async function executeHolographicConsensus(
  gptResponse: string,
  claudeResponse: string,
  geminiResponse: string,
  candidates?: string[]
): Promise<any> {
  try {
    const engine = await initializeHolographicEngine();

    const result = await engine.processAIResponses(
      [
        { model: 'gpt4', text: gptResponse },
        { model: 'claude', text: claudeResponse },
        { model: 'gemini', text: geminiResponse },
      ],
      candidates
    );

    return {
      truthVector: result.truthVector,
      consensus: result.consensus,
      entropy: result.entropy,
      coherence: result.coherence,
      confidence: result.confidence,
      quality: result.quality,
      agreementLevel: result.agreementLevel,
      recommendation: result.recommendation,
      isHighQuality: result.entropy < 0.1,
    };
  } catch (error) {
    console.error('❌ Holographic consensus failed:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: true,
    };
  }
}
