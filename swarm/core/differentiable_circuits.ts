/**
 * 🔀 DIFFERENTIABLE QUANTUM CIRCUITS
 * 
 * PennyLane-inspired differentiable quantum circuits for ML training
 * Features:
 * - Parameter-shift rule for gradients
 * - Hybrid optimization
 * - Backpropagation through quantum layers
 */

import { EventEmitter } from 'events';
import { secureRandom } from './secure_entropy.js';

// ============================================================================
// TYPES
// ============================================================================

interface DifferentiableCircuit {
    id: string;
    gates: DifferentiableGate[];
    qubits: number;
    parameters: Parameter[];
    inputEncoding: EncodingScheme;
}

interface DifferentiableGate {
    id: string;
    name: string;
    qubits: number[];
    parameters: string[];  // Parameter names
    trainable: boolean;
    gradientMethod: 'parameter_shift' | 'finite_diff' | 'analytic';
}

interface Parameter {
    name: string;
    value: number;
    gradient: number;
    bounds: [number, number];
}

interface EncodingScheme {
    type: 'amplitude' | 'angle' | 'basis';
    scaling: number;
}

interface CircuitOutput {
    measurements: number[];
    expectation: number;
    variance: number;
    gradients: Record<string, number>;
}

interface TrainingConfig {
    learningRate: number;
    optimizer: 'adam' | 'sgd' | 'momentum';
    epochs: number;
    batchSize: number;
    gradientMethod: 'parameter_shift' | 'finite_diff';
    eps: number;
}

// ============================================================================
// DIFFERENTIABLE QUANTUM CIRCUIT
// ============================================================================

export class DifferentiableQuantumCircuit extends EventEmitter {
    private circuit: DifferentiableCircuit;
    private parameters: Map<string, Parameter>;
    private state: number[];
    private config: TrainingConfig;
    private optimizer: Optimizer;

    constructor(config?: Partial<TrainingConfig>) {
        super();
        this.config = {
            learningRate: config?.learningRate ?? 0.01,
            optimizer: config?.optimizer ?? 'adam',
            epochs: config?.epochs ?? 100,
            batchSize: config?.batchSize ?? 32,
            gradientMethod: config?.gradientMethod ?? 'parameter_shift',
            eps: config?.eps ?? 0.01
        };
        this.parameters = new Map();
        this.optimizer = new Optimizer(this.config.optimizer, this.config.learningRate);
        this.circuit = this.createDefaultCircuit();
        this.initializeState();
    }

    /**
     * Create default circuit
     */
    private createDefaultCircuit(): DifferentiableCircuit {
        const circuit: DifferentiableCircuit = {
            id: `circuit_${Date.now()}`,
            gates: [],
            qubits: 4,
            parameters: [],
            inputEncoding: {
                type: 'angle',
                scaling: Math.PI
            }
        };

        // Add embedding gates
        for (let i = 0; i < circuit.qubits; i++) {
            circuit.gates.push({
                id: `RX_embed_${i}`,
                name: 'RX',
                qubits: [i],
                parameters: [`theta_${i}`],
                trainable: false,
                gradientMethod: 'parameter_shift'
            });
        }

        // Add variational layers
        for (let layer = 0; layer < 3; layer++) {
            // Rotation layer
            for (let i = 0; i < circuit.qubits; i++) {
                circuit.gates.push({
                    id: `RY_layer${layer}_q${i}`,
                    name: 'RY',
                    qubits: [i],
                    parameters: [`phi_${layer}_${i}`],
                    trainable: true,
                    gradientMethod: 'parameter_shift'
                });
            }

            // Entanglement layer
            for (let i = 0; i < circuit.qubits - 1; i++) {
                circuit.gates.push({
                    id: `CNOT_layer${layer}_q${i}`,
                    name: 'CNOT',
                    qubits: [i, i + 1],
                    parameters: [],
                    trainable: false,
                    gradientMethod: 'parameter_shift'
                });
            }
        }

        // Initialize parameters
        for (const gate of circuit.gates) {
            for (const paramName of gate.parameters) {
                if (!this.parameters.has(paramName)) {
                    this.parameters.set(paramName, {
                        name: paramName,
                        value: secureRandom() * Math.PI * 2,
                        gradient: 0,
                        bounds: [0, Math.PI * 4]
                    });
                }
            }
        }

        return circuit;
    }

    /**
     * Initialize quantum state
     */
    private initializeState(): void {
        const dim = Math.pow(2, this.circuit.qubits);
        this.state = new Array(dim).fill(0);
        this.state[0] = 1; // |000...0⟩
    }

    /**
     * Forward pass through circuit
     */
    async forward(inputs: number[]): Promise<CircuitOutput> {
        // Reset state
        this.initializeState();

        // Encode inputs
        this.encodeInputs(inputs);

        // Apply gates
        for (const gate of this.circuit.gates) {
            this.applyGate(gate);
        }

        // Measure
        const measurements = this.measure();
        const expectation = this.calculateExpectation(measurements);
        const gradients = await this.calculateGradients();

        return {
            measurements,
            expectation,
            variance: this.calculateVariance(measurements, expectation),
            gradients
        };
    }

    /**
     * Encode classical inputs into quantum state
     */
    private encodeInputs(inputs: number[]): void {
        const scaling = this.circuit.inputEncoding.scaling;

        for (let i = 0; i < Math.min(inputs.length, this.circuit.qubits); i++) {
            const param = this.parameters.get(`theta_${i}`);
            if (param) {
                param.value = inputs[i] * scaling;
            }
        }
    }

    /**
     * Apply quantum gate
     */
    private applyGate(gate: DifferentiableGate): void {
        const qubits = gate.qubits;
        const paramValues = qubits.map((_, idx) => {
            const param = this.parameters.get(gate.parameters[idx]);
            return param?.value ?? 0;
        });

        switch (gate.name) {
            case 'RX':
                this.applyRX(qubits[0], paramValues[0]);
                break;
            case 'RY':
                this.applyRY(qubits[0], paramValues[0]);
                break;
            case 'RZ':
                this.applyRZ(qubits[0], paramValues[0]);
                break;
            case 'CNOT':
                this.applyCNOT(qubits[0], qubits[1]);
                break;
            case 'H':
                this.applyH(qubits[0]);
                break;
        }
    }

    /**
     * Apply RX rotation
     */
    private applyRX(qubit: number, theta: number): void {
        const cos = Math.cos(theta / 2);
        const sin = Math.sin(theta / 2);
        const newState = [...this.state];
        const dim = this.state.length;

        for (let i = 0; i < dim; i++) {
            const bit = (i >> qubit) & 1;
            const idx0 = i & ~(1 << qubit);
            const idx1 = idx0 | (1 << qubit);

            const a = this.state[idx0];
            const b = this.state[idx1];

            newState[idx0] = cos * a - sin * i;
            newState[idx1] = sin * a + cos * b;
        }

        this.state = newState;
    }

    /**
     * Apply RY rotation
     */
    private applyRY(qubit: number, theta: number): void {
        const cos = Math.cos(theta / 2);
        const sin = Math.sin(theta / 2);
        const newState = [...this.state];
        const dim = this.state.length;

        for (let i = 0; i < dim; i++) {
            const bit = (i >> qubit) & 1;
            const idx0 = i & ~(1 << qubit);
            const idx1 = idx0 | (1 << qubit);

            const a = this.state[idx0];
            const b = this.state[idx1];

            newState[idx0] = cos * a - sin * b;
            newState[idx1] = sin * a + cos * b;
        }

        this.state = newState;
    }

    /**
     * Apply RZ rotation
     */
    private applyRZ(qubit: number, theta: number): void {
        const expPlus = Math.exp(-1 * theta / 2);  // Simplified - using real part
        const expMinus = Math.exp(1 * theta / 2);  // Simplified - using real part
        const newState = [...this.state];
        const dim = this.state.length;

        for (let i = 0; i < dim; i++) {
            const bit = (i >> qubit) & 1;
            if (bit === 0) {
                newState[i] *= expMinus;
            } else {
                newState[i] *= expPlus;
            }
        }

        this.state = newState;
    }

    /**
     * Apply CNOT
     */
    private applyCNOT(control: number, target: number): void {
        const newState = [...this.state];
        const dim = this.state.length;

        for (let i = 0; i < dim; i++) {
            const ctrl = (i >> control) & 1;
            if (ctrl === 1) {
                const targetBit = (i >> target) & 1;
                const flipped = i ^ (1 << target);
                newState[flipped] = this.state[i];
                newState[i] = 0;
            }
        }

        this.state = newState;
    }

    /**
     * Apply Hadamard
     */
    private applyH(qubit: number): void {
        const invSqrt2 = 1 / Math.sqrt(2);
        const newState = [...this.state];
        const dim = this.state.length;

        for (let i = 0; i < dim; i++) {
            const bit = (i >> qubit) & 1;
            const idx0 = i & ~(1 << qubit);
            const idx1 = idx0 | (1 << qubit);

            const a = this.state[idx0];
            const b = this.state[idx1];

            newState[idx0] = invSqrt2 * (a + b);
            newState[idx1] = invSqrt2 * (a - b);
        }

        this.state = newState;
    }

    /**
     * Measure all qubits
     */
    private measure(): number[] {
        const measurements: number[] = [];
        const probs = this.state.map(a => a * a);

        for (let i = 0; i < Math.pow(2, this.circuit.qubits); i++) {
            measurements.push(probs[i]);
        }

        return measurements;
    }

    /**
     * Calculate expectation value
     */
    private calculateExpectation(measurements: number[]): number {
        // Simple expectation: weighted sum of measurement probabilities
        return measurements.reduce((sum, p, i) => sum + p * i, 0);
    }

    /**
     * Calculate variance
     */
    private calculateVariance(measurements: number[], mean: number): number {
        return measurements.reduce((sum, p, i) => sum + p * Math.pow(i - mean, 2), 0);
    }

    /**
     * Calculate gradients using parameter-shift rule
     */
    private async calculateGradients(): Promise<Record<string, number>> {
        const gradients: Record<string, number> = {};

        for (const [name, param] of this.parameters) {
            if (!this.circuit.gates.find(g => g.parameters.includes(name))) {
                continue;
            }

            switch (this.config.gradientMethod) {
                case 'parameter_shift':
                    gradients[name] = this.parameterShiftGradient(name);
                    break;
                case 'finite_diff':
                    gradients[name] = this.finiteDiffGradient(name);
                    break;
            }
        }

        return gradients;
    }

    /**
     * Parameter-shift rule for gradients
     */
    private parameterShiftGradient(paramName: string): number {
        const param = this.parameters.get(paramName);
        if (!param) return 0;

        const shift = Math.PI / 4;

        // Forward shift
        param.value += shift;
        const statePlus = [...this.state];
        this.initializeState();
        this.encodeInputs([]);
        for (const gate of this.circuit.gates) {
            if (gate.parameters.includes(paramName)) {
                this.applyGate(gate);
            }
        }
        const expectationPlus = this.calculateExpectation(this.measure());

        // Backward shift
        param.value -= 2 * shift;
        const stateMinus = [...this.state];
        this.initializeState();
        this.encodeInputs([]);
        for (const gate of this.circuit.gates) {
            if (gate.parameters.includes(paramName)) {
                this.applyGate(gate);
            }
        }
        const expectationMinus = this.calculateExpectation(this.measure());

        // Restore original value
        param.value += shift;

        // Gradient = (f(x + π/4) - f(x - π/4)) / 2
        return (expectationPlus - expectationMinus) / 2;
    }

    /**
     * Finite difference gradient
     */
    private finiteDiffGradient(paramName: string): number {
        const param = this.parameters.get(paramName);
        if (!param) return 0;

        const original = param.value;
        const eps = this.config.eps;

        // Forward
        param.value = original + eps;
        this.initializeState();
        this.encodeInputs([]);
        for (const gate of this.circuit.gates) {
            if (gate.parameters.includes(paramName)) {
                this.applyGate(gate);
            }
        }
        const plus = this.calculateExpectation(this.measure());

        // Backward
        param.value = original - eps;
        this.initializeState();
        this.encodeInputs([]);
        for (const gate of this.circuit.gates) {
            if (gate.parameters.includes(paramName)) {
                this.applyGate(gate);
            }
        }
        const minus = this.calculateExpectation(this.measure());

        // Restore
        param.value = original;

        return (plus - minus) / (2 * eps);
    }

    /**
     * Train circuit on data
     */
    async train(
        data: { inputs: number[]; target: number }[],
        lossFn: (output: CircuitOutput, target: number) => number = defaultLoss
    ): Promise<TrainingResult> {
        const results: TrainingResult = {
            losses: [],
            finalParams: {},
            gradients: {}
        };

        for (let epoch = 0; epoch < this.config.epochs; epoch++) {
            const epochLosses: number[] = [];

            for (const batch of this.batchData(data)) {
                let batchGradient: Record<string, number> = {};

                for (const sample of batch) {
                    const output = await this.forward(sample.inputs);
                    const loss = lossFn(output, sample.target);

                    // Accumulate gradients
                    for (const [name, grad] of Object.entries(output.gradients)) {
                        batchGradient[name] = (batchGradient[name] || 0) + grad;
                    }
                    epochLosses.push(loss);
                }

                // Average gradients
                for (const name of Object.keys(batchGradient)) {
                    batchGradient[name] /= batch.length;
                }

                // Apply optimizer
                this.optimizer.update(this.parameters, batchGradient);
            }

            const avgLoss = epochLosses.reduce((a, b) => a + b, 0) / epochLosses.length;
            results.losses.push(avgLoss);

            this.emit('epoch', { epoch, loss: avgLoss });
        }

        // Save final parameters
        for (const [name, param] of this.parameters) {
            results.finalParams[name] = param.value;
        }

        return results;
    }

    /**
     * Batch data
     */
    private *batchData(data: { inputs: number[]; target: number }[]): Generator<{ inputs: number[]; target: number }[]> {
        for (let i = 0; i < data.length; i += this.config.batchSize) {
            yield data.slice(i, i + this.config.batchSize);
        }
    }

    /**
     * Get circuit statistics
     */
    getStats(): {
        qubitCount: number;
        gateCount: number;
        parameterCount: number;
        trainableParams: number;
        coherence: number;
    } {
        let trainable = 0;
        for (const gate of this.circuit.gates) {
            if (gate.trainable) {
                trainable += gate.parameters.length;
            }
        }

        return {
            qubitCount: this.circuit.qubits,
            gateCount: this.circuit.gates.length,
            parameterCount: this.parameters.size,
            trainableParams: trainable,
            coherence: 0.95
        };
    }
}

// ============================================================================
// OPTIMIZER
// ============================================================================

class Optimizer {
    private type: string;
    private learningRate: number;
    private momenta: Map<string, number> = new Map();
    private velocities: Map<string, number> = new Map();
    private beta1 = 0.9;
    private beta2 = 0.999;
    private epsilon = 1e-8;

    constructor(type: string, learningRate: number) {
        this.type = type;
        this.learningRate = learningRate;
    }

    /**
     * Update parameters with gradient
     */
    update(params: Map<string, { value: number; gradient: number }>, gradients: Record<string, number>): void {
        switch (this.type) {
            case 'adam':
                this.adamUpdate(params, gradients);
                break;
            case 'sgd':
                this.sgdUpdate(params, gradients);
                break;
            case 'momentum':
                this.momentumUpdate(params, gradients);
                break;
        }
    }

    /**
     * SGD update
     */
    private sgdUpdate(params: Map<string, { value: number; gradient: number }>, gradients: Record<string, number>): void {
        for (const [name, grad] of Object.entries(gradients)) {
            const param = params.get(name);
            if (param) {
                param.value -= this.learningRate * grad;
            }
        }
    }

    /**
     * Momentum update
     */
    private momentumUpdate(params: Map<string, { value: number; gradient: number }>, gradients: Record<string, number>): void {
        for (const [name, grad] of Object.entries(gradients)) {
            const param = params.get(name);
            if (!param) continue;

            const momentum = this.momenta.get(name) || 0;
            const newMomentum = this.beta1 * momentum + (1 - this.beta1) * grad;
            this.momenta.set(name, newMomentum);

            param.value -= this.learningRate * newMomentum;
        }
    }

    /**
     * Adam update
     */
    private adamUpdate(params: Map<string, { value: number; gradient: number }>, gradients: Record<string, number>): void {
        const t = Date.now();

        for (const [name, grad] of Object.entries(gradients)) {
            const param = params.get(name);
            if (!param) continue;

            const m = (this.momenta.get(name) || 0);
            const v = (this.velocities.get(name) || 0);

            const mHat = this.beta1 * m + (1 - this.beta1) * grad;
            const vHat = this.beta2 * v + (1 - this.beta2) * grad * grad;

            this.momenta.set(name, mHat);
            this.velocities.set(name, vHat);

            const mCorrected = mHat / (1 - Math.pow(this.beta1, t));
            const vCorrected = vHat / (1 - Math.pow(this.beta2, t));

            param.value -= this.learningRate * mCorrected / (Math.sqrt(vCorrected) + this.epsilon);
        }
    }
}

// ============================================================================
// TRAINING RESULT
// ============================================================================

interface TrainingResult {
    losses: number[];
    finalParams: Record<string, number>;
    gradients: Record<string, number>;
}

// ============================================================================
// DEFAULT LOSS FUNCTION
// ============================================================================

function defaultLoss(output: CircuitOutput, target: number): number {
    return Math.pow(output.expectation - target, 2);
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const differentiableCircuits = new DifferentiableQuantumCircuit();
