import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Zap, 
  Activity, 
  GitBranch, 
  Server, 
  Cpu, 
  Globe, 
  Lock,
  ChevronRight,
  RefreshCw,
  Terminal,
  Trophy,
  History
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  status?: 'healthy' | 'warning' | 'critical';
  trend?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, status = 'healthy', trend }) => (
  <div className="bg-[#0a0a0b] border border-[#1a1a1c] p-5 rounded-xl hover:border-[#3b82f6]/30 transition-all group relative overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-full -mr-10 -mt-10" />
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className="p-2 bg-[#141416] rounded-lg border border-[#1a1a1c] group-hover:scale-110 transition-transform">
        {icon}
      </div>
      {status && (
        <div className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
          status === 'healthy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
          status === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          {status}
        </div>
      )}
    </div>
    <div className="relative z-10">
      <p className="text-[#94a3b8] text-xs font-medium mb-1 uppercase tracking-tight">{title}</p>
      <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
      {trend && <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
        <Zap size={10} /> {trend}
      </p>}
    </div>
  </div>
);

const SovereignDashboard: React.FC = () => {
  const [buildNumber, setBuildNumber] = useState(602);
  const [syncStatus, setSyncStatus] = useState('Synchronized');
  const [kernelScore, setKernelScore] = useState(99.8);
  const [uptime, setUptime] = useState('14d 06h 22m');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncStatus('Synchronized');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#e2e8f0] p-8 font-['Inter',system-ui,sans-serif]">
      {/* Header */}
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-[#1a1a1c]">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
              <Shield className="text-white" size={24} />
            </div>
            Sovereign Production Asset
          </h1>
          <p className="text-[#94a3b8] mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Reality Mode Active • Production Node 0x7E1A
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-[#141416] border border-[#1a1a1c] rounded-lg text-sm font-medium hover:bg-[#1a1a1c] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Force Sync'}
          </button>
          <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg text-sm font-bold text-white shadow-xl shadow-blue-600/20 flex items-center gap-2">
            <Trophy size={16} />
            Build #{buildNumber}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <MetricCard 
          title="Kernel Verification" 
          value={`${kernelScore}%`} 
          icon={<Cpu className="text-blue-400" size={20} />} 
          status="healthy"
          trend="+0.2% vs previous build"
        />
        <MetricCard 
          title="Git Sync Status" 
          value={syncStatus} 
          icon={<GitBranch className="text-emerald-400" size={20} />} 
          status="healthy"
        />
        <MetricCard 
          title="Compute ROI" 
          value="2.4x" 
          icon={<Zap className="text-amber-400" size={20} />} 
          status="healthy"
          trend="Efficiency Mandate satisfied"
        />
        <MetricCard 
          title="Infrastructure Uptime" 
          value={uptime} 
          icon={<Server className="text-purple-400" size={20} />} 
          status="healthy"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Swarm Intelligence Terminal */}
        <div className="lg:col-span-2 bg-[#0a0a0b] border border-[#1a1a1c] rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-[#1a1a1c] flex justify-between items-center bg-[#0d0d0f]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
              <Terminal size={14} className="text-blue-500" />
              Swarm Autonomic Log
            </h3>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
          </div>
          <div className="p-6 bg-[#050506] font-mono text-sm h-[400px] overflow-y-auto custom-scrollbar">
            <div className="space-y-3">
              {[
                { time: '12:30:45', agent: 'SovereignGit', msg: 'Initiating Build #602 commit sequence...', type: 'info' },
                { time: '12:30:48', agent: 'TruthAnchor', msg: 'Integrity check passed. Baseline stabilized.', type: 'success' },
                { time: '12:30:52', agent: 'ResourceAuditor', msg: 'Audit complete. Efficiency ROI: 2.1x. Approved for push.', type: 'info' },
                { time: '12:31:05', agent: 'SovereignBridge', msg: 'Signal latency: 12ms. iMessage bridge active.', type: 'info' },
                { time: '12:31:10', agent: 'Sentinel', msg: 'Zero-Ghost verification protocol: 100% clean.', type: 'success' },
                { time: '12:32:00', agent: 'Kernel', msg: 'Next autonomic pulse scheduled in T-5m.', type: 'info' }
              ].map((log, i) => (
                <div key={i} className="flex gap-4 border-l-2 border-[#1a1a1c] pl-4 hover:border-blue-500/50 transition-colors py-1">
                  <span className="text-slate-600 shrink-0">{log.time}</span>
                  <span className={`font-bold shrink-0 ${
                    log.type === 'success' ? 'text-emerald-400' : 
                    log.type === 'error' ? 'text-rose-400' : 'text-blue-400'
                  }`}>[{log.agent}]</span>
                  <span className="text-slate-400">{log.msg}</span>
                </div>
              ))}
              <div className="animate-pulse text-blue-500 pl-4 mt-4">_</div>
            </div>
          </div>
        </div>

        {/* Status Panel */}
        <div className="space-y-6">
          <div className="bg-[#0a0a0b] border border-[#1a1a1c] rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
              <Lock size={14} className="text-blue-500" />
              Sovereignty Stats
            </h3>
            <div className="space-y-6">
              {[
                { label: 'Network Latency', value: '18ms', pct: 92 },
                { label: 'Memory Efficiency', value: '4.2GB / 16GB', pct: 28 },
                { label: 'AI Inference ROI', value: 'High', pct: 88 }
              ].map((stat, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-[#94a3b8]">{stat.label}</span>
                    <span className="text-xs font-bold text-white">{stat.value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#1a1a1c] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full" 
                      style={{ width: `${stat.pct}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600/10 to-transparent border border-[#1a1a1c] rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/30 transition-all">
             <div className="relative z-10">
               <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                 <Globe size={14} className="text-blue-400" />
                 Global Presence
               </h3>
               <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                 AppForge is now operating as a standalone sovereign cell. All traces of legacy Solana dependencies have been purged.
               </p>
               <button className="text-xs font-bold text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                 View Global Infrastructure <ChevronRight size={12} />
               </button>
             </div>
             <Activity className="absolute bottom-[-10px] right-[-10px] text-blue-600/5" size={100} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SovereignDashboard;
