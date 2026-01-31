/**
 * Advanced AI Capabilities
 * Code understanding, optimization, security, and more
 */

/* eslint-disable no-undef */
// @ts-ignore - base44.integrations is part of future integration
import { base44 } from '@/api/base44Client';

/**
 * Code Intelligence System
 * Deep code understanding and analysis
 */
export class CodeIntelligence {
  async analyzeCodebase(files) {
    const prompt = `Analyze this codebase and provide comprehensive insights:

Files:
${files.map(f => `${f.path}:\n${f.content.substring(0, 500)}...`).join('\n\n')}

Provide:
1. Architecture overview
2. Code quality assessment
3. Design patterns used
4. Potential improvements
5. Security concerns
6. Performance issues
7. Testing coverage gaps
8. Documentation needs

Return detailed analysis.`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            architecture: { type: 'string' },
            quality_score: { type: 'number' },
            patterns: { type: 'array', items: { type: 'string' } },
            improvements: { type: 'array', items: { type: 'string' } },
            security_concerns: { type: 'array', items: { type: 'string' } },
            performance_issues: { type: 'array', items: { type: 'string' } },
            testing_gaps: { type: 'array', items: { type: 'string' } },
            documentation_needs: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      return result;
    } catch (error) {
      console.error('Code analysis failed:', error);
      return null;
    }
  }
  
  async refactorCode(code, goal = 'improve readability') {
    const prompt = `Refactor this code to ${goal}:

Original Code:
\`\`\`
${code}
\`\`\`

Provide:
1. Refactored code
2. Explanation of changes
3. Benefits
4. Potential risks

Ensure the refactored code is production-ready and follows best practices.`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            refactored_code: { type: 'string' },
            changes_explained: { type: 'array', items: { type: 'string' } },
            benefits: { type: 'array', items: { type: 'string' } },
            risks: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      return result;
    } catch (error) {
      console.error('Code refactoring failed:', error);
      return null;
    }
  }
  
  async generateTests(code, framework = 'jest') {
    const prompt = `Generate comprehensive unit tests for this code using ${framework}:

Code to Test:
\`\`\`
${code}
\`\`\`

Generate:
1. Test suite with multiple test cases
2. Edge cases
3. Error cases
4. Mock data
5. Assertions

Aim for 80%+ code coverage.`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt
      });

      return result;
    } catch (error) {
      console.error('Test generation failed:', error);
      return null;
    }
  }
  
  async explainCode(code) {
    const prompt = `Explain this code in simple terms:

\`\`\`
${code}
\`\`\`

Provide:
1. What it does (high level)
2. How it works (step by step)
3. Key concepts used
4. Potential gotchas
5. Usage examples`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt
      });

      return result;
    } catch (error) {
      console.error('Code explanation failed:', error);
      return 'Unable to explain code';
    }
  }
}

/**
 * Performance Optimizer
 * Analyzes and optimizes performance
 */
export class PerformanceOptimizer {
  async analyzePerformance(code, metrics = {}) {
    const prompt = `Analyze performance of this code:

Code:
\`\`\`
${code}
\`\`\`

Current Metrics:
${JSON.stringify(metrics, null, 2)}

Identify:
1. Time complexity
2. Space complexity
3. Bottlenecks
4. Optimization opportunities
5. Algorithmic improvements
6. Caching strategies
7. Database query optimizations

Provide actionable recommendations with estimated improvements.`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            time_complexity: { type: 'string' },
            space_complexity: { type: 'string' },
            bottlenecks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  location: { type: 'string' },
                  issue: { type: 'string' },
                  severity: { type: 'string' }
                }
              }
            },
            optimizations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  suggestion: { type: 'string' },
                  estimated_improvement: { type: 'string' },
                  complexity: { type: 'string' }
                }
              }
            }
          }
        }
      });

      return result;
    } catch (error) {
      console.error('Performance analysis failed:', error);
      return null;
    }
  }
  
  async optimizeQueries(queries) {
    const prompt = `Optimize these database queries:

Queries:
${queries.map((q, i) => `${i + 1}. ${q}`).join('\n')}

For each query:
1. Identify inefficiencies
2. Suggest optimizations
3. Recommend indexes
4. Provide optimized version
5. Estimate performance gain`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt
      });

      return result;
    } catch (error) {
      console.error('Query optimization failed:', error);
      return null;
    }
  }
}

/**
 * Security Auditor
 * Identifies security vulnerabilities
 */
export class SecurityAuditor {
  async auditCode(code, context = {}) {
    const prompt = `Perform security audit on this code:

Code:
\`\`\`
${code}
\`\`\`

Context:
${JSON.stringify(context, null, 2)}

Check for:
1. SQL Injection
2. XSS vulnerabilities
3. CSRF protection
4. Authentication issues
5. Authorization bypasses
6. Data exposure
7. Insecure dependencies
8. Cryptographic weaknesses
9. Input validation gaps
10. API security issues

Provide severity ratings and fixes.`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            vulnerabilities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  severity: { type: 'string' },
                  location: { type: 'string' },
                  description: { type: 'string' },
                  fix: { type: 'string' },
                  cve_references: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            security_score: { type: 'number' },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      return result;
    } catch (error) {
      console.error('Security audit failed:', error);
      return {
        vulnerabilities: [],
        security_score: 0,
        recommendations: ['Unable to complete security audit']
      };
    }
  }
  
  async checkDependencies(dependencies) {
    const prompt = `Audit these dependencies for security issues:

Dependencies:
${JSON.stringify(dependencies, null, 2)}

Check for:
1. Known vulnerabilities (CVEs)
2. Outdated versions
3. License issues
4. Malicious packages
5. Unmaintained packages

Provide risk assessment and update recommendations.`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true
      });

      return result;
    } catch (error) {
      console.error('Dependency check failed:', error);
      return null;
    }
  }
}

/**
 * Architecture Advisor
 * Provides architectural guidance
 */
export class ArchitectureAdvisor {
  async recommendArchitecture(requirements) {
    const prompt = `Recommend software architecture for these requirements:

Requirements:
${JSON.stringify(requirements, null, 2)}

Consider:
1. Scalability needs
2. Performance requirements
3. Security requirements
4. Team size and expertise
5. Budget constraints
6. Time to market

Recommend:
1. Overall architecture pattern (MVC, microservices, serverless, etc.)
2. Technology stack
3. Database strategy
4. API design
5. Deployment strategy
6. Monitoring and logging
7. Pros and cons
8. Implementation roadmap`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true
      });

      return result;
    } catch (error) {
      console.error('Architecture recommendation failed:', error);
      return null;
    }
  }
  
  async reviewArchitecture(currentArchitecture, issues = []) {
    const prompt = `Review this architecture and suggest improvements:

Current Architecture:
${JSON.stringify(currentArchitecture, null, 2)}

Known Issues:
${issues.join('\n')}

Evaluate:
1. Scalability
2. Maintainability
3. Security
4. Performance
5. Cost efficiency
6. Developer experience

Provide:
1. Strengths
2. Weaknesses
3. Improvement recommendations
4. Migration strategies (if needed)
5. Estimated impact`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt
      });

      return result;
    } catch (error) {
      console.error('Architecture review failed:', error);
      return null;
    }
  }
}

/**
 * Documentation Generator
 * Automatically generates documentation
 */
export class DocumentationGenerator {
  async generateAPIDoc(apiCode) {
    const prompt = `Generate comprehensive API documentation:

API Code:
\`\`\`
${apiCode}
\`\`\`

Generate:
1. Endpoint descriptions
2. Request/response formats
3. Parameters and types
4. Example requests
5. Error responses
6. Authentication requirements
7. Rate limits
8. Best practices

Format in Markdown.`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt
      });

      return result;
    } catch (error) {
      console.error('API doc generation failed:', error);
      return null;
    }
  }
  
  async generateCodeDoc(code, language = 'javascript') {
    const prompt = `Generate inline documentation for this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Add:
1. JSDoc/docstring comments
2. Parameter descriptions
3. Return type documentation
4. Usage examples
5. Notes about edge cases

Maintain original code logic.`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt
      });

      return result;
    } catch (error) {
      console.error('Code doc generation failed:', error);
      return null;
    }
  }
  
  async generateReadme(projectInfo) {
    const prompt = `Generate a comprehensive README.md:

Project Info:
${JSON.stringify(projectInfo, null, 2)}

Include:
1. Project title and description
2. Features
3. Installation instructions
4. Usage examples
5. API documentation
6. Configuration
7. Contributing guidelines
8. License
9. Credits

Make it professional and well-formatted.`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt
      });

      return result;
    } catch (error) {
      console.error('README generation failed:', error);
      return null;
    }
  }
}

/**
 * Debugging Assistant
 * Helps debug issues and errors
 */
export class DebuggingAssistant {
  async analyzeError(error, code, stackTrace) {
    const prompt = `Debug this error:

Error: ${error}

Code:
\`\`\`
${code}
\`\`\`

Stack Trace:
\`\`\`
${stackTrace}
\`\`\`

Provide:
1. Root cause analysis
2. Why it happened
3. How to fix it
4. How to prevent it
5. Related issues to check
6. Fixed code

Be specific and actionable.`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            root_cause: { type: 'string' },
            explanation: { type: 'string' },
            fix: { type: 'string' },
            fixed_code: { type: 'string' },
            prevention: { type: 'array', items: { type: 'string' } },
            related_checks: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      return result;
    } catch (error) {
      console.error('Error analysis failed:', error);
      return null;
    }
  }
  
  async suggestDebuggingSteps(issue) {
    const prompt = `Suggest debugging steps for this issue:

Issue: ${issue}

Provide:
1. Information to gather
2. Tools to use
3. Step-by-step debugging process
4. Common pitfalls
5. When to escalate`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt
      });

      return result;
    } catch (error) {
      console.error('Debugging suggestions failed:', error);
      return null;
    }
  }
}

// Export singleton instances
export const codeIntelligence = new CodeIntelligence();
export const performanceOptimizer = new PerformanceOptimizer();
export const securityAuditor = new SecurityAuditor();
export const architectureAdvisor = new ArchitectureAdvisor();
export const documentationGenerator = new DocumentationGenerator();
export const debuggingAssistant = new DebuggingAssistant();
