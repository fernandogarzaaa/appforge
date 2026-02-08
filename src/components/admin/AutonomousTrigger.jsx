import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function AutonomousTrigger() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const runCycle = async () => {
        setLoading(true);
        setResult(null);
        try {
            toast.info('Starting Autonomous Cycle...');
            // By using the client-side SDK, we use the User's Session (Authoritative)
            const res = await base44.functions.invoke('autonomousCycle', {});

            setResult(res);
            toast.success('Cycle Completed Successfully');
        } catch (error) {
            console.error('Cycle Failed:', error);
            toast.error('Cycle Failed: ' + error.message);
            setResult({ error: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-indigo-100 dark:border-indigo-900 bg-gradient-to-br from-white to-indigo-50/50 dark:from-slate-900 dark:to-indigo-950/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
                    <Play className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Autonomous Control
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Manually trigger the autonomous bot cycle using your admin permissions.
                </p>

                <Button
                    onClick={runCycle}
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Running Bots...
                        </>
                    ) : (
                        'Run Autonomous Cycle Now'
                    )}
                </Button>

                {result && (
                    <div className="mt-4 p-3 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-mono overflow-auto max-h-60 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-2 font-bold border-b pb-2">
                            {result.error ? (
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                            ) : (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                            Execution Result
                        </div>
                        <pre>{JSON.stringify(result, null, 2)}</pre>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
