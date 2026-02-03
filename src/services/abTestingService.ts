type Variant = {
  id: string;
  name: string;
  weight: number;
};

type Experiment = {
  id: string;
  name: string;
  description?: string;
  variants: Variant[];
  startDate?: string;
  endDate?: string;
  createdAt: string;
};

type Assignment = {
  experimentId: string;
  userId: string;
  variantId: string;
  assignedAt: string;
};

type Conversion = {
  experimentId: string;
  userId: string;
  variantId: string;
  eventName: string;
  value?: number;
  recordedAt: string;
};

const EXPERIMENTS_KEY = 'ab_experiments_v1';
const ASSIGNMENTS_KEY = 'ab_assignments_v1';
const CONVERSIONS_KEY = 'ab_conversions_v1';

const load = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    return fallback;
  }
};

const save = <T>(key: string, value: T) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const hashString = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const pickVariant = (variants: Variant[], seed: string) => {
  const totalWeight = variants.reduce((sum, variant) => sum + variant.weight, 0);
  const normalized = variants.map((variant) => ({
    ...variant,
    weight: variant.weight / totalWeight,
  }));
  const roll = (hashString(seed) % 1000) / 1000;
  let cursor = 0;
  for (const variant of normalized) {
    cursor += variant.weight;
    if (roll <= cursor) return variant;
  }
  return normalized[normalized.length - 1];
};

export const ABTestingService = {
  createExperiment(input: Omit<Experiment, 'id' | 'createdAt'>) {
    const experiments = load<Experiment[]>(EXPERIMENTS_KEY, []);
    const experiment: Experiment = {
      ...input,
      id: `exp_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    experiments.push(experiment);
    save(EXPERIMENTS_KEY, experiments);
    return experiment;
  },

  listExperiments() {
    return load<Experiment[]>(EXPERIMENTS_KEY, []);
  },

  assignVariant(experimentId: string, userId: string) {
    const experiments = load<Experiment[]>(EXPERIMENTS_KEY, []);
    const experiment = experiments.find((item) => item.id === experimentId);
    if (!experiment) return null;

    const assignments = load<Assignment[]>(ASSIGNMENTS_KEY, []);
    const existing = assignments.find(
      (assignment) => assignment.experimentId === experimentId && assignment.userId === userId
    );
    if (existing) return existing;

    const variant = pickVariant(experiment.variants, `${experimentId}:${userId}`);
    const assignment: Assignment = {
      experimentId,
      userId,
      variantId: variant.id,
      assignedAt: new Date().toISOString(),
    };
    assignments.push(assignment);
    save(ASSIGNMENTS_KEY, assignments);
    return assignment;
  },

  trackConversion(experimentId: string, userId: string, eventName: string, value?: number) {
    const assignments = load<Assignment[]>(ASSIGNMENTS_KEY, []);
    const assignment = assignments.find(
      (record) => record.experimentId === experimentId && record.userId === userId
    );
    if (!assignment) return null;

    const conversions = load<Conversion[]>(CONVERSIONS_KEY, []);
    const conversion: Conversion = {
      experimentId,
      userId,
      variantId: assignment.variantId,
      eventName,
      value,
      recordedAt: new Date().toISOString(),
    };
    conversions.push(conversion);
    save(CONVERSIONS_KEY, conversions);
    return conversion;
  },

  analyzeResults(experimentId: string) {
    const assignments = load<Assignment[]>(ASSIGNMENTS_KEY, []);
    const conversions = load<Conversion[]>(CONVERSIONS_KEY, []);

    const assignmentList = assignments.filter((item) => item.experimentId === experimentId);
    const conversionList = conversions.filter((item) => item.experimentId === experimentId);

    const variantStats = assignmentList.reduce<Record<string, { assigned: number; converted: number }>>(
      (acc, assignment) => {
        if (!acc[assignment.variantId]) {
          acc[assignment.variantId] = { assigned: 0, converted: 0 };
        }
        acc[assignment.variantId].assigned += 1;
        return acc;
      },
      {}
    );

    for (const conversion of conversionList) {
      if (!variantStats[conversion.variantId]) {
        variantStats[conversion.variantId] = { assigned: 0, converted: 0 };
      }
      variantStats[conversion.variantId].converted += 1;
    }

    const summary = Object.entries(variantStats).map(([variantId, stats]) => ({
      variantId,
      assigned: stats.assigned,
      converted: stats.converted,
      conversionRate: stats.assigned === 0 ? 0 : stats.converted / stats.assigned,
    }));

    return {
      experimentId,
      variants: summary,
      totalAssignments: assignmentList.length,
      totalConversions: conversionList.length,
    };
  },
};
