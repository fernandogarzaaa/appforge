/**
 * 🌌 ORCHESTRATOR COHERENCE SYSTEM 🌌
 * 
 * Quantum-Swarm Coherence System for Orchestrator Workflows
 * 
 * Features:
 * - Coherence score tracking (0-1) for all orchestrator operations
 * - Quantum superposition for exploring multiple task decompositions
 * - Swarm alignment for mode coordination
 * - Quantum Fisher Information (QFI) for consensus stability
 * - State persistence in swarm_memory.json
 * 
 * Integration Points:
 * - QuantumEnginePortable.js (QuantumSwarm, superposition, annealing)
 * - MULTI_SWARM_ARCHITECTURE.md (swarm definitions)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import QuantumSwarm from QuantumEnginePortable
let QuantumSwarm, SuperpositionProcessor, QuantumAnnealingOptimizer;

try {
    const QuantumEngine = await import('./QuantumEnginePortable.js');
    QuantumSwarm = QuantumEngine.QuantumSwarm;
    SuperpositionProcessor = QuantumEngine.SuperpositionProcessor;
    QuantumAnnealingOptimizer = QuantumEngine.QuantumAnnealingOptimizer;
} catch (error) {
    // Fallback implementations if import fails
    console.warn('[CoherenceManager] Using fallback implementations');
    
    // Fallback QuantumSwarm
    QuantumSwarm = class FallbackQuantumSwarm {
        constructor() {
            this.agents = [];
        }
        
        addAgent(name, role) {
            this.agents.push({ name, role });
        }
        
        async processTask(taskInput) {
            const agentStates = this.agents.map(agent => ({
                agent,
                proposal: `${agent.role} analysis of ${taskInput}`,
                confidence: Math.random()
            }));
            
            const consensus = agentStates.reduce((acc, curr) => 
                acc + (curr.confidence > 0.5 ? 1 : 0), 0);
            
            const alignment = consensus / this.agents.length;
            
            return {
                taskId: `Q-${Date.now()}`,
                agentsFunctioning: this.agents.length,
                swarmAlignment: alignment,
                decisions: agentStates.filter(s => s.confidence > 0.5)
            };
        }
    };
    
    // Fallback SuperpositionProcessor
    SuperpositionProcessor = class FallbackSuperpositionProcessor {
        constructor() {
            this.stateVector = [];
        }
        
        createSuperposition(possibleSolutions) {
            this.stateVector = possibleSolutions.map((solution, index) => ({
                solution,
                amplitude: 1 / Math.sqrt(possibleSolutions.length),
                phase: 0,
                index
            }));
            return this.stateVector;
        }
        
        amplifyGoodSolutions(evaluationFunction) {
            this.stateVector.forEach(state => {
                const quality = evaluationFunction(state.solution);
                state.amplitude *= (1 + quality);
                const totalAmplitude = this.stateVector.reduce((sum, s) => sum + s.amplitude ** 2, 0);
                state.amplitude /= Math.sqrt(totalAmplitude || 1);
            });
            return this.stateVector;
        }
        
        measure() {
            const probabilities = this.stateVector.map(state => ({
                solution: state.solution,
                probability: state.amplitude ** 2
            }));
            probabilities.sort((a, b) => b.probability - a.probability);
            return {
                bestSolution: probabilities[0]?.solution,
                probability: probabilities[0]?.probability || 0,
                allSolutions: probabilities
            };
        }
    };
    
    // Fallback QuantumAnnealingOptimizer
    QuantumAnnealingOptimizer = class FallbackQuantumAnnealingOptimizer {
        constructor(options = {}) {
            this.temperature = options.initialTemperature || 5000;
            this.coolingRate = options.coolingRate || 0.99;
            this.minTemperature = options.minTemperature || 0.01;
        }
        
        async optimize(initialSolution, energyFn) {
            let currentSolution = initialSolution;
            let currentEnergy = energyFn(currentSolution);
            let bestSolution = currentSolution;
            let bestEnergy = currentEnergy;
            let temp = this.temperature;
            
            for (let i = 0; i < 100; i++) {
                if (temp <= this.minTemperature) break;
                
                const neighbor = this.generateNeighbor(currentSolution);
                const neighborEnergy = energyFn(neighbor);
                const deltaE = neighborEnergy - currentEnergy;
                
                if (deltaE < 0 || Math.random() < Math.exp(-deltaE / temp)) {
                    currentSolution = neighbor;
                    currentEnergy = neighborEnergy;
                    
                    if (currentEnergy < bestEnergy) {
                        bestSolution = currentSolution;
                        bestEnergy = currentEnergy;
                    }
                }
                
                temp *= this.coolingRate;
            }
            
            return { solution: bestSolution, energy: bestEnergy };
        }
        
        generateNeighbor(solution) {
            if (typeof solution === 'string') {
                return Math.random() > 0.5 ? solution + "_opt" : solution;
            }
            
            const neighbor = { ...solution };
            const keys = Object.keys(neighbor);
            if (keys.length === 0) return neighbor;
            
            const randomKey = keys[Math.floor(Math.random() * keys.length)];
            
            if (typeof neighbor[randomKey] === 'number') {
                neighbor[randomKey] += (Math.random() - 0.5) * 2;
            } else if (typeof neighbor[randomKey] === 'string') {
                neighbor[randomKey] += "_mut";
            }
            return neighbor;
        }
    };
}

/**
 * Constants for coherence calculations
 */
const COHERENCE_CONSTANTS = {
    MIN_COHERENCE: 0,
    MAX_COHERENCE: 1,
    QFI_SCALING_FACTOR: 0.1,
    SUPERPOSITION_DECAY: 0.95,
    SWARM_ALIGNMENT_THRESHOLD: 0.7,
    ANNEALING_ITERATIONS: 100,
    INITIAL_TEMPERATURE: 5000,
    COOLING_RATE: 0.99,
    MIN_TEMPERATURE: 0.01
};

/**
 * Orchestrator Mode Definitions
 * Based on MULTI_SWARM_ARCHITECTURE.md
 */
export const ORCHESTRATOR_MODES = {
    MAIN: 'main',
    FINANCE: 'finance',
    CRYPTO: 'crypto',
    GOD: 'god',
    CODE: 'code',
    ARCHITECT: 'architect',
    DEBUG: 'debug',
    ASK: 'ask',
    REVIEW: 'review'
};

/**
 * 🎯 CoherenceManager Class
 * 
 * Manages quantum-swarm coherence for orchestrator workflows.
 * Tracks coherence scores, coordinates mode selection via swarm patterns,
 * and optimizes workflow execution.
 */
export class CoherenceManager {
    constructor(options = {}) {
        // Core coherence state
        this.coherenceScore = options.initialCoherence || COHERENCE_CONSTANTS.MAX_COHERENCE;
        this.swarm = new QuantumSwarm();
        this.superposition = new SuperpositionProcessor();
        this.annealing = new QuantumAnnealingOptimizer({
            initialTemperature: options.initialTemperature || COHERENCE_CONSTANTS.INITIAL_TEMPERATURE,
            coolingRate: options.coolingRate || COHERENCE_CONSTANTS.COOLING_RATE,
            minTemperature: options.minTemperature || COHERENCE_CONSTANTS.MIN_TEMPERATURE
        });
        
        // State management
        this.stateFile = options.stateFile || path.join(__dirname, 'swarm_memory.json');
        this.orchestratorState = {
            tasks: [],
            modeStates: {},
            coherenceHistory: [],
            decisionLog: [],
            quantumMetadata: {}
        };
        
        // Initialize swarm agents for orchestrator
        this._initializeOrchestratorSwarm();
        
        // Load existing state
        this._loadState();
    }
    
    /**
     * Initialize the orchestrator swarm with default agents
     * @private
     */
    _initializeOrchestratorSwarm() {
        const defaultAgents = [
            { name: 'Sentinel', role: 'security' },
            { name: 'BugHunter', role: 'debugging' },
            { name: 'Optimizer', role: 'optimization' },
            { name: 'ProductOwner', role: 'product' },
            { name: 'GodMode', role: 'coordination' },
            { name: 'Antigravity', role: 'innovation' }
        ];
        
        for (const agent of defaultAgents) {
            this.swarm.addAgent(agent.name, agent.role);
        }
    }
    
    /**
     * Load orchestrator state from persistent storage
     * @private
     */
    _loadState() {
        try {
            if (fs.existsSync(this.stateFile)) {
                const data = fs.readFileSync(this.stateFile, 'utf8');
                const parsed = JSON.parse(data);
                
                // Merge loaded state
                this.orchestratorState = {
                    ...this.orchestratorState,
                    ...parsed.orchestrator || {}
                };
                
                // Restore coherence score
                if (parsed.coherenceScore !== undefined) {
                    this.coherenceScore = parsed.coherenceScore;
                }
                
                console.log('[CoherenceManager] State loaded from', this.stateFile);
            }
        } catch (error) {
            console.warn('[CoherenceManager] Failed to load state:', error.message);
        }
    }
    
    /**
     * Save orchestrator state to persistent storage
     * @private
     */
    _saveState() {
        try {
            const stateToSave = {
                coherenceScore: this.coherenceScore,
                orchestratorState: this.orchestratorState,
                lastModified: new Date().toISOString()
            };
            
            // Read existing file if exists
            let existingData = {};
            if (fs.existsSync(this.stateFile)) {
                try {
                    existingData = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
                } catch (e) {
                    // File exists but invalid JSON
                }
            }
            
            // Merge and write
            fs.writeFileSync(
                this.stateFile,
                JSON.stringify({ ...existingData, ...stateToSave }, null, 2)
            );
            
            console.log('[CoherenceManager] State saved to', this.stateFile);
        } catch (error) {
            console.error('[CoherenceManager] Failed to save state:', error.message);
        }
    }
    
    /**
     * 🧬 Decompose a task using quantum superposition
     * 
     * Explores multiple possible task decompositions simultaneously
     * and uses amplitude amplification to find optimal decomposition.
     * 
     * @param {Object} task - The task to decompose
     * @param {Array} possibleStrategies - Possible decomposition strategies
     * @returns {Promise<Object>} Decomposition result with coherence metadata
     */
    async decomposeTask(task, possibleStrategies = null) {
        const startTime = Date.now();
        const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Generate default strategies if not provided
        if (!possibleStrategies) {
            possibleStrategies = this._generateDefaultStrategies(task);
        }
        
        // Create superposition of decompositions
        this.superposition.createSuperposition(possibleStrategies);
        
        // Evaluate and amplify good decompositions
        const evaluationFn = (strategy) => this._evaluateStrategy(strategy, task);
        this.superposition.amplifyGoodSolutions(evaluationFn);
        
        // Measure to get best decomposition
        const measurement = this.superposition.measure();
        
        // Perform quantum annealing for refinement
        const annealingResult = await this.annealing.optimize(
            measurement.bestSolution,
            (sol) => -evaluationFn(sol)
        );
        
        // Calculate coherence impact
        const decompositionCoherence = this._calculateDecompositionCoherence(
            measurement,
            annealingResult
        );
        
        // Update overall coherence
        this._updateCoherence(decompositionCoherence);
        
        // Build result
        const result = {
            taskId,
            originalTask: task,
            decomposition: annealingResult.solution,
            confidence: measurement.probability,
            coherenceScore: this.coherenceScore,
            quantumMetadata: {
                superpositionStates: possibleStrategies.length,
                amplitudeDistribution: measurement.allSolutions.map(s => ({
                    strategy: s.solution.name,
                    probability: s.probability
                })),
                annealingEnergy: annealingResult.energy,
                processingTime: Date.now() - startTime,
                quantumFisherInformation: this._calculateQFI(measurement.allSolutions)
            },
            timestamp: new Date().toISOString()
        };
        
        // Log decision
        this._logDecision('decomposeTask', result);
        
        return result;
    }
    
    /**
     * 🐝 Delegate task to modes using swarm pattern
     * 
     * Uses swarm intelligence to coordinate mode selection
     * and achieve optimal delegation.
     * 
     * @param {Object} task - The task to delegate
     * @param {Array} modes - Available modes for delegation
     * @returns {Promise<Object>} Delegation result with swarm alignment
     */
    async delegateToModes(task, modes = null) {
        const startTime = Date.now();
        const delegationId = `delegation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Use default modes if not provided
        if (!modes) {
            modes = Object.values(ORCHESTRATOR_MODES);
        }
        
        // Process task through swarm
        const swarmResult = await this.swarm.processTask(
            JSON.stringify({ task, modes })
        );
        
        // Create superposition of mode assignments
        const modeAssignments = modes.map((mode, index) => ({
            mode,
            assignment: {
                primaryMode: mode,
                confidence: 1 / modes.length + (Math.random() * 0.2),
                subtasks: Math.floor(Math.random() * 5) + 1
            },
            index
        }));
        
        this.superposition.createSuperposition(modeAssignments);
        
        // Amplify based on swarm alignment
        const evaluationFn = (assignment) => 
            assignment.confidence * swarmResult.swarmAlignment;
        
        this.superposition.amplifyGoodSolutions(evaluationFn);
        const measurement = this.superposition.measure();
        
        // Anneal for final assignment
        const annealingResult = await this.annealing.optimize(
            measurement.bestSolution,
            (sol) => -evaluationFn(sol)
        );
        
        // Calculate swarm alignment
        const swarmAlignment = this._calculateSwarmAlignment(
            swarmResult,
            measurement,
            annealingResult
        );
        
        // Update coherence
        this._updateCoherence(swarmAlignment);
        
        // Build result
        const result = {
            delegationId,
            task,
            assignedMode: annealingResult.solution.mode,
            assignment: annealingResult.solution.assignment,
            swarmAlignment: swarmResult.swarmAlignment,
            consensusScore: swarmAlignment,
            coherenceScore: this.coherenceScore,
            quantumMetadata: {
                candidateModes: modes.length,
                swarmAgents: this.swarm.agents.length,
                consensusLevel: swarmResult.swarmAlignment,
                amplitudeProbabilities: measurement.allSolutions.map(m => ({
                    mode: m.solution.mode,
                    probability: m.probability
                })),
                quantumFisherInformation: this._calculateQFI(measurement.allSolutions),
                processingTime: Date.now() - startTime
            },
            timestamp: new Date().toISOString()
        };
        
        // Log decision
        this._logDecision('delegateToModes', result);
        
        return result;
    }
    
    /**
     * 📊 Measure current coherence
     * 
     * Returns the current coherence metric with detailed breakdown.
     * 
     * @returns {Object} Coherence measurement result
     */
    measureCoherence() {
        const recentHistory = this.orchestratorState.coherenceHistory.slice(-100);
        
        // Calculate various coherence components
        const componentScores = {
            quantumCoherence: this._calculateQuantumCoherence(),
            swarmCoherence: this._calculateSwarmCoherence(),
            temporalCoherence: this._calculateTemporalCoherence(recentHistory),
            holographicConsensus: this._calculateHolographicConsensus()
        };
        
        // Calculate overall coherence (weighted average)
        const weights = {
            quantumCoherence: 0.3,
            swarmCoherence: 0.3,
            temporalCoherence: 0.2,
            holographicConsensus: 0.2
        };
        
        const overallCoherence = Object.entries(componentScores).reduce(
            (sum, [key, score]) => sum + score * weights[key],
            0
        );
        
        // Update internal coherence score
        this.coherenceScore = overallCoherence;
        
        return {
            coherenceScore: overallCoherence,
            components: componentScores,
            quantumFisherInformation: this._calculateGlobalQFI(),
            stabilityIndex: this._calculateStabilityIndex(recentHistory),
            historyLength: this.orchestratorState.coherenceHistory.length,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * ⚡ Optimize workflow using quantum annealing
     * 
     * Applies quantum annealing to optimize workflow execution
     * for maximum coherence.
     * 
     * @param {Object} workflow - The workflow to optimize
     * @returns {Promise<Object>} Optimized workflow result
     */
    async optimizeWorkflow(workflow = null) {
        const startTime = Date.now();
        const optimizationId = `optimize-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Use current state if no workflow provided
        if (!workflow) {
            workflow = this._getCurrentWorkflowState();
        }
        
        // Define energy function for annealing
        const energyFn = (state) => this._calculateWorkflowEnergy(state);
        
        // Apply quantum annealing
        const annealingResult = await this.annealing.optimize(workflow, energyFn);
        
        // Calculate optimization coherence
        const optimizationCoherence = this._calculateOptimizationCoherence(
            workflow,
            annealingResult
        );
        
        // Update coherence
        this._updateCoherence(optimizationCoherence);
        
        // Build result
        const result = {
            optimizationId,
            originalWorkflow: workflow,
            optimizedWorkflow: annealingResult.solution,
            energy: annealingResult.energy,
            coherenceImprovement: optimizationCoherence - this.coherenceScore,
            coherenceScore: this.coherenceScore,
            quantumMetadata: {
                initialTemperature: this.annealing.temperature,
                finalTemperature: COHERENCE_CONSTANTS.MIN_TEMPERATURE,
                coolingRate: this.annealing.coolingRate,
                quantumFisherInformation: this._calculateQFI([annealingResult]),
                processingTime: Date.now() - startTime
            },
            timestamp: new Date().toISOString()
        };
        
        // Log decision
        this._logDecision('optimizeWorkflow', result);
        
        // Save state
        this._saveState();
        
        return result;
    }
    
    /**
     * 🎯 Calculate Quantum Fisher Information (QFI)
     * 
     * Measures the information content of quantum states
     * for consensus stability.
     * 
     * @param {Array} states - Quantum states to analyze
     * @returns {number} QFI value
     */
    _calculateQFI(states) {
        if (!states || states.length < 2) return 0;
        
        // Calculate Fisher Information based on probability distribution
        const probabilities = states.map(s => s.probability || Math.pow(s.amplitude || 0, 2));
        const sumProb = probabilities.reduce((a, b) => a + b, 0);
        
        if (sumProb === 0) return 0;
        
        // Normalize probabilities
        const normalizedProbs = probabilities.map(p => p / sumProb);
        
        // Calculate QFI (simplified version)
        let qfi = 0;
        for (let i = 0; i < normalizedProbs.length; i++) {
            if (normalizedProbs[i] > 0.01) {
                qfi += normalizedProbs[i] * Math.pow(Math.log2(normalizedProbs[i]), 2);
            }
        }
        
        return qfi * COHERENCE_CONSTANTS.QFI_SCALING_FACTOR;
    }
    
    /**
     * 🔄 Update coherence score with new measurement
     * @private
     */
    _updateCoherence(newCoherence) {
        // Exponential moving average for smooth coherence tracking
        const alpha = 0.3;
        this.coherenceScore = alpha * newCoherence + (1 - alpha) * this.coherenceScore;
        
        // Clamp to valid range
        this.coherenceScore = Math.max(
            COHERENCE_CONSTANTS.MIN_COHERENCE,
            Math.min(COHERENCE_CONSTANTS.MAX_COHERENCE, this.coherenceScore)
        );
        
        // Record in history
        this.orchestratorState.coherenceHistory.push({
            score: this.coherenceScore,
            timestamp: new Date().toISOString()
        });
        
        // Trim history if too long
        if (this.orchestratorState.coherenceHistory.length > 1000) {
            this.orchestratorState.coherenceHistory = 
                this.orchestratorState.coherenceHistory.slice(-500);
        }
    }
    
    /**
     * 📝 Log a decision to the decision log
     * @private
     */
    _logDecision(decisionType, result) {
        this.orchestratorState.decisionLog.push({
            type: decisionType,
            result,
            coherenceScore: this.coherenceScore,
            timestamp: new Date().toISOString()
        });
        
        // Trim log if too long
        if (this.orchestratorState.decisionLog.length > 500) {
            this.orchestratorState.decisionLog = 
                this.orchestratorState.decisionLog.slice(-250);
        }
    }
    
    /**
     * 🔧 Generate default decomposition strategies
     * @private
     */
    _generateDefaultStrategies(task) {
        return [
            { name: 'sequential', type: 'linear', complexity: 0.5 },
            { name: 'parallel', type: 'concurrent', complexity: 0.7 },
            { name: 'hierarchical', type: 'tree', complexity: 0.6 },
            { name: 'recursive', type: 'fractal', complexity: 0.8 },
            { name: 'adaptive', type: 'dynamic', complexity: 0.9 }
        ];
    }
    
    /**
     * 📊 Evaluate a decomposition strategy
     * @private
     */
    _evaluateStrategy(strategy, task) {
        // Simple evaluation based on strategy properties
        let score = 0.5;
        
        if (strategy.type === 'concurrent') score += 0.2;
        if (strategy.type === 'dynamic') score += 0.15;
        if (strategy.complexity > 0.7) score += 0.1;
        
        // Add some randomness for quantum uncertainty
        score += (Math.random() - 0.5) * 0.1;
        
        return Math.max(0, Math.min(1, score));
    }
    
    /**
     * 🧮 Calculate decomposition coherence
     * @private
     */
    _calculateDecompositionCoherence(measurement, annealingResult) {
        const amplitudeCoherence = measurement.probability;
        const annealingCoherence = 1 - Math.min(1, annealingResult.energy);
        
        return (amplitudeCoherence + annealingCoherence) / 2;
    }
    
    /**
     * 🐝 Calculate swarm alignment
     * @private
     */
    _calculateSwarmAlignment(swarmResult, measurement, annealingResult) {
        const alignment = swarmResult.swarmAlignment || 0;
        const consensus = measurement.probability || 0;
        const optimization = annealingResult.energy || 0;
        
        return (alignment * 0.4 + consensus * 0.3 + (1 - optimization) * 0.3);
    }
    
    /**
     * 📈 Calculate quantum coherence component
     * @private
     */
    _calculateQuantumCoherence() {
        // Based on superposition and entanglement quality
        const superpositionQuality = this.superposition.stateVector.length > 0 ? 
            this.superposition.stateVector.reduce(
                (sum, s) => sum + Math.pow(s.amplitude, 2), 0
            ) / (this.superposition.stateVector.length || 1) : 0;
        
        return Math.min(1, superpositionQuality * 2);
    }
    
    /**
     * 🐝 Calculate swarm coherence component
     * @private
     */
    _calculateSwarmCoherence() {
        // Based on agent alignment and consensus
        const recentDecisions = this.orchestratorState.decisionLog.slice(-10);
        
        if (recentDecisions.length === 0) return 1;
        
        const alignmentScores = recentDecisions.map(d => 
            d.result?.swarmAlignment || 0.5
        );
        
        const avgAlignment = alignmentScores.reduce((a, b) => a + b, 0) / alignmentScores.length;
        
        return avgAlignment;
    }
    
    /**
     * ⏱️ Calculate temporal coherence component
     * @private
     */
    _calculateTemporalCoherence(history) {
        if (history.length < 2) return 1;
        
        // Calculate variance in recent history
        const scores = history.map(h => h.score);
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
        
        // Lower variance = higher temporal coherence
        return Math.max(0, 1 - Math.sqrt(variance));
    }
    
    /**
     * 🌐 Calculate holographic consensus component
     * @private
     */
    _calculateHolographicConsensus() {
        // Calculate consensus across all decision types
        const recentDecisions = this.orchestratorState.decisionLog.slice(-50);
        
        if (recentDecisions.length === 0) return 1;
        
        const decisionTypes = {};
        recentDecisions.forEach(d => {
            if (!decisionTypes[d.type]) {
                decisionTypes[d.type] = [];
            }
            decisionTypes[d.type].push(d.coherenceScore || 0.5);
        });
        
        // Calculate consensus within each type
        const typeConsensus = Object.values(decisionTypes).map(scores => {
            const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
            const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
            return 1 - Math.sqrt(variance);
        });
        
        // Average consensus across types
        return typeConsensus.reduce((a, b) => a + b, 0) / (typeConsensus.length || 1);
    }
    
    /**
     * 📊 Calculate global QFI across all states
     * @private
     */
    _calculateGlobalQFI() {
        const allStates = [];
        
        // Collect states from recent decisions
        for (const decision of this.orchestratorState.decisionLog.slice(-20)) {
            if (decision.result?.quantumMetadata?.amplitudeDistribution) {
                allStates.push(...decision.result.quantumMetadata.amplitudeDistribution);
            }
        }
        
        return this._calculateQFI(allStates);
    }
    
    /**
     * 📈 Calculate stability index from history
     * @private
     */
    _calculateStabilityIndex(history) {
        if (history.length < 2) return 1;
        
        // Calculate trend and volatility
        const scores = history.map(h => h.score);
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        
        // Calculate coefficient of variation
        const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
        const cv = Math.sqrt(variance) / (mean || 1);
        
        return Math.max(0, 1 - cv);
    }
    
    /**
     * 🔧 Get current workflow state
     * @private
     */
    _getCurrentWorkflowState() {
        return {
            coherenceScore: this.coherenceScore,
            taskCount: this.orchestratorState.tasks.length,
            modeStates: this.orchestratorState.modeStates,
            recentDecisions: this.orchestratorState.decisionLog.slice(-10)
        };
    }
    
    /**
     * ⚡ Calculate workflow energy for annealing
     * @private
     */
    _calculateWorkflowEnergy(state) {
        // Energy is inverse of coherence
        const coherence = this._calculateWorkflowCoherence(state);
        return 1 - coherence;
    }
    
    /**
     * 📊 Calculate coherence of a workflow state
     * @private
     */
    _calculateWorkflowCoherence(state) {
        let coherence = 0.5;
        
        if (state.coherenceScore) {
            coherence = state.coherenceScore;
        }
        
        if (state.recentDecisions) {
            const avgDecisionCoherence = state.recentDecisions.reduce(
                (sum, d) => sum + (d.coherenceScore || 0.5), 0
            ) / (state.recentDecisions.length || 1);
            
            coherence = (coherence + avgDecisionCoherence) / 2;
        }
        
        return coherence;
    }
    
    /**
     * 🎯 Calculate optimization coherence improvement
     * @private
     */
    _calculateOptimizationCoherence(original, annealingResult) {
        const originalCoherence = this._calculateWorkflowCoherence(original);
        const optimizedCoherence = this._calculateWorkflowCoherence(annealingResult.solution);
        
        return (originalCoherence + optimizedCoherence) / 2;
    }
    
    /**
     * 💾 Reset coherence state
     */
    reset() {
        this.coherenceScore = COHERENCE_CONSTANTS.MAX_COHERENCE;
        this.orchestratorState = {
            tasks: [],
            modeStates: {},
            coherenceHistory: [],
            decisionLog: [],
            quantumMetadata: {}
        };
        
        // Clear persistent state
        try {
            if (fs.existsSync(this.stateFile)) {
                const data = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
                data.coherenceScore = this.coherenceScore;
                data.orchestratorState = this.orchestratorState;
                fs.writeFileSync(this.stateFile, JSON.stringify(data, null, 2));
            }
        } catch (error) {
            console.error('[CoherenceManager] Failed to reset state:', error.message);
        }
        
        return { success: true, coherenceScore: this.coherenceScore };
    }
    
    /**
     * 📋 Get orchestrator status summary
     */
    getStatus() {
        return {
            coherenceScore: this.coherenceScore,
            swarmAgents: this.swarm.agents.length,
            tasksProcessed: this.orchestratorState.tasks.length,
            decisionsLogged: this.orchestratorState.decisionLog.length,
            stateFile: this.stateFile,
            modes: ORCHESTRATOR_MODES,
            quantumMetadata: {
                superpositionSize: this.superposition.stateVector.length,
                temperature: this.annealing.temperature,
                qfi: this._calculateGlobalQFI()
            }
        };
    }
}

/**
 * Create and export default CoherenceManager instance
 */
const coherenceManager = new CoherenceManager();

export default {
    CoherenceManager,
    coherenceManager,
    ORCHESTRATOR_MODES,
    COHERENCE_CONSTANTS
};
 * 🌌 ORCHESTRATOR COHERENCE SYSTEM 🌌
 * 
 * Quantum-Swarm Coherence System for Orchestrator Workflows
 * 
 * Features:
 * - Coherence score tracking (0-1) for all orchestrator operations
 * - Quantum superposition for exploring multiple task decompositions
 * - Swarm alignment for mode coordination
 * - Quantum Fisher Information (QFI) for consensus stability
 * - State persistence in swarm_memory.json
 * 
 * Integration Points:
 * - QuantumEnginePortable.js (QuantumSwarm, superposition, annealing)
 * - MULTI_SWARM_ARCHITECTURE.md (swarm definitions)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import QuantumSwarm from QuantumEnginePortable
let QuantumSwarm, SuperpositionProcessor, QuantumAnnealingOptimizer;

try {
    const QuantumEngine = await import('./QuantumEnginePortable.js');
    QuantumSwarm = QuantumEngine.QuantumSwarm;
    SuperpositionProcessor = QuantumEngine.SuperpositionProcessor;
    QuantumAnnealingOptimizer = QuantumEngine.QuantumAnnealingOptimizer;
} catch (error) {
    // Fallback implementations if import fails
    console.warn('[CoherenceManager] Using fallback implementations');
    
    // Fallback QuantumSwarm
    QuantumSwarm = class FallbackQuantumSwarm {
        constructor() {
            this.agents = [];
        }
        
        addAgent(name, role) {
            this.agents.push({ name, role });
        }
        
        async processTask(taskInput) {
            const agentStates = this.agents.map(agent => ({
                agent,
                proposal: `${agent.role} analysis of ${taskInput}`,
                confidence: Math.random()
            }));
            
            const consensus = agentStates.reduce((acc, curr) => 
                acc + (curr.confidence > 0.5 ? 1 : 0), 0);
            
            const alignment = consensus / this.agents.length;
            
            return {
                taskId: `Q-${Date.now()}`,
                agentsFunctioning: this.agents.length,
                swarmAlignment: alignment,
                decisions: agentStates.filter(s => s.confidence > 0.5)
            };
        }
    };
    
    // Fallback SuperpositionProcessor
    SuperpositionProcessor = class FallbackSuperpositionProcessor {
        constructor() {
            this.stateVector = [];
        }
        
        createSuperposition(possibleSolutions) {
            this.stateVector = possibleSolutions.map((solution, index) => ({
                solution,
                amplitude: 1 / Math.sqrt(possibleSolutions.length),
                phase: 0,
                index
            }));
            return this.stateVector;
        }
        
        amplifyGoodSolutions(evaluationFunction) {
            this.stateVector.forEach(state => {
                const quality = evaluationFunction(state.solution);
                state.amplitude *= (1 + quality);
                const totalAmplitude = this.stateVector.reduce((sum, s) => sum + s.amplitude ** 2, 0);
                state.amplitude /= Math.sqrt(totalAmplitude || 1);
            });
            return this.stateVector;
        }
        
        measure() {
            const probabilities = this.stateVector.map(state => ({
                solution: state.solution,
                probability: state.amplitude ** 2
            }));
            probabilities.sort((a, b) => b.probability - a.probability);
            return {
                bestSolution: probabilities[0]?.solution,
                probability: probabilities[0]?.probability || 0,
                allSolutions: probabilities
            };
        }
    };
    
    // Fallback QuantumAnnealingOptimizer
    QuantumAnnealingOptimizer = class FallbackQuantumAnnealingOptimizer {
        constructor(options = {}) {
            this.temperature = options.initialTemperature || 5000;
            this.coolingRate = options.coolingRate || 0.99;
            this.minTemperature = options.minTemperature || 0.01;
        }
        
        async optimize(initialSolution, energyFn) {
            let currentSolution = initialSolution;
            let currentEnergy = energyFn(currentSolution);
            let bestSolution = currentSolution;
            let bestEnergy = currentEnergy;
            let temp = this.temperature;
            
            for (let i = 0; i < 100; i++) {
                if (temp <= this.minTemperature) break;
                
                const neighbor = this.generateNeighbor(currentSolution);
                const neighborEnergy = energyFn(neighbor);
                const deltaE = neighborEnergy - currentEnergy;
                
                if (deltaE < 0 || Math.random() < Math.exp(-deltaE / temp)) {
                    currentSolution = neighbor;
                    currentEnergy = neighborEnergy;
                    
                    if (currentEnergy < bestEnergy) {
                        bestSolution = currentSolution;
                        bestEnergy = currentEnergy;
                    }
                }
                
                temp *= this.coolingRate;
            }
            
            return { solution: bestSolution, energy: bestEnergy };
        }
        
        generateNeighbor(solution) {
            if (typeof solution === 'string') {
                return Math.random() > 0.5 ? solution + "_opt" : solution;
            }
            
            const neighbor = { ...solution };
            const keys = Object.keys(neighbor);
            if (keys.length === 0) return neighbor;
            
            const randomKey = keys[Math.floor(Math.random() * keys.length)];
            
            if (typeof neighbor[randomKey] === 'number') {
                neighbor[randomKey] += (Math.random() - 0.5) * 2;
            } else if (typeof neighbor[randomKey] === 'string') {
                neighbor[randomKey] += "_mut";
            }
            return neighbor;
        }
    };
}

/**
 * Constants for coherence calculations
 */
const COHERENCE_CONSTANTS = {
    MIN_COHERENCE: 0,
    MAX_COHERENCE: 1,
    QFI_SCALING_FACTOR: 0.1,
    SUPERPOSITION_DECAY: 0.95,
    SWARM_ALIGNMENT_THRESHOLD: 0.7,
    ANNEALING_ITERATIONS: 100,
    INITIAL_TEMPERATURE: 5000,
    COOLING_RATE: 0.99,
    MIN_TEMPERATURE: 0.01
};

/**
 * Orchestrator Mode Definitions
 * Based on MULTI_SWARM_ARCHITECTURE.md
 */
export const ORCHESTRATOR_MODES = {
    MAIN: 'main',
    FINANCE: 'finance',
    CRYPTO: 'crypto',
    GOD: 'god',
    CODE: 'code',
    ARCHITECT: 'architect',
    DEBUG: 'debug',
    ASK: 'ask',
    REVIEW: 'review'
};

/**
 * 🎯 CoherenceManager Class
 * 
 * Manages quantum-swarm coherence for orchestrator workflows.
 * Tracks coherence scores, coordinates mode selection via swarm patterns,
 * and optimizes workflow execution.
 */
export class CoherenceManager {
    constructor(options = {}) {
        // Core coherence state
        this.coherenceScore = options.initialCoherence || COHERENCE_CONSTANTS.MAX_COHERENCE;
        this.swarm = new QuantumSwarm();
        this.superposition = new SuperpositionProcessor();
        this.annealing = new QuantumAnnealingOptimizer({
            initialTemperature: options.initialTemperature || COHERENCE_CONSTANTS.INITIAL_TEMPERATURE,
            coolingRate: options.coolingRate || COHERENCE_CONSTANTS.COOLING_RATE,
            minTemperature: options.minTemperature || COHERENCE_CONSTANTS.MIN_TEMPERATURE
        });
        
        // State management
        this.stateFile = options.stateFile || path.join(__dirname, 'swarm_memory.json');
        this.orchestratorState = {
            tasks: [],
            modeStates: {},
            coherenceHistory: [],
            decisionLog: [],
            quantumMetadata: {}
        };
        
        // Initialize swarm agents for orchestrator
        this._initializeOrchestratorSwarm();
        
        // Load existing state
        this._loadState();
    }
    
    /**
     * Initialize the orchestrator swarm with default agents
     * @private
     */
    _initializeOrchestratorSwarm() {
        const defaultAgents = [
            { name: 'Sentinel', role: 'security' },
            { name: 'BugHunter', role: 'debugging' },
            { name: 'Optimizer', role: 'optimization' },
            { name: 'ProductOwner', role: 'product' },
            { name: 'GodMode', role: 'coordination' },
            { name: 'Antigravity', role: 'innovation' }
        ];
        
        for (const agent of defaultAgents) {
            this.swarm.addAgent(agent.name, agent.role);
        }
    }
    
    /**
     * Load orchestrator state from persistent storage
     * @private
     */
    _loadState() {
        try {
            if (fs.existsSync(this.stateFile)) {
                const data = fs.readFileSync(this.stateFile, 'utf8');
                const parsed = JSON.parse(data);
                
                // Merge loaded state
                this.orchestratorState = {
                    ...this.orchestratorState,
                    ...parsed.orchestrator || {}
                };
                
                // Restore coherence score
                if (parsed.coherenceScore !== undefined) {
                    this.coherenceScore = parsed.coherenceScore;
                }
                
                console.log('[CoherenceManager] State loaded from', this.stateFile);
            }
        } catch (error) {
            console.warn('[CoherenceManager] Failed to load state:', error.message);
        }
    }
    
    /**
     * Save orchestrator state to persistent storage
     * @private
     */
    _saveState() {
        try {
            const stateToSave = {
                coherenceScore: this.coherenceScore,
                orchestratorState: this.orchestratorState,
                lastModified: new Date().toISOString()
            };
            
            // Read existing file if exists
            let existingData = {};
            if (fs.existsSync(this.stateFile)) {
                try {
                    existingData = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
                } catch (e) {
                    // File exists but invalid JSON
                }
            }
            
            // Merge and write
            fs.writeFileSync(
                this.stateFile,
                JSON.stringify({ ...existingData, ...stateToSave }, null, 2)
            );
            
            console.log('[CoherenceManager] State saved to', this.stateFile);
        } catch (error) {
            console.error('[CoherenceManager] Failed to save state:', error.message);
        }
    }
    
    /**
     * 🧬 Decompose a task using quantum superposition
     * 
     * Explores multiple possible task decompositions simultaneously
     * and uses amplitude amplification to find optimal decomposition.
     * 
     * @param {Object} task - The task to decompose
     * @param {Array} possibleStrategies - Possible decomposition strategies
     * @returns {Promise<Object>} Decomposition result with coherence metadata
     */
    async decomposeTask(task, possibleStrategies = null) {
        const startTime = Date.now();
        const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Generate default strategies if not provided
        if (!possibleStrategies) {
            possibleStrategies = this._generateDefaultStrategies(task);
        }
        
        // Create superposition of decompositions
        this.superposition.createSuperposition(possibleStrategies);
        
        // Evaluate and amplify good decompositions
        const evaluationFn = (strategy) => this._evaluateStrategy(strategy, task);
        this.superposition.amplifyGoodSolutions(evaluationFn);
        
        // Measure to get best decomposition
        const measurement = this.superposition.measure();
        
        // Perform quantum annealing for refinement
        const annealingResult = await this.annealing.optimize(
            measurement.bestSolution,
            (sol) => -evaluationFn(sol)
        );
        
        // Calculate coherence impact
        const decompositionCoherence = this._calculateDecompositionCoherence(
            measurement,
            annealingResult
        );
        
        // Update overall coherence
        this._updateCoherence(decompositionCoherence);
        
        // Build result
        const result = {
            taskId,
            originalTask: task,
            decomposition: annealingResult.solution,
            confidence: measurement.probability,
            coherenceScore: this.coherenceScore,
            quantumMetadata: {
                superpositionStates: possibleStrategies.length,
                amplitudeDistribution: measurement.allSolutions.map(s => ({
                    strategy: s.solution.name,
                    probability: s.probability
                })),
                annealingEnergy: annealingResult.energy,
                processingTime: Date.now() - startTime,
                quantumFisherInformation: this._calculateQFI(measurement.allSolutions)
            },
            timestamp: new Date().toISOString()
        };
        
        // Log decision
        this._logDecision('decomposeTask', result);
        
        return result;
    }
    
    /**
     * 🐝 Delegate task to modes using swarm pattern
     * 
     * Uses swarm intelligence to coordinate mode selection
     * and achieve optimal delegation.
     * 
     * @param {Object} task - The task to delegate
     * @param {Array} modes - Available modes for delegation
     * @returns {Promise<Object>} Delegation result with swarm alignment
     */
    async delegateToModes(task, modes = null) {
        const startTime = Date.now();
        const delegationId = `delegation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Use default modes if not provided
        if (!modes) {
            modes = Object.values(ORCHESTRATOR_MODES);
        }
        
        // Process task through swarm
        const swarmResult = await this.swarm.processTask(
            JSON.stringify({ task, modes })
        );
        
        // Create superposition of mode assignments
        const modeAssignments = modes.map((mode, index) => ({
            mode,
            assignment: {
                primaryMode: mode,
                confidence: 1 / modes.length + (Math.random() * 0.2),
                subtasks: Math.floor(Math.random() * 5) + 1
            },
            index
        }));
        
        this.superposition.createSuperposition(modeAssignments);
        
        // Amplify based on swarm alignment
        const evaluationFn = (assignment) => 
            assignment.confidence * swarmResult.swarmAlignment;
        
        this.superposition.amplifyGoodSolutions(evaluationFn);
        const measurement = this.superposition.measure();
        
        // Anneal for final assignment
        const annealingResult = await this.annealing.optimize(
            measurement.bestSolution,
            (sol) => -evaluationFn(sol)
        );
        
        // Calculate swarm alignment
        const swarmAlignment = this._calculateSwarmAlignment(
            swarmResult,
            measurement,
            annealingResult
        );
        
        // Update coherence
        this._updateCoherence(swarmAlignment);
        
        // Build result
        const result = {
            delegationId,
            task,
            assignedMode: annealingResult.solution.mode,
            assignment: annealingResult.solution.assignment,
            swarmAlignment: swarmResult.swarmAlignment,
            consensusScore: swarmAlignment,
            coherenceScore: this.coherenceScore,
            quantumMetadata: {
                candidateModes: modes.length,
                swarmAgents: this.swarm.agents.length,
                consensusLevel: swarmResult.swarmAlignment,
                amplitudeProbabilities: measurement.allSolutions.map(m => ({
                    mode: m.solution.mode,
                    probability: m.probability
                })),
                quantumFisherInformation: this._calculateQFI(measurement.allSolutions),
                processingTime: Date.now() - startTime
            },
            timestamp: new Date().toISOString()
        };
        
        // Log decision
        this._logDecision('delegateToModes', result);
        
        return result;
    }
    
    /**
     * 📊 Measure current coherence
     * 
     * Returns the current coherence metric with detailed breakdown.
     * 
     * @returns {Object} Coherence measurement result
     */
    measureCoherence() {
        const recentHistory = this.orchestratorState.coherenceHistory.slice(-100);
        
        // Calculate various coherence components
        const componentScores = {
            quantumCoherence: this._calculateQuantumCoherence(),
            swarmCoherence: this._calculateSwarmCoherence(),
            temporalCoherence: this._calculateTemporalCoherence(recentHistory),
            holographicConsensus: this._calculateHolographicConsensus()
        };
        
        // Calculate overall coherence (weighted average)
        const weights = {
            quantumCoherence: 0.3,
            swarmCoherence: 0.3,
            temporalCoherence: 0.2,
            holographicConsensus: 0.2
        };
        
        const overallCoherence = Object.entries(componentScores).reduce(
            (sum, [key, score]) => sum + score * weights[key],
            0
        );
        
        // Update internal coherence score
        this.coherenceScore = overallCoherence;
        
        return {
            coherenceScore: overallCoherence,
            components: componentScores,
            quantumFisherInformation: this._calculateGlobalQFI(),
            stabilityIndex: this._calculateStabilityIndex(recentHistory),
            historyLength: this.orchestratorState.coherenceHistory.length,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * ⚡ Optimize workflow using quantum annealing
     * 
     * Applies quantum annealing to optimize workflow execution
     * for maximum coherence.
     * 
     * @param {Object} workflow - The workflow to optimize
     * @returns {Promise<Object>} Optimized workflow result
     */
    async optimizeWorkflow(workflow = null) {
        const startTime = Date.now();
        const optimizationId = `optimize-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Use current state if no workflow provided
        if (!workflow) {
            workflow = this._getCurrentWorkflowState();
        }
        
        // Define energy function for annealing
        const energyFn = (state) => this._calculateWorkflowEnergy(state);
        
        // Apply quantum annealing
        const annealingResult = await this.annealing.optimize(workflow, energyFn);
        
        // Calculate optimization coherence
        const optimizationCoherence = this._calculateOptimizationCoherence(
            workflow,
            annealingResult
        );
        
        // Update coherence
        this._updateCoherence(optimizationCoherence);
        
        // Build result
        const result = {
            optimizationId,
            originalWorkflow: workflow,
            optimizedWorkflow: annealingResult.solution,
            energy: annealingResult.energy,
            coherenceImprovement: optimizationCoherence - this.coherenceScore,
            coherenceScore: this.coherenceScore,
            quantumMetadata: {
                initialTemperature: this.annealing.temperature,
                finalTemperature: COHERENCE_CONSTANTS.MIN_TEMPERATURE,
                coolingRate: this.annealing.coolingRate,
                quantumFisherInformation: this._calculateQFI([annealingResult]),
                processingTime: Date.now() - startTime
            },
            timestamp: new Date().toISOString()
        };
        
        // Log decision
        this._logDecision('optimizeWorkflow', result);
        
        // Save state
        this._saveState();
        
        return result;
    }
    
    /**
     * 🎯 Calculate Quantum Fisher Information (QFI)
     * 
     * Measures the information content of quantum states
     * for consensus stability.
     * 
     * @param {Array} states - Quantum states to analyze
     * @returns {number} QFI value
     */
    _calculateQFI(states) {
        if (!states || states.length < 2) return 0;
        
        // Calculate Fisher Information based on probability distribution
        const probabilities = states.map(s => s.probability || Math.pow(s.amplitude || 0, 2));
        const sumProb = probabilities.reduce((a, b) => a + b, 0);
        
        if (sumProb === 0) return 0;
        
        // Normalize probabilities
        const normalizedProbs = probabilities.map(p => p / sumProb);
        
        // Calculate QFI (simplified version)
        let qfi = 0;
        for (let i = 0; i < normalizedProbs.length; i++) {
            if (normalizedProbs[i] > 0.01) {
                qfi += normalizedProbs[i] * Math.pow(Math.log2(normalizedProbs[i]), 2);
            }
        }
        
        return qfi * COHERENCE_CONSTANTS.QFI_SCALING_FACTOR;
    }
    
    /**
     * 🔄 Update coherence score with new measurement
     * @private
     */
    _updateCoherence(newCoherence) {
        // Exponential moving average for smooth coherence tracking
        const alpha = 0.3;
        this.coherenceScore = alpha * newCoherence + (1 - alpha) * this.coherenceScore;
        
        // Clamp to valid range
        this.coherenceScore = Math.max(
            COHERENCE_CONSTANTS.MIN_COHERENCE,
            Math.min(COHERENCE_CONSTANTS.MAX_COHERENCE, this.coherenceScore)
        );
        
        // Record in history
        this.orchestratorState.coherenceHistory.push({
            score: this.coherenceScore,
            timestamp: new Date().toISOString()
        });
        
        // Trim history if too long
        if (this.orchestratorState.coherenceHistory.length > 1000) {
            this.orchestratorState.coherenceHistory = 
                this.orchestratorState.coherenceHistory.slice(-500);
        }
    }
    
    /**
     * 📝 Log a decision to the decision log
     * @private
     */
    _logDecision(decisionType, result) {
        this.orchestratorState.decisionLog.push({
            type: decisionType,
            result,
            coherenceScore: this.coherenceScore,
            timestamp: new Date().toISOString()
        });
        
        // Trim log if too long
        if (this.orchestratorState.decisionLog.length > 500) {
            this.orchestratorState.decisionLog = 
                this.orchestratorState.decisionLog.slice(-250);
        }
    }
    
    /**
     * 🔧 Generate default decomposition strategies
     * @private
     */
    _generateDefaultStrategies(task) {
        return [
            { name: 'sequential', type: 'linear', complexity: 0.5 },
            { name: 'parallel', type: 'concurrent', complexity: 0.7 },
            { name: 'hierarchical', type: 'tree', complexity: 0.6 },
            { name: 'recursive', type: 'fractal', complexity: 0.8 },
            { name: 'adaptive', type: 'dynamic', complexity: 0.9 }
        ];
    }
    
    /**
     * 📊 Evaluate a decomposition strategy
     * @private
     */
    _evaluateStrategy(strategy, task) {
        // Simple evaluation based on strategy properties
        let score = 0.5;
        
        if (strategy.type === 'concurrent') score += 0.2;
        if (strategy.type === 'dynamic') score += 0.15;
        if (strategy.complexity > 0.7) score += 0.1;
        
        // Add some randomness for quantum uncertainty
        score += (Math.random() - 0.5) * 0.1;
        
        return Math.max(0, Math.min(1, score));
    }
    
    /**
     * 🧮 Calculate decomposition coherence
     * @private
     */
    _calculateDecompositionCoherence(measurement, annealingResult) {
        const amplitudeCoherence = measurement.probability;
        const annealingCoherence = 1 - Math.min(1, annealingResult.energy);
        
        return (amplitudeCoherence + annealingCoherence) / 2;
    }
    
    /**
     * 🐝 Calculate swarm alignment
     * @private
     */
    _calculateSwarmAlignment(swarmResult, measurement, annealingResult) {
        const alignment = swarmResult.swarmAlignment || 0;
        const consensus = measurement.probability || 0;
        const optimization = annealingResult.energy || 0;
        
        return (alignment * 0.4 + consensus * 0.3 + (1 - optimization) * 0.3);
    }
    
    /**
     * 📈 Calculate quantum coherence component
     * @private
     */
    _calculateQuantumCoherence() {
        // Based on superposition and entanglement quality
        const superpositionQuality = this.superposition.stateVector.length > 0 ? 
            this.superposition.stateVector.reduce(
                (sum, s) => sum + Math.pow(s.amplitude, 2), 0
            ) / (this.superposition.stateVector.length || 1) : 0;
        
        return Math.min(1, superpositionQuality * 2);
    }
    
    /**
     * 🐝 Calculate swarm coherence component
     * @private
     */
    _calculateSwarmCoherence() {
        // Based on agent alignment and consensus
        const recentDecisions = this.orchestratorState.decisionLog.slice(-10);
        
        if (recentDecisions.length === 0) return 1;
        
        const alignmentScores = recentDecisions.map(d => 
            d.result?.swarmAlignment || 0.5
        );
        
        const avgAlignment = alignmentScores.reduce((a, b) => a + b, 0) / alignmentScores.length;
        
        return avgAlignment;
    }
    
    /**
     * ⏱️ Calculate temporal coherence component
     * @private
     */
    _calculateTemporalCoherence(history) {
        if (history.length < 2) return 1;
        
        // Calculate variance in recent history
        const scores = history.map(h => h.score);
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
        
        // Lower variance = higher temporal coherence
        return Math.max(0, 1 - Math.sqrt(variance));
    }
    
    /**
     * 🌐 Calculate holographic consensus component
     * @private
     */
    _calculateHolographicConsensus() {
        // Calculate consensus across all decision types
        const recentDecisions = this.orchestratorState.decisionLog.slice(-50);
        
        if (recentDecisions.length === 0) return 1;
        
        const decisionTypes = {};
        recentDecisions.forEach(d => {
            if (!decisionTypes[d.type]) {
                decisionTypes[d.type] = [];
            }
            decisionTypes[d.type].push(d.coherenceScore || 0.5);
        });
        
        // Calculate consensus within each type
        const typeConsensus = Object.values(decisionTypes).map(scores => {
            const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
            const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
            return 1 - Math.sqrt(variance);
        });
        
        // Average consensus across types
        return typeConsensus.reduce((a, b) => a + b, 0) / (typeConsensus.length || 1);
    }
    
    /**
     * 📊 Calculate global QFI across all states
     * @private
     */
    _calculateGlobalQFI() {
        const allStates = [];
        
        // Collect states from recent decisions
        for (const decision of this.orchestratorState.decisionLog.slice(-20)) {
            if (decision.result?.quantumMetadata?.amplitudeDistribution) {
                allStates.push(...decision.result.quantumMetadata.amplitudeDistribution);
            }
        }
        
        return this._calculateQFI(allStates);
    }
    
    /**
     * 📈 Calculate stability index from history
     * @private
     */
    _calculateStabilityIndex(history) {
        if (history.length < 2) return 1;
        
        // Calculate trend and volatility
        const scores = history.map(h => h.score);
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        
        // Calculate coefficient of variation
        const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
        const cv = Math.sqrt(variance) / (mean || 1);
        
        return Math.max(0, 1 - cv);
    }
    
    /**
     * 🔧 Get current workflow state
     * @private
     */
    _getCurrentWorkflowState() {
        return {
            coherenceScore: this.coherenceScore,
            taskCount: this.orchestratorState.tasks.length,
            modeStates: this.orchestratorState.modeStates,
            recentDecisions: this.orchestratorState.decisionLog.slice(-10)
        };
    }
    
    /**
     * ⚡ Calculate workflow energy for annealing
     * @private
     */
    _calculateWorkflowEnergy(state) {
        // Energy is inverse of coherence
        const coherence = this._calculateWorkflowCoherence(state);
        return 1 - coherence;
    }
    
    /**
     * 📊 Calculate coherence of a workflow state
     * @private
     */
    _calculateWorkflowCoherence(state) {
        let coherence = 0.5;
        
        if (state.coherenceScore) {
            coherence = state.coherenceScore;
        }
        
        if (state.recentDecisions) {
            const avgDecisionCoherence = state.recentDecisions.reduce(
                (sum, d) => sum + (d.coherenceScore || 0.5), 0
            ) / (state.recentDecisions.length || 1);
            
            coherence = (coherence + avgDecisionCoherence) / 2;
        }
        
        return coherence;
    }
    
    /**
     * 🎯 Calculate optimization coherence improvement
     * @private
     */
    _calculateOptimizationCoherence(original, annealingResult) {
        const originalCoherence = this._calculateWorkflowCoherence(original);
        const optimizedCoherence = this._calculateWorkflowCoherence(annealingResult.solution);
        
        return (originalCoherence + optimizedCoherence) / 2;
    }
    
    /**
     * 💾 Reset coherence state
     */
    reset() {
        this.coherenceScore = COHERENCE_CONSTANTS.MAX_COHERENCE;
        this.orchestratorState = {
            tasks: [],
            modeStates: {},
            coherenceHistory: [],
            decisionLog: [],
            quantumMetadata: {}
        };
        
        // Clear persistent state
        try {
            if (fs.existsSync(this.stateFile)) {
                const data = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
                data.coherenceScore = this.coherenceScore;
                data.orchestratorState = this.orchestratorState;
                fs.writeFileSync(this.stateFile, JSON.stringify(data, null, 2));
            }
        } catch (error) {
            console.error('[CoherenceManager] Failed to reset state:', error.message);
        }
        
        return { success: true, coherenceScore: this.coherenceScore };
    }
    
    /**
     * 📋 Get orchestrator status summary
     */
    getStatus() {
        return {
            coherenceScore: this.coherenceScore,
            swarmAgents: this.swarm.agents.length,
            tasksProcessed: this.orchestratorState.tasks.length,
            decisionsLogged: this.orchestratorState.decisionLog.length,
            stateFile: this.stateFile,
            modes: ORCHESTRATOR_MODES,
            quantumMetadata: {
                superpositionSize: this.superposition.stateVector.length,
                temperature: this.annealing.temperature,
                qfi: this._calculateGlobalQFI()
            }
        };
    }
}

/**
 * Create and export default CoherenceManager instance
 */
const coherenceManager = new CoherenceManager();

export default {
    CoherenceManager,
    coherenceManager,
    ORCHESTRATOR_MODES,
    COHERENCE_CONSTANTS
};

 * 
 * Quantum-Swarm Coherence System for Orchestrator Workflows
 * 
 * Features:
 * - Coherence score tracking (0-1) for all orchestrator operations
 * - Quantum superposition for exploring multiple task decompositions
 * - Swarm alignment for mode coordination
 * - Quantum Fisher Information (QFI) for consensus stability
 * - State persistence in swarm_memory.json
 * 
 * Integration Points:
 * - QuantumEnginePortable.js (QuantumSwarm, superposition, annealing)
 * - MULTI_SWARM_ARCHITECTURE.md (swarm definitions)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import QuantumSwarm from QuantumEnginePortable
let QuantumSwarm, SuperpositionProcessor, QuantumAnnealingOptimizer;

try {
    const QuantumEngine = await import('./QuantumEnginePortable.js');
    QuantumSwarm = QuantumEngine.QuantumSwarm;
    SuperpositionProcessor = QuantumEngine.SuperpositionProcessor;
    QuantumAnnealingOptimizer = QuantumEngine.QuantumAnnealingOptimizer;
} catch (error) {
    // Fallback implementations if import fails
    console.warn('[CoherenceManager] Using fallback implementations');
    
    // Fallback QuantumSwarm
    QuantumSwarm = class FallbackQuantumSwarm {
        constructor() {
            this.agents = [];
        }
        
        addAgent(name, role) {
            this.agents.push({ name, role });
        }
        
        async processTask(taskInput) {
            const agentStates = this.agents.map(agent => ({
                agent,
                proposal: `${agent.role} analysis of ${taskInput}`,
                confidence: Math.random()
            }));
            
            const consensus = agentStates.reduce((acc, curr) => 
                acc + (curr.confidence > 0.5 ? 1 : 0), 0);
            
            const alignment = consensus / this.agents.length;
            
            return {
                taskId: `Q-${Date.now()}`,
                agentsFunctioning: this.agents.length,
                swarmAlignment: alignment,
                decisions: agentStates.filter(s => s.confidence > 0.5)
            };
        }
    };
    
    // Fallback SuperpositionProcessor
    SuperpositionProcessor = class FallbackSuperpositionProcessor {
        constructor() {
            this.stateVector = [];
        }
        
        createSuperposition(possibleSolutions) {
            this.stateVector = possibleSolutions.map((solution, index) => ({
                solution,
                amplitude: 1 / Math.sqrt(possibleSolutions.length),
                phase: 0,
                index
            }));
            return this.stateVector;
        }
        
        amplifyGoodSolutions(evaluationFunction) {
            this.stateVector.forEach(state => {
                const quality = evaluationFunction(state.solution);
                state.amplitude *= (1 + quality);
                const totalAmplitude = this.stateVector.reduce((sum, s) => sum + s.amplitude ** 2, 0);
                state.amplitude /= Math.sqrt(totalAmplitude || 1);
            });
            return this.stateVector;
        }
        
        measure() {
            const probabilities = this.stateVector.map(state => ({
                solution: state.solution,
                probability: state.amplitude ** 2
            }));
            probabilities.sort((a, b) => b.probability - a.probability);
            return {
                bestSolution: probabilities[0]?.solution,
                probability: probabilities[0]?.probability || 0,
                allSolutions: probabilities
            };
        }
    };
    
    // Fallback QuantumAnnealingOptimizer
    QuantumAnnealingOptimizer = class FallbackQuantumAnnealingOptimizer {
        constructor(options = {}) {
            this.temperature = options.initialTemperature || 5000;
            this.coolingRate = options.coolingRate || 0.99;
            this.minTemperature = options.minTemperature || 0.01;
        }
        
        async optimize(initialSolution, energyFn) {
            let currentSolution = initialSolution;
            let currentEnergy = energyFn(currentSolution);
            let bestSolution = currentSolution;
            let bestEnergy = currentEnergy;
            let temp = this.temperature;
            
            for (let i = 0; i < 100; i++) {
                if (temp <= this.minTemperature) break;
                
                const neighbor = this.generateNeighbor(currentSolution);
                const neighborEnergy = energyFn(neighbor);
                const deltaE = neighborEnergy - currentEnergy;
                
                if (deltaE < 0 || Math.random() < Math.exp(-deltaE / temp)) {
                    currentSolution = neighbor;
                    currentEnergy = neighborEnergy;
                    
                    if (currentEnergy < bestEnergy) {
                        bestSolution = currentSolution;
                        bestEnergy = currentEnergy;
                    }
                }
                
                temp *= this.coolingRate;
            }
            
            return { solution: bestSolution, energy: bestEnergy };
        }
        
        generateNeighbor(solution) {
            if (typeof solution === 'string') {
                return Math.random() > 0.5 ? solution + "_opt" : solution;
            }
            
            const neighbor = { ...solution };
            const keys = Object.keys(neighbor);
            if (keys.length === 0) return neighbor;
            
            const randomKey = keys[Math.floor(Math.random() * keys.length)];
            
            if (typeof neighbor[randomKey] === 'number') {
                neighbor[randomKey] += (Math.random() - 0.5) * 2;
            } else if (typeof neighbor[randomKey] === 'string') {
                neighbor[randomKey] += "_mut";
            }
            return neighbor;
        }
    };
}

/**
 * Constants for coherence calculations
 */
const COHERENCE_CONSTANTS = {
    MIN_COHERENCE: 0,
    MAX_COHERENCE: 1,
    QFI_SCALING_FACTOR: 0.1,
    SUPERPOSITION_DECAY: 0.95,
    SWARM_ALIGNMENT_THRESHOLD: 0.7,
    ANNEALING_ITERATIONS: 100,
    INITIAL_TEMPERATURE: 5000,
    COOLING_RATE: 0.99,
    MIN_TEMPERATURE: 0.01
};

/**
 * Orchestrator Mode Definitions
 * Based on MULTI_SWARM_ARCHITECTURE.md
 */
export const ORCHESTRATOR_MODES = {
    MAIN: 'main',
    FINANCE: 'finance',
    CRYPTO: 'crypto',
    GOD: 'god',
    CODE: 'code',
    ARCHITECT: 'architect',
    DEBUG: 'debug',
    ASK: 'ask',
    REVIEW: 'review'
};

/**
 * 🎯 CoherenceManager Class
 * 
 * Manages quantum-swarm coherence for orchestrator workflows.
 * Tracks coherence scores, coordinates mode selection via swarm patterns,
 * and optimizes workflow execution.
 */
export class CoherenceManager {
    constructor(options = {}) {
        // Core coherence state
        this.coherenceScore = options.initialCoherence || COHERENCE_CONSTANTS.MAX_COHERENCE;
        this.swarm = new QuantumSwarm();
        this.superposition = new SuperpositionProcessor();
        this.annealing = new QuantumAnnealingOptimizer({
            initialTemperature: options.initialTemperature || COHERENCE_CONSTANTS.INITIAL_TEMPERATURE,
            coolingRate: options.coolingRate || COHERENCE_CONSTANTS.COOLING_RATE,
            minTemperature: options.minTemperature || COHERENCE_CONSTANTS.MIN_TEMPERATURE
        });
        
        // State management
        this.stateFile = options.stateFile || path.join(__dirname, 'swarm_memory.json');
        this.orchestratorState = {
            tasks: [],
            modeStates: {},
            coherenceHistory: [],
            decisionLog: [],
            quantumMetadata: {}
        };
        
        // Initialize swarm agents for orchestrator
        this._initializeOrchestratorSwarm();
        
        // Load existing state
        this._loadState();
    }
    
    /**
     * Initialize the orchestrator swarm with default agents
     * @private
     */
    _initializeOrchestratorSwarm() {
        const defaultAgents = [
            { name: 'Sentinel', role: 'security' },
            { name: 'BugHunter', role: 'debugging' },
            { name: 'Optimizer', role: 'optimization' },
            { name: 'ProductOwner', role: 'product' },
            { name: 'GodMode', role: 'coordination' },
            { name: 'Antigravity', role: 'innovation' }
        ];
        
        for (const agent of defaultAgents) {
            this.swarm.addAgent(agent.name, agent.role);
        }
    }
    
    /**
     * Load orchestrator state from persistent storage
     * @private
     */
    _loadState() {
        try {
            if (fs.existsSync(this.stateFile)) {
                const data = fs.readFileSync(this.stateFile, 'utf8');
                const parsed = JSON.parse(data);
                
                // Merge loaded state
                this.orchestratorState = {
                    ...this.orchestratorState,
                    ...parsed.orchestrator || {}
                };
                
                // Restore coherence score
                if (parsed.coherenceScore !== undefined) {
                    this.coherenceScore = parsed.coherenceScore;
                }
                
                console.log('[CoherenceManager] State loaded from', this.stateFile);
            }
        } catch (error) {
            console.warn('[CoherenceManager] Failed to load state:', error.message);
        }
    }
    
    /**
     * Save orchestrator state to persistent storage
     * @private
     */
    _saveState() {
        try {
            const stateToSave = {
                coherenceScore: this.coherenceScore,
                orchestratorState: this.orchestratorState,
                lastModified: new Date().toISOString()
            };
            
            // Read existing file if exists
            let existingData = {};
            if (fs.existsSync(this.stateFile)) {
                try {
                    existingData = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
                } catch (e) {
                    // File exists but invalid JSON
                }
            }
            
            // Merge and write
            fs.writeFileSync(
                this.stateFile,
                JSON.stringify({ ...existingData, ...stateToSave }, null, 2)
            );
            
            console.log('[CoherenceManager] State saved to', this.stateFile);
        } catch (error) {
            console.error('[CoherenceManager] Failed to save state:', error.message);
        }
    }
    
    /**
     * 🧬 Decompose a task using quantum superposition
     * 
     * Explores multiple possible task decompositions simultaneously
     * and uses amplitude amplification to find optimal decomposition.
     * 
     * @param {Object} task - The task to decompose
     * @param {Array} possibleStrategies - Possible decomposition strategies
     * @returns {Promise<Object>} Decomposition result with coherence metadata
     */
    async decomposeTask(task, possibleStrategies = null) {
        const startTime = Date.now();
        const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Generate default strategies if not provided
        if (!possibleStrategies) {
            possibleStrategies = this._generateDefaultStrategies(task);
        }
        
        // Create superposition of decompositions
        this.superposition.createSuperposition(possibleStrategies);
        
        // Evaluate and amplify good decompositions
        const evaluationFn = (strategy) => this._evaluateStrategy(strategy, task);
        this.superposition.amplifyGoodSolutions(evaluationFn);
        
        // Measure to get best decomposition
        const measurement = this.superposition.measure();
        
        // Perform quantum annealing for refinement
        const annealingResult = await this.annealing.optimize(
            measurement.bestSolution,
            (sol) => -evaluationFn(sol)
        );
        
        // Calculate coherence impact
        const decompositionCoherence = this._calculateDecompositionCoherence(
            measurement,
            annealingResult
        );
        
        // Update overall coherence
        this._updateCoherence(decompositionCoherence);
        
        // Build result
        const result = {
            taskId,
            originalTask: task,
            decomposition: annealingResult.solution,
            confidence: measurement.probability,
            coherenceScore: this.coherenceScore,
            quantumMetadata: {
                superpositionStates: possibleStrategies.length,
                amplitudeDistribution: measurement.allSolutions.map(s => ({
                    strategy: s.solution.name,
                    probability: s.probability
                })),
                annealingEnergy: annealingResult.energy,
                processingTime: Date.now() - startTime,
                quantumFisherInformation: this._calculateQFI(measurement.allSolutions)
            },
            timestamp: new Date().toISOString()
        };
        
        // Log decision
        this._logDecision('decomposeTask', result);
        
        return result;
    }
    
    /**
     * 🐝 Delegate task to modes using swarm pattern
     * 
     * Uses swarm intelligence to coordinate mode selection
     * and achieve optimal delegation.
     * 
     * @param {Object} task - The task to delegate
     * @param {Array} modes - Available modes for delegation
     * @returns {Promise<Object>} Delegation result with swarm alignment
     */
    async delegateToModes(task, modes = null) {
        const startTime = Date.now();
        const delegationId = `delegation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Use default modes if not provided
        if (!modes) {
            modes = Object.values(ORCHESTRATOR_MODES);
        }
        
        // Process task through swarm
        const swarmResult = await this.swarm.processTask(
            JSON.stringify({ task, modes })
        );
        
        // Create superposition of mode assignments
        const modeAssignments = modes.map((mode, index) => ({
            mode,
            assignment: {
                primaryMode: mode,
                confidence: 1 / modes.length + (Math.random() * 0.2),
                subtasks: Math.floor(Math.random() * 5) + 1
            },
            index
        }));
        
        this.superposition.createSuperposition(modeAssignments);
        
        // Amplify based on swarm alignment
        const evaluationFn = (assignment) => 
            assignment.confidence * swarmResult.swarmAlignment;
        
        this.superposition.amplifyGoodSolutions(evaluationFn);
        const measurement = this.superposition.measure();
        
        // Anneal for final assignment
        const annealingResult = await this.annealing.optimize(
            measurement.bestSolution,
            (sol) => -evaluationFn(sol)
        );
        
        // Calculate swarm alignment
        const swarmAlignment = this._calculateSwarmAlignment(
            swarmResult,
            measurement,
            annealingResult
        );
        
        // Update coherence
        this._updateCoherence(swarmAlignment);
        
        // Build result
        const result = {
            delegationId,
            task,
            assignedMode: annealingResult.solution.mode,
            assignment: annealingResult.solution.assignment,
            swarmAlignment: swarmResult.swarmAlignment,
            consensusScore: swarmAlignment,
            coherenceScore: this.coherenceScore,
            quantumMetadata: {
                candidateModes: modes.length,
                swarmAgents: this.swarm.agents.length,
                consensusLevel: swarmResult.swarmAlignment,
                amplitudeProbabilities: measurement.allSolutions.map(m => ({
                    mode: m.solution.mode,
                    probability: m.probability
                })),
                quantumFisherInformation: this._calculateQFI(measurement.allSolutions),
                processingTime: Date.now() - startTime
            },
            timestamp: new Date().toISOString()
        };
        
        // Log decision
        this._logDecision('delegateToModes', result);
        
        return result;
    }
    
    /**
     * 📊 Measure current coherence
     * 
     * Returns the current coherence metric with detailed breakdown.
     * 
     * @returns {Object} Coherence measurement result
     */
    measureCoherence() {
        const recentHistory = this.orchestratorState.coherenceHistory.slice(-100);
        
        // Calculate various coherence components
        const componentScores = {
            quantumCoherence: this._calculateQuantumCoherence(),
            swarmCoherence: this._calculateSwarmCoherence(),
            temporalCoherence: this._calculateTemporalCoherence(recentHistory),
            holographicConsensus: this._calculateHolographicConsensus()
        };
        
        // Calculate overall coherence (weighted average)
        const weights = {
            quantumCoherence: 0.3,
            swarmCoherence: 0.3,
            temporalCoherence: 0.2,
            holographicConsensus: 0.2
        };
        
        const overallCoherence = Object.entries(componentScores).reduce(
            (sum, [key, score]) => sum + score * weights[key],
            0
        );
        
        // Update internal coherence score
        this.coherenceScore = overallCoherence;
        
        return {
            coherenceScore: overallCoherence,
            components: componentScores,
            quantumFisherInformation: this._calculateGlobalQFI(),
            stabilityIndex: this._calculateStabilityIndex(recentHistory),
            historyLength: this.orchestratorState.coherenceHistory.length,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * ⚡ Optimize workflow using quantum annealing
     * 
     * Applies quantum annealing to optimize workflow execution
     * for maximum coherence.
     * 
     * @param {Object} workflow - The workflow to optimize
     * @returns {Promise<Object>} Optimized workflow result
     */
    async optimizeWorkflow(workflow = null) {
        const startTime = Date.now();
        const optimizationId = `optimize-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Use current state if no workflow provided
        if (!workflow) {
            workflow = this._getCurrentWorkflowState();
        }
        
        // Define energy function for annealing
        const energyFn = (state) => this._calculateWorkflowEnergy(state);
        
        // Apply quantum annealing
        const annealingResult = await this.annealing.optimize(workflow, energyFn);
        
        // Calculate optimization coherence
        const optimizationCoherence = this._calculateOptimizationCoherence(
            workflow,
            annealingResult
        );
        
        // Update coherence
        this._updateCoherence(optimizationCoherence);
        
        // Build result
        const result = {
            optimizationId,
            originalWorkflow: workflow,
            optimizedWorkflow: annealingResult.solution,
            energy: annealingResult.energy,
            coherenceImprovement: optimizationCoherence - this.coherenceScore,
            coherenceScore: this.coherenceScore,
            quantumMetadata: {
                initialTemperature: this.annealing.temperature,
                finalTemperature: COHERENCE_CONSTANTS.MIN_TEMPERATURE,
                coolingRate: this.annealing.coolingRate,
                quantumFisherInformation: this._calculateQFI([annealingResult]),
                processingTime: Date.now() - startTime
            },
            timestamp: new Date().toISOString()
        };
        
        // Log decision
        this._logDecision('optimizeWorkflow', result);
        
        // Save state
        this._saveState();
        
        return result;
    }
    
    /**
     * 🎯 Calculate Quantum Fisher Information (QFI)
     * 
     * Measures the information content of quantum states
     * for consensus stability.
     * 
     * @param {Array} states - Quantum states to analyze
     * @returns {number} QFI value
     */
    _calculateQFI(states) {
        if (!states || states.length < 2) return 0;
        
        // Calculate Fisher Information based on probability distribution
        const probabilities = states.map(s => s.probability || Math.pow(s.amplitude || 0, 2));
        const sumProb = probabilities.reduce((a, b) => a + b, 0);
        
        if (sumProb === 0) return 0;
        
        // Normalize probabilities
        const normalizedProbs = probabilities.map(p => p / sumProb);
        
        // Calculate QFI (simplified version)
        let qfi = 0;
        for (let i = 0; i < normalizedProbs.length; i++) {
            if (normalizedProbs[i] > 0.01) {
                qfi += normalizedProbs[i] * Math.pow(Math.log2(normalizedProbs[i]), 2);
            }
        }
        
        return qfi * COHERENCE_CONSTANTS.QFI_SCALING_FACTOR;
    }
    
    /**
     * 🔄 Update coherence score with new measurement
     * @private
     */
    _updateCoherence(newCoherence) {
        // Exponential moving average for smooth coherence tracking
        const alpha = 0.3;
        this.coherenceScore = alpha * newCoherence + (1 - alpha) * this.coherenceScore;
        
        // Clamp to valid range
        this.coherenceScore = Math.max(
            COHERENCE_CONSTANTS.MIN_COHERENCE,
            Math.min(COHERENCE_CONSTANTS.MAX_COHERENCE, this.coherenceScore)
        );
        
        // Record in history
        this.orchestratorState.coherenceHistory.push({
            score: this.coherenceScore,
            timestamp: new Date().toISOString()
        });
        
        // Trim history if too long
        if (this.orchestratorState.coherenceHistory.length > 1000) {
            this.orchestratorState.coherenceHistory = 
                this.orchestratorState.coherenceHistory.slice(-500);
        }
    }
    
    /**
     * 📝 Log a decision to the decision log
     * @private
     */
    _logDecision(decisionType, result) {
        this.orchestratorState.decisionLog.push({
            type: decisionType,
            result,
            coherenceScore: this.coherenceScore,
            timestamp: new Date().toISOString()
        });
        
        // Trim log if too long
        if (this.orchestratorState.decisionLog.length > 500) {
            this.orchestratorState.decisionLog = 
                this.orchestratorState.decisionLog.slice(-250);
        }
    }
    
    /**
     * 🔧 Generate default decomposition strategies
     * @private
     */
    _generateDefaultStrategies(task) {
        return [
            { name: 'sequential', type: 'linear', complexity: 0.5 },
            { name: 'parallel', type: 'concurrent', complexity: 0.7 },
            { name: 'hierarchical', type: 'tree', complexity: 0.6 },
            { name: 'recursive', type: 'fractal', complexity: 0.8 },
            { name: 'adaptive', type: 'dynamic', complexity: 0.9 }
        ];
    }
    
    /**
     * 📊 Evaluate a decomposition strategy
     * @private
     */
    _evaluateStrategy(strategy, task) {
        // Simple evaluation based on strategy properties
        let score = 0.5;
        
        if (strategy.type === 'concurrent') score += 0.2;
        if (strategy.type === 'dynamic') score += 0.15;
        if (strategy.complexity > 0.7) score += 0.1;
        
        // Add some randomness for quantum uncertainty
        score += (Math.random() - 0.5) * 0.1;
        
        return Math.max(0, Math.min(1, score));
    }
    
    /**
     * 🧮 Calculate decomposition coherence
     * @private
     */
    _calculateDecompositionCoherence(measurement, annealingResult) {
        const amplitudeCoherence = measurement.probability;
        const annealingCoherence = 1 - Math.min(1, annealingResult.energy);
        
        return (amplitudeCoherence + annealingCoherence) / 2;
    }
    
    /**
     * 🐝 Calculate swarm alignment
     * @private
     */
    _calculateSwarmAlignment(swarmResult, measurement, annealingResult) {
        const alignment = swarmResult.swarmAlignment || 0;
        const consensus = measurement.probability || 0;
        const optimization = annealingResult.energy || 0;
        
        return (alignment * 0.4 + consensus * 0.3 + (1 - optimization) * 0.3);
    }
    
    /**
     * 📈 Calculate quantum coherence component
     * @private
     */
    _calculateQuantumCoherence() {
        // Based on superposition and entanglement quality
        const superpositionQuality = this.superposition.stateVector.length > 0 ? 
            this.superposition.stateVector.reduce(
                (sum, s) => sum + Math.pow(s.amplitude, 2), 0
            ) / (this.superposition.stateVector.length || 1) : 0;
        
        return Math.min(1, superpositionQuality * 2);
    }
    
    /**
     * 🐝 Calculate swarm coherence component
     * @private
     */
    _calculateSwarmCoherence() {
        // Based on agent alignment and consensus
        const recentDecisions = this.orchestratorState.decisionLog.slice(-10);
        
        if (recentDecisions.length === 0) return 1;
        
        const alignmentScores = recentDecisions.map(d => 
            d.result?.swarmAlignment || 0.5
        );
        
        const avgAlignment = alignmentScores.reduce((a, b) => a + b, 0) / alignmentScores.length;
        
        return avgAlignment;
    }
    
    /**
     * ⏱️ Calculate temporal coherence component
     * @private
     */
    _calculateTemporalCoherence(history) {
        if (history.length < 2) return 1;
        
        // Calculate variance in recent history
        const scores = history.map(h => h.score);
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
        
        // Lower variance = higher temporal coherence
        return Math.max(0, 1 - Math.sqrt(variance));
    }
    
    /**
     * 🌐 Calculate holographic consensus component
     * @private
     */
    _calculateHolographicConsensus() {
        // Calculate consensus across all decision types
        const recentDecisions = this.orchestratorState.decisionLog.slice(-50);
        
        if (recentDecisions.length === 0) return 1;
        
        const decisionTypes = {};
        recentDecisions.forEach(d => {
            if (!decisionTypes[d.type]) {
                decisionTypes[d.type] = [];
            }
            decisionTypes[d.type].push(d.coherenceScore || 0.5);
        });
        
        // Calculate consensus within each type
        const typeConsensus = Object.values(decisionTypes).map(scores => {
            const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
            const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
            return 1 - Math.sqrt(variance);
        });
        
        // Average consensus across types
        return typeConsensus.reduce((a, b) => a + b, 0) / (typeConsensus.length || 1);
    }
    
    /**
     * 📊 Calculate global QFI across all states
     * @private
     */
    _calculateGlobalQFI() {
        const allStates = [];
        
        // Collect states from recent decisions
        for (const decision of this.orchestratorState.decisionLog.slice(-20)) {
            if (decision.result?.quantumMetadata?.amplitudeDistribution) {
                allStates.push(...decision.result.quantumMetadata.amplitudeDistribution);
            }
        }
        
        return this._calculateQFI(allStates);
    }
    
    /**
     * 📈 Calculate stability index from history
     * @private
     */
    _calculateStabilityIndex(history) {
        if (history.length < 2) return 1;
        
        // Calculate trend and volatility
        const scores = history.map(h => h.score);
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        
        // Calculate coefficient of variation
        const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
        const cv = Math.sqrt(variance) / (mean || 1);
        
        return Math.max(0, 1 - cv);
    }
    
    /**
     * 🔧 Get current workflow state
     * @private
     */
    _getCurrentWorkflowState() {
        return {
            coherenceScore: this.coherenceScore,
            taskCount: this.orchestratorState.tasks.length,
            modeStates: this.orchestratorState.modeStates,
            recentDecisions: this.orchestratorState.decisionLog.slice(-10)
        };
    }
    
    /**
     * ⚡ Calculate workflow energy for annealing
     * @private
     */
    _calculateWorkflowEnergy(state) {
        // Energy is inverse of coherence
        const coherence = this._calculateWorkflowCoherence(state);
        return 1 - coherence;
    }
    
    /**
     * 📊 Calculate coherence of a workflow state
     * @private
     */
    _calculateWorkflowCoherence(state) {
        let coherence = 0.5;
        
        if (state.coherenceScore) {
            coherence = state.coherenceScore;
        }
        
        if (state.recentDecisions) {
            const avgDecisionCoherence = state.recentDecisions.reduce(
                (sum, d) => sum + (d.coherenceScore || 0.5), 0
            ) / (state.recentDecisions.length || 1);
            
            coherence = (coherence + avgDecisionCoherence) / 2;
        }
        
        return coherence;
    }
    
    /**
     * 🎯 Calculate optimization coherence improvement
     * @private
     */
    _calculateOptimizationCoherence(original, annealingResult) {
        const originalCoherence = this._calculateWorkflowCoherence(original);
        const optimizedCoherence = this._calculateWorkflowCoherence(annealingResult.solution);
        
        return (originalCoherence + optimizedCoherence) / 2;
    }
    
    /**
     * 💾 Reset coherence state
     */
    reset() {
        this.coherenceScore = COHERENCE_CONSTANTS.MAX_COHERENCE;
        this.orchestratorState = {
            tasks: [],
            modeStates: {},
            coherenceHistory: [],
            decisionLog: [],
            quantumMetadata: {}
        };
        
        // Clear persistent state
        try {
            if (fs.existsSync(this.stateFile)) {
                const data = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
                data.coherenceScore = this.coherenceScore;
                data.orchestratorState = this.orchestratorState;
                fs.writeFileSync(this.stateFile, JSON.stringify(data, null, 2));
            }
        } catch (error) {
            console.error('[CoherenceManager] Failed to reset state:', error.message);
        }
        
        return { success: true, coherenceScore: this.coherenceScore };
    }
    
    /**
     * 📋 Get orchestrator status summary
     */
    getStatus() {
        return {
            coherenceScore: this.coherenceScore,
            swarmAgents: this.swarm.agents.length,
            tasksProcessed: this.orchestratorState.tasks.length,
            decisionsLogged: this.orchestratorState.decisionLog.length,
            stateFile: this.stateFile,
            modes: ORCHESTRATOR_MODES,
            quantumMetadata: {
                superpositionSize: this.superposition.stateVector.length,
                temperature: this.annealing.temperature,
                qfi: this._calculateGlobalQFI()
            }
        };
    }
}

/**
 * Create and export default CoherenceManager instance
 */
const coherenceManager = new CoherenceManager();

export default {
    CoherenceManager,
    coherenceManager,
    ORCHESTRATOR_MODES,
    COHERENCE_CONSTANTS
};

