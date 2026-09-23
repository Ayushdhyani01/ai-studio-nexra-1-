import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock,
  ExternalLink,
  History,
  KeyRound,
  Laptop,
  Lock,
  MapPin,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { getSeverityColor } from '../../detection/engine';

export const IncidentDetailsView: React.FC = () => {
  const {
    incidents,
    selectedIncidentId,
    setSelectedIncidentId,
    events,
    users,
    setActiveTab,
    applyRemediationAction,
  } = useSecurity();

  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Active Incident
  const incident =
    incidents.find((i) => i.id === selectedIncidentId) || incidents[0];

  if (!incident) {
    return (
      <div className="p-8 text-center text-neutral-400">
        No incident selected. Please select an incident from the Incidents list.
      </div>
    );
  }

  // Correlated events
  const correlatedEvents = events.filter((e) => incident.eventIds.includes(e.id));
  const targetUser = users.find((u) => u.id === incident.userId);
  const colors = getSeverityColor(incident.severity);

  // Handle mitigation button click
  const handleAction = (actionTitle: string) => {
    applyRemediationAction(incident.id, actionTitle);
    setActionFeedback(`Executed: "${actionTitle}". Telemetry updated.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Navigation Breadcrumb & Incident Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('incidents')}
            className="p-1.5 rounded bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-neutral-400 mb-0.5">
              <span>Incident Investigation</span>
              <span aria-hidden="true">/</span>
              <span className="font-mono text-neutral-200">{incident.id}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
              {incident.title}
            </h1>
          </div>
        </div>

        {/* Switch to other incidents */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">Switch Incident:</span>
          <select
            value={incident.id}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            className="px-2.5 py-1 text-xs bg-neutral-900 border border-neutral-800 rounded text-neutral-200 focus:outline-none font-mono"
          >
            {incidents.map((inc) => (
              <option key={inc.id} value={inc.id}>
                {inc.id} ({inc.severity} - {inc.riskScore})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-600/60 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Top Incident Summary Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Risk Score & Severity Gauge */}
        <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Threat Risk Score</span>
            <span className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${colors.badge}`}>
              {incident.severity}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-mono font-bold ${colors.text} tabular-nums`}>
              {incident.riskScore}
            </span>
            <span className="text-xs text-neutral-500 font-mono">/ 100</span>
          </div>

          <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                incident.riskScore >= 76
                  ? 'bg-rose-500'
                  : incident.riskScore >= 51
                  ? 'bg-orange-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${incident.riskScore}%` }}
            />
          </div>

          <p className="text-[11px] text-neutral-400">
            Calculated via {incident.eventIds.length} correlated telemetry signals
          </p>
        </div>

        {/* Target Identity Profile */}
        <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-2">
          <span className="text-xs font-medium text-neutral-400 block">Affected User Entity</span>
          <div className="flex items-center gap-3">
            {targetUser?.avatarUrl ? (
              <img
                src={targetUser.avatarUrl}
                alt={incident.userName}
                className="h-10 w-10 rounded-full object-cover border border-neutral-700"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-neutral-300 text-xs">
                {incident.userName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-neutral-100">{incident.userName}</p>
              <p className="text-xs text-neutral-400 font-mono">{incident.userEmail}</p>
              <p className="text-[11px] text-neutral-500">
                {targetUser?.role} · {targetUser?.department}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">Account Status:</span>
            <span className="font-semibold text-neutral-200">{targetUser?.status || 'Active'}</span>
          </div>
        </div>

        {/* Detection Metadata */}
        <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-3">
          <span className="text-xs font-medium text-neutral-400 block">Correlation Telemetry</span>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">First Detection:</span>
              <span className="font-mono text-neutral-200">
                {new Date(incident.detectedAt).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Lifecycle Status:</span>
              <span className="font-medium text-cyan-400">{incident.status}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Signals Bound:</span>
              <span className="font-mono text-neutral-200">{incident.eventIds.length} events</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Confidence Score:</span>
              <span className="font-mono text-emerald-400">
                {incident.aiAnalysis.confidenceScore}%
              </span>
            </div>
          </div>
        </div>

        {/* Triage & Remediation Actions (Interactive) */}
        <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800 flex flex-col justify-between space-y-3">
          <div>
            <span className="text-xs font-medium text-neutral-400 block mb-1">
              Analyst Tactical Response
            </span>
            <p className="text-[11px] text-neutral-500">
              Execute containment actions without disrupting benign services
            </p>
          </div>

          <div className="space-y-1.5">
            <button
              onClick={() => handleAction('Revoke Suspicious Session Tokens')}
              className="w-full text-left px-2.5 py-1.5 rounded text-xs bg-neutral-950 border border-neutral-800 hover:border-amber-600/70 hover:text-amber-300 text-neutral-300 flex items-center justify-between transition-colors"
            >
              <span>Revoke Active Sessions</span>
              <Lock className="w-3.5 h-3.5 text-amber-400" />
            </button>
            <button
              onClick={() => handleAction('Trigger Biometric Step-Up MFA Challenge')}
              className="w-full text-left px-2.5 py-1.5 rounded text-xs bg-neutral-950 border border-neutral-800 hover:border-cyan-600/70 hover:text-cyan-300 text-neutral-300 flex items-center justify-between transition-colors"
            >
              <span>Challenge Step-up MFA</span>
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            </button>
            <button
              onClick={() => handleAction('Quarantine Endpoint Hardware Identifier')}
              className="w-full text-left px-2.5 py-1.5 rounded text-xs bg-neutral-950 border border-neutral-800 hover:border-rose-600/70 hover:text-rose-300 text-neutral-300 flex items-center justify-between transition-colors"
            >
              <span>Quarantine Endpoint</span>
              <UserX className="w-3.5 h-3.5 text-rose-400" />
            </button>
            <button
              onClick={() => handleAction('Resolve Incident')}
              className="w-full text-left px-2.5 py-1.5 rounded text-xs bg-neutral-800 text-neutral-200 hover:bg-neutral-700 flex items-center justify-between transition-colors font-medium"
            >
              <span>Resolve Incident</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Visual Timeline of Attack Sequence */}
      <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-200">
              Visual Attack Sequence Timeline
            </h2>
            <p className="text-xs text-neutral-400">
              Chronological order of anomalous events correlated into this single threat incident
            </p>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            {correlatedEvents.length} Sequential Steps
          </span>
        </div>

        {/* Timeline nodes */}
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-800">
          {correlatedEvents.length === 0 ? (
            <p className="text-xs text-neutral-500">No correlated events linked to this record.</p>
          ) : (
            correlatedEvents.map((ev, idx) => {
              const evColors = getSeverityColor(ev.severity);

              return (
                <div key={ev.id} className="relative group">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-1.5 h-3 w-3 rounded-full border-2 border-neutral-950 ${
                      ev.severity === 'CRITICAL'
                        ? 'bg-rose-500 ring-2 ring-rose-500/30'
                        : ev.severity === 'HIGH'
                        ? 'bg-orange-500'
                        : 'bg-amber-500'
                    }`}
                  />

                  {/* Content card */}
                  <div className="p-3.5 rounded-lg bg-neutral-950/70 border border-neutral-800/80 hover:border-neutral-700 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-cyan-400 font-semibold">
                          Step {idx + 1}
                        </span>
                        <span aria-hidden="true" className="text-neutral-600">·</span>
                        <span className="text-xs font-semibold text-neutral-200">
                          {ev.eventType}
                        </span>
                        <span aria-hidden="true" className="text-neutral-600">·</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${evColors.badge}`}>
                          {ev.severity} (+{ev.riskContribution})
                        </span>
                      </div>

                      <span className="text-[11px] font-mono text-neutral-400">
                        {new Date(ev.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-300 mt-1">{ev.details}</p>

                    <div className="mt-2.5 pt-2 border-t border-neutral-900 flex flex-wrap items-center gap-3 text-[11px] text-neutral-400">
                      <div className="flex items-center gap-1">
                        <Laptop className="w-3 h-3 text-neutral-500" />
                        <span>{ev.device}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-neutral-500" />
                        <span>{ev.location}</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-neutral-500">
                        <span>IP: {ev.ipAddress}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* EXPLAINABLE AI ANALYSIS CARD (Core Hackathon Requirement) */}
      <div className="p-6 rounded-lg bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-neutral-950 border border-cyan-800/50 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-cyan-950/60 border border-cyan-800/80">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-100">
                  NEXRA EXPLAINABLE AI ANALYSIS
                </h2>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                  CONFIDENCE: {incident.aiAnalysis.confidenceScore}%
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Transparent risk factor deduction and deterministic threat validation
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className={`text-sm font-mono font-bold ${colors.text}`}>
              Risk Score: {incident.riskScore}/100
            </span>
            <span className="text-xs text-neutral-400 block font-mono">
              Severity: {incident.severity}
            </span>
          </div>
        </div>

        {/* Why Checklist (Exact requirement) */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
            Why did NEXRA assign this score?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {incident.aiAnalysis.whyReasons.map((reason, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded bg-neutral-950/80 border border-neutral-800"
              >
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span className="text-xs text-neutral-200">{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Assessment Narrative (Exact requirement) */}
        <div className="p-4 rounded-lg bg-neutral-950/90 border border-neutral-800/90 space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            AI Assessment
          </h3>
          <p className="text-xs leading-relaxed text-neutral-300">
            "{incident.aiAnalysis.assessment}"
          </p>
        </div>

        {/* Recommended Actions (Actionable, prioritized recommendations) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Recommended Containment & Investigation Actions
            </h3>
            <span className="text-[11px] text-amber-400 font-medium">
              AI provides recommendations; analyst confirms execution
            </span>
          </div>

          <div className="space-y-2">
            {incident.aiAnalysis.recommendedActions.map((action, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded bg-neutral-950/80 border border-neutral-800 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 font-mono text-[11px] text-neutral-300 shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-neutral-200">{action}</span>
                </div>
                <button
                  onClick={() => handleAction(action)}
                  className="px-2.5 py-1 text-[11px] font-medium rounded bg-neutral-800 hover:bg-cyan-950 hover:text-cyan-300 hover:border-cyan-800 border border-neutral-700 text-neutral-300 transition-colors whitespace-nowrap ml-3"
                >
                  Execute
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Mitigation Audit History */}
        <div className="pt-4 border-t border-neutral-800/80 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400">
            <History className="w-3.5 h-3.5" />
            <span>Audit History & Operations Log</span>
          </div>
          <div className="space-y-1">
            {incident.mitigationHistory.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-[11px] py-1 text-neutral-400 font-mono"
              >
                <span>{item.action}</span>
                <span className="text-neutral-500">
                  {item.operator} · {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
