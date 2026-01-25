import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, Mail, Globe, Code } from 'lucide-react';

export default function ChatbotChannelConfig({ channels, onUpdate }) {
  const channelOptions = [
    { key: 'whatsapp_enabled', label: 'WhatsApp', icon: MessageCircle, color: 'green' },
    { key: 'email_enabled', label: 'Email', icon: Mail, color: 'blue' },
    { key: 'website_enabled', label: 'Website Widget', icon: Globe, color: 'purple' },
    { key: 'api_enabled', label: 'API', icon: Code, color: 'gray' }
  ];

  return (
    <div className="space-y-4 mt-4">
      {channelOptions.map(channel => {
        const Icon = channel.icon;
        const colorClasses = {
          green: 'border-green-200 bg-green-50',
          blue: 'border-blue-200 bg-blue-50',
          purple: 'border-purple-200 bg-purple-50',
          gray: 'border-gray-200 bg-gray-50'
        };
        
        return (
          <Card key={channel.key} className={`border-2 p-4 ${colorClasses[channel.color]}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <Label className="font-medium">{channel.label}</Label>
              </div>
              <Switch
                checked={channels[channel.key]}
                onCheckedChange={(checked) =>
                  onUpdate({ ...channels, [channel.key]: checked })
                }
              />
            </div>
            
            {channel.key === 'email_enabled' && channels.email_enabled && (
              <div className="mt-3 space-y-2 pt-3 border-t">
                <Input
                  type="email"
                  placeholder="Reply-from email"
                  value={channels.email_config?.reply_email || ''}
                  onChange={(e) =>
                    onUpdate({
                      ...channels,
                      email_config: {
                        ...channels.email_config,
                        reply_email: e.target.value
                      }
                    })
                  }
                  className="text-sm"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={channels.email_config?.auto_reply}
                    onChange={(e) =>
                      onUpdate({
                        ...channels,
                        email_config: {
                          ...channels.email_config,
                          auto_reply: e.target.checked
                        }
                      })
                    }
                  />
                  Enable auto-reply
                </label>
              </div>
            )}
          </Card>
        );
      })}

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
        <p className="font-medium mb-1">WhatsApp Integration</p>
        <p>Enable WhatsApp to provide a direct messaging link for users to interact with your chatbot via WhatsApp</p>
      </div>
    </div>
  );
}