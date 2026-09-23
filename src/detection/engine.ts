import { EventSeverity, EventType, RiskLevel, SecurityEvent, UserProfile } from '../types/security';

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 76) return 'CRITICAL';
  if (score >= 51) return 'HIGH';
  if (score >= 26) return 'MEDIUM';
  return 'LOW';
}

export function getSeverityColor(level: RiskLevel | EventSeverity): {
  text: string;
  bg: string;
  border: string;
  badge: string;
  dot: string;
} {
  switch (level) {
    case 'CRITICAL':
      return {
        text: 'text-rose-400',
        bg: 'bg-rose-950/40',
        border: 'border-rose-800/60',
        badge: 'text-rose-400 bg-rose-500/10 border border-rose-500/30',
        dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
      };
    case 'HIGH':
      return {
        text: 'text-orange-400',
        bg: 'bg-orange-950/40',
        border: 'border-orange-800/60',
        badge: 'text-orange-400 bg-orange-500/10 border border-orange-500/30',
        dot: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]',
      };
    case 'MEDIUM':
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-950/40',
        border: 'border-amber-800/60',
        badge: 'text-amber-400 bg-amber-500/10 border border-amber-500/30',
        dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
      };
    case 'LOW':
    default:
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-950/40',
        border: 'border-emerald-800/60',
        badge: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30',
        dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
      };
  }
}

/**
 * Evaluates risk score based on rule signals and anomaly weights
 */
export function calculateEventRiskContribution(
  event: Partial<SecurityEvent>,
  userBaseline?: UserProfile
): { contribution: number; severity: EventSeverity; factors: string[] } {
  let contribution = 5;
  const factors: string[] = [];

  // Check event type rules
  switch (event.eventType) {
    case 'Privilege Change':
      contribution += 38;
      factors.push('Privilege escalation attempt detected');
      break;
    case 'Sensitive File Download':
      contribution += 28;
      factors.push('Classified credentials or customer vault download');
      break;
    case 'Failed Login':
      contribution += 24;
      factors.push('Authentication challenge failed');
      break;
    case 'Suspicious Network Connection':
      contribution += 22;
      factors.push('Connection routed through unknown hosting provider or VPN ASN');
      break;
    case 'New Location':
      contribution += 18;
      factors.push('Geographic location mismatch with baseline');
      break;
    case 'New Device':
      contribution += 16;
      factors.push('Unregistered hardware fingerprint or client agent');
      break;
    case 'File Access':
      contribution += 8;
      break;
    case 'Login':
    default:
      contribution += 2;
      break;
  }

  // Baseline device deviation
  if (userBaseline && event.device && event.device !== userBaseline.baselineDevice) {
    contribution += 12;
    factors.push(`Hardware mismatch: using ${event.device} vs baseline ${userBaseline.baselineDevice}`);
  }

  // Baseline location deviation
  if (userBaseline && event.location && !event.location.includes(userBaseline.baselineLocation.split(',')[0])) {
    contribution += 14;
    factors.push(`Geographic anomaly: access from ${event.location}`);
  }

  // Anomaly time rule (e.g. 01:00 AM - 05:00 AM local)
  if (event.timestamp) {
    const hour = new Date(event.timestamp).getHours();
    if (hour >= 1 && hour <= 5) {
      contribution += 10;
      factors.push(`Unusual off-hours access (${hour.toString().padStart(2, '0')}:00)`);
    }
  }

  // Bound contribution between 0 and 100
  const finalContribution = Math.min(Math.max(contribution, 0), 100);
  const severity = getRiskLevel(finalContribution) as EventSeverity;

  return { contribution: finalContribution, severity, factors };
}

/**
 * Aggregates user risk score from their recent activity
 */
export function aggregateUserRiskScore(events: SecurityEvent[], baseScore: number = 10): number {
  if (events.length === 0) return baseScore;

  // Weight recent events higher
  let accumulated = baseScore;
  const recentEvents = [...events].slice(-10);

  let failedLoginCount = 0;
  let hasPrivilegeEscalation = false;
  let hasSensitiveDownload = false;
  let hasNewDevice = false;
  let hasNewLocation = false;

  for (const ev of recentEvents) {
    if (ev.eventType === 'Failed Login') failedLoginCount++;
    if (ev.eventType === 'Privilege Change') hasPrivilegeEscalation = true;
    if (ev.eventType === 'Sensitive File Download') hasSensitiveDownload = true;
    if (ev.eventType === 'New Device') hasNewDevice = true;
    if (ev.eventType === 'New Location') hasNewLocation = true;
  }

  if (hasNewDevice) accumulated += 15;
  if (hasNewLocation) accumulated += 18;
  if (failedLoginCount >= 3) accumulated += 26;
  if (hasSensitiveDownload) accumulated += 25;
  if (hasPrivilegeEscalation) accumulated += 35;

  return Math.min(100, Math.max(10, accumulated));
}
