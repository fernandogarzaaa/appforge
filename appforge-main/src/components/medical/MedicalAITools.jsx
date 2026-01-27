import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { 
  Stethoscope, Heart, Brain, Activity, 
  FileText, Pill, AlertCircle, User
} from 'lucide-react';

export default function MedicalAITools() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [input, setInput] = useState('');

  const medicalTools = [
    {
      name: 'Symptom Analyzer',
      description: 'Analyze symptoms and suggest possible conditions',
      icon: Stethoscope,
      action: 'symptoms',
      color: 'blue'
    },
    {
      name: 'Medical Report Parser',
      description: 'Extract key information from medical reports',
      icon: FileText,
      action: 'report',
      color: 'green'
    },
    {
      name: 'Drug Interaction Checker',
      description: 'Check for interactions between medications',
      icon: Pill,
      action: 'drugs',
      color: 'orange'
    },
    {
      name: 'Health Risk Assessment',
      description: 'Assess health risks based on patient data',
      icon: Heart,
      action: 'risk',
      color: 'red'
    },
    {
      name: 'Medical Literature Search',
      description: 'Find relevant medical research and studies',
      icon: Brain,
      action: 'literature',
      color: 'purple'
    },
    {
      name: 'Clinical Decision Support',
      description: 'AI-assisted clinical decision making',
      icon: Activity,
      action: 'decision',
      color: 'indigo'
    },
    {
      name: 'Emergency Geo-Tracker',
      description: 'Track medical emergencies by location and severity',
      icon: Activity,
      action: 'emergency_geo',
      color: 'red'
    },
    {
      name: 'Patient Triage Assistant',
      description: 'Prioritize patients based on urgency and severity',
      icon: User,
      action: 'triage',
      color: 'yellow'
    },
    {
      name: 'Mental Health Screener',
      description: 'Screen for depression, anxiety, and mental health issues',
      icon: Brain,
      action: 'mental_health',
      color: 'purple'
    }
  ];

  const runTool = async (action) => {
    if (!input.trim()) {
      toast.error('Please provide input data');
      return;
    }

    setLoading(true);
    toast.loading('AI is processing medical data...');

    try {
      let prompt = '';
      
      switch(action) {
        case 'symptoms':
          prompt = `As a medical AI assistant, analyze these symptoms:\n${input}\n\nProvide: possible conditions (with probability), severity level, recommended actions, when to seek immediate care. DISCLAIMER: This is not medical advice.`;
          break;
        case 'report':
          prompt = `Parse this medical report and extract:\n${input}\n\nKey findings, diagnoses, medications, abnormal values, follow-up recommendations. Format as structured summary.`;
          break;
        case 'drugs':
          prompt = `Check for drug interactions between:\n${input}\n\nProvide: interaction severity, mechanism, clinical significance, recommendations, alternatives if needed.`;
          break;
        case 'risk':
          prompt = `Based on this patient data:\n${input}\n\nAssess risks for: cardiovascular disease, diabetes, stroke, cancer. Provide risk scores and preventive measures.`;
          break;
        case 'literature':
          prompt = `Search medical literature for:\n${input}\n\nProvide: relevant studies, key findings, clinical implications, evidence level.`;
          break;
        case 'decision':
          prompt = `Clinical scenario:\n${input}\n\nProvide: differential diagnosis, recommended tests, treatment options with evidence, contraindications.`;
          break;
        case 'emergency_geo':
          prompt = `Analyze this emergency medical data with location info:\n${input}\n\nProvide: severity assessment, nearest hospitals/facilities, estimated response time, resource allocation, priority routing.`;
          break;
        case 'triage':
          prompt = `Triage these patients:\n${input}\n\nProvide: priority levels (Red/Yellow/Green/Black), urgency score, recommended immediate actions, resource needs.`;
          break;
        case 'mental_health':
          prompt = `Mental health screening data:\n${input}\n\nProvide: risk indicators for depression/anxiety/PTSD, severity level, red flags, recommended interventions, referral suggestions. DISCLAIMER: Not a substitute for professional evaluation.`;
          break;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: action === 'literature'
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
          <h2 className="text-2xl font-bold text-gray-900">Medical AI Tools</h2>
          <p className="text-gray-500">AI-powered medical analysis and clinical support</p>
        </div>
        <Badge className="bg-red-600">
          <AlertCircle className="w-3 h-3 mr-1" />
          Not Medical Advice
        </Badge>
      </div>

      <Card className="border-yellow-300 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900 mb-1">Important Disclaimer</p>
              <p className="text-sm text-gray-700">
                These AI tools are for informational purposes only and do not constitute medical advice, 
                diagnosis, or treatment. Always consult qualified healthcare professionals for medical decisions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Input Medical Data</CardTitle>
          <CardDescription>Enter symptoms, reports, medications, or clinical data</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Example: Patient presents with fever (38.5°C), headache, and fatigue for 3 days..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={6}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {medicalTools.map((tool, idx) => (
          <Card key={idx} className="hover:shadow-lg transition-all">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg bg-${tool.color}-100 flex items-center justify-center`}>
                  <tool.icon className={`w-5 h-5 text-${tool.color}-600`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{tool.name}</h3>
                  <p className="text-sm text-gray-600">{tool.description}</p>
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={() => runTool(tool.action)}
                disabled={loading}
              >
                Analyze
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