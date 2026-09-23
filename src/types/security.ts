/**
 * NEXRA Cybersecurity Threat Detection & Risk Analysis Platform
 * Type Definitions
 */

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type EventType =
  | 'Login'
  | 'Failed Login'
  | 'New Device'
  | 'New Location'
  | 'File Access'
  | 'Sensitive File Download'
  | 'Privilege Change'
  | 'Suspicious Network Connection';

export type EventSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type UserStatus = 'Active' | 'Under Review' | 'Restricted' | 'Quarantined';

export interface SecurityEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userEmail: string;
  eventType: EventType;
  device: string;
  location: string;
  ipAddress: string;
  severity: EventSeverity;
  riskContribution: number;
  details: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  device: string;
  location: string;
  lastLogin: string;
  riskScore: number;
  riskLevel: RiskLevel;
  status: UserStatus;
  avatarUrl?: string;
  baselineDevice: string;
  baselineLocation: string;
  activeSessions: number;
  mfaEnabled: boolean;
}

export interface IncidentAIAnalysis {
  whyReasons: string[];
  assessment: string;
  recommendedActions: string[];
  confidenceScore: number;
  anomalousPattern: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  userId: string;
  userName: string;
  userEmail: string;
  riskScore: number;
  severity: EventSeverity;
  status: 'Open' | 'Investigating' | 'Mitigated' | 'Resolved';
  detectedAt: string;
  eventIds: string[];
  riskFactors: string[];
  aiAnalysis: IncidentAIAnalysis;
  mitigationHistory: {
    timestamp: string;
    action: string;
    operator: string;
  }[];
}

export interface SimulationStep {
  stepIndex: number;
  title: string;
  description: string;
  eventType: EventType;
  severity: EventSeverity;
  deltaScore: number;
  device: string;
  location: string;
  ipAddress: string;
  details: string;
}

export type NavigationTab = 'dashboard' | 'users' | 'activity' | 'incidents' | 'incident-details' | 'assistant';
