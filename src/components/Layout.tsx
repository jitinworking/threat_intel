import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ThreatCopilot } from './ThreatCopilot';
import { CommandPalette } from './CommandPalette';
import { UniversalInvestigationDrawer } from './UniversalInvestigationDrawer';
import { useInvestigation } from '../context/InvestigationContext';
import { BACKEND_URL, WS_URL } from '../config';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('threat-intel-sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [clock, setClock] = useState('');
  const [wsOnline, setWsOnline] = useState(false);
  const [totalCorpus, setTotalCorpus] = useState<number | null>(null);

  const { isDrawerOpen, closeInvestigation, isCopilotOpen, closeCopilot } = useInvestigation();

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('threat-intel-sidebar-collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Live UTC Clock
  useEffect(() => {
    const updateTime = () => setClock(new Date().toISOString().substring(11, 19));
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll honest backend telemetry
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(WS_URL);
      ws.onopen = () => setWsOnline(true);
      ws.onclose = () => setWsOnline(false);
      ws.onerror = () => setWsOnline(false);
    } catch {
      setWsOnline(false);
    }

    fetch(`${BACKEND_URL}/api/stats`)
      .then(res => res.json())
      .then(data => {
        if (data.totalIocs) setTotalCorpus(data.totalIocs);
      })
      .catch(() => {});

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    let gPressed = false;
    let gTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept typing in inputs or textareas
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      // Command Palette (Ctrl+K or Cmd+K or /)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
        return;
      }

      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsCommandOpen(true);
        return;
      }

      // Escape key closes modals / drawers
      if (e.key === 'Escape') {
        if (isCommandOpen) setIsCommandOpen(false);
        if (isDrawerOpen) closeInvestigation();
        if (isCopilotOpen) closeCopilot();
        return;
      }

      // G-sequence navigation (e.g. G then D for dashboard)
      if (e.key.toLowerCase() === 'g' && !gPressed && !e.ctrlKey && !e.metaKey) {
        gPressed = true;
        if (gTimeout) clearTimeout(gTimeout);
        gTimeout = setTimeout(() => { gPressed = false; }, 800);
        return;
      }

      if (gPressed) {
        gPressed = false;
        if (gTimeout) clearTimeout(gTimeout);
        const k = e.key.toLowerCase();
        if (k === 'd') { setActiveTab('dashboard'); }
        else if (k === 'i') { setActiveTab('ioc'); }
        else if (k === 'h') { setActiveTab('hunting'); }
        else if (k === 'g') { setActiveTab('graph'); }
        else if (k === 'r') { setActiveTab('reports'); }
        else if (k === 's') { setActiveTab('settings'); }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandOpen, isDrawerOpen, isCopilotOpen, closeInvestigation, closeCopilot, setActiveTab]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-text select-none font-sans print:static print:h-auto print:overflow-visible">
      
      {/* ── Left Navigation Sidebar ── */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      {/* ── Main Workstation Stage ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        
        {/* Workspace Top Header */}
        <Header onOpenCommandPalette={() => setIsCommandOpen(true)} />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar select-text bg-background print:overflow-visible">
          {children}
        </main>

        {/* ── Bottom Operational Status Bar ── */}
        <footer className="h-7 border-t border-border bg-surface px-4 flex items-center justify-between text-xs text-text-muted shrink-0 z-10 print:hidden select-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${wsOnline ? 'bg-success' : 'bg-critical'}`} />
              <span className="font-medium text-text text-[11px]">
                {wsOnline ? 'Telemetry Live' : 'Telemetry Reconnecting...'}
              </span>
            </div>
            <div className="h-3 w-px bg-border" />
            <span className="text-[11px] text-text-secondary">
              Corpus: <span className="font-mono font-medium text-text">{totalCorpus ? totalCorpus.toLocaleString() : '38,000+'}</span> indicators
            </span>
            <div className="h-3 w-px bg-border" />
            <span className="text-[11px] text-text-muted hidden md:inline">
              Poll cycle: 2m cron
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="hidden sm:inline text-text-muted">UTC:</span>
            <span className="text-text font-medium">{clock}</span>
          </div>
        </footer>

      </div>

      {/* ── Overlays: Command Palette, Investigation Drawer, Copilot ── */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onNavigate={(tab) => { setActiveTab(tab); setIsCommandOpen(false); }}
      />

      <UniversalInvestigationDrawer onNavigate={setActiveTab} />
      <ThreatCopilot />

    </div>
  );
};
