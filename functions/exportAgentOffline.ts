import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agent_id, export_type } = await req.json();

    if (!agent_id || !export_type) {
      return Response.json({ error: 'Missing agent_id or export_type' }, { status: 400 });
    }

    // Get agent details
    const agents = await base44.entities.CustomAgent.filter({ id: agent_id });
    
    if (!agents || agents.length === 0) {
      return Response.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = agents[0];

    // Verify ownership
    if (agent.user_id !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let exportPackage = {};
    let readme = '';

    if (export_type === 'standalone') {
      // Standalone package for local LLMs
      exportPackage = {
        version: '1.0',
        type: 'standalone_agent',
        agent: {
          name: agent.agent_name,
          description: agent.description,
          goal: agent.goal,
          parameters: agent.parameters,
          version: agent.version
        },
        training_data: agent.training_data || [],
        performance_metrics: agent.performance_metrics,
        system_prompt: generateSystemPrompt(agent),
        ollama_config: {
          model: 'llama3.1',
          temperature: agent.parameters?.temperature || 0.7,
          top_p: 0.9,
          repeat_penalty: 1.1
        },
        lm_studio_config: {
          model_path: './models',
          temperature: agent.parameters?.temperature || 0.7,
          max_tokens: 2048
        }
      };

      readme = generateStandaloneReadme(agent);

    } else if (export_type === 'api') {
      // API integration format
      exportPackage = {
        version: '1.0',
        type: 'api_agent',
        agent: {
          name: agent.agent_name,
          description: agent.description,
          goal: agent.goal,
          parameters: agent.parameters
        },
        system_prompt: generateSystemPrompt(agent),
        openai_config: {
          model: 'gpt-4',
          temperature: agent.parameters?.temperature || 0.7,
          max_tokens: 2048
        },
        anthropic_config: {
          model: 'claude-3-sonnet-20240229',
          temperature: agent.parameters?.temperature || 0.7,
          max_tokens: 2048
        }
      };

      readme = generateAPIReadme(agent);

    } else if (export_type === 'python') {
      // Python script export
      const pythonScript = generatePythonScript(agent);
      
      exportPackage = {
        version: '1.0',
        type: 'python_agent',
        agent: {
          name: agent.agent_name,
          description: agent.description,
          goal: agent.goal,
          parameters: agent.parameters
        },
        script: pythonScript,
        requirements: [
          'openai>=1.0.0',
          'anthropic>=0.8.0',
          'python-dotenv>=1.0.0'
        ]
      };

      readme = generatePythonReadme(agent);
    }

    return Response.json({
      success: true,
      package: exportPackage,
      readme: readme
    });

  } catch (error) {
    console.error('Export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateSystemPrompt(agent) {
  return `You are ${agent.agent_name}, an AI assistant with the following characteristics:

Goal: ${agent.goal}

Description: ${agent.description}

Personality: ${agent.parameters?.personality || 'Professional and helpful'}
Expertise Domain: ${agent.parameters?.expertise_domain || 'General knowledge'}
Response Style: ${agent.parameters?.response_style || 'Clear and concise'}

Guidelines:
- Stay focused on your primary goal
- Provide accurate and helpful responses
- Maintain consistency with your personality traits
- Leverage your expertise in ${agent.parameters?.expertise_domain || 'various domains'}

Remember: You are designed to be ${agent.parameters?.personality || 'professional'} and ${agent.parameters?.response_style || 'clear'} in all interactions.`;
}

function generateStandaloneReadme(agent) {
  return `# ${agent.agent_name} - Offline Agent

## Description
${agent.description}

## Setup Instructions

### Option 1: Using Ollama (Recommended)
1. Install Ollama: https://ollama.ai
2. Pull a model: \`ollama pull llama3.1\`
3. Run the agent:
\`\`\`bash
ollama run llama3.1 --system "$(cat system_prompt.txt)"
\`\`\`

### Option 2: Using LM Studio
1. Download LM Studio: https://lmstudio.ai
2. Download a compatible model
3. Load the system prompt from this package
4. Start chatting with your agent

## Configuration
- Temperature: ${agent.parameters?.temperature || 0.7}
- Creativity: ${agent.parameters?.creativity || 0.6}
- Accuracy Focus: ${agent.parameters?.accuracy || 0.8}

## Privacy
This agent runs 100% offline. No data is sent to external servers.

## Performance Metrics
- Current Accuracy: ${((agent.performance_metrics?.accuracy || 0) * 100).toFixed(0)}%
- User Satisfaction: ${((agent.performance_metrics?.user_satisfaction || 0) * 100).toFixed(0)}%
- Training Iterations: ${agent.performance_metrics?.training_iterations || 0}

Generated: ${new Date().toISOString()}
`;
}

function generateAPIReadme(agent) {
  return `# ${agent.agent_name} - API Integration

## Description
${agent.description}

## Setup Instructions

### Using OpenAI
\`\`\`javascript
const OpenAI = require('openai');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const response = await client.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: 'Your message here' }
  ],
  temperature: ${agent.parameters?.temperature || 0.7}
});
\`\`\`

### Using Anthropic Claude
\`\`\`javascript
const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const response = await client.messages.create({
  model: 'claude-3-sonnet-20240229',
  max_tokens: 2048,
  system: SYSTEM_PROMPT,
  messages: [{ role: 'user', content: 'Your message here' }]
});
\`\`\`

## Environment Variables
Create a \`.env\` file:
\`\`\`
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
\`\`\`

Generated: ${new Date().toISOString()}
`;
}

function generatePythonScript(agent) {
  return `#!/usr/bin/env python3
"""
${agent.agent_name}
${agent.description}
"""

import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = """${generateSystemPrompt(agent).replace(/"/g, '\\"')}"""

def run_agent(user_input: str) -> str:
    """Run the agent with user input"""
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    response = client.chat.completions.create(
        model='gpt-4',
        messages=[
            {'role': 'system', 'content': SYSTEM_PROMPT},
            {'role': 'user', 'content': user_input}
        ],
        temperature=${agent.parameters?.temperature || 0.7},
        max_tokens=2048
    )
    
    return response.choices[0].message.content

def main():
    """Main CLI loop"""
    print(f"${agent.agent_name} - Ready!")
    print(f"Goal: ${agent.goal}")
    print("Type 'exit' to quit\\n")
    
    while True:
        user_input = input("You: ")
        if user_input.lower() in ['exit', 'quit']:
            break
            
        response = run_agent(user_input)
        print(f"\\n{agent.agent_name}: {response}\\n")

if __name__ == '__main__':
    main()
`;
}

function generatePythonReadme(agent) {
  return `# ${agent.agent_name} - Python Agent

## Description
${agent.description}

## Installation
\`\`\`bash
pip install -r requirements.txt
\`\`\`

## Configuration
Create a \`.env\` file:
\`\`\`
OPENAI_API_KEY=your_key_here
\`\`\`

## Usage
\`\`\`bash
python agent.py
\`\`\`

## Deployment
Deploy to any server or cloud platform that supports Python.

### Docker
\`\`\`dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["python", "agent.py"]
\`\`\`

Generated: ${new Date().toISOString()}
`;
}