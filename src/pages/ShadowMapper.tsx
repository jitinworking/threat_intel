import React, { useState } from 'react';
import { Network, Search, Globe, Shield, RefreshCw, AlertTriangle, Link } from 'lucide-react';

export const ShadowMapper: React.FC = () => {
  const [seed, setSeed] = useState('');
  const [isMapping, setIsMapping] = useState(false);
  const [mapResult, setMapResult] = useState<any>(null);

  const startMapping = () => {
    if (!seed.trim()) return;
    setIsMapping(true);
    setMapResult(null);

    // Simulate mapping process
    setTimeout(() => {
      setMapResult({
        root: seed,
        nodes: [
          { type: 'domain', value: seed, label: 'Root Target' },
          { type: 'ip', value: '104.21.44.12', label: 'A Record (Cloudflare)' },
          { type: 'ip', value: '185.199.108.153', label: 'Historical IP' },
          { type: 'ssl', value: 'JARM: 29d29d15d29d29d00029d29d29d29d...', label: 'SSL Certificate Match' },
          { type: 'domain', value: 'malicious-phish.net', label: 'Shared JARM Domain' },
          { type: 'domain', value: 'secure-login-portal.com', label: 'Shared JARM Domain' }
        ],
        edges: [
          { from: 0, to: 1, label: 'Resolves To' },
          { from: 0, to: 2, label: 'Historical' },
          { from: 2, to: 3, label: 'Hosted Cert' },
          { from: 3, to: 4, label: 'JARM Match' },
          { from: 3, to: 5, label: 'JARM Match' }
        ]
      });
      setIsMapping(false);
    }, 3000);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Network className="text-primary" size={28} /> Shadow Mapper (Automated Pivoting)
          </h1>
          <p className="text-muted text-sm mt-1">Input a seed IP or Domain. The system will auto-pivot through WHOIS, passive DNS, and JARM signatures to reveal hidden infrastructure.</p>
        </div>
      </div>

      <div className="glass-panel p-6 border-white/10 flex flex-col gap-6 flex-1 min-h-[600px]">
        {/* Search Bar */}
        <div className="flex gap-4">
          <div className="flex-1 bg-slate-900 border border-white/10 rounded-lg p-3 flex items-center gap-3 min-w-0">
            <Globe size={18} className="text-muted shrink-0" />
            <input 
              type="text" 
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Enter seed indicator (e.g., threat-actor.net, 192.168.1.1)..." 
              className="bg-transparent border-none text-sm text-white outline-none w-full flex-1 min-w-0 placeholder-slate-500"
            />
          </div>
          <button 
            onClick={startMapping}
            disabled={isMapping || !seed.trim()}
            className="px-6 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded border border-primary/30 font-bold transition-all disabled:opacity-50 flex items-center gap-2 shrink-0 whitespace-nowrap"
          >
            {isMapping ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
            {isMapping ? 'Pivoting...' : 'Map Infrastructure'}
          </button>
        </div>

        {/* Map Visualization Area */}
        <div className="flex-1 bg-slate-950/50 border border-white/10 rounded-lg relative overflow-hidden flex flex-col">
          {!mapResult && !isMapping && (
            <div className="flex-1 flex flex-col items-center justify-center text-muted opacity-50 select-none">
              <Network size={48} className="mb-4" />
              <p>Awaiting seed indicator to begin recursive infrastructure mapping.</p>
            </div>
          )}

          {isMapping && (
            <div className="flex-1 flex flex-col items-center justify-center text-primary">
              <RefreshCw size={48} className="mb-4 animate-spin" />
              <p className="animate-pulse">Scraping Passive DNS and JARM signatures...</p>
            </div>
          )}

          {mapResult && (
            <div className="flex-1 p-6 flex items-center justify-center relative">
              {/* This is a CSS-based mock visualization of a node graph */}
              <div className="flex items-center gap-12">
                {/* Root Node */}
                <div className="flex flex-col items-center gap-2 z-10">
                  <div className="w-16 h-16 rounded-full bg-danger/20 border-2 border-danger text-danger flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                    <Globe size={28} />
                  </div>
                  <div className="bg-slate-900 border border-white/10 px-3 py-1 rounded text-xs font-bold text-white shadow-lg text-center">
                    {mapResult.nodes[0].value}
                    <div className="text-[10px] text-danger mt-1">SEED</div>
                  </div>
                </div>

                <Link size={24} className="text-slate-500 z-0 opacity-50" />

                {/* Level 1 Nodes */}
                <div className="flex flex-col gap-12 z-10">
                  {mapResult.nodes.slice(1, 3).map((node: any, i: number) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary text-primary flex items-center justify-center">
                        <Shield size={20} />
                      </div>
                      <div className="bg-slate-900 border border-white/10 px-2 py-1 rounded text-[10px] font-bold text-white text-center">
                        {node.value}
                        <div className="text-[9px] text-primary mt-1 uppercase">{node.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <Link size={24} className="text-slate-500 z-0 opacity-50" />

                {/* Level 2 Nodes (JARM Pivot) */}
                <div className="flex flex-col items-center gap-2 z-10">
                  <div className="w-14 h-14 rounded-full bg-warning/20 border-2 border-warning text-warning flex items-center justify-center">
                    <AlertTriangle size={24} />
                  </div>
                  <div className="bg-slate-900 border border-white/10 px-3 py-1 rounded text-xs font-bold text-white text-center max-w-[150px] truncate">
                    {mapResult.nodes[3].value}
                    <div className="text-[10px] text-warning mt-1">JARM FINGERPRINT</div>
                  </div>
                </div>

                <Link size={24} className="text-slate-500 z-0 opacity-50" />

                {/* Level 3 Nodes (Hidden Infrastructure) */}
                <div className="flex flex-col gap-8 z-10">
                  {mapResult.nodes.slice(4).map((node: any, i: number) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-danger/20 border-2 border-danger text-danger flex items-center justify-center animate-pulse">
                        <Globe size={20} />
                      </div>
                      <div className="bg-slate-900 border border-white/10 px-2 py-1 rounded text-[10px] font-bold text-white text-center">
                        {node.value}
                        <div className="text-[9px] text-danger mt-1 uppercase">{node.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
