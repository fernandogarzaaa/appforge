declare module "*/universal_quantum_dist/index.js" {
    export class SuperpositionProcessor {
        createSuperposition(solutions: any[]): any[];
        amplifyGoodSolutions(states: any[], evalFn: (val: any) => number): any[];
        measure(states: any[]): { solution: any; probability: number }[];
    }

    export class EntanglementAnalyzer {
        findCorrelations(dataset: any): any[];
    }

    export class QuantumAnnealingOptimizer {
        optimize(initial: any, costFn: (val: any) => number): Promise<{ solution: any; cost: number }>;
    }

    export class QuantumNeuralNetwork { }
    export class QuantumGeneticAlgorithm { }
    export class QuantumCryptographer {
        encrypt(data: string): string;
        decrypt(data: string): string;
    }
    export class QuantumSwarm { }

    export default class QuantumEngine {
        superposition: SuperpositionProcessor;
        entanglement: EntanglementAnalyzer;
        annealer: QuantumAnnealingOptimizer;
        neural: QuantumNeuralNetwork;
        genetic: QuantumGeneticAlgorithm;
        cryptography: QuantumCryptographer;
        swarm: QuantumSwarm;

        constructor();

        quantumSolve(
            problem: string,
            options: any[],
            criteria: string[]
        ): Promise<{
            predictionId: string;
            optimizedBest: any;
            confidence: number;
            alternatives: any[];
            engineVersion: string;
            metaReflection?: string;
        }>;

        reportOutcome(
            predictionId: string,
            success: boolean,
            details?: any
        ): boolean;

        getStats(): {
            version: string;
            memoryItems: number;
            historyLength: number;
            learningParams: any;
            predictionsCount: number;
            successRate: number;
            engineVersion?: string;
        };

        exportLearningState(): any;
        importLearningState(state: any): void;
    }
}
