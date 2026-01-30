import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import HelpTooltip from '@/components/help/HelpTooltip';
import { Settings, Save, AlertCircle, CheckCircle } from 'lucide-react';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    // API Settings
    apiTimeout: 30,
    maxRetries: 3,
    rateLimitPerMinute: 100,
    
    // Security Settings
    enableEncryption: true,
    enableAuditLogging: true,
    requireMFA: false,
    sessionTimeout: 30,
    
    // Feature Flags
    enableCollaboration: true,
    enableWebSocket: true,
    enableAnalytics: true,
    enableAIFeatures: true,
    
    // Resource Limits
    maxTeamSize: 100,
    maxProjectsPerUser: 50,
    maxStorageGB: 1000,
    
    // Email Settings
    emailNotificationsEnabled: true,
    sendDailyDigest: true,
    sendWeeklyReport: true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [expandedSection, setExpandedSection] = useState('api');

  const handleSettingChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const SettingGroup = ({ title, description, children }) => (
    <div className="p-4 border-b last:border-b-0">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-xs text-gray-500 mb-4">{description}</p>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );

  const BooleanSetting = ({ label, value, onChange, description }) => (
    <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300"
        />
      </label>
    </div>
  );

  const NumberSetting = ({ label, value, onChange, min, max, description, suffix }) => (
    <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded gap-4">
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Math.max(min || 0, Math.min(max || 999999, parseInt(e.target.value) || 0)))}
          min={min}
          max={max}
          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
        />
        {suffix && <span className="text-sm text-gray-600">{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Save Status Alert */}
      {saveStatus && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          saveStatus === 'success'
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          {saveStatus === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span className={`text-sm font-medium ${
            saveStatus === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {saveStatus === 'success'
              ? 'Settings saved successfully!'
              : 'Failed to save settings'}
          </span>
        </div>
      )}

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>Control API behavior and rate limiting</CardDescription>
            </div>
            <HelpTooltip 
              content="These settings control how the application communicates with external APIs and handles timeouts."
              title="API Settings"
            />
          </div>
        </CardHeader>
        <CardContent>
          <SettingGroup title="Timeouts & Retries" description="Configure request behavior">
            <NumberSetting
              label="Request Timeout"
              value={settings.apiTimeout}
              onChange={(v) => handleSettingChange('apiTimeout', v)}
              min={5}
              max={300}
              suffix="seconds"
              description="Maximum time to wait for API response"
            />
            <NumberSetting
              label="Maximum Retries"
              value={settings.maxRetries}
              onChange={(v) => handleSettingChange('maxRetries', v)}
              min={0}
              max={10}
              suffix="attempts"
              description="Number of times to retry failed requests"
            />
            <NumberSetting
              label="Rate Limit"
              value={settings.rateLimitPerMinute}
              onChange={(v) => handleSettingChange('rateLimitPerMinute', v)}
              min={10}
              max={10000}
              suffix="req/min"
              description="Maximum API requests per minute"
            />
          </SettingGroup>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Security & Access</CardTitle>
              <CardDescription>Manage security policies and user access</CardDescription>
            </div>
            <HelpTooltip 
              content="Configure encryption, authentication requirements, and audit logging for your application."
              title="Security Settings"
            />
          </div>
        </CardHeader>
        <CardContent>
          <SettingGroup title="Security Policies" description="Enforce security measures">
            <BooleanSetting
              label="Enable Encryption"
              value={settings.enableEncryption}
              onChange={(v) => handleSettingChange('enableEncryption', v)}
              description="Encrypt sensitive data at rest and in transit"
            />
            <BooleanSetting
              label="Enable Audit Logging"
              value={settings.enableAuditLogging}
              onChange={(v) => handleSettingChange('enableAuditLogging', v)}
              description="Log all user actions for compliance and security"
            />
            <BooleanSetting
              label="Require Multi-Factor Authentication"
              value={settings.requireMFA}
              onChange={(v) => handleSettingChange('requireMFA', v)}
              description="Force all users to enable 2FA/MFA"
            />
            <NumberSetting
              label="Session Timeout"
              value={settings.sessionTimeout}
              onChange={(v) => handleSettingChange('sessionTimeout', v)}
              min={5}
              max={1440}
              suffix="minutes"
              description="Auto-logout inactive users after this period"
            />
          </SettingGroup>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>Enable or disable application features</CardDescription>
            </div>
            <HelpTooltip 
              content="Toggle features on and off without redeploying your application."
              title="Feature Control"
            />
          </div>
        </CardHeader>
        <CardContent>
          <SettingGroup title="Feature Availability" description="Control feature rollout">
            <BooleanSetting
              label="Real-time Collaboration"
              value={settings.enableCollaboration}
              onChange={(v) => handleSettingChange('enableCollaboration', v)}
              description="Allow real-time team collaboration features"
            />
            <BooleanSetting
              label="WebSocket Server"
              value={settings.enableWebSocket}
              onChange={(v) => handleSettingChange('enableWebSocket', v)}
              description="Enable real-time updates via WebSocket"
            />
            <BooleanSetting
              label="Analytics & Monitoring"
              value={settings.enableAnalytics}
              onChange={(v) => handleSettingChange('enableAnalytics', v)}
              description="Collect user analytics and system metrics"
            />
            <BooleanSetting
              label="AI Features"
              value={settings.enableAIFeatures}
              onChange={(v) => handleSettingChange('enableAIFeatures', v)}
              description="Enable AI-powered features and suggestions"
            />
          </SettingGroup>
        </CardContent>
      </Card>

      {/* Resource Limits */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Resource Limits</CardTitle>
              <CardDescription>Configure usage quotas and limits</CardDescription>
            </div>
            <HelpTooltip 
              content="Set maximum limits for user and team resources to manage system capacity."
              title="Resource Configuration"
            />
          </div>
        </CardHeader>
        <CardContent>
          <SettingGroup title="Usage Quotas" description="Set per-user and per-team limits">
            <NumberSetting
              label="Maximum Team Size"
              value={settings.maxTeamSize}
              onChange={(v) => handleSettingChange('maxTeamSize', v)}
              min={5}
              max={10000}
              suffix="members"
              description="Maximum number of members per team"
            />
            <NumberSetting
              label="Projects Per User"
              value={settings.maxProjectsPerUser}
              onChange={(v) => handleSettingChange('maxProjectsPerUser', v)}
              min={1}
              max={1000}
              suffix="projects"
              description="Maximum projects a user can create"
            />
            <NumberSetting
              label="Storage Per Account"
              value={settings.maxStorageGB}
              onChange={(v) => handleSettingChange('maxStorageGB', v)}
              min={1}
              max={100000}
              suffix="GB"
              description="Maximum storage space per account"
            />
          </SettingGroup>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Configure email notifications</CardDescription>
            </div>
            <HelpTooltip 
              content="Control which notifications are sent to users and how frequently."
              title="Notification Settings"
            />
          </div>
        </CardHeader>
        <CardContent>
          <SettingGroup title="Email Notifications" description="Manage notification delivery">
            <BooleanSetting
              label="Enable Email Notifications"
              value={settings.emailNotificationsEnabled}
              onChange={(v) => handleSettingChange('emailNotificationsEnabled', v)}
              description="Send email notifications to users"
            />
            <BooleanSetting
              label="Daily Digest"
              value={settings.sendDailyDigest}
              onChange={(v) => handleSettingChange('sendDailyDigest', v)}
              description="Send daily activity digest emails"
            />
            <BooleanSetting
              label="Weekly Report"
              value={settings.sendWeeklyReport}
              onChange={(v) => handleSettingChange('sendWeeklyReport', v)}
              description="Send weekly summary reports"
            />
          </SettingGroup>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-3 pt-4">
        <Button 
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
}
