import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

interface MutationPayload {
  swarmId?: string;
  filesChanged?: string[];
  testsRun?: string[];
  riskLevel?: 'low' | 'medium' | 'high';
  qualityScore?: number;
  escalationApproved?: boolean;
}

function evaluateMutation(payload: MutationPayload) {
  const filesChanged = payload.filesChanged || [];
  const testsRun = payload.testsRun || [];
  const qualityScore = Number.isFinite(payload.qualityScore) ? Number(payload.qualityScore) : 0;
  const riskLevel = payload.riskLevel || 'medium';

  const violations: string[] = [];

  if (!payload.swarmId) {
    violations.push('swarmId is required');
  }

  if (filesChanged.length === 0) {
    violations.push('Mutation must include at least one changed file');
  }

  if (testsRun.length === 0) {
    violations.push('At least one test/check command is required');
  }

  if (qualityScore < 0.75) {
    violations.push('qualityScore must be >= 0.75');
  }

  if (filesChanged.length > 12 && !payload.escalationApproved) {
    violations.push('File change budget exceeded (12 files) without escalation approval');
  }

  if (riskLevel === 'high' && !payload.escalationApproved) {
    violations.push('High-risk mutations require escalation approval');
  }

  return {
    allowed: violations.length === 0,
    violations,
    policy: {
      minQualityScore: 0.75,
      maxFileChangesWithoutEscalation: 12,
      requiresTests: true,
      highRiskRequiresEscalation: true
    }
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const payload = await req.json() as MutationPayload;
    const result = evaluateMutation(payload);

    return Response.json({
      ...result,
      evaluatedAt: new Date().toISOString()
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
});
