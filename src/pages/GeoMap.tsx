import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Globe as GlobeIcon, Shield, MapPin, Activity } from 'lucide-react';
import Globe from 'react-globe.gl';
import { WS_BASE_URL } from '../config';

interface ThreatHotspot {
  id: string;
  country: string;
  count: number;
  threatLevel: 'Critical' | 'High' | 'Medium';
  lat: number;
  lng: number;
}

const hotspots: ThreatHotspot[] = [
  { id: '1', country: 'United States', count: 1245, threatLevel: 'High', lat: 37.0902, lng: -95.7129 },
  { id: '2', country: 'China', count: 856, threatLevel: 'Critical', lat: 35.8617, lng: 104.1954 },
  { id: '3', country: 'Russia', count: 720, threatLevel: 'Critical', lat: 61.5240, lng: 105.3188 },
  { id: '4', country: 'Brazil', count: 432, threatLevel: 'Medium', lat: -14.2350, lng: -51.9253 },
  { id: '5', country: 'Germany', count: 312, threatLevel: 'High', lat: 51.1657, lng: 10.4515 },
  { id: '6', country: 'India', count: 215, threatLevel: 'Medium', lat: 20.5937, lng: 78.9629 },
];

const hasWebGL = () => {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
};

export const GeoMap: React.FC = () => {
  const [globeWidth, setGlobeWidth] = useState(800);
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>();
  const [arcs, setArcs] = useState<any[]>([]);

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        setGlobeWidth(entries[0].contentRect.width);
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  // Set initial point of view and enable auto-rotation
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2 });
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.5;
    }
  }, []);

  // Listen to WebSocket for live attacks to draw arcs
  useEffect(() => {
    const ws = new WebSocket(WS_BASE_URL);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_iocs') {
           // Simulate a live attack arc from a random hotspot to another
           const from = hotspots[Math.floor(Math.random() * hotspots.length)];
           const to = hotspots[Math.floor(Math.random() * hotspots.length)];
           if (from.id !== to.id) {
             const newArc = {
               startLat: from.lat,
               startLng: from.lng,
               endLat: to.lat,
               endLng: to.lng,
               color: from.threatLevel === 'Critical' ? '#ef4444' : '#3b82f6'
             };
             setArcs(prev => [...prev, newArc]);
             
             // Remove arc after 3 seconds
             setTimeout(() => {
               setArcs(prev => prev.filter(a => a !== newArc));
             }, 3000);
           }
        }
      } catch (err) {}
    };
    return () => ws.close();
  }, []);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <GlobeIcon className="text-primary" size={28} /> Live 3D Attack Globe
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
        <div className="lg:col-span-2 glass-panel relative overflow-hidden" ref={containerRef} style={{ minHeight: '550px', padding: 0 }}>
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-slate-950/80 backdrop-blur-md p-3 rounded-lg border border-white/10 shadow-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className="text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white">Live Infrastructure</span>
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

          <div className="w-full h-full bg-slate-950 flex items-center justify-center cursor-move">
            {hasWebGL() ? (
              <Globe
                ref={globeRef}
                width={globeWidth}
                height={550}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                labelsData={hotspots}
                labelLat={d => (d as ThreatHotspot).lat}
                labelLng={d => (d as ThreatHotspot).lng}
                labelText={d => (d as ThreatHotspot).country}
                labelSize={1.5}
                labelDotRadius={0.5}
                labelColor={d => (d as ThreatHotspot).threatLevel === 'Critical' ? '#ef4444' : (d as ThreatHotspot).threatLevel === 'High' ? '#eab308' : '#3b82f6'}
                labelResolution={2}
                
                arcsData={arcs}
                arcColor="color"
                arcDashLength={0.4}
                arcDashGap={0.2}
                arcDashAnimateTime={1000}
                arcStroke={0.5}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <GlobeIcon size={48} className="text-muted mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-white mb-2">WebGL Not Supported</h3>
                <p className="text-sm text-muted max-w-md">Your browser or device does not support WebGL, which is required to render the 3D Cyber Attack Globe. Please enable hardware acceleration or use a compatible browser.</p>
              </div>
            )}
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
