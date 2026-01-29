/**
 * Real-time Collaboration Chat
 * WebSocket-based chat for collaboration sessions
 */

import React, { useState, useRef, useEffect } from 'react';
import { useCollaboration } from '@/contexts/CollaborationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, MessageSquare, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2',
];

function getColorForUser(userId) {
  const index = userId.charCodeAt(0) % USER_COLORS.length;
  return USER_COLORS[index];
}

export default function CollaborationChat() {
  const { isConnected, messages, activeUsers, sendMessage } = useCollaboration();
  const [messageInput, setMessageInput] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send message
  const handleSendMessage = () => {
    if (messageInput.trim() && isConnected) {
      sendMessage(messageInput, 'text');
      setMessageInput('');
      toast.success('Message sent');
    } else if (!isConnected) {
      toast.error('Not connected to collaboration server');
    }
  };

  // Handle typing indicator
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Show typing indicator
    setTypingUsers(prev => new Set(prev));

    // Clear typing after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setTypingUsers(new Set());
    }, 1000);
  };

  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <CardTitle>Collaboration Chat</CardTitle>
          </div>
          <Badge variant="outline">
            {activeUsers.length} {activeUsers.length === 1 ? 'user' : 'users'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
              <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Start collaborating to see messages here</p>
            </div>
          ) : (
            <>
              <AnimatePresence>
                {messages.map((msg, index) => {
                  const _user = activeUsers.find((u) => u.userId === msg.userId);

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="group"
                    >
                      <div className="flex gap-3">
                        {/* User Color Indicator */}
                        <div
                          className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                          style={{
                            backgroundColor: getColorForUser(msg.userId),
                          }}
                        />

                        {/* Message Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {msg.userName || 'Unknown User'}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3">
                            <p className="text-sm text-slate-900 dark:text-slate-50 break-words">
                              {msg.content}
                            </p>
                          </div>

                          {/* Message Type Badge */}
                          {msg.type !== 'text' && (
                            <div className="mt-1">
                              <Badge
                                variant="outline"
                                className="text-xs"
                              >
                                {msg.type}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </>
          )}

          {/* Typing Indicator */}
          {typingUsers.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex gap-2 items-center text-sm text-slate-500 dark:text-slate-400"
            >
              <Activity className="w-3 h-3 animate-pulse" />
              <span>Someone is typing...</span>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          {!isConnected && (
            <div className="mb-3 p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
              Chat is offline. Please reconnect to send messages.
            </div>
          )}

          <div className="flex gap-2">
            <Input
              value={messageInput}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={
                isConnected
                  ? 'Type a message... (Press Enter to send)'
                  : 'Chat is offline'
              }
              disabled={!isConnected}
              className="flex-1 text-sm"
            />
            <Button
              size="sm"
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || !isConnected}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Character Count */}
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {messageInput.length > 0 && (
              <span>{messageInput.length} characters</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
