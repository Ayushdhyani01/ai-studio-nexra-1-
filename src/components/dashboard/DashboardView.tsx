import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Eye,
  Flame,
  Globe,
  Radio,
  Shield,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  UserX,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useSecurity } from '../../context/SecurityContext';
import { getSeverityColor } from '../../detection/engine';

export const DashboardView: React.FC = () => {
  const {
    overallSecurityScore,
    incidents,
    users,
    events,
    eventsAnalyzedCount,
    setActiveTab,
    setSelectedIncidentId,
    setSelectedUserId,
    simulationCompleted,
  } = useSecurity();

  const criticalIncidents = incidents.filter((i) => i.severity === 'CRITICAL' && i.status !== 'Resolved');
  const highRiskUsers = users.filter((u) => u.riskScore >= 51);
  const activeThreatsCount = incidents.filter((i) => i.status !== 'Resolved').length;

  // Chart 1: Threat Activity Over Time (Hourly bins over the last 12 hours)
  const timelineData = [
    { time: '10:00', normalEvents: 142, suspicious: 2, critical: 0 },
    { time: '12:00', normalEvents: 185, suspicious: 4, critical: 0 },
    { time: '14:00', normalEvents: 220, suspicious: 3, critical: 1 },
    { time: '16:00', normalEvents: 245, suspicious: 7, critical: 1 },
    { time: '18:00', normalEvents: 190, suspicious: 5, critical: 0 },
    { time: '20:00', normalEvents: 130, suspicious: 8, critical: 1 },
    { time: '22:00', normalEvents: 95, suspicious: 12, critical: 1 },
    { time: '00:00', normalEvents: 60, suspicious: 14, critical: 2 },
    { time: '02:00', normalEvents: 45, suspicious: simulationCompleted ? 26 : 11, critical: simulationCompleted ? 3 : 1 },
    { time: 'Now', normalEvents: 85, suspicious: simulationCompleted ? 32 : 9, critical: simulationCompleted ? 3 : 1 },
  ];

  // Chart 2: Risk Distribution by User Category
  const lowRiskCount = users.filter((u) => u.riskScore <= 25).length;
  const medRiskCount = users.filter((u) => u.riskScore >= 26 && u.riskScore <= 50).length;
  const highRiskCount = users.filter((u) => u.riskScore >= 51 && u.riskScore <= 75).length;
  const critRiskCount = users.filter((u) => u.riskScore >= 76).length;

  const riskDistributionData = [
    { name: 'Low (0-25)', count: lowRiskCount, fill: '#10B981' },
    { name: 'Med (26-50)', count: medRiskCount, fill: '#F59E0B' },
    { name: 'High (51-75)', count: highRiskCount, fill: '#F97316' },
    { name: 'Crit (76-100)', count: critRiskCount, fill: '#F43F5E' },
  ];

  // Recent 6 events
  const recentEvents = events.slice(0, 6);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Breadcrumb Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
            <span>SOC Operations</span>
            <span aria-hidden="true">/</span>
            <span className="text-neutral-200">Global Threat Posture</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100">
            Cyber Threat & Risk Command
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-medium text-emerald-400">Live Ingestion</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="font-mono text-neutral-300 tabular-nums">0.24s avg latency</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (Zero-pill discipline, tabular numbers, clean cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Overall Security Score */}
        <div className="col-span-2 sm:col-span-1 lg:col-span-2 p-4 rounded-lg bg-neutral-900/60 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Overall Security Score</span>
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-neutral-100 tabular-nums">
              {overallSecurityScore}
            </span>
            <span className="text-xs text-neutral-500 font-mono">/ 100</span>
            <div
              className={`ml-auto flex items-center gap-1 text-xs font-medium ${
                overallSecurityScore >= 75
                  ? 'text-emerald-400'
                  : overallSecurityScore >= 50
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {overallSecurityScore >= 75 ? (
                <>
                  <TrendingUp className="w-3 h-3" />
                  <span>Posture Nominal</span>
                </>
              ) : overallSecurityScore >= 50 ? (
                <>
                  <TrendingDown className="w-3 h-3" />
                  <span>Elevated Risk</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3" />
                  <span>Critical Posture</span>
                </>
              )}
            </div>
          </div>
          <div className="mt-3 w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                overallSecurityScore >= 75
                  ? 'bg-emerald-500'
                  : overallSecurityScore >= 50
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${overallSecurityScore}%` }}
            />
          </div>
        </div>

        {/* Active Threats */}
        <div className="p-4 rounded-lg bg-neutral-900/60 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Active Threats</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-neutral-100 tabular-nums">
              {activeThreatsCount}
            </span>
            <p className="text-[11px] text-neutral-400 mt-1">Correlated incident clusters</p>
          </div>
        </div>

        {/* Critical Incidents */}
        <div className="p-4 rounded-lg bg-neutral-900/60 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Critical Incidents</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-rose-400 tabular-nums">
              {criticalIncidents.length}
            </span>
            <p className="text-[11px] text-neutral-400 mt-1">Requiring immediate action</p>
          </div>
        </div>

        {/* High-Risk Users */}
        <div className="p-4 rounded-lg bg-neutral-900/60 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">High-Risk Users</span>
            <UserX className="w-4 h-4 text-orange-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-orange-400 tabular-nums">
              {highRiskUsers.length}
            </span>
            <p className="text-[11px] text-neutral-400 mt-1">Score ≥ 51 threshold</p>
          </div>
        </div>

        {/* Events Analyzed */}
        <div className="p-4 rounded-lg bg-neutral-900/60 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Events Analyzed</span>
            <Globe className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-neutral-100 tabular-nums">
              {eventsAnalyzedCount.toLocaleString()}
            </span>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              Streaming live
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Activity Over Time Chart */}
        <div className="lg:col-span-2 p-5 rounded-lg bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-neutral-200">Threat Activity Over Time</h2>
              <p className="text-xs text-neutral-400">
                Hourly telemetry breakdown: Suspicious signals vs. Critical anomalies
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                <span className="text-neutral-400">Suspicious</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                <span className="text-neutral-400">Critical</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSuspicious" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="time" stroke="#737373" fontSize={11} tickLine={false} />
                <YAxis stroke="#737373" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171717',
                    borderColor: '#404040',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#E5E5E5' }}
                />
                <Area
                  type="monotone"
                  dataKey="suspicious"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSuspicious)"
                  name="Suspicious Events"
                />
                <Area
                  type="monotone"
                  dataKey="critical"
                  stroke="#F43F5E"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCritical)"
                  name="Critical Signals"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Breakdown */}
        <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-neutral-200">Risk Distribution</h2>
              <span className="text-xs text-neutral-400 font-mono">{users.length} Identities</span>
            </div>
            <p className="text-xs text-neutral-400 mb-4">Current user risk tiers across organization</p>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="name" stroke="#737373" fontSize={10} tickLine={false} />
                  <YAxis stroke="#737373" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171717',
                      borderColor: '#404040',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {riskDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Critical / High:</span>
              <span className="font-mono font-semibold text-rose-400">{critRiskCount + highRiskCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Nominal / Low:</span>
              <span className="font-mono font-semibold text-emerald-400">{lowRiskCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Section: Active Incidents & High-Risk User Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Incidents Spotlight */}
        <div className="lg:col-span-2 p-5 rounded-lg bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-neutral-200">Active Correlated Incidents</h2>
              <p className="text-xs text-neutral-400">
                Multi-signal attack sequences correlated by NEXRA rule engine
              </p>
            </div>
            <button
              onClick={() => setActiveTab('incidents')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>View All ({incidents.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {incidents.slice(0, 3).map((incident) => {
              const colors = getSeverityColor(incident.severity);
              return (
                <div
                  key={incident.id}
                  onClick={() => {
                    setSelectedIncidentId(incident.id);
                    setActiveTab('incident-details');
                  }}
                  className="p-3.5 rounded-lg bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-neutral-400 font-semibold">{incident.id}</span>
                        <span aria-hidden="true" className="text-neutral-600">·</span>
                        <span className={`text-xs font-semibold ${colors.text}`}>
                          {incident.severity}
                        </span>
                        <span aria-hidden="true" className="text-neutral-600">·</span>
                        <span className="text-xs text-neutral-400 font-mono">
                          Score: {incident.riskScore}/100
                        </span>
                        <span aria-hidden="true" className="text-neutral-600">·</span>
                        <span className="text-xs text-neutral-500">
                          {incident.eventIds.length} correlated events
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-neutral-100 group-hover:text-cyan-300 transition-colors">
                        {incident.title}
                      </h3>
                      <p className="text-xs text-neutral-400 line-clamp-1">{incident.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-400">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        {new Date(incident.detectedAt).toLocaleTimeString()}
                      </span>
                      <div className="mt-2">
                        <span className="text-xs text-cyan-400 group-hover:underline flex items-center gap-1 justify-end">
                          <span>Investigate</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* High-Risk Users Spotlight */}
        <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-neutral-200">High-Risk Users</h2>
              <p className="text-xs text-neutral-400">Prioritized for security review</p>
            </div>
            <button
              onClick={() => setActiveTab('users')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>All Users</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {[...users]
              .sort((a, b) => b.riskScore - a.riskScore)
              .slice(0, 4)
              .map((user) => {
                const colors = getSeverityColor(user.riskLevel);
                return (
                  <div
                    key={user.id}
                    onClick={() => {
                      setSelectedUserId(user.id);
                      setActiveTab('users');
                    }}
                    className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="h-8 w-8 rounded-full object-cover border border-neutral-700"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-semibold text-neutral-300">
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-semibold text-neutral-200">{user.name}</p>
                        <p className="text-[11px] text-neutral-400 truncate max-w-[140px]">{user.role}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs font-mono font-bold ${colors.text} tabular-nums`}>
                        {user.riskScore}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono block">/ 100</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Recent Security Events Feed */}
      <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-200">Recent Security Events</h2>
            <p className="text-xs text-neutral-400">Live stream of identity and network telemetry events</p>
          </div>
          <button
            onClick={() => setActiveTab('activity')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>Telemetry Log ({events.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400">
                <th className="pb-2 font-medium">Timestamp</th>
                <th className="pb-2 font-medium">User</th>
                <th className="pb-2 font-medium">Event Type</th>
                <th className="pb-2 font-medium">Severity</th>
                <th className="pb-2 font-medium">Device & Location</th>
                <th className="pb-2 font-medium">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {recentEvents.map((ev) => {
                const colors = getSeverityColor(ev.severity);
                return (
                  <tr key={ev.id} className="hover:bg-neutral-950/40 transition-colors">
                    <td className="py-2.5 font-mono text-neutral-400 tabular-nums whitespace-nowrap">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 font-medium text-neutral-200 whitespace-nowrap">
                      {ev.userName}
                    </td>
                    <td className="py-2.5 whitespace-nowrap">
                      <span className="text-neutral-300">{ev.eventType}</span>
                    </td>
                    <td className="py-2.5 whitespace-nowrap">
                      <span className={`font-mono font-medium ${colors.text}`}>
                        {ev.severity} ({ev.riskContribution})
                      </span>
                    </td>
                    <td className="py-2.5 text-neutral-400 whitespace-nowrap">
                      <span>{ev.location}</span>
                    </td>
                    <td className="py-2.5 text-neutral-400 max-w-xs truncate">
                      {ev.details}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
