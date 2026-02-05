import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Code, FileText, Terminal, Folder, Download, Sparkles } from 'lucide-react';

export default function ClawdBotBuilder({ userEmail, onAgentCreated }) {
  const [formData, setFormData] = useState({
    agent_name: '',
    description: '',
    coding_languages: [],
    file_permissions: {
      read_files: true,
      write_files: true,
      create_files: true,
      delete_files: false,
      allowed_extensions: ['*']
    },
    system_permissions: {
      execute_commands: false,
      install_packages: false,
      git_operations: true,
      browser_access: false
    },
    capabilities: {
      code_generation: true,
      code_review: true,
      debugging: true,
      refactoring: true,
      documentation: true,
      testing: true
    }
  });
  const [creating, setCreating] = useState(false);

  const languageOptions = [
    'JavaScript', 'Python', 'TypeScript', 'Java', 'C++', 'C#',
    'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin'
  ];

  const toggleLanguage = (lang) => {
    setFormData(prev => ({
      ...prev,
      coding_languages: prev.coding_languages.includes(lang)
        ? prev.coding_languages.filter(l => l !== lang)
        : [...prev.coding_languages, lang]
    }));
  };

  const createCodingAgent = async () => {
    if (!formData.agent_name) {
      alert('Please enter an agent name');
      return;
    }

    setCreating(true);
    try {
      const agent = await base44.entities.CustomAgent.create({
        user_id: userEmail,
        agent_name: formData.agent_name,
        description: formData.description || 'AI Coding Assistant',
        goal: 'Help users with coding tasks, file management, and software development',
        parameters: {
          personality: 'helpful and precise',
          expertise_domain: 'software development',
          response_style: 'clear and technical',
          temperature: 0.3,
          creativity: 0.5,
          accuracy: 0.95
        },
        custom_tools: [
          {
            name: 'file_reader',
            type: 'function',
            enabled: formData.file_permissions.read_files
          },
          {
            name: 'file_writer',
            type: 'function',
            enabled: formData.file_permissions.write_files
          },
          {
            name: 'command_executor',
            type: 'function',
            enabled: formData.system_permissions.execute_commands
          },
          {
            name: 'git_operations',
            type: 'function',
            enabled: formData.system_permissions.git_operations
          }
        ],
        safety_guardrails: {
          content_filtering: true,
          rate_limiting: true,
          max_response_length: 4000,
          blocked_topics: []
        },
        prompting_strategy: {
          use_meta_prompts: true,
          chain_of_thought: true,
          system_instructions: generateSystemInstructions(formData)
        },
        agent_type: 'coding_assistant',
        coding_config: {
          languages: formData.coding_languages,
          file_permissions: formData.file_permissions,
          system_permissions: formData.system_permissions,
          capabilities: formData.capabilities
        }
      });

      onAgentCreated?.(agent);
      alert('Coding assistant created! Now download it as desktop app.');
    } catch (error) {
      console.error('Failed to create agent:', error);
      alert('Failed to create agent: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="w-5 h-5 text-blue-600" />
          Create Your Coding Assistant
        </CardTitle>
        <p className="text-xs text-gray-600">
          Build your own ClawdBot-style AI that can read/write files and help with coding
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Info */}
        <div>
          <label className="text-xs font-semibold text-gray-700">Agent Name</label>
          <Input
            placeholder="e.g., MyClawdBot, CodeHelper"
            value={formData.agent_name}
            onChange={(e) => setFormData(prev => ({ ...prev, agent_name: e.target.value }))}
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700">Description (Optional)</label>
          <Textarea
            placeholder="What will your coding assistant do?"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="mt-1 h-16"
          />
        </div>

        {/* Programming Languages */}
        <div>
          <label className="text-xs font-semibold text-gray-700 mb-2 block">
            Programming Languages
          </label>
          <div className="flex flex-wrap gap-2">
            {languageOptions.map(lang => (
              <Badge
                key={lang}
                variant={formData.coding_languages.includes(lang) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleLanguage(lang)}
              >
                {lang}
              </Badge>
            ))}
          </div>
        </div>

        {/* File Permissions */}
        <div className="p-3 bg-white rounded-lg border">
          <div className="flex items-center gap-2 mb-3">
            <Folder className="w-4 h-4 text-blue-600" />
            <label className="text-xs font-semibold text-gray-700">File Permissions</label>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs">Read Files</span>
              <Switch
                checked={formData.file_permissions.read_files}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  file_permissions: { ...prev.file_permissions, read_files: checked }
                }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">Write/Edit Files</span>
              <Switch
                checked={formData.file_permissions.write_files}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  file_permissions: { ...prev.file_permissions, write_files: checked }
                }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">Create New Files</span>
              <Switch
                checked={formData.file_permissions.create_files}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  file_permissions: { ...prev.file_permissions, create_files: checked }
                }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-red-600">Delete Files</span>
              <Switch
                checked={formData.file_permissions.delete_files}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  file_permissions: { ...prev.file_permissions, delete_files: checked }
                }))}
              />
            </div>
          </div>
        </div>

        {/* System Permissions */}
        <div className="p-3 bg-white rounded-lg border">
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="w-4 h-4 text-purple-600" />
            <label className="text-xs font-semibold text-gray-700">System Access</label>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs">Run Terminal Commands</span>
              <Switch
                checked={formData.system_permissions.execute_commands}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  system_permissions: { ...prev.system_permissions, execute_commands: checked }
                }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">Install Packages</span>
              <Switch
                checked={formData.system_permissions.install_packages}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  system_permissions: { ...prev.system_permissions, install_packages: checked }
                }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">Git Operations</span>
              <Switch
                checked={formData.system_permissions.git_operations}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  system_permissions: { ...prev.system_permissions, git_operations: checked }
                }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">Browser Access</span>
              <Switch
                checked={formData.system_permissions.browser_access}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  system_permissions: { ...prev.system_permissions, browser_access: checked }
                }))}
              />
            </div>
          </div>
        </div>

        {/* Capabilities */}
        <div className="p-3 bg-white rounded-lg border">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-yellow-600" />
            <label className="text-xs font-semibold text-gray-700">AI Capabilities</label>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(formData.capabilities).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs capitalize">{key.replace(/_/g, ' ')}</span>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    capabilities: { ...prev.capabilities, [key]: checked }
                  }))}
                />
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={createCodingAgent}
          disabled={creating}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white"
        >
          {creating ? 'Creating...' : 'Create Coding Assistant'}
        </Button>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-900">
            <strong>💡 Next Step:</strong> After creating, click "Export" → "Desktop App" to download 
            your coding assistant as a standalone application with GUI!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function generateSystemInstructions(formData) {
  const langs = formData.coding_languages.join(', ') || 'multiple programming languages';
  const capabilities = Object.entries(formData.capabilities)
    .filter(([_, enabled]) => enabled)
    .map(([cap, _]) => cap.replace(/_/g, ' '))
    .join(', ');

  return `ADVANCED CODING ASSISTANT - DEEP TECHNICAL UNDERSTANDING

PRIMARY LANGUAGES: ${langs}
ACTIVE CAPABILITIES: ${capabilities}

COGNITIVE FRAMEWORK:
- Context Awareness: Understand project structure, dependencies, and patterns
- Multi-File Reasoning: Track relationships across codebase
- Pattern Recognition: Identify code smells, anti-patterns, and optimization opportunities
- Predictive Analysis: Anticipate edge cases and potential bugs

FILE SYSTEM ACCESS:
✓ Read: ${formData.file_permissions.read_files ? 'Enabled' : 'Disabled'}
✓ Write/Edit: ${formData.file_permissions.write_files ? 'Enabled' : 'Disabled'}
✓ Create: ${formData.file_permissions.create_files ? 'Enabled' : 'Disabled'}
⚠ Delete: ${formData.file_permissions.delete_files ? 'ENABLED - USE WITH EXTREME CAUTION' : 'Disabled'}

SYSTEM INTEGRATION:
• Command Execution: ${formData.system_permissions.execute_commands ? 'Available' : 'Restricted'}
• Package Management: ${formData.system_permissions.install_packages ? 'Available' : 'Restricted'}
• Git Operations: ${formData.system_permissions.git_operations ? 'Available' : 'Restricted'}
• Browser Access: ${formData.system_permissions.browser_access ? 'Available' : 'Restricted'}

ENHANCED PROTOCOLS:
1. SAFETY FIRST: Always confirm destructive operations (delete, overwrite, execute)
2. EXPLAIN THOROUGHLY: Provide clear reasoning with inline documentation
3. BEST PRACTICES: Follow language-specific conventions and security standards
4. CODE QUALITY: Prioritize readability, maintainability, and performance
5. ERROR HANDLING: Implement robust error handling and validation
6. TESTING MINDSET: Suggest test cases and edge case handling
7. SECURITY AWARE: Check for vulnerabilities and unsafe patterns
8. DOCUMENTATION: Generate helpful comments and documentation

ADVANCED BEHAVIORS:
- When reading code: Analyze patterns, dependencies, and potential improvements
- When writing code: Consider scalability, security, and maintainability
- When debugging: Use systematic approach with hypothesis testing
- When refactoring: Preserve functionality while improving structure
- When reviewing: Look for bugs, security issues, and optimization opportunities

CONTEXTUAL UNDERSTANDING:
- Infer project type from file structure and dependencies
- Adapt coding style to match existing codebase conventions
- Recognize framework-specific patterns and best practices
- Understand business logic from code comments and naming

REMEMBER: You have real file system access. Every action has consequences. Be precise, be careful, be helpful.`;
}