const FLAGS_KEY = 'feature_flags_v1';
const IMPRESSIONS_KEY = 'feature_flag_impressions_v1';
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
const withinRollout = (flag, context) => {
    if (flag.rolloutPercentage === undefined)
        return true;
    const seed = context.userId || context.email || 'anonymous';
    const roll = hashString(`${flag.name}:${seed}`) % 100;
    return roll < flag.rolloutPercentage;
};
const pickVariant = (flag, context) => {
    if (!flag.variants || flag.variants.length === 0)
        return null;
    const totalWeight = flag.variants.reduce((sum, variant) => sum + variant.weight, 0);
    const roll = (hashString(`${flag.name}:${context.userId || context.email || 'anon'}`) % 1000) / 1000;
    let cursor = 0;
    for (const variant of flag.variants) {
        cursor += variant.weight / totalWeight;
        if (roll <= cursor)
            return variant;
    }
    return flag.variants[flag.variants.length - 1];
};
export const FeatureFlagService = {
    listFlags() {
        return load(FLAGS_KEY, []);
    },
    saveFlags(flags) {
        save(FLAGS_KEY, flags);
    },
    isEnabled(flagName, context = {}) {
        const flags = load(FLAGS_KEY, []);
        const flag = flags.find((item) => item.name === flagName);
        if (!flag || !flag.enabled)
            return false;
        if (flag.targetRoles?.length && context.role && !flag.targetRoles.includes(context.role)) {
            return false;
        }
        if (flag.targetUsers?.length && context.email && !flag.targetUsers.includes(context.email)) {
            return false;
        }
        return withinRollout(flag, context);
    },
    getVariant(flagName, context = {}) {
        const flags = load(FLAGS_KEY, []);
        const flag = flags.find((item) => item.name === flagName);
        if (!flag || !flag.enabled)
            return null;
        if (!withinRollout(flag, context))
            return null;
        return pickVariant(flag, context);
    },
    trackImpression(flagName, context = {}) {
        const impressions = load(IMPRESSIONS_KEY, []);
        impressions.push({ flagName, context, at: new Date().toISOString() });
        save(IMPRESSIONS_KEY, impressions);
    },
};
