type FeatureFlag = {
  name: string;
  enabled: boolean;
  rolloutPercentage?: number;
  variants?: Array<{ id: string; name: string; weight: number }>;
  targetRoles?: string[];
  targetUsers?: string[];
};

type FlagContext = {
  userId?: string;
  role?: string;
  email?: string;
};

const FLAGS_KEY = 'feature_flags_v1';
const IMPRESSIONS_KEY = 'feature_flag_impressions_v1';

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

const withinRollout = (flag: FeatureFlag, context: FlagContext) => {
  if (flag.rolloutPercentage === undefined) return true;
  const seed = context.userId || context.email || 'anonymous';
  const roll = hashString(`${flag.name}:${seed}`) % 100;
  return roll < flag.rolloutPercentage;
};

const pickVariant = (flag: FeatureFlag, context: FlagContext) => {
  if (!flag.variants || flag.variants.length === 0) return null;
  const totalWeight = flag.variants.reduce((sum, variant) => sum + variant.weight, 0);
  const roll = (hashString(`${flag.name}:${context.userId || context.email || 'anon'}`) % 1000) / 1000;
  let cursor = 0;
  for (const variant of flag.variants) {
    cursor += variant.weight / totalWeight;
    if (roll <= cursor) return variant;
  }
  return flag.variants[flag.variants.length - 1];
};

export const FeatureFlagService = {
  listFlags() {
    return load<FeatureFlag[]>(FLAGS_KEY, []);
  },

  saveFlags(flags: FeatureFlag[]) {
    save(FLAGS_KEY, flags);
  },

  isEnabled(flagName: string, context: FlagContext = {}) {
    const flags = load<FeatureFlag[]>(FLAGS_KEY, []);
    const flag = flags.find((item) => item.name === flagName);
    if (!flag || !flag.enabled) return false;

    if (flag.targetRoles?.length && context.role && !flag.targetRoles.includes(context.role)) {
      return false;
    }

    if (flag.targetUsers?.length && context.email && !flag.targetUsers.includes(context.email)) {
      return false;
    }

    return withinRollout(flag, context);
  },

  getVariant(flagName: string, context: FlagContext = {}) {
    const flags = load<FeatureFlag[]>(FLAGS_KEY, []);
    const flag = flags.find((item) => item.name === flagName);
    if (!flag || !flag.enabled) return null;

    if (!withinRollout(flag, context)) return null;
    return pickVariant(flag, context);
  },

  trackImpression(flagName: string, context: FlagContext = {}) {
    const impressions = load<Array<{ flagName: string; context: FlagContext; at: string }>>(IMPRESSIONS_KEY, []);
    impressions.push({ flagName, context, at: new Date().toISOString() });
    save(IMPRESSIONS_KEY, impressions);
  },
};
