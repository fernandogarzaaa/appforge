import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Cpu, HardDrive, MemoryStick } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export function SystemHealthWidget() {
  const [systemStats, setSystemStats] = useState({
    cpu: 45,
    memory: 62,
    disk: 78,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStats({
        cpu: Math.floor(Math.random() * 30) + 30,
        memory: Math.floor(Math.random() * 20) + 50,
        disk: 78,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (value: number) => {
    if (value < 50) return '#22c55e';
    if (value < 75) return '#f59e0b';
    return '#ef4444';
  };

  const stats = [
    {
      label: 'CPU',
      value: systemStats.cpu,
      icon: Cpu,
      color: getHealthColor(systemStats.cpu),
    },
    {
      label: 'Memory',
      value: systemStats.memory,
      icon: MemoryStick,
      color: getHealthColor(systemStats.memory),
    },
    {
      label: 'Disk',
      value: systemStats.disk,
      icon: HardDrive,
      color: getHealthColor(systemStats.disk),
    },
  ];

  const pieData = [
    { name: 'Used', value: systemStats.memory },
    { name: 'Free', value: 100 - systemStats.memory },
  ];

  return (
    <Card className="bg-slate-900/50 border-slate-700/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <CardTitle className="text-lg text-slate-100">System Health</CardTitle>
            <p className="text-sm text-slate-500">Resource usage</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                <stat.icon className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-400">{stat.label}</span>
                  <span className="text-sm font-semibold" style={{ color: stat.color }}>
                    {stat.value}%
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${stat.value}%`, backgroundColor: stat.color }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mini pie chart for memory */}
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Memory Distribution</span>
            <div className="w-20 h-20">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={35}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#1e293b" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
