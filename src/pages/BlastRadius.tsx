import React, { useState } from 'react';
import { Target, ShieldAlert, Crosshair, Network, ArrowRight, Zap, Skull, Shield, Server, HardDrive } from 'lucide-react';

interface NetworkNode {
  id: string;
  name: string;
  type: 'router' | 'server' | 'database' | 'endpoint';
  vulnerable: boolean;
  compromised: boolean;
  x: number;
  y: number;
}

export const BlastRadius: React.FC = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);

  const startSimulation = () => {
    setIsSimulating(true);
    setSimulationStep(0);
    
    // Simulate propagation
    setTimeout(() => setSimulationStep(1), 1000); // Edge compromised
    setTimeout(() => setSimulationStep(2), 2500); // Lateral movement
    setTimeout(() => setSimulationStep(3), 4000); // Domain Admin compromised
    setTimeout(() => {
      setSimulationStep(4);
      setIsSimulating(false);
    }, 5500); // Full Blast Radius
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'router': return <Network size={24} />;
      case 'server': return <Server size={24} />;
      case 'database': return <HardDrive size={24} />;
      case 'endpoint': return <Target size={24} />;
      default: return <Server size={24} />;
    }
  };

  const nodes: NetworkNode[] = [
    { id: '1', name: 'DMZ Gateway', type: 'router', vulnerable: true, compromised: simulationStep >= 1, x: 10, y: 50 },
    { id: '2', name: 'Web Server 01', type: 'server', vulnerable: true, compromised: simulationStep >= 1, x: 30, y: 30 },
    { id: '3', name: 'Web Server 02', type: 'server', vulnerable: false, compromised: simulationStep >= 4, x: 30, y: 70 },
    { id: '4', name: 'App Server (Int)', type: 'server', vulnerable: true, compromised: simulationStep >= 2, x: 55, y: 50 },
    { id: '5', name: 'DB Cluster A', type: 'database', vulnerable: false, compromised: simulationStep >= 4, x: 80, y: 25 },
    { id: '6', name: 'DC-01 (Domain Controller)', type: 'server', vulnerable: true, compromised: simulationStep >= 3, x: 85, y: 75 },
  ];

  const connections = [
    { from: '1', to: '2' },
    { from: '1', to: '3' },
    { from: '2', to: '4' },
    { from: '3', to: '4' },
    { from: '4', to: '5' },
    { from: '4', to: '6' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <SparklesIcon /> Blast Radius Analyzer
          </h1>
          <p className="text-muted text-sm mt-1">Select a CVE or Attack Vector to auto-simulate lateral movement and visualize total network compromise.</p>
        </div>
        <button 
          onClick={startSimulation}
          disabled={isSimulating}
          className="px-4 py-2 bg-danger/20 hover:bg-danger/30 text-danger rounded border border-danger/30 text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isSimulating ? <RefreshIcon /> : <PlayIcon />}
          {isSimulating ? 'Simulating Propagation...' : 'Execute Exploit Simulation'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[600px]">
        {/* Sidebar Controls */}
        <div className="glass-panel p-6 flex flex-col gap-6 h-full">
          <div>
            <h3 className="text-sm font-bold text-white mb-4">Exploit Parameters</h3>
            <div className="flex flex-col gap-3">
              <label className="text-xs text-muted">Target Vulnerability</label>
              <select className="bg-slate-900 border border-white/10 rounded p-2 text-sm text-white outline-none w-full">
                <option>CVE-2023-23397 (Outlook EoP)</option>
                <option>CVE-2021-44228 (Log4Shell)</option>
                <option>ZeroLogon (CVE-2020-1472)</option>
              </select>
            </div>
            <div className="flex flex-col gap-3 mt-4">
              <label className="text-xs text-muted">Initial Access Point</label>
              <select className="bg-slate-900 border border-white/10 rounded p-2 text-sm text-white outline-none w-full">
                <option>DMZ Gateway (192.168.1.1)</option>
                <option>VPN Concentrator</option>
                <option>Phishing Payload (Endpoint)</option>
              </select>
            </div>
          </div>

          <div className="mt-auto border-t border-white/10 pt-4">
            <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Simulation Status</h3>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Total Nodes:</span>
                <span className="font-bold text-white">{nodes.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Vulnerable:</span>
                <span className="font-bold text-warning">{nodes.filter(n => n.vulnerable).length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Compromised:</span>
                <span className="font-bold text-danger">{nodes.filter(n => n.compromised).length}</span>
              </div>
              
              {simulationStep >= 4 && (
                <div className="mt-4 p-3 bg-danger/10 border border-danger/30 rounded text-xs text-danger font-bold text-center animate-pulse">
                  CRITICAL: Domain Controller Compromised. Network Lost.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Network Visualization */}
        <div className="lg:col-span-3 glass-panel relative overflow-hidden bg-slate-950/50">
          {/* Grid Background */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCBMIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIiAvPgo8L3N2Zz4=')] opacity-20"></div>

          {/* Connections (Lines) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {connections.map((conn, i) => {
              const sourceNode = nodes.find(n => n.id === conn.from);
              const targetNode = nodes.find(n => n.id === conn.to);
              if (!sourceNode || !targetNode) return null;

              const isCompromisedPath = sourceNode.compromised && targetNode.compromised;

              return (
                <line
                  key={i}
                  x1={`${sourceNode.x}%`}
                  y1={`${sourceNode.y}%`}
                  x2={`${targetNode.x}%`}
                  y2={`${targetNode.y}%`}
                  stroke={isCompromisedPath ? '#ef4444' : 'rgba(255,255,255,0.1)'}
                  strokeWidth="2"
                  strokeDasharray={isCompromisedPath ? "5,5" : "none"}
                  className={isCompromisedPath ? 'animate-pulse' : ''}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map(node => (
            <div
              key={node.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 transition-all duration-1000 ${
                node.compromised ? 'scale-110 z-10' : 'scale-100 z-0'
              }`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <div 
                className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-colors duration-500 shadow-lg ${
                  node.compromised 
                    ? 'bg-danger/20 border-danger text-danger shadow-danger/50' 
                    : node.vulnerable 
                      ? 'bg-warning/10 border-warning/50 text-warning' 
                      : 'bg-slate-900 border-white/20 text-slate-400'
                }`}
              >
                {node.compromised ? <Skull size={28} className="animate-pulse" /> : getIconForType(node.type)}
              </div>
              <div className="bg-slate-900 border border-white/10 px-3 py-1 rounded text-[10px] font-bold text-white shadow-lg whitespace-nowrap">
                {node.name}
              </div>
              
              {/* Ripple Effect for Compromised Nodes */}
              {node.compromised && (
                <div className="absolute inset-0 rounded-full border border-danger animate-ping opacity-50 w-16 h-16"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Internal icon helpers for cleaner code above
const SparklesIcon = () => <Zap size={28} className="text-warning" />;
const PlayIcon = () => <ArrowRight size={16} />;
const RefreshIcon = () => <Zap size={16} className="animate-pulse" />;
