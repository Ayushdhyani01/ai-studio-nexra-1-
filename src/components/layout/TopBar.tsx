import React from 'react';
import {
  AlertOctagon,
  Bot,
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  Users,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { NavigationTab } from '../../types/security';

export const TopBar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isSimulating,
    simulationActive,
    simulationCompleted,
    runThreatSimulation,
    resetSimulation,
    isAIAssistantOpen,
    setIsAIAssistantOpen,
    overallSecurityScore,
    eventsAnalyzedCount,
    incidents,
  } = useSecurity();

  const criticalCount = incidents.filter((i) => i.severity === 'CRITICAL' && i.status !== 'Resolved').length;

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'SOC Dashboard', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'users', label: 'Identities & Users', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'activity', label: 'Telemetry & Events', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'incidents', label: 'Incidents', icon: <AlertOctagon className="w-3.5 h-3.5" />, badge: criticalCount },
    { id: 'incident-details', label: 'Incident Investigation', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Zone 1: Brand Wordmark (Single element) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-900 border border-neutral-700/60 group-hover:border-cyan-500/50 transition-colors">
              <Shield className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-neutral-100 flex items-center gap-1.5">
                NEXRA
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
              </span>
            </div>
          </button>

          {/* Quiet Live Monitoring Indicator */}
          <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-neutral-800 text-xs text-neutral-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-neutral-300">Live Monitoring</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="font-mono text-neutral-400 tabular-nums">
              {eventsAnalyzedCount.toLocaleString()} events
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Single-line, quiet hover states) */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-cyan-300 bg-neutral-900/90 border border-neutral-800 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-mono rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions (Simulation & AI Assistant) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {simulationActive ? (
            <button
              onClick={resetSimulation}
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-neutral-100 hover:border-neutral-700 transition-colors disabled:opacity-50"
              title="Reset Threat Simulation"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline">Reset Baseline</span>
            </button>
          ) : null}

          <button
            onClick={runThreatSimulation}
            disabled={isSimulating}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shadow-sm ${
              isSimulating
                ? 'bg-amber-950 text-amber-200 border border-amber-600/60 animate-pulse'
                : simulationCompleted
                ? 'bg-neutral-900 text-emerald-300 border border-emerald-500/40 hover:bg-neutral-800'
                : 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-neutral-950 font-semibold hover:from-cyan-500 hover:to-cyan-400'
            }`}
          >
            {isSimulating ? (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>
                <span>Simulating Attack...</span>
              </>
            ) : simulationCompleted ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Re-run Simulation</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Threat Simulation</span>
              </>
            )}
          </button>

          {/* AI Security Assistant Toggle */}
          <button
            onClick={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              isAIAssistantOpen
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-neutral-100 hover:border-neutral-700'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">AI Analyst</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Sub-bar */}
      <div className="flex md:hidden items-center gap-1 px-3 py-2 border-t border-neutral-900 overflow-x-auto scrollbar-none bg-neutral-950/95">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                isActive
                  ? 'text-cyan-300 bg-neutral-900 border border-neutral-800'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 text-[9px] font-mono rounded bg-rose-500/20 text-rose-300">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
