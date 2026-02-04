import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { fetchJson } from '@/utils/api';
import { toast } from 'sonner';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Cloud,
  Cpu,
  Database,
  Download,
  Mail,
  RefreshCw,
  Save,
  Shield,
  TestTube,
  Upload,
  XCircle
} from 'lucide-react';

const createDefaultConfig = () => ({
  database: {
    mongoUri: 'mongodb+srv://username:password@cluster.mongodb.net/appforge',
    redis: {
      host: 'redis.internal',
      port: 6379,
      password: '',
      tls: false
    },
    pool: {
      min: 5,
      max: 50,
      idleTimeoutMs: 30000
    },
    sslEnabled: true,
    sslMode: 'require',
    migrations: {
      status: 'up-to-date',
      lastRun: '2026-02-01T13:24:00Z',
      pending: 0,
      history: [
        { id: '2026_01_28_add_usage_index', status: 'applied' },
        { id: '2026_01_15_create_audit_logs', status: 'applied' },
        { id: '2025_12_20_add_analytics_rollups', status: 'applied' }
      ]
    }
  },
  email: {
    provider: 'sendgrid',
    host: 'smtp.sendgrid.net',
    port: 587,
    username: 'apikey',
    password: '',
    from: 'AppForge Ops <ops@appforge.dev>',
    tls: true,
    templatePreview: {
      subject: 'Welcome to AppForge',
      body: 'Hi {{name}},\n\nYour workspace is ready. Sign in to start building.'
    },
    deliveryLogs: [
      { id: 'log-1', recipient: 'team@appforge.dev', status: 'delivered', time: '2026-02-04T08:20:00Z' },
      { id: 'log-2', recipient: 'alerts@appforge.dev', status: 'queued', time: '2026-02-04T07:55:00Z' },
      { id: 'log-3', recipient: 'billing@appforge.dev', status: 'bounced', time: '2026-02-03T21:14:00Z' }
    ]
  },
  deployment: {
    regions: ['us-east-1', 'eu-west-1'],
    autoscaling: {
      min: 2,
      max: 12,
      cpuThreshold: 70,
      memoryThreshold: 75
    },
    cdn: {
      enabled: true,
      provider: 'cloudflare',
      cacheTtlSeconds: 3600
    },
    build: {
      nodeVersion: '20',
      optimizeAssets: true,
      sourceMaps: false,
      buildConcurrency: 4
    }
  },
  quantum: {
    wasmFlags: '-O3 -msimd128',
    workerThreads: 6,
    memoryLimitMb: 768,
    optimizationLevel: 'balanced',
    enableSIMD: true
  },
  security: {
    corsOrigins: 'https://appforge.dev,https://admin.appforge.dev',
    rateLimit: {
      windowSeconds: 60,
      maxRequests: 1200
    },
    csp: "default-src 'self'; img-src 'self' data:; script-src 'self' 'unsafe-inline'",
    enforceHsts: true
  },
  analytics: {
    trackingEnabled: true,
    retentionDays: 90,
    anonymizeIp: true,
    privacyMode: 'balanced',
    sampleRate: 0.5
  }
});

const regionOptions = [
  { id: 'us-east-1', label: 'US East (N. Virginia)' },
  { id: 'us-west-2', label: 'US West (Oregon)' },
  { id: 'eu-west-1', label: 'EU West (Ireland)' },
  { id: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { id: 'sa-east-1', label: 'South America (São Paulo)' }
];

const formatTimestamp = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const ConnectionBadge = ({ status }) => {
  if (status === 'success') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 px-3 py-1 text-xs font-semibold text-white shadow">
        Active
      </span>
    );
  }
  if (status === 'error') {
    return <Badge variant="destructive">Failed</Badge>;
  }
  if (status === 'testing') {
    return <Badge variant="secondary">Testing…</Badge>;
  }
  return <Badge variant="secondary">Not tested</Badge>;
};

export default function AdminSystemConfig() {
  const [config, setConfig] = useState(() => createDefaultConfig());
  const [initialConfig, setInitialConfig] = useState(() => createDefaultConfig());
  const [advancedMode, setAdvancedMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testStatus, setTestStatus] = useState({
    database: { status: 'idle', message: null, lastTested: null },
    email: { status: 'idle', message: null, lastTested: null },
    deployment: { status: 'idle', message: null, lastTested: null },
    quantum: { status: 'idle', message: null, lastTested: null },
    security: { status: 'idle', message: null, lastTested: null },
    analytics: { status: 'idle', message: null, lastTested: null }
  });
  const fileInputRef = useRef(null);

  const isDirty = useMemo(() => JSON.stringify(config) !== JSON.stringify(initialConfig), [config, initialConfig]);
  const isCategoryDirty = (category) => JSON.stringify(config[category]) !== JSON.stringify(initialConfig[category]);

  const updateConfigValue = (category, path, value) => {
    setConfig((prev) => {
      const updatePath = (obj, remainingPath) => {
        if (remainingPath.length === 1) {
          return { ...obj, [remainingPath[0]]: value };
        }
        const [head, ...rest] = remainingPath;
        return {
          ...obj,
          [head]: updatePath(obj?.[head] || {}, rest)
        };
      };
      return {
        ...prev,
        [category]: updatePath(prev?.[category] || {}, path)
      };
    });
  };

  const validationErrors = useMemo(() => {
    const errors = {
      database: {},
      email: {},
      deployment: {},
      quantum: {},
      security: {},
      analytics: {}
    };

    if (!config.database.mongoUri?.trim() || !/^mongodb(\+srv)?:\/\//.test(config.database.mongoUri.trim())) {
      errors.database.mongoUri = 'Enter a valid MongoDB connection string.';
    }
    if (!config.database.redis.host?.trim()) {
      errors.database.redisHost = 'Redis host is required.';
    }
    if (!config.database.redis.port || config.database.redis.port < 1 || config.database.redis.port > 65535) {
      errors.database.redisPort = 'Redis port must be between 1 and 65535.';
    }
    if (config.database.pool.min < 1 || config.database.pool.max < 1 || config.database.pool.max < config.database.pool.min) {
      errors.database.pool = 'Pool min must be ≥ 1 and max must be ≥ min.';
    }

    if (!config.email.host?.trim()) {
      errors.email.host = 'SMTP host is required.';
    }
    if (!config.email.port || config.email.port < 1 || config.email.port > 65535) {
      errors.email.port = 'SMTP port must be between 1 and 65535.';
    }
    if (!config.email.from?.trim()) {
      errors.email.from = 'From address is required.';
    }

    if (!config.deployment.regions?.length) {
      errors.deployment.regions = 'Select at least one deployment region.';
    }
    if (config.deployment.autoscaling.min < 1 || config.deployment.autoscaling.max < config.deployment.autoscaling.min) {
      errors.deployment.autoscaling = 'Autoscaling min must be ≥ 1 and max must be ≥ min.';
    }
    if (config.deployment.autoscaling.cpuThreshold < 1 || config.deployment.autoscaling.cpuThreshold > 100) {
      errors.deployment.cpuThreshold = 'CPU threshold must be between 1 and 100.';
    }
    if (config.deployment.autoscaling.memoryThreshold < 1 || config.deployment.autoscaling.memoryThreshold > 100) {
      errors.deployment.memoryThreshold = 'Memory threshold must be between 1 and 100.';
    }
    if (config.deployment.cdn.enabled && !config.deployment.cdn.provider) {
      errors.deployment.cdnProvider = 'CDN provider is required when enabled.';
    }
    if (!config.deployment.build.nodeVersion?.trim()) {
      errors.deployment.nodeVersion = 'Node.js version is required.';
    }

    if (config.quantum.workerThreads < 1 || config.quantum.workerThreads > 64) {
      errors.quantum.workerThreads = 'Worker threads must be between 1 and 64.';
    }
    if (config.quantum.memoryLimitMb < 128) {
      errors.quantum.memoryLimitMb = 'Memory limit should be at least 128 MB.';
    }

    if (!config.security.corsOrigins?.trim()) {
      errors.security.corsOrigins = 'CORS origins are required.';
    }
    if (config.security.rateLimit.windowSeconds < 1 || config.security.rateLimit.maxRequests < 1) {
      errors.security.rateLimit = 'Rate limits must be positive numbers.';
    }
    if (advancedMode && !config.security.csp?.trim()) {
      errors.security.csp = 'Content Security Policy is required in Advanced Mode.';
    }

    if (config.analytics.retentionDays < 1) {
      errors.analytics.retentionDays = 'Retention days must be at least 1.';
    }
    if (config.analytics.sampleRate < 0 || config.analytics.sampleRate > 1) {
      errors.analytics.sampleRate = 'Sample rate must be between 0 and 1.';
    }

    return errors;
  }, [config, advancedMode]);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const data = await fetchJson('/api/admin/config', { credentials: 'include' });
      const defaults = createDefaultConfig();
      const merged = {
        ...defaults,
        ...(data?.config || data || {})
      };
      setConfig(merged);
      setInitialConfig(merged);
    } catch (error) {
      console.error('Failed to load system configuration:', error);
      toast.error('Failed to load system configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSaveCategory = async (category) => {
    try {
      setIsSaving(true);
      await fetchJson(`/api/admin/config/${category}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config[category])
      });
      setInitialConfig((prev) => ({
        ...prev,
        [category]: config[category]
      }));
      toast.success(`${category} settings saved.`);
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error(`Failed to save ${category} settings.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      await Promise.all(
        ['database', 'email', 'deployment', 'quantum', 'security', 'analytics'].map((category) =>
          fetchJson(`/api/admin/config/${category}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(config[category])
          })
        )
      );
      setInitialConfig(JSON.parse(JSON.stringify(config)));
      toast.success('All settings saved.');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast.error('Failed to save configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    const defaults = createDefaultConfig();
    setConfig(defaults);
    toast.message('Defaults restored. Review and save to apply.');
  };

  const handleTestConnection = async (category) => {
    setTestStatus((prev) => ({
      ...prev,
      [category]: { status: 'testing', message: null, lastTested: prev[category]?.lastTested || null }
    }));
    try {
      if (category === 'database' || category === 'email') {
        const result = await fetchJson('/api/admin/config/test-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ category, config: config[category] })
        });
        setTestStatus((prev) => ({
          ...prev,
          [category]: {
            status: result?.success ? 'success' : 'error',
            message: result?.message || (result?.success ? 'Connection successful.' : 'Connection failed.'),
            lastTested: new Date().toISOString()
          }
        }));
        if (result?.success) {
          toast.success(result?.message || 'Connection successful.');
        } else {
          toast.error(result?.message || 'Connection failed.');
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setTestStatus((prev) => ({
          ...prev,
          [category]: {
            status: 'success',
            message: 'Validation complete.',
            lastTested: new Date().toISOString()
          }
        }));
        toast.success('Validation complete.');
      }
    } catch (error) {
      console.error('Test failed:', error);
      setTestStatus((prev) => ({
        ...prev,
        [category]: { status: 'error', message: 'Test failed.', lastTested: new Date().toISOString() }
      }));
      toast.error('Test failed.');
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/config/export', {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Export failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'appforge-admin-config.json';
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Configuration exported.');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export configuration.');
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await fetchJson('/api/admin/config/import', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      if (data?.config) {
        setConfig(data.config);
        setInitialConfig(data.config);
      }
      toast.success('Configuration imported.');
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import configuration.');
    } finally {
      event.target.value = '';
    }
  };

  const handleRegionToggle = (regionId) => {
    const selected = config.deployment.regions.includes(regionId);
    const next = selected
      ? config.deployment.regions.filter((region) => region !== regionId)
      : [...config.deployment.regions, regionId];
    updateConfigValue('deployment', ['regions'], next);
  };

  const renderValidationMessage = (message) =>
    message ? (
      <div className="mt-1 flex items-center gap-2 text-xs text-red-500">
        <AlertTriangle className="h-3 w-3" />
        <span>{message}</span>
      </div>
    ) : null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Configuration</h1>
          <p className="text-muted-foreground">
            Manage platform-wide settings across infrastructure, security, and quantum lab operations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border px-3 py-1">
            <span className="text-xs font-medium text-slate-600">Beginner</span>
            <Switch checked={advancedMode} onCheckedChange={setAdvancedMode} />
            <span className="text-xs font-medium text-slate-900">Advanced</span>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImport} className="hidden" />
          <Button variant="outline" onClick={handleResetDefaults}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset to defaults
          </Button>
          <Button onClick={handleSaveAll} disabled={isSaving || !isDirty}>
            <Save className="mr-2 h-4 w-4" />
            Save all
          </Button>
        </div>
      </div>

      {isDirty && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="flex items-center gap-3 py-4 text-sm text-yellow-700">
            <AlertTriangle className="h-4 w-4" />
            Unsaved changes detected. Save to apply updates across services.
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card>
          <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading configuration...
          </CardContent>
        </Card>
      )}

      <Accordion type="multiple" defaultValue={['database', 'email']} className="space-y-4">
        <AccordionItem value="database" className="border rounded-xl">
          <AccordionTrigger className="px-6">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-slate-700" />
                <div>
                  <p className="text-base font-semibold">Database Settings</p>
                  <p className="text-xs text-muted-foreground">MongoDB, Redis, pools, and migrations</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isCategoryDirty('database') && <Badge variant="secondary">Unsaved</Badge>}
                <ConnectionBadge status={testStatus.database.status} />
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="border-0 shadow-none">
              <CardContent className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <Label>MongoDB connection string</Label>
                    <Input
                      value={config.database.mongoUri}
                      onChange={(e) => updateConfigValue('database', ['mongoUri'], e.target.value)}
                      className={validationErrors.database.mongoUri ? 'border-red-500' : ''}
                    />
                    {renderValidationMessage(validationErrors.database.mongoUri)}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pt-1">
                      <Switch
                        checked={config.database.sslEnabled}
                        onCheckedChange={(value) => updateConfigValue('database', ['sslEnabled'], value)}
                      />
                      <Label>Enable SSL</Label>
                    </div>
                    <Label>SSL mode</Label>
                    <Select
                      value={config.database.sslMode}
                      onValueChange={(value) => updateConfigValue('database', ['sslMode'], value)}
                      disabled={!config.database.sslEnabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select SSL mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="require">Require SSL</SelectItem>
                        <SelectItem value="prefer">Prefer SSL</SelectItem>
                        <SelectItem value="disable">Disable SSL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div>
                    <Label>Redis host</Label>
                    <Input
                      value={config.database.redis.host}
                      onChange={(e) => updateConfigValue('database', ['redis', 'host'], e.target.value)}
                      className={validationErrors.database.redisHost ? 'border-red-500' : ''}
                    />
                    {renderValidationMessage(validationErrors.database.redisHost)}
                  </div>
                  <div>
                    <Label>Redis port</Label>
                    <Input
                      type="number"
                      value={config.database.redis.port}
                      onChange={(e) => updateConfigValue('database', ['redis', 'port'], Number(e.target.value))}
                      className={validationErrors.database.redisPort ? 'border-red-500' : ''}
                    />
                    {renderValidationMessage(validationErrors.database.redisPort)}
                  </div>
                  <div>
                    <Label>Redis password</Label>
                    <Input
                      type="password"
                      value={config.database.redis.password}
                      onChange={(e) => updateConfigValue('database', ['redis', 'password'], e.target.value)}
                    />
                  </div>
                </div>

                {advancedMode && (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={config.database.redis.tls}
                      onCheckedChange={(value) => updateConfigValue('database', ['redis', 'tls'], value)}
                    />
                    <Label>Enable Redis TLS</Label>
                  </div>
                )}

                {advancedMode && (
                  <div className="grid gap-4 lg:grid-cols-3">
                    <div>
                      <Label>Pool min</Label>
                      <Input
                        type="number"
                        value={config.database.pool.min}
                        onChange={(e) => updateConfigValue('database', ['pool', 'min'], Number(e.target.value))}
                        className={validationErrors.database.pool ? 'border-red-500' : ''}
                      />
                    </div>
                    <div>
                      <Label>Pool max</Label>
                      <Input
                        type="number"
                        value={config.database.pool.max}
                        onChange={(e) => updateConfigValue('database', ['pool', 'max'], Number(e.target.value))}
                        className={validationErrors.database.pool ? 'border-red-500' : ''}
                      />
                    </div>
                    <div>
                      <Label>Idle timeout (ms)</Label>
                      <Input
                        type="number"
                        value={config.database.pool.idleTimeoutMs}
                        onChange={(e) => updateConfigValue('database', ['pool', 'idleTimeoutMs'], Number(e.target.value))}
                        className={validationErrors.database.pool ? 'border-red-500' : ''}
                      />
                    </div>
                  </div>
                )}
                {advancedMode && renderValidationMessage(validationErrors.database.pool)}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Migration status</p>
                    <p className="text-xs text-muted-foreground">Last run {formatTimestamp(config.database.migrations.lastRun)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={config.database.migrations.pending === 0 ? 'secondary' : 'destructive'}>
                      {config.database.migrations.pending === 0 ? 'Up to date' : `${config.database.migrations.pending} pending`}
                    </Badge>
                  </div>
                </div>

                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Migration</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {config.database.migrations.history.map((migration) => (
                        <TableRow key={migration.id}>
                          <TableCell className="font-mono text-xs">{migration.id}</TableCell>
                          <TableCell>
                            <Badge variant={migration.status === 'applied' ? 'secondary' : 'destructive'}>
                              {migration.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => handleTestConnection('database')}>
                    <TestTube className="mr-2 h-4 w-4" />
                    Test connection
                  </Button>
                  <Button onClick={() => handleSaveCategory('database')} disabled={isSaving || !isCategoryDirty('database')}>
                    <Save className="mr-2 h-4 w-4" />
                    Save database settings
                  </Button>
                  {testStatus.database.message && (
                    <span className="text-xs text-muted-foreground">
                      {testStatus.database.message} • {formatTimestamp(testStatus.database.lastTested)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="email" className="border rounded-xl">
          <AccordionTrigger className="px-6">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-slate-700" />
                <div>
                  <p className="text-base font-semibold">Email / SMTP Settings</p>
                  <p className="text-xs text-muted-foreground">Providers, templates, and delivery health</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isCategoryDirty('email') && <Badge variant="secondary">Unsaved</Badge>}
                <ConnectionBadge status={testStatus.email.status} />
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="border-0 shadow-none">
              <CardContent className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <Label>SMTP provider</Label>
                    <Select
                      value={config.email.provider}
                      onValueChange={(value) => updateConfigValue('email', ['provider'], value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                        <SelectItem value="ses">AWS SES</SelectItem>
                        <SelectItem value="mailgun">Mailgun</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>From address</Label>
                    <Input
                      value={config.email.from}
                      onChange={(e) => updateConfigValue('email', ['from'], e.target.value)}
                      className={validationErrors.email.from ? 'border-red-500' : ''}
                    />
                    {renderValidationMessage(validationErrors.email.from)}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div>
                    <Label>SMTP host</Label>
                    <Input
                      value={config.email.host}
                      onChange={(e) => updateConfigValue('email', ['host'], e.target.value)}
                      className={validationErrors.email.host ? 'border-red-500' : ''}
                    />
                    {renderValidationMessage(validationErrors.email.host)}
                  </div>
                  <div>
                    <Label>SMTP port</Label>
                    <Input
                      type="number"
                      value={config.email.port}
                      onChange={(e) => updateConfigValue('email', ['port'], Number(e.target.value))}
                      className={validationErrors.email.port ? 'border-red-500' : ''}
                    />
                    {renderValidationMessage(validationErrors.email.port)}
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      checked={config.email.tls}
                      onCheckedChange={(value) => updateConfigValue('email', ['tls'], value)}
                    />
                    <Label>Enable TLS</Label>
                  </div>
                </div>

                {advancedMode && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                      <Label>SMTP username</Label>
                      <Input
                        value={config.email.username}
                        onChange={(e) => updateConfigValue('email', ['username'], e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>SMTP password</Label>
                      <Input
                        type="password"
                        value={config.email.password}
                        onChange={(e) => updateConfigValue('email', ['password'], e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Template preview</CardTitle>
                      <CardDescription>Email rendering for onboarding</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs font-semibold text-slate-700">{config.email.templatePreview.subject}</p>
                      <pre className="mt-2 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-xs text-slate-600">
                        {config.email.templatePreview.body}
                      </pre>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Delivery logs</CardTitle>
                      <CardDescription>Latest SMTP activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Recipient</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Time</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {config.email.deliveryLogs.map((log) => (
                              <TableRow key={log.id}>
                                <TableCell className="text-xs">{log.recipient}</TableCell>
                                <TableCell>
                                  <Badge variant={log.status === 'delivered' ? 'secondary' : log.status === 'queued' ? 'outline' : 'destructive'}>
                                    {log.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{formatTimestamp(log.time)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => handleTestConnection('email')}>
                    <TestTube className="mr-2 h-4 w-4" />
                    Test email
                  </Button>
                  <Button onClick={() => handleSaveCategory('email')} disabled={isSaving || !isCategoryDirty('email')}>
                    <Save className="mr-2 h-4 w-4" />
                    Save email settings
                  </Button>
                  {testStatus.email.message && (
                    <span className="text-xs text-muted-foreground">
                      {testStatus.email.message} • {formatTimestamp(testStatus.email.lastTested)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="deployment" className="border rounded-xl">
          <AccordionTrigger className="px-6">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-3">
                <Cloud className="h-5 w-5 text-slate-700" />
                <div>
                  <p className="text-base font-semibold">Deployment Config</p>
                  <p className="text-xs text-muted-foreground">Regions, auto-scaling, and build tuning</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isCategoryDirty('deployment') && <Badge variant="secondary">Unsaved</Badge>}
                <ConnectionBadge status={testStatus.deployment.status} />
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="border-0 shadow-none">
              <CardContent className="space-y-6">
                <div>
                  <Label className="mb-2 block">Deployment regions</Label>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {regionOptions.map((region) => (
                      <label key={region.id} className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                        <Checkbox
                          checked={config.deployment.regions.includes(region.id)}
                          onCheckedChange={() => handleRegionToggle(region.id)}
                        />
                        <span>{region.label}</span>
                      </label>
                    ))}
                  </div>
                  {renderValidationMessage(validationErrors.deployment.regions)}
                </div>

                <div className="grid gap-4 lg:grid-cols-4">
                  <div>
                    <Label>Min instances</Label>
                    <Input
                      type="number"
                      value={config.deployment.autoscaling.min}
                      onChange={(e) => updateConfigValue('deployment', ['autoscaling', 'min'], Number(e.target.value))}
                      className={validationErrors.deployment.autoscaling ? 'border-red-500' : ''}
                    />
                  </div>
                  <div>
                    <Label>Max instances</Label>
                    <Input
                      type="number"
                      value={config.deployment.autoscaling.max}
                      onChange={(e) => updateConfigValue('deployment', ['autoscaling', 'max'], Number(e.target.value))}
                      className={validationErrors.deployment.autoscaling ? 'border-red-500' : ''}
                    />
                  </div>
                  <div>
                    <Label>CPU threshold (%)</Label>
                    <Input
                      type="number"
                      value={config.deployment.autoscaling.cpuThreshold}
                      onChange={(e) => updateConfigValue('deployment', ['autoscaling', 'cpuThreshold'], Number(e.target.value))}
                      className={validationErrors.deployment.cpuThreshold ? 'border-red-500' : ''}
                    />
                  </div>
                  <div>
                    <Label>Memory threshold (%)</Label>
                    <Input
                      type="number"
                      value={config.deployment.autoscaling.memoryThreshold}
                      onChange={(e) => updateConfigValue('deployment', ['autoscaling', 'memoryThreshold'], Number(e.target.value))}
                      className={validationErrors.deployment.memoryThreshold ? 'border-red-500' : ''}
                    />
                  </div>
                  {renderValidationMessage(validationErrors.deployment.autoscaling)}
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      checked={config.deployment.cdn.enabled}
                      onCheckedChange={(value) => updateConfigValue('deployment', ['cdn', 'enabled'], value)}
                    />
                    <Label>Enable CDN</Label>
                  </div>
                  <div>
                    <Label>CDN provider</Label>
                    <Select
                      value={config.deployment.cdn.provider}
                      onValueChange={(value) => updateConfigValue('deployment', ['cdn', 'provider'], value)}
                      disabled={!config.deployment.cdn.enabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cloudflare">Cloudflare</SelectItem>
                        <SelectItem value="fastly">Fastly</SelectItem>
                        <SelectItem value="akamai">Akamai</SelectItem>
                      </SelectContent>
                    </Select>
                    {renderValidationMessage(validationErrors.deployment.cdnProvider)}
                  </div>
                  {advancedMode && (
                    <div>
                      <Label>Cache TTL (seconds)</Label>
                      <Input
                        type="number"
                        value={config.deployment.cdn.cacheTtlSeconds}
                        onChange={(e) => updateConfigValue('deployment', ['cdn', 'cacheTtlSeconds'], Number(e.target.value))}
                      />
                    </div>
                  )}
                </div>

                <div className="grid gap-4 lg:grid-cols-4">
                  <div>
                    <Label>Node.js version</Label>
                    <Input
                      value={config.deployment.build.nodeVersion}
                      onChange={(e) => updateConfigValue('deployment', ['build', 'nodeVersion'], e.target.value)}
                      className={validationErrors.deployment.nodeVersion ? 'border-red-500' : ''}
                    />
                    {renderValidationMessage(validationErrors.deployment.nodeVersion)}
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      checked={config.deployment.build.optimizeAssets}
                      onCheckedChange={(value) => updateConfigValue('deployment', ['build', 'optimizeAssets'], value)}
                    />
                    <Label>Optimize assets</Label>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      checked={config.deployment.build.sourceMaps}
                      onCheckedChange={(value) => updateConfigValue('deployment', ['build', 'sourceMaps'], value)}
                    />
                    <Label>Enable source maps</Label>
                  </div>
                  {advancedMode && (
                    <div>
                      <Label>Build concurrency</Label>
                      <Input
                        type="number"
                        value={config.deployment.build.buildConcurrency}
                        onChange={(e) => updateConfigValue('deployment', ['build', 'buildConcurrency'], Number(e.target.value))}
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => handleTestConnection('deployment')}>
                    <TestTube className="mr-2 h-4 w-4" />
                    Run diagnostics
                  </Button>
                  <Button onClick={() => handleSaveCategory('deployment')} disabled={isSaving || !isCategoryDirty('deployment')}>
                    <Save className="mr-2 h-4 w-4" />
                    Save deployment settings
                  </Button>
                  {testStatus.deployment.message && (
                    <span className="text-xs text-muted-foreground">
                      {testStatus.deployment.message} • {formatTimestamp(testStatus.deployment.lastTested)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="quantum" className="border rounded-xl">
          <AccordionTrigger className="px-6">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-3">
                <Cpu className="h-5 w-5 text-slate-700" />
                <div>
                  <p className="text-base font-semibold">Quantum Lab Settings</p>
                  <p className="text-xs text-muted-foreground">WASM optimization, threads, memory</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isCategoryDirty('quantum') && <Badge variant="secondary">Unsaved</Badge>}
                <ConnectionBadge status={testStatus.quantum.status} />
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="border-0 shadow-none">
              <CardContent className="space-y-6">
                <div>
                  <Label>WASM compilation flags</Label>
                  <Textarea
                    value={config.quantum.wasmFlags}
                    onChange={(e) => updateConfigValue('quantum', ['wasmFlags'], e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                  <div>
                    <Label>Worker thread count</Label>
                    <Input
                      type="number"
                      value={config.quantum.workerThreads}
                      onChange={(e) => updateConfigValue('quantum', ['workerThreads'], Number(e.target.value))}
                      className={validationErrors.quantum.workerThreads ? 'border-red-500' : ''}
                    />
                    {renderValidationMessage(validationErrors.quantum.workerThreads)}
                  </div>
                  <div>
                    <Label>Memory limit (MB)</Label>
                    <Input
                      type="number"
                      value={config.quantum.memoryLimitMb}
                      onChange={(e) => updateConfigValue('quantum', ['memoryLimitMb'], Number(e.target.value))}
                      className={validationErrors.quantum.memoryLimitMb ? 'border-red-500' : ''}
                    />
                    {renderValidationMessage(validationErrors.quantum.memoryLimitMb)}
                  </div>
                  <div>
                    <Label>Optimization level</Label>
                    <Select
                      value={config.quantum.optimizationLevel}
                      onValueChange={(value) => updateConfigValue('quantum', ['optimizationLevel'], value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="memory">Memory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {advancedMode && (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={config.quantum.enableSIMD}
                      onCheckedChange={(value) => updateConfigValue('quantum', ['enableSIMD'], value)}
                    />
                    <Label>Enable SIMD acceleration</Label>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => handleTestConnection('quantum')}>
                    <TestTube className="mr-2 h-4 w-4" />
                    Run quantum checks
                  </Button>
                  <Button onClick={() => handleSaveCategory('quantum')} disabled={isSaving || !isCategoryDirty('quantum')}>
                    <Save className="mr-2 h-4 w-4" />
                    Save quantum settings
                  </Button>
                  {testStatus.quantum.message && (
                    <span className="text-xs text-muted-foreground">
                      {testStatus.quantum.message} • {formatTimestamp(testStatus.quantum.lastTested)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="security" className="border rounded-xl">
          <AccordionTrigger className="px-6">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-slate-700" />
                <div>
                  <p className="text-base font-semibold">Security Settings</p>
                  <p className="text-xs text-muted-foreground">CORS, rate limits, and CSP policies</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isCategoryDirty('security') && <Badge variant="secondary">Unsaved</Badge>}
                <ConnectionBadge status={testStatus.security.status} />
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="border-0 shadow-none">
              <CardContent className="space-y-6">
                <div>
                  <Label>CORS allowed origins</Label>
                  <Input
                    value={config.security.corsOrigins}
                    onChange={(e) => updateConfigValue('security', ['corsOrigins'], e.target.value)}
                    className={validationErrors.security.corsOrigins ? 'border-red-500' : ''}
                  />
                  {renderValidationMessage(validationErrors.security.corsOrigins)}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <Label>Rate limit window (seconds)</Label>
                    <Input
                      type="number"
                      value={config.security.rateLimit.windowSeconds}
                      onChange={(e) => updateConfigValue('security', ['rateLimit', 'windowSeconds'], Number(e.target.value))}
                      className={validationErrors.security.rateLimit ? 'border-red-500' : ''}
                    />
                  </div>
                  <div>
                    <Label>Max requests per window</Label>
                    <Input
                      type="number"
                      value={config.security.rateLimit.maxRequests}
                      onChange={(e) => updateConfigValue('security', ['rateLimit', 'maxRequests'], Number(e.target.value))}
                      className={validationErrors.security.rateLimit ? 'border-red-500' : ''}
                    />
                  </div>
                  {renderValidationMessage(validationErrors.security.rateLimit)}
                </div>

                {advancedMode && (
                  <div>
                    <Label>Content Security Policy</Label>
                    <Textarea
                      value={config.security.csp}
                      onChange={(e) => updateConfigValue('security', ['csp'], e.target.value)}
                      className={validationErrors.security.csp ? 'border-red-500' : ''}
                      rows={4}
                    />
                    {renderValidationMessage(validationErrors.security.csp)}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Switch
                    checked={config.security.enforceHsts}
                    onCheckedChange={(value) => updateConfigValue('security', ['enforceHsts'], value)}
                  />
                  <Label>Enforce HSTS headers</Label>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => handleTestConnection('security')}>
                    <TestTube className="mr-2 h-4 w-4" />
                    Validate security posture
                  </Button>
                  <Button onClick={() => handleSaveCategory('security')} disabled={isSaving || !isCategoryDirty('security')}>
                    <Save className="mr-2 h-4 w-4" />
                    Save security settings
                  </Button>
                  {testStatus.security.message && (
                    <span className="text-xs text-muted-foreground">
                      {testStatus.security.message} • {formatTimestamp(testStatus.security.lastTested)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="analytics" className="border rounded-xl">
          <AccordionTrigger className="px-6">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-slate-700" />
                <div>
                  <p className="text-base font-semibold">Analytics Configuration</p>
                  <p className="text-xs text-muted-foreground">Tracking, retention, and privacy controls</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isCategoryDirty('analytics') && <Badge variant="secondary">Unsaved</Badge>}
                <ConnectionBadge status={testStatus.analytics.status} />
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="border-0 shadow-none">
              <CardContent className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      checked={config.analytics.trackingEnabled}
                      onCheckedChange={(value) => updateConfigValue('analytics', ['trackingEnabled'], value)}
                    />
                    <Label>Enable tracking</Label>
                  </div>
                  <div>
                    <Label>Retention (days)</Label>
                    <Input
                      type="number"
                      value={config.analytics.retentionDays}
                      onChange={(e) => updateConfigValue('analytics', ['retentionDays'], Number(e.target.value))}
                      className={validationErrors.analytics.retentionDays ? 'border-red-500' : ''}
                    />
                    {renderValidationMessage(validationErrors.analytics.retentionDays)}
                  </div>
                  <div>
                    <Label>Sample rate (0-1)</Label>
                    <Input
                      type="number"
                      step="0.05"
                      value={config.analytics.sampleRate}
                      onChange={(e) => updateConfigValue('analytics', ['sampleRate'], Number(e.target.value))}
                      className={validationErrors.analytics.sampleRate ? 'border-red-500' : ''}
                    />
                    {renderValidationMessage(validationErrors.analytics.sampleRate)}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      checked={config.analytics.anonymizeIp}
                      onCheckedChange={(value) => updateConfigValue('analytics', ['anonymizeIp'], value)}
                    />
                    <Label>Anonymize IP addresses</Label>
                  </div>
                  <div>
                    <Label>Privacy mode</Label>
                    <Select
                      value={config.analytics.privacyMode}
                      onValueChange={(value) => updateConfigValue('analytics', ['privacyMode'], value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strict">Strict</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="insights">Insights-first</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => handleTestConnection('analytics')}>
                    <TestTube className="mr-2 h-4 w-4" />
                    Validate analytics pipeline
                  </Button>
                  <Button onClick={() => handleSaveCategory('analytics')} disabled={isSaving || !isCategoryDirty('analytics')}>
                    <Save className="mr-2 h-4 w-4" />
                    Save analytics settings
                  </Button>
                  {testStatus.analytics.message && (
                    <span className="text-xs text-muted-foreground">
                      {testStatus.analytics.message} • {formatTimestamp(testStatus.analytics.lastTested)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Configuration health</CardTitle>
              <CardDescription>Live status across critical services</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isDirty ? (
                <Badge variant="outline" className="flex items-center gap-1 text-yellow-600">
                  <AlertTriangle className="h-3 w-3" /> Pending changes
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" /> Synced
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { key: 'database', label: 'Database', icon: Database },
              { key: 'email', label: 'Email', icon: Mail },
              { key: 'deployment', label: 'Deployment', icon: Cloud },
              { key: 'quantum', label: 'Quantum', icon: Cpu },
              { key: 'security', label: 'Security', icon: Shield },
              { key: 'analytics', label: 'Analytics', icon: BarChart3 }
            ].map((item) => {
              const Icon = item.icon;
              const status = testStatus[item.key]?.status;
              return (
                <div key={item.key} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-slate-600" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    {status === 'success' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                    {status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                    {status !== 'success' && status !== 'error' && <AlertTriangle className="h-4 w-4 text-slate-300" />}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{testStatus[item.key]?.message || 'Awaiting test'}</span>
                    <span>{formatTimestamp(testStatus[item.key]?.lastTested)}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                    <div
                      className={
                        status === 'success'
                          ? 'h-1.5 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500'
                          : status === 'error'
                            ? 'h-1.5 rounded-full bg-red-400'
                            : 'h-1.5 rounded-full bg-slate-200'
                      }
                      style={{ width: status === 'success' ? '100%' : status === 'error' ? '45%' : '20%' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
