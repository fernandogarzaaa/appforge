import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, EyeOff, Lock, Unlock, Key, Search, Download, Upload, 
  History, AlertTriangle, CheckCircle, Clock, Edit2, Save, 
  X, RotateCw, Shield, Database, Settings, Flag, RefreshCw,
  ChevronRight, Calendar, User, FileText, Code, Check, Copy
} from 'lucide-react';

// ConfigEditor Component - JSON/YAML Editor with syntax highlighting
const ConfigEditor = ({ value, onChange, language = 'json', error }) => {
  const [localValue, setLocalValue] = useState(value);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Validate JSON
    if (language === 'json') {
      try {
        JSON.parse(newValue);
        setIsValid(true);
        onChange(newValue);
      } catch (err) {
        setIsValid(false);
      }
    } else {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={localValue}
        onChange={handleChange}
        className={`font-mono text-sm min-h-[200px] ${!isValid ? 'border-red-500' : ''}`}
        placeholder={language === 'json' ? '{\n  "key": "value"\n}' : 'key: value'}
      />
      {!isValid && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertTriangle className="w-4 h-4" />
          <span>Invalid JSON format</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// KeyManager Component - Masked value with reveal toggle
const KeyManager = ({ label, value, onCopy, isVisible, onToggleVisibility, canReveal = true }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maskedValue = value && value.length > 8 
    ? `${value.substring(0, 4)}${'•'.repeat(Math.max(value.length - 8, 8))}${value.slice(-4)}`
    : '••••••••';

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
      <div className="flex-1 font-mono text-sm">
        {isVisible ? value : maskedValue}
      </div>
      <div className="flex items-center gap-1">
        {canReveal && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleVisibility}
            className="h-8 w-8 p-0"
          >
            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 w-8 p-0"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};

// DangerZone Component - Critical secrets section
const DangerZone = ({ secrets, onUpdate, onRollback }) => {
  const [confirmAction, setConfirmAction] = useState(null);

  return (
    <Card className="border-red-500/50 bg-red-500/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <CardTitle>Danger Zone</CardTitle>
        </div>
        <CardDescription>
          Critical secrets that require extra caution when modifying
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {secrets.map((secret) => (
          <div key={secret.key} className="p-4 border border-red-500/20 rounded-lg space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold flex items-center gap-2">
                  {secret.label}
                  <Badge variant="destructive">Critical</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{secret.description}</p>
              </div>
            </div>
            <KeyManager
              value={secret.value}
              onCopy={(val) => navigator.clipboard.writeText(val)}
              isVisible={secret.visible || false}
              onToggleVisibility={() => {}}
              canReveal={false}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmAction(secret.key)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Modify
              </Button>
              {secret.previousValue && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRollback(secret.key)}
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  Rollback
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default function AdminSecrets() {
  const [secrets, setSecrets] = useState([
    // Environment Variables
    {
      id: '1',
      category: 'environment',
      key: 'NODE_ENV',
      label: 'Node Environment',
      value: 'production',
      type: 'string',
      encrypted: false,
      modified: '2026-02-01T10:00:00Z',
      modifiedBy: 'admin@appforge.dev',
      status: 'active',
      description: 'Application runtime environment',
      previousValue: 'development',
      canRollback: true
    },
    {
      id: '2',
      category: 'environment',
      key: 'API_URL',
      label: 'API Base URL',
      value: 'https://api.appforge.dev',
      type: 'string',
      encrypted: false,
      modified: '2026-01-15T14:30:00Z',
      modifiedBy: 'fernando@appforge.dev',
      status: 'active',
      description: 'Base URL for API endpoints'
    },
    {
      id: '3',
      category: 'environment',
      key: 'PORT',
      label: 'Server Port',
      value: '3000',
      type: 'number',
      encrypted: false,
      modified: '2026-01-10T09:00:00Z',
      modifiedBy: 'admin@appforge.dev',
      status: 'active',
      description: 'Port for the application server'
    },
    // Integration Credentials
    {
      id: '4',
      category: 'integrations',
      key: 'STRIPE_SECRET_KEY',
      label: 'Stripe Secret Key',
      value: 'sk_live_PLACEHOLDER',
      type: 'secret',
      encrypted: true,
      modified: '2026-02-03T16:20:00Z',
      modifiedBy: 'admin@appforge.dev',
      status: 'active',
      description: 'Stripe API secret key for payment processing',
      critical: true,
      previousValue: 'sk_live_oldkey123456'
    },
    {
      id: '5',
      category: 'integrations',
      key: 'SENDGRID_API_KEY',
      label: 'SendGrid API Key',
      value: 'SG.abcdefghijklmnopqrstuvwxyz1234567890',
      type: 'secret',
      encrypted: true,
      modified: '2026-01-28T11:45:00Z',
      modifiedBy: 'fernando@appforge.dev',
      status: 'active',
      description: 'SendGrid API key for email services',
      critical: true
    },
    {
      id: '6',
      category: 'integrations',
      key: 'AWS_ACCESS_KEY_ID',
      label: 'AWS Access Key',
      value: 'AKIAIOSFODNN7EXAMPLE',
      type: 'secret',
      encrypted: true,
      modified: '2026-02-02T08:15:00Z',
      modifiedBy: 'admin@appforge.dev',
      status: 'active',
      description: 'AWS access key for cloud services',
      critical: true
    },
    {
      id: '7',
      category: 'integrations',
      key: 'AWS_SECRET_ACCESS_KEY',
      label: 'AWS Secret Key',
      value: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      type: 'secret',
      encrypted: true,
      modified: '2026-02-02T08:15:00Z',
      modifiedBy: 'admin@appforge.dev',
      status: 'active',
      description: 'AWS secret access key',
      critical: true
    },
    // Feature Flags
    {
      id: '8',
      category: 'features',
      key: 'ENABLE_AI_FEATURES',
      label: 'AI Features Enabled',
      value: 'true',
      type: 'boolean',
      encrypted: false,
      modified: '2026-02-04T07:00:00Z',
      modifiedBy: 'admin@appforge.dev',
      status: 'active',
      description: 'Enable AI-powered features',
      rolloutPercentage: 100
    },
    {
      id: '9',
      category: 'features',
      key: 'ENABLE_BETA_FEATURES',
      label: 'Beta Features',
      value: 'true',
      type: 'boolean',
      encrypted: false,
      modified: '2026-02-03T12:30:00Z',
      modifiedBy: 'fernando@appforge.dev',
      status: 'active',
      description: 'Enable beta features for testing',
      rolloutPercentage: 50,
      targetGroups: ['beta-testers', 'internal']
    },
    {
      id: '10',
      category: 'features',
      key: 'ENABLE_ANALYTICS',
      label: 'Analytics Tracking',
      value: 'true',
      type: 'boolean',
      encrypted: false,
      modified: '2026-01-20T15:00:00Z',
      modifiedBy: 'admin@appforge.dev',
      status: 'active',
      description: 'Enable analytics and tracking',
      rolloutPercentage: 100
    },
    // Database Credentials
    {
      id: '11',
      category: 'database',
      key: 'DATABASE_URL',
      label: 'Database Connection String',
      value: 'postgresql://user:pass@localhost:5432/appforge',
      type: 'secret',
      encrypted: true,
      modified: '2026-01-15T10:00:00Z',
      modifiedBy: 'admin@appforge.dev',
      status: 'active',
      description: 'PostgreSQL database connection string',
      critical: true
    },
    {
      id: '12',
      category: 'database',
      key: 'REDIS_URL',
      label: 'Redis Connection String',
      value: 'redis://localhost:6379',
      type: 'secret',
      encrypted: true,
      modified: '2026-01-15T10:00:00Z',
      modifiedBy: 'admin@appforge.dev',
      status: 'active',
      description: 'Redis cache connection string',
      critical: true
    },
    // Custom/API Keys
    {
      id: '13',
      category: 'custom',
      key: 'OPENAI_API_KEY',
      label: 'OpenAI API Key',
      value: 'sk-proj-abcdefghijklmnopqrstuvwxyz',
      type: 'secret',
      encrypted: true,
      modified: '2026-02-01T14:20:00Z',
      modifiedBy: 'fernando@appforge.dev',
      status: 'active',
      description: 'OpenAI API key for AI features'
    },
    {
      id: '14',
      category: 'custom',
      key: 'GITHUB_TOKEN',
      label: 'GitHub Personal Access Token',
      value: 'ghp_1234567890abcdefghijklmnopqrstuvwxyz',
      type: 'secret',
      encrypted: true,
      modified: '2026-01-25T09:30:00Z',
      modifiedBy: 'admin@appforge.dev',
      status: 'active',
      description: 'GitHub token for repository access'
    },
    {
      id: '15',
      category: 'custom',
      key: 'APP_CONFIG',
      label: 'Application Configuration',
      value: JSON.stringify({ maxUploadSize: '10MB', timeout: 30000, retries: 3 }, null, 2),
      type: 'json',
      encrypted: false,
      modified: '2026-02-02T11:00:00Z',
      modifiedBy: 'admin@appforge.dev',
      status: 'active',
      description: 'JSON configuration for application settings'
    }
  ]);

  const [activeTab, setActiveTab] = useState('environment');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModified, setFilterModified] = useState(false);
  const [visibleSecrets, setVisibleSecrets] = useState({});
  const [editingSecret, setEditingSecret] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showDiffDialog, setShowDiffDialog] = useState(false);
  const [diffSecret, setDiffSecret] = useState(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [auditLog, setAuditLog] = useState([
    {
      id: '1',
      action: 'UPDATE',
      secretKey: 'STRIPE_SECRET_KEY',
      user: 'admin@appforge.dev',
      timestamp: '2026-02-03T16:20:00Z',
      oldValue: 'sk_live_oldkey***',
      newValue: 'sk_live_51234***',
      reason: 'Key rotation'
    },
    {
      id: '2',
      action: 'CREATE',
      secretKey: 'ENABLE_AI_FEATURES',
      user: 'admin@appforge.dev',
      timestamp: '2026-02-04T07:00:00Z',
      newValue: 'true',
      reason: 'Feature rollout'
    },
    {
      id: '3',
      action: 'UPDATE',
      secretKey: 'ENABLE_BETA_FEATURES',
      user: 'fernando@appforge.dev',
      timestamp: '2026-02-03T12:30:00Z',
      oldValue: 'false',
      newValue: 'true',
      reason: 'Beta testing phase'
    }
  ]);
  const [beginnerMode, setBeginnerMode] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSecret, setNewSecret] = useState({
    category: 'custom',
    key: '',
    label: '',
    value: '',
    type: 'string',
    description: ''
  });

  // Filter secrets by category and search
  const filteredSecrets = secrets.filter(secret => {
    const matchesCategory = activeTab === 'all' || secret.category === activeTab;
    const matchesSearch = !searchTerm || 
      secret.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      secret.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      secret.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModified = !filterModified || secret.previousValue;
    
    // In beginner mode, hide complex/critical secrets
    if (beginnerMode && (secret.type === 'json' || secret.critical)) {
      return false;
    }
    
    return matchesCategory && matchesSearch && matchesModified;
  });

  const criticalSecrets = secrets.filter(s => s.critical);

  const handleToggleVisibility = (id) => {
    setVisibleSecrets(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleEditSecret = (secret) => {
    setEditingSecret(secret);
    setEditValue(secret.value);
  };

  const handleSaveSecret = async () => {
    if (!editingSecret) return;

    // Show diff dialog for confirmation
    setDiffSecret({
      ...editingSecret,
      newValue: editValue
    });
    setShowDiffDialog(true);
  };

  const confirmSaveSecret = async () => {
    if (!diffSecret) return;

    // In production: PUT /api/admin/secrets/:key
    const updatedSecrets = secrets.map(s => 
      s.id === diffSecret.id 
        ? {
            ...s,
            value: diffSecret.newValue,
            previousValue: s.value,
            modified: new Date().toISOString(),
            modifiedBy: 'admin@appforge.dev',
            status: 'active',
            canRollback: true
          }
        : s
    );

    setSecrets(updatedSecrets);
    
    // Add to audit log
    setAuditLog([
      {
        id: Date.now().toString(),
        action: 'UPDATE',
        secretKey: diffSecret.key,
        user: 'admin@appforge.dev',
        timestamp: new Date().toISOString(),
        oldValue: diffSecret.value.substring(0, 10) + '***',
        newValue: diffSecret.newValue.substring(0, 10) + '***',
        reason: 'Manual update'
      },
      ...auditLog
    ]);

    setShowDiffDialog(false);
    setEditingSecret(null);
    setDiffSecret(null);
  };

  const handleCancelEdit = () => {
    setEditingSecret(null);
    setEditValue('');
  };

  const handleRollback = async (secretId) => {
    const secret = secrets.find(s => s.id === secretId);
    if (!secret || !secret.previousValue) return;

    if (!confirm(`Rollback ${secret.label} to previous value?`)) return;

    // In production: PUT /api/admin/secrets/:key/rollback
    const updatedSecrets = secrets.map(s => 
      s.id === secretId 
        ? {
            ...s,
            value: s.previousValue,
            previousValue: s.value,
            modified: new Date().toISOString(),
            modifiedBy: 'admin@appforge.dev'
          }
        : s
    );

    setSecrets(updatedSecrets);
    
    // Add to audit log
    setAuditLog([
      {
        id: Date.now().toString(),
        action: 'ROLLBACK',
        secretKey: secret.key,
        user: 'admin@appforge.dev',
        timestamp: new Date().toISOString(),
        oldValue: secret.value.substring(0, 10) + '***',
        newValue: secret.previousValue.substring(0, 10) + '***',
        reason: 'Rollback to previous value'
      },
      ...auditLog
    ]);
  };

  const handleExport = async () => {
    // In production: POST /api/admin/secrets/export
    const exportData = {
      version: '1.0',
      exported: new Date().toISOString(),
      exportedBy: 'admin@appforge.dev',
      secrets: secrets.map(s => ({
        key: s.key,
        value: s.value,
        category: s.category,
        type: s.type,
        encrypted: s.encrypted,
        description: s.description
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `secrets-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    setIsExportDialogOpen(false);
  };

  const handleImport = async () => {
    try {
      const data = JSON.parse(importData);
      
      if (!data.secrets || !Array.isArray(data.secrets)) {
        throw new Error('Invalid import format');
      }

      if (!confirm(`Import ${data.secrets.length} secrets? This will overwrite existing values.`)) {
        return;
      }

      // In production: POST /api/admin/secrets/import
      const importedSecrets = data.secrets.map(s => {
        const existing = secrets.find(es => es.key === s.key);
        return {
          id: existing?.id || Date.now().toString() + Math.random(),
          ...s,
          modified: new Date().toISOString(),
          modifiedBy: 'admin@appforge.dev',
          status: 'active',
          previousValue: existing?.value
        };
      });

      // Merge with existing secrets
      const mergedSecrets = secrets.map(s => {
        const imported = importedSecrets.find(is => is.key === s.key);
        return imported || s;
      });

      // Add new secrets
      const newSecrets = importedSecrets.filter(is => !secrets.find(s => s.key === is.key));
      setSecrets([...mergedSecrets, ...newSecrets]);

      setIsImportDialogOpen(false);
      setImportData('');

    } catch (err) {
      alert('Import failed: ' + err.message);
    }
  };

  const handleCreateSecret = async () => {
    if (!newSecret.key || !newSecret.label || !newSecret.value) {
      alert('Please fill in all required fields');
      return;
    }

    // In production: POST /api/admin/secrets
    const secret = {
      id: Date.now().toString(),
      ...newSecret,
      encrypted: newSecret.type === 'secret',
      modified: new Date().toISOString(),
      modifiedBy: 'admin@appforge.dev',
      status: 'active'
    };

    setSecrets([...secrets, secret]);
    setIsCreateDialogOpen(false);
    setNewSecret({
      category: 'custom',
      key: '',
      label: '',
      value: '',
      type: 'string',
      description: ''
    });

    // Add to audit log
    setAuditLog([
      {
        id: Date.now().toString(),
        action: 'CREATE',
        secretKey: secret.key,
        user: 'admin@appforge.dev',
        timestamp: new Date().toISOString(),
        newValue: secret.value.substring(0, 10) + '***',
        reason: 'New secret created'
      },
      ...auditLog
    ]);
  };

  const handleDeleteSecret = async (secretId) => {
    const secret = secrets.find(s => s.id === secretId);
    if (!secret) return;

    if (!confirm(`Delete secret "${secret.label}"? This action cannot be undone.`)) return;

    // In production: DELETE /api/admin/secrets/:key
    setSecrets(secrets.filter(s => s.id !== secretId));

    // Add to audit log
    setAuditLog([
      {
        id: Date.now().toString(),
        action: 'DELETE',
        secretKey: secret.key,
        user: 'admin@appforge.dev',
        timestamp: new Date().toISOString(),
        oldValue: secret.value.substring(0, 10) + '***',
        reason: 'Secret deleted'
      },
      ...auditLog
    ]);
  };

  const handleFeatureFlagToggle = (secretId) => {
    const secret = secrets.find(s => s.id === secretId);
    if (!secret || secret.type !== 'boolean') return;

    const newValue = secret.value === 'true' ? 'false' : 'true';
    
    const updatedSecrets = secrets.map(s => 
      s.id === secretId 
        ? {
            ...s,
            value: newValue,
            previousValue: s.value,
            modified: new Date().toISOString(),
            modifiedBy: 'admin@appforge.dev'
          }
        : s
    );

    setSecrets(updatedSecrets);
  };

  const handleRolloutPercentageChange = (secretId, percentage) => {
    const updatedSecrets = secrets.map(s => 
      s.id === secretId 
        ? {
            ...s,
            rolloutPercentage: percentage,
            modified: new Date().toISOString(),
            modifiedBy: 'admin@appforge.dev'
          }
        : s
    );

    setSecrets(updatedSecrets);
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'environment': return <Settings className="w-4 h-4" />;
      case 'integrations': return <Key className="w-4 h-4" />;
      case 'features': return <Flag className="w-4 h-4" />;
      case 'database': return <Database className="w-4 h-4" />;
      case 'custom': return <Code className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'environment': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'integrations': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'features': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'database': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'custom': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusColor = (secret) => {
    if (secret.status === 'active' && !secret.previousValue) {
      return 'bg-green-500/10 text-green-600 border-green-500/20';
    } else if (secret.previousValue) {
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    } else {
      return 'bg-red-500/10 text-red-600 border-red-500/20';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8" />
            Secrets Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage environment variables, API keys, and feature flags
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="beginner-mode" className="text-sm">Beginner Mode</Label>
            <Switch
              id="beginner-mode"
              checked={beginnerMode}
              onCheckedChange={setBeginnerMode}
            />
          </div>
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Key className="w-4 h-4 mr-2" />
            Add Secret
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Secrets</p>
                <p className="text-2xl font-bold">{secrets.length}</p>
              </div>
              <Key className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Encrypted</p>
                <p className="text-2xl font-bold">{secrets.filter(s => s.encrypted).length}</p>
              </div>
              <Lock className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Modified</p>
                <p className="text-2xl font-bold">{secrets.filter(s => s.previousValue).length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold">{criticalSecrets.length}</p>
              </div>
              <Shield className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search secrets by name, key, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="filter-modified"
                checked={filterModified}
                onCheckedChange={setFilterModified}
              />
              <Label htmlFor="filter-modified" className="text-sm whitespace-nowrap">
                Show Modified Only
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content - Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="environment">
            <Settings className="w-4 h-4 mr-2" />
            Environment
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Key className="w-4 h-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="features">
            <Flag className="w-4 h-4 mr-2" />
            Features
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="w-4 h-4 mr-2" />
            Database
          </TabsTrigger>
          <TabsTrigger value="custom">
            <Code className="w-4 h-4 mr-2" />
            Custom
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {/* Secrets List */}
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'all' ? 'All Secrets' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Secrets`}
              </CardTitle>
              <CardDescription>
                {filteredSecrets.length} secret{filteredSecrets.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredSecrets.map((secret) => (
                  <div 
                    key={secret.id}
                    className="p-4 border rounded-lg space-y-3 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{secret.label}</h3>
                          <Badge variant="outline" className={getCategoryColor(secret.category)}>
                            {getCategoryIcon(secret.category)}
                            <span className="ml-1">{secret.category}</span>
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(secret)}>
                            {secret.previousValue ? 'Modified' : 'Active'}
                          </Badge>
                          {secret.encrypted && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                              <Lock className="w-3 h-3 mr-1" />
                              Encrypted
                            </Badge>
                          )}
                          {secret.critical && (
                            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Critical
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">{secret.key}</p>
                        {secret.description && (
                          <p className="text-sm text-muted-foreground mt-1">{secret.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Feature Flag Controls */}
                    {secret.type === 'boolean' && (
                      <div className="space-y-3 pt-3 border-t">
                        <div className="flex items-center justify-between">
                          <Label>Feature Enabled</Label>
                          <Switch
                            checked={secret.value === 'true'}
                            onCheckedChange={() => handleFeatureFlagToggle(secret.id)}
                          />
                        </div>
                        {secret.rolloutPercentage !== undefined && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Rollout Percentage</Label>
                              <span className="text-sm font-semibold">{secret.rolloutPercentage}%</span>
                            </div>
                            <Slider
                              value={[secret.rolloutPercentage]}
                              onValueChange={([value]) => handleRolloutPercentageChange(secret.id, value)}
                              max={100}
                              step={5}
                              className="w-full"
                            />
                          </div>
                        )}
                        {secret.targetGroups && (
                          <div>
                            <Label className="text-sm">Target Groups</Label>
                            <div className="flex gap-2 mt-2">
                              {secret.targetGroups.map((group) => (
                                <Badge key={group} variant="secondary">{group}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Value Display/Editor */}
                    {editingSecret?.id === secret.id ? (
                      <div className="space-y-3 pt-3 border-t">
                        {secret.type === 'json' ? (
                          <ConfigEditor
                            value={editValue}
                            onChange={setEditValue}
                            language="json"
                          />
                        ) : (
                          <Textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="font-mono text-sm"
                            rows={secret.type === 'secret' ? 2 : 3}
                          />
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveSecret}>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {secret.type !== 'boolean' && (
                          <KeyManager
                            label={secret.label}
                            value={secret.value}
                            onCopy={(val) => navigator.clipboard.writeText(val)}
                            isVisible={visibleSecrets[secret.id] || false}
                            onToggleVisibility={() => handleToggleVisibility(secret.id)}
                            canReveal={!secret.critical || !beginnerMode}
                          />
                        )}
                      </>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Modified: {formatTimestamp(secret.modified)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{secret.modifiedBy}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t">
                      {editingSecret?.id !== secret.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditSecret(secret)}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      )}
                      {secret.canRollback && secret.previousValue && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRollback(secret.id)}
                        >
                          <RotateCw className="w-4 h-4 mr-2" />
                          Rollback
                        </Button>
                      )}
                      {!secret.critical && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteSecret(secret.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      )}
                      {secret.previousValue && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDiffSecret(secret);
                            setShowDiffDialog(true);
                          }}
                        >
                          <History className="w-4 h-4 mr-2" />
                          View Changes
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {filteredSecrets.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No secrets found matching your filters</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone for Critical Secrets */}
          {!beginnerMode && criticalSecrets.length > 0 && activeTab === 'all' && (
            <DangerZone
              secrets={criticalSecrets.map(s => ({
                ...s,
                visible: visibleSecrets[s.id] || false
              }))}
              onUpdate={handleEditSecret}
              onRollback={handleRollback}
            />
          )}

          {/* Audit Trail */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Audit Trail
              </CardTitle>
              <CardDescription>Recent changes to secrets</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Secret</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Changes</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLog.slice(0, 10).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant={
                          log.action === 'CREATE' ? 'default' :
                          log.action === 'UPDATE' ? 'secondary' :
                          log.action === 'DELETE' ? 'destructive' :
                          'outline'
                        }>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{log.secretKey}</TableCell>
                      <TableCell className="text-sm">{log.user}</TableCell>
                      <TableCell className="text-sm">{formatTimestamp(log.timestamp)}</TableCell>
                      <TableCell className="text-sm font-mono">
                        {log.oldValue && <span className="text-red-500">{log.oldValue}</span>}
                        {log.oldValue && log.newValue && <ChevronRight className="inline w-4 h-4 mx-1" />}
                        {log.newValue && <span className="text-green-500">{log.newValue}</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{log.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Secret Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Secret</DialogTitle>
            <DialogDescription>Add a new environment variable or API key</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={newSecret.category} 
                  onValueChange={(value) => setNewSecret({ ...newSecret, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="environment">Environment</SelectItem>
                    <SelectItem value="integrations">Integrations</SelectItem>
                    <SelectItem value="features">Features</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={newSecret.type} 
                  onValueChange={(value) => setNewSecret({ ...newSecret, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="secret">Secret (Encrypted)</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="key">Key *</Label>
              <Input
                id="key"
                placeholder="e.g., API_KEY or FEATURE_FLAG"
                value={newSecret.key}
                onChange={(e) => setNewSecret({ ...newSecret, key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') })}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Label *</Label>
              <Input
                id="label"
                placeholder="Human-readable name"
                value={newSecret.label}
                onChange={(e) => setNewSecret({ ...newSecret, label: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Value *</Label>
              {newSecret.type === 'json' ? (
                <ConfigEditor
                  value={newSecret.value}
                  onChange={(value) => setNewSecret({ ...newSecret, value })}
                  language="json"
                />
              ) : (
                <Textarea
                  id="value"
                  placeholder="Enter secret value"
                  value={newSecret.value}
                  onChange={(e) => setNewSecret({ ...newSecret, value: e.target.value })}
                  className={newSecret.type === 'secret' ? 'font-mono' : ''}
                  rows={3}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What is this secret used for?"
                value={newSecret.description}
                onChange={(e) => setNewSecret({ ...newSecret, description: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSecret}>
              <Key className="w-4 h-4 mr-2" />
              Create Secret
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diff/Changes Dialog */}
      <Dialog open={showDiffDialog} onOpenChange={setShowDiffDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Changes</DialogTitle>
            <DialogDescription>
              Review the changes before saving
            </DialogDescription>
          </DialogHeader>
          {diffSecret && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">{diffSecret.label}</Label>
                <p className="text-sm text-muted-foreground font-mono">{diffSecret.key}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Previous Value</Label>
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg font-mono text-sm break-all">
                  {diffSecret.value || diffSecret.previousValue}
                </div>
              </div>
              <div className="flex items-center justify-center">
                <ChevronRight className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">New Value</Label>
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg font-mono text-sm break-all">
                  {diffSecret.newValue || diffSecret.value}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDiffDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSaveSecret}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Secrets Configuration</DialogTitle>
            <DialogDescription>
              Download an encrypted JSON backup of all secrets
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Security Warning</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This export will contain sensitive data. Store the file securely and never commit it to version control.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm">Export will include:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>{secrets.length} total secrets</li>
                <li>{secrets.filter(s => s.encrypted).length} encrypted values</li>
                <li>All metadata and timestamps</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Secrets Configuration</DialogTitle>
            <DialogDescription>
              Upload a JSON backup to restore or merge secrets
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Import Warning</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Importing will overwrite existing secrets with matching keys. Make sure you have a backup before proceeding.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-data">Paste JSON Configuration</Label>
              <Textarea
                id="import-data"
                placeholder='{"version": "1.0", "secrets": [...]}'
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="font-mono text-sm min-h-[300px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!importData}>
              <Upload className="w-4 h-4 mr-2" />
              Import Secrets
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
