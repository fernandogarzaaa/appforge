import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  AlertTriangle, 
  Lock,
  FileSearch,
  Activity,
  CheckCircle,
  XCircle,
  Download
} from 'lucide-react';
import {
  CSPManager,
  SecurityHeaders,
  ThreatDetection,
  VulnerabilityScanner,
  SecurityAuditLog
} from '@/utils/security';

/**
 * SecurityDashboard - Comprehensive security management
 */
export function SecurityDashboard() {
  const [cspPolicy, setCspPolicy] = useState(CSPManager.defaultPolicy);
  const [cspHeader, setCspHeader] = useState('');
  const [headerValidation, setHeaderValidation] = useState(null);
  const [threats, setThreats] = useState([]);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [scanInput, setScanInput] = useState('');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setCspHeader(CSPManager.generateHeader(cspPolicy));
    setHeaderValidation(SecurityHeaders.validateHeaders(SecurityHeaders.getRecommendedHeaders()));
    setThreats(ThreatDetection.getThreats({ limit: 20 }));
    setVulnerabilities(VulnerabilityScanner.vulnerabilities.slice(0, 20));
    setAuditLogs(SecurityAuditLog.getLogs({ limit: 20 }));
  };

  const handleValidateCSP = () => {
    const validation = CSPManager.validatePolicy(cspPolicy);
    alert(JSON.stringify(validation, null, 2));
  };

  const handleUseProductionPolicy = () => {
    setCspPolicy(CSPManager.getProductionPolicy());
    refreshData();
  };

  const handleScanThreats = () => {
    const detected = ThreatDetection.scan({ input: scanInput });
    alert(`Detected ${detected.length} threats`);
    refreshData();
  };

  const handleScanVulnerabilities = () => {
    const found = VulnerabilityScanner.scan({
      code: scanInput,
      password: scanInput,
      dependencies: {}
    });
    alert(`Found ${found.length} vulnerabilities`);
    refreshData();
  };

  const handleLogAuditEvent = () => {
    SecurityAuditLog.log({
      type: 'access',
      severity: 'info',
      userId: 'demo-user',
      action: 'Accessed security dashboard',
      resource: '/security',
      result: 'success',
      ip: '192.168.1.1'
    });
    refreshData();
  };

  const handleExportAuditLogs = () => {
    const data = SecurityAuditLog.exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-audit-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateSampleData = () => {
    // Generate sample threats
    ThreatDetection.scan({ input: "SELECT * FROM users WHERE id=1 OR 1=1" });
    ThreatDetection.scan({ input: "<script>alert('xss')</script>" });
    ThreatDetection.scan({ input: "../../../etc/passwd" });

    // Generate sample vulnerabilities
    VulnerabilityScanner.scan({
      password: 'weak',
      code: 'const API_KEY = "sk-1234567890abcdef"'
    });

    // Generate sample audit logs
    ['login', 'access', 'change', 'alert'].forEach((type, i) => {
      SecurityAuditLog.log({
        type,
        severity: ['info', 'warning', 'error'][i % 3],
        userId: `user-${i + 1}`,
        action: `Performed ${type} action`,
        resource: `/resource-${i}`,
        result: i % 2 === 0 ? 'success' : 'failure',
        ip: `192.168.1.${i + 1}`
      });
    });

    refreshData();
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'warning',
      low: 'secondary'
    };
    return colors[severity] || 'secondary';
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'critical' || severity === 'high') {
      return <XCircle className="h-4 w-4" />;
    }
    return <AlertTriangle className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Security Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            CSP management, threat detection, and security monitoring
          </p>
        </div>
        <Button onClick={generateSampleData}>
          <Activity className="h-4 w-4 mr-2" />
          Generate Sample Data
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {headerValidation?.score.toFixed(0) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {headerValidation?.present.length || 0}/
              {(headerValidation?.present.length || 0) + (headerValidation?.missing.length || 0)} headers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Threats Detected</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{threats.length}</div>
            <p className="text-xs text-muted-foreground">
              Active security threats
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vulnerabilities</CardTitle>
            <FileSearch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vulnerabilities.length}</div>
            <p className="text-xs text-muted-foreground">
              Need remediation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Audit Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.length}</div>
            <p className="text-xs text-muted-foreground">
              Security events logged
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="csp" className="space-y-4">
        <TabsList>
          <TabsTrigger value="csp">CSP Management</TabsTrigger>
          <TabsTrigger value="headers">Security Headers</TabsTrigger>
          <TabsTrigger value="threats">Threat Detection</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* CSP Management */}
        <TabsContent value="csp" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Content Security Policy</CardTitle>
                <CardDescription>
                  Configure CSP directives to prevent XSS attacks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Policy Configuration</label>
                  <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto">
                    {JSON.stringify(cspPolicy, null, 2)}
                  </pre>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleValidateCSP} variant="outline">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Validate Policy
                  </Button>
                  <Button onClick={handleUseProductionPolicy}>
                    <Lock className="h-4 w-4 mr-2" />
                    Use Production Policy
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Generated CSP Header</CardTitle>
                <CardDescription>
                  Ready to use in your HTTP headers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={cspHeader}
                  readOnly
                  className="font-mono text-xs h-[300px]"
                />
                <Button
                  onClick={() => navigator.clipboard.writeText(cspHeader)}
                  variant="outline"
                  className="w-full mt-4"
                >
                  Copy to Clipboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Headers */}
        <TabsContent value="headers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Headers Status</CardTitle>
              <CardDescription>
                Recommended security headers for production
              </CardDescription>
            </CardHeader>
            <CardContent>
              {headerValidation && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Security Score</span>
                    <Badge variant={headerValidation.score >= 75 ? 'default' : 'destructive'}>
                      {headerValidation.score.toFixed(0)}%
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Present Headers ({headerValidation.present.length})
                    </h3>
                    <div className="space-y-1">
                      {headerValidation.present.map(header => (
                        <div key={header} className="text-sm p-2 bg-green-50 dark:bg-green-950 rounded">
                          {header}
                        </div>
                      ))}
                    </div>
                  </div>

                  {headerValidation.missing.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2 flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-destructive" />
                        Missing Headers ({headerValidation.missing.length})
                      </h3>
                      <div className="space-y-1">
                        {headerValidation.missing.map(header => (
                          <div key={header} className="text-sm p-2 bg-destructive/10 rounded">
                            {header}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {headerValidation.recommendations.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Recommendations</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {headerValidation.recommendations.map((rec, i) => (
                          <li key={i}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Threat Detection */}
        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Threat Scanner</CardTitle>
              <CardDescription>
                Test input for common attack patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter text to scan for threats (e.g., SQL injection, XSS)"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                rows={3}
              />
              <Button onClick={handleScanThreats}>
                <FileSearch className="h-4 w-4 mr-2" />
                Scan for Threats
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detected Threats</CardTitle>
              <CardDescription>
                {threats.length} threats found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {threats.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No threats detected
                  </div>
                ) : (
                  <div className="space-y-2">
                    {threats.map(threat => (
                      <div
                        key={threat.id}
                        className="p-4 rounded-lg border bg-destructive/5"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getSeverityIcon(threat.severity)}
                            <span className="font-medium">{threat.name}</span>
                          </div>
                          <Badge variant={getSeverityColor(threat.severity)}>
                            {threat.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {threat.description}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          {new Date(threat.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vulnerabilities */}
        <TabsContent value="vulnerabilities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vulnerability Scanner</CardTitle>
              <CardDescription>
                Scan code for security vulnerabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste code or configuration to scan"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                rows={5}
              />
              <Button onClick={handleScanVulnerabilities}>
                <FileSearch className="h-4 w-4 mr-2" />
                Scan for Vulnerabilities
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Found Vulnerabilities</CardTitle>
              <CardDescription>
                {vulnerabilities.length} issues require attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {vulnerabilities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No vulnerabilities found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vulnerabilities.map((vuln, i) => (
                      <div key={i} className="p-4 rounded-lg border">
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-medium">{vuln.id}</span>
                          <Badge variant={getSeverityColor(vuln.severity)}>
                            {vuln.severity}
                          </Badge>
                        </div>
                        <p className="text-sm mb-2">{vuln.description}</p>
                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                          <strong>Fix:</strong> {vuln.remediation}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Security Audit Log</CardTitle>
                  <CardDescription>
                    Track all security-related events
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleLogAuditEvent} variant="outline">
                    Log Event
                  </Button>
                  <Button onClick={handleExportAuditLogs} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {auditLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No audit logs
                  </div>
                ) : (
                  <div className="space-y-2">
                    {auditLogs.map(log => (
                      <div key={log.id} className="p-3 rounded-lg border text-sm">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{log.type}</Badge>
                            <span className="font-medium">{log.action}</span>
                          </div>
                          <Badge variant={
                            log.severity === 'error' ? 'destructive' :
                            log.severity === 'warning' ? 'warning' : 'secondary'
                          }>
                            {log.severity}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground space-y-1">
                          <div>User: {log.userId} | IP: {log.ip}</div>
                          <div>Resource: {log.resource} | Result: {log.result}</div>
                          <div className="text-xs">{new Date(log.timestamp).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SecurityDashboard;
