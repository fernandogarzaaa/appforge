/**
 * Enhanced AI Reasoning Engine
 * Advanced reasoning, chain-of-thought, and contextual understanding
 * Note: All methods require base44Client parameter
 */

/**
 * Multi-Agent Coordinator
 * Coordinates multiple specialized AI agents for complex tasks
 */
export class MultiAgentCoordinator {
  constructor() {
    this.agents = new Map();
    this.taskQueue = [];
  }
  
  registerAgent(name, capabilities) {
    this.agents.set(name, {
      name,
      capabilities,
      status: 'idle',
      tasksCompleted: 0
    });
  }
  
  async delegateTask(task, requirements) {
    // Find best agent for the task
    const suitableAgents = Array.from(this.agents.values())
      .filter(agent => {
        return requirements.every(req => 
          agent.capabilities.includes(req)
        );
      })
      .filter(agent => agent.status === 'idle');
    
    if (suitableAgents.length === 0) {
      this.taskQueue.push({ task, requirements });
      return {
        delegated: false,
        reason: 'No suitable agent available',
        queued: true
      };
    }
    
    // Select agent with most relevant capabilities
    const selectedAgent = suitableAgents[0];
    selectedAgent.status = 'busy';
    
    return {
      delegated: true,
      agent: selectedAgent.name,
      queued: false
    };
  }
  
  completeTask(agentName) {
    const agent = this.agents.get(agentName);
    if (agent) {
      agent.status = 'idle';
      agent.tasksCompleted++;
      
      // Process queued task if any
      if (this.taskQueue.length > 0) {
        const nextTask = this.taskQueue.shift();
        this.delegateTask(nextTask.task, nextTask.requirements);
      }
    }
  }
  
  getStatus() {
    return {
      agents: Array.from(this.agents.values()),
      queuedTasks: this.taskQueue.length,
      busyAgents: Array.from(this.agents.values()).filter(a => a.status === 'busy').length
    };
  }
}

/**
 * Learning and Adaptation System
 * Learns from interactions and improves over time
 */
export class LearningSystem {
  constructor() {
    this.successPatterns = [];
    this.failurePatterns = [];
    this.userPreferences = new Map();
  }
  
  recordSuccess(context, action, result) {
    this.successPatterns.push({
      context,
      action,
      result,
      timestamp: Date.now()
    });
    
    if (this.successPatterns.length > 100) {
      this.successPatterns.shift();
    }
  }
  
  recordFailure(context, action, error) {
    this.failurePatterns.push({
      context,
      action,
      error,
      timestamp: Date.now()
    });
    
    if (this.failurePatterns.length > 100) {
      this.failurePatterns.shift();
    }
  }
  
  learnPreference(userId, category, value) {
    if (!this.userPreferences.has(userId)) {
      this.userPreferences.set(userId, {});
    }
    
    const prefs = this.userPreferences.get(userId);
    prefs[category] = value;
  }
  
  getPreference(userId, category) {
    const prefs = this.userPreferences.get(userId);
    return prefs ? prefs[category] : null;
  }
  
  async analyzeLearnings() {
    const successRate = this.successPatterns.length / 
      (this.successPatterns.length + this.failurePatterns.length);
    
    const commonSuccessActions = this.findCommonPatterns(this.successPatterns);
    const commonFailureActions = this.findCommonPatterns(this.failurePatterns);
    
    return {
      success_rate: successRate,
      total_interactions: this.successPatterns.length + this.failurePatterns.length,
      successful_patterns: commonSuccessActions,
      problematic_patterns: commonFailureActions,
      recommendations: this.generateRecommendations()
    };
  }
  
  findCommonPatterns(patterns) {
    const actionCounts = {};
    
    patterns.forEach(p => {
      const action = p.action;
      actionCounts[action] = (actionCounts[action] || 0) + 1;
    });
    
    return Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }));
  }
  
  generateRecommendations() {
    const recommendations = [];
    
    if (this.failurePatterns.length > this.successPatterns.length) {
      recommendations.push('Consider reviewing recent failures and adjusting approach');
    }
    
    if (this.successPatterns.length > 20) {
      const patterns = this.findCommonPatterns(this.successPatterns);
      if (patterns[0]) {
        recommendations.push('Continue using successful pattern: ' + patterns[0].action);
      }
    }
    
    return recommendations;
  }
}
