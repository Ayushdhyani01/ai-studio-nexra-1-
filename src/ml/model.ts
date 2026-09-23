import type { ActivityRow } from "./csv";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface UserBaseline {
  userId: string;
  userEmail: string;
  eventCount: number;
  usualStartHour: number;
  usualEndHour: number;
  /** Gaussian fit over the user's past-week login hours (the ML part). */
  hourMean: number;
  hourStd: number;
  usualDevices: string[];
  usualLocations: string[];
  usualEventTypes: string[];
}

export interface ScoredEvent extends ActivityRow {
  id: string;
  riskScore: number;
  riskLevel: RiskLevel;
  reasons: string[];
}

export interface Incident {
  id: string;
  title: string;
  userEmail: string;
  riskScore: number;
  severity: RiskLevel;
  eventIds: string[];
  riskFactors: string[];
  assessment: string;
  recommendedActions: string[];
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 76) return "CRITICAL";
  if (score >= 51) return "HIGH";
  if (score >= 26) return "MEDIUM";
  return "LOW";
}

function hourOf(ts: string): number {
  // expects "YYYY-MM-DD HH:MM:SS"
  const h = Number(ts.slice(11, 13));
  return Number.isFinite(h) ? h : 12;
}

/** Country token = text after the last comma ("Mumbai, India" -> "India"). */
export function countryOf(location: string): string {
  const parts = location.split(",");
  return (parts[parts.length - 1] ?? location).trim();
}

/**
 * "Training": learn per-user baselines from past-week rows.
 * This is unsupervised behavioral profiling (the classical UEBA approach):
 *  - login hours are fitted to a Gaussian (mean + std dev),
 *  - devices / locations / countries / event types become frequency tables.
 * A new event is an anomaly when it lands far from these learned distributions.
 */
export function trainBaselines(rows: ActivityRow[]): Map<string, UserBaseline> {
  const byUser = new Map<string, ActivityRow[]>();
  for (const r of rows) {
    const arr = byUser.get(r.userId) ?? [];
    arr.push(r);
    byUser.set(r.userId, arr);
  }

  const out = new Map<string, UserBaseline>();
  for (const [userId, list] of byUser) {
    const hours = list.map((r) => hourOf(r.timestamp)).sort((a, b) => a - b);
    const lo = hours[Math.floor(hours.length * 0.05)] ?? 9;
    const hi = hours[Math.floor(hours.length * 0.95)] ?? 17;
    const mean = hours.reduce((a, h) => a + h, 0) / Math.max(hours.length, 1);
    const variance = hours.reduce((a, h) => a + (h - mean) ** 2, 0) / Math.max(hours.length, 1);
    out.set(userId, {
      userId,
      userEmail: list[0].userEmail,
      eventCount: list.length,
      usualStartHour: lo,
      usualEndHour: hi,
      hourMean: Math.round(mean * 10) / 10,
      hourStd: Math.max(0.5, Math.round(Math.sqrt(variance) * 10) / 10),
      usualDevices: unique(list.map((r) => r.device)),
      usualLocations: unique(list.map((r) => r.location)),
      usualEventTypes: unique(list.map((r) => r.eventType)),
    });
  }
  return out;
}

/**
 * How many standard deviations is this timestamp from the user's learned
 * mean login hour? |z| > 3 ≈ "this person is never awake at this hour".
 */
export function hourZScore(ts: string, baseline: UserBaseline): number {
  const z = (hourOf(ts) - baseline.hourMean) / baseline.hourStd;
  return Math.round(Math.abs(z) * 10) / 10;
}

/** Score one recent event against the learned baseline. */
export function scoreEvent(
  row: ActivityRow,
  id: string,
  baselines: Map<string, UserBaseline>
): ScoredEvent {
  const baseline = baselines.get(row.userId);
  let score = 5;
  const reasons: string[] = [];

  const h = hourOf(row.timestamp);
  const offHours = h < 6 || h >= 22 || (baseline && (h < baseline.usualStartHour - 2 || h > baseline.usualEndHour + 2));
  if (offHours) {
    score += 25;
    const z = baseline ? `, z=${hourZScore(row.timestamp, baseline)} vs learned mean ${baseline.hourMean}:00` : "";
    reasons.push(`Unusual login time (${String(h).padStart(2, "0")}:00, usual ${baseline ? `${baseline.usualStartHour}:00-${baseline.usualEndHour}:00` : "daytime"}${z})`);
  }

  if (baseline && !baseline.usualDevices.includes(row.device)) {
    score += 20;
    reasons.push(`Unseen device: ${row.device} (usual: ${baseline.usualDevices[0]})`);
  }

  if (baseline && !baseline.usualLocations.includes(row.location)) {
    score += 25;
    reasons.push(`Unseen location: ${row.location} (usual: ${baseline.usualLocations[0]})`);
  }

  // First-ever login from a new country (e.g. baseline US, login from India).
  // This is what makes a single Mumbai login cross the 60 alert line:
  // 5 + 25 (location) + 20 (device) + 15 (country) = 65.
  if (baseline) {
    const rowCountry = countryOf(row.location);
    const knownCountries = unique(baseline.usualLocations.map(countryOf));
    if (!knownCountries.includes(rowCountry)) {
      score += 15;
      reasons.push(`First-ever login from a new country: ${rowCountry} (baseline: ${knownCountries.join(", ")})`);
    }
  }

  const et = row.eventType.toLowerCase();
  if (et.includes("failed")) {
    const m = row.details.match(/(\d+)\s*(failed|attempt)/i);
    const burst = m ? Number(m[1]) : 1;
    score += burst >= 5 ? 30 : 20;
    reasons.push(`Multiple failed authentication attempts (${row.details})`);
  }
  if (et.includes("sensitive")) {
    score += 30;
    reasons.push("Sensitive file accessed");
  }
  if (et.includes("privilege")) {
    score += 40;
    reasons.push("Privilege level changed");
  }
  if (et.includes("suspicious") || et.includes("new location") || et.includes("new device")) {
    if (et.includes("suspicious")) {
      score += 20;
      reasons.push("Connection from untrusted network");
    } else if (!reasons.some((r) => r.startsWith("Unseen"))) {
      score += 15;
      reasons.push(`${row.eventType} differs from past-week pattern`);
    }
  }

  if (reasons.length === 0) {
    reasons.push("Matches past-week usage pattern");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { ...row, id, riskScore: score, riskLevel: getRiskLevel(score), reasons };
}

export function scoreAll(rows: ActivityRow[], baselines: Map<string, UserBaseline>): ScoredEvent[] {
  return rows.map((r, i) => scoreEvent(r, `live-${i + 1}`, baselines));
}

/**
 * Correlate: group HIGH/CRITICAL events per user into one incident.
 * Example: 5 Alex events (02:14-02:21) become one
 * "Potential Account Compromise" 94/100 CRITICAL incident.
 */
export function correlate(scored: ScoredEvent[]): Incident[] {
  const byUser = new Map<string, ScoredEvent[]>();
  for (const e of scored) {
    if (e.riskScore < 26) continue;
    const arr = byUser.get(e.userId) ?? [];
    arr.push(e);
    byUser.set(e.userId, arr);
  }

  const incidents: Incident[] = [];
  let n = 0;
  for (const [userId, list] of byUser) {
    const top = Math.max(...list.map((e) => e.riskScore));
    if (top < 51) continue;
    // A single login at/above the alert line (60) already earns an incident
    // card so recommended actions show immediately; weaker signals still
    // need 2+ correlated events.
    if (list.length < 2 && top < 60) continue;
    const severity = getRiskLevel(top);
    const factors = unique(list.flatMap((e) => e.reasons)).slice(0, 6);
    const email = list[0].userEmail;
    incidents.push({
      id: `INC-${String(1000 + n)}`,
      title: "Potential Account Compromise",
      userEmail: email,
      riskScore: top,
      severity,
      eventIds: list.map((e) => e.id),
      riskFactors: factors,
      assessment: `The combined behavior for ${email} deviates from the usage pattern learned over the past week and may indicate account compromise or unauthorized access.`,
      recommendedActions: [
        `Verify the identity of ${email} through a second channel.`,
        "Review recent authentication activity for this account.",
        "Temporarily restrict the suspicious sessions if compromise is confirmed.",
        "Investigate sensitive file access before restoring full access.",
      ],
    });
    void userId;
  }
  return incidents.sort((a, b) => b.riskScore - a.riskScore);
}

function unique(arr: string[]): string[] {
  return [...new Set(arr)];
}
