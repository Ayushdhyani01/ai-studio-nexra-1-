import React, { useState } from 'react';
import {
  Activity,
  Code,
  Download,
  Filter,
  Layers,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { getSeverityColor } from '../../detection/engine';
import { EventSeverity, EventType, SecurityEvent } from '../../types/security';

export const EventsView: React.FC = () => {
  const { events, users } = useSecurity();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [inspectedEvent, setInspectedEvent] = useState<SecurityEvent | null>(null);

  const eventTypes: (EventType | 'ALL')[] = [
    'ALL',
    'Login',
    'Failed Login',
    'New Device',
    'New Location',
    'File Access',
    'Sensitive File Download',
    'Privilege Change',
    'Suspicious Network Connection',
  ];

  const severities: (EventSeverity | 'ALL')[] = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  // Filtering
  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.ipAddress.includes(searchTerm) ||
      ev.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedEventType === 'ALL' || ev.eventType === selectedEventType;
    const matchesSeverity = selectedSeverity === 'ALL' || ev.severity === selectedSeverity;

    return matchesSearch && matchesType && matchesSeverity;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
            <span>Telemetry Pipeline</span>
            <span aria-hidden="true">/</span>
            <span className="text-neutral-200">Raw Event Ingestion</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100">
            Security Events & Activity Stream
          </h1>
        </div>

        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-neutral-900 border border-neutral-800">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live Feed:</span>
            <span className="font-mono font-semibold text-neutral-200 tabular-nums">
              {filteredEvents.length} / {events.length} Events
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 bg-neutral-900/40 p-4 rounded-lg border border-neutral-800">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by user, IP address (e.g. 185.191.*), device, or keyword..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-md text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          {/* Severity Segmented Filter */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-md border border-neutral-800 shrink-0 overflow-x-auto">
            <span className="text-[11px] text-neutral-500 px-2 font-medium">Severity:</span>
            {severities.map((sev) => {
              const isActive = selectedSeverity === sev;
              return (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {sev}
                </button>
              );
            })}
          </div>
        </div>

        {/* Event Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-xs text-neutral-400">
          <span className="text-[11px] text-neutral-500 font-medium shrink-0">Event Type:</span>
          {eventTypes.map((type) => {
            const isActive = selectedEventType === type;
            return (
              <button
                key={type}
                onClick={() => setSelectedEventType(type)}
                className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/40 font-medium'
                    : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-800/80'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Events Table (High Density SOC style) */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/80 text-neutral-400">
                <th className="py-2.5 px-3 font-medium">Timestamp</th>
                <th className="py-2.5 px-3 font-medium">User Entity</th>
                <th className="py-2.5 px-3 font-medium">Event Type</th>
                <th className="py-2.5 px-3 font-medium">Severity / Weight</th>
                <th className="py-2.5 px-3 font-medium">Device Fingerprint</th>
                <th className="py-2.5 px-3 font-medium">Location & Ingress IP</th>
                <th className="py-2.5 px-3 font-medium">Telemetry Details</th>
                <th className="py-2.5 px-3 font-medium text-right">Raw</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-sans">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500">
                    No security events found matching the active filters.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => {
                  const colors = getSeverityColor(ev.severity);

                  return (
                    <tr
                      key={ev.id}
                      onClick={() => setInspectedEvent(ev)}
                      className="hover:bg-neutral-950/60 cursor-pointer transition-colors"
                    >
                      {/* Timestamp */}
                      <td className="py-2.5 px-3 font-mono text-neutral-400 tabular-nums whitespace-nowrap">
                        {new Date(ev.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>

                      {/* User */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-semibold text-neutral-200 block">{ev.userName}</span>
                        <span className="text-[10px] text-neutral-500 font-mono">{ev.userEmail}</span>
                      </td>

                      {/* Event Type */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-medium text-neutral-200">{ev.eventType}</span>
                      </td>

                      {/* Severity */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`font-mono font-medium ${colors.text}`}>
                          {ev.severity} (+{ev.riskContribution})
                        </span>
                      </td>

                      {/* Device */}
                      <td className="py-2.5 px-3 text-neutral-300 max-w-[160px] truncate" title={ev.device}>
                        <span className="truncate">{ev.device}</span>
                      </td>

                      {/* Location & IP */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-neutral-300 block">{ev.location}</span>
                        <span className="text-[10px] font-mono text-neutral-500">{ev.ipAddress}</span>
                      </td>

                      {/* Details */}
                      <td className="py-2.5 px-3 text-neutral-300 max-w-sm truncate" title={ev.details}>
                        {ev.details}
                      </td>

                      {/* Inspect Raw Button */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectedEvent(ev);
                          }}
                          className="p-1 rounded text-neutral-500 hover:text-cyan-400 hover:bg-neutral-800 transition-colors"
                          title="Inspect JSON Telemetry"
                        >
                          <Code className="w-3.5 h-3.5" />
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

      {/* Raw Event Modal Drawer */}
      {inspectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-2xl w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-neutral-100">Telemetry Payload Inspector</h3>
                  <span className="font-mono text-xs text-neutral-400">{inspectedEvent.id}</span>
                </div>
                <p className="text-xs text-neutral-400">
                  {inspectedEvent.eventType} · {inspectedEvent.userName}
                </p>
              </div>
              <button
                onClick={() => setInspectedEvent(null)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-medium text-neutral-400">Structured JSON Event Object:</span>
              <pre className="p-3 rounded bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-72">
                {JSON.stringify(inspectedEvent, null, 2)}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs">
              <span className="text-neutral-500">
                Logged at: {new Date(inspectedEvent.timestamp).toUTCString()}
              </span>
              <button
                onClick={() => setInspectedEvent(null)}
                className="px-3 py-1.5 rounded bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
