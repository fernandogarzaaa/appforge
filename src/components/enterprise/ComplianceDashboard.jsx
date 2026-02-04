import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, Lock, FileText } from 'lucide-react';

export default function ComplianceDashboard() {
  const [audits, setAudits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    try {
      const data = await base44.entities.ComplianceAudit.list('-completion_percentage', 10);
      setAudits(data || []);
    } catch (error) {
      console.error('Failed to fetch audits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'certified':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'certified':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'in_progress':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Compliance & Regulatory Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-xs text-gray-500">Loading compliance status...</p>
          ) : audits.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">No compliance audits yet</p>
          ) : (
            audits.map((audit) => (
              <div key={audit.id} className={`p-3 rounded-lg border ${getStatusColor(audit.status)}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(audit.status)}
                    <div>
                      <p className="font-semibold text-sm">{audit.compliance_framework}</p>
                      <p className="text-xs opacity-75 capitalize">{audit.domain}</p>
                    </div>
                  </div>
                  <Badge className="capitalize text-xs">
                    {audit.status.replace(/_/g, ' ')}
                  </Badge>
                </div>

                <div className="space-y-2 mt-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Completion</span>
                      <span className="font-semibold">{audit.completion_percentage}%</span>
                    </div>
                    <Progress value={audit.completion_percentage} className="h-1.5" />
                  </div>

                  {audit.data_privacy && (
                    <div className="pt-2 border-t border-current border-opacity-20 text-xs space-y-1">
                      <p className="font-semibold opacity-75">Data Privacy</p>
                      <div className="grid grid-cols-2 gap-1">
                        {Object.entries(audit.data_privacy).map(([key, value]) => {
                          if (typeof value === 'boolean') {
                            return (
                              <div key={key} className="flex items-center gap-1">
                                {value ? (
                                  <CheckCircle2 className="w-3 h-3" />
                                ) : (
                                  <AlertCircle className="w-3 h-3" />
                                )}
                                <span className="opacity-75">{key.replace(/_/g, ' ')}</span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}