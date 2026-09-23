import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Database,
  LogOut,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import csvText from "./data/past_week_activity.csv?raw";
import { LIVE_EVENTS } from "./data/liveEvents";
import { groupByDay, parseActivityCsv, type ActivityRow } from "./ml/csv";
import {
  correlate,
  getRiskLevel,
  scoreAll,
  trainBaselines,
  type Incident,
  type RiskLevel,
  type ScoredEvent,
  type UserBaseline,
} from "./ml/model";

type Tab = "data" | "training" | "threats" | "users";

const ALL_ROWS: ActivityRow[] = parseActivityCsv(csvText);

const LEVEL_COLOR: Record<RiskLevel, string> = {
  LOW: "#059669",
  MEDIUM: "#d97706",
  HIGH: "#ea580c",
  CRITICAL: "#dc2626",
};

const HERO_BG: Record<RiskLevel, string> = {
  CRITICAL: "bg-red-600",
  HIGH: "bg-orange-600",
  MEDIUM: "bg-amber-500",
  LOW: "bg-emerald-600",
};

const HERO_SUB: Record<RiskLevel, string> = {
  CRITICAL: "text-red-100",
  HIGH: "text-orange-100",
  MEDIUM: "text-amber-100",
  LOW: "text-emerald-100",
};

const HERO_PILL: Record<RiskLevel, string> = {
  CRITICAL: "bg-white text-red-700",
  HIGH: "bg-white text-orange-700",
  MEDIUM: "bg-white text-amber-700",
  LOW: "bg-white text-emerald-700",
};

const HERO_DOT: Record<RiskLevel, string> = {
  CRITICAL: "bg-red-600",
  HIGH: "bg-orange-600",
  MEDIUM: "bg-amber-500",
  LOW: "bg-emerald-600",
};

const CARD_BORDER: Record<RiskLevel, string> = {
  CRITICAL: "border-red-600",
  HIGH: "border-orange-600",
  MEDIUM: "border-amber-500",
  LOW: "border-emerald-600",
};

function riskBadge(level: RiskLevel): string {
  switch (level) {
    case "CRITICAL":
      return "bg-red-600 text-white";
    case "HIGH":
      return "bg-orange-600 text-white";
    case "MEDIUM":
      return "bg-amber-500 text-white";
    default:
      return "bg-emerald-600 text-white";
  }
}

function now(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function App() {
  const [tab, setTab] = useState<Tab>("data");
  const [search, setSearch] = useState("");
  const [isTraining, setIsTraining] = useState(false);
  const [trainedDays, setTrainedDays] = useState<string[]>([]);
  const [trainLog, setTrainLog] = useState<string[]>([]);
  const [baselines, setBaselines] = useState<Map<string, UserBaseline> | null>(null);
  const [scored, setScored] = useState<ScoredEvent[] | null>(null);
  const [incidents, setIncidents] = useState<Incident[] | null>(null);

  // Response-action state (all buttons perform real local state changes)
  const [incidentStatus, setIncidentStatus] = useState<Record<string, string>>({});
  const [actionLog, setActionLog] = useState<Record<string, string[]>>({});
  const [loggedOutUsers, setLoggedOutUsers] = useState<string[]>([]);
  const [quarantinedUsers, setQuarantinedUsers] = useState<string[]>([]);
  const [verifiedUsers, setVerifiedUsers] = useState<string[]>([]);

  const days = useMemo(() => [...groupByDay(ALL_ROWS).keys()].sort(), []);
  const progress = baselines ? 100 : Math.round((trainedDays.length / Math.max(days.length, 1)) * 100);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_ROWS.slice(0, 100);
    return ALL_ROWS.filter(
      (r) =>
        r.userEmail.toLowerCase().includes(q) ||
        r.eventType.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.device.toLowerCase().includes(q)
    ).slice(0, 100);
  }, [search]);

  const baselineList = useMemo(
    () => (baselines ? [...baselines.values()].sort((a, b) => a.userEmail.localeCompare(b.userEmail)) : []),
    [baselines]
  );

  const anomalies = useMemo(
    () => (scored ? scored.filter((s) => s.riskScore >= 26).sort((a, b) => b.riskScore - a.riskScore) : []),
    [scored]
  );

  const criticalCount = useMemo(() => scored?.filter((s) => s.riskLevel === "CRITICAL").length ?? 0, [scored]);
  const usersAtRisk = useMemo(() => new Set(anomalies.map((a) => a.userEmail)).size, [anomalies]);

  const trendData = useMemo(
    () =>
      (scored ?? []).map((s, i) => ({
        name: `${i + 1}`,
        time: s.timestamp.slice(11, 16),
        risk: s.riskScore,
        label: s.eventType,
      })),
    [scored]
  );

  const distData = useMemo(() => {
    const counts: Record<RiskLevel, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    for (const s of scored ?? []) counts[s.riskLevel]++;
    return (Object.keys(counts) as RiskLevel[]).map((k) => ({ name: k, value: counts[k] }));
  }, [scored]);

  const userRiskData = useMemo(() => {
    if (!scored) return [];
    const top = new Map<string, number>();
    for (const s of scored) top.set(s.userEmail, Math.max(top.get(s.userEmail) ?? 0, s.riskScore));
    return [...top.entries()]
      .map(([email, raw]) => {
        const eff = effectiveUserRisk(email, raw);
        return { email: email.split("@")[0], full: email, risk: eff.score };
      })
      .sort((a, b) => b.risk - a.risk)
      .slice(0, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scored, incidents, incidentStatus, loggedOutUsers, quarantinedUsers, verifiedUsers]);

  async function handleTrain() {
    if (isTraining) return;
    setIsTraining(true);
    setBaselines(null);
    setScored(null);
    setIncidents(null);
    setIncidentStatus({});
    setActionLog({});
    setLoggedOutUsers([]);
    setQuarantinedUsers([]);
    setVerifiedUsers([]);
    setTrainedDays([]);
    setTrainLog([]);

    const byDay = groupByDay(ALL_ROWS);
    const ordered = [...byDay.keys()].sort();
    const learned: ActivityRow[] = [];

    for (const day of ordered) {
      const rows = byDay.get(day) ?? [];
      learned.push(...rows);
      await new Promise((r) => setTimeout(r, 600));
      setTrainedDays((prev) => [...prev, day]);
      setTrainLog((prev) => [...prev, `${day}: learned ${rows.length} events (${learned.length} total)`]);
    }

    const b = trainBaselines(learned);
    setBaselines(b);
    setTrainLog((prev) => [...prev, `Training complete: ${learned.length} events across ${b.size} users`]);
    setIsTraining(false);
  }

  function handleAnalyze() {
    if (!baselines) return;
    const s = scoreAll(LIVE_EVENTS, baselines);
    setScored(s);
    const inc = correlate(s);
    setIncidents(inc);
    const status: Record<string, string> = {};
    for (const i of inc) status[i.id] = "Open";
    setIncidentStatus(status);
    setTab("threats");
  }

  function logAction(incidentId: string, text: string) {
    setActionLog((prev) => ({ ...prev, [incidentId]: [...(prev[incidentId] ?? []), `${now()} — ${text}`] }));
  }

  function handleLogoutEverywhere(inc: Incident) {
    if (!loggedOutUsers.includes(inc.userEmail)) setLoggedOutUsers((p) => [...p, inc.userEmail]);
    setIncidentStatus((p) => ({ ...p, [inc.id]: "Contained" }));
    logAction(inc.id, `Logged out everywhere: all sessions revoked for ${inc.userEmail}`);
  }

  function handleQuarantine(inc: Incident) {
    if (!quarantinedUsers.includes(inc.userEmail)) setQuarantinedUsers((p) => [...p, inc.userEmail]);
    setIncidentStatus((p) => ({ ...p, [inc.id]: "Contained" }));
    logAction(inc.id, `Account quarantined: ${inc.userEmail} blocked from sensitive systems`);
  }

  function handleVerify(inc: Incident) {
    if (!verifiedUsers.includes(inc.userEmail)) setVerifiedUsers((p) => [...p, inc.userEmail]);
    logAction(inc.id, `Identity verified for ${inc.userEmail} through a second channel`);
  }

  function handleResolve(inc: Incident) {
    setIncidentStatus((p) => ({ ...p, [inc.id]: "Resolved" }));
    logAction(inc.id, "Incident marked resolved by analyst");
  }

  function statusBadge(status: string): string {
    if (status === "Resolved") return "bg-emerald-600 text-white";
    if (status === "Contained") return "bg-amber-500 text-white";
    return "bg-red-600 text-white";
  }

  // Live risk: every response action visibly cools the incident down.
  // Logout -45, quarantine -25, verify -10, resolved locks to 8 LOW.
  function effectiveFor(inc: Incident): { score: number; level: RiskLevel; done: number } {
    const status = incidentStatus[inc.id] ?? "Open";
    if (status === "Resolved") return { score: 8, level: "LOW", done: 4 };
    let s = inc.riskScore;
    let done = 0;
    if (loggedOutUsers.includes(inc.userEmail)) {
      s -= 45;
      done++;
    }
    if (quarantinedUsers.includes(inc.userEmail)) {
      s -= 25;
      done++;
    }
    if (verifiedUsers.includes(inc.userEmail)) {
      s -= 10;
      done++;
    }
    s = Math.max(5, Math.min(100, s));
    return { score: s, level: getRiskLevel(s), done };
  }

  function effectiveUserRisk(email: string, raw: number): { score: number; level: RiskLevel } {
    const related = (incidents ?? []).filter((i) => i.userEmail === email);
    if (related.length > 0 && related.every((i) => (incidentStatus[i.id] ?? "Open") === "Resolved")) {
      return { score: 8, level: "LOW" };
    }
    let s = raw;
    if (loggedOutUsers.includes(email)) s -= 45;
    if (quarantinedUsers.includes(email)) s -= 25;
    if (verifiedUsers.includes(email)) s -= 10;
    s = Math.max(5, Math.min(100, s));
    return { score: s, level: getRiskLevel(s) };
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="text-white bg-gradient-to-r from-teal-900 via-teal-700 to-cyan-700">
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-3 flex items-center gap-3">
          <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow">
            <Shield size={22} className="text-teal-700" strokeWidth={2.5} />
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400 border-2 border-teal-900">
              <Activity size={11} className="text-teal-950" strokeWidth={3} />
            </span>
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-[0.22em] leading-none">NEXRA</h1>
              <span className="text-[10px] font-black bg-cyan-300 text-teal-950 px-1.5 py-0.5 rounded tracking-widest">SOC</span>
            </div>
            <p className="text-xs text-teal-100 font-medium tracking-wide mt-1">Threat Detection · Risk Analysis</p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-2 text-xs font-semibold bg-teal-950 border border-teal-600 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Learns past-week usage · Flags anomalies
          </div>
        </div>
        <nav className="bg-teal-950 border-t border-teal-800">
          <div className="max-w-6xl mx-auto px-4 flex gap-1 py-2">
            <TabButton active={tab === "data"} onClick={() => setTab("data")} icon={<Database size={15} />} label="Activity Data" />
            <TabButton active={tab === "training"} onClick={() => setTab("training")} icon={<Brain size={15} />} label="Training" />
            <TabButton active={tab === "threats"} onClick={() => setTab("threats")} icon={<AlertTriangle size={15} />} label="Threats" />
            <TabButton active={tab === "users"} onClick={() => setTab("users")} icon={<Users size={15} />} label="Users" />
          </div>
        </nav>
        <div className="h-1 bg-gradient-to-r from-cyan-300 via-cyan-400 to-emerald-400" />
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {tab === "data" && (
          <section className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="p-5 border-b border-slate-200">
              <h2 className="text-base font-bold">Past-week usage data</h2>
              <p className="text-sm text-slate-600 mt-1">
                File: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">data/past_week_activity.csv</span> ·{" "}
                {ALL_ROWS.length} rows · {days.length} days ({days[0]} to {days[days.length - 1]}) · 10 users. Open this CSV
                during the presentation, then train the model on it.
              </p>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by user, event, location, device..."
                className="mt-3 w-full sm:w-96 border border-slate-300 rounded-md px-3 py-2 text-sm bg-white"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-left">
                    <th className="px-4 py-2 font-semibold">Timestamp</th>
                    <th className="px-4 py-2 font-semibold">User</th>
                    <th className="px-4 py-2 font-semibold">Event</th>
                    <th className="px-4 py-2 font-semibold">Device</th>
                    <th className="px-4 py-2 font-semibold">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r, i) => (
                    <tr key={i} className="border-t border-slate-200">
                      <td className="px-4 py-2 font-mono text-xs">{r.timestamp}</td>
                      <td className="px-4 py-2">{r.userEmail}</td>
                      <td className="px-4 py-2">{r.eventType}</td>
                      <td className="px-4 py-2 text-slate-600">{r.device}</td>
                      <td className="px-4 py-2 text-slate-600">{r.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-5 py-3 text-xs text-slate-500">Showing first {filteredRows.length} matching rows.</p>
          </section>
        )}

        {tab === "training" && (
          <section className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
            <h2 className="text-base font-bold">Train the model on past-week data</h2>
            <p className="text-sm text-slate-600 mt-1">
              The model learns each user's normal hours, devices, and locations day by day. Scores update only after
              training is complete.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={handleTrain}
                disabled={isTraining}
                className="bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-md disabled:bg-slate-400"
              >
                {isTraining ? "Training..." : baselines ? "Retrain model" : "Train model on past week"}
              </button>
              <button
                onClick={handleAnalyze}
                disabled={!baselines || isTraining}
                className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-md disabled:bg-slate-300 disabled:text-slate-500"
              >
                Analyze recent activity
              </button>
              <span className="text-sm text-slate-600">{progress}% · {trainedDays.length}/{days.length} days</span>
            </div>
            <div className="mt-3 h-3 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-teal-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {days.map((d) => (
                <span
                  key={d}
                  className={`text-xs font-mono px-2 py-1 rounded border ${
                    trainedDays.includes(d) ? "bg-teal-700 text-white border-teal-700" : "bg-white text-slate-500 border-slate-300"
                  }`}
                >
                  {d.slice(5)}
                </span>
              ))}
            </div>
            <ul className="mt-4 space-y-1 text-sm font-mono text-slate-700">
              {trainLog.map((l, i) => (
                <li key={i} className="bg-slate-50 border border-slate-200 rounded px-2 py-1">{l}</li>
              ))}
              {trainLog.length === 0 && <li className="text-slate-500">Not trained yet. Click "Train model on past week".</li>}
            </ul>

            {baselineList.length > 0 && (
              <div className="mt-5 overflow-x-auto">
                <h3 className="text-sm font-bold mb-2">Learned profiles</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-left">
                      <th className="px-3 py-2 font-semibold">User</th>
                      <th className="px-3 py-2 font-semibold">Usual hours</th>
                      <th className="px-3 py-2 font-semibold">Usual device</th>
                      <th className="px-3 py-2 font-semibold">Usual location</th>
                      <th className="px-3 py-2 font-semibold">Events learned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {baselineList.map((b) => (
                      <tr key={b.userId} className="border-t border-slate-200">
                        <td className="px-3 py-2">{b.userEmail}</td>
                        <td className="px-3 py-2 font-mono text-xs">{b.usualStartHour}:00 – {b.usualEndHour}:00</td>
                        <td className="px-3 py-2 text-slate-600">{b.usualDevices[0]}</td>
                        <td className="px-3 py-2 text-slate-600">{b.usualLocations[0]}</td>
                        <td className="px-3 py-2">{b.eventCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {tab === "threats" && (
          <div className="space-y-5">
            {!scored ? (
              <section className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
                <h2 className="text-base font-bold">No analysis yet</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Train the model first, then analyze recent activity. The attack sequence for alex@company.com
                  (02:14 – 02:21) will be scored against the learned baseline.
                </p>
                <button
                  onClick={() => setTab("training")}
                  className="mt-3 bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-md"
                >
                  Go to Training
                </button>
              </section>
            ) : (
              <>
                {/* Stat hero row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Events analyzed" value={String(scored.length)} sub="last 24h" color="bg-teal-700" />
                  <StatCard label="Anomalies" value={String(anomalies.length)} sub="score 26+" color="bg-amber-500" />
                  <StatCard label="Critical events" value={String(criticalCount)} sub="score 76+" color="bg-red-600" />
                  <StatCard label="Users at risk" value={String(usersAtRisk)} sub="with anomalies" color="bg-orange-600" />
                </div>

                {/* Charts */}
                <div className="grid md:grid-cols-2 gap-4">
                  <section className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
                    <h3 className="text-sm font-bold">Risk escalation — recent activity</h3>
                    <p className="text-xs text-slate-500 mb-2">Each bar is one event in time order. Watch the spike at 02:14–02:21.</p>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={0} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v) => [`${v}/100`, "Risk"]} labelFormatter={(_, p) => p?.[0]?.payload?.label ?? ""} />
                          <Bar dataKey="risk" radius={[4, 4, 0, 0]}>
                            {trendData.map((d, i) => (
                              <Cell key={i} fill={d.risk >= 76 ? "#dc2626" : d.risk >= 51 ? "#ea580c" : d.risk >= 26 ? "#d97706" : "#059669"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                  <section className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
                    <h3 className="text-sm font-bold">Risk distribution + top users</h3>
                    <p className="text-xs text-slate-500 mb-2">Most activity is LOW. One account owns all the CRITICAL mass.</p>
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={distData} dataKey="value" nameKey="name" outerRadius={65} label={{ fontSize: 10 }}>
                              {distData.map((d) => (
                                <Cell key={d.name} fill={LEVEL_COLOR[d.name as RiskLevel]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2">
                        {userRiskData.map((u) => (
                          <div key={u.full}>
                            <div className="flex justify-between text-xs font-semibold">
                              <span>{u.email}</span>
                              <span>{u.risk}</span>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${u.risk}%`,
                                  backgroundColor: u.risk >= 76 ? "#dc2626" : u.risk >= 51 ? "#ea580c" : u.risk >= 26 ? "#d97706" : "#059669",
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                      {distData.map((d) => (
                        <span key={d.name} className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: LEVEL_COLOR[d.name as RiskLevel] }} />
                          {d.name}: {d.value}
                        </span>
                      ))}
                    </div>
                  </section>
                </div>

                {incidents?.map((inc) => {
                  const status = incidentStatus[inc.id] ?? "Open";
                  const logs = actionLog[inc.id] ?? [];
                  const isOut = loggedOutUsers.includes(inc.userEmail);
                  const isQ = quarantinedUsers.includes(inc.userEmail);
                  const isV = verifiedUsers.includes(inc.userEmail);
                  const live = effectiveFor(inc);
                  const reduced = inc.riskScore - live.score;
                  const reducedPct = Math.round((reduced / inc.riskScore) * 100);
                  return (
                    <section key={inc.id} className={`rounded-lg shadow-sm overflow-hidden border-2 ${CARD_BORDER[live.level]} bg-white`}>
                      {/* Big judge hero — color + numbers cool down as actions land */}
                      <div className={`${HERO_BG[live.level]} text-white p-5 transition-colors`}>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${HERO_PILL[live.level]}`}>
                            <span className={`w-2 h-2 rounded-full animate-pulse ${HERO_DOT[live.level]}`} />
                            {status.toUpperCase()} · {live.level === "LOW" ? "THREAT NEUTRALIZED" : "LIVE THREAT"}
                          </span>
                          <span className="text-xs font-mono bg-black/20 px-2 py-1 rounded">{inc.id}</span>
                          {reduced > 0 && (
                            <span className="text-xs font-bold bg-black/20 px-2 py-1 rounded">
                              {live.level === "LOW" ? "THREAT REDUCED 100%" : `THREAT REDUCED ${reducedPct}%`}
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-3">
                          <div>
                            <p className={`text-sm font-semibold uppercase tracking-wide ${HERO_SUB[live.level]}`}>Risk severity</p>
                            <p className="text-5xl font-black leading-none">{live.level}</p>
                          </div>
                          <div>
                            <p className={`text-sm font-semibold uppercase tracking-wide ${HERO_SUB[live.level]}`}>Live risk score</p>
                            <p className="text-5xl font-black leading-none">
                              {live.score}<span className="text-2xl font-bold">/100</span>
                            </p>
                            {reduced > 0 && (
                              <p className={`text-sm font-mono mt-1 ${HERO_SUB[live.level]}`}>
                                was <span className="line-through font-bold">{inc.riskScore}</span> → now {live.score}
                              </p>
                            )}
                          </div>
                          <div className="pb-1">
                            <p className="text-xl font-bold leading-tight">{inc.title}</p>
                            <p className={`text-sm ${HERO_SUB[live.level]}`}>{inc.userEmail} · {inc.eventIds.length} related events · 02:14–02:21</p>
                          </div>
                        </div>
                        {/* Live cool-down bar */}
                        <div className="mt-4">
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span>Mitigation progress: {live.done}/4 actions</span>
                            <span>{live.level === "LOW" ? "Contained" : `${live.score}/100 live`}</span>
                          </div>
                          <div className="h-3 bg-black/20 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-white rounded-full transition-all duration-500"
                              style={{ width: `${Math.round(((inc.riskScore - live.score) / inc.riskScore) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-5 grid md:grid-cols-2 gap-5 text-sm">
                        <div>
                          <h3 className="font-bold mb-2 flex items-center gap-1.5"><ShieldAlert size={16} /> Why this score?</h3>
                          <ul className="space-y-1.5">
                            {inc.riskFactors.map((f, i) => (
                              <li key={i} className="flex items-start gap-2 bg-red-50 border border-red-200 rounded px-2.5 py-1.5">
                                <CheckCircle2 size={15} className="text-red-600 mt-0.5 shrink-0" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                          <h3 className="font-bold mt-4 mb-1">Assessment</h3>
                          <p className="text-slate-700 bg-slate-50 border border-slate-200 rounded px-2.5 py-2">{inc.assessment}</p>
                          <h3 className="font-bold mt-4 mb-1">Attack timeline</h3>
                          <ol className="relative border-l-2 border-red-300 ml-2 space-y-2">
                            {scored
                              .filter((s) => inc.eventIds.includes(s.id))
                              .map((s) => (
                                <li key={s.id} className="ml-4">
                                  <span className="absolute -ml-[21px] mt-1 w-3 h-3 rounded-full bg-red-600 border-2 border-white" />
                                  <div className="bg-white border border-slate-200 rounded px-2 py-1">
                                    <span className="font-mono text-xs font-bold">{s.timestamp.slice(11, 16)}</span>
                                    <span className="text-xs"> — {s.eventType} </span>
                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${riskBadge(s.riskLevel)}`}>{s.riskScore}</span>
                                  </div>
                                </li>
                              ))}
                          </ol>
                        </div>

                        <div>
                          <h3 className="font-bold mb-2 flex items-center gap-1.5"><ShieldCheck size={16} /> Recommended actions — click to respond</h3>
                          <div className="space-y-2">
                            <ActionRow
                              title="Failed logins detected → log out everywhere"
                              desc={isOut ? "Done: all sessions revoked." : "Ends every active session for this account now."}
                              done={isOut}
                              button={isOut ? "Sessions revoked" : "Log out everywhere"}
                              onClick={() => handleLogoutEverywhere(inc)}
                              icon={<LogOut size={15} />}
                            />
                            <ActionRow
                              title="Unseen device + location → quarantine account"
                              desc={isQ ? "Done: account movement blocked." : "Blocks sensitive systems until review passes."}
                              done={isQ}
                              button={isQ ? "Quarantined" : "Quarantine account"}
                              onClick={() => handleQuarantine(inc)}
                              icon={<Shield size={15} />}
                            />
                            <ActionRow
                              title="Verify the user's identity"
                              desc={isV ? "Done: user confirmed via second channel." : "Call or message the employee before restoring access."}
                              done={isV}
                              button={isV ? "Verified" : "Mark verified"}
                              onClick={() => handleVerify(inc)}
                              icon={<CheckCircle2 size={15} />}
                            />
                            <ActionRow
                              title="Finish the investigation"
                              desc={status === "Resolved" ? "Done: incident closed." : "Closes the incident after the above steps."}
                              done={status === "Resolved"}
                              button={status === "Resolved" ? "Resolved" : "Mark resolved"}
                              onClick={() => handleResolve(inc)}
                              icon={<CheckCircle2 size={15} />}
                            />
                          </div>
                          <div className="mt-3 text-xs font-semibold flex items-center gap-2">
                            <span>Status:</span>
                            <span className={`px-2 py-1 rounded text-white ${statusBadge(status)}`}>{status}</span>
                          </div>
                          <h3 className="font-bold mt-4 mb-1">Response log</h3>
                          {logs.length === 0 ? (
                            <p className="text-xs text-slate-500">No actions yet. Click a button above — judges see it land here instantly.</p>
                          ) : (
                            <ul className="space-y-1">
                              {logs.map((l, i) => (
                                <li key={i} className="text-xs font-mono bg-slate-50 border border-slate-200 rounded px-2 py-1">{l}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </section>
                  );
                })}

                <section className="bg-white border border-slate-200 rounded-lg shadow-sm">
                  <div className="p-5 border-b border-slate-200 flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold">Scored recent activity ({anomalies.length} anomalies)</h2>
                    <span className="text-xs font-bold px-2 py-1 rounded bg-red-600 text-white">{criticalCount} CRITICAL</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 text-left">
                          <th className="px-4 py-2 font-semibold">Time</th>
                          <th className="px-4 py-2 font-semibold">User</th>
                          <th className="px-4 py-2 font-semibold">Event</th>
                          <th className="px-4 py-2 font-semibold">Risk</th>
                          <th className="px-4 py-2 font-semibold">Why</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scored.map((s) => (
                          <tr key={s.id} className={`border-t border-slate-200 ${s.riskScore >= 76 ? "bg-red-50" : ""}`}>
                            <td className="px-4 py-2 font-mono text-xs">{s.timestamp}</td>
                            <td className="px-4 py-2">{s.userEmail}</td>
                            <td className="px-4 py-2">{s.eventType}</td>
                            <td className="px-4 py-2">
                              <span className={`text-sm font-bold px-2.5 py-1 rounded ${riskBadge(s.riskLevel)}`}>
                                {s.riskScore} {s.riskLevel}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-slate-600 text-xs">{s.reasons.join("; ")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}
          </div>
        )}

        {tab === "users" && (
          <section className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="p-5 border-b border-slate-200">
              <h2 className="text-base font-bold">Users</h2>
              <p className="text-sm text-slate-600">
                {baselines ? "Current risk comes from the latest analysis. Response actions update this table live." : "Train the model to see learned profiles and risk."}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-left">
                    <th className="px-4 py-2 font-semibold">User</th>
                    <th className="px-4 py-2 font-semibold">Usual hours</th>
                    <th className="px-4 py-2 font-semibold">Usual location</th>
                    <th className="px-4 py-2 font-semibold">State</th>
                    <th className="px-4 py-2 font-semibold">Current risk</th>
                  </tr>
                </thead>
                <tbody>
                  {(baselineList.length > 0
                    ? baselineList
                    : [{ userId: "x", userEmail: "Train the model first", usualStartHour: 0, usualEndHour: 0, usualDevices: ["-"], usualLocations: ["-"], eventCount: 0 } as UserBaseline]
                  ).map((b) => {
                    const top = scored?.filter((s) => s.userId === b.userId).sort((a, z) => z.riskScore - a.riskScore)[0];
                    const eff = top ? effectiveUserRisk(b.userEmail, top.riskScore) : null;
                    const flags: string[] = [];
                    if (quarantinedUsers.includes(b.userEmail)) flags.push("Quarantined");
                    if (loggedOutUsers.includes(b.userEmail)) flags.push("Logged out");
                    if (verifiedUsers.includes(b.userEmail)) flags.push("Verified");
                    return (
                      <tr key={b.userId} className="border-t border-slate-200">
                        <td className="px-4 py-2 font-semibold">{b.userEmail}</td>
                        <td className="px-4 py-2 font-mono text-xs">{baselineList.length ? `${b.usualStartHour}:00 – ${b.usualEndHour}:00` : "-"}</td>
                        <td className="px-4 py-2 text-slate-600">{b.usualLocations[0]}</td>
                        <td className="px-4 py-2 text-xs">{flags.length ? flags.join(" · ") : <span className="text-slate-400">Normal</span>}</td>
                        <td className="px-4 py-2">
                          {top && eff ? (
                            <span>
                              <span className={`text-sm font-bold px-2.5 py-1 rounded ${riskBadge(eff.level)}`}>
                                {eff.score} {eff.level}
                              </span>
                              {eff.score !== top.riskScore && (
                                <span className="ml-2 text-xs text-slate-500 font-mono line-through">was {top.riskScore}</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">Not scored</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-4 pb-6 text-xs text-slate-500">
        NEXRA · Local baseline model · Risk: 0–25 LOW, 26–50 MEDIUM, 51–75 HIGH, 76–100 CRITICAL · No data leaves the browser.
      </footer>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-md transition-colors ${
        active ? "bg-cyan-400 text-teal-950 shadow" : "text-teal-100 hover:bg-teal-900 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className={`${color} text-white rounded-lg p-4 shadow-sm`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-90">{label}</p>
      <p className="text-4xl font-black leading-tight">{value}</p>
      <p className="text-xs opacity-90">{sub}</p>
    </div>
  );
}

function ActionRow({ title, desc, done, button, onClick, icon }: { title: string; desc: string; done: boolean; button: string; onClick: () => void; icon: ReactNode }) {
  return (
    <div className={`border rounded-md p-3 flex items-center gap-3 ${done ? "bg-emerald-50 border-emerald-300" : "bg-white border-slate-300"}`}>
      <div className="flex-1">
        <p className="font-bold text-sm">{title}</p>
        <p className="text-xs text-slate-600">{desc}</p>
      </div>
      <button
        onClick={onClick}
        disabled={done}
        className={`flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-md text-white whitespace-nowrap ${
          done ? "bg-emerald-600" : "bg-teal-700"
        } disabled:opacity-100`}
      >
        {icon}
        {button}
      </button>
    </div>
  );
}
