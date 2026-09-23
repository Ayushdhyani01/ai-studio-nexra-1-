import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Laptop,
  MapPin,
  Play,
  RotateCcw,
  ShieldAlert,
  Terminal,
  UserCheck,
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { SIMULATION_STEPS } from '../../data/mockData';

export const SimulationBanner: React.FC = () => {
  const {
    isSimulating,
    simulationActive,
    simulationCompleted,
    simulationCurrentStep,
    runThreatSimulation,
    resetSimulation,
    setActiveTab,
    selectedIncidentId,
    setSelectedIncidentId,
    incidents,
    users,
  } = useSecurity();

  const alex = users.find((u) => u.id === 'usr-alex');

  const getStepIcon = (index: number) => {
    switch (index) {
      case 0:
        return <UserCheck className="w-3.5 h-3.5" />;
      case 1:
        return <Laptop className="w-3.5 h-3.5" />;
      case 2:
        return <MapPin className="w-3.5 h-3.5" />;
      case 3:
        return <AlertTriangle className="w-3.5 h-3.5" />;
      case 4:
        return <KeyRound className="w-3.5 h-3.5" />;
      case 5:
        return <Terminal className="w-3.5 h-3.5" />;
      default:
        return <AlertTriangle className="w-3.5 h-3.5" />;
    }
  };

  const handleInspectCorrelatedIncident = () => {
    const simInc = incidents.find((i) => i.id.startsWith('INC-SIM-')) || incidents[0];
    if (simInc) {
      setSelectedIncidentId(simInc.id);
    }
    setActiveTab('incident-details');
  };

  return (
    <div className="w-full bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-950 border-b border-neutral-800 p-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Header & Status */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                Hackathon Demo Pipeline
              </span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span className="text-xs text-neutral-400">
                Target Entity: <span className="text-neutral-200 font-medium">Alex Vance</span> (alex.vance@company.com)
              </span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span className="text-xs text-neutral-400">
                Current Risk: <span className={`font-mono font-semibold ${alex && alex.riskScore >= 76 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {alex?.riskScore || 14}/100 ({alex?.riskLevel || 'LOW'})
                </span>
              </span>
            </div>
            <p className="text-xs text-neutral-300">
              {simulationCompleted ? (
                <span className="text-emerald-300 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Threat chain correlated: 6 anomalous signals synthesized into 1 Critical Incident with Explainable AI reasoning.
                </span>
              ) : isSimulating ? (
                <span className="text-amber-300 font-medium flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>
                  Injecting telemetry step {simulationCurrentStep} of 6 into detection engine...
                </span>
              ) : (
                'Simulate an authentic multi-stage attack: Normal login → New device → Foreign VPN → Brute force → Sensitive vault access → Privilege escalation.'
              )}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            {simulationCompleted && (
              <button
                onClick={handleInspectCorrelatedIncident}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-rose-950/80 text-rose-200 border border-rose-600/70 hover:bg-rose-900 transition-colors shadow-sm"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Inspect Correlated Incident</span>
                <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
              </button>
            )}

            {!isSimulating && !simulationCompleted && (
              <button
                onClick={runThreatSimulation}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-cyan-500 text-neutral-950 hover:bg-cyan-400 transition-colors shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Threat Simulation</span>
              </button>
            )}

            {simulationActive && (
              <button
                onClick={resetSimulation}
                disabled={isSimulating}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-neutral-800 text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo</span>
              </button>
            )}
          </div>
        </div>

        {/* Step Progress Visualizer */}
        <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {SIMULATION_STEPS.map((step, idx) => {
            const isCompleted = simulationCurrentStep > idx || simulationCompleted;
            const isCurrent = isSimulating && simulationCurrentStep === idx + 1;

            return (
              <div
                key={step.stepIndex}
                className={`p-2.5 rounded border transition-all text-left ${
                  isCurrent
                    ? 'bg-amber-950/40 border-amber-500/70 ring-1 ring-amber-500/40'
                    : isCompleted
                    ? 'bg-neutral-950/80 border-cyan-800/50 text-neutral-200'
                    : 'bg-neutral-950/40 border-neutral-800/60 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-mono text-neutral-400">Step {step.stepIndex}</span>
                  <div className="flex items-center gap-1">
                    {isCompleted ? (
                      <span className="text-emerald-400 font-mono text-[10px]">✓ Done</span>
                    ) : isCurrent ? (
                      <span className="text-amber-400 font-mono text-[10px] animate-pulse">Running</span>
                    ) : (
                      <span className="text-neutral-500 font-mono text-[10px]">Queue</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`p-1 rounded ${
                      isCompleted ? 'text-cyan-400 bg-cyan-950/40' : 'text-neutral-500 bg-neutral-900'
                    }`}
                  >
                    {getStepIcon(idx)}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-medium text-neutral-200 truncate">{step.title}</p>
                    <p className="text-[10px] text-neutral-400 font-mono truncate">
                      {isCompleted ? `Risk ${step.deltaScore}` : step.eventType}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
