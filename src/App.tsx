import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Bell, X, Zap } from 'lucide-react';
import { Layout } from './components/Layout';
import { ThemeProvider } from './context/ThemeContext';
import { DensityProvider } from './context/DensityContext';
import { InvestigationProvider } from './context/InvestigationContext';
import { WS_URL } from './config';

import { Dashboard } from './pages/Dashboard';
import { ExecutiveIntelligence } from './pages/ExecutiveIntelligence';
import { IoCFeed } from './pages/IoCFeed';
import { CveFeed } from './pages/CveFeed';
import { GeoMap } from './pages/GeoMap';
import { HuntingHub } from './pages/HuntingHub';
import { AptGroups } from './pages/AptGroups';
import { Settings } from './pages/Settings';
import { NewsPortal } from './pages/NewsPortal';
import { ThreatGraph } from './pages/ThreatGraph';
import { MalwareIntel } from './pages/MalwareIntel';
import { Campaigns } from './pages/Campaigns';
import { Reports } from './pages/Reports';
import { ThreatFeed } from './pages/ThreatFeed';
import { WeeklyAdvisory } from './pages/WeeklyAdvisory';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  icon?: React.ReactNode;
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(WS_URL);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_iocs') {
            addToast({
              title: 'Telemetry Ingestion',
              message: `Ingested ${data.data.count} new threat indicators.`,
              type: 'success',
              icon: <Zap size={15} className="text-success" />
            });
          } else if (data.type === 'alert') {
            addToast({
              title: `Alert: ${data.data.severity?.toUpperCase() || 'INFO'}`,
              message: data.data.message,
              type: data.data.severity === 'critical' ? 'danger' : 'warning',
              icon: <AlertTriangle size={15} className={data.data.severity === 'critical' ? 'text-critical' : 'text-high'} />
            });
          }
        } catch (err) {
          console.error('WS Error:', err);
        }
      };
    } catch (e) {
      console.warn('WS Init notice:', e);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [addToast]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'executive-intelligence': return <ExecutiveIntelligence />;
      case 'geomap': return <GeoMap />;
      case 'ioc': return <IoCFeed />;
      case 'threat-feed': return <ThreatFeed />;
      case 'apt': return <AptGroups />;
      case 'malware-intel': return <MalwareIntel />;
      case 'campaigns': return <Campaigns />;
      case 'vulnerabilities': return <CveFeed />;
      case 'hunting': return <HuntingHub />;
      case 'graph': return <ThreatGraph />;
      case 'reports': return <Reports />;
      case 'advisory': return <WeeklyAdvisory />;
      case 'news': return <NewsPortal />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <ThemeProvider>
      <DensityProvider>
        <InvestigationProvider>
          <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
            {renderContent()}

            {/* Restrained Toast Stack */}
            <div className="fixed bottom-10 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
              {toasts.map(toast => {
                const borderClass = toast.type === 'danger'
                  ? 'border-critical/30 bg-surface'
                  : toast.type === 'warning'
                  ? 'border-high/30 bg-surface'
                  : 'border-border bg-surface';

                return (
                  <div
                    key={toast.id}
                    className={`pointer-events-auto p-3 rounded border shadow-lg flex items-start gap-3 transition-all ${borderClass}`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {toast.icon || <Bell size={15} className="text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-text">{toast.title}</div>
                      <div className="text-xs text-text-secondary leading-snug mt-0.5 truncate">{toast.message}</div>
                    </div>
                    <button
                      onClick={() => removeToast(toast.id)}
                      className="p-1 hover:bg-surface-hover rounded text-text-muted hover:text-text cursor-pointer shrink-0"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </Layout>
        </InvestigationProvider>
      </DensityProvider>
    </ThemeProvider>
  );
}

export default App;
