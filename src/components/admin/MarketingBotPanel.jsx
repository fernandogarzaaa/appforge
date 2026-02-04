import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, CheckCircle2, XCircle, Zap } from 'lucide-react';

export default function MarketingBotPanel() {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // New lead form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: ''
  });
  const [isQualifying, setIsQualifying] = useState(null);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setIsLoading(true);
      const leadsList = await base44.entities.Lead.list('-updated_date', 50);
      setLeads(leadsList || []);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQualifyLead = async (lead) => {
    try {
      setIsQualifying(lead.id);
      await base44.functions.invoke('qualifyLead', {
        lead_id: lead.id,
        lead_email: lead.email,
        lead_name: lead.name,
        lead_company: lead.company
      });
      await loadLeads();
    } catch (error) {
      console.error('Qualification error:', error);
    } finally {
      setIsQualifying(null);
    }
  };

  const handleAddLead = async (e) => {
    e.preventDefault();
    try {
      setIsQualifying('new');
      await base44.functions.invoke('qualifyLead', {
        lead_email: formData.email,
        lead_name: formData.name,
        lead_company: formData.company
      });
      setFormData({ name: '', email: '', company: '' });
      await loadLeads();
      setActiveTab('dashboard');
    } catch (error) {
      console.error('Error adding lead:', error);
    } finally {
      setIsQualifying(null);
    }
  };

  const qualifiedLeads = leads.filter(l => l.status === 'qualified').length;
  const avgScore = leads.length > 0
    ? Math.round(leads.reduce((sum, l) => sum + (l.qualification_score || 0), 0) / leads.length)
    : 0;

  const statusColors = {
    qualified: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    contacted: 'bg-blue-100 text-blue-800',
    converted: 'bg-purple-100 text-purple-800',
    new: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="add">Add Lead</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-gray-500">Total Leads</p>
                <p className="text-2xl font-bold">{leads.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-gray-500">Qualified</p>
                <p className="text-2xl font-bold text-green-600">{qualifiedLeads}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-gray-500">Avg Score</p>
                <p className="text-2xl font-bold text-purple-600">{avgScore}</p>
              </CardContent>
            </Card>
          </div>

          {/* Leads List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Leads</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : leads.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">No leads yet</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {leads.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-3 border rounded bg-gradient-to-r from-slate-50 to-slate-100 flex items-center justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold truncate">{lead.name || lead.email}</p>
                          <Badge className={statusColors[lead.status] || statusColors.new}>
                            {lead.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 truncate">{lead.email}</p>
                        {lead.company && (
                          <p className="text-xs text-gray-500">{lead.company}</p>
                        )}
                        {lead.qualification_reason && (
                          <p className="text-xs text-gray-600 mt-1 italic">
                            {lead.qualification_reason}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        {lead.qualification_score !== undefined && (
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Score</p>
                            <p className="text-lg font-bold text-purple-600">
                              {lead.qualification_score}
                            </p>
                          </div>
                        )}

                        {lead.status === 'new' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQualifyLead(lead)}
                            disabled={isQualifying === lead.id}
                          >
                            {isQualifying === lead.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Zap className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Add New Lead</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddLead} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Email *
                  </label>
                  <Input
                    type="email"
                    placeholder="lead@company.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Name
                  </label>
                  <Input
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Company
                  </label>
                  <Input
                    placeholder="Acme Corp"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                  disabled={isQualifying === 'new'}
                >
                  {isQualifying === 'new' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Qualifying...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add & Qualify Lead
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}