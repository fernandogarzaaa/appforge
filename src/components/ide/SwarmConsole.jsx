import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Loader2, User, Bot, Command, Mic, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function SwarmConsole({ agent, initialPlan }) {
    const [messages, setMessages] = useState([
        { role: 'assistant', text: "Swarm initialized. I'm ready to begin architectural synthesis for your project. What should we build first?", agent: 'Architect' }
    ]);

    useEffect(() => {
        if (initialPlan) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: `Plan Generated: ${initialPlan.goal}.\n\nSteps:\n${initialPlan.steps.map(s => `- ${s.description}`).join('\n')}`,
                agent: 'Architect'
            }]);
        }
    }, [initialPlan]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        setMessages(prev => [...prev, { role: 'user', text: input, agent: 'Admin' }]);
        setInput('');
        setIsThinking(true);

        // Simulate Agent response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: `Understood. I'm deploying the ${input.includes('page') ? 'Frontend Swarm' : 'Logic Swarm'} to implement this. I'll provide a preview shortly.`,
                agent: 'Executor'
            }]);
            setIsThinking(false);
        }, 1500);
    };

    return (
        <div className="h-full flex flex-col bg-slate-950 border-r border-slate-900">
            <div className="p-3 border-b border-slate-900 bg-slate-900/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">SWARM_CONSOLE</span>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="text-[8px] py-0 border-indigo-500/30 text-indigo-400 font-mono">GEN_III</Badge>
                </div>
            </div>

            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-6">
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: msg.role === 'user' ? 5 : -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                {msg.role === 'assistant' && (
                                    <div className="w-5 h-5 rounded bg-indigo-500/20 flex items-center justify-center">
                                        <Bot className="w-3 h-3 text-indigo-400" />
                                    </div>
                                )}
                                <span className="text-[9px] font-black uppercase tracking-tighter text-slate-500">
                                    {msg.role === 'user' ? 'Admin' : (msg.agent || 'Sovereign')}
                                </span>
                                {msg.role === 'user' && (
                                    <div className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center">
                                        <User className="w-3 h-3 text-slate-400" />
                                    </div>
                                )}
                            </div>
                            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                                : 'bg-slate-900 text-slate-300 border border-slate-800'
                                }`}>
                                {msg.text}
                            </div>
                        </motion.div>
                    ))}
                    {isThinking && (
                        <div className="flex flex-col items-start animate-pulse">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-5 h-5 rounded bg-indigo-500/20 flex items-center justify-center">
                                    <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-tighter text-indigo-400">Processing Probability Waves...</span>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="p-4 bg-slate-900/40 border-t border-slate-900 space-y-3">
                <div className="relative group">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Command the swarm..."
                        className="bg-slate-950 border-slate-800 pl-10 h-10 text-xs focus-visible:ring-indigo-500 group-hover:border-slate-700 transition-colors"
                    />
                    <Command className="absolute left-3 top-3 w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <Button size="icon" variant="ghost" className="w-8 h-8 text-slate-500 hover:text-indigo-400">
                            <Mic className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="w-8 h-8 text-slate-500 hover:text-indigo-400">
                            <Video className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white h-8 px-4 font-bold text-[10px] uppercase tracking-widest"
                    >
                        Deploy <Send className="w-3 h-3 ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
