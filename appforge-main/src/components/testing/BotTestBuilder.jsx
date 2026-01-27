import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const OPERATORS = ['equals', 'contains', 'greaterThan', 'lessThan', 'isEmpty', 'isNotEmpty'];

export default function BotTestBuilder({ botId }) {
  const queryClient = useQueryClient();
  const [testName, setTestName] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [mockData, setMockData] = useState('{}');
  const [assertions, setAssertions] = useState([]);
  const [newAssertion, setNewAssertion] = useState({ variable: '', operator: 'equals', value: '' });
  const [showDialog, setShowDialog] = useState(false);

  const { data: testCases = [] } = useQuery({
    queryKey: ['botTestCases', botId],
    queryFn: () => base44.entities.BotTestCase.filter({ bot_id: botId })
  });

  const createTestMutation = useMutation({
    mutationFn: (data) => base44.entities.BotTestCase.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['botTestCases', botId] });
      resetForm();
      setShowDialog(false);
      toast.success('Test case created');
    }
  });

  const deleteTestMutation = useMutation({
    mutationFn: (id) => base44.entities.BotTestCase.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['botTestCases', botId] });
      toast.success('Test case deleted');
    }
  });

  const handleAddAssertion = () => {
    if (newAssertion.variable && newAssertion.operator) {
      setAssertions([...assertions, { ...newAssertion, id: `assert-${Date.now()}` }]);
      setNewAssertion({ variable: '', operator: 'equals', value: '' });
    }
  };

  const handleRemoveAssertion = (id) => {
    setAssertions(assertions.filter(a => a.id !== id));
  };

  const handleSaveTest = () => {
    if (!testName) {
      toast.error('Test name is required');
      return;
    }

    try {
      const mockObj = JSON.parse(mockData);
      createTestMutation.mutate({
        bot_id: botId,
        name: testName,
        description: testDescription,
        mock_data: mockObj,
        assertions,
        status: 'active'
      });
    } catch (e) {
      toast.error('Invalid mock data JSON');
    }
  };

  const resetForm = () => {
    setTestName('');
    setTestDescription('');
    setMockData('{}');
    setAssertions([]);
    setNewAssertion({ variable: '', operator: 'equals', value: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Test Cases ({testCases.length})</h3>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-3 h-3 mr-1" /> New Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Test Case</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Test Name</Label>
                <Input
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="e.g., Happy path scenario"
                  className="text-sm"
                />
              </div>

              <div>
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={testDescription}
                  onChange={(e) => setTestDescription(e.target.value)}
                  placeholder="Describe what this test validates"
                  rows={2}
                  className="text-sm"
                />
              </div>

              <div>
                <Label className="text-xs">Mock Data (JSON)</Label>
                <Textarea
                  value={mockData}
                  onChange={(e) => setMockData(e.target.value)}
                  placeholder='{"key": "value"}'
                  rows={4}
                  className="text-xs font-mono"
                />
              </div>

              <div>
                <Label className="text-xs mb-2 block">Assertions</Label>
                <div className="space-y-2">
                  {assertions.map((assert) => (
                    <div key={assert.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                      <span className="flex-1">{assert.variable} {assert.operator} {assert.value}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveAssertion(assert.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-3 flex-wrap">
                  <Input
                    placeholder="Variable name"
                    value={newAssertion.variable}
                    onChange={(e) => setNewAssertion({ ...newAssertion, variable: e.target.value })}
                    className="text-sm flex-1 min-w-32"
                  />
                  <Select
                    value={newAssertion.operator}
                    onValueChange={(op) => setNewAssertion({ ...newAssertion, operator: op })}
                  >
                    <SelectTrigger className="w-32 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map(op => (
                        <SelectItem key={op} value={op}>{op}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Expected value"
                    value={newAssertion.value}
                    onChange={(e) => setNewAssertion({ ...newAssertion, value: e.target.value })}
                    className="text-sm flex-1 min-w-32"
                  />
                  <Button size="sm" onClick={handleAddAssertion}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveTest} className="flex-1">
                  <Save className="w-3 h-3 mr-1" /> Create Test
                </Button>
                <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {testCases.map((test) => (
          <Card key={test.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{test.name}</p>
                  {test.description && <p className="text-xs text-gray-600 mt-1">{test.description}</p>}
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {test.assertions?.length || 0} assertions
                    </Badge>
                    <Badge variant={test.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {test.status}
                    </Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteTestMutation.mutate(test.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}