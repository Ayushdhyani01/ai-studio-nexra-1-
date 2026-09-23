import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Filter,
  Laptop,
  MapPin,
  Search,
  Shield,
  ShieldAlert,
  User,
  X,
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { getSeverityColor } from '../../detection/engine';
import { RiskLevel, UserProfile } from '../../types/security';

export const UsersView: React.FC = () => {
  const { users, events, selectedUserId, setSelectedUserId, setActiveTab, setSelectedIncidentId, incidents } =
    useSecurity();
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | RiskLevel>('ALL');

  const selectedUser = users.find((u) => u.id === selectedUserId) || null;

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRisk = riskFilter === 'ALL' || u.riskLevel === riskFilter;

    return matchesSearch && matchesRisk;
  });

  // User-specific events for the profile drawer
  const userEvents = selectedUser
    ? events.filter((e) => e.userId === selectedUser.id)
    : [];

  // User-specific incidents
  const userIncidents = selectedUser
    ? incidents.filter((i) => i.userId === selectedUser.id)
    : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
            <span>Identity Governance</span>
            <span aria-hidden="true">/</span>
            <span className="text-neutral-200">User Risk Profiles</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100">
            Identities & Behavior Scoring
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span>Total Entities:</span>
          <span className="font-mono font-semibold text-neutral-200">{users.length}</span>
          <span aria-hidden="true">·</span>
          <span>Critical / High:</span>
          <span className="font-mono font-semibold text-rose-400">
            {users.filter((u) => u.riskScore >= 51).length}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-900/40 p-3 rounded-lg border border-neutral-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by user name, email, department, or role..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-md text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500/60"
          />
        </div>

        {/* Risk Level Segmented Filter */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-md border border-neutral-800">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((lvl) => {
            const isActive = riskFilter === lvl;
            return (
              <button
                key={lvl}
                onClick={() => setRiskFilter(lvl)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  isActive
                    ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {lvl === 'ALL' ? 'All Tiers' : lvl}
              </button>
            );
          })}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/80 text-neutral-400">
                <th className="py-3 px-4 font-medium">User Profile</th>
                <th className="py-3 px-4 font-medium">Role & Department</th>
                <th className="py-3 px-4 font-medium">Active Device</th>
                <th className="py-3 px-4 font-medium">Location</th>
                <th className="py-3 px-4 font-medium">Last Login</th>
                <th className="py-3 px-4 font-medium">Risk Score</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-neutral-500">
                    No users matching criteria
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const colors = getSeverityColor(user.riskLevel);
                  const isSelected = selectedUserId === user.id;

                  return (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-neutral-800/40' : 'hover:bg-neutral-950/40'
                      }`}
                    >
                      {/* User Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.name}
                              className="h-7 w-7 rounded-full object-cover border border-neutral-700 shrink-0"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[10px] font-semibold text-neutral-300 shrink-0">
                              {user.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-neutral-200">{user.name}</p>
                            <p className="text-[11px] text-neutral-400 font-mono">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role & Dept */}
                      <td className="py-3 px-4">
                        <p className="text-neutral-200 font-medium">{user.role}</p>
                        <p className="text-[11px] text-neutral-400">{user.department}</p>
                      </td>

                      {/* Device */}
                      <td className="py-3 px-4 text-neutral-300">
                        <div className="flex items-center gap-1.5 truncate max-w-[170px]" title={user.device}>
                          <Laptop className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                          <span className="truncate">{user.device}</span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 text-neutral-300">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                          <span>{user.location}</span>
                        </div>
                      </td>

                      {/* Last Login */}
                      <td className="py-3 px-4 text-neutral-400 font-mono whitespace-nowrap">
                        {user.lastLogin}
                      </td>

                      {/* Risk Score */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold ${colors.text} tabular-nums`}>
                            {user.riskScore}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">/ 100</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${colors.badge}`}
                          >
                            {user.riskLevel}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[11px] font-medium ${
                            user.status === 'Quarantined'
                              ? 'text-rose-400'
                              : user.status === 'Under Review'
                              ? 'text-amber-400'
                              : 'text-neutral-300'
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUserId(user.id);
                          }}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1"
                        >
                          <span>Profile & Risk</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Risk Profile Drawer (Opens when user is selected) */}
      {selectedUser && (
        <div className="p-5 rounded-lg border border-neutral-800 bg-neutral-900/80 space-y-5">
          <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-3">
              {selectedUser.avatarUrl ? (
                <img
                  src={selectedUser.avatarUrl}
                  alt={selectedUser.name}
                  className="h-12 w-12 rounded-full object-cover border border-neutral-700"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-sm font-semibold text-neutral-300">
                  {selectedUser.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-neutral-100">{selectedUser.name}</h2>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                      getSeverityColor(selectedUser.riskLevel).badge
                    }`}
                  >
                    {selectedUser.riskLevel} · {selectedUser.riskScore}/100
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  {selectedUser.role} · {selectedUser.department} · {selectedUser.email}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedUserId(null)}
              className="text-neutral-400 hover:text-neutral-200 p-1 rounded hover:bg-neutral-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Baseline vs Current Telemetry Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded bg-neutral-950/60 border border-neutral-800 space-y-1">
              <span className="text-[11px] text-neutral-500 font-medium">Device Fingerprint</span>
              <p className="text-xs font-semibold text-neutral-200">{selectedUser.device}</p>
              <p className="text-[10px] text-neutral-400">
                Baseline: <span className="font-mono">{selectedUser.baselineDevice}</span>
              </p>
              {selectedUser.device !== selectedUser.baselineDevice && (
                <span className="text-[10px] text-amber-400 font-medium block">⚠ Hardware deviation detected</span>
              )}
            </div>

            <div className="p-3 rounded bg-neutral-950/60 border border-neutral-800 space-y-1">
              <span className="text-[11px] text-neutral-500 font-medium">Geographic Location</span>
              <p className="text-xs font-semibold text-neutral-200">{selectedUser.location}</p>
              <p className="text-[10px] text-neutral-400">
                Baseline: <span className="font-mono">{selectedUser.baselineLocation}</span>
              </p>
              {!selectedUser.location.includes(selectedUser.baselineLocation.split(',')[0]) && (
                <span className="text-[10px] text-rose-400 font-medium block">⚠ Impossible velocity deviation</span>
              )}
            </div>

            <div className="p-3 rounded bg-neutral-950/60 border border-neutral-800 space-y-1">
              <span className="text-[11px] text-neutral-500 font-medium">Active Security Controls</span>
              <p className="text-xs text-neutral-200">
                MFA Enforced: <span className="text-emerald-400 font-semibold">Enabled</span>
              </p>
              <p className="text-[10px] text-neutral-400">
                Active Concurrent Sessions: <span className="font-mono text-neutral-200">{selectedUser.activeSessions}</span>
              </p>
              <p className="text-[10px] text-neutral-400">
                Account Status: <span className="font-medium text-neutral-200">{selectedUser.status}</span>
              </p>
            </div>
          </div>

          {/* Associated Incidents if any */}
          {userIncidents.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-neutral-300">
                Correlated Incidents Involving {selectedUser.name} ({userIncidents.length})
              </h3>
              <div className="space-y-2">
                {userIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => {
                      setSelectedIncidentId(inc.id);
                      setActiveTab('incident-details');
                    }}
                    className="p-3 rounded bg-rose-950/20 border border-rose-800/40 hover:border-rose-600 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-rose-400 font-semibold">{inc.id}</span>
                        <span className="text-xs font-semibold text-neutral-200">{inc.title}</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">{inc.description}</p>
                    </div>
                    <button className="text-xs text-rose-400 hover:underline flex items-center gap-1 shrink-0">
                      <span>Investigate</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity Log for this User */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-neutral-300">
              Recent Telemetry Stream for {selectedUser.name} ({userEvents.length} events logged)
            </h3>
            <div className="overflow-x-auto rounded border border-neutral-800 bg-neutral-950">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400">
                    <th className="py-2 px-3 font-medium">Timestamp</th>
                    <th className="py-2 px-3 font-medium">Event Type</th>
                    <th className="py-2 px-3 font-medium">Severity</th>
                    <th className="py-2 px-3 font-medium">Origin IP</th>
                    <th className="py-2 px-3 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {userEvents.slice(0, 6).map((ev) => {
                    const colors = getSeverityColor(ev.severity);
                    return (
                      <tr key={ev.id} className="hover:bg-neutral-900/40">
                        <td className="py-2 px-3 font-mono text-neutral-400 tabular-nums whitespace-nowrap">
                          {new Date(ev.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2 px-3 text-neutral-200 whitespace-nowrap">{ev.eventType}</td>
                        <td className="py-2 px-3 font-mono whitespace-nowrap">
                          <span className={colors.text}>{ev.severity}</span>
                        </td>
                        <td className="py-2 px-3 font-mono text-neutral-400 whitespace-nowrap">{ev.ipAddress}</td>
                        <td className="py-2 px-3 text-neutral-400 max-w-sm truncate">{ev.details}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
