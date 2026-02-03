import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const STORAGE_KEY = 'appforge_code_quality_trends';

const load = () => {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
};

export function CodeQualityTrends() {
  const trends = useMemo(() => load(), []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Code Quality Trends</CardTitle>
        <CardDescription>Tracking lint score, complexity, and coverage over time.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {trends.length === 0 ? (
          <p className="text-muted-foreground">No trend data captured yet.</p>
        ) : (
          trends.slice(0, 5).map((entry) => (
            <div key={entry.id} className="flex items-center justify-between">
              <span>{entry.label}</span>
              <span className="font-semibold">{entry.score}%</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
