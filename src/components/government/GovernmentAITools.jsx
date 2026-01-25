import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { 
  Building2, FileText, Scale, Users, 
  Shield, Database, TrendingUp, Globe
} from 'lucide-react';

export default function GovernmentAITools() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [input, setInput] = useState('');

  const governmentTools = [
    {
      name: 'Policy Analysis',
      description: 'Analyze policy documents and legislative text',
      icon: FileText,
      action: 'policy',
      color: 'blue'
    },
    {
      name: 'Regulatory Compliance',
      description: 'Check compliance with regulations and laws',
      icon: Scale,
      action: 'compliance',
      color: 'green'
    },
    {
      name: 'Citizen Service Chatbot',
      description: 'AI assistant for government services inquiries',
      icon: Users,
      action: 'chatbot',
      color: 'purple'
    },
    {
      name: 'Document Classification',
      description: 'Automatically classify and tag government documents',
      icon: Database,
      action: 'classify',
      color: 'orange'
    },
    {
      name: 'Budget Analyzer',
      description: 'Analyze budget allocation and spending patterns',
      icon: TrendingUp,
      action: 'budget',
      color: 'indigo'
    },
    {
      name: 'Public Sentiment Analysis',
      description: 'Analyze public opinion on policies and initiatives',
      icon: Globe,
      action: 'sentiment',
      color: 'cyan'
    },
    {
      name: 'Fraud Detection',
      description: 'Detect anomalies and potential fraud in data',
      icon: Shield,
      action: 'fraud',
      color: 'red'
    },
    {
      name: 'Form Processing',
      description: 'Extract data from government forms automatically',
      icon: FileText,
      action: 'forms',
      color: 'yellow'
    }
  ];

  const runTool = async (action) => {
    if (!input.trim()) {
      toast.error('Please provide input data');
      return;
    }

    setLoading(true);
    toast.loading('AI is processing government data...');

    try {
      let prompt = '';
      
      switch(action) {
        case 'policy':
          prompt = `Analyze this policy document:\n${input}\n\nProvide: summary, key provisions, stakeholder impact, implementation challenges, recommendations.`;
          break;
        case 'compliance':
          prompt = `Check this content for regulatory compliance:\n${input}\n\nIdentify: compliance issues, regulatory requirements, risk level, corrective actions needed.`;
          break;
        case 'chatbot':
          prompt = `As a government services assistant, respond to:\n${input}\n\nProvide clear, accurate information about government services, procedures, and requirements.`;
          break;
        case 'classify':
          prompt = `Classify this government document:\n${input}\n\nProvide: document type, category, tags, sensitivity level, retention period, relevant departments.`;
          break;
        case 'budget':
          prompt = `Analyze this budget data:\n${input}\n\nProvide: spending breakdown, trends, efficiency metrics, cost-saving opportunities, risk areas.`;
          break;
        case 'sentiment':
          prompt = `Analyze public sentiment about:\n${input}\n\nProvide: overall sentiment, key themes, concerns, support level, demographic insights, recommendations.`;
          break;
        case 'fraud':
          prompt = `Analyze this data for fraud indicators:\n${input}\n\nIdentify: anomalies, suspicious patterns, risk score, recommended actions, investigation priorities.`;
          break;
        case 'forms':
          prompt = `Extract structured data from this form:\n${input}\n\nProvide: extracted fields, data validation, missing information, structured JSON output.`;
          break;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: action === 'sentiment'
      });

      setResult(response);
      toast.dismiss();
      toast.success('Analysis complete!');
    } catch (error) {
      toast.dismiss();
      toast.error('Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Government AI Tools</h2>
          <p className="text-gray-500">AI solutions for public sector and administration</p>
        </div>
        <Badge className="bg-blue-600">
          <Building2 className="w-3 h-3 mr-1" />
          Gov Tech
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Input Data</CardTitle>
          <CardDescription>Enter policy text, documents, data, or queries</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Example: Analyze the impact of new environmental policy on local businesses..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={6}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {governmentTools.map((tool, idx) => (
          <Card key={idx} className="hover:shadow-lg transition-all">
            <CardContent className="pt-6">
              <div className="mb-4">
                <div className={`w-10 h-10 rounded-lg bg-${tool.color}-100 flex items-center justify-center mb-3`}>
                  <tool.icon className={`w-5 h-5 text-${tool.color}-600`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{tool.name}</h3>
                <p className="text-xs text-gray-600">{tool.description}</p>
              </div>
              <Button 
                className="w-full" 
                size="sm"
                onClick={() => runTool(tool.action)}
                disabled={loading}
              >
                Run Tool
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">{result}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}