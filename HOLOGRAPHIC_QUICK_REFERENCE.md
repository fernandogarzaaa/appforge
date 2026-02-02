# Holographic Consensus Engine - Quick Reference

## ⚛️ What Is It?

A quantum-inspired consensus engine that synthesizes multiple AI model outputs into a single "Truth Vector" using tensor mathematics and quantum interference principles.

```
GPT-4 + Claude + Gemini → [Quantum Superposition] → TRUTH
```

## 🚀 Quick Start

### Basic Usage
```typescript
import { executeHolographicConsensus } from '@/lib/aiRouter';

const result = await executeHolographicConsensus(
    gptResponse,
    claudeResponse,
    geminiResponse
);

console.log(result.confidence);     // 0-1: How certain
console.log(result.entropy);        // 0-1: How uncertain
console.log(result.quality);        // excellent|good|fair|poor
console.log(result.recommendation); // Human-readable assessment
```

### Advanced Usage
```typescript
import { HolographicConsensusEngine } from '@/lib/holographicConsensus';

const engine = new HolographicConsensusEngine(1536, 0.95);
const result = await engine.processAIResponses([
    { model: 'gpt4', text: 'Response 1' },
    { model: 'claude', text: 'Response 2' },
    { model: 'gemini', text: 'Response 3' }
]);
```

## 📊 Key Metrics

| Metric | Range | Meaning |
|--------|-------|---------|
| **Entropy** | 0.0-1.0 | Uncertainty (0=certain, 1=random) |
| **Coherence** | 0.0-1.0 | Model agreement (cosine similarity) |
| **Confidence** | 0.0-1.0 | 1 - entropy (certainty level) |
| **Agreement** | 0.0-1.0 | Avg pairwise model similarity |

## 🎯 Quality Levels

### Excellent (Entropy < 0.1, Coherence > 0.95)
```
⚛️ ZERO-POINT CONSENSUS ACHIEVED
Maximum confidence. Use immediately.
```

### Good (Entropy < 0.3, Coherence > 0.85)
```
✅ STRONG CONSENSUS
High confidence. Ready for production.
```

### Fair (Entropy < 0.5, Coherence > 0.70)
```
⚠️ MODERATE CONSENSUS
Acceptable but review recommended.
```

### Poor (Entropy ≥ 0.5, Coherence < 0.70)
```
❌ WEAK CONSENSUS
Models disagree significantly. Human review needed.
```

## 🔧 Common Patterns

### Pattern 1: Consensus-Only Response
```typescript
const result = await executeHolographicConsensus(gpt, claude, gemini);
if (result.isHighQuality) {
    return result.consensus;
} else {
    throw new Error('Consensus failed');
}
```

### Pattern 2: Consensus with Fallback
```typescript
const result = await executeHolographicConsensus(gpt, claude, gemini);
return result.isHighQuality ? result.consensus : gptResponse;
```

### Pattern 3: Multi-Candidate Search
```typescript
const result = await executeHolographicConsensus(
    gpt, claude, gemini,
    candidates  // Find best matching text
);
return result.consensus;  // Best match from candidates
```

### Pattern 4: Batch Processing
```typescript
import { batchHolographicConsensus } from '@/lib/aiRouter';

const results = await batchHolographicConsensus([
    { gpt4: '...', claude: '...', gemini: '...' },
    { gpt4: '...', claude: '...', gemini: '...' },
]);
```

## 📈 Performance

| Operation | Time |
|-----------|------|
| Consensus computation | 10-15ms |
| Single entropy measure | 0.5-1ms |
| Coherence measure | 1-3ms |
| Full batch (100 items) | ~1-2s |

## 🧮 The Math (Simplified)

### Superposition Formula
```
|Ψ_Truth⟩ = Σ e^(iθ_i) * |Model_i⟩
where θ_i = confidence_i * π
```

### Interference Principle
- **Aligned vectors** (consensus) → **Constructive interference** → **Amplifies truth**
- **Off-axis vectors** (hallucinations) → **Destructive interference** → **Cancels out**

### Entropy Measurement
```
S = -Σ p_i * ln(p_i)
```
Von Neumann entropy of the consensus state.

## 🔍 Debugging

### Check Consensus Quality
```typescript
const result = await executeHolographicConsensus(gpt, claude, gemini);

console.log('Entropy:', result.entropy.toFixed(3));          // Low = good
console.log('Coherence:', (result.coherence * 100).toFixed(1) + '%');  // High = good
console.log('Agreement:', (result.agreementLevel * 100).toFixed(1) + '%'); // High = good
console.log('Quality:', result.quality);
console.log('Recommendation:', result.recommendation);
```

### When Consensus Fails
```typescript
if (result.entropy > 0.5) {
    console.warn('⚠️ Weak consensus');
    console.log('Model outputs may be contradictory');
    console.log(`Coherence: ${(result.coherence * 100).toFixed(1)}%`);
    console.log('Consider requesting clarification or human review');
}
```

## 📁 File Locations

| File | Purpose |
|------|---------|
| `quantum-core/src/holographic.rs` | Core Rust engine |
| `src/lib/holographicConsensus.ts` | TypeScript wrapper |
| `src/lib/aiRouter.ts` | AI routing integration |
| `src/lib/holographicExamples.ts` | Usage examples |
| `HOLOGRAPHIC_CONSENSUS_GUIDE.md` | Full documentation |

## 🎓 Concepts

### Tensor Network
- Treats multiple models as dimensions of a single tensor
- Uses ndarray library for efficient computation
- Enables quantum-like operations

### Holographic Reduced Representations (HRR)
- Circular convolution-based semantic binding
- Compresses multi-dimensional embeddings
- Used in neuroscience and NLP

### Quantum Interference
- Constructive: aligned vectors amplify
- Destructive: contradictory vectors cancel
- Applied to AI response embeddings

### Von Neumann Entropy
- Standard quantum information metric
- Low entropy = high order/certainty
- High entropy = high disorder/uncertainty

## ⚙️ Configuration

### Dimensions (Default: 1536)
```typescript
// OpenAI embeddings are 1536-dimensional
const engine = new HolographicConsensusEngine(1536, 0.95);
```

### Coherence Threshold (Default: 0.95)
```typescript
// How aligned models need to be (0-1)
const engine = new HolographicConsensusEngine(1536, 0.95);
```

## 🚨 Common Issues

### "All models must have same embedding dimension"
- Ensure all three models use the same embedding size
- Default: OpenAI 1536-dim embeddings

### "Entropy too high"
- Models are disagreeing significantly
- Consider broader context or clarification
- Check individual model outputs for issues

### "Low coherence"
- Cosine similarity between models < 0.7
- Models may have different interpretations
- May indicate a complex/ambiguous question

## 💡 Best Practices

1. **Always provide 3 models** for optimal consensus
2. **Check entropy before using** result
3. **Use fallback** when entropy > 0.5
4. **Monitor coherence** for hallucination detection
5. **Log metrics** for analysis and improvement
6. **Cache results** when possible (same embedding)
7. **Handle timeouts** (3 parallel API calls)

## 🔗 API Reference

### executeHolographicConsensus()
```typescript
Promise<{
    truthVector: number[];
    entropy: number;
    coherence: number;
    consensus: string;
    confidence: number;
    quality: string;
    agreementLevel: number;
    recommendation: string;
    isHighQuality: boolean;
}>
```

### HolographicConsensusEngine.processAIResponses()
```typescript
Promise<ConsensusResult>
```

### batchHolographicConsensus()
```typescript
Promise<Array<ConsensusResult>>
```

## 📝 Examples

### Validate a Fact
```typescript
const result = await executeHolographicConsensus(
    gptValidation,
    claudeValidation,
    geminiValidation
);

const isFactual = result.entropy < 0.1 && result.coherence > 0.95;
```

### Generate Best Content
```typescript
const result = await executeHolographicConsensus(gpt, claude, gemini);
if (result.quality === 'excellent') {
    return result.consensus;  // All models agree
} else {
    return responses[0];      // Use primary model
}
```

### Check API Response
```typescript
const validation = await executeHolographicConsensus(
    gptCheck,
    claudeCheck,
    geminiCheck
);
const isValid = result.entropy < 0.15;
```

## 🎯 Next Steps

1. Try basic consensus: `executeHolographicConsensus()`
2. Monitor metrics: entropy, coherence, confidence
3. Integrate into components: `askAIWithConsensus()`
4. Batch process: `batchHolographicConsensus()`
5. Stream real-time: `HolographicStreamingConsensus`

---

**⚛️ Transform your AI from single-model selection to quantum-consensus synthesis.**
