/**
 * 🔌 UNIVERSAL MCP TOOL REGISTRY
 * 
 * Universal Model Context Protocol server with quantum-enhanced tool routing
 * Features:
 * - Quantum-optimized tool selection
 * - Coherence-based routing
 * - Universal tool registration
 * - Real-time tool discovery
 */

import { EventEmitter } from 'events';
import { secureRandom } from './secure_entropy.js';

// ============================================================================
// MCP TYPES
// ============================================================================

interface ToolDefinition {
    id: string;
    name: string;
    description: string;
    version: string;
    category: string;
    inputSchema: InputSchema;
    outputSchema: OutputSchema;
    capabilities: string[];
    coherenceRequirement: number;
    timeout: number;
    retryPolicy: RetryPolicy;
}

interface InputSchema {
    type: 'object' | 'array' | 'string' | 'number' | 'boolean';
    properties: Record<string, PropertySchema>;
    required?: string[];
}

interface PropertySchema {
    type: string;
    description: string;
    default?: any;
    enum?: any[];
    minimum?: number;
    maximum?: number;
    pattern?: string;
}

interface OutputSchema {
    type: 'object' | 'array' | 'string' | 'number' | 'boolean';
    properties?: Record<string, PropertySchema>;
}

interface RetryPolicy {
    maxAttempts: number;
    backoffMs: number;
    retryableErrors: string[];
}

interface ToolExecutionRequest {
    toolId: string;
    parameters: Record<string, any>;
    context?: ExecutionContext;
    priority?: 'critical' | 'high' | 'medium' | 'low';
}

interface ExecutionContext {
    sessionId: string;
    userId: string;
    coherence?: number;
    metadata?: Record<string, any>;
}

interface ToolExecutionResult {
    success: boolean;
    output?: any;
    error?: string;
    executionTime: number;
    coherenceUsed: number;
    quantumMetrics?: QuantumToolMetrics;
}

interface QuantumToolMetrics {
    routingCoherence: number;
    selectionEntropy: number;
    optimizationApplied: boolean;
    fallbackTriggered: boolean;
}

interface ToolRegistration {
    tool: ToolDefinition;
    registeredAt: number;
    lastUsed: number;
    usageCount: number;
    successRate: number;
    averageLatency: number;
}

// ============================================================================
// QUANTUM TOOL ROUTER
// ============================================================================

class QuantumToolRouter {
    private toolScores: Map<string, number> = new Map();
    private coherenceCache: Map<string, number> = new Map();
    private readonly COHERENCE_DECAY = 0.95;
    private readonly MIN_SCORE = 0.1;

    /**
     * Calculate routing score using quantum-inspired optimization
     */
    calculateScore(tool: ToolDefinition, context: ExecutionContext): number {
        // Base score from tool definition
        let score = 0.5;
        
        // Coherence bonus
        const contextCoherence = context.coherence ?? 0.9;
        if (tool.coherenceRequirement <= contextCoherence) {
            score += 0.3 * (1 - tool.coherenceRequirement);
        } else {
            score -= 0.5 * (tool.coherenceRequirement - contextCoherence);
        }
        
        // Success rate weight
        const successWeight = this.getSuccessRate(tool.id);
        score *= 0.5 + 0.5 * successWeight;
        
        // Latency penalty
        const latencyPenalty = Math.min(0.2, tool.timeout / 60000);
        score -= latencyPenalty;
        
        // Capability match bonus
        const capabilityMatch = this.calculateCapabilityMatch(tool, context);
        score += 0.2 * capabilityMatch;
        
        // Apply quantum uncertainty
        const uncertainty = secureRandom() * 0.1;
        score += uncertainty;
        
        // Ensure minimum score
        return Math.max(this.MIN_SCORE, Math.min(1, score));
    }

    /**
     * Calculate capability match score
     */
    private calculateCapabilityMatch(tool: ToolDefinition, context: ExecutionContext): number {
        const required = context.metadata?.requiredCapabilities || [];
        if (required.length === 0) return 1;
        
        const matched = required.filter(c => tool.capabilities.includes(c));
        return matched.length / required.length;
    }

    /**
     * Get cached success rate
     */
    private getSuccessRate(toolId: string): number {
        return this.toolScores.get(toolId) ?? 0.85;
    }

    /**
     * Update success rate
     */
    updateSuccessRate(toolId: string, success: boolean): void {
        const current = this.getSuccessRate(toolId);
        const updated = success ? current + 0.01 : current - 0.05;
        this.toolScores.set(toolId, Math.max(0.5, Math.min(1, updated)));
    }

    /**
     * Route request to optimal tool using quantum superposition
     */
    async route(tools: ToolDefinition[], request: ToolExecutionRequest): Promise<ToolDefinition> {
        // Generate superposition of possible tools
        const scoredTools = tools.map(tool => ({
            tool,
            score: this.calculateScore(tool, request.context || { sessionId: '', userId: '' })
        }));
        
        // Collapse to best tool using weighted selection
        const selected = this.collapseSelection(scoredTools);
        
        return selected.tool;
    }

    /**
     * Collapse superposition to deterministic selection
     */
    private collapseSelection(scoredTools: { tool: ToolDefinition; score: number }[]): { tool: ToolDefinition; score: number } {
        // Sort by score
        scoredTools.sort((a, b) => b.score - a.score);
        
        // Apply softmax-like normalization
        const totalScore = scoredTools.reduce((sum, t) => sum + Math.exp(t.score), 0);
        const probabilities = scoredTools.map(t => Math.exp(t.score) / totalScore);
        
        // Select using quantum-inspired probabilistic selection
        const random = secureRandom();
        let cumulative = 0;
        
        for (let i = 0; i < probabilities.length; i++) {
            cumulative += probabilities[i];
            if (random < cumulative) {
                return scoredTools[i];
            }
        }
        
        return scoredTools[0];
    }
}

// ============================================================================
// UNIVERSAL MCP SERVER
// ============================================================================

export class UniversalMCPServer extends EventEmitter {
    private toolRegistry: Map<string, ToolRegistration> = new Map();
    private categoryIndex: Map<string, Set<string>> = new Map();
    private capabilityIndex: Map<string, Set<string>> = new Map();
    private router: QuantumToolRouter;
    private server: any = null;
    private coherenceManager: CoherenceManager;
    private isRunning: boolean = false;
    private requestCounter: number = 0;

    constructor() {
        super();
        this.router = new QuantumToolRouter();
        this.coherenceManager = new CoherenceManager();
        
        // Initialize built-in tools
        this.registerBuiltInTools();
    }

    /**
     * Register built-in tools
     */
    private registerBuiltInTools(): void {
        // File operations tool
        this.registerTool({
            id: 'builtin-file-read',
            name: 'file_read',
            description: 'Read files from the filesystem',
            version: '1.0.0',
            category: 'filesystem',
            inputSchema: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'File path to read' },
                    encoding: { type: 'string', description: 'File encoding', default: 'utf-8' }
                },
                required: ['path']
            },
            outputSchema: {
                type: 'object',
                properties: {
                    content: { type: 'string', description: 'File content' },
                    size: { type: 'number', description: 'File size in bytes' }
                }
            },
            capabilities: ['file_read', 'filesystem'],
            coherenceRequirement: 0.7,
            timeout: 10000,
            retryPolicy: {
                maxAttempts: 3,
                backoffMs: 1000,
                retryableErrors: ['ENOENT', 'EAGAIN']
            }
        });

        // Shell command tool
        this.registerTool({
            id: 'builtin-shell-exec',
            name: 'shell_exec',
            description: 'Execute shell commands',
            version: '1.0.0',
            category: 'system',
            inputSchema: {
                type: 'object',
                properties: {
                    command: { type: 'string', description: 'Command to execute' },
                    timeout: { type: 'number', description: 'Timeout in ms', default: 30000 },
                    workingDir: { type: 'string', description: 'Working directory' }
                },
                required: ['command']
            },
            outputSchema: {
                type: 'object',
                properties: {
                    stdout: { type: 'string', description: 'Standard output' },
                    stderr: { type: 'string', description: 'Standard error' },
                    exitCode: { type: 'number', description: 'Exit code' }
                }
            },
            capabilities: ['shell_exec', 'system'],
            coherenceRequirement: 0.85,
            timeout: 60000,
            retryPolicy: {
                maxAttempts: 2,
                backoffMs: 2000,
                retryableErrors: ['ETIMEDOUT']
            }
        });

        // HTTP request tool
        this.registerTool({
            id: 'builtin-http-request',
            name: 'http_request',
            description: 'Make HTTP requests',
            version: '1.0.0',
            category: 'network',
            inputSchema: {
                type: 'object',
                properties: {
                    url: { type: 'string', description: 'Request URL' },
                    method: { type: 'string', description: 'HTTP method', default: 'GET' },
                    headers: { type: 'object', description: 'Request headers' },
                    body: { type: 'string', description: 'Request body' }
                },
                required: ['url']
            },
            outputSchema: {
                type: 'object',
                properties: {
                    status: { type: 'number', description: 'Response status' },
                    headers: { type: 'object', description: 'Response headers' },
                    body: { type: 'string', description: 'Response body' }
                }
            },
            capabilities: ['http_request', 'network'],
            coherenceRequirement: 0.75,
            timeout: 30000,
            retryPolicy: {
                maxAttempts: 3,
                backoffMs: 1000,
                retryableErrors: ['ECONNRESET', 'ETIMEDOUT']
            }
        });

        // Code execution tool
        this.registerTool({
            id: 'builtin-code-exec',
            name: 'code_exec',
            description: 'Execute code in isolated environment',
            version: '1.0.0',
            category: 'execution',
            inputSchema: {
                type: 'object',
                properties: {
                    language: { type: 'string', description: 'Programming language' },
                    code: { type: 'string', description: 'Code to execute' },
                    timeout: { type: 'number', description: 'Timeout in ms', default: 10000 }
                },
                required: ['language', 'code']
            },
            outputSchema: {
                type: 'object',
                properties: {
                    output: { type: 'string', description: 'Execution output' },
                    error: { type: 'string', description: 'Error message if any' },
                    executionTime: { type: 'number', description: 'Execution time in ms' }
                }
            },
            capabilities: ['code_exec', 'execution', 'sandbox'],
            coherenceRequirement: 0.9,
            timeout: 30000,
            retryPolicy: {
                maxAttempts: 2,
                backoffMs: 2000,
                retryableErrors: ['ETIMEDOUT']
            }
        });
    }

    // ============================================================================
    // TOOL REGISTRATION
    // ============================================================================

    /**
     * Register a new tool
     */
    registerTool(tool: ToolDefinition): void {
        const registration: ToolRegistration = {
            tool,
            registeredAt: Date.now(),
            lastUsed: 0,
            usageCount: 0,
            successRate: 1.0,
            averageLatency: 0
        };
        
        this.toolRegistry.set(tool.id, registration);
        
        // Update category index
        if (!this.categoryIndex.has(tool.category)) {
            this.categoryIndex.set(tool.category, new Set());
        }
        this.categoryIndex.get(tool.category)!.add(tool.id);
        
        // Update capability index
        for (const capability of tool.capabilities) {
            if (!this.capabilityIndex.has(capability)) {
                this.capabilityIndex.set(capability, new Set());
            }
            this.capabilityIndex.get(capability)!.add(tool.id);
        }
        
        this.emit('toolRegistered', { toolId: tool.id, tool });
    }

    /**
     * Unregister a tool
     */
    unregisterTool(toolId: string): boolean {
        const registration = this.toolRegistry.get(toolId);
        if (!registration) return false;
        
        // Remove from indices
        this.categoryIndex.get(registration.tool.category)?.delete(toolId);
        for (const capability of registration.tool.capabilities) {
            this.capabilityIndex.get(capability)?.delete(toolId);
        }
        
        this.toolRegistry.delete(toolId);
        this.emit('toolUnregistered', { toolId });
        
        return true;
    }

    // ============================================================================
    // TOOL DISCOVERY
    // ============================================================================

    /**
     * Find tools by category
     */
    findByCategory(category: string): ToolDefinition[] {
        const toolIds = this.categoryIndex.get(category) || [];
        return Array.from(toolIds).map(id => this.toolRegistry.get(id)!.tool);
    }

    /**
     * Find tools by capability
     */
    findByCapability(capability: string): ToolDefinition[] {
        const toolIds = this.capabilityIndex.get(capability) || [];
        return Array.from(toolIds).map(id => this.toolRegistry.get(id)!.tool);
    }

    /**
     * Find tools matching criteria
     */
    find(filters: {
        category?: string;
        capabilities?: string[];
        minCoherence?: number;
    }): ToolDefinition[] {
        let tools = Array.from(this.toolRegistry.values()).map(r => r.tool);
        
        if (filters.category) {
            tools = tools.filter(t => t.category === filters.category);
        }
        
        if (filters.capabilities && filters.capabilities.length > 0) {
            tools = tools.filter(t => 
                filters.capabilities!.every(c => t.capabilities.includes(c))
            );
        }
        
        if (filters.minCoherence !== undefined) {
            tools = tools.filter(t => t.coherenceRequirement <= filters.minCoherence!);
        }
        
        return tools;
    }

    /**
     * Get all registered tools
     */
    getAllTools(): ToolDefinition[] {
        return Array.from(this.toolRegistry.values()).map(r => r.tool);
    }

    // ============================================================================
    // TOOL EXECUTION
    // ============================================================================

    /**
     * Execute a tool request
     */
    async execute(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
        const requestId = `mcp_${++this.requestCounter}_${Date.now()}`;
        const startTime = Date.now();
        
        // Find matching tools
        const matchingTools = this.find({
            capabilities: request.context?.metadata?.requiredCapabilities,
            minCoherence: request.context?.coherence
        });
        
        if (matchingTools.length === 0) {
            return {
                success: false,
                error: 'No matching tools found',
                executionTime: Date.now() - startTime,
                coherenceUsed: 0
            };
        }
        
        // Route to optimal tool using quantum routing
        const selectedTool = await this.router.route(matchingTools, request);
        
        // Execute with coherence monitoring
        const result = await this.executeWithCoherence(selectedTool, request.parameters, request.context);
        
        // Update metrics
        this.updateMetrics(selectedTool.id, result.success, result.executionTime);
        this.router.updateSuccessRate(selectedTool.id, result.success);
        
        // Add quantum metrics
        result.quantumMetrics = {
            routingCoherence: this.coherenceManager.getCurrentCoherence(),
            selectionEntropy: this.calculateSelectionEntropy(matchingTools),
            optimizationApplied: true,
            fallbackTriggered: false
        };
        
        this.emit('toolExecuted', { requestId, toolId: selectedTool.id, result });
        
        return result;
    }

    /**
     * Execute tool with coherence monitoring
     */
    private async executeWithCoherence(
        tool: ToolDefinition,
        parameters: Record<string, any>,
        context?: ExecutionContext
    ): Promise<ToolExecutionResult> {
        const startTime = Date.now();
        
        // Check coherence before execution
        const requiredCoherence = tool.coherenceRequirement;
        const availableCoherence = context?.coherence ?? this.coherenceManager.getCurrentCoherence();
        
        if (availableCoherence < requiredCoherence) {
            // Wait for coherence to improve
            await this.coherenceManager.waitForCoherence(requiredCoherence);
        }
        
        let attempts = 0;
        const maxAttempts = tool.retryPolicy.maxAttempts;
        
        while (attempts < maxAttempts) {
            try {
                // Execute the tool (in production, this would call actual tool)
                const output = await this.invokeTool(tool, parameters);
                
                return {
                    success: true,
                    output,
                    executionTime: Date.now() - startTime,
                    coherenceUsed: availableCoherence
                };
            } catch (error: any) {
                // Check if error is retryable
                if (!tool.retryPolicy.retryableErrors.includes(error.code)) {
                    return {
                        success: false,
                        error: error.message,
                        executionTime: Date.now() - startTime,
                        coherenceUsed: availableCoherence
                    };
                }
                
                // Apply backoff
                attempts++;
                if (attempts < maxAttempts) {
                    await new Promise(r => 
                        setTimeout(r, tool.retryPolicy.backoffMs * attempts)
                    );
                }
            }
        }
        
        return {
            success: false,
            error: `Tool execution failed after ${maxAttempts} attempts`,
            executionTime: Date.now() - startTime,
            coherenceUsed: availableCoherence
        };
    }

    /**
     * Invoke tool (placeholder for actual implementation)
     */
    private async invokeTool(tool: ToolDefinition, parameters: Record<string, any>): Promise<any> {
        // Placeholder: In production, this would call actual tool implementations
        return { success: true, tool: tool.name, parameters };
    }

    /**
     * Update tool metrics
     */
    private updateMetrics(toolId: string, success: boolean, latency: number): void {
        const registration = this.toolRegistry.get(toolId);
        if (!registration) return;
        
        registration.lastUsed = Date.now();
        registration.usageCount++;
        
        // Update success rate
        const successWeight = 0.1;
        registration.successRate = successWeight * (success ? 1 : 0) + 
                                   (1 - successWeight) * registration.successRate;
        
        // Update average latency
        const latencyWeight = 0.1;
        registration.averageLatency = latencyWeight * latency + 
                                     (1 - latencyWeight) * registration.averageLatency;
    }

    /**
     * Calculate selection entropy
     */
    private calculateSelectionEntropy(tools: ToolDefinition[]): number {
        if (tools.length <= 1) return 0;
        
        // Simplified entropy calculation
        const scores = tools.map(t => this.router.calculateScore(t, { 
            sessionId: '', 
            userId: '' 
        }));
        const total = scores.reduce((a, b) => a + b, 0);
        const probs = scores.map(s => s / total);
        
        const entropy = -probs.reduce((sum, p) => {
            return sum + (p > 0 ? p * Math.log2(p) : 0);
        }, 0);
        
        return Math.min(entropy / Math.log2(tools.length), 1);
    }

    // ============================================================================
    // SERVER CONTROL
    // ============================================================================

    /**
     * Start the MCP server
     */
    async start(): Promise<void> {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.emit('serverStarted');
        
        console.log('🔌 MCP Server started with', this.toolRegistry.size, 'tools');
    }

    /**
     * Stop the MCP server
     */
    async stop(): Promise<void> {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.emit('serverStopped');
    }

    /**
     * Get server status
     */
    getStatus(): {
        running: boolean;
        toolCount: number;
        categoryCount: number;
        coherence: number;
    } {
        return {
            running: this.isRunning,
            toolCount: this.toolRegistry.size,
            categoryCount: this.categoryIndex.size,
            coherence: this.coherenceManager.getCurrentCoherence()
        };
    }
}

// ============================================================================
// COHERENCE MANAGER
// ============================================================================

class CoherenceManager {
    private coherence: number = 0.95;
    private coherenceListeners: Map<number, Function> = new Map();
    private listenerId: number = 0;

    /**
     * Get current coherence
     */
    getCurrentCoherence(): number {
        return this.coherence;
    }

    /**
     * Set coherence
     */
    setCoherence(value: number): void {
        this.coherence = Math.max(0, Math.min(1, value));
        
        // Notify listeners
        this.coherenceListeners.forEach((callback, id) => {
            if (this.coherence < 0.7) {
                callback(this.coherence);
            }
        });
    }

    /**
     * Wait for coherence to reach threshold
     */
    async waitForCoherence(threshold: number): Promise<void> {
        if (this.coherence >= threshold) return;
        
        return new Promise((resolve) => {
            const listener = (coherence: number) => {
                if (coherence >= threshold) {
                    this.coherenceListeners.delete(this.listenerId);
                    resolve();
                }
            };
            
            this.listenerId++;
            this.coherenceListeners.set(this.listenerId, listener);
        });
    }

    /**
     * Register tool for coherence management
     */
    registerTool(toolId: string, definition: ToolDefinition): void {
        // Tool is registered with coherence tracking
    }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const mcpServer = new UniversalMCPServer();
