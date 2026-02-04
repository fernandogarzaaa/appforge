import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { learnings, userEmail } = await req.json();

    if (!learnings || learnings.length === 0) {
      return Response.json({ error: 'No learnings provided' }, { status: 400 });
    }

    // Analyze patterns using quantum engine
    const patterns = extractPatterns(learnings);
    const coherence = calculateCoherence(learnings);
    const entanglement = calculateEntanglement(patterns);

    // Generate AI improvement summary
    const improvementAnalysis = analyzeImprovement(
      learnings,
      patterns,
      coherence,
      entanglement
    );

    // Store aggregated learning
    const aggregatedLearning = {
      user_id: userEmail,
      prompt: `Aggregated learning from ${learnings.length} interactions`,
      response: improvementAnalysis.summary,
      feedback_score: coherence,
      quantum_analysis: {
        coherence,
        entanglement,
        pattern_confidence: improvementAnalysis.confidence,
      },
      extracted_patterns: patterns,
      suggestion_improvement: improvementAnalysis.improvements.join('; '),
      category: 'general',
      learning_weight: coherence * entanglement,
      applied: true,
    };

    await base44.asServiceRole.entities.Learning.create(aggregatedLearning);

    return Response.json({
      processedCount: learnings.length,
      patterns,
      avgConfidence: coherence,
      summary: improvementAnalysis.summary,
      improvements: improvementAnalysis.improvements,
      improvement: (coherence * entanglement) / 2,
    });
  } catch (error) {
    console.error('Learning processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Extract common patterns from learnings
function extractPatterns(learnings) {
  const patterns = new Map();
  
  learnings.forEach((learning) => {
    if (learning.extracted_patterns) {
      learning.extracted_patterns.forEach((pattern) => {
        patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
      });
    }

    // Extract from prompt/response text
    const text = `${learning.prompt} ${learning.response}`.toLowerCase();
    const keywords = extractKeywords(text);
    keywords.forEach((kw) => {
      patterns.set(kw, (patterns.get(kw) || 0) + 1);
    });
  });

  // Return top patterns
  return Array.from(patterns.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pattern, count]) => pattern);
}

// Calculate quantum coherence score
function calculateCoherence(learnings) {
  if (learnings.length === 0) return 0;

  const scores = learnings
    .filter((l) => l.feedback_score)
    .map((l) => l.feedback_score);

  if (scores.length === 0) return 0.7; // Default
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

// Calculate quantum entanglement (correlation strength)
function calculateEntanglement(patterns) {
  // Higher pattern diversity = higher entanglement
  return Math.min(1, patterns.length / 10);
}

// Analyze improvements to suggest
function analyzeImprovement(learnings, patterns, coherence, entanglement) {
  const improvements = [];
  const quality = coherence * entanglement;

  if (quality > 0.8) {
    improvements.push('Increase context depth in similar queries');
    improvements.push('Expand pattern recognition for quantum concepts');
  } else if (quality > 0.6) {
    improvements.push('Refine suggestion targeting');
    improvements.push('Enhance pattern extraction accuracy');
  } else {
    improvements.push('Review user feedback for corrections');
    improvements.push('Broaden knowledge base coverage');
  }

  // Category-specific improvements
  const categories = new Set(learnings.map((l) => l.category));
  if (categories.has('quantum')) {
    improvements.push('Deepen quantum simulation understanding');
  }
  if (categories.has('component')) {
    improvements.push('Improve component generation patterns');
  }

  return {
    summary: `AI upgraded with ${patterns.length} new patterns. Coherence: ${(coherence * 100).toFixed(0)}%, Entanglement: ${(entanglement * 100).toFixed(0)}%`,
    confidence: quality,
    improvements: improvements.slice(0, 3),
  };
}

// Extract keywords from text
function extractKeywords(text) {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'is', 'was', 'are', 'be', 'been', 'being', 'have', 'has', 'had', 'do',
    'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'must',
  ]);

  const words = text
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));

  const freq = new Map();
  words.forEach((w) => {
    freq.set(w, (freq.get(w) || 0) + 1);
  });

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}