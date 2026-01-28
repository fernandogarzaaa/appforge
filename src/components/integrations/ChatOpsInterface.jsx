import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, HelpCircle } from 'lucide-react';

export default function ChatOpsInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hi! I\'m your ChatOps assistant. Try commands like /status, /alerts, /acknowledge <id>, or /help' }
  ]);

  const { data: commands } = useQuery({
    queryKey: ['chatops-commands'],
    queryFn: () => base44.entities.ChatOpsCommand.list('-created_date', 50)
  });

  const { data: activeAlerts } = useQuery({
    queryKey: ['active-alerts'],
    queryFn: () => base44.entities.AnomalyAlert.filter({ status: 'new' }, '-created_date', 10)
  });

  const { data: activePredictions } = useQuery({
    queryKey: ['active-predictions'],
    queryFn: () => base44.entities.AnomalyForecast.filter({ status: 'active' })
  });

  const handleCommand = async () => {
    if (!input.trim()) return;

    const command = input.trim().toLowerCase();
    setMessages(prev => [...prev, { type: 'user', text: input }]);
    setInput('');

    let response = '';

    if (command === '/status') {
      response = `System Status:\n• Active Alerts: ${activeAlerts?.length || 0}\n• Predictions: ${activePredictions?.length || 0}\n• System Health: 98.5%`;
    } else if (command === '/alerts') {
      response = `Active Alerts:\n${activeAlerts?.slice(0, 3).map(a => `• ${a.id}: ${a.severity}`).join('\n') || 'No active alerts'}`;
    } else if (command.startsWith('/acknowledge')) {
      const alertId = command.split(' ')[1];
      response = `Alert ${alertId} acknowledged!`;
      // TODO: Call acknowledge mutation
    } else if (command === '/help') {
      response = `Available Commands:\n/status - System status\n/alerts - List active alerts\n/acknowledge <id> - Acknowledge alert\n/predictions - View predictions\n/help - Show this help`;
    } else if (command === '/predictions') {
      response = `Active Predictions:\n${activePredictions?.slice(0, 3).map(p => `• ${p.title} (${p.probability_percent}%)`).join('\n') || 'No active predictions'}`;
    } else {
      response = `Unknown command: ${command}. Type /help for available commands.`;
    }

    setMessages(prev => [...prev, { type: 'bot', text: response }]);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        ChatOps Console
      </h3>

      {/* Quick Commands */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={() => setInput('/status')}>
          /status
        </Button>
        <Button size="sm" variant="outline" onClick={() => setInput('/alerts')}>
          /alerts
        </Button>
        <Button size="sm" variant="outline" onClick={() => setInput('/predictions')}>
          /predictions
        </Button>
        <Button size="sm" variant="outline" onClick={() => setInput('/help')}>
          /help
        </Button>
      </div>

      {/* Chat Messages */}
      <Card className="h-96 flex flex-col">
        <CardContent className="flex-1 overflow-auto p-4 space-y-3">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs p-3 rounded-lg ${
                  msg.type === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-100 text-slate-900 rounded-bl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
        </CardContent>

        {/* Input */}
        <div className="border-t p-3 flex gap-2">
          <Input
            placeholder="Type command or message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCommand()}
          />
          <Button size="sm" onClick={handleCommand}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Available Commands */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Available Commands
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {commands?.slice(0, 6).map(cmd => (
              <div key={cmd.id} className="text-sm p-2 bg-slate-50 rounded">
                <p className="font-mono font-semibold text-blue-600">{cmd.command}</p>
                <p className="text-xs text-slate-600 mt-1">{cmd.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}