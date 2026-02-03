import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const STORAGE_KEY = 'appforge_compliance_rules';

const loadRules = () => {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
};

const saveRules = (rules) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
};

export function ComplianceRuleBuilder() {
  const [rules, setRules] = useState(loadRules());
  const [name, setName] = useState('');
  const [policy, setPolicy] = useState('GDPR');

  const addRule = () => {
    const rule = { id: `rule_${Date.now()}`, name, policy };
    const updated = [rule, ...rules];
    setRules(updated);
    saveRules(updated);
    setName('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Rule Builder</CardTitle>
        <CardDescription>Define compliance checks for GDPR, HIPAA, and more.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid md:grid-cols-3 gap-2">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Rule name" />
          <Input value={policy} onChange={(event) => setPolicy(event.target.value)} placeholder="Policy" />
          <Button onClick={addRule} disabled={!name.trim()}>Add</Button>
        </div>
        <div className="space-y-2 text-sm">
          {rules.length === 0 ? (
            <p className="text-muted-foreground">No compliance rules yet.</p>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between">
                <span>{rule.name}</span>
                <span className="text-slate-500">{rule.policy}</span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
