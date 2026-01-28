// @ts-ignore - Component uses runtime base44.functions.execute API
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, Smartphone, Key, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function TwoFactorAuth() {
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const queryClient = useQueryClient();

  // Check 2FA status
  const { data: status } = useQuery({
    queryKey: ['2fa-status'],
    queryFn: async () => {
      // @ts-ignore - base44 SDK supports execute method at runtime
      const response = await base44.functions.execute('twoFactorAuth', {
        action: 'setup'
      });
      return response.data;
    }
  });

  // Enable 2FA
  const enable2FA = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.execute('twoFactorAuth', {
        action: 'enable',
        code: verificationCode
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      setVerificationCode('');
    }
  });

  // Disable 2FA
  const disable2FA = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.execute('twoFactorAuth', {
        action: 'disable',
        password
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      setPassword('');
    }
  });

  // Regenerate backup codes
  const regenerateBackup = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.execute('twoFactorAuth', {
        action: 'regenerateBackup',
        password
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
    }
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Two-Factor Authentication</h1>
        <p className="text-muted-foreground">
          Add an extra layer of security to your account with TOTP-based 2FA.
        </p>
      </div>

      {/* Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            2FA Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {status?.enabled ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-semibold">Two-Factor Authentication is enabled</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold">Two-Factor Authentication is disabled</span>
                </>
              )}
            </div>
            <Badge variant={status?.enabled ? 'default' : 'secondary'}>
              {status?.enabled ? 'Protected' : 'Unprotected'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Setup 2FA */}
      {!status?.enabled && status?.qrCode && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Setup Two-Factor Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">Follow these steps to enable 2FA:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Install an authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>Scan the QR code below or enter the secret key manually</li>
                <li>Enter the 6-digit code from your authenticator app</li>
              </ol>
            </div>

            <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-muted">
              <div className="bg-white p-4 rounded-lg">
                <img 
                  src={status.qrCode} 
                  alt="2FA QR Code" 
                  className="w-48 h-48"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <code className="px-3 py-1 bg-background rounded border font-mono text-sm">
                  {status.secret}
                </code>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(status.secret)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Verification Code</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                />
                <Button 
                  onClick={() => enable2FA.mutate()}
                  disabled={verificationCode.length !== 6 || enable2FA.isPending}
                >
                  Enable 2FA
                </Button>
              </div>
            </div>

            {enable2FA.isError && (
              <div className="text-sm text-red-500">
                Invalid verification code. Please try again.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Backup Codes */}
      {status?.enabled && status?.backupCodes && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Backup Codes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Save these backup codes in a safe place. Each code can be used once if you lose access to your authenticator app.
            </p>

            <div className="grid grid-cols-2 gap-2 p-4 border rounded-lg bg-muted font-mono text-sm">
              {status.backupCodes.map((code, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-background rounded">
                  <span>{code}</span>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => copyToClipboard(code)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>

            <div>
              <Label>Password (to regenerate codes)</Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button 
                  variant="outline"
                  onClick={() => regenerateBackup.mutate()}
                  disabled={!password || regenerateBackup.isPending}
                >
                  Regenerate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disable 2FA */}
      {status?.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Disable Two-Factor Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Disabling 2FA will make your account less secure. Are you sure you want to continue?
            </p>

            <div>
              <Label>Password</Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Enter your password to disable 2FA"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button 
                  variant="destructive"
                  onClick={() => disable2FA.mutate()}
                  disabled={!password || disable2FA.isPending}
                >
                  Disable 2FA
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
