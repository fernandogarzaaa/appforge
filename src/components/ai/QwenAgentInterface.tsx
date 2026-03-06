import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Bot, 
  MessageSquare, 
  Code, 
  Globe, 
  Cpu,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

// Note: Import will be handled dynamically to avoid build errors
// import { qwenAgent } from '@/api/qwenAgentService';

const AGENT_MODES = [
  { 
    id: 'chat', 
    label: 'Chat', 
    icon: MessageSquare,
    description: 'Simple conversation with AI'
  },
  { 
    id: 'react', 
    label: 'ReAct Agent', 
    icon: Bot,
    description: 'Reasoning + Acting with tools'
  },
  { 
    id: 'function_calling', 
    label: 'Function Calling', 
    icon: Code,
    description: 'Execute functions based on requests'
  },
  { 
    id: 'group_chat', 
    label: 'Multi-Agent', 
    icon: Cpu,
    description: 'Collaborate with multiple agents'
  },
  { 
    id: 'browser', 
    label: 'Browser', 
    icon: Globe,
    description: 'Web automation & scraping'
  },
];

export default function QwenAgentInterface() {
  const [mode, setMode] = useState('chat');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    reasoning?: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkConnection = async () => {
    setCheckingConnection(true);
    try {
      // Dynamic import to avoid build issues
      const { chimera } = await import('@/api/chimeraClient');
      const available = await chimera.healthCheck();
      setIsConnected(available);
    } catch (error) {
      console.error('Connection check failed:', error);
      setIsConnected(false);
    } finally {
      setCheckingConnection(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { qwenAgent } = await import('@/api/qwenAgentService');
      
      let response;
      
      switch (mode) {
        case 'react':
          response = await qwenAgent.reactAgent(userMessage);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: response.content,
            reasoning: response.reasoning
          }]);
          break;
          
        case 'function_calling':
          response = await qwenAgent.functionCalling(userMessage, []);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: response.content
          }]);
          break;
          
        default:
          response = await qwenAgent.chat(userMessage);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: response.content
          }]);
      }
      
    } catch (error: any) {
      console.error('Agent error:', error);
      toast.error(error.message || 'Failed to get response from agent');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to connect to CHIMERA. Make sure the local server is running on port 7861.'}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const currentModeInfo = AGENT_MODES.find(m => m.id === mode);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>Qwen Agent</CardTitle>
              <p className="text-sm text-muted-foreground">
                Powered by CHIMERA Quantum LLM
              </p>
            </div>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {checkingConnection ? (
              <Badge variant="outline" className="gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Checking...
              </Badge>
            ) : isConnected ? (
              <Badge variant="default" className="gap-1 bg-green-500">
                <CheckCircle className="w-3 h-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="w-3 h-3" />
                Disconnected
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Mode Selector */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex flex-wrap gap-2">
          {AGENT_MODES.map((m) => (
            <Button
              key={m.id}
              variant={mode === m.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode(m.id)}
              className="gap-2"
            >
              <m.icon className="w-4 h-4" />
              {m.label}
            </Button>
          ))}
        </div>
        {currentModeInfo && (
          <p className="text-sm text-muted-foreground mt-2">
            {currentModeInfo.description}
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Start a conversation with the Qwen Agent</p>
            <p className="text-sm mt-2">
              Make sure CHIMERA is running on port 7861
            </p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {msg.reasoning && (
                <details className="mb-2">
                  <summary className="text-xs cursor-pointer opacity-70">
                    Reasoning
                  </summary>
                  <pre className="text-xs mt-1 p-2 bg-background/50 rounded whitespace-pre-wrap">
                    {msg.reasoning}
                  </pre>
                </details>
              )}
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message Qwen Agent...`}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
