import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, Send, Loader2, MessageCircle, User, ThumbsUp, 
  ThumbsDown, AlertCircle, CheckCircle, ExternalLink, ArrowUp
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

export default function SupportChatbot({ user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [showEscalate, setShowEscalate] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Welcome message
    setMessages([{
      role: 'assistant',
      content: `👋 Hello! I'm your AI support assistant. I can help you with:

• Technical issues and troubleshooting
• Feature questions and guidance
• Account and billing inquiries
• Bug reports and feature requests

How can I help you today?`,
      timestamp: new Date().toISOString(),
      is_ai: true
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const analyzeQuery = async (query) => {
    // Search knowledge base for relevant articles
    const allArticles = await base44.entities.KnowledgeBase.filter({ is_published: true });
    
    const searchPrompt = `Given this user query: "${query}"
    
Find the most relevant articles from this knowledge base:
${allArticles.map(a => `- ${a.title}: ${a.content.substring(0, 200)}...`).join('\n')}

Return the IDs of top 3 most relevant articles, or empty array if none are relevant.`;

    const relevantIds = await base44.integrations.Core.InvokeLLM({
      prompt: searchPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          article_ids: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    const relevant = allArticles.filter(a => relevantIds.article_ids?.includes(a.id));
    setRelatedArticles(relevant);
    
    return relevant;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
      is_ai: false
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Analyze query and find relevant articles
    const relevantArticles = await analyzeQuery(input);

    // Build context from knowledge base
    const kbContext = relevantArticles.length > 0
      ? `\n\nRelevant Knowledge Base Articles:\n${relevantArticles.map(a => 
          `Title: ${a.title}\nContent: ${a.content}`
        ).join('\n\n')}`
      : '';

    // Conversation history for context
    const conversationHistory = newMessages.slice(-6).map(m => 
      `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
    ).join('\n');

    const prompt = `You are an intelligent AI support assistant for a web development platform.

Conversation History:
${conversationHistory}
${kbContext}

Guidelines:
1. Be helpful, friendly, and professional
2. If you find relevant knowledge base articles, reference them
3. Provide clear, actionable solutions
4. If the issue seems complex or you're unsure, suggest escalating to a human agent
5. Ask clarifying questions if needed
6. Use markdown formatting for better readability

Determine if this issue needs human escalation:
- Complex technical problems beyond basic troubleshooting
- Billing disputes or account issues
- Frustrated or angry users (sentiment analysis)
- Issues requiring code review or custom solutions

Provide a JSON response with:
{
  "response": "your helpful response in markdown",
  "needs_escalation": true/false,
  "escalation_reason": "reason if needs_escalation is true",
  "sentiment": "positive/neutral/negative/urgent",
  "suggested_actions": ["array of next steps"]
}

User's latest message: ${input}`;

    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          response: { type: "string" },
          needs_escalation: { type: "boolean" },
          escalation_reason: { type: "string" },
          sentiment: { type: "string" },
          suggested_actions: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    const assistantMessage = {
      role: 'assistant',
      content: aiResponse.response,
      timestamp: new Date().toISOString(),
      is_ai: true,
      sentiment: aiResponse.sentiment,
      suggested_actions: aiResponse.suggested_actions
    };

    setMessages([...newMessages, assistantMessage]);
    setIsLoading(false);

    // Show escalation option if needed
    if (aiResponse.needs_escalation) {
      setShowEscalate(true);
      toast.info('This issue may require human support', {
        description: aiResponse.escalation_reason
      });
    }

    // Update or create support ticket
    if (!currentTicket) {
      const ticket = await base44.entities.SupportTicket.create({
        user_email: user.email,
        title: input.substring(0, 100),
        description: input,
        messages: [...newMessages, assistantMessage],
        ai_analyzed: true,
        ai_sentiment: aiResponse.sentiment,
        related_articles: relevantArticles.map(a => a.id),
        status: aiResponse.needs_escalation ? 'waiting_response' : 'open'
      });
      setCurrentTicket(ticket);
    } else {
      await base44.entities.SupportTicket.update(currentTicket.id, {
        messages: [...newMessages, assistantMessage],
        ai_sentiment: aiResponse.sentiment
      });
    }
  };

  const escalateToHuman = async () => {
    if (!currentTicket) return;

    await base44.entities.SupportTicket.update(currentTicket.id, {
      status: 'in_progress',
      priority: 'high'
    });

    const escalationMessage = {
      role: 'assistant',
      content: '✅ Your issue has been escalated to our support team. A human agent will respond within 2 hours. You\'ll receive an email notification when they reply.',
      timestamp: new Date().toISOString(),
      is_ai: true
    };

    setMessages([...messages, escalationMessage]);
    setShowEscalate(false);
    toast.success('Escalated to human support team');
  };

  const markHelpful = async (helpful) => {
    toast.success(helpful ? 'Glad I could help!' : 'I\'ll improve my responses');
  };

  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Support Assistant</CardTitle>
                <p className="text-xs text-gray-500">Powered by advanced AI</p>
              </div>
            </div>
            <Badge className="bg-green-600">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
              Online
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4 max-w-3xl mx-auto">
              <AnimatePresence>
                {messages.map((message, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 ${
                        message.role === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-gray-200 shadow-sm'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                      
                      {message.suggested_actions && message.suggested_actions.length > 0 && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <p className="text-xs font-semibold text-gray-600">Suggested Actions:</p>
                          {message.suggested_actions.map((action, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-gray-700">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              {action}
                            </div>
                          ))}
                        </div>
                      )}

                      {message.role === 'assistant' && idx > 0 && (
                        <div className="flex gap-2 mt-3 pt-3 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markHelpful(true)}
                            className="h-7 text-xs"
                          >
                            <ThumbsUp className="w-3 h-3 mr-1" />
                            Helpful
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markHelpful(false)}
                            className="h-7 text-xs"
                          >
                            <ThumbsDown className="w-3 h-3 mr-1" />
                            Not Helpful
                          </Button>
                        </div>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-indigo-600" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Analyzing your question...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="border-t p-4 bg-gray-50">
              <p className="text-xs font-semibold text-gray-600 mb-2">📚 Related Help Articles:</p>
              <div className="space-y-2">
                {relatedArticles.slice(0, 3).map(article => (
                  <button
                    key={article.id}
                    className="w-full text-left p-2 bg-white rounded-lg border hover:border-blue-300 transition-colors text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{article.title}</span>
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Escalation Banner */}
          {showEscalate && (
            <div className="border-t p-4 bg-orange-50 border-orange-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-orange-900 mb-1">
                    Need Human Support?
                  </p>
                  <p className="text-xs text-orange-800 mb-3">
                    This issue might be better handled by our support team
                  </p>
                  <Button
                    onClick={escalateToHuman}
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <ArrowUp className="w-3 h-3 mr-2" />
                    Escalate to Human Agent
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Describe your issue..."
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}