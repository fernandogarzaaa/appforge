import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DeploymentChecklist() {
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(false);

  const defaultChecks = [
    { id: 1, name: 'Database configured', completed: true },
    { id: 2, name: 'Environment variables set', completed: true },
    { id: 3, name: 'API keys configured', completed: false },
    { id: 4, name: 'Authentication enabled', completed: true },
    { id: 5, name: 'Error logging setup', completed: false },
  ];

  useEffect(() => {
    setChecklist(defaultChecks);
  }, []);

  const completedCount = checklist.filter(c => c.completed).length;
  const progress = (completedCount / checklist.length) * 100;

  const runChecks = async () => {
    setLoading(true);
    setTimeout(() => {
      setChecklist(checklist.map(c => ({ ...c, completed: Math.random() > 0.3 })));
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Deployment Checklist</h2>
          <p className="text-gray-500 mt-1">Ensure all requirements are met</p>
        </div>
        <Button onClick={runChecks} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {loading ? 'Checking...' : 'Re-check'}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{completedCount} of {checklist.length} completed</span>
              <span className="text-2xl font-bold">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-green-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {checklist.map((check) => (
          <motion.div key={check.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="pt-4 flex items-center justify-between">
                <span className="text-sm font-medium">{check.name}</span>
                {check.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}