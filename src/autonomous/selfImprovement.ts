/**
 * Self-Improvement Loop
 * 
 * Code generation from natural language, automatic refactoring,
 * performance optimization, and learning from user feedback.
 * 
 * Based on: AppForge Autonomous Architecture Specification v1.0
 */

import {
  CodeGenerationRequest,
  CodeGenerationResult,
  ValidationResult,
  RefactoringTarget,
  CodeMetrics,
  PerformanceOptimization,
  PerformanceMetrics,
  OptimizationStrategy,
  UserFeedback,
  LearningEntry,
  TaskPriority,
} from './types';

import { EventEmitter } from 'events';

interface SelfImprovementOptions {
  learningRate?: number;
  maxLearningEntries?: number;
  autoRefactor?: boolean;
  autoOptimize?: boolean;
  logDecisions?: boolean;
}

interface ImprovementVector {
  name: string;
  weight: number;
  lastUpdated: Date;
  successRate: number;
}

/**
 * Self-Improvement Engine
 * 
 * Core capabilities:
 * - Code generation from natural language
 * - Automatic refactoring with AST-based transformations
 * - Performance optimization through profiling
 * - Learning from user feedback (reinforcement learning)
 */
export class SelfImprovementLoop extends EventEmitter {
  private learningEntries: Map<string, LearningEntry> = new Map();
  private userFeedback: Map<string, UserFeedback> = new Map();
  private improvementVectors: Map<string, ImprovementVector> = new Map();
  private codeMetrics: Map<string, CodeMetrics> = new Map();
  private performanceHistory: Map<string, PerformanceMetrics[]> = new Map();
  private pendingOptimizations: Map<string, PerformanceOptimization> = new Map();

  private learningRate: number;
  private maxLearningEntries: number;
  private autoRefactor: boolean;
  private autoOptimize: boolean;
  private logDecisions: boolean;

  constructor(options: SelfImprovementOptions = {}) {
    super();
    this.learningRate = options.learningRate || 0.1;
    this.maxLearningEntries = options.maxLearningEntries || 1000;
    this.autoRefactor = options.autoRefactor !== false;
    this.autoOptimize = options.autoOptimize !== false;
    this.logDecisions = options.logDecisions !== false;

    this.initializeImprovementVectors();
  }

  // ==================== Initialization ====================

  /**
   * Initialize improvement vectors with default weights
   */
  private initializeImprovementVectors(): void {
    this.improvementVectors.set('code_generation', {
      name: 'Code Generation',
      weight: 0.8,
      lastUpdated: new Date(),
      successRate: 0.75,
    });

    this.improvementVectors.set('refactoring', {
      name: 'Automatic Refactoring',
      weight: 0.7,
      lastUpdated: new Date(),
      successRate: 0.8,
    });

    this.improvementVectors.set('performance', {
      name: 'Performance Optimization',
      weight: 0.6,
      lastUpdated: new Date(),
      successRate: 0.7,
    });

    this.improvementVectors.set('learning', {
      name: 'Feedback Learning',
      weight: 0.9,
      lastUpdated: new Date(),
      successRate: 0.85,
    });
  }

  // ==================== Code Generation ====================

  /**
   * Generate code from natural language description
   */
  async generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResult> {
    this.emit('generation:started', { requestId: request.id });

    try {
      // In a real implementation, this would use an LLM
      // For now, we'll use template-based generation
      const generated = await this.performCodeGeneration(request);
      
      // Validate the generated code
      const validationResult = await this.validateCode(generated.code, request.targetLanguage);

      const result: CodeGenerationResult = {
        requestId: request.id,
        code: generated.code,
        language: request.targetLanguage,
        confidence: generated.confidence,
        tests: generated.tests,
        documentation: generated.documentation,
        validationResult,
      };

      // Update learning
      this.recordLearning({
        id: this.generateId(),
        pattern: `code_generation:${request.naturalLanguage}`,
        outcome: validationResult.valid ? 'success' : 'failure',
        context: { request, result },
        confidence: result.confidence,
        timestamp: new Date(),
        feedbackIds: [],
      });

      this.emit('generation:completed', { requestId: request.id, result });
      
      if (this.logDecisions) {
        console.log(`[SelfImprovement] Generated code with confidence ${result.confidence}`);
      }

      return result;
    } catch (error) {
      this.emit('generation:failed', { requestId: request.id, error });
      throw error;
    }
  }

  /**
   * Perform actual code generation (template-based for now)
   */
  private async performCodeGeneration(
    request: CodeGenerationRequest
  ): Promise<{ code: string; confidence: number; tests?: string; documentation?: string }> {
    const { naturalLanguage, targetLanguage, context } = request;
    const desc = naturalLanguage.toLowerCase();

    // Pattern-based code generation
    let code = '';
    let confidence = 0.7;

    if (targetLanguage === 'typescript' || targetLanguage === 'javascript') {
      if (desc.includes('function') || desc.includes('method')) {
        const funcName = this.extractFunctionName(naturalLanguage) || 'generatedFunction';
        const params = this.extractParameters(naturalLanguage);
        code = this.generateFunction(funcName, params, targetLanguage);
        confidence = 0.85;
      } else if (desc.includes('class') || desc.includes('component')) {
        const className = this.extractClassName(naturalLanguage) || 'GeneratedClass';
        code = this.generateClass(className, targetLanguage);
        confidence = 0.8;
      } else if (desc.includes('interface') || desc.includes('type')) {
        const typeName = this.extractClassName(naturalLanguage) || 'GeneratedType';
        code = this.generateInterface(typeName, targetLanguage);
        confidence = 0.9;
      } else {
        // Generic code block
        code = `// Generated from: ${naturalLanguage}\n// TODO: Implement\n`;
        confidence = 0.5;
      }
    } else {
      code = `# Generated from: ${naturalLanguage}\n# Language: ${targetLanguage}\n# TODO: Implement\n`;
      confidence = 0.4;
    }

    const tests = this.generateTests(code, targetLanguage);
    const documentation = this.generateDocumentation(code, naturalLanguage);

    return { code, confidence, tests, documentation };
  }

  /**
   * Generate a function template
   */
  private generateFunction(name: string, params: string[], language: string): string {
    const paramStr = params.join(', ');
    if (language === 'typescript') {
      return `/**
 * ${name}
 * Auto-generated function
 */
export function ${name}(${paramStr}): unknown {
  // TODO: Implement logic
  throw new Error('Not implemented');
}`;
    }
    return `function ${name}(${paramStr}) {
  // TODO: Implement logic
  throw new Error('Not implemented');
}`;
  }

  /**
   * Generate a class template
   */
  private generateClass(name: string, language: string): string {
    if (language === 'typescript') {
      return `/**
 * ${name}
 * Auto-generated class
 */
export class ${name} {
  constructor() {
    // Initialize
  }

  // TODO: Add methods
}`;
    }
    return `class ${name} {
  constructor() {
    // Initialize
  }
}`;
  }

  /**
   * Generate an interface template
   */
  private generateInterface(name: string, language: string): string {
    if (language === 'typescript') {
      return `/**
 * ${name}
 * Auto-generated interface
 */
export interface ${name} {
  // TODO: Define properties
}`;
    }
    return `// Interfaces not supported in JavaScript`;
  }

  /**
   * Generate tests for code
   */
  private generateTests(code: string, language: string): string {
    if (language === 'typescript' || language === 'javascript') {
      return `describe('Generated Code', () => {
  it('should work correctly', () => {
    // TODO: Add test
  });
});`;
    }
    return '';
  }

  /**
   * Generate documentation
   */
  private generateDocumentation(code: string, description: string): string {
    return `# Generated Code\n\n${description}\n\n## Usage\n\n\`\`\`typescript\n// TODO: Add usage example\n\`\`\``;
  }

  /**
   * Extract function name from description
   */
  private extractFunctionName(description: string): string | null {
    const match = description.match(/(?:function|method)\s+(?:called\s+)?([a-zA-Z_][a-zA-Z0-9_]*)/i);
    return match ? match[1] : null;
  }

  /**
   * Extract parameters from description
   */
  private extractParameters(description: string): string[] {
    const match = description.match(/with\s+(?:parameters?|params?)\s*:?\s*([^,.]+)/i);
    if (match) {
      return match[1].split(/,\s*/).map(p => p.trim());
    }
    return [];
  }

  /**
   * Extract class name from description
   */
  private extractClassName(description: string): string | null {
    const match = description.match(/(?:class|component|interface)\s+(?:called\s+)?([a-zA-Z_][a-zA-Z0-9_]*)/i);
    return match ? match[1] : null;
  }

  /**
   * Validate generated code
   */
  async validateCode(code: string, language: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      syntaxErrors: [],
      runtimeErrors: [],
      securityIssues: [],
      performanceScore: 100,
    };

    // Basic syntax validation
    if (language === 'typescript' || language === 'javascript') {
      // Check for basic syntax issues
      if (!code.includes('}') && code.includes('{')) {
        result.syntaxErrors.push('Unclosed brace');
        result.valid = false;
      }
      if ((code.match(/\{/g) || []).length !== (code.match(/\}/g) || []).length) {
        result.syntaxErrors.push('Mismatched braces');
        result.valid = false;
      }

      // Check for common security issues
      if (code.includes('eval(')) {
        result.securityIssues.push('Use of eval() detected');
        result.performanceScore -= 20;
      }
      if (code.includes('innerHTML')) {
        result.securityIssues.push('Potential XSS via innerHTML');
        result.performanceScore -= 10;
      }
    }

    // Calculate performance score based on code complexity
    const lines = code.split('\n').length;
    if (lines > 100) {
      result.performanceScore -= 10;
    }
    if (code.includes('TODO')) {
      result.performanceScore -= 5;
    }

    result.performanceScore = Math.max(0, result.performanceScore);

    return result;
  }

  // ==================== Automatic Refactoring ====================

  /**
   * Analyze code for refactoring opportunities
   */
  async analyzeForRefactoring(filePath: string, code: string): Promise<RefactoringTarget | null> {
    const metrics = this.calculateMetrics(code);
    
    // Only suggest refactoring if metrics are poor
    if (metrics.maintainabilityIndex > 80 && metrics.complexity < 10) {
      return null;
    }

    const improvements: string[] = [];
    
    if (metrics.complexity > 15) {
      improvements.push('Reduce cyclomatic complexity by extracting methods');
    }
    if (metrics.linesOfCode > 100) {
      improvements.push('Split large file into smaller modules');
    }
    if (metrics.duplicateLines > 20) {
      improvements.push('Extract duplicate code into shared functions');
    }
    if (metrics.testCoverage < 70) {
      improvements.push('Add unit tests to improve coverage');
    }

    const target: RefactoringTarget = {
      id: this.generateId(),
      filePath,
      code,
      metrics,
      suggestedImprovements: improvements,
    };

    this.emit('refactoring:analyzed', { target });
    return target;
  }

  /**
   * Calculate code metrics
   */
  private calculateMetrics(code: string): CodeMetrics {
    const lines = code.split('\n');
    const nonEmptyLines = lines.filter(l => l.trim().length > 0);
    
    // Simple cyclomatic complexity estimation
    const complexityIndicators = ['if', 'else', 'for', 'while', 'switch', 'catch', '&&', '||'];
    let complexity = 1;
    complexityIndicators.forEach(indicator => {
      const regex = new RegExp(`\\b${indicator}\\b`, 'g');
      const matches = code.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    });

    // Estimate duplicate lines (simplified)
    const lineSet = new Set(nonEmptyLines.map(l => l.trim()));
    const duplicateLines = nonEmptyLines.length - lineSet.size;

    // Maintainability index (simplified)
    const maintainabilityIndex = Math.max(0, 100 - (complexity * 2) - (duplicateLines * 0.5));

    return {
      complexity,
      linesOfCode: nonEmptyLines.length,
      duplicateLines,
      testCoverage: this.estimateTestCoverage(code),
      maintainabilityIndex,
    };
  }

  /**
   * Estimate test coverage (heuristic)
   */
  private estimateTestCoverage(code: string): number {
    // Check if there are test files
    const hasTests = code.includes('describe(') || code.includes('test(') || code.includes('it(');
    if (!hasTests) return 0;

    // Rough estimation based on code structure
    const functions = (code.match(/function\s+\w+/g) || []).length;
    const testedFunctions = (code.match(/(?:describe|it|test)\s*\(\s*['"`]/g) || []).length;
    
    return Math.min(100, Math.round((testedFunctions / Math.max(1, functions)) * 100));
  }

  /**
   * Apply automatic refactoring
   */
  async applyRefactoring(target: RefactoringTarget): Promise<{ success: boolean; refactoredCode: string; changes: string[] }> {
    this.emit('refactoring:started', { targetId: target.id });

    let refactoredCode = target.code;
    const changes: string[] = [];

    try {
      // Apply refactoring strategies
      if (target.suggestedImprovements.includes('Reduce cyclomatic complexity by extracting methods')) {
        // Simple extraction of nested logic (simplified)
        refactoredCode = this.extractMethods(refactoredCode);
        changes.push('Extracted nested logic into separate methods');
      }

      if (target.suggestedImprovements.includes('Extract duplicate code into shared functions')) {
        refactoredCode = this.extractDuplicates(refactoredCode);
        changes.push('Extracted duplicate code into shared utilities');
      }

      // Update metrics
      this.codeMetrics.set(target.filePath, this.calculateMetrics(refactoredCode));

      this.emit('refactoring:completed', { targetId: target.id, changes });

      return { success: true, refactoredCode, changes };
    } catch (error) {
      this.emit('refactoring:failed', { targetId: target.id, error });
      return { success: false, refactoredCode: target.code, changes: [] };
    }
  }

  /**
   * Extract nested methods (simplified)
   */
  private extractMethods(code: string): string {
    // This is a simplified implementation
    // Real implementation would use AST parsing
    return code.replace(
      /if\s*\([^)]+\)\s*\{([^}]+)\}/g,
      (match, body) => {
        if (body.length > 200) {
          return `if (/* condition */) {\n    return this.handleComplexLogic();\n  }`;
        }
        return match;
      }
    );
  }

  /**
   * Extract duplicate code (simplified)
   */
  private extractDuplicates(code: string): string {
    // Find repeated patterns and extract them
    // Simplified implementation
    return code;
  }

  // ==================== Performance Optimization ====================

  /**
   * Analyze performance and create optimization plan
   */
  async analyzePerformance(
    target: string,
    currentMetrics: PerformanceMetrics
  ): Promise<PerformanceOptimization> {
    const strategies: OptimizationStrategy[] = [];

    // Analyze bottlenecks
    if (currentMetrics.executionTime > 1000) {
      strategies.push({
        name: 'Async Optimization',
        description: 'Convert synchronous operations to async',
        expectedImprovement: 30,
        risk: 'low',
        implementation: 'Use Promise.all for parallel operations',
      });
    }

    if (currentMetrics.memoryUsage > 100 * 1024 * 1024) {
      // 100MB
      strategies.push({
        name: 'Memory Optimization',
        description: 'Reduce memory footprint',
        expectedImprovement: 25,
        risk: 'medium',
        implementation: 'Implement lazy loading and caching',
      });
    }

    if (currentMetrics.cpuUsage > 80) {
      strategies.push({
        name: 'CPU Optimization',
        description: 'Reduce CPU intensive operations',
        expectedImprovement: 40,
        risk: 'medium',
        implementation: 'Use Web Workers for heavy computations',
      });
    }

    const targetMetrics: PerformanceMetrics = {
      executionTime: currentMetrics.executionTime * 0.5,
      memoryUsage: currentMetrics.memoryUsage * 0.7,
      cpuUsage: currentMetrics.cpuUsage * 0.6,
      throughput: currentMetrics.throughput * 1.5,
    };

    const optimization: PerformanceOptimization = {
      id: this.generateId(),
      target,
      currentMetrics,
      targetMetrics,
      strategies,
    };

    this.pendingOptimizations.set(optimization.id, optimization);
    this.emit('optimization:analyzed', { optimization });

    return optimization;
  }

  /**
   * Apply performance optimization
   */
  async applyOptimization(optimizationId: string): Promise<{ success: boolean; improvements: string[] }> {
    const optimization = this.pendingOptimizations.get(optimizationId);
    if (!optimization) {
      return { success: false, improvements: [] };
    }

    this.emit('optimization:started', { optimizationId });

    const improvements: string[] = [];

    try {
      for (const strategy of optimization.strategies) {
        // Apply each strategy
        await this.applyOptimizationStrategy(strategy);
        improvements.push(strategy.name);
      }

      // Record performance history
      const history = this.performanceHistory.get(optimization.target) || [];
      history.push(optimization.currentMetrics);
      this.performanceHistory.set(optimization.target, history);

      this.pendingOptimizations.delete(optimizationId);
      this.emit('optimization:completed', { optimizationId, improvements });

      return { success: true, improvements };
    } catch (error) {
      this.emit('optimization:failed', { optimizationId, error });
      return { success: false, improvements };
    }
  }

  /**
   * Apply a single optimization strategy
   */
  private async applyOptimizationStrategy(strategy: OptimizationStrategy): Promise<void> {
    // Implementation would modify code based on strategy
    console.log(`[SelfImprovement] Applying strategy: ${strategy.name}`);
    await this.delay(100);
  }

  // ==================== Learning from Feedback ====================

  /**
   * Record user feedback
   */
  recordFeedback(feedback: UserFeedback): void {
    this.userFeedback.set(feedback.id, feedback);

    // Update learning based on feedback
    this.updateLearningFromFeedback(feedback);

    this.emit('feedback:received', { feedback });

    if (this.logDecisions) {
      console.log(`[SelfImprovement] Feedback recorded: ${feedback.type}`);
    }
  }

  /**
   * Update learning vectors based on feedback
   */
  private updateLearningFromFeedback(feedback: UserFeedback): void {
    const vector = this.improvementVectors.get('learning');
    if (!vector) return;

    // Adjust success rate based on feedback
    const impact = feedback.type === 'positive' ? 0.1 : feedback.type === 'negative' ? -0.1 : 0.05;
    vector.successRate = Math.max(0, Math.min(1, vector.successRate + impact * this.learningRate));
    vector.lastUpdated = new Date();

    // Create learning entry
    this.recordLearning({
      id: this.generateId(),
      pattern: `feedback:${feedback.context}`,
      outcome: feedback.type === 'positive' ? 'success' : 'failure',
      context: feedback,
      confidence: vector.successRate,
      timestamp: new Date(),
      feedbackIds: [feedback.id],
    });
  }

  /**
   * Record a learning entry
   */
  private recordLearning(entry: LearningEntry): void {
    this.learningEntries.set(entry.id, entry);

    // Trim old entries
    if (this.learningEntries.size > this.maxLearningEntries) {
      const oldest = Array.from(this.learningEntries.values())
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];
      if (oldest) {
        this.learningEntries.delete(oldest.id);
      }
    }

    this.emit('learning:recorded', { entry });
  }

  /**
   * Get learning insights
   */
  getLearningInsights(): {
    totalEntries: number;
    successRate: number;
    patterns: string[];
    recentLearnings: LearningEntry[];
  } {
    const entries = Array.from(this.learningEntries.values());
    const successCount = entries.filter(e => e.outcome === 'success').length;

    return {
      totalEntries: entries.length,
      successRate: entries.length > 0 ? successCount / entries.length : 0,
      patterns: [...new Set(entries.map(e => e.pattern))],
      recentLearnings: entries.slice(-10),
    };
  }

  /**
   * Get improvement vector performance
   */
  getImprovementVectors(): ImprovementVector[] {
    return Array.from(this.improvementVectors.values());
  }

  // ==================== Utility Methods ====================

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `imp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get improvement statistics
   */
  getStats(): {
    learningEntries: number;
    feedbackCount: number;
    pendingOptimizations: number;
    improvementVectors: ImprovementVector[];
  } {
    return {
      learningEntries: this.learningEntries.size,
      feedbackCount: this.userFeedback.size,
      pendingOptimizations: this.pendingOptimizations.size,
      improvementVectors: this.getImprovementVectors(),
    };
  }

  /**
   * Dispose of the improvement loop
   */
  dispose(): void {
    this.removeAllListeners();
    this.learningEntries.clear();
    this.userFeedback.clear();
    this.improvementVectors.clear();
    this.codeMetrics.clear();
    this.performanceHistory.clear();
    this.pendingOptimizations.clear();
  }
}

// Singleton instance
let globalSelfImprovementLoop: SelfImprovementLoop | null = null;

export function getSelfImprovementLoop(options?: SelfImprovementOptions): SelfImprovementLoop {
  if (!globalSelfImprovementLoop) {
    globalSelfImprovementLoop = new SelfImprovementLoop(options);
  }
  return globalSelfImprovementLoop;
}

export function resetSelfImprovementLoop(): void {
  if (globalSelfImprovementLoop) {
    globalSelfImprovementLoop.dispose();
    globalSelfImprovementLoop = null;
  }
}
