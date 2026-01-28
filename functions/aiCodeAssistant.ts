/**
 * AI Code Assistant Chat
 * Interactive AI assistant for code help, debugging, and architecture
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Chat history storage (use database in production)
const chatHistory = new Map();

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  context?: {
    file?: string;
    function?: string;
    error?: string;
    code?: string;
  };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, message, sessionId, context } = await req.json();

    const session = sessionId || user.id;

    switch (action) {
      case 'sendMessage': {
        if (!message) {
          return Response.json({ error: 'Missing message' }, { status: 400 });
        }

        // Get or create chat history
        let history = chatHistory.get(session) || [];

        // Add user message
        const userMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'user',
          content: message,
          timestamp: new Date(),
          context
        };
        history.push(userMessage);

        // Generate AI response based on context
        const aiResponse = await generateAIResponse(message, context, history);

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        };
        history.push(assistantMessage);

        // Keep last 50 messages
        if (history.length > 50) {
          history = history.slice(-50);
        }

        chatHistory.set(session, history);

        return Response.json({
          message: assistantMessage,
          history: history.slice(-10) // Return last 10 messages
        }, { status: 200 });
      }

      case 'getHistory': {
        const history = chatHistory.get(session) || [];
        return Response.json({ history }, { status: 200 });
      }

      case 'clearHistory': {
        chatHistory.delete(session);
        return Response.json({ success: true }, { status: 200 });
      }

      case 'analyzeCode': {
        if (!context || !context.code) {
          return Response.json({ error: 'Missing code to analyze' }, { status: 400 });
        }

        const analysis = await analyzeCode(context.code, context.language);

        return Response.json({ analysis }, { status: 200 });
      }

      case 'debugError': {
        if (!context || !context.error) {
          return Response.json({ error: 'Missing error details' }, { status: 400 });
        }

        const suggestions = await debugError(context.error, context.code);

        return Response.json({ suggestions }, { status: 200 });
      }

      case 'suggestArchitecture': {
        const { requirements } = context || {};
        const architecture = await suggestArchitecture(requirements);

        return Response.json({ architecture }, { status: 200 });
      }

      case 'refactorCode': {
        if (!context || !context.code) {
          return Response.json({ error: 'Missing code to refactor' }, { status: 400 });
        }

        const refactored = await refactorCode(context.code, context.language, context.style);

        return Response.json({ refactored }, { status: 200 });
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('AI Assistant error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Generate AI response based on context
 */
async function generateAIResponse(message: string, context: any, history: ChatMessage[]): Promise<string> {
  // In production, integrate with OpenAI, Claude, or custom LLM
  
  // Determine intent
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('error') || lowerMessage.includes('bug')) {
    return `I can help you debug that error. Based on the context, here are some common causes and solutions:

1. **Check variable scope**: Ensure all variables are properly declared
2. **Type mismatches**: Verify data types match expected inputs
3. **Async issues**: Make sure you're awaiting promises correctly

Would you like me to analyze the specific code or error message?`;
  }
  
  if (lowerMessage.includes('optimize') || lowerMessage.includes('performance')) {
    return `For performance optimization, consider:

1. **Memoization**: Cache expensive computation results
2. **Lazy loading**: Load resources only when needed
3. **Code splitting**: Break large bundles into smaller chunks
4. **Database indexing**: Add indexes for frequently queried fields

What specific area would you like to optimize?`;
  }
  
  if (lowerMessage.includes('architecture') || lowerMessage.includes('design')) {
    return `For architecture design, I recommend:

1. **Modular structure**: Separate concerns into clear modules
2. **Clean interfaces**: Define clear APIs between components
3. **Scalability**: Design for growth from the start
4. **Testing**: Build testability into the architecture

What kind of system are you building?`;
  }
  
  if (lowerMessage.includes('security')) {
    return `Security best practices:

1. **Input validation**: Always validate and sanitize user input
2. **Authentication**: Use strong auth mechanisms (JWT, OAuth)
3. **Authorization**: Implement role-based access control
4. **Encryption**: Encrypt sensitive data at rest and in transit

What security aspect are you concerned about?`;
  }
  
  // Default helpful response
  return `I'm here to help! I can assist with:

- **Debugging**: Find and fix errors in your code
- **Code review**: Suggest improvements and best practices
- **Architecture**: Design scalable system architectures
- **Performance**: Optimize code for speed and efficiency
- **Security**: Implement secure coding practices
- **Refactoring**: Clean up and modernize code

What would you like help with?`;
}

/**
 * Analyze code for issues and improvements
 */
async function analyzeCode(code: string, language: string): Promise<any> {
  const issues = [];
  const suggestions = [];
  const metrics = {
    lines: code.split('\n').length,
    complexity: 0,
    maintainability: 0
  };

  // Simple heuristic analysis
  if (code.length > 500) {
    suggestions.push('Consider breaking this into smaller functions');
  }

  if (code.includes('any') && language === 'typescript') {
    issues.push({
      severity: 'warning',
      message: 'Avoid using "any" type - it defeats TypeScript\'s type safety',
      line: code.indexOf('any')
    });
  }

  if (code.includes('console.log')) {
    suggestions.push('Remove console.log statements before production');
  }

  if (!code.includes('try') && code.includes('await')) {
    issues.push({
      severity: 'error',
      message: 'Missing error handling for async operations',
      line: code.indexOf('await')
    });
  }

  return {
    issues,
    suggestions,
    metrics,
    score: 75 // Example score
  };
}

/**
 * Debug error and provide suggestions
 */
async function debugError(error: string, code?: string): Promise<any> {
  const suggestions = [];

  if (error.includes('Cannot read property') || error.includes('undefined')) {
    suggestions.push({
      title: 'Null/Undefined Check',
      description: 'Add null/undefined checks before accessing properties',
      code: 'if (obj && obj.property) { ... }'
    });
  }

  if (error.includes('not a function')) {
    suggestions.push({
      title: 'Function Existence Check',
      description: 'Verify the function exists and is called correctly',
      code: 'if (typeof obj.method === "function") { obj.method(); }'
    });
  }

  if (error.includes('Promise') || error.includes('async')) {
    suggestions.push({
      title: 'Async/Await Handling',
      description: 'Ensure promises are properly awaited',
      code: 'try { const result = await asyncFunction(); } catch (err) { console.error(err); }'
    });
  }

  return {
    error,
    suggestions,
    possibleCauses: [
      'Variable not initialized',
      'Incorrect data type',
      'Missing import or dependency',
      'Timing issue with async code'
    ]
  };
}

/**
 * Suggest architecture for requirements
 */
async function suggestArchitecture(requirements: string): Promise<any> {
  return {
    recommendation: 'Microservices Architecture',
    components: [
      {
        name: 'API Gateway',
        purpose: 'Single entry point for all client requests',
        technology: 'Express.js / Fastify'
      },
      {
        name: 'Service Layer',
        purpose: 'Business logic and data processing',
        technology: 'Node.js / TypeScript'
      },
      {
        name: 'Data Layer',
        purpose: 'Database and caching',
        technology: 'PostgreSQL / Redis'
      },
      {
        name: 'Queue System',
        purpose: 'Async job processing',
        technology: 'Bull / RabbitMQ'
      }
    ],
    diagram: `
    ┌─────────────┐
    │  Clients    │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │ API Gateway │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │  Services   │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │  Database   │
    └─────────────┘
    `
  };
}

/**
 * Refactor code for better quality
 */
async function refactorCode(code: string, language: string, style?: string): Promise<any> {
  // In production, use AI to refactor
  // For now, return example suggestions
  return {
    original: code,
    refactored: code, // Would be refactored version
    changes: [
      'Extracted magic numbers to constants',
      'Improved variable naming',
      'Added type annotations',
      'Simplified conditional logic'
    ],
    diff: '// Diff would be shown here'
  };
}
