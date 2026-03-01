import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu, Activity, Zap, Gauge } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface QuantumMetricsWidgetProps {
  expanded?: boolean;
}

const mockData = Array.from({ length: 20 }, (_, i) => ({
  time: i,
  coherence: 85 + Math.random() * 10,
  superposition: 70 + Math.random() * 20,
  entanglement: 60 + Math.random() * 15,
}));

export function QuantumMetricsWidget({ expanded = false }: QuantumMetricsWidgetProps) {
  const { quantumMetrics, updateQuantumMetrics } = useAppStore();

  useEffect(() => {
    const interval = setInterval(() => {
      updateQuantumMetrics({
        superpositionStates: Math.floor(Math.random() * 1000) + 500,
        entanglementPairs: Math.floor(Math.random() * 500) + 200,
        tunnelingEvents: Math.floor(Math.random() * 100) + 50,
        coherenceTime: 85 + Math.random() * 10,
        errorRate: Math.random() * 0.1,
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [updateQuantumMetrics]);

  const metrics = [
    {
      label: 'Superposition States',
      value: quantumMetrics.superpositionStates.toLocaleString(),
      icon: Zap,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      label: 'Entanglement Pairs',
      value: quantumMetrics.entanglementPairs.toLocaleString(),
      icon: Activity,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
    {
      label: 'Coherence Time',
      value: `${quantumMetrics.coherenceTime.toFixed(1)}%`,
      icon: Gauge,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    {
      label: 'Error Rate',
      value: `${(quantumMetrics.errorRate * 100).toFixed(3)}%`,
      icon: Cpu,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
    },
  ];

  return (
    <Card className={`bg-slate-900/50 border-slate-700/50 ${expanded ? 'col-span-full' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg text-slate-100">Quantum Engine</CardTitle>
            <p className="text-sm text-slate-500">Real-time quantum metrics</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-4 ${expanded ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'}`}>
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 ${metric.bgColor} rounded-lg flex items-center justify-center`}>
                  <metric.icon className={`w-4 h-4 ${metric.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-200">{metric.value}</p>
              <p className="text-xs text-slate-500">{metric.label}</p>
            </div>
          ))}
        </div>

        {expanded && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-slate-300 mb-4">Coherence Over Time</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockData}>
                  <defs>
                    <linearGradient id="colorCoherence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSuperposition" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="coherence"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorCoherence)"
                    name="Coherence %"
                  />
                  <Area
                    type="monotone"
                    dataKey="superposition"
                    stroke="#a855f7"
                    fillOpacity={1}
                    fill="url(#colorSuperposition)"
                    name="Superposition"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
