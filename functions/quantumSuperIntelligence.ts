import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userEmail, action } = await req.json();

    // Fetch all user data for synthesis
    const [learnings, deployments, graph] = await Promise.all([
      base44.asServiceRole.entities.Learning.filter({ user_id: userEmail }, '-updated_date', 30),
      base44.asServiceRole.entities.AgentDeployment.filter({ user_id: userEmail }, '-updated_date', 20),
      base44.asServiceRole.entities.KnowledgeGraph.filter({ user_id: userEmail }, '-updated_date', 1),
    ]);

    // Quantum decision engine using superposition
    const quantumDecisions = await generateQuantumDecisions(
      learnings,
      deployments,
      graph?.[0] || null
    );

    // Predict next user needs
    const predictions = await predictUserNeeds(learnings, deployments);

    // Synthesize emerging intelligence
    const emergence = synthesizeEmergence(learnings, deployments, quantumDecisions);

    // Build/update knowledge graph
    const updatedGraph = buildQuantumKnowledgeGraph(learnings, emergence);

    // Store or update knowledge graph
    if (graph?.[0]) {
      await base44.asServiceRole.entities.KnowledgeGraph.update(graph[0].id, updatedGraph);
    } else {
      await base44.asServiceRole.entities.KnowledgeGraph.create({
        user_id: userEmail,
        ...updatedGraph,
      });
    }

    return Response.json({
      quantumDecisions,
      predictions,
      emergence,
      intelligenceScore: calculateIntelligenceScore(
        learnings,
        deployments,
        quantumDecisions
      ),
      status: 'super_intelligence_active',
    });
  } catch (error) {
    console.error('Super intelligence error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function generateQuantumDecisions(learnings, deployments, graph) {
  // Simulate quantum superposition for decision making
  const decisionSpace = [];

  for (const learning of learnings.slice(0, 5)) {
    decisionSpace.push({
      type: 'learning',
      weight: (learning.feedback_score || 0.5) * 0.3,
      category: learning.category,
      pattern: learning.extracted_patterns?.[0],
    });
  }

  for (const agent of deployments.slice(0, 5)) {
    const satisfaction = agent.performance?.user_satisfaction || 0;
    decisionSpace.push({
      type: 'agent',
      weight: satisfaction * 0.4,
      agentType: agent.agent_type,
      efficiency: agent.performance?.efficiency || 0,
    });
  }

  // Normalize weights (quantum amplitudes)
  const totalWeight = decisionSpace.reduce((sum, item) => sum + item.weight, 0);
  const normalized = decisionSpace.map((item) => ({
    ...item,
    amplitude: item.weight / (totalWeight || 1),
  }));

  // Calculate interference patterns (emergent behavior)
  const interference = calculateInterference(normalized);

  return {
    decisions: normalized.slice(0, 3),
    interference,
    coherence: totalWeight > 0 ? 1 - Math.abs(interference) : 0,
  };
}

async function predictUserNeeds(learnings, deployments) {
  // Analyze patterns to predict next user request
  const categories = {};
  const timestamps = [];

  learnings.forEach((l) => {
    categories[l.category] = (categories[l.category] || 0) + 1;
    timestamps.push(new Date(l.created_date).getTime());
  });

  // Find most frequent category
  const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Estimate time until next request (moving average of intervals)
  const intervals = [];
  for (let i = 1; i < timestamps.length; i++) {
    intervals.push(timestamps[i] - timestamps[i - 1]);
  }
  const avgInterval = intervals.length > 0 ? intervals.reduce((a, b) => a + b) / intervals.length : 0;

  return {
    predictedCategory: topCategory || 'general',
    confidence: Math.min(1, (learnings.length / 10)),
    estimatedTimeMs: avgInterval,
    suggestedAgents: deployments
      .filter((a) => a.status === 'completed')
      .sort((a, b) => (b.performance?.user_satisfaction || 0) - (a.performance?.user_satisfaction || 0))
      .slice(0, 2)
      .map((a) => a.agent_type),
  };
}

function synthesizeEmergence(learnings, deployments, quantumDecisions) {
  // Extract meta-patterns from all interactions
  const metaPatterns = [];

  // Pattern 1: Learning velocity
  const recentCount = learnings.filter((l) => {
    const age = Date.now() - new Date(l.created_date).getTime();
    return age < 3600000; // Last hour
  }).length;

  if (recentCount > 3) {
    metaPatterns.push('high_engagement');
  }

  // Pattern 2: Agent success rate
  const successfulAgents = deployments.filter((a) => (a.performance?.user_satisfaction || 0) > 0.7).length;
  const successRate = deployments.length > 0 ? successfulAgents / deployments.length : 0;

  if (successRate > 0.7) {
    metaPatterns.push('high_agent_efficiency');
  }

  // Pattern 3: Coherent decision making
  if (quantumDecisions.coherence > 0.7) {
    metaPatterns.push('coherent_reasoning');
  }

  // Pattern 4: Category concentration
  const categories = {};
  learnings.forEach((l) => {
    categories[l.category] = (categories[l.category] || 0) + 1;
  });
  const concentration = Object.values(categories).some((c) => c > learnings.length * 0.5);
  if (concentration) {
    metaPatterns.push('domain_specialization');
  }

  return {
    patterns: metaPatterns,
    specialization: Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'general',
    evolutionStage: calculateEvolutionStage(metaPatterns, learnings),
  };
}

function buildQuantumKnowledgeGraph(learnings, emergence) {
  const nodes = new Map();
  const edges = [];

  // Build nodes from patterns
  learnings.forEach((l) => {
    (l.extracted_patterns || []).forEach((pattern) => {
      if (!nodes.has(pattern)) {
        nodes.set(pattern, {
          id: pattern,
          concept: pattern,
          quantum_state: hashToUnitInterval(pattern),
          confidence: l.feedback_score || 0.5,
          frequency: 1,
        });
      } else {
        const node = nodes.get(pattern);
        node.frequency += 1;
        node.confidence = Math.min(1, (node.confidence + (l.feedback_score || 0.5)) / 2);
      }
    });
  });

  // Build edges from pattern co-occurrence
  for (let i = 0; i < learnings.length - 1; i++) {
    const patterns1 = learnings[i].extracted_patterns || [];
    const patterns2 = learnings[i + 1].extracted_patterns || [];

    patterns1.forEach((p1) => {
      patterns2.forEach((p2) => {
        if (p1 !== p2) {
          edges.push({
            from: p1,
            to: p2,
            relationship: 'co_occurs',
            strength: 0.7,
          });
        }
      });
    });
  }

  return {
    nodes: Array.from(nodes.values()),
    edges,
    emergent_patterns: emergence.patterns,
    quantum_coherence: calculateGraphCoherence(Array.from(nodes.values())),
  };
}

function calculateInterference(normalizedItems) {
  // Calculate quantum interference pattern
  let interference = 0;
  for (let i = 0; i < normalizedItems.length; i++) {
    for (let j = i + 1; j < normalizedItems.length; j++) {
      interference += Math.sin(normalizedItems[i].amplitude * Math.PI) *
        Math.sin(normalizedItems[j].amplitude * Math.PI);
    }
  }
  return interference / Math.max(1, normalizedItems.length);
}

function calculateGraphCoherence(nodes) {
  if (nodes.length === 0) return 0;
  const avgConfidence = nodes.reduce((sum, n) => sum + n.confidence, 0) / nodes.length;
  const avgFrequency = nodes.reduce((sum, n) => sum + n.frequency, 0) / nodes.length;
  return Math.min(1, (avgConfidence + avgFrequency / 10) / 2);
}

function calculateIntelligenceScore(learnings, deployments, quantumDecisions) {
  const learningScore = Math.min(1, learnings.length / 50);
  const agentScore = deployments.length > 0 ?
    deployments.reduce((sum, a) => sum + (a.performance?.user_satisfaction || 0), 0) / deployments.length :
    0;
  const coherenceScore = quantumDecisions.coherence;

  return (learningScore * 0.3 + agentScore * 0.4 + coherenceScore * 0.3);
}

function calculateEvolutionStage(patterns, learnings) {
  if (learnings.length < 5) return 'initialization';
  if (patterns.includes('coherent_reasoning') && patterns.includes('domain_specialization')) {
    return 'super_intelligence';
  }
  if (patterns.includes('high_agent_efficiency')) return 'optimization';
  return 'development';
}

function hashToUnitInterval(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}
