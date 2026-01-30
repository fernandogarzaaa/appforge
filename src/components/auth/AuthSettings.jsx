/**
 * Authentication UI Components
 * React components for SAML, OIDC, MFA, and Session Management
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Smartphone, Mail, Key, Globe, Lock, CheckCircle, XCircle } from 'lucide-react';

/**
 * SAML Configuration Component
 */
export function SAMLConfig({ onSave = (_config) => {}, initialConfig = {} } = {}) {
  /** @type {{entityId?: string; idpEntityId?: string; idpSsoUrl?: string; idpCertificate?: string; preset?: string;}} */
  const config_typed = initialConfig;
  const [config, setConfig] = useState({
    entityId: (config_typed && config_typed.entityId) || '',
    idpEntityId: (config_typed && config_typed.idpEntityId) || '',
    idpSsoUrl: (config_typed && config_typed.idpSsoUrl) || '',
    idpCertificate: (config_typed && config_typed.idpCertificate) || '',
    preset: (config_typed && config_typed.preset) || '',
  });

  const presets = [
    { value: 'okta', label: 'Okta' },
    { value: 'azure', label: 'Azure AD' },
    { value: 'onelogin', label: 'OneLogin' },
    { value: 'google', label: 'Google Workspace' },
  ];

  const handleSave = () => {
    onSave(config);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          SAML 2.0 Configuration
        </CardTitle>
        <CardDescription>
          Configure enterprise Single Sign-On with SAML 2.0
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Identity Provider Preset</Label>
          <Select value={config.preset} onValueChange={(value) => setConfig({ ...config, preset: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select a preset" />
            </SelectTrigger>
            <SelectContent>
              {presets.map(preset => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="entityId">Service Provider Entity ID</Label>
          <Input
            id="entityId"
            value={config.entityId}
            onChange={(e) => setConfig({ ...config, entityId: e.target.value })}
            placeholder="https://appforge.com/saml/metadata"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="idpEntityId">Identity Provider Entity ID</Label>
          <Input
            id="idpEntityId"
            value={config.idpEntityId}
            onChange={(e) => setConfig({ ...config, idpEntityId: e.target.value })}
            placeholder="https://idp.example.com/saml/metadata"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="idpSsoUrl">Identity Provider SSO URL</Label>
          <Input
            id="idpSsoUrl"
            value={config.idpSsoUrl}
            onChange={(e) => setConfig({ ...config, idpSsoUrl: e.target.value })}
            placeholder="https://idp.example.com/saml/sso"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="idpCertificate">Identity Provider Certificate</Label>
          <textarea
            id="idpCertificate"
            className="w-full min-h-32 p-2 border rounded-md font-mono text-sm"
            value={config.idpCertificate}
            onChange={(e) => setConfig({ ...config, idpCertificate: e.target.value })}
            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
          />
        </div>

        <Button onClick={handleSave} className="w-full">
          <Shield className="mr-2 h-4 w-4" />
          Save SAML Configuration
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * OIDC Configuration Component
 */
export function OIDCConfig({ onSave = (_config) => {}, initialConfig = {} } = {}) {
  /** @type {{issuer?: string; clientId?: string; clientSecret?: string; provider?: string;}} */
  const config_typed = initialConfig;
  const [config, setConfig] = useState({
    issuer: (config_typed && config_typed.issuer) || '',
    clientId: (config_typed && config_typed.clientId) || '',
    clientSecret: (config_typed && config_typed.clientSecret) || '',
    provider: (config_typed && config_typed.provider) || '',
  });

  const providers = [
    { value: 'google', label: 'Google' },
    { value: 'microsoft', label: 'Microsoft' },
    { value: 'okta', label: 'Okta' },
    { value: 'auth0', label: 'Auth0' },
    { value: 'keycloak', label: 'Keycloak' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          OpenID Connect Configuration
        </CardTitle>
        <CardDescription>
          Configure modern SSO with OpenID Connect
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Provider</Label>
          <Select value={config.provider} onValueChange={(value) => setConfig({ ...config, provider: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select a provider" />
            </SelectTrigger>
            <SelectContent>
              {providers.map(provider => (
                <SelectItem key={provider.value} value={provider.value}>
                  {provider.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="issuer">Issuer URL</Label>
          <Input
            id="issuer"
            value={config.issuer}
            onChange={(e) => setConfig({ ...config, issuer: e.target.value })}
            placeholder="https://accounts.google.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientId">Client ID</Label>
          <Input
            id="clientId"
            value={config.clientId}
            onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
            placeholder="your-client-id"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientSecret">Client Secret</Label>
          <Input
            id="clientSecret"
            type="password"
            value={config.clientSecret}
            onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
            placeholder="your-client-secret"
          />
        </div>

        <Button onClick={() => onSave(config)} className="w-full">
          <Lock className="mr-2 h-4 w-4" />
          Save OIDC Configuration
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * MFA Setup Component
 */
export function MFASetup({ userId, onComplete }) {
  const [step, setStep] = useState('select'); // select, setup, verify
  const [method, setMethod] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpUri, setTotpUri] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [error, setError] = useState('');

  const methods = [
    { value: 'totp', label: 'Authenticator App', icon: Smartphone, description: 'Use Google Authenticator, Authy, or similar' },
    { value: 'sms', label: 'SMS', icon: Smartphone, description: 'Receive codes via text message' },
    { value: 'email', label: 'Email', icon: Mail, description: 'Receive codes via email' },
  ];

  const handleMethodSelect = async (selectedMethod) => {
    setMethod(selectedMethod);
    setStep('setup');

    if (selectedMethod === 'totp') {
      // Generate TOTP secret
      const response = await fetch(`/api/mfa/totp/setup?userId=${userId}`);
      const data = await response.json();
      setTotpSecret(data.secret);
      setTotpUri(data.qrCodeUri);
    }
  };

  const handleVerify = async () => {
    try {
      const response = await fetch(`/api/mfa/${method}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code: verificationCode }),
      });

      const data = await response.json();

      if (data.valid) {
        // Generate backup codes
        const codesResponse = await fetch(`/api/mfa/backup-codes?userId=${userId}`);
        const codesData = await codesResponse.json();
        setBackupCodes(codesData.codes);
        setStep('complete');
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Multi-Factor Authentication Setup
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'select' && (
          <div className="space-y-3">
            {methods.map(m => (
              <Button
                key={m.value}
                variant="outline"
                className="w-full justify-start h-auto p-4"
                onClick={() => handleMethodSelect(m.value)}
              >
                <m.icon className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">{m.label}</div>
                  <div className="text-sm text-muted-foreground">{m.description}</div>
                </div>
              </Button>
            ))}
          </div>
        )}

        {step === 'setup' && method === 'totp' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="mb-4">Scan this QR code with your authenticator app:</p>
              <div className="inline-block p-4 bg-white rounded-lg">
                <QRCodeSVG value={totpUri} size={200} />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Or enter this secret manually: <code className="bg-muted px-2 py-1 rounded">{totpSecret}</code>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Enter verification code</Label>
              <Input
                id="code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <Button onClick={handleVerify} className="w-full">
              Verify and Enable
            </Button>
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-600 dark:text-green-400">
                Multi-factor authentication has been enabled successfully!
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Backup Codes</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Save these backup codes in a safe place. Each code can only be used once.
              </p>
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {backupCodes.map((code, i) => (
                  <div key={i} className="bg-muted p-2 rounded text-center">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={onComplete} className="w-full">
              Complete Setup
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Active Sessions Component
 */
export function ActiveSessions({ userId }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, [userId]);

  const fetchSessions = async () => {
    try {
      const response = await fetch(`/api/sessions?userId=${userId}`);
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId) => {
    try {
      await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      fetchSessions();
    } catch (error) {
      console.error('Failed to revoke session:', error);
    }
  };

  const revokeAll = async () => {
    try {
      await fetch(`/api/sessions/revoke-all?userId=${userId}`, { method: 'POST' });
      fetchSessions();
    } catch (error) {
      console.error('Failed to revoke all sessions:', error);
    }
  };

  if (loading) {
    return <div>Loading sessions...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>Manage your active login sessions</CardDescription>
          </div>
          {sessions.length > 1 && (
            <Button variant="destructive" size="sm" onClick={revokeAll}>
              Revoke All Others
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No active sessions</p>
        ) : (
          sessions.map(session => (
            <div key={session.id} className="flex items-start justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={session.current ? 'default' : 'secondary'}>
                    {session.metadata?.platform || 'Unknown'}
                  </Badge>
                  {session.current && <Badge>Current</Badge>}
                </div>
                <p className="text-sm">
                  {session.metadata?.browser} on {session.metadata?.os}
                </p>
                <p className="text-xs text-muted-foreground">
                  IP: {session.ipAddress} • {session.location?.city}, {session.location?.country}
                </p>
                <p className="text-xs text-muted-foreground">
                  Last active: {new Date(session.lastActivityAt).toLocaleString()}
                </p>
              </div>
              {!session.current && (
                <Button variant="ghost" size="sm" onClick={() => revokeSession(session.id)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Authentication Settings Component
 */
export function AuthSettings({ userId }) {
  const [activeTab, setActiveTab] = useState('sso');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sso">SSO</TabsTrigger>
          <TabsTrigger value="oidc">OIDC</TabsTrigger>
          <TabsTrigger value="mfa">MFA</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="sso" className="space-y-4">
          <SAMLConfig onSave={(config) => console.log('SAML config:', config)} />
        </TabsContent>

        <TabsContent value="oidc" className="space-y-4">
          <OIDCConfig onSave={(config) => console.log('OIDC config:', config)} />
        </TabsContent>

        <TabsContent value="mfa" className="space-y-4">
          <MFASetup userId={userId} onComplete={() => console.log('MFA setup complete')} />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <ActiveSessions userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AuthSettings;
