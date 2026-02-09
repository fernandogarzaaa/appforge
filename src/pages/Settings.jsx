import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AIPreferences from '@/components/settings/AIPreferences';
import { Settings as SettingsIcon, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Settings() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-8 h-8 text-gray-900" />
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      </div>

      <Tabs defaultValue="ai" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ai" className="gap-2">
            <Brain className="w-4 h-4" />
            AI Preferences
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            Account Settings
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai">
          <AIPreferences />
        </TabsContent>

        <TabsContent value="account">
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-4">Profile Information</h3>
              <div className="space-y-4 max-w-md">
                <div className="grid gap-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input id="name" defaultValue="Fernando Garza" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue="fernando@example.com" disabled />
                  <p className="text-xs text-gray-500">Contact support to change email</p>
                </div>
                <Button>Update Profile</Button>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-6 border border-red-100">
              <h3 className="font-semibold text-lg mb-2 text-red-900">Danger Zone</h3>
              <p className="text-sm text-red-700 mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button variant="destructive">Delete Account</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-semibold text-lg">Connected Services</h3>
              <p className="text-sm text-gray-500">Manage your external tools and services</p>
            </div>
            <div className="divide-y divide-gray-100">
              {[
                { name: 'GitHub', icon: '🐱', desc: 'Sync repositories and workflows', connected: true },
                { name: 'Vercel', icon: '▲', desc: 'Automated deployments', connected: false },
                { name: 'Stripe', icon: '💳', desc: 'Payment processing', connected: false },
                { name: 'OpenAI', icon: '🤖', desc: 'Custom AI models', connected: true }
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-xl">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                  <Button variant={item.connected ? "outline" : "default"} size="sm">
                    {item.connected ? 'Disconnect' : 'Connect'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}