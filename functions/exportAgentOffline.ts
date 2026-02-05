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

    if (export_type === 'desktop') {
      // Desktop application with installer
      exportPackage = {
        version: '1.0',
        type: 'desktop_app',
        agent: {
          name: agent.agent_name,
          description: agent.description,
          goal: agent.goal,
          parameters: agent.parameters,
          version: agent.version
        },
        training_data: agent.training_data || [],
        custom_tools: agent.custom_tools || [],
        safety_guardrails: agent.safety_guardrails || {},
        prompting_strategy: agent.prompting_strategy || {},
        system_prompt: generateSystemPrompt(agent),
        
        // Electron app configuration
        electron_config: {
          app_name: agent.agent_name,
          app_id: `com.agent.${agent.agent_name.toLowerCase().replace(/\s+/g, '')}`,
          version: '1.0.0',
          author: user.email,
          description: agent.description
        },
        
        // Built-in UI templates
        ui_templates: {
          chat_interface: generateChatUI(agent),
          settings_page: generateSettingsUI(agent),
          onboarding: generateOnboardingUI(agent)
        },
        
        // Auto-installer configuration
        installer_config: {
          windows: {
            type: 'nsis',
            include_portable: true
          },
          mac: {
            type: 'dmg',
            sign: false
          },
          linux: {
            types: ['AppImage', 'deb']
          }
        },
        
        // Pre-bundled local LLM config
        bundled_ai: {
          model: 'tinyllama-1.1b',
          quantization: 'q4',
          size_mb: 637,
          download_on_first_run: true
        }
      };

      readme = generateDesktopReadme(agent);

    } else if (export_type === 'standalone') {
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

function generateDesktopReadme(agent) {
  return `# ${agent.agent_name} - Desktop Application

## 🎉 Easy Installation Guide

### For Windows Users:
1. Extract the ZIP file
2. Run \`${agent.agent_name}-Setup.exe\`
3. Follow the simple 3-step installer
4. Done! Find ${agent.agent_name} in your Start Menu

### For Mac Users:
1. Open the downloaded DMG file
2. Drag ${agent.agent_name} to Applications folder
3. Launch from Launchpad
4. Done!

### For Linux Users:
1. Make the AppImage executable: \`chmod +x ${agent.agent_name}.AppImage\`
2. Double-click to run
3. Done!

## 🚀 First Time Setup

When you open ${agent.agent_name} for the first time:

1. **Welcome Screen** - Click "Get Started"
2. **AI Model Download** - The app will download a small AI model (~600MB)
   - This happens automatically
   - Takes 2-5 minutes depending on your internet
3. **Ready to Chat!** - Start talking to your AI

## 💬 How to Use

Simply type your messages in the chat box and press Enter. Your AI will respond instantly!

- **100% Private** - Everything runs on your computer
- **No Internet Required** - Works completely offline (after initial setup)
- **No Coding** - Just chat like you would with any messaging app

## 🔧 Settings

Click the gear icon (⚙️) to:
- Adjust response speed
- Change AI personality
- Enable/disable features
- Check for updates

## ❓ Troubleshooting

**App won't start?**
- Make sure you have at least 2GB free disk space
- Try running as administrator (Windows) or with sudo (Linux)

**AI responses slow?**
- Close other heavy applications
- Check Settings → Performance → Enable "Fast Mode"

**Need help?**
- Click Help → Support in the app menu
- Or email: support@example.com

## 📊 System Requirements

- **Windows:** Windows 10 or later (64-bit)
- **Mac:** macOS 10.15 or later
- **Linux:** Any modern distribution (64-bit)
- **RAM:** 4GB minimum, 8GB recommended
- **Disk Space:** 2GB free space

## 🔄 Updates

The app checks for updates automatically. When an update is available, you'll see a notification - just click "Update" and it installs itself!

---

**Generated:** ${new Date().toISOString()}

**Version:** ${agent.version || 1}

Enjoy your personal AI assistant! 🤖✨
`;
}

function generateChatUI(agent) {
  return {
    html: `
<!DOCTYPE html>
<html>
<head>
  <title>${agent.agent_name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; height: 100vh; display: flex; flex-direction: column; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
    .header h1 { font-size: 24px; margin-bottom: 5px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .chat-container { flex: 1; overflow-y: auto; padding: 20px; }
    .message { margin-bottom: 20px; display: flex; gap: 10px; }
    .message.user { justify-content: flex-end; }
    .message-content { max-width: 70%; padding: 12px 16px; border-radius: 18px; }
    .message.user .message-content { background: #667eea; color: white; }
    .message.ai .message-content { background: white; color: #333; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .input-container { padding: 20px; background: white; border-top: 1px solid #e0e0e0; display: flex; gap: 10px; }
    .input-container input { flex: 1; padding: 12px; border: 2px solid #e0e0e0; border-radius: 24px; font-size: 14px; outline: none; }
    .input-container input:focus { border-color: #667eea; }
    .input-container button { padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 24px; cursor: pointer; font-weight: 600; }
    .input-container button:hover { background: #5568d3; }
    .typing { opacity: 0.6; font-style: italic; }
  </style>
</head>
<body>
  <div class="header">
    <h1>💬 ${agent.agent_name}</h1>
    <p>${agent.description}</p>
  </div>
  <div class="chat-container" id="chat"></div>
  <div class="input-container">
    <input type="text" id="input" placeholder="Type your message..." />
    <button onclick="sendMessage()">Send</button>
  </div>
</body>
</html>
    `,
    javascript: `// Chat logic integrated in Electron main process`
  };
}

function generateSettingsUI(agent) {
  return {
    html: `Simple settings UI with sliders for temperature, response length, etc.`
  };
}

function generateOnboardingUI(agent) {
  return {
    steps: [
      {
        title: "Welcome to " + agent.agent_name,
        description: "Your personal AI assistant is ready to help!",
        icon: "🎉"
      },
      {
        title: "Downloading AI Brain",
        description: "First time setup - downloading the AI model...",
        icon: "🧠"
      },
      {
        title: "All Set!",
        description: "You're ready to start chatting. Everything runs privately on your device.",
        icon: "✅"
      }
    ]
  };
}