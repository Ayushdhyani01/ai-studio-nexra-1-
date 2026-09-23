import React from 'react';
import { AIAssistantDrawer } from './components/ai/AIAssistantDrawer';
import { DashboardView } from './components/dashboard/DashboardView';
import { EventsView } from './components/events/EventsView';
import { IncidentDetailsView } from './components/incident-details/IncidentDetailsView';
import { IncidentsView } from './components/incidents/IncidentsView';
import { TopBar } from './components/layout/TopBar';
import { SimulationBanner } from './components/simulation/SimulationBanner';
import { UsersView } from './components/users/UsersView';
import { SecurityProvider, useSecurity } from './context/SecurityContext';

const MainContent: React.FC = () => {
  const { activeTab } = useSecurity();

  return (
    <main className="flex-1 pb-16">
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'users' && <UsersView />}
      {activeTab === 'activity' && <EventsView />}
      {activeTab === 'incidents' && <IncidentsView />}
      {activeTab === 'incident-details' && <IncidentDetailsView />}
    </main>
  );
};

export default function App() {
  return (
    <SecurityProvider>
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
        <TopBar />
        <SimulationBanner />
        <MainContent />
        <AIAssistantDrawer />

        {/* Minimal Footer compliant with Frontend Constitution */}
        <footer className="mt-auto border-t border-neutral-800/80 py-4 px-6 text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-2 bg-neutral-950">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-400">NEXRA</span>
            <span aria-hidden="true">·</span>
            <span>AI Cybersecurity Threat Detection & Risk Analysis Prototype</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Hackathon Demonstration Prototype</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-neutral-400">SOC Rule Engine v2.4</span>
          </div>
        </footer>
      </div>
    </SecurityProvider>
  );
}
