import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ThreatCopilot } from './ThreatCopilot';
import { AnalystNotebook } from './AnalystNotebook';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className="flex flex-col min-h-screen bg-dark">
      <div className="flex flex-1">
        <div className="hidden md:block shrink-0" style={{ width: '260px' }}>
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 layout-container py-8 pb-40 relative">
            {children}
          </main>
        </div>
        <AnalystNotebook />
        <ThreatCopilot />
      </div>
    </div>
  );
};
