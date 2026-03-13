const EXPERIMENTS_KEY = 'ab_experiments_v1';
const ASSIGNMENTS_KEY = 'ab_assignments_v1';
const CONVERSIONS_KEY = 'ab_conversions_v1';
const load = (key, fallback) => {
    if (typeof window === 'undefined')
        return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw)
        return fallback;
    try {
        return JSON.parse(raw);
    }
    catch (error) {
        return fallback;
    }
};
const save = (key, value) => {
    if (typeof window === 'undefined')
        return;
    window.localStorage.setItem(key, JSON.stringify(value));
};
const hashString = (input) => {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
        hash = (hash << 5) - hash + input.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
};
const pickVariant = (variants, seed) => {
    const totalWeight = variants.reduce((sum, variant) => sum + variant.weight, 0);
    const normalized = variants.map((variant) => ({
        ...variant,
        weight: variant.weight / totalWeight,
    }));
    const roll = (hashString(seed) % 1000) / 1000;
    let cursor = 0;
    for (const variant of normalized) {
        cursor += variant.weight;
        if (roll <= cursor)
            return variant;
    }
    return normalized[normalized.length - 1];
};
export const ABTestingService = {
    createExperiment(input) {
        const experiments = load(EXPERIMENTS_KEY, []);
        const experiment = {
            ...input,
            id: `exp_${Date.now()}`,
            createdAt: new Date().toISOString(),
        };
        experiments.push(experiment);
        save(EXPERIMENTS_KEY, experiments);
        return experiment;
    },
    listExperiments() {
        return load(EXPERIMENTS_KEY, []);
    },
    assignVariant(experimentId, userId) {
        const experiments = load(EXPERIMENTS_KEY, []);
        const experiment = experiments.find((item) => item.id === experimentId);
        if (!experiment)
            return null;
        const assignments = load(ASSIGNMENTS_KEY, []);
        const existing = assignments.find((assignment) => assignment.experimentId === experimentId && assignment.userId === userId);
        if (existing)
            return existing;
        const variant = pickVariant(experiment.variants, `${experimentId}:${userId}`);
        const assignment = {
            experimentId,
            userId,
            variantId: variant.id,
            assignedAt: new Date().toISOString(),
        };
        assignments.push(assignment);
        save(ASSIGNMENTS_KEY, assignments);
        return assignment;
    },
    trackConversion(experimentId, userId, eventName, value) {
        const assignments = load(ASSIGNMENTS_KEY, []);
        const assignment = assignments.find((record) => record.experimentId === experimentId && record.userId === userId);
        if (!assignment)
            return null;
        const conversions = load(CONVERSIONS_KEY, []);
        const conversion = {
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
    analyzeResults(experimentId) {
        const assignments = load(ASSIGNMENTS_KEY, []);
        const conversions = load(CONVERSIONS_KEY, []);
        const assignmentList = assignments.filter((item) => item.experimentId === experimentId);
        const conversionList = conversions.filter((item) => item.experimentId === experimentId);
        const variantStats = assignmentList.reduce((acc, assignment) => {
            if (!acc[assignment.variantId]) {
                acc[assignment.variantId] = { assigned: 0, converted: 0 };
            }
            acc[assignment.variantId].assigned += 1;
            return acc;
        }, {});
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
