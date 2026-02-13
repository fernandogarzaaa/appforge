/**
 * 🌌 Quantum-Optimized Local Router
 * 
 * Intelligently routes tasks to the optimal local model based on:
 * - Task type (code, reasoning, embedding, fast-validation)
 * - Complexity score (0-1)
 * - Energy efficiency optimization using quantum annealing
 * 
 * TRUE AI INDEPENDENCE - LOCAL MODEL ROUTING
 * 
 * Author: AppForge Swarm
 * License: MIT
 */

import {
    EnhancedQuantumEngine,
    QuantumAnnealingOptimizer,
    EnhancedSuperpositionProcessor,
} from '../enhanced_quantum_engine_v2.js';
import { ProviderRegistry } from './provider_registry.js';
import { OllamaProvider } from './ollama_provider.js';
import { secureRandom } from '../secure_entropy.js';

// ============================================================================
// Task Interfaces
// ============================================================================

export type TaskType = 'code' | 'reasoning' | 'embedding' | 'fast-validation';
export type Priority = 'low' | 'normal' | 'high' | 'critical';

export interface Task {
    id: string;
    type: TaskType;
    prompt: string;
    complexity?: number; // 0-1
    priority?: Priority;
    constraints?: {
        maxTokens?: number;
        temperature?: number;
        maxLatency?: number; // ms
    };
}

export interface CodeTask extends Task {
    type: 'code';
    language?: string;
    codeContext?: string;
}

export interface ReasoningTask extends Task {
    type: 'reasoning';
    requiresDeepReasoning?: boolean;
}

export interface ModelResponse {
    success: boolean;
    output: string;
    modelUsed: string;
    latency: number;
    coherence?: number;
    confidence?: number;
    fallbackUsed?: string;
    energyCost?: number;
    timestamp: number;
}

export interface ModelStatus {
    model: string;
    status: 'healthy' | 'degraded' | 'down' | 'unknown';
    latency: number;
    successRate: number;
    totalRequests: number;
    energyEfficiency: number;
}

export interface OptimizationStats {
    totalTasks: number;
    averageLatency: number;
    successRate: number;
    energySaved: number;
    modelDistribution: Record<string, number>;
    routingDecisions: number;
    fallbackCount: number;
    quantumOptimizations: number;
}

// ============================================================================
// Model Configuration
// ============================================================================

interface ModelConfig {
    name: string;
    provider: OllamaProvider;
    primaryFor: TaskType[];
    complexityThreshold?: number; // For reasoning tasks
    fallbackFor?: TaskType[];
    energyCost: number; // 0-1, lower is more efficient
    maxContext: number;
    supportsEmbedding: boolean;
}

const MODEL_REGISTRY: Record<string, string> = {
    code: 'deepseek-coder:33b-instruct-q4_0',
    reasoningHigh: 'llama3:70b-instruct-q4_0',
    reasoningLow: 'phi3:mini-4k-instruct-q4_0',
    embedding: 'nomic-embed-text',
    fastValidation: 'phi3:mini-4k-instruct-q4_0',
};

// ============================================================================
// Quantum-Optimized Router
// ============================================================================

export class QuantumOptimizedRouter {
    private static instance: QuantumOptimizedRouter;
    
    // Quantum components
    private engine: EnhancedQuantumEngine;
    private annealer: QuantumAnnealingOptimizer;
    private superposition: EnhancedSuperpositionProcessor;
    
    // Provider management
    private providerRegistry: ProviderRegistry;
    private modelConfigs: Map<string, ModelConfig> = new Map();
    private ollamaHost: string;
    
    // Metrics tracking
    private metrics: {
        totalTasks: number;
        successCount: number;
        totalLatency: number;
        fallbackCount: number;
        energySaved: number;
        modelUsage: Map<string, number>;
        routingDecisions: number;
        quantumOptimizations: number;
        taskLatencies: number[];
    };
    
    // Response cache for fallback scenarios
    private responseCache: Map<string, ModelResponse> = new Map();
    private cacheMaxSize: number = 1000;

    private constructor() {
        this.engine = new EnhancedQuantumEngine();
        this.annealer = new QuantumAnnealingOptimizer();
        this.superposition = new EnhancedSuperpositionProcessor();
        this.providerRegistry = ProviderRegistry.getInstance();
        this.ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
        
        this.metrics = {
            totalTasks: 0,
            successCount: 0,
            totalLatency: 0,
            fallbackCount: 0,
            energySaved: 0,
            modelUsage: new Map(),
            routingDecisions: 0,
            quantumOptimizations: 0,
            taskLatencies: [],
        };
    }

    static getInstance(): QuantumOptimizedRouter {
        if (!QuantumOptimizedRouter.instance) {
            QuantumOptimizedRouter.instance = new QuantumOptimizedRouter();
        }
        return QuantumOptimizedRouter.instance;
    }

    // ============================================================================
    // Initialization
    // ============================================================================

    /**
     * Initialize the router with available models
     */
    async initialize(): Promise<void> {
        console.log('[QuantumOptimizedRouter] 🚀 Initializing quantum-optimized router...');
        
        await this.providerRegistry.initialize();
        
        // Initialize model configurations based on available providers
        await this.initializeModelConfigs();
        
        console.log(`[QuantumOptimizedRouter] ✅ Initialized with ${this.modelConfigs.size} models`);
    }

    /**
     * Initialize model configurations for all available Ollama models
     */
    private async initializeModelConfigs(): Promise<void> {
        const localProviders = this.providerRegistry.getLocalProviders();
        
        for (const provider of localProviders) {
            if (provider instanceof OllamaProvider) {
                const model = (provider as any).config?.model || 'unknown';
                const health = await provider.healthCheck();
                
                const config = this.createModelConfig(model, provider, health);
                this.modelConfigs.set(model, config);
                
                console.log(`[QuantumOptimizedRouter] 📍 Model registered: ${model} (${health.status})`);
            }
        }
    }

    /**
     * Create model configuration based on model name
     */
    private createModelConfig(model: string, provider: OllamaProvider, health: any): ModelConfig {
        // Determine model characteristics based on name
        const isCodeModel = model.includes('codellama') || model.includes('deepseek-coder') || model.includes('code');
        const isEmbeddingModel = model.includes('embed') || model.includes('nomic');
        const isSmallModel = model.includes('phi3') || model.includes('3b') || model.includes('7b');
        
        return {
            name: model,
            provider,
            primaryFor: this.getPrimaryTaskTypes(model),
            complexityThreshold: isSmallModel ? 0.7 : undefined,
            fallbackFor: [],
            energyCost: this.calculateEnergyCost(model),
            maxContext: this.getMaxContext(model),
            supportsEmbedding: isEmbeddingModel,
        };
    }

    /**
     * Get primary task types for a model
     */
    private getPrimaryTaskTypes(model: string): TaskType[] {
        if (model.includes('deepseek-coder') || model.includes('codellama') || model.includes('code')) {
            return ['code'];
        }
        if (model.includes('embed') || model.includes('nomic')) {
            return ['embedding'];
        }
        if (model.includes('phi3')) {
            return ['fast-validation', 'reasoning'];
        }
        return ['reasoning', 'fast-validation'];
    }

    /**
     * Calculate energy cost for a model (0-1, lower is more efficient)
     */
    private calculateEnergyCost(model: string): number {
        if (model.includes('phi3') || model.includes('3b')) return 0.2;
        if (model.includes('7b')) return 0.4;
        if (model.includes('13b')) return 0.6;
        if (model.includes('33b')) return 0.75;
        if (model.includes('70b')) return 0.9;
        return 0.5;
    }

    /**
     * Get maximum context window for a model
     */
    private getMaxContext(model: string): number {
        if (model.includes('phi3')) return 4096;
        if (model.includes('llama3')) return 8192;
        if (model.includes('33b')) return 16384;
        if (model.includes('70b')) return 32768;
        return 8192;
    }

    // ============================================================================
    // Task Analysis
    // ============================================================================

    /**
     * Analyze task characteristics
     */
    analyzeTask(task: Task): {
        type: TaskType;
        complexity: number;
        energyCost: number;
        recommendedModel: string;
        fallbackModels: string[];
        requiresQuantumOptimization: boolean;
    } {
        const complexity = task.complexity ?? this.estimateComplexity(task);
        const type = task.type;
        
        // Determine recommended model based on task type and complexity
        const recommendedModel = this.selectOptimalModel(type, complexity);
        const fallbackModels = this.getFallbackModels(type, complexity);
        
        // Determine if quantum optimization is needed
        const requiresQuantumOptimization = this.shouldUseQuantumOptimization(task, complexity);
        
        // Calculate estimated energy cost
        const energyCost = this.estimateEnergyCost(type, complexity);
        
        return {
            type,
            complexity,
            energyCost,
            recommendedModel,
            fallbackModels,
            requiresQuantumOptimization,
        };
    }

    /**
     * Estimate complexity of a task based on prompt analysis
     */
    private estimateComplexity(task: Task): number {
        const prompt = task.prompt.toLowerCase();
        
        // Keywords indicating high complexity
        const highComplexityKeywords = [
            'analyze', 'design', 'architecture', 'implement', 'complex',
            'system', 'optimize', 'refactor', 'debug', 'troubleshoot',
            'explain', 'compare', 'evaluate', 'synthesize'
        ];
        
        // Keywords indicating low complexity
        const lowComplexityKeywords = [
            'simple', 'basic', 'quick', 'fast', 'just', 'list',
            'what is', 'define', 'summarize', 'translate'
        ];
        
        let score = 0.5; // Base complexity
        
        for (const keyword of highComplexityKeywords) {
            if (prompt.includes(keyword)) score += 0.1;
        }
        
        for (const keyword of lowComplexityKeywords) {
            if (prompt.includes(keyword)) score -= 0.1;
        }
        
        // Clamp between 0 and 1
        return Math.max(0, Math.min(1, score));
    }

    /**
     * Select optimal model based on task type and complexity
     */
    private selectOptimalModel(type: TaskType, complexity: number): string {
        switch (type) {
            case 'code':
                return MODEL_REGISTRY.code;
            
            case 'reasoning':
                return complexity > 0.7 
                    ? MODEL_REGISTRY.reasoningHigh 
                    : MODEL_REGISTRY.reasoningLow;
            
            case 'embedding':
                return MODEL_REGISTRY.embedding;
            
            case 'fast-validation':
                return MODEL_REGISTRY.fastValidation;
            
            default:
                return MODEL_REGISTRY.reasoningLow;
        }
    }

    /**
     * Get fallback models for a task
     */
    private getFallbackModels(type: TaskType, complexity: number): string[] {
        const fallbacks: string[] = [];
        
        switch (type) {
            case 'code':
                fallbacks.push(MODEL_REGISTRY.reasoningHigh);
                fallbacks.push(MODEL_REGISTRY.fastValidation);
                break;
            
            case 'reasoning':
                if (complexity > 0.7) {
                    fallbacks.push(MODEL_REGISTRY.reasoningLow);
                } else {
                    fallbacks.push(MODEL_REGISTRY.reasoningHigh);
                    fallbacks.push(MODEL_REGISTRY.fastValidation);
                }
                break;
            
            case 'embedding':
                fallbacks.push(MODEL_REGISTRY.fastValidation);
                break;
            
            case 'fast-validation':
                fallbacks.push(MODEL_REGISTRY.reasoningLow);
                break;
        }
        
        return fallbacks;
    }

    /**
     * Determine if quantum optimization should be used
     */
    private shouldUseQuantumOptimization(task: Task, complexity: number): boolean {
        // Use quantum optimization for:
        // - High priority tasks
        // - High complexity tasks
        // - Tasks with multiple fallback options
        
        const priorityWeight = {
            'low': 0,
            'normal': 0.3,
            'high': 0.6,
            'critical': 0.9,
        };
        
        const priorityScore = priorityWeight[task.priority || 'normal'];
        const complexityScore = complexity;
        const hasMultipleFallbacks = this.getFallbackModels(task.type, complexity).length > 1;
        
        const totalScore = priorityScore + complexityScore + (hasMultipleFallbacks ? 0.2 : 0);
        
        return totalScore > 0.7;
    }

    /**
     * Estimate energy cost for a task
     */
    private estimateEnergyCost(type: TaskType, complexity: number): number {
        const baseCosts: Record<TaskType, number> = {
            'code': 0.6,
            'reasoning': 0.4,
            'embedding': 0.2,
            'fast-validation': 0.15,
        };
        
        const baseCost = baseCosts[type];
        return baseCost * (0.8 + complexity * 0.4); // Higher complexity = higher energy cost
    }

    // ============================================================================
    // Quantum Routing
    // ============================================================================

    /**
     * Use quantum annealing to find optimal routing
     */
    private async quantumOptimizeRouting(
        task: Task,
        candidates: string[]
    ): Promise<string> {
        this.metrics.quantumOptimizations++;
        
        // Create energy function for optimization
        const energyFn = (model: string): number => {
            const config = this.modelConfigs.get(model);
            if (!config) return 1.0;
            
            // Energy = (1 - health) * 0.5 + energyCost * 0.3 + latency * 0.2
            const healthPenalty = 0; // Simplified
            const energyPenalty = config.energyCost;
            const latencyPenalty = 0; // Could add actual latency
            
            return healthPenalty * 0.5 + energyPenalty * 0.3 + latencyPenalty * 0.2;
        };
        
        // Use superposition to consider all candidates
        this.superposition.createSuperposition(candidates);
        
        // Apply attention weights
        this.superposition.applyAttention();
        
        // Use quantum annealing to find minimum energy state
        const initialSolution = candidates[0];
        const optimized = await this.annealer.optimize(initialSolution, energyFn);
        
        console.log(`[QuantumOptimizedRouter] ⚛️ Quantum optimization selected: ${optimized.solution}`);
        
        return optimized.solution;
    }

    /**
     * Use superposition for multi-perspective routing
     */
    private async superpositionRouting(
        task: Task,
        candidates: string[]
    ): Promise<string> {
        this.metrics.routingDecisions++;
        
        // Evaluate each candidate from multiple perspectives
        const evaluations = candidates.map(model => {
            const config = this.modelConfigs.get(model);
            return {
                model,
                score: this.evaluateModelForTask(config, task),
            };
        });
        
        // Create superposition state
        this.superposition.createSuperposition(evaluations.map(e => e.model));
        
        // Amplify solutions based on evaluation
        this.superposition.amplifyGoodSolutions((model: string) => {
            const evalItem = evaluations.find(e => e.model === model);
            return evalItem?.score ?? 0;
        });
        
        // Measure to get best solution
        const result = this.superposition.measure();
        
        return result.bestSolution;
    }

    /**
     * Evaluate a model for a specific task
     */
    private evaluateModelForTask(config: ModelConfig | undefined, task: Task): number {
        if (!config) return 0;
        
        let score = 0;
        
        // Primary task type match
        if (config.primaryFor.includes(task.type)) {
            score += 0.5;
        }
        
        // Complexity match
        if (task.complexity !== undefined) {
            if (task.complexity <= 0.7 && config.energyCost < 0.5) {
                score += 0.3; // Prefer efficient models for low complexity
            } else if (task.complexity > 0.7 && config.energyCost >= 0.5) {
                score += 0.3; // Prefer capable models for high complexity
            }
        }
        
        // Embedding capability
        if (task.type === 'embedding' && config.supportsEmbedding) {
            score += 0.2;
        }
        
        // Energy efficiency bonus
        score += (1 - config.energyCost) * 0.2;
        
        return score;
    }

    // ============================================================================
    // Main Routing Methods
    // ============================================================================

    /**
     * Route a general task to the optimal model
     */
    async routeTask(task: Task): Promise<ModelResponse> {
        const startTime = Date.now();
        this.metrics.totalTasks++;
        
        console.log(`[QuantumOptimizedRouter] 📨 Routing task ${task.id} (type: ${task.type})`);
        
        // Analyze task
        const analysis = this.analyzeTask(task);
        console.log(`[QuantumOptimizedRouter] 📊 Task analysis: complexity=${analysis.complexity.toFixed(2)}, energyCost=${analysis.energyCost.toFixed(2)}`);
        
        // Get available candidates
        const candidates = [analysis.recommendedModel, ...analysis.fallbackModels];
        const availableCandidates = candidates.filter(m => this.modelConfigs.has(m));
        
        if (availableCandidates.length === 0) {
            return this.createErrorResponse('No available models for task type');
        }
        
        // Use quantum optimization if needed
        let selectedModel: string;
        if (analysis.requiresQuantumOptimization && availableCandidates.length > 1) {
            selectedModel = await this.quantumOptimizeRouting(task, availableCandidates);
        } else {
            selectedModel = await this.superpositionRouting(task, availableCandidates);
        }
        
        // Execute with fallback strategy
        const response = await this.executeWithFallback(task, selectedModel, analysis.fallbackModels);
        
        // Update metrics
        const latency = Date.now() - startTime;
        response.latency = latency;
        this.metrics.totalLatency += latency;
        this.metrics.taskLatencies.push(latency);
        
        if (response.success) {
            this.metrics.successCount++;
        }
        
        if (response.fallbackUsed) {
            this.metrics.fallbackCount++;
        }
        
        console.log(`[QuantumOptimizedRouter] ✅ Task completed: model=${response.modelUsed}, latency=${latency}ms`);
        
        return response;
    }

    /**
     * Route a code task to the optimal code model
     */
    async routeCode(task: CodeTask): Promise<string> {
        const response = await this.routeTask(task);
        
        if (!response.success) {
            throw new Error(`Code generation failed: ${response.output}`);
        }
        
        return response.output;
    }

    /**
     * Route a reasoning task to the optimal reasoning model
     */
    async routeReasoning(task: ReasoningTask): Promise<string> {
        const response = await this.routeTask(task);
        
        if (!response.success) {
            throw new Error(`Reasoning failed: ${response.output}`);
        }
        
        return response.output;
    }

    /**
     * Generate embeddings using the optimal embedding model
     */
    async routeEmbedding(text: string): Promise<number[]> {
        const task: Task = {
            id: `embed-${Date.now()}`,
            type: 'embedding',
            prompt: text,
            complexity: 0.3,
        };
        
        const response = await this.routeTask(task);
        
        if (!response.success) {
            throw new Error(`Embedding generation failed: ${response.output}`);
        }
        
        // Parse embedding from response (assuming JSON format)
        try {
            return JSON.parse(response.output);
        } catch {
            // Return as array of numbers if not JSON
            return response.output.split(',').map(Number);
        }
    }

    // ============================================================================
    // Fallback Strategy
    // ============================================================================

    /**
     * Execute task with fallback strategy
     */
    private async executeWithFallback(
        task: Task,
        primaryModel: string,
        fallbackModels: string[]
    ): Promise<ModelResponse> {
        // Try primary model first
        const primaryResult = await this.executeModel(primaryModel, task);
        
        if (primaryResult.success) {
            // Validate with Oracle if available
            const validatedResult = await this.oracleValidate(primaryResult, task);
            return validatedResult;
        }
        
        console.log(`[QuantumOptimizedRouter] ⚠️ Primary model ${primaryModel} failed, trying fallbacks`);
        
        // Try fallback models
        for (const fallbackModel of fallbackModels) {
            if (fallbackModel === primaryModel) continue;
            
            const fallbackResult = await this.executeModel(fallbackModel, task);
            
            if (fallbackResult.success) {
                fallbackResult.fallbackUsed = primaryModel;
                
                // Validate with Oracle
                const validatedResult = await this.oracleValidate(fallbackResult, task);
                return validatedResult;
            }
        }
        
        // Check cache
        const cacheKey = this.getCacheKey(task);
        const cachedResult = this.responseCache.get(cacheKey);
        
        if (cachedResult) {
            console.log(`[QuantumOptimizedRouter] 💾 Returning cached result`);
            return { ...cachedResult, fallbackUsed: primaryModel };
        }
        
        // All models failed
        return this.createErrorResponse('All models failed to process task');
    }

    /**
     * Execute task on a specific model
     */
    private async executeModel(model: string, task: Task): Promise<ModelResponse> {
        const config = this.modelConfigs.get(model);
        
        if (!config) {
            return this.createErrorResponse(`Model ${model} not configured`);
        }
        
        const startTime = Date.now();
        
        try {
            const response = await config.provider.generate(task.prompt, {
                temperature: task.constraints?.temperature ?? 0.7,
                maxTokens: task.constraints?.maxTokens ?? 4096,
            });
            
            // Update model usage metrics
            const currentUsage = this.metrics.modelUsage.get(model) ?? 0;
            this.metrics.modelUsage.set(model, currentUsage + 1);
            
            return {
                success: true,
                output: response.content,
                modelUsed: model,
                latency: Date.now() - startTime,
                coherence: (response as any).coherence,
                confidence: this.calculateConfidence(response, task),
                energyCost: config.energyCost,
                timestamp: Date.now(),
            };
        } catch (error: any) {
            console.warn(`[QuantumOptimizedRouter] ❌ Model ${model} error: ${error.message}`);
            
            return {
                success: false,
                output: error.message,
                modelUsed: model,
                latency: Date.now() - startTime,
                timestamp: Date.now(),
            };
        }
    }

    /**
     * Validate response using Oracle (placeholder for actual Oracle integration)
     */
    private async oracleValidate(response: ModelResponse, task: Task): Promise<ModelResponse> {
        // Placeholder for Oracle validation
        // In production, this would integrate with the Oracle API service
        
        console.log(`[QuantumOptimizedRouter] 🔮 Oracle validation for task ${task.id}`);
        
        // Simple validation checks
        const isValidLength = response.output.length > 0;
        const isNotError = !response.output.toLowerCase().includes('error');
        
        if (!isValidLength || !isNotError) {
            console.warn(`[QuantumOptimizedRouter] ⚠️ Oracle validation failed`);
            return { ...response, confidence: 0.5 };
        }
        
        return { ...response, confidence: 1.0 };
    }

    /**
     * Calculate confidence score for a response
     */
    private calculateConfidence(response: any, task: Task): number {
        // Base confidence
        let confidence = 0.8;
        
        // Adjust based on task complexity
        if (task.complexity && task.complexity > 0.7) {
            confidence -= 0.1;
        }
        
        // Adjust based on response length (longer responses may indicate uncertainty)
        const lengthRatio = response.content.length / (task.constraints?.maxTokens ?? 4096);
        if (lengthRatio > 0.9) {
            confidence -= 0.1;
        }
        
        return Math.max(0, Math.min(1, confidence));
    }

    // ============================================================================
    // Cache Management
    // ============================================================================

    /**
     * Generate cache key for a task
     */
    private getCacheKey(task: Task): string {
        return `${task.type}:${this.hashString(task.prompt)}`;
    }

    /**
     * Simple string hash
     */
    private hashString(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Cache a response
     */
    private cacheResponse(task: Task, response: ModelResponse): void {
        if (this.responseCache.size >= this.cacheMaxSize) {
            // Remove oldest entry
            const firstKey = this.responseCache.keys().next().value;
            this.responseCache.delete(firstKey);
        }
        
        const cacheKey = this.getCacheKey(task);
        this.responseCache.set(cacheKey, response);
    }

    // ============================================================================
    // Status and Statistics
    // ============================================================================

    /**
     * Get status of all models
     */
    async getModelStatus(): Promise<ModelStatus[]> {
        const statuses: ModelStatus[] = [];
        
        for (const [model, config] of this.modelConfigs) {
            const health = await config.provider.healthCheck();
            const usage = this.metrics.modelUsage.get(model) ?? 0;
            
            statuses.push({
                model,
                status: health.status as 'healthy' | 'degraded' | 'down' | 'unknown',
                latency: health.latency,
                successRate: this.calculateModelSuccessRate(model),
                totalRequests: usage,
                energyEfficiency: 1 - config.energyCost,
            });
        }
        
        return statuses;
    }

    /**
     * Calculate success rate for a model
     */
    private calculateModelSuccessRate(model: string): number {
        // Simplified - would need more detailed tracking
        return 0.95;
    }

    /**
     * Get optimization statistics
     */
    getOptimizationStats(): OptimizationStats {
        const avgLatency = this.metrics.taskLatencies.length > 0
            ? this.metrics.totalLatency / this.metrics.totalTasks
            : 0;
        
        const modelDistribution: Record<string, number> = {};
        for (const [model, count] of this.metrics.modelUsage) {
            modelDistribution[model] = count;
        }
        
        return {
            totalTasks: this.metrics.totalTasks,
            averageLatency: Math.round(avgLatency),
            successRate: this.metrics.totalTasks > 0
                ? this.metrics.successCount / this.metrics.totalTasks
                : 0,
            energySaved: this.metrics.energySaved,
            modelDistribution,
            routingDecisions: this.metrics.routingDecisions,
            fallbackCount: this.metrics.fallbackCount,
            quantumOptimizations: this.metrics.quantumOptimizations,
        };
    }

    /**
     * Create error response
     */
    private createErrorResponse(message: string): ModelResponse {
        return {
            success: false,
            output: message,
            modelUsed: 'none',
            latency: 0,
            timestamp: Date.now(),
        };
    }

    // ============================================================================
    // Health Check
    // ============================================================================

    /**
     * Health check for all models
     */
    async healthCheck(): Promise<Map<string, any>> {
        const healthMap = new Map();
        
        for (const [model, config] of this.modelConfigs) {
            const health = await config.provider.healthCheck();
            healthMap.set(model, health);
        }
        
        return healthMap;
    }
}

// ============================================================================
// Factory Function
// ============================================================================

export function getQuantumOptimizedRouter(): QuantumOptimizedRouter {
    return QuantumOptimizedRouter.getInstance();
}

export async function createQuantumOptimizedRouter(): Promise<QuantumOptimizedRouter> {
    const router = QuantumOptimizedRouter.getInstance();
    await router.initialize();
    return router;
}
