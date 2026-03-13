import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Bot, MessageSquare, Code, Globe, Cpu, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
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
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [checkingConnection, setCheckingConnection] = useState(true);
    const messagesEndRef = useRef(null);
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
        }
        catch (error) {
            console.error('Connection check failed:', error);
            setIsConnected(false);
        }
        finally {
            setCheckingConnection(false);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading)
            return;
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
        }
        catch (error) {
            console.error('Agent error:', error);
            toast.error(error.message || 'Failed to get response from agent');
            setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Error: ${error.message || 'Failed to connect to CHIMERA. Make sure the local server is running on port 7861.'}`
                }]);
        }
        finally {
            setIsLoading(false);
        }
    };
    const currentModeInfo = AGENT_MODES.find(m => m.id === mode);
    return (_jsxs("div", { className: "flex flex-col h-full", children: [_jsx(CardHeader, { className: "border-b", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg", children: _jsx(Sparkles, { className: "w-6 h-6 text-white" }) }), _jsxs("div", { children: [_jsx(CardTitle, { children: "Qwen Agent" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Powered by CHIMERA Quantum LLM" })] })] }), _jsx("div", { className: "flex items-center gap-2", children: checkingConnection ? (_jsxs(Badge, { variant: "outline", className: "gap-1", children: [_jsx(Loader2, { className: "w-3 h-3 animate-spin" }), "Checking..."] })) : isConnected ? (_jsxs(Badge, { variant: "default", className: "gap-1 bg-green-500", children: [_jsx(CheckCircle, { className: "w-3 h-3" }), "Connected"] })) : (_jsxs(Badge, { variant: "destructive", className: "gap-1", children: [_jsx(AlertCircle, { className: "w-3 h-3" }), "Disconnected"] })) })] }) }), _jsxs("div", { className: "p-4 border-b bg-muted/30", children: [_jsx("div", { className: "flex flex-wrap gap-2", children: AGENT_MODES.map((m) => (_jsxs(Button, { variant: mode === m.id ? 'default' : 'outline', size: "sm", onClick: () => setMode(m.id), className: "gap-2", children: [_jsx(m.icon, { className: "w-4 h-4" }), m.label] }, m.id))) }), currentModeInfo && (_jsx("p", { className: "text-sm text-muted-foreground mt-2", children: currentModeInfo.description }))] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: [messages.length === 0 && (_jsxs("div", { className: "text-center text-muted-foreground py-12", children: [_jsx(Bot, { className: "w-12 h-12 mx-auto mb-4 opacity-50" }), _jsx("p", { children: "Start a conversation with the Qwen Agent" }), _jsx("p", { className: "text-sm mt-2", children: "Make sure CHIMERA is running on port 7861" })] })), messages.map((msg, i) => (_jsx("div", { className: `flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`, children: _jsxs("div", { className: `max-w-[80%] rounded-lg p-3 ${msg.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'}`, children: [msg.reasoning && (_jsxs("details", { className: "mb-2", children: [_jsx("summary", { className: "text-xs cursor-pointer opacity-70", children: "Reasoning" }), _jsx("pre", { className: "text-xs mt-1 p-2 bg-background/50 rounded whitespace-pre-wrap", children: msg.reasoning })] })), _jsx("div", { className: "whitespace-pre-wrap", children: msg.content })] }) }, i))), isLoading && (_jsx("div", { className: "flex justify-start", children: _jsxs("div", { className: "bg-muted rounded-lg p-3 flex items-center gap-2", children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin" }), _jsx("span", { className: "text-sm", children: "Thinking..." })] }) })), _jsx("div", { ref: messagesEndRef })] }), _jsx("form", { onSubmit: handleSubmit, className: "p-4 border-t", children: _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { value: input, onChange: (e) => setInput(e.target.value), placeholder: `Message Qwen Agent...`, disabled: isLoading, className: "flex-1" }), _jsx(Button, { type: "submit", disabled: isLoading || !input.trim(), children: isLoading ? (_jsx(Loader2, { className: "w-4 h-4 animate-spin" })) : (_jsx(Send, { className: "w-4 h-4" })) })] }) })] }));
}
