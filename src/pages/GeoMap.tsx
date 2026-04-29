import React from 'react';
import { Globe, Shield, MapPin, Activity } from 'lucide-react';

interface ThreatHotspot {
  id: string;
  country: string;
  count: number;
  threatLevel: 'Critical' | 'High' | 'Medium';
  x: number; // Percent from left
  y: number; // Percent from top
}

const hotspots: ThreatHotspot[] = [
  { id: '1', country: 'United States', count: 1245, threatLevel: 'High', x: 18, y: 35 },
  { id: '2', country: 'China', count: 856, threatLevel: 'Critical', x: 78, y: 42 },
  { id: '3', country: 'Russia', count: 720, threatLevel: 'Critical', x: 72, y: 25 },
  { id: '4', country: 'Brazil', count: 432, threatLevel: 'Medium', x: 32, y: 68 },
  { id: '5', country: 'Germany', count: 312, threatLevel: 'High', x: 48, y: 30 },
  { id: '6', country: 'India', count: 215, threatLevel: 'Medium', x: 68, y: 52 },
];

export const GeoMap: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Globe className="text-primary" size={28} /> Geo-Threat Intelligence
          </h1>
          <p className="text-muted text-sm mt-1">Live visualization of global threat infrastructure and active hotspots.</p>
        </div>
        <div className="flex gap-2">
           <div className="badge badge-primary px-3 py-1 flex items-center gap-2">
              <Activity size={12} className="animate-pulse" /> 12 Active Campaigns
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* The Map Component */}
        <div className="lg:col-span-2 glass-panel p-4 relative overflow-hidden" style={{ minHeight: '450px' }}>
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-slate-950/80 backdrop-blur-md p-3 rounded-lg border border-white/10 shadow-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className="text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white">Heatmap Overlay</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-danger animate-pulse"></div>
                  <span className="text-[9px] text-muted font-bold">CRITICAL ORIGIN</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-warning"></div>
                  <span className="text-[9px] text-muted font-bold">HIGH FREQUENCY</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-[9px] text-muted font-bold">ACTIVE SCANNING</span>
                </div>
              </div>
            </div>
          </div>

          {/* SVG World Map Mockup */}
          {/* In a real app, I'd use a GeoJSON TopoJSON SVG. Here I'll use a stylized abstract dots map for that 'analyst' look. */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
             <Globe size={400} strokeWidth={0.5} className="text-slate-500" />
          </div>

          <div className="relative w-full h-full border border-white/5 rounded-xl bg-slate-950/40 p-4 overflow-hidden">
             {/* Abstract Grid background */}
             <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
             
             {/* Placement of Hotspots */}
             {hotspots.map((spot) => (
                <div 
                  key={spot.id}
                  className="absolute cursor-pointer group"
                  style={{ left: `${spot.x}%`, top: `${spot.y}%`, transform: 'translate(-50%, -50%)', pointerEvents: 'auto' }}
                >
                  <div className={`relative flex items-center justify-center`}>
                    <div className={`absolute w-8 h-8 rounded-full ${spot.threatLevel === 'Critical' ? 'bg-danger/20' : spot.threatLevel === 'High' ? 'bg-warning/20' : 'bg-primary/20'} animate-ping`}></div>
                    <div className={`relative w-3 h-3 rounded-full border-2 border-white shadow-lg ${spot.threatLevel === 'Critical' ? 'bg-danger' : spot.threatLevel === 'High' ? 'bg-warning' : 'bg-primary'}`}></div>
                  </div>
                  
                  {/* Tooltip on Hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    <div className="bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-white/20 shadow-xl text-center">
                      <div className="text-xs font-bold text-white">{spot.country}</div>
                      <div className="text-[10px] text-muted mt-0.5">{spot.count.toLocaleString()} Active IoCs</div>
                    </div>
                  </div>
                </div>
             ))}
             
             {/* Decorative Elements */}
             <div className="absolute bottom-4 right-4 text-[10px] font-mono text-muted/50 flex flex-col items-end">
                <span>LAT: 40.7128° N</span>
                <span>LNG: 74.0060° W</span>
                <span className="text-primary mt-1">Live Tracking Active...</span>
             </div>
          </div>
        </div>

        {/* Legend / Stats Side */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6">
            <h3 className="card-title text-sm"><MapPin size={16} /> Top Origins</h3>
            <div className="flex flex-col gap-4 mt-4">
              {hotspots.map((spot) => (
                <div key={spot.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-1 h-8 rounded-full ${spot.threatLevel === 'Critical' ? 'bg-danger' : spot.threatLevel === 'High' ? 'bg-warning' : 'bg-primary'}`}></div>
                    <div>
                      <div className="text-sm font-bold text-white">{spot.country}</div>
                      <div className="text-[10px] text-muted uppercase font-bold tracking-tighter">Velocity: +12%</div>
                    </div>
                  </div>
                  <span className="text-sm font-mono font-bold text-slate-300">{spot.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-white">Infrastructure Density</h3>
            </div>
            <div className="p-4 bg-slate-900/50 rounded-lg border border-white/5 flex flex-col gap-2">
              <div className="flex justify-between text-xs text-muted">
                <span>Botnet C2</span>
                <span className="text-white">42%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                 <div className="h-full bg-primary" style={{ width: '42%' }}></div>
              </div>
              <div className="flex justify-between text-xs text-muted mt-2">
                <span>Exfiltration Nodes</span>
                <span className="text-white">18%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                 <div className="h-full bg-secondary" style={{ width: '18%' }}></div>
              </div>
            </div>
            <button className="w-full mt-4 py-2 px-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-xs font-bold text-primary transition-all">
               Analyze Nodes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
