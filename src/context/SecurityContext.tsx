import React, { createContext, useContext, useEffect, useState } from 'react';
import { generateInitialEvents, INITIAL_INCIDENTS, INITIAL_USERS, SIMULATION_STEPS } from '../data/mockData';
import { generateAIExplanation } from '../detection/aiExplainer';
import { getRiskLevel } from '../detection/engine';
import { Incident, NavigationTab, SecurityEvent, SimulationStep, UserProfile } from '../types/security';

interface SecurityContextType {
  users: UserProfile[];
  events: SecurityEvent[];
  incidents: Incident[];
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  selectedIncidentId: string | null;
  setSelectedIncidentId: (id: string | null) => void;
  selectedUserId: string | null;
  setSelectedUserId: (id: string | null) => void;

  // Threat Simulation
  isSimulating: boolean;
  simulationCurrentStep: number;
  simulationActive: boolean;
  simulationCompleted: boolean;
  runThreatSimulation: () => Promise<void>;
  resetSimulation: () => void;

  // Incident Investigation & Mitigation
  applyRemediationAction: (incidentId: string, actionName: string) => void;

  // AI Security Assistant
  isAIAssistantOpen: boolean;
  setIsAIAssistantOpen: (open: boolean) => void;
  assistantMessages: AssistantMessage[];
  sendAssistantQuery: (query: string) => void;
  clearAssistantHistory: () => void;

  // Filter & Search states
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterSeverity: string;
  setFilterSeverity: (s: string) => void;
  filterEventType: string;
  setFilterEventType: (t: string) => void;

  // Live Pulse counter
  eventsAnalyzedCount: number;
  overallSecurityScore: number;
}

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  recommendations?: string[];
  referenceData?: {
    entityType?: 'user' | 'incident' | 'event';
    id?: string;
    score?: number;
  };
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [events, setEvents] = useState<SecurityEvent[]>(() => generateInitialEvents());
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>('INC-882194');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationCurrentStep, setSimulationCurrentStep] = useState(0);
  const [simulationActive, setSimulationActive] = useState(false);
  const [simulationCompleted, setSimulationCompleted] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterEventType, setFilterEventType] = useState('ALL');

  // AI Assistant drawer
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: 'Greetings, Analyst. I am NEXRA Intelligence Assistant. I am continuously analyzing active telemetry, correlation clusters, and user anomaly baselines. Ask me about any user, incident, or threat pattern.',
      timestamp: 'Just now',
    },
  ]);

  // Live pulse counter simulation (ticks gently up every few seconds)
  const [eventsAnalyzedCount, setEventsAnalyzedCount] = useState(14820);
  useEffect(() => {
    const timer = setInterval(() => {
      setEventsAnalyzedCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Compute Overall Security Score (0 to 100)
  // Inverse weighted of high risk users and open critical incidents
  const criticalCount = incidents.filter((i) => i.severity === 'CRITICAL' && i.status !== 'Resolved').length;
  const highRiskUserCount = users.filter((u) => u.riskScore >= 51).length;
  const overallSecurityScore = Math.max(28, 92 - criticalCount * 14 - highRiskUserCount * 4);

  // Run Threat Simulation
  const runThreatSimulation = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulationActive(true);
    setSimulationCompleted(false);
    setSimulationCurrentStep(0);

    const alexUser = users.find((u) => u.id === 'usr-alex') || INITIAL_USERS[0];
    const simulatedEventsCreated: SecurityEvent[] = [];

    for (let i = 0; i < SIMULATION_STEPS.length; i++) {
      const step = SIMULATION_STEPS[i];
      setSimulationCurrentStep(i + 1);

      // Create synthetic event
      const newEvent: SecurityEvent = {
        id: `ev-sim-${Date.now()}-${i}`,
        timestamp: new Date().toISOString(),
        userId: 'usr-alex',
        userName: alexUser.name,
        userEmail: alexUser.email,
        eventType: step.eventType,
        device: step.device,
        location: step.location,
        ipAddress: step.ipAddress,
        severity: step.severity,
        riskContribution: step.deltaScore,
        details: step.details,
      };

      simulatedEventsCreated.push(newEvent);

      // Prepend event to live events feed
      setEvents((prev) => [newEvent, ...prev]);

      // Update Alex's user record in real time
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === 'usr-alex') {
            const nextScore = step.deltaScore;
            return {
              ...u,
              riskScore: nextScore,
              riskLevel: getRiskLevel(nextScore),
              device: step.device,
              location: step.location,
              status: nextScore >= 76 ? 'Under Review' : u.status,
              lastLogin: 'Just now (Simulated)',
            };
          }
          return u;
        })
      );

      // Wait between steps so judges can watch the progression
      await new Promise((resolve) => setTimeout(resolve, 1100));
    }

    // Step 6 reached: Trigger Automatic Event Correlation & Incident Creation!
    const updatedAlex: UserProfile = {
      ...alexUser,
      riskScore: 94,
      riskLevel: 'CRITICAL',
      status: 'Under Review',
      device: 'Kali Linux 2026.2 (Custom VM)',
      location: 'Bucharest, Romania',
    };

    const factorList = [
      'Unusual off-hours access (02:14 AM - 02:21 AM local)',
      'Previously unseen device detected (Kali Linux 2026.2)',
      'Impossible travel velocity (Austin -> Bucharest in 90 seconds)',
      'Multiple failed authentication challenges (8 rapid bursts)',
      'High-value secrets archive downloaded (customer_pii_vault_keys.tar.gz)',
      'Unauthorized administrative privilege escalation to SuperAdmin',
    ];

    const aiAnalysis = generateAIExplanation(
      updatedAlex,
      simulatedEventsCreated,
      94,
      'CRITICAL',
      factorList
    );

    const simulatedIncidentId = `INC-SIM-${Date.now().toString().slice(-4)}`;
    const newSimulatedIncident: Incident = {
      id: simulatedIncidentId,
      title: 'Potential Account Compromise & Privilege Escalation',
      description: 'NEXRA correlated 6 sequential telemetry deviations indicating account takeover and key exfiltration.',
      userId: 'usr-alex',
      userName: updatedAlex.name,
      userEmail: updatedAlex.email,
      riskScore: 94,
      severity: 'CRITICAL',
      status: 'Open',
      detectedAt: new Date().toISOString(),
      eventIds: simulatedEventsCreated.map((e) => e.id),
      riskFactors: factorList,
      aiAnalysis,
      mitigationHistory: [
        {
          timestamp: new Date().toISOString(),
          action: 'Threat Simulation generated 6 correlated attack steps',
          operator: 'NEXRA Live Attack Simulator',
        },
      ],
    };

    setIncidents((prev) => [newSimulatedIncident, ...prev]);
    setSelectedIncidentId(simulatedIncidentId);
    setIsSimulating(false);
    setSimulationCompleted(true);
  };

  // Reset Simulation to initial clean state
  const resetSimulation = () => {
    setIsSimulating(false);
    setSimulationActive(false);
    setSimulationCompleted(false);
    setSimulationCurrentStep(0);

    // Revert Alex Vance
    setUsers(INITIAL_USERS);
    // Remove sim events and sim incidents
    setEvents(generateInitialEvents());
    setIncidents(INITIAL_INCIDENTS);
    setSelectedIncidentId('INC-882194');
  };

  // Apply Remediation Action
  const applyRemediationAction = (incidentId: string, actionName: string) => {
    let affectedUserId: string | null = null;
    const isResolve = actionName.toLowerCase().includes('resolve');
    const isQuarantine = actionName.toLowerCase().includes('quarantine');
    const isRevoke = actionName.toLowerCase().includes('revoke');

    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === incidentId) {
          affectedUserId = inc.userId;
          const newStatus = isResolve ? 'Resolved' : 'Mitigated';
          const newScore = isResolve ? 12 : Math.max(18, Math.round(inc.riskScore * 0.4));
          return {
            ...inc,
            status: newStatus,
            riskScore: newScore,
            severity: getRiskLevel(newScore),
            mitigationHistory: [
              ...inc.mitigationHistory,
              {
                timestamp: new Date().toISOString(),
                action: actionName,
                operator: 'SecOps Analyst (Authenticated)',
              },
            ],
          };
        }
        return inc;
      })
    );

    // Update target user record
    setUsers((prev) =>
      prev.map((u) => {
        const isMatch = affectedUserId
          ? u.id === affectedUserId
          : incidents.some((inc) => inc.id === incidentId && inc.userId === u.id);

        if (isMatch) {
          const nextScore = isResolve ? 14 : Math.max(16, Math.round(u.riskScore * 0.5));
          return {
            ...u,
            status: isQuarantine ? 'Quarantined' : isResolve ? 'Active' : u.status,
            riskScore: nextScore,
            riskLevel: getRiskLevel(nextScore),
            activeSessions: isRevoke ? 0 : u.activeSessions,
          };
        }
        return u;
      })
    );
  };

  // Intelligent AI Assistant Domain Reasoner
  const sendAssistantQuery = (queryText: string) => {
    const userMsg: AssistantMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: 'Just now',
    };

    setAssistantMessages((prev) => [...prev, userMsg]);

    const lower = queryText.toLowerCase();
    let reply = '';
    let recommendations: string[] | undefined = undefined;

    // Direct fact-checking against current state
    const alex = users.find((u) => u.name.toLowerCase().includes('alex') || u.id === 'usr-alex');
    const latestCritical = incidents.find((i) => i.severity === 'CRITICAL');
    const highestUser = [...users].sort((a, b) => b.riskScore - a.riskScore)[0];
    const totalEvents = events.length;
    const criticalIncidentsCount = incidents.filter((i) => i.severity === 'CRITICAL').length;
    const highRiskUsersList = users.filter((u) => u.riskScore >= 51);

    if (lower.includes('alex') && lower.includes('risk')) {
      if (alex && alex.riskScore >= 51) {
        reply = `Alex Vance is currently rated CRITICAL (${alex.riskScore}/100) due to a correlated attack sequence:
• Off-hours login at 02:14 AM
• Ingress from unrecognized device: ${alex.device}
• Sudden geographic jump to ${alex.location} (VPN ASN 212238)
• 8 rapid authentication challenge failures
• Unauthorized download of sensitive credential vault archives
• Administrative privilege escalation to SuperAdmin.`;
        recommendations = [
          'Revoke active session tokens immediately',
          'Quarantine endpoint credentials',
          'Initiate voice verification with employee',
        ];
      } else {
        reply = `Alex Vance currently holds a nominal LOW risk score (${alex?.riskScore || 14}/100). No anomalous deviations or unauthorized credential access have been flagged on his standard corporate MacBook Pro (Austin, TX).`;
      }
    } else if (lower.includes('latest critical') || lower.includes('latest incident') || lower.includes('critical incident')) {
      if (latestCritical) {
        reply = `The most recent Critical incident is [${latestCritical.id}] "${latestCritical.title}" affecting ${latestCritical.userName} (${latestCritical.userEmail}).
• Risk Score: ${latestCritical.riskScore}/100 (CRITICAL)
• Status: ${latestCritical.status}
• Detected: ${new Date(latestCritical.detectedAt).toLocaleTimeString()}
• Primary Signals: ${latestCritical.riskFactors.slice(0, 3).join('; ')}.`;
        recommendations = latestCritical.aiAnalysis.recommendedActions.slice(0, 3);
      } else {
        reply = 'There are currently no active critical incidents. All telemetry indicators remain within nominal security thresholds.';
      }
    } else if (lower.includes('highest') && (lower.includes('user') || lower.includes('risk'))) {
      if (highestUser) {
        reply = `The highest-risk user is ${highestUser.name} (${highestUser.role} in ${highestUser.department}).
• Risk Score: ${highestUser.riskScore}/100 (${highestUser.riskLevel})
• Current Location: ${highestUser.location}
• Active Hardware: ${highestUser.device}
• Account Status: ${highestUser.status}.`;
        recommendations = [
          `Inspect ${highestUser.name}'s active security events`,
          'Verify out-of-band identity before resetting credentials',
        ];
      }
    } else if (lower.includes('summarize') || lower.includes('summary') || lower.includes('today')) {
      reply = `SOC Threat Summary:
• Overall Security Health: ${overallSecurityScore}/100
• Total Events Monitored: ${totalEvents} live telemetry logs
• Active Incidents: ${incidents.length} (${criticalIncidentsCount} Critical, ${incidents.filter((i) => i.severity === 'HIGH').length} High)
• High-Risk User Entities: ${highRiskUsersList.map((u) => `${u.name} (${u.riskScore})`).join(', ') || 'None'}
• Live Anomaly Detection: Active across all corporate subnets and cloud accounts.`;
    } else if (lower.includes('why was this incident created') || lower.includes('why this incident') || lower.includes('correlation')) {
      const activeInc = incidents.find((i) => i.id === selectedIncidentId) || incidents[0];
      if (activeInc) {
        reply = `Incident [${activeInc.id}] "${activeInc.title}" was created by the NEXRA Correlation Engine because it identified ${activeInc.eventIds.length} tightly coupled anomalous events for ${activeInc.userName}:
${activeInc.aiAnalysis.whyReasons.map((r) => `✓ ${r}`).join('\n')}

AI Assessment: "${activeInc.aiAnalysis.assessment}"`;
        recommendations = activeInc.aiAnalysis.recommendedActions.slice(0, 3);
      }
    } else {
      // General contextual response referencing live data
      reply = `Analysis based on current live SOC state:
NEXRA has evaluated ${totalEvents} telemetry events across ${users.length} identity entities. We are currently tracking ${incidents.filter((i) => i.status !== 'Resolved').length} open security incidents. The top anomalies involve off-hours credential access and unauthorized privilege escalation.`;
      recommendations = [
        'Run the "Threat Simulation" to observe real-time incident correlation',
        'Review the Users tab for identity risk distribution',
      ];
    }

    setTimeout(() => {
      const botMsg: AssistantMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: 'Just now',
        recommendations,
      };
      setAssistantMessages((prev) => [...prev, botMsg]);
    }, 350);
  };

  const clearAssistantHistory = () => {
    setAssistantMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: 'Telemetry memory refreshed. Ask me any question regarding active user baselines, correlated incidents, or risk factors.',
        timestamp: 'Just now',
      },
    ]);
  };

  return (
    <SecurityContext.Provider
      value={{
        users,
        events,
        incidents,
        activeTab,
        setActiveTab,
        selectedIncidentId,
        setSelectedIncidentId,
        selectedUserId,
        setSelectedUserId,
        isSimulating,
        simulationCurrentStep,
        simulationActive,
        simulationCompleted,
        runThreatSimulation,
        resetSimulation,
        applyRemediationAction,
        isAIAssistantOpen,
        setIsAIAssistantOpen,
        assistantMessages,
        sendAssistantQuery,
        clearAssistantHistory,
        searchQuery,
        setSearchQuery,
        filterSeverity,
        setFilterSeverity,
        filterEventType,
        setFilterEventType,
        eventsAnalyzedCount,
        overallSecurityScore,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
