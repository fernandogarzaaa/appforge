import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

type Complex = { re: number; im: number };

const complex = (re: number, im = 0): Complex => ({ re, im });
const add = (a: Complex, b: Complex): Complex => complex(a.re + b.re, a.im + b.im);
const sub = (a: Complex, b: Complex): Complex => complex(a.re - b.re, a.im - b.im);
const mul = (a: Complex, b: Complex): Complex =>
  complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const scale = (a: Complex, s: number): Complex => complex(a.re * s, a.im * s);
const magnitude2 = (a: Complex): number => a.re * a.re + a.im * a.im;
const expi = (theta: number): Complex => complex(Math.cos(theta), Math.sin(theta));

const clampShots = (shots: number) => Math.max(10, Math.min(shots, 10000));

const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const createSeededRandom = (seed: number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const buildInitialState = (qubits: number): Complex[] => {
  const size = 1 << qubits;
  const state = new Array(size).fill(null).map(() => complex(0, 0));
  state[0] = complex(1, 0);
  return state;
};

const applySingleQubitGate = (state: Complex[], qubits: number, target: number, matrix: Complex[]) => {
  const size = 1 << qubits;
  const step = 1 << target;
  const next = new Array(size).fill(null).map(() => complex(0, 0));

  for (let i = 0; i < size; i += step * 2) {
    for (let j = 0; j < step; j += 1) {
      const idx0 = i + j;
      const idx1 = idx0 + step;
      const v0 = state[idx0];
      const v1 = state[idx1];
      next[idx0] = add(mul(matrix[0], v0), mul(matrix[1], v1));
      next[idx1] = add(mul(matrix[2], v0), mul(matrix[3], v1));
    }
  }

  return next;
};

const applyCNOT = (state: Complex[], qubits: number, control: number, target: number) => {
  const size = 1 << qubits;
  const next = state.slice();
  for (let i = 0; i < size; i += 1) {
    const controlBit = (i >> control) & 1;
    const targetBit = (i >> target) & 1;
    if (controlBit === 1 && targetBit === 0) {
      const flipped = i ^ (1 << target);
      [next[i], next[flipped]] = [next[flipped], next[i]];
    }
  }
  return next;
};

const applySWAP = (state: Complex[], qubits: number, a: number, b: number) => {
  if (a === b) return state;
  const size = 1 << qubits;
  const next = state.slice();
  for (let i = 0; i < size; i += 1) {
    const bitA = (i >> a) & 1;
    const bitB = (i >> b) & 1;
    if (bitA !== bitB) {
      const swapped = i ^ (1 << a) ^ (1 << b);
      if (i < swapped) {
        [next[i], next[swapped]] = [next[swapped], next[i]];
      }
    }
  }
  return next;
};

const applyGate = (state: Complex[], qubits: number, gate: any) => {
  const type = gate.type;
  const targets = gate.targets || [];
  const angle = gate.params?.angle ?? gate.parameters?.angle ?? gate.params ?? gate.angle ?? 0;
  const half = angle / 2;

  switch (type) {
    case 'H': {
      const inv = 1 / Math.sqrt(2);
      return applySingleQubitGate(state, qubits, targets[0], [
        complex(inv, 0),
        complex(inv, 0),
        complex(inv, 0),
        complex(-inv, 0),
      ]);
    }
    case 'X':
      return applySingleQubitGate(state, qubits, targets[0], [
        complex(0, 0),
        complex(1, 0),
        complex(1, 0),
        complex(0, 0),
      ]);
    case 'Y':
      return applySingleQubitGate(state, qubits, targets[0], [
        complex(0, 0),
        complex(0, -1),
        complex(0, 1),
        complex(0, 0),
      ]);
    case 'Z':
      return applySingleQubitGate(state, qubits, targets[0], [
        complex(1, 0),
        complex(0, 0),
        complex(0, 0),
        complex(-1, 0),
      ]);
    case 'S':
      return applySingleQubitGate(state, qubits, targets[0], [
        complex(1, 0),
        complex(0, 0),
        complex(0, 0),
        complex(0, 1),
      ]);
    case 'T': {
      const phase = expi(Math.PI / 4);
      return applySingleQubitGate(state, qubits, targets[0], [
        complex(1, 0),
        complex(0, 0),
        complex(0, 0),
        phase,
      ]);
    }
    case 'RX': {
      const cos = Math.cos(half);
      const sin = Math.sin(half);
      return applySingleQubitGate(state, qubits, targets[0], [
        complex(cos, 0),
        complex(0, -sin),
        complex(0, -sin),
        complex(cos, 0),
      ]);
    }
    case 'RY': {
      const cos = Math.cos(half);
      const sin = Math.sin(half);
      return applySingleQubitGate(state, qubits, targets[0], [
        complex(cos, 0),
        complex(-sin, 0),
        complex(sin, 0),
        complex(cos, 0),
      ]);
    }
    case 'RZ': {
      return applySingleQubitGate(state, qubits, targets[0], [
        expi(-half),
        complex(0, 0),
        complex(0, 0),
        expi(half),
      ]);
    }
    case 'CNOT':
      return applyCNOT(state, qubits, targets[0], targets[1]);
    case 'SWAP':
      return applySWAP(state, qubits, targets[0], targets[1]);
    default:
      return state;
  }
};

const measure = (state: Complex[], qubits: number, shots: number, rng: () => number) => {
  const probabilities = state.map((amp) => magnitude2(amp));
  const cumulative: number[] = [];
  let sum = 0;
  probabilities.forEach((p) => {
    sum += p;
    cumulative.push(sum);
  });
  const measurements: Record<string, number> = {};
  for (let i = 0; i < shots; i += 1) {
    const r = rng() * sum;
    const idx = cumulative.findIndex((c) => c >= r);
    const outcome = (idx >= 0 ? idx : cumulative.length - 1).toString(2).padStart(qubits, '0');
    measurements[outcome] = (measurements[outcome] || 0) + 1;
  }
  const probs: Record<string, number> = {};
  Object.entries(measurements).forEach(([stateKey, count]) => {
    probs[stateKey] = count / shots;
  });
  return { measurements, probabilities: probs };
};

const calculateFidelity = (state: Complex[]) => {
  let purity = 0;
  state.forEach((amp) => {
    const mag2 = magnitude2(amp);
    purity += mag2 * mag2;
  });
  return Math.sqrt(purity);
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { circuit, num_shots = 1000, seed } = await req.json();

    if (!circuit) {
      return Response.json({ error: 'Circuit definition required' }, { status: 400 });
    }

    const qubits = circuit.qubits || 1;
    const shots = clampShots(Number(num_shots) || 1000);
    const seedValue = typeof seed === 'number'
      ? seed
      : typeof seed === 'string'
      ? hashString(seed)
      : Math.floor(Date.now() % 4294967296);
    const rng = createSeededRandom(seedValue);

    let state = buildInitialState(qubits);
    (circuit.gates || []).forEach((gate: any) => {
      state = applyGate(state, qubits, gate);
    });

    const { measurements, probabilities } = measure(state, qubits, shots, rng);
    const statevector = state
      .slice(0, Math.min(16, state.length))
      .map((amp) => Math.sqrt(magnitude2(amp)));

    return Response.json({
      success: true,
      simulation: {
        measurements,
        probabilities,
        statevector,
        fidelity: calculateFidelity(state),
      },
      shots,
      timestamp: new Date().toISOString(),
      seed: seedValue,
    });
  } catch (error) {
    console.error('Quantum simulation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
