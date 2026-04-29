import React from 'react';
import { ShieldAlert, Activity, Users, Database, Settings, Shield, Newspaper, Crosshair, EyeOff, Sparkles, Globe, Terminal, Box } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Activity size={20} /> },
    { id: 'ioc', label: 'IoC Feed', icon: <Database size={20} /> },
    { id: 'geomap', label: 'Threat Map', icon: <Globe size={20} className="text-primary" /> },
    { id: 'hunting', label: 'Hunting Hub', icon: <Terminal size={20} className="text-secondary" /> },
    { id: 'oracle', label: 'Threat Oracle', icon: <Sparkles size={20} className="text-secondary" /> },
    { id: 'apt', label: 'APT Groups', icon: <Users size={20} /> },
    { id: 'mitre', label: 'MITRE ATT&CK', icon: <Shield size={20} /> },
    { id: 'asm', label: 'Attack Surface', icon: <Crosshair size={20} /> },
    { id: 'vulnerabilities', label: 'Vulnerabilities', icon: <ShieldAlert size={20} /> },
    { id: 'darkweb', label: 'Dark Web Monitor', icon: <EyeOff size={20} /> },
    { id: 'news', label: 'News Portal', icon: <Newspaper size={20} /> },
    { id: 'sandbox', label: 'Malware Sandbox', icon: <Box size={20} className="text-primary" /> },
  ];

  return (
    <aside className="glass-panel sidebar-container" style={{ width: '260px', borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderLeft: 'none', display: 'flex', flexDirection: 'column' }}>
      <div className="sidebar-brand px-6 py-8 flex items-center gap-3">
        <div className="brand-logo text-danger flex">
          <ShieldAlert size={28} />
        </div>
        <h1 className="font-bold text-lg tracking-wide bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
          ThreatIntel
        </h1>
      </div>

      <nav className="flex-1 px-6 mt-4 flex flex-col gap-2">
        <div className="text-xs font-semibold text-muted mb-2 px-2 uppercase tracking-wide">Analysis</div>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`nav-item flex items-center gap-3 p-3 rounded-lg transition-all ${
              activeTab === item.id ? 'active' : ''
            }`}
            style={{
              background: activeTab === item.id ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: activeTab === item.id ? 'var(--primary-color)' : 'var(--text-muted)',
              border: '1px solid',
              borderColor: activeTab === item.id ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
              textAlign: 'left',
              width: '100%'
            }}
          >
            {item.icon}
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <button 
          onClick={() => setActiveTab('settings')}
          className={`nav-item flex items-center gap-3 p-3 rounded-lg transition-all ${
            activeTab === 'settings' ? 'active' : ''
          }`} 
          style={{ 
            background: activeTab === 'settings' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            color: activeTab === 'settings' ? 'var(--primary-color)' : 'var(--text-muted)',
            border: '1px solid',
            borderColor: activeTab === 'settings' ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
            width: '100%',
            textAlign: 'left'
          }}
        >
          <Settings size={20} />
          <span className="font-medium text-sm">Settings</span>
        </button>
      </div>
    </aside>
  );
};
