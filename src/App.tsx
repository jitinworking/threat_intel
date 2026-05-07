import { WS_BASE_URL } from './config';
import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Bell, X, Zap } from 'lucide-react';
import { Layout } from './components/Layout';
import { ThemeProvider } from './context/ThemeContext';
import { NotebookProvider } from './context/NotebookContext';
import { Dashboard } from './pages/Dashboard';
import { IoCFeed } from './pages/IoCFeed';
import { CveFeed } from './pages/CveFeed';
import { GeoMap } from './pages/GeoMap';
import { HuntingHub } from './pages/HuntingHub';
import { AptGroups } from './pages/AptGroups';
import { Settings } from './pages/Settings';
import { MitreAttack } from './pages/MitreAttack';
import { NewsPortal } from './pages/NewsPortal';
import { ThreatGraph } from './pages/ThreatGraph';
import { AttackSurface } from './pages/AttackSurface';
import { BlastRadius } from './pages/BlastRadius';
import { AdversaryEmulation } from './pages/AdversaryEmulation';
import { ShadowMapper } from './pages/ShadowMapper';
import { RansomwareTracker } from './pages/RansomwareTracker';
import { DarkWebMonitor } from './pages/DarkWebMonitor';
import { Oracle } from './pages/Oracle';
import { PayloadAnalyzer } from './pages/PayloadAnalyzer';
import { Sandbox } from './pages/Sandbox';
import { CampaignTimeline } from './pages/CampaignTimeline';

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
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE_URL}`);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_iocs') {
          addToast({
            title: 'Threat Ingestion Update',
            message: `Successfully ingested ${data.data.count} new indicators of compromise.`,
            type: 'success',
            icon: <Zap size={16} className="text-success" />
          });
        } else if (data.type === 'alert') {
          addToast({
            title: `Threat Alert: ${data.data.severity.toUpperCase()}`,
            message: data.data.message,
            type: data.data.severity === 'critical' ? 'danger' : 'warning',
            icon: <AlertTriangle size={16} className={data.data.severity === 'critical' ? 'text-danger' : 'text-warning'} />
          });
        }
      } catch (err) {
        console.error('WS Error:', err);
      }
    };

    const handleTabChange = (e: any) => {
      if (e.detail) setActiveTab(e.detail);
    };
    window.addEventListener('changeTab', handleTabChange);

    return () => {
      ws.close();
      window.removeEventListener('changeTab', handleTabChange);
    };
  }, [addToast]);

  const renderContent = () => {
    console.log('Rendering tab:', activeTab);
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'ioc': return <IoCFeed />;
      case 'apt': return <AptGroups />;
      case 'graph': return <ThreatGraph />;
      case 'mitre': return <MitreAttack />;
      case 'asm': return <AttackSurface />;
      case 'darkweb': return <DarkWebMonitor />;
      case 'vulnerabilities': return <CveFeed />;
      case 'geomap': return <GeoMap />;
      case 'hunting': return <HuntingHub />;
      case 'blast-radius': return <BlastRadius />;
      case 'emulation': return <AdversaryEmulation />;
      case 'shadow-mapper': return <ShadowMapper />;
      case 'ransomware': return <RansomwareTracker />;
      case 'oracle': return <Oracle />;
      case 'analyzer': return <PayloadAnalyzer />;
      case 'news': return <NewsPortal />;
      case 'sandbox': return <Sandbox />;
      case 'campaigns': return <CampaignTimeline />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <ThemeProvider>
      <NotebookProvider>
        <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
          {renderContent()}
          
          {/* Toast Container */}
          <div className="toast-container">
            {toasts.map(toast => (
              <div key={toast.id} className={`toast toast-${toast.type}`}>
                <div className="flex items-start gap-3 w-full">
                  {toast.icon || <Bell size={16} className="text-primary" />}
                  <div className="toast-content">
                    <div className="toast-title">{toast.title}</div>
                    <div className="toast-message">{toast.message}</div>
                  </div>
                  <button onClick={() => removeToast(toast.id)} className="toast-close">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Layout>
      </NotebookProvider>
    </ThemeProvider>
  );
}

export default App;
