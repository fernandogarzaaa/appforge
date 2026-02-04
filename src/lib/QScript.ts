import init, { QuantumVar } from '@/quantum-core/pkg/quantum_core';

let isReady = false;
let initPromise: Promise<void> | null = null;

const safeStringify = (value: unknown) => {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify(String(value));
  }
};

const safeParse = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export const initQScript = async () => {
  if (isReady) return;
  if (!initPromise) {
    initPromise = init().then(() => {
      isReady = true;
    });
  }
  await initPromise;
};

/**
 * Creates a "Crash-Proof" Quantum Variable.
 * @param states Array of [Value, Confidence]
 */
export const createQuantumVar = async (states: Array<[unknown, number]>) => {
  await initQScript();
  const qVar = new QuantumVar();

  states.forEach(([val, prob]) => {
    qVar.add_state(safeStringify(val), prob);
  });

  return qVar;
};

/**
 * Observe and collapse the variable into a concrete value.
 */
export const observeQuantumVar = (qVar: QuantumVar | null) => {
  if (!qVar) return null;
  const result = qVar.observe();
  return safeParse(result);
};

/**
 * Preview the most likely value without collapse.
 */
export const peekMostLikely = (qVar: QuantumVar | null) => {
  if (!qVar) return null;
  const result = qVar.peek_most_likely();
  return safeParse(result);
};

/**
 * Shannon entropy (0.0 = certainty, higher = uncertainty).
 */
export const getUncertaintyIndex = (qVar: QuantumVar | null) => {
  if (!qVar) return 0;
  return qVar.uncertainty_index();
};

/**
 * Entangle two quantum variables (interference).
 */
export const entangleQuantumVars = (qVar: QuantumVar | null, other: QuantumVar | null) => {
  if (!qVar || !other) return;
  qVar.entangle(other);
};
