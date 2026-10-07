import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, Bell, Sun, Moon, Sparkles, User, 
  ChevronDown, Check, ExternalLink, HelpCircle,
  SlidersHorizontal, Shield, Layers
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useDensity } from '../context/DensityContext';
import { useInvestigation } from '../context/InvestigationContext';

const WORKSPACES = [
  'Global Threat Operations',
  'North America SOC',
  'EMEA Incident Response',
  'APJ Cyber Defense Hub',
  'Government & Defense Cluster'
];

interface HeaderProps {
  onOpenCommandPalette: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCommandPalette }) => {
  const { theme, toggleTheme } = useTheme();
  const { density, toggleDensity, isCompact } = useDensity();
  const { toggleCopilot } = useInvestigation();

  const [workspace, setWorkspace] = useState(WORKSPACES[0]);
  const [showWsMenu, setShowWsMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const wsRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (wsRef.current && !wsRef.current.contains(e.target as Node)) setShowWsMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifMenu(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <header className="h-12 border-b border-border bg-surface px-4 flex items-center justify-between gap-4 select-none shrink-0 z-20 print:hidden">
      
      {/* ── Left: Workspace Selector ── */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative" ref={wsRef}>
          <button
            onClick={() => setShowWsMenu(!showWsMenu)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-surface-elevated hover:bg-surface-hover border border-border text-xs text-text transition-colors cursor-pointer"
          >
            <Layers size={13} className="text-primary" />
            <span className="font-semibold truncate max-w-[170px]">{workspace}</span>
            <ChevronDown size={12} className="text-text-muted" />
          </button>

          {showWsMenu && (
            <div className="absolute left-0 mt-1 w-56 rounded bg-surface border border-border shadow-lg py-1 z-50 text-xs">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted border-b border-border">
                Switch Operational Scope
              </div>
              {WORKSPACES.map(ws => (
                <button
                  key={ws}
                  onClick={() => { setWorkspace(ws); setShowWsMenu(false); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-surface-hover flex items-center justify-between text-text cursor-pointer transition-colors"
                >
                  <span className={ws === workspace ? 'font-semibold text-primary' : ''}>{ws}</span>
                  {ws === workspace && <Check size={12} className="text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Center: Prominent Global Intelligence Search ── */}
      <div className="flex-1 max-w-xl mx-auto">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-1.5 bg-surface-elevated hover:bg-surface-hover border border-border rounded text-xs text-text-muted hover:text-text transition-colors cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center gap-2 truncate">
            <Search size={14} className="text-text-muted group-hover:text-primary transition-colors" />
            <span className="text-[12px] truncate">Search indicators, CVEs, actors, campaigns, rules...</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px] text-text-muted bg-surface px-1.5 py-0.5 rounded border border-border shrink-0">
            <span>Ctrl</span>
            <span>K</span>
          </div>
        </button>
      </div>

      {/* ── Right Action Controls ── */}
      <div className="flex items-center gap-1.5 shrink-0">
        
        {/* Threat Copilot Drawer Button */}
        <button
          onClick={toggleCopilot}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-primary/10 hover:bg-primary/20 border border-primary/25 text-primary text-xs font-semibold cursor-pointer transition-colors"
          title="Open Threat Copilot Assistant"
        >
          <Sparkles size={13} />
          <span className="hidden sm:inline">Copilot</span>
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        {/* Density Mode Switcher */}
        <button
          onClick={toggleDensity}
          className={`p-1.5 rounded text-text-muted hover:text-text hover:bg-surface-hover cursor-pointer transition-colors ${
            isCompact ? 'text-primary bg-primary/10' : ''
          }`}
          title={`Workstation Density: ${density === 'compact' ? 'Compact' : 'Comfortable'}`}
        >
          <SlidersHorizontal size={14} />
        </button>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded text-text-muted hover:text-text hover:bg-surface-hover cursor-pointer transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-1.5 rounded text-text-muted hover:text-text hover:bg-surface-hover cursor-pointer transition-colors relative"
            title="Threat Ingestion Alerts"
          >
            <Bell size={14} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-critical rounded-full" />
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-1 w-80 rounded bg-surface border border-border shadow-xl py-2 z-50 text-xs">
              <div className="px-3 pb-2 border-b border-border flex items-center justify-between">
                <span className="font-semibold text-text">Recent Alert Dispatches</span>
                <span className="text-[10px] text-text-muted">Live Queue</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-border custom-scrollbar">
                <div className="p-3 hover:bg-surface-hover transition-colors">
                  <div className="flex items-center gap-1.5 text-critical font-medium mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-critical" />
                    <span>Critical Indicator Observed</span>
                  </div>
                  <p className="text-text-secondary text-[11px] leading-relaxed">
                    New domain indicator <span className="font-mono text-text">sadis.store</span> linked to ClearFake delivery.
                  </p>
                  <span className="text-[10px] font-mono text-text-muted mt-1 block">ThreatFox Feed · 4m ago</span>
                </div>
                <div className="p-3 hover:bg-surface-hover transition-colors">
                  <div className="flex items-center gap-1.5 text-high font-medium mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-high" />
                    <span>SSL Certificate Blacklist</span>
                  </div>
                  <p className="text-text-secondary text-[11px] leading-relaxed">
                    Batch of 558 malicious SSL SHA-1 certificates ingested from abuse.ch.
                  </p>
                  <span className="text-[10px] font-mono text-text-muted mt-1 block">SSLBL · 12m ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1.5 p-1 rounded hover:bg-surface-hover cursor-pointer transition-colors"
          >
            <div className="w-6 h-6 rounded bg-surface-elevated border border-border flex items-center justify-center text-text text-xs font-semibold">
              <User size={13} />
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-1 w-48 rounded bg-surface border border-border shadow-xl py-1 z-50 text-xs">
              <div className="px-3 py-2 border-b border-border">
                <p className="font-semibold text-text">Tier 3 Analyst</p>
                <p className="text-[10px] text-text-muted font-mono">analyst@soc.corp</p>
              </div>
              <div className="py-1">
                <div className="px-3 py-1.5 text-text-secondary">Role: Lead Threat Hunter</div>
                <div className="px-3 py-1.5 text-text-secondary">Security Clearance: TS/SCI</div>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
