import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, AlertCircle, Shield, Globe, Clock, Zap, Activity } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface SectorThreat {
  sector: string;
  probability: number;
  trend: 'up' | 'down' | 'stable';
  primaryActor: string;
}

export const Oracle: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [oracleData, setOracleData] = useState<any>(null);
  
  useEffect(() => {
    const fetchOracle = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/oracle/forecast`);
        if (res.ok) {
          const data = await res.json();
          setOracleData(data);
        }
      } catch (e) {
        console.error('Failed to fetch oracle data', e);
      } finally {
        setIsAnalyzing(false);
      }
    };

    fetchOracle();
    const interval = setInterval(fetchOracle, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-pulse">
        <Sparkles size={64} className="text-secondary mb-6 animate-spin-slow" />
        <h2 className="text-xl font-bold text-white mb-2">Engaging Oracle Forecasting Engine...</h2>
        <p className="text-muted text-sm font-mono">Calculating temporal threat density across global intelligence matrices</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Sparkles className="text-secondary" size={28} /> Threat Oracle
          </h1>
          <p className="text-muted text-sm leading-relaxed max-w-3xl">
            The Oracle leverages historical telemetry, recent IoC ingestion spikes, and OSINT urgency to forecast the <strong>Likelihood of Targeted Attack</strong> over the next 7 days.
          </p>
        </div>
        <div className="glass-panel px-4 py-2 border-secondary/20 flex items-center gap-3 h-fit">
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Analyzing Live Feed</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Forecast Graph */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col bg-gradient-to-br from-slate-900 to-secondary/5">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold flex items-center gap-2">
                    <TrendingUp size={18} className="text-secondary" /> 7-Day Targeted Likelihood
                </h3>
                <span className="text-[10px] text-muted font-mono uppercase">Window: March 21 - March 28</span>
            </div>
            
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <AreaChart data={oracleData?.forecastData || []}>
                        <defs>
                            <linearGradient id="colorLikelihood" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--secondary-color)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="var(--secondary-color)" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} unit="%" />
                        <Tooltip 
                            contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                            itemStyle={{ fontSize: '12px' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="likelihood" 
                            stroke="var(--secondary-color)" 
                            fillOpacity={1} 
                            fill="url(#colorLikelihood)" 
                            strokeWidth={3}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Situation Room */}
        <div className="glass-panel p-6 border-secondary/20 bg-secondary/5">
            <h3 className="font-bold mb-4 flex items-center gap-2">
                <Shield size={18} className="text-secondary" /> Predictive Alert Matrix
            </h3>
            <div className="space-y-4">
                {(oracleData?.sectorThreats || []).slice(0, 3).map((threat: SectorThreat, idx: number) => (
                    <div key={idx} className="p-4 bg-slate-950/50 rounded-lg border border-white/5 relative overflow-hidden group">
                        <div className={`absolute top-0 left-0 w-1 h-full ${threat.probability > 70 ? 'bg-danger' : 'bg-warning'}`} />
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-muted uppercase tracking-wider">{threat.sector}</span>
                            <div className={`text-xs font-bold ${threat.trend === 'up' ? 'text-danger' : threat.trend === 'down' ? 'text-green-500' : 'text-slate-500'} flex items-center gap-1`}>
                                {threat.trend === 'up' ? '▲ INC' : threat.trend === 'down' ? '▼ DEC' : '− STB'}
                            </div>
                        </div>
                        <div className="text-2xl font-bold mb-1 flex items-baseline gap-1">
                            {threat.probability}<span className="text-xs text-muted font-normal">% Likelihood</span>
                        </div>
                        <div className="text-[10px] text-slate-400 italic">
                            Primary Correlation: <span className="text-white">{threat.primaryActor}</span>
                        </div>
                        <button className="mt-3 w-full py-1.5 bg-secondary/10 hover:bg-secondary/20 text-secondary text-[10px] font-bold rounded border border-secondary/20 transition-all uppercase tracking-widest opacity-0 group-hover:opacity-100">
                            Deep Dive Analysis
                        </button>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Temporal Density Factors */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-panel p-4 flex items-center gap-4 bg-slate-900/50">
              <div className="bg-blue-500/20 p-3 rounded-lg text-blue-400">
                  <Globe size={20} />
              </div>
              <div>
                  <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Geopolitical Urgency</div>
                  <div className="text-lg font-bold">High (8.4)</div>
              </div>
          </div>
          <div className="glass-panel p-4 flex items-center gap-4 bg-slate-900/50">
              <div className="bg-danger/20 p-3 rounded-lg text-danger">
                  <Activity size={20} />
              </div>
              <div>
                  <div className="text-[10px] text-muted uppercase font-bold tracking-wider">IoC Spike Velocity</div>
                  <div className="text-lg font-bold">{oracleData?.velocity ? `+${(parseFloat(oracleData.velocity) * 100).toFixed(0)}%` : 'Checking...'}</div>
              </div>
          </div>
          <div className="glass-panel p-4 flex items-center gap-4 bg-slate-900/50">
              <div className="bg-warning/20 p-3 rounded-lg text-warning">
                  <Clock size={20} />
              </div>
              <div>
                  <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Avg. Exploit Window</div>
                  <div className="text-lg font-bold">14.2 Hours</div>
              </div>
          </div>
          <div className="glass-panel p-4 flex items-center gap-4 bg-slate-900/50">
              <div className="bg-secondary/20 p-3 rounded-lg text-secondary">
                  <Zap size={20} />
              </div>
              <div>
                  <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Forecasting Alpha</div>
                  <div className="text-lg font-bold">v1.2.9-stable</div>
              </div>
          </div>
      </div>

      {/* Bottom Insights */}
      <div className="glass-panel p-6 border-l-4 border-l-secondary">
          <h4 className="font-bold flex items-center gap-2 mb-2">
              <AlertCircle size={18} className="text-secondary" /> Executive Forecasting Summary
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed">
            {oracleData?.summary || 'The Oracle is analyzing incoming telemetry clusters for potential threat vectors...'} Forecast peak activity window in <strong>48-72 hours</strong> based on current IoC velocity of <strong>{oracleData?.velocity || '1.00'}x</strong> baseline.
          </p>
      </div>

    </div>
  );
};
