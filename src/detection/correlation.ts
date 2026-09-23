import { EventSeverity, Incident, SecurityEvent, UserProfile } from '../types/security';
import { generateAIExplanation } from './aiExplainer';
import { getRiskLevel } from './engine';

/**
 * Correlates an array of related events for a specific user into a structured Incident
 */
export function correlateEventsIntoIncident(
  user: UserProfile,
  events: SecurityEvent[],
  existingIncidentId?: string
): Incident {
  // Sort events chronologically
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Extract collective risk factors
  const factorSet = new Set<string>();
  let hasFailedLogin = false;
  let hasPrivilegeChange = false;
  let hasSensitiveDownload = false;
  let hasNewDevice = false;
  let hasNewLocation = false;
  let hasSuspiciousNetwork = false;

  for (const ev of sortedEvents) {
    if (ev.eventType === 'Failed Login') hasFailedLogin = true;
    if (ev.eventType === 'Privilege Change') hasPrivilegeChange = true;
    if (ev.eventType === 'Sensitive File Download') hasSensitiveDownload = true;
    if (ev.eventType === 'New Device') hasNewDevice = true;
    if (ev.eventType === 'New Location') hasNewLocation = true;
    if (ev.eventType === 'Suspicious Network Connection') hasSuspiciousNetwork = true;
  }

  if (hasNewDevice) factorSet.add('Previously unseen device hardware fingerprint');
  if (hasNewLocation) factorSet.add('Geographic access deviation from historical baseline');
  if (hasFailedLogin) factorSet.add('Multiple consecutive authentication challenge failures');
  if (hasSensitiveDownload) factorSet.add('Unauthorized extraction of high-value internal credentials');
  if (hasPrivilegeChange) factorSet.add('Unauthorized privilege elevation to administrative tier');
  if (hasSuspiciousNetwork) factorSet.add('Traffic routed via untrusted commercial VPN / hosting ASN');

  // Compute composite risk score
  let compositeScore = 40;
  if (hasNewDevice) compositeScore += 12;
  if (hasNewLocation) compositeScore += 14;
  if (hasFailedLogin) compositeScore += 18;
  if (hasSensitiveDownload) compositeScore += 22;
  if (hasPrivilegeChange) compositeScore += 28;
  if (hasSuspiciousNetwork) compositeScore += 10;

  const finalScore = Math.min(Math.max(compositeScore, 20), 98);
  const severity = getRiskLevel(finalScore) as EventSeverity;

  // Derive descriptive Incident Title
  let title = 'Potential Account Compromise';
  if (hasPrivilegeChange && hasSensitiveDownload) {
    title = 'Potential Account Compromise & Privilege Escalation';
  } else if (hasSensitiveDownload) {
    title = 'Suspicious Data Access & Exfiltration Attempt';
  } else if (hasFailedLogin && hasNewDevice) {
    title = 'Brute Force & Unrecognized Device Ingress';
  } else if (hasPrivilegeChange) {
    title = 'Unauthorized Administrative Privilege Escalation';
  }

  // Generate Explainable AI Analysis
  const aiAnalysis = generateAIExplanation(user, sortedEvents, finalScore, severity, Array.from(factorSet));

  const incidentId = existingIncidentId || `INC-${Date.now().toString().slice(-6)}`;

  return {
    id: incidentId,
    title,
    description: `Correlated ${sortedEvents.length} security telemetry anomalies affecting ${user.name} (${user.email}).`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    riskScore: finalScore,
    severity,
    status: 'Open',
    detectedAt: sortedEvents[sortedEvents.length - 1]?.timestamp || new Date().toISOString(),
    eventIds: sortedEvents.map((e) => e.id),
    riskFactors: Array.from(factorSet),
    aiAnalysis,
    mitigationHistory: [
      {
        timestamp: new Date().toISOString(),
        action: 'Automated correlation rule triggered incident generation',
        operator: 'NEXRA Detection Engine',
      },
    ],
  };
}
