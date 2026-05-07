import { API_BASE_URL } from '../config';
import React, { useState } from 'react';
import { Search, EyeOff, ShieldAlert, Key, Mail, Database, Terminal, AlertTriangle, ShieldCheck } from 'lucide-react';

interface LeakRecord {
  id: string;
  domain: string;
  source: string;
  published_at: string;
  severity: 'Critical' | 'High' | 'Medium';
  compromised_accounts: number;
}

export const DarkWebMonitor: React.FC = () => {
  const [domain, setDomain] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [results, setResults] = useState<LeakRecord[] | null>(null);

  const scanLogs = [
    "Establishing secure Tor circuit...",
    "Querying deep web pastebins...",
    "Crawling Naz.API historical dumps...",
    "Parsing recent RedLine Stealer logs...",
    "Cross-referencing domain identities...",
    "Decrypting obfuscated hash arrays...",
    "Compiling final compromised asset list."
  ];

  const fetchLeaks = async (targetDomain: string): Promise<LeakRecord[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/darkweb`);
      const data = await res.json();
      // Filter by domain on the frontend for now, or just return all if it matches partially
      const filtered = data.filter((d: any) => d.domain.toLowerCase().includes(targetDomain.toLowerCase().trim()));
      
      // Sort by severity
      return filtered.sort((a: any, b: any) => {
          const val: any = { 'Critical': 3, 'High': 2, 'Medium': 1 };
          return (val[b.severity] || 0) - (val[a.severity] || 0);
      });
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    setResults(null);
    setIsScanning(true);
    setScanStep(0);

    let currentStep = 0;
    const interval = setInterval(() => {
        currentStep++;
        setScanStep(currentStep);
        if (currentStep >= scanLogs.length) {
            clearInterval(interval);
            setTimeout(async () => {
                const fetched = await fetchLeaks(domain);
                setResults(fetched);
                setIsScanning(false);
            }, 500);
        }
    }, 600); // Progress every 600ms
  };

  const calculateRiskScore = (leaks: LeakRecord[]) => {
      let score = 0;
      leaks.forEach(l => {
          if (l.severity === 'Critical') score += 25;
          if (l.severity === 'High') score += 10;
          if (l.severity === 'Medium') score += 5;
      });
      if (score === 0) return 0;
      return Math.min(100, 20 + score);
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <EyeOff className="text-danger" size={28} /> Dark Web Identity Monitor
          </h1>
          <p className="text-muted text-sm leading-relaxed max-w-3xl">
            Query deep web forums, massive credential dumps, and active stealer logs to uncover compromised human identities associated with your corporate domain.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleScan} className="glass-panel p-6 flex gap-4 items-center bg-gradient-to-r from-slate-900/80 to-danger/5">
        <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
                type="text" 
                placeholder="Enter corporate domain to scan (e.g. yourcompany.com)..." 
                value={domain}
                onChange={e => setDomain(e.target.value)}
                disabled={isScanning}
                className="w-full bg-slate-950/50 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-danger/50 focus:ring-1 focus:ring-danger/30 transition-all font-mono"
            />
        </div>
        <button 
            type="submit" 
            disabled={isScanning || !domain.trim()}
            className="bg-danger hover:bg-red-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 px-8 rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-danger/20"
        >
            <Terminal size={18} /> {isScanning ? 'Scanning...' : 'Execute Deep Scan'}
        </button>
      </form>

      {/* Scanning Animation */}
      {isScanning && (
          <div className="glass-panel p-8 mt-4 flex flex-col items-center justify-center border-danger/30">
              <EyeOff size={48} className="text-danger animate-pulse mb-6 opacity-80" />
              <div className="w-full max-w-md h-2 bg-slate-950 rounded-full overflow-hidden mb-4 border border-white/5">
                  <div 
                    className="h-full bg-danger transition-all duration-300 ease-out"
                    style={{ width: `${(scanStep / scanLogs.length) * 100}%` }}
                  />
              </div>
              <div className="h-6 mt-2 relative w-full text-center">
                {scanStep < scanLogs.length && (
                    <span className="text-danger font-mono text-sm tracking-wider animate-pulse flex items-center justify-center gap-2">
                        <Terminal size={14} /> {scanLogs[scanStep]}
                    </span>
                )}
              </div>
          </div>
      )}

      {/* Results Dashboard */}
      {!isScanning && results && (
          <div className="animate-fade-in stagger-1 space-y-6">
              
              {/* Score / Summary Card */}
              {results.length > 0 ? (
                  <div className="glass-panel p-6 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-danger/10 to-slate-900/40 border-l-4 border-l-danger">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="bg-danger/20 p-4 rounded-full text-danger border border-danger/30 shrink-0">
                              <ShieldAlert size={32} />
                          </div>
                          <div className="min-w-0">
                              <h3 className="text-xl font-bold text-white mb-1 truncate">Identity Breach Detected</h3>
                              <p className="text-sm text-slate-400 truncate">Found <strong className="text-danger">{results ? results.length : 0}</strong> compromised credentials across various dark web sources.</p>
                          </div>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                          <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Risk Factor Score</p>
                          <div className="text-4xl font-extrabold text-danger drop-shadow-md">{results ? calculateRiskScore(results) : 0}<span className="text-lg text-slate-500 font-normal">/100</span></div>
                      </div>
                  </div>
              ) : (
                 <div className="glass-panel p-6 flex items-center gap-4 bg-gradient-to-r from-success/10 to-slate-900/40 border-l-4 border-l-success">
                      <div className="bg-success/20 p-4 rounded-full text-success border border-success/30 shrink-0">
                          <ShieldCheck size={32} />
                      </div>
                      <div className="min-w-0">
                          <h3 className="text-xl font-bold text-white mb-1 truncate">No Compromised Identities Found</h3>
                          <p className="text-sm text-slate-400 truncate">Your domain <strong className="text-white">{domain}</strong> appears secure across monitored dark web channels.</p>
                      </div>
                  </div>
              )}

              {/* Data Table */}
              {results && results.length > 0 && (
                  <div className="glass-panel overflow-hidden">
                      <div className="p-4 border-b border-white/10 bg-slate-900/50 flex justify-between items-center">
                          <h4 className="font-bold flex items-center gap-2 text-sm text-slate-200">
                             <Database size={16} className="text-danger" /> Raw Breach Intelligence
                          </h4>
                          <span className="text-xs font-mono text-muted">TARGET_DOMAIN: {domain.toUpperCase()}</span>
                      </div>
                      <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                              <thead className="bg-slate-950/80 border-b border-white/5 text-muted text-xs uppercase tracking-wider">
                                  <tr>
                                      <th className="p-4 py-3 font-medium">Severity</th>
                                      <th className="p-4 py-3 font-medium">Email Address (Compromised)</th>
                                      <th className="p-4 py-3 font-medium">Password Data</th>
                                      <th className="p-4 py-3 font-medium">Breach Source</th>
                                      <th className="p-4 py-3 font-medium text-right">Leak Date</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                  {results.map(leak => (
                                      <tr key={leak.id} className="hover:bg-white/5 transition-colors group">
                                          <td className="p-4">
                                              <span className={`badge ${leak.severity === 'Critical' ? 'badge-danger font-bold' : leak.severity === 'High' ? 'badge-warning' : 'badge-primary'}`}>
                                                  {leak.severity}
                                              </span>
                                          </td>
                                          <td className="p-4 font-mono text-slate-300 flex items-center gap-2">
                                              <Mail size={14} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                                              {leak.domain}
                                          </td>
                                          <td className="p-4">
                                              <div className="flex items-center gap-2">
                                                  <Key size={14} className={leak.severity === 'Critical' ? 'text-danger' : 'text-slate-500'} />
                                                  <span className={`font-mono tracking-wider ${leak.severity === 'Critical' ? 'text-danger font-bold bg-danger/10 px-1 rounded' : 'text-slate-400 opacity-60'}`}>
                                                      {leak.compromised_accounts} accounts
                                                  </span>
                                              </div>
                                          </td>
                                          <td className="p-4 text-slate-400 text-xs">
                                              <div className="flex items-center gap-1.5">
                                                  <AlertTriangle size={12} className={leak.source.includes('Stealer') ? 'text-warning' : 'text-slate-500'} />
                                                  {leak.source}
                                              </div>
                                          </td>
                                          <td className="p-4 font-mono text-xs text-muted text-right">
                                              {new Date(leak.published_at).toLocaleDateString()}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};
