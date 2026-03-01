import { useState } from 'react';
import { Sidebar } from '../layout/Sidebar';
import { Header } from '../layout/Header';
import { ServiceStatusWidget } from './ServiceStatusWidget';
import { AgentActivityWidget } from './AgentActivityWidget';
import { QuantumMetricsWidget } from './QuantumMetricsWidget';
import { LogsWidget } from './LogsWidget';
import { QuickActionsWidget } from './QuickActionsWidget';
import { SystemHealthWidget } from './SystemHealthWidget';

type ViewType = 'overview' | 'services' | 'agents' | 'quantum' | 'logs' | 'settings';

export function Dashboard() {
  const [currentView, setCurrentView] = useState<ViewType>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderContent = () => {
    switch (currentView) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <ServiceStatusWidget />
            <AgentActivityWidget />
            <QuantumMetricsWidget />
            <SystemHealthWidget />
            <QuickActionsWidget />
            <LogsWidget maxHeight="300px" />
          </div>
        );
      case 'services':
        return (
          <div className="space-y-6">
            <ServiceStatusWidget expanded />
            <LogsWidget filter="service" />
          </div>
        );
      case 'agents':
        return (
          <div className="space-y-6">
            <AgentActivityWidget expanded />
            <LogsWidget filter="agent" />
          </div>
        );
      case 'quantum':
        return (
          <div className="space-y-6">
            <QuantumMetricsWidget expanded />
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Quantum Engine Details</h3>
              <p className="text-slate-400">
                The Quantum Engine uses quantum-inspired algorithms to explore multiple solution 
                spaces simultaneously, enabling super-intelligent code generation and optimization.
              </p>
            </div>
          </div>
        );
      case 'logs':
        return <LogsWidget expanded />;
      case 'settings':
        return (
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Settings</h3>
            <p className="text-slate-400">Settings panel coming soon...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar
        currentView={currentView}
        onViewChange={(view: string) => setCurrentView(view as ViewType)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
