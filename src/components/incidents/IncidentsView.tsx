import React, { useState } from 'react';
import {
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  Shield,
  ShieldAlert,
  Sparkles,
  User,
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { getSeverityColor } from '../../detection/engine';

export const IncidentsView: React.FC = () => {
  const { incidents, setSelectedIncidentId, setActiveTab, setSelectedUserId } = useSecurity();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredIncidents = incidents.filter((inc) => {
    if (statusFilter === 'ALL') return true;
    return inc.status === statusFilter;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
            <span>Threat Correlation Engine</span>
            <span aria-hidden="true">/</span>
            <span className="text-neutral-200">Synthesized Incidents</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100">
            Correlated Security Incidents
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter tabs */}
          <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-md border border-neutral-800">
            {['ALL', 'Open', 'Investigating', 'Mitigated', 'Resolved'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  statusFilter === st
                    ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Explanatory Correlation Architecture Banner */}
      <div className="p-4 rounded-lg bg-cyan-950/20 border border-cyan-800/40 flex items-start gap-3">
        <Layers className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-neutral-200">
            NEXRA Adaptive Correlation Principle
          </p>
          <p className="text-neutral-400">
            Rather than flooding analysts with separate alerts for every device change or failed login, NEXRA binds time-correlated telemetry into a single contextual attack sequence. Each incident below synthesizes multiple raw events into an actionable risk assessment.
          </p>
        </div>
      </div>

      {/* Incidents Grid */}
      <div className="space-y-4">
        {filteredIncidents.length === 0 ? (
          <div className="p-12 text-center rounded-lg border border-neutral-800 bg-neutral-900/40 text-neutral-500">
            No incidents found matching the active filter.
          </div>
        ) : (
          filteredIncidents.map((incident) => {
            const colors = getSeverityColor(incident.severity);

            return (
              <div
                key={incident.id}
                onClick={() => {
                  setSelectedIncidentId(incident.id);
                  setActiveTab('incident-details');
                }}
                className="p-5 rounded-lg border border-neutral-800 bg-neutral-900/70 hover:border-neutral-700 transition-all cursor-pointer group space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-800/60 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-neutral-300">{incident.id}</span>
                    <span aria-hidden="true" className="text-neutral-700">·</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${colors.badge}`}>
                      {incident.severity} · {incident.riskScore}/100
                    </span>
                    <span aria-hidden="true" className="text-neutral-700">·</span>
                    <span className="text-xs text-neutral-400 font-medium">
                      Status: <span className="text-neutral-200">{incident.status}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Detected {new Date(incident.detectedAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Title and user */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-base font-semibold text-neutral-100 group-hover:text-cyan-300 transition-colors">
                      {incident.title}
                    </h2>
                    <p className="text-xs text-neutral-400">{incident.description}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-medium text-neutral-200">{incident.userName}</p>
                      <p className="text-[11px] text-neutral-400 font-mono">{incident.userEmail}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIncidentId(incident.id);
                        setActiveTab('incident-details');
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-neutral-800 text-neutral-100 border border-neutral-700 hover:bg-neutral-700 group-hover:border-cyan-500/50 flex items-center gap-1.5 transition-colors"
                    >
                      <span>Investigate</span>
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    </button>
                  </div>
                </div>

                {/* Correlated Factors preview */}
                <div className="pt-2 border-t border-neutral-800/60 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-neutral-500 font-medium">
                    Correlated Signals ({incident.eventIds.length} events):
                  </span>
                  {incident.riskFactors.slice(0, 3).map((factor, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] text-neutral-300 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 truncate max-w-xs"
                      title={factor}
                    >
                      {factor}
                    </span>
                  ))}
                  {incident.riskFactors.length > 3 && (
                    <span className="text-[11px] text-neutral-500">
                      +{incident.riskFactors.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
