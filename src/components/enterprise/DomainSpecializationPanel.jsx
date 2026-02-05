import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Zap } from 'lucide-react';

export default function DomainSpecializationPanel() {
  const [domains, setDomains] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const data = await base44.entities.DomainSpecialization.list('-active_users', 10);
      setDomains(data || []);
    } catch (error) {
      console.error('Failed to fetch domains:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const DOMAIN_COLORS = {
    finance: 'bg-blue-100 text-blue-900',
    healthcare: 'bg-green-100 text-green-900',
    enterprise_software: 'bg-purple-100 text-purple-900',
    legal: 'bg-amber-100 text-amber-900',
    manufacturing: 'bg-orange-100 text-orange-900',
    research: 'bg-cyan-100 text-cyan-900',
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Domain Expertise & Scaling Proof
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-xs text-gray-500">Loading domains...</p>
          ) : domains.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">No domain specializations yet</p>
          ) : (
            domains.map((domain) => (
              <div key={domain.id} className={`p-3 rounded-lg border ${DOMAIN_COLORS[domain.domain]}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm capitalize">{domain.domain.replace(/_/g, ' ')}</p>
                    <p className="text-xs opacity-75 mt-0.5">{domain.description}</p>
                  </div>
                  <Badge className="ml-2">{domain.active_users} users</Badge>
                </div>

                {domain.performance_metrics && (
                  <div className="space-y-2 mt-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Expertise Score</span>
                        <span className="font-semibold">
                          {(domain.performance_metrics.domain_expertise_score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress
                        value={domain.performance_metrics.domain_expertise_score * 100}
                        className="h-1.5"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="opacity-75">Satisfaction</p>
                        <p className="font-semibold">
                          {(domain.performance_metrics.avg_satisfaction * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="opacity-75">Deployments</p>
                        <p className="font-semibold">{domain.performance_metrics.deployments_count}</p>
                      </div>
                    </div>
                  </div>
                )}

                {domain.agent_templates && domain.agent_templates.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                    <p className="text-xs opacity-75 mb-1">Optimized Agents</p>
                    <div className="flex flex-wrap gap-1">
                      {domain.agent_templates.map((agent, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {agent}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}