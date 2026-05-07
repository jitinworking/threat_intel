import React from 'react';
import { ShieldAlert, Activity, Users, Database, Settings, Shield, Newspaper, Crosshair, EyeOff, Sparkles, Globe, Terminal, Box, Network, Play } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const dashboardItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Activity size={18} /> },
    { id: 'geomap', label: 'Threat Map', icon: <Globe size={18} className="text-primary" /> },
    { id: 'graph', label: 'Threat Graph', icon: <Network size={18} className="text-purple-400" /> },
    { id: 'asm', label: 'Attack Surface', icon: <Crosshair size={18} /> },
  ];

  const intelligenceItems = [
    { id: 'ioc', label: 'IoC Feed', icon: <Database size={18} /> },
    { id: 'vulnerabilities', label: 'Vulnerabilities', icon: <ShieldAlert size={18} /> },
    { id: 'apt', label: 'APT Groups', icon: <Users size={18} /> },
    { id: 'ransomware', label: 'Ransomware Tracker', icon: <Newspaper size={18} className="text-danger" /> },
    { id: 'darkweb', label: 'Dark Web Monitor', icon: <EyeOff size={18} /> },
  ];

  const huntingItems = [
    { id: 'hunting', label: 'Hunting Hub', icon: <Terminal size={18} className="text-secondary" /> },
    { id: 'campaigns', label: 'Campaign Timelines', icon: <Activity size={18} className="text-warning" /> },
    { id: 'emulation', label: 'Adversary Emulation', icon: <Play size={18} className="text-danger" /> },
    { id: 'blast-radius', label: 'Blast Radius', icon: <Sparkles size={18} className="text-warning" /> },
    { id: 'shadow-mapper', label: 'Shadow Mapper', icon: <Network size={18} className="text-primary" /> },
    { id: 'mitre', label: 'MITRE ATT&CK', icon: <Shield size={18} /> },
  ];

  const toolsItems = [
    { id: 'oracle', label: 'Threat Oracle', icon: <Sparkles size={18} className="text-secondary" /> },
    { id: 'analyzer', label: 'Payload Analyzer', icon: <Terminal size={18} className="text-purple-400" /> },
    { id: 'sandbox', label: 'Malware Sandbox', icon: <Box size={18} className="text-primary" /> },
    { id: 'news', label: 'News Portal', icon: <Newspaper size={18} /> },
  ];

  const renderNavGroup = (title: string, items: any[]) => (
    <div className="mb-6">
      <div className="text-[10px] font-bold text-slate-500 mb-2 px-3 uppercase tracking-widest">{title}</div>
      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left w-full border ${
              activeTab === item.id 
                ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' 
                : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            {item.icon}
            <span className="font-medium text-[13px]">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <aside className="glass-panel sidebar-container flex flex-col" style={{ width: '260px', borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderLeft: 'none' }}>
      <div className="sidebar-brand px-6 py-6 flex items-center gap-3 border-b border-white/5">
        <div className="brand-logo text-danger flex shrink-0">
          <ShieldAlert size={24} />
        </div>
        <h1 className="font-bold text-lg tracking-wide bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
          ThreatIntel
        </h1>
      </div>

      <nav className="flex-1 px-4 mt-6 flex flex-col overflow-y-auto custom-scrollbar">
        {renderNavGroup('Dashboards', dashboardItems)}
        {renderNavGroup('Intelligence', intelligenceItems)}
        {renderNavGroup('Hunting & Emulation', huntingItems)}
        {renderNavGroup('Toolkit', toolsItems)}
      </nav>

      <div className="p-4 mt-auto">
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left w-full border ${
            activeTab === 'settings' 
              ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' 
              : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200'
          }`}
        >
          <Settings size={18} />
          <span className="font-medium text-[13px]">Settings</span>
        </button>
      </div>
    </aside>
  );
};
