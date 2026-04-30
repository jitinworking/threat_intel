import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Shield, Activity, AlertTriangle, RefreshCw, Rss, Zap, Database, Sparkles, TrendingUp, ShieldAlert, Tag } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const BACKEND = `${API_BASE_URL}`;

interface Stats {
  totalIocs: number;
  bySource: { source: string; count: number }[];
  byType: { ioc_type: string; count: number }[];
  recent24h: number;
  feeds: { name: string; enabled: number; last_polled: string }[];
}

interface TrendPoint {
  name: string;
  threats: number;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [recentIocs, setRecentIocs] = useState<any[]>([]);
  const [, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const [statsRes, iocsRes, trendRes] = await Promise.all([
        fetch(`${BACKEND}/api/stats`),
        fetch(`${BACKEND}/api/iocs?limit=8`),
        fetch(`${BACKEND}/api/stats/trend`),
      ]);
      const statsJson = await statsRes.json();
      const iocsJson = await iocsRes.json();
      const trendJson = await trendRes.json();
      
      setStats(statsJson);
      setRecentIocs(iocsJson.iocs || []);
      setTrendData(trendJson);
    } catch (e) {
      console.warn('Backend not available, showing defaults');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Threat Dashboard</h1>
          <p className="text-muted text-sm mt-1">Real-time overview of global cyber threats and IoCs.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge badge-success" style={{ fontSize: '11px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success-color)', display: 'inline-block', marginRight: 6, animation: 'pulse 2s infinite' }}></span>
            Live Data
          </span>
        </div>
      </div>

      {/* 7-Day Oracle Forecast Bar */}
      <div className="glass-panel p-4 flex items-center justify-between bg-gradient-to-r from-secondary/20 to-slate-900 border-l-4 border-l-secondary stagger-0">
        <div className="flex items-center gap-4">
          <div className="bg-secondary/20 p-2 rounded-lg text-secondary">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-secondary">7-Day Threat Oracle</div>
            <div className="text-sm font-medium text-white">Targeted Likelihood: <span className="text-secondary font-bold">82%</span> (Finance/MSPs)</div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <div className="text-[10px] text-muted uppercase font-bold tracking-tighter">Current Velocity</div>
            <div className="text-xs font-mono text-danger flex items-center gap-1"><TrendingUp size={10} /> +124% Spike</div>
          </div>
          <button className="bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 px-3 py-1.5 rounded text-xs font-bold transition-all">
            Open Oracle
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-1">
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-1">Total Indicators</p>
              <p className="text-3xl font-bold tracking-tight">{stats ? stats.totalIocs.toLocaleString() : '—'}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <Database size={20} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4">
            <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">+{stats?.recent24h || 0}</span>
            <span className="text-[10px] text-muted uppercase font-bold tracking-tighter">Last 24h</span>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-1">Active Feeds</p>
              <p className="text-3xl font-bold tracking-tight">{stats?.feeds?.filter((f: any) => f.enabled).length || 0}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-success/10 text-success">
              <Rss size={20} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4">
            <span className="text-[10px] text-muted uppercase font-bold tracking-tighter">Polling every 5 minutes</span>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-1">Feed Sources</p>
              <p className="text-3xl font-bold tracking-tight">{stats?.bySource?.length || 0}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-purple/10 text-purple">
              <Zap size={20} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4">
            <span className="text-[10px] text-muted uppercase font-bold tracking-tighter">Real-time Ingestion</span>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-1">Threat Types</p>
              <p className="text-3xl font-bold tracking-tight">{stats?.byType?.length || 0}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-danger/10 text-danger">
              <Shield size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 border-l-4 border-l-warning stagger-2">
        <div className="flex justify-between items-center mb-6">
          <h2 className="card-title mb-0"><ShieldAlert size={18} className="text-warning" /> Vulnerability Watch (NVD)</h2>
          <button onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'vulnerabilities' }))} className="text-xs text-primary hover:underline font-bold">View All CVEs</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'CVE-2024-21413', score: 9.8, desc: 'Outlook Remote Code Execution', vendor: 'Microsoft' },
            { id: 'CVE-2023-7028', score: 10.0, desc: 'GitLab Account Takeover', vendor: 'GitLab' },
            { id: 'CVE-2024-21351', score: 7.6, desc: 'SmartScreen Bypass', vendor: 'Microsoft' }
          ].map((cve) => (
            <div key={cve.id} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-warning/30 transition-all group">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-bold text-white group-hover:text-warning transition-colors">{cve.id}</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${cve.score >= 9 ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'}`}>{cve.score}</span>
              </div>
              <p className="text-[11px] text-muted line-clamp-1 mb-2">{cve.desc}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-muted font-bold uppercase tracking-widest" style={{ opacity: 0.7 }}>
                <Tag size={10} /> {cve.vendor}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Source Breakdown + Chart */}
      <div className="grid grid-cols-2 gap-6">
        <div className="glass-panel p-6 stagger-2">
          <h2 className="card-title"><Activity size={18} /> Source Breakdown</h2>
          <div className="flex col gap-3" style={{ flexDirection: 'column' }}>
            {stats?.bySource?.sort((a: any, b: any) => b.count - a.count).slice(0, 8).map((s: any) => (
              <div key={s.source} className="flex items-center justify-between">
                <span className="text-sm">{s.source}</span>
                <div className="flex items-center gap-3">
                  <div style={{ width: '120px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (s.count / (stats?.totalIocs || 1)) * 100 * 5)}%`, height: '100%', background: 'var(--primary-color)', borderRadius: '3px' }}></div>
                  </div>
                  <span className="text-xs text-muted" style={{ minWidth: '50px', textAlign: 'right' }}>{s.count.toLocaleString()}</span>
                </div>
              </div>
            ))}
            {(!stats?.bySource || stats?.bySource.length === 0) && (
              <p className="text-sm text-muted">Start the backend to see stats: <code>node server/index.js</code></p>
            )}
          </div>
        </div>

        <div className="glass-panel p-6 stagger-3">
          <h2 className="card-title"><AlertTriangle size={18} /> Global Threat Activity</h2>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }} />
                <Area type="monotone" dataKey="threats" stroke="var(--primary-color)" strokeWidth={2} fillOpacity={1} fill="url(#colorThreats)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent IoCs Live Ticker */}
      <div className="glass-panel p-6 stagger-4">
        <h2 className="card-title"><RefreshCw size={18} /> Latest Ingested Indicators</h2>
        <div className="flex col gap-2" style={{ flexDirection: 'column' }}>
          {recentIocs.length > 0 ? recentIocs.map((ioc: any) => (
            <div key={ioc.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-3">
                <span className={`badge ${ioc.source === 'ThreatFox' ? 'badge-danger' : ioc.source === 'URLhaus' ? 'badge-warning' : ioc.source === 'Feodo Tracker' ? 'badge-purple' : 'badge-primary'}`} style={{ fontSize: '9px' }}>{ioc.source}</span>
                <span className="text-sm font-mono text-danger" style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ioc.ioc}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted">{ioc.ioc_type}</span>
                <span className="text-xs text-muted">{ioc.malware_printable || '—'}</span>
              </div>
            </div>
          )) : (
            <p className="text-sm text-muted">No data yet. Start the backend server to begin ingesting feeds.</p>
          )}
        </div>
      </div>
    </div>
  );
};
