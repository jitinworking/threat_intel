import React, { useState } from 'react';
import { Crosshair, Server, Globe, Box, Plus, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { mockApts } from '../data/mockApts';

interface Asset {
  id: string;
  type: 'IP' | 'Domain' | 'Technology';
  value: string;
}

export const AttackSurface: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([
    { id: '1', type: 'Technology', value: 'Microsoft Exchange' },
    { id: '2', type: 'Technology', value: 'Atlassian Confluence' },
    { id: '3', type: 'IP', value: '198.51.100.24' },
    { id: '4', type: 'Domain', value: 'internal-portal.corp.local' }
  ]);
  const [newAssetType, setNewAssetType] = useState<'IP'|'Domain'|'Technology'>('Technology');
  const [newAssetValue, setNewAssetValue] = useState('');

  const addAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetValue.trim()) return;
    setAssets([...assets, { id: Math.random().toString(), type: newAssetType, value: newAssetValue }]);
    setNewAssetValue('');
  };

  const removeAsset = (id: string) => {
    setAssets(assets.filter(a => a.id !== id));
  };

  // Correlation Logic
  const calculateRisk = (asset: Asset) => {
    let risks: { apt: string, reason: string, level: string }[] = [];
    if (asset.type === 'Technology') {
      const valLower = asset.value.toLowerCase();
      // Tech matches APT targets or CVE descriptions (mocked)
      mockApts.forEach(apt => {
        if (
          apt.targets.some(t => t.toLowerCase().includes(valLower)) ||
          (valLower.includes('exchange') && apt.associatedCVEs?.includes('CVE-2021-26855')) ||
          (valLower.includes('confluence') && apt.associatedCVEs?.includes('CVE-2022-26134')) ||
          (valLower.includes('pulse') && apt.associatedCVEs?.includes('CVE-2019-11510')) ||
          (valLower.includes('pulse') && apt.associatedCVEs?.includes('CVE-2021-22893'))
        ) {
          risks.push({ apt: apt.name, reason: `Known exploitation of ${asset.value} infrastructure mapping to their TTPs`, level: apt.threatLevel || 'High' });
        }
      });
    } else {
      // For IPs/Domains, simulate random hits if it ends in certain strings
      if (asset.value.includes('corp.local')) {
        risks.push({ apt: 'Mustang Panda', reason: 'Domain pattern matches targeted sectors in recent campaigns', level: 'High' });
      }
      if (asset.value.includes('198.51')) {
        risks.push({ apt: 'Lazarus Group', reason: 'Asset subnet overlaps with historically tracked C2 beacons', level: 'Critical' });
      }
    }
    return risks;
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Attack Surface Management
          </h1>
          <p className="text-muted text-sm mt-1">Define your internal assets to auto-correlate against global APT campaigns.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 stagger-1">
        
        {/* Asset Definition Panel */}
        <div className="glass-panel p-6 lg:col-span-1 border-primary relative overflow-hidden h-fit">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Box size={18} /> Asset Inventory
          </h3>
          
          <form onSubmit={addAsset} className="mb-6 flex flex-col gap-3">
            <select 
              value={newAssetType} 
              onChange={e => setNewAssetType(e.target.value as any)}
              className="glass-panel px-3 py-2 text-sm text-white bg-slate-800 border-slate-700 outline-none w-full"
            >
              <option value="Technology">Software / Technology</option>
              <option value="IP">IP Address / Subnet</option>
              <option value="Domain">Domain / Hostname</option>
            </select>
            <div className="flex gap-2">
              <input 
                value={newAssetValue}
                onChange={e => setNewAssetValue(e.target.value)}
                placeholder="e.g. Microsoft Exchange"
                className="glass-panel px-3 py-2 text-sm flex-1 bg-slate-900/50 border-white/10 text-white outline-none"
              />
              <button type="submit" className="bg-primary/20 hover:bg-primary/40 text-primary p-2 rounded transition-colors border border-primary/30">
                <Plus size={18} />
              </button>
            </div>
          </form>

          <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
            {assets.map(asset => (
              <div key={asset.id} className="glass-panel p-3 flex justify-between items-center bg-slate-900/40 border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  {asset.type === 'IP' ? <Server size={14} className="text-cyan-400" /> : 
                   asset.type === 'Domain' ? <Globe size={14} className="text-purple-400" /> : 
                   <Box size={14} className="text-blue-400" />}
                  <div>
                    <p className="text-sm font-medium">{asset.value}</p>
                    <p className="text-[10px] text-muted uppercase tracking-wider">{asset.type}</p>
                  </div>
                </div>
                <button onClick={() => removeAsset(asset.id)} className="text-slate-500 hover:text-danger transition-colors p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Correlation Engine */}
        <div className="glass-panel p-6 lg:col-span-2 border-danger relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-400"></div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Crosshair size={18} className="text-danger" /> Active Threats Overview
            </h3>
            <span className="badge badge-danger px-3 py-1 animate-pulse">Live Correlation Active</span>
          </div>

          <div className="space-y-4">
            {assets.length === 0 ? (
              <div className="text-center py-10 text-muted">No assets defined. Add assets to see correlations.</div>
            ) : (
              assets.map(asset => {
                const risks = calculateRisk(asset);
                if (risks.length === 0) {
                  return (
                    <div key={asset.id} className="glass-panel p-4 border-l-4 border-success bg-slate-900/30">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm text-slate-300">{asset.value}</span>
                        <span className="flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-1 rounded"><ShieldCheck size={14} /> Secure</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={asset.id} className="glass-panel p-4 border-l-4 border-danger bg-red-950/20">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-sm text-white">{asset.value}</span>
                      <span className="flex items-center gap-1 text-xs text-danger bg-danger/10 px-2 py-1 border border-danger/20 rounded"><AlertTriangle size={14} /> Vulnerable</span>
                    </div>
                    <div className="space-y-2 pl-2 border-l border-white/10 ml-1">
                      {risks.map((risk, idx) => (
                        <div key={idx} className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-orange-400">{risk.apt}</span>
                            <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-muted">{risk.level} Threat</span>
                          </div>
                          <span className="text-xs text-slate-400">{risk.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
