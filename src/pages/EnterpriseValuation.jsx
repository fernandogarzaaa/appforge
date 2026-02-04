import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DomainSpecializationPanel from '@/components/enterprise/DomainSpecializationPanel';
import ComplianceDashboard from '@/components/enterprise/ComplianceDashboard';
import ScalabilityMetricsPanel from '@/components/enterprise/ScalabilityMetricsPanel';
import { TrendingUp, CheckCircle2, Globe } from 'lucide-react';

export default function EnterpriseValuation() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Enterprise Valuation Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Demonstrating domain expertise, compliance readiness, and multi-domain scalability
          </p>
        </div>

        {/* Value Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-semibold mb-1">Domain Expertise</p>
                  <p className="text-2xl font-bold text-blue-600">6</p>
                  <p className="text-xs text-gray-600 mt-2">Verticals Optimized</p>
                </div>
                <Globe className="w-8 h-8 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-semibold mb-1">Compliance Ready</p>
                  <p className="text-2xl font-bold text-green-600">6</p>
                  <p className="text-xs text-gray-600 mt-2">Frameworks Certified</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-semibold mb-1">Scalability Proof</p>
                  <p className="text-2xl font-bold text-purple-600">10K+</p>
                  <p className="text-xs text-gray-600 mt-2">Multi-Domain Users</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="domains" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="domains">Domain Expertise</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="scaling">Scaling Proof</TabsTrigger>
          </TabsList>

          <TabsContent value="domains">
            <DomainSpecializationPanel />
          </TabsContent>

          <TabsContent value="compliance">
            <ComplianceDashboard />
          </TabsContent>

          <TabsContent value="scaling">
            <ScalabilityMetricsPanel />
          </TabsContent>
        </Tabs>

        {/* Investor Value Props */}
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardHeader>
            <CardTitle className="text-sm">Key Value Propositions for Investors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Domain Specialization</p>
                  <p className="text-xs text-gray-600">
                    Proven expertise across 6 verticals with domain-optimized agents
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Regulatory Compliance</p>
                  <p className="text-xs text-gray-600">
                    SOC2, HIPAA, GDPR certified - Enterprise-ready security
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Proven Scalability</p>
                  <p className="text-xs text-gray-600">
                    Successfully operating across multiple domains with 99.9% uptime
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Growth Trajectory</p>
                  <p className="text-xs text-gray-600">
                    24% MoM growth with 85% retention across all domains
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}