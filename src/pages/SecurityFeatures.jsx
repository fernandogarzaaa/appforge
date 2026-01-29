import { useState } from 'react';
import { useBackendAuth } from '@/contexts/BackendAuthContext';
import { securityService } from '@/api/appforge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Lock, UserCheck, FileCheck, AlertTriangle, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function Security() {
  const [textToEncrypt, setTextToEncrypt] = useState('');
  const [textToDecrypt, setTextToDecrypt] = useState('');
  const [textToAnonymize, setTextToAnonymize] = useState('');
  const [encryptedResult, setEncryptedResult] = useState('');
  const [decryptedResult, setDecryptedResult] = useState('');
  const [anonymizedResult, setAnonymizedResult] = useState('');

  const { isAuthenticated } = useBackendAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch GDPR requests
  const { data: gdprRequests = [] } = useQuery({
    queryKey: ['gdprRequests'],
    queryFn: () => securityService.getGdprStatus(),
    enabled: isAuthenticated,
    retry: 1
  });

  // Encrypt mutation
  const encryptMutation = useMutation({
    mutationFn: (text) => securityService.encrypt(text),
    onSuccess: (data) => {
      setEncryptedResult(data.encrypted || '');
      toast({ title: 'Text encrypted successfully' });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Encryption failed',
        description: error.response?.data?.message || 'An error occurred'
      });
    }
  });

  // Decrypt mutation
  const decryptMutation = useMutation({
    mutationFn: (encrypted) => securityService.decrypt(encrypted),
    onSuccess: (data) => {
      setDecryptedResult(data.decrypted || '');
      toast({ title: 'Text decrypted successfully' });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Decryption failed',
        description: error.response?.data?.message || 'An error occurred'
      });
    }
  });

  // Anonymize mutation
  const anonymizeMutation = useMutation({
    mutationFn: (text) => securityService.anonymize(text),
    onSuccess: (data) => {
      setAnonymizedResult(data.anonymized || '');
      toast({ title: 'Text anonymized successfully' });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Anonymization failed',
        description: error.response?.data?.message || 'An error occurred'
      });
    }
  });

  // Submit GDPR request
  const gdprRequestMutation = useMutation({
    mutationFn: (type) => securityService.submitGdprRequest(type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gdprRequests'] });
      toast({
        title: 'GDPR request submitted',
        description: 'Your request will be processed within 30 days'
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Request failed',
        description: error.response?.data?.message || 'An error occurred'
      });
    }
  });

  if (!isAuthenticated) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please login to access security features
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Security & Privacy</h1>
        <p className="text-muted-foreground">
          Manage data encryption, anonymization, and GDPR compliance
        </p>
      </div>

      <Tabs defaultValue="encryption" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="encryption">
            <Lock className="w-4 h-4 mr-2" />
            Encryption
          </TabsTrigger>
          <TabsTrigger value="anonymization">
            <UserCheck className="w-4 h-4 mr-2" />
            Anonymization
          </TabsTrigger>
          <TabsTrigger value="gdpr">
            <Shield className="w-4 h-4 mr-2" />
            GDPR Compliance
          </TabsTrigger>
        </TabsList>

        {/* Encryption Tab */}
        <TabsContent value="encryption" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Encrypt Data</CardTitle>
              <CardDescription>Securely encrypt sensitive text</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Text to Encrypt</Label>
                <Textarea
                  value={textToEncrypt}
                  onChange={(e) => setTextToEncrypt(e.target.value)}
                  placeholder="Enter text to encrypt..."
                  rows={3}
                />
              </div>
              <Button
                onClick={() => encryptMutation.mutate(textToEncrypt)}
                disabled={!textToEncrypt || encryptMutation.isPending}
              >
                {encryptMutation.isPending ? 'Encrypting...' : 'Encrypt'}
              </Button>
              {encryptedResult && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                  <p className="text-xs font-mono break-all">{encryptedResult}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Decrypt Data</CardTitle>
              <CardDescription>Decrypt encrypted text</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Encrypted Text</Label>
                <Textarea
                  value={textToDecrypt}
                  onChange={(e) => setTextToDecrypt(e.target.value)}
                  placeholder="Enter encrypted text..."
                  rows={3}
                />
              </div>
              <Button
                onClick={() => decryptMutation.mutate(textToDecrypt)}
                disabled={!textToDecrypt || decryptMutation.isPending}
              >
                {decryptMutation.isPending ? 'Decrypting...' : 'Decrypt'}
              </Button>
              {decryptedResult && (
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm">{decryptedResult}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anonymization Tab */}
        <TabsContent value="anonymization">
          <Card>
            <CardHeader>
              <CardTitle>Anonymize Personal Data</CardTitle>
              <CardDescription>Remove or mask personally identifiable information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Text to Anonymize</Label>
                <Textarea
                  value={textToAnonymize}
                  onChange={(e) => setTextToAnonymize(e.target.value)}
                  placeholder="Enter text containing personal data (names, emails, etc.)..."
                  rows={4}
                />
              </div>
              <Button
                onClick={() => anonymizeMutation.mutate(textToAnonymize)}
                disabled={!textToAnonymize || anonymizeMutation.isPending}
              >
                {anonymizeMutation.isPending ? 'Anonymizing...' : 'Anonymize'}
              </Button>
              {anonymizedResult && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm whitespace-pre-wrap">{anonymizedResult}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* GDPR Tab */}
        <TabsContent value="gdpr" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GDPR Data Requests</CardTitle>
              <CardDescription>Request your data or request deletion under GDPR</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => gdprRequestMutation.mutate('export')}
                  disabled={gdprRequestMutation.isPending}
                  className="h-auto py-4 flex-col items-start"
                >
                  <Download className="w-5 h-5 mb-2" />
                  <div className="text-left">
                    <div className="font-semibold">Export My Data</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Download all your personal data
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => gdprRequestMutation.mutate('delete')}
                  disabled={gdprRequestMutation.isPending}
                  className="h-auto py-4 flex-col items-start border-red-200 hover:bg-red-50"
                >
                  <AlertTriangle className="w-5 h-5 mb-2 text-red-600" />
                  <div className="text-left">
                    <div className="font-semibold text-red-600">Delete My Data</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Permanently remove your account and data
                    </div>
                  </div>
                </Button>
              </div>

              {gdprRequests.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Recent Requests</h3>
                  <div className="space-y-2">
                    {gdprRequests.map((request, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <div>
                          <div className="font-medium capitalize">{request.type} Request</div>
                          <div className="text-xs text-muted-foreground">{request.date}</div>
                        </div>
                        <Badge variant={request.status === 'completed' ? 'default' : 'secondary'}>
                          {request.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
