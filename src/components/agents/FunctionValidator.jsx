import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, XCircle, Loader2, Send, MessageSquare } from 'lucide-react';

export default function FunctionValidator() {
  const [activeTab, setActiveTab] = useState('validator');
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Validator states
  const [functionCode, setFunctionCode] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    initializeAgent();
  }, []);

  const initializeAgent = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: 'functionValidator',
        metadata: {
          name: 'Function Validation Session',
          description: 'Validating backend functions'
        }
      });
      setConversation(conv);
      setMessages(conv.messages || []);
    } catch (error) {
      console.error('Failed to initialize agent:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !conversation) return;

    setIsLoading(true);
    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: inputMessage
      });

      setInputMessage('');
      
      // Reload conversation to get agent response
      const updated = await base44.agents.getConversation(conversation.id);
      setMessages(updated.messages);
      setConversation(updated);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateFunctionCode = async () => {
    if (!functionCode.trim()) return;

    setValidating(true);
    try {
      const message = `Please validate this backend function code and check for errors:\n\n\`\`\`javascript\n${functionCode}\n\`\`\`\n\nCheck for:\n1. Syntax errors\n2. Missing imports or dependencies\n3. Incorrect SDK usage\n4. Missing error handling\n5. Authentication issues\n6. Response format issues`;

      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: message
      });

      const updated = await base44.agents.getConversation(conversation.id);
      setMessages(updated.messages);
      setConversation(updated);

      // Extract validation results from agent response
      const lastMessage = updated.messages[updated.messages.length - 1];
      setValidationResult(lastMessage.content);

    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setValidating(false);
    }
  };

  const quickTests = [
    {
      name: 'Webhook Function',
      query: 'Test and validate the webhookTrigger function. Check if it properly validates authentication, handles different content types, and responds appropriately to malformed requests.'
    },
    {
      name: 'Workflow Executor',
      query: 'Review the executeBotWorkflow function. Verify it handles all node types (action, condition, loop, parallel), manages context variables correctly, and logs execution properly.'
    },
    {
      name: 'Database Trigger',
      query: 'Validate the databaseChangeTrigger function. Check condition evaluation, debouncing logic, and event filtering.'
    },
    {
      name: 'File Upload Handler',
      query: 'Test the fileUploadTrigger function with various file types, sizes, and patterns. Verify file validation and bot triggering.'
    }
  ];

  const sendQuickTest = async (query) => {
    if (!conversation) return;
    
    setIsLoading(true);
    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: query
      });

      const updated = await base44.agents.getConversation(conversation.id);
      setMessages(updated.messages);
      setConversation(updated);
    } catch (error) {
      console.error('Quick test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Function Validator Agent</h1>
        <p className="text-gray-600">Validate functions, check integrations, identify errors, and test capabilities</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="validator">Code Validator</TabsTrigger>
          <TabsTrigger value="tests">Quick Tests</TabsTrigger>
          <TabsTrigger value="chat">Agent Chat</TabsTrigger>
        </TabsList>

        {/* Code Validator Tab */}
        <TabsContent value="validator" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Validate Function Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm mb-2 block">Paste Function Code</Label>
                <Textarea
                  value={functionCode}
                  onChange={(e) => setFunctionCode(e.target.value)}
                  placeholder="Paste your backend function code here..."
                  rows={10}
                  className="font-mono text-xs"
                />
              </div>
              <Button
                onClick={validateFunctionCode}
                disabled={validating || !functionCode.trim()}
                className="w-full"
              >
                {validating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Validate Code
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {validationResult && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm">Validation Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{validationResult}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Quick Tests Tab */}
        <TabsContent value="tests" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Predefined Tests</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {quickTests.map((test, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="justify-start h-auto p-4 text-left"
                  onClick={() => sendQuickTest(test.query)}
                  disabled={isLoading}
                >
                  <div>
                    <div className="font-semibold text-sm">{test.name}</div>
                    <div className="text-xs text-gray-600 mt-1">{test.query}</div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {messages.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm">Latest Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {messages.slice(-3).map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded ${
                        msg.role === 'user'
                          ? 'bg-white border border-gray-200'
                          : 'bg-white'
                      }`}
                    >
                      <div className="text-xs font-semibold text-gray-600 mb-1">
                        {msg.role === 'user' ? '👤 You' : '🤖 Agent'}
                      </div>
                      <p className="text-sm text-gray-800">{msg.content?.slice(0, 200)}...</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4 mt-4">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="text-sm">Agent Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Start a conversation with the validator agent</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md rounded-lg p-3 ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </CardContent>
            <div className="border-t p-4">
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about function validation, errors, testing..."
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* WhatsApp Integration */}
      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-900 mb-2">Connect via WhatsApp</p>
            <p className="text-sm text-green-800 mb-3">
              Chat with the Function Validator agent directly on WhatsApp for quick validation and testing.
            </p>
            <a
              href={base44.agents.getWhatsAppConnectURL('functionValidator')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              💬 Open WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}