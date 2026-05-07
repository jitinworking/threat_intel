import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Newspaper, Globe, Building2, Server, Filter, Search, Skull } from 'lucide-react';

interface LeakItem {
  id: string;
  actor: string;
  victim: string;
  industry: string;
  revenue: string;
  dataSize: string;
  publishedAt: string;
  description: string;
  status: 'Published' | 'Negotiating' | 'Countdown';
  countdown?: string;
}

export const RansomwareTracker: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [leaks, setLeaks] = useState<LeakItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/ransomware`)
      .then(r => r.json())
      .then(data => {
        const mapped = data.map((l: any) => ({
          id: l.id.toString(),
          actor: l.group_name,
          victim: l.victim_name,
          industry: 'Unknown', // Fallback for DB fields not yet added
          revenue: 'N/A',
          dataSize: 'Unknown',
          publishedAt: l.published_at || 'Recently',
          description: l.description,
          status: 'Published'
        }));
        setLeaks(mapped);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch ransomware leaks', err);
        setLoading(false);
      });
  }, []);

  const filteredLeaks = leaks.filter(l => 
    l.victim.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-danger">
            <Newspaper size={28} /> Ransomware Leak Site Tracker
          </h1>
          <p className="text-muted text-sm mt-1">Real-time monitoring of Double Extortion groups, Dark Web leak sites, and victim data dumps.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        
        {/* Left Stats Sidebar */}
        <div className="glass-panel p-6 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar">
          <div>
            <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Active Threat Groups</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded border border-white/5">
                <span className="text-sm font-bold text-danger">LockBit 3.0</span>
                <span className="badge badge-danger">412 Victims</span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded border border-white/5">
                <span className="text-sm font-bold text-warning">ALPHV (BlackCat)</span>
                <span className="badge badge-warning">284 Victims</span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded border border-white/5">
                <span className="text-sm font-bold text-orange-400">Play</span>
                <span className="badge border-orange-500/30 text-orange-400">156 Victims</span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded border border-white/5">
                <span className="text-sm font-bold text-slate-300">RansomHub</span>
                <span className="badge border-white/20 text-muted">98 Victims</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Targeted Industries (30d)</h3>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs"><span>Manufacturing</span><span>28%</span></div>
                <div className="w-full bg-slate-900 rounded-full h-1.5"><div className="bg-danger h-1.5 rounded-full w-[28%]"></div></div>
              </div>
              <div className="flex flex-col gap-1 mt-2">
                <div className="flex justify-between text-xs"><span>Healthcare</span><span>22%</span></div>
                <div className="w-full bg-slate-900 rounded-full h-1.5"><div className="bg-warning h-1.5 rounded-full w-[22%]"></div></div>
              </div>
              <div className="flex flex-col gap-1 mt-2">
                <div className="flex justify-between text-xs"><span>IT Services</span><span>18%</span></div>
                <div className="w-full bg-slate-900 rounded-full h-1.5"><div className="bg-blue-400 h-1.5 rounded-full w-[18%]"></div></div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Feed */}
        <div className="lg:col-span-3 glass-panel border-white/10 flex flex-col h-full">
          <div className="p-4 border-b border-white/10 flex gap-4 bg-slate-900/50">
            <div className="flex-1 bg-slate-950 border border-white/10 rounded-lg p-2 flex items-center gap-3">
              <Search size={16} className="text-muted ml-2" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search victims, groups, or industries..." 
                className="bg-transparent border-none text-sm text-white outline-none w-full"
              />
            </div>
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded border border-white/10 text-sm flex items-center gap-2">
              <Filter size={16} /> Filters
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
            {filteredLeaks.map(leak => (
              <div key={leak.id} className="bg-slate-950/80 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
                <div className="flex justify-between items-start mb-4 gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-danger/10 border border-danger/20 flex items-center justify-center text-danger shrink-0">
                      <Skull size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white leading-tight truncate">{leak.victim}</h3>
                      <div className="flex items-center gap-2 text-xs mt-1">
                        <span className="text-danger font-bold shrink-0">{leak.actor}</span>
                        <span className="text-muted shrink-0">•</span>
                        <span className="text-slate-400 truncate">{leak.publishedAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {leak.status === 'Published' && <span className="badge badge-danger">Data Published</span>}
                    {leak.status === 'Negotiating' && <span className="badge badge-warning animate-pulse">Negotiating</span>}
                    {leak.status === 'Countdown' && <span className="badge border-orange-500/50 text-orange-400">Countdown: {leak.countdown}</span>}
                  </div>
                </div>

                <p className="text-sm text-slate-300 mb-4">{leak.description}</p>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/5 pt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400 min-w-0">
                    <Building2 size={14} className="text-muted shrink-0" /> <span className="truncate">{leak.industry}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 min-w-0">
                    <Globe size={14} className="text-muted shrink-0" /> <span className="truncate">Rev: {leak.revenue}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 min-w-0">
                    <Server size={14} className="text-muted shrink-0" /> <span className="truncate">Stolen: {leak.dataSize}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
