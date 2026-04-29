import { API_BASE_URL, WS_BASE_URL } from '../config';
import React, { useState } from 'react';
import { MapPin, Code, Search, Shield, ChevronRight, X, Target, Copy, Check, Terminal, Activity, Globe } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

import { mockApts, type AptGroup } from '../data/mockApts';

export const AptGroups: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApt, setSelectedApt] = useState<AptGroup | null>(null);
  const [copiedRule, setCopiedRule] = useState<'sigma' | 'yara' | null>(null);
  const [localCorrelations, setLocalCorrelations] = useState<Record<string, number>>({});

  React.useEffect(() => {
    const fetchCorrelations = async () => {
      const counts: Record<string, number> = {};
      for (const apt of mockApts) {
        try {
          // Search for any of the malware families in our local DB
          const searchPromises = apt.malware.slice(0, 2).map(mw => 
            fetch(`${API_BASE_URL}/api/iocs?search=${encodeURIComponent(mw)}&limit=1`)
              .then(r => r.json())
          );
          const results = await Promise.all(searchPromises);
          const total = results.reduce((acc, r) => acc + (r.total || 0), 0);
          counts[apt.id] = total;
        } catch (e) {
          counts[apt.id] = 0;
        }
      }
      setLocalCorrelations(counts);
    };
    fetchCorrelations();
  }, []);

  const generateAdvancedRules = (apt: AptGroup) => {
    let sigma = '';
    let yara = '';

    if (apt.name === 'Mustang Panda' || apt.origin === 'China') {
      sigma = `title: Detect DLL Side-Loading (Mustang Panda / PlugX activity)
id: 5b355204-a627-4144-8d48-392cbb41a7d6
status: experimental
description: Detects legitimate applications loading unsigned DLLs, a technique heavily favored by Chinese APTs like Mustang Panda for PlugX.
logsource:
    category: process_creation
    product: windows
detection:
    selection:
        EventID: 1
        Image|endswith:
            - '\\avupdate.exe'
            - '\\chrome_frame_helper.exe'
            - '\\mscorsvw.exe'
    filter:
        CommandLine|contains: ' '
    condition: selection and not filter
falsepositives:
    - Legitimate software updates
level: high`;

      yara = `rule APT_China_PlugX {
    meta:
        description = "Detects PlugX memory signatures deployed by China-based actors"
        author = "ThreatIntel Dashboard"
        date = "2026-03-21"
    strings:
        $header = { 50 4C 55 47 } // "PLUG"
        $s1 = "10.0.0.1" ascii
        $s2 = "X-L1-" ascii
        $s3 = "SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run" wide
    condition:
        uint16(0) == 0x5a4d and ($header at 0) or 2 of ($s*)
}`;
    } else if (apt.origin === 'Pakistan') {
      sigma = `title: Detect Malicious Macro Dropping RATs (Pakistan APTs)
id: 9a744211-1d57-4560-8a2b-1033b0ec89b3
status: experimental
description: Detects Microsoft Office products spawning command interpreters or mshta.exe, typical of Transparent Tribe and SideCopy.
logsource:
    category: process_creation
    product: windows
detection:
    selection:
        ParentImage|endswith:
            - '\\winword.exe'
            - '\\excel.exe'
            - '\\powerpnt.exe'
        Image|endswith:
            - '\\cmd.exe'
            - '\\powershell.exe'
            - '\\mshta.exe'
            - '\\wscript.exe'
    condition: selection
falsepositives:
    - Unknown/Legacy macro processes
level: critical`;

      yara = `rule APT_Pakistan_CrimsonRAT {
    meta:
        description = "Detects CrimsonRAT used by Transparent Tribe"
        author = "ThreatIntel Dashboard"
        date = "2026-03-21"
    strings:
        $s1 = "Crimson RAT" ascii nocase
        $s2 = "systemDrive\\\\Intel\\\\keylogger.txt" wide
        $s3 = "SELECT * FROM Win32_OperatingSystem" wide
        $s4 = "c:\\\\users\\\\public\\\\" ascii nocase
    condition:
        uint16(0) == 0x5a4d and 3 of ($s*)
}`;
    } else {
      sigma = `title: Generic APT Suspicious Process Activity
id: ${Math.random().toString(36).substr(2, 9)}
status: experimental
description: Detects suspicious process anomalies correlated with ${apt.name}.
logsource:
    category: process_creation
    product: windows
detection:
    selection:
        ParentImage|endswith: 
            - '\\services.exe'
        Image|endswith:
            - '\\cmd.exe'
            - '\\powershell.exe'
    condition: selection
level: high`;

      yara = `rule APT_${apt.name.replace(/\s+/g, '')}_Generic {
    meta:
        description = "Generic YARA signature tracking ${apt.name} malware families."
        author = "ThreatIntel Dashboard"
    strings:
        $mz = { 4D 5A }
        $sus1 = "VirtualAlloc" ascii
        $sus2 = "LoadLibraryA" ascii
    condition:
        $mz at 0 and all of ($sus*)
}`;
    }

    return { sigma, yara };
  };

  const copyRule = (text: string, type: 'sigma' | 'yara') => {
    navigator.clipboard.writeText(text);
    setCopiedRule(type);
    setTimeout(() => setCopiedRule(null), 2000);
  };

  const filteredApts = mockApts.filter(apt => 
    apt.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    apt.aliases.join(' ').toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.targets.join(' ').toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.origin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Threat Actor Directory</h1>
          <p className="text-muted text-sm mt-1">Profiles and intelligence on Advanced Persistent Threat (APT) groups.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-panel p-4 flex gap-4 items-center stagger-1">
        <div className="glass-panel flex-1 px-4 py-2.5 flex items-center gap-3 border-white/10" style={{ borderRadius: 'var(--radius-md)' }}>
          <Search size={18} className="text-muted" />
          <input 
            type="text" 
            placeholder="Search groups, aliases, origins, or targets..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none text-main text-sm flex-1 outline-none"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-2">
        {filteredApts.map((apt, index) => (
          <div key={apt.id} onClick={() => setSelectedApt(apt)} className={`glass-panel p-6 flex flex-col stagger-${(index % 3) + 1} hover:-translate-y-1 transition-transform hover:border-blue-500/30`} style={{ cursor: 'pointer' }}>
            
            {/* Card Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight">
                  <Shield size={20} className={apt.threatLevel === 'Critical' ? 'text-danger' : apt.threatLevel === 'High' ? 'text-warning' : 'text-primary'} />
                  {apt.name}
                </h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">aka {apt.aliases.slice(0, 2).join(', ')}</p>
              </div>
              <div className="flex gap-2 items-center">
                {localCorrelations[apt.id] > 0 && (
                  <span className="badge badge-danger animate-pulse flex items-center gap-1 group relative">
                    <Activity size={10} /> {localCorrelations[apt.id]} Matches
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-danger/30 text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      Local IoCs matching {apt.name} TTPs
                    </span>
                  </span>
                )}
                <span className={`badge ${apt.threatLevel === 'Critical' ? 'badge-danger' : apt.threatLevel === 'High' ? 'badge-warning' : 'badge-primary'} px-2 py-0.5 text-[10px]`}>
                  {apt.threatLevel}
                </span>
              </div>
            </div>

            <div style={{ height: '1px', width: '100%', background: 'var(--border-subtle)', margin: '0.75rem 0' }} />

            {/* At a glance */}
            <div className="flex flex-col gap-3 flex-1 mb-4">
              <div className="flex gap-3 items-start">
                <MapPin size={16} className="text-muted mt-0.5" />
                <div>
                  <p className="text-xs text-muted font-medium uppercase tracking-wide">Origin</p>
                  <p className="text-sm font-medium">{apt.origin}</p>
                </div>
              </div>
              
              <div className="flex gap-3 items-start">
                <Target size={16} className="text-muted mt-0.5" />
                <div>
                  <p className="text-xs text-muted font-medium uppercase tracking-wide">Primary Targets</p>
                  <p className="text-sm">{apt.targets.join(', ')}</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <Code size={16} className="text-muted mt-0.5" />
                <div>
                  <p className="text-xs text-muted font-medium uppercase tracking-wide">Associated Malware</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {apt.malware.slice(0, 3).map((mw: string) => (
                      <span key={mw} className="text-[0.65rem] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] px-1.5 py-0.5 rounded text-muted">
                        {mw}
                      </span>
                    ))}
                    {apt.malware.length > 3 && <span className="text-[0.65rem] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] px-1.5 py-0.5 rounded text-muted">+{apt.malware.length - 3} more</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <button className="flex justify-between items-center w-full py-2 border-t border-[rgba(255,255,255,0.05)] text-sm text-primary hover:text-white transition-colors mt-auto">
              <span>View Full Profile</span>
              <ChevronRight size={16} />
            </button>
          </div>
        ))}
        {filteredApts.length === 0 && (
          <div className="col-span-3 text-center py-12 text-muted">
            No APT groups found matching "{searchTerm}"
          </div>
        )}
      </div>

      {/* Side Drawer for Full Profile */}
      {selectedApt && (
        <div className="drawer-overlay" onClick={() => setSelectedApt(null)}>
          <div className="drawer" onClick={e => e.stopPropagation()} style={{ width: '500px' }}>
            <div className="drawer-header bg-gradient-to-r from-slate-900/50 to-slate-800/50 border-b border-white/10">
              <div>
                <div className="flex items-center gap-3">
                  <Shield size={24} className={selectedApt.threatLevel === 'Critical' ? 'text-danger' : selectedApt.threatLevel === 'High' ? 'text-warning' : 'text-primary'} />
                  <h3 className="text-2xl font-bold">{selectedApt.name}</h3>
                </div>
                <p className="text-sm text-muted mt-1">Attributed to {selectedApt.origin}</p>
              </div>
              <button onClick={() => setSelectedApt(null)} className="text-muted hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="drawer-content overflow-y-auto custom-scrollbar p-6">
              
              <div className="mb-6">
                <p className="text-sm leading-relaxed text-muted">{selectedApt.description}</p>
                <div className="flex gap-2 mt-4 flex-wrap">
                  {selectedApt.aliases.map((alias: string) => (
                    <span key={alias} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-muted">aka {alias}</span>
                  ))}
                </div>
              </div>

              {/* Targeting Heatmap (Mini) */}
              <div className="glass-panel p-4 mb-6 border-red-500/20 shadow-lg shadow-red-500/5">
                <h4 className="text-xs font-bold uppercase tracking-widest text-red-500 mb-3 flex items-center gap-2">
                  <Globe size={14} /> Regional Targeting Map
                </h4>
                <div className="relative h-32 bg-slate-950 rounded overflow-hidden border border-white/5">
                  <div className="absolute inset-0 opacity-10 grayscale invert pointer-events-none" 
                       style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }}></div>
                  
                  {/* Mock Hotspots based on selected actor */}
                  <div className="absolute top-[40%] left-[20%] w-12 h-12 bg-red-500/20 rounded-full blur-xl animate-pulse"></div>
                  <div className="absolute top-[35%] left-[75%] w-8 h-8 bg-orange-500/20 rounded-full blur-lg"></div>
                  <div className="absolute top-[60%] left-[50%] w-10 h-10 bg-red-600/10 rounded-full blur-2xl"></div>
                  
                  <div className="absolute bottom-2 left-2 text-[9px] text-muted space-y-1 bg-black/40 p-1.5 rounded backdrop-blur-sm">
                    <p className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Critical Targeting Zone</p>
                    <p className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div> Emerging Threat Surface</p>
                  </div>
                </div>
              </div>

              {/* Behavioral Radar Chart */}
              <div className="glass-panel p-4 mb-6 bg-slate-800/20 border-blue-500/20">
                <h4 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2">
                  <Activity size={14} /> Behavioral Fingerprint
                </h4>
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                      { subject: 'Sophistication', A: selectedApt.fingerprint.sophistication, fullMark: 10 },
                      { subject: 'Aggression', A: selectedApt.fingerprint.aggression, fullMark: 10 },
                      { subject: 'Persistence', A: selectedApt.fingerprint.persistence, fullMark: 10 },
                      { subject: 'Obfuscation', A: selectedApt.fingerprint.obfuscation, fullMark: 10 },
                      { subject: 'Infra Rot', A: selectedApt.fingerprint.infraRot, fullMark: 10 },
                    ]}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Radar
                        name={selectedApt.name}
                        dataKey="A"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.5}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-panel p-4 mb-6">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-2">
                  <Target size={14} /> Affected Sectors
                </h4>
                <div className="flex gap-2 flex-wrap">
                  {selectedApt.targets.map((t: string) => (
                    <span key={t} className="badge badge-primary">{t}</span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted mb-4 border-b border-white/10 pb-2">
                  Kill Chain / Attack Flow
                </h4>
                <div className="flex flex-row overflow-x-auto pb-6 pt-3 items-stretch custom-scrollbar">
                  {selectedApt.playbook.map((phase: any, i: number) => (
                    <div key={i} className="flex items-center min-w-[280px] shrink-0">
                      <div className="glass-panel p-4 relative hover:border-blue-500/50 transition-all flex-1 h-full shadow-lg border-white/10 group top-0 hover:-top-1">
                        <div className="absolute -top-4 -left-2 bg-slate-900 border border-blue-500/50 shadow shadow-blue-500/20 rounded pl-2.5 pr-2.5 py-1 text-blue-400 group-hover:bg-blue-500/20 transition-colors flex items-center justify-center">
                          {React.cloneElement(phase.icon, { size: 14 })}
                        </div>
                        <h5 className="font-bold text-white text-sm mb-2 mt-3">{phase.phase}</h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed break-words whitespace-pre-wrap">{phase.description}</p>
                      </div>
                      {i < selectedApt.playbook.length - 1 && (
                        <div className="flex items-center justify-center shrink-0 w-8 mx-1">
                          <div className="w-full h-0.5 bg-blue-500/30 relative">
                            <div className="absolute -right-0.5 -top-[3px] border-t-4 border-b-4 border-l-6 border-t-transparent border-b-transparent border-l-blue-500/50" style={{ borderLeftWidth: '6px' }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel p-4 mb-6">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-2">
                  <Code size={14} /> Notable Arsenal
                </h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="text-xs text-muted mb-2">Malware Families</h5>
                    <div className="flex gap-2 flex-wrap">
                      {selectedApt.malware.map((m: string) => (
                        <span key={m} className="badge badge-danger text-xs">{m}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-xs text-muted mb-2">Frequently Exploited CVEs</h5>
                    <div className="flex gap-2 flex-wrap">
                      {selectedApt.associatedCVEs?.map((cve: string) => (
                         <span key={cve} className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-xs font-mono">{cve}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Detections */}
              <div className="mb-6">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
                  <Terminal size={14} /> Advanced Detections
                </h4>
                <div className="space-y-4">
                  {/* Sigma Rule */}
                  <div className="glass-panel p-4 relative group">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-blue-400 tracking-wider">SIGMA RULE (BEHAVIORAL)</span>
                      <button 
                        onClick={() => copyRule(generateAdvancedRules(selectedApt).sigma, 'sigma')}
                        className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md text-muted hover:text-white transition-colors flex items-center gap-1"
                      >
                        {copiedRule === 'sigma' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        <span className="text-xs">{copiedRule === 'sigma' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto custom-scrollbar whitespace-pre-wrap bg-slate-900/50 p-3 rounded border border-white/5">
                      {generateAdvancedRules(selectedApt).sigma}
                    </pre>
                  </div>

                  {/* YARA Rule */}
                  <div className="glass-panel p-4 relative group">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-red-400 tracking-wider">YARA RULE (MEMORY/FILE)</span>
                      <button 
                        onClick={() => copyRule(generateAdvancedRules(selectedApt).yara, 'yara')}
                        className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md text-muted hover:text-white transition-colors flex items-center gap-1"
                      >
                        {copiedRule === 'yara' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        <span className="text-xs">{copiedRule === 'yara' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto custom-scrollbar whitespace-pre-wrap bg-slate-900/50 p-3 rounded border border-white/5">
                      {generateAdvancedRules(selectedApt).yara}
                    </pre>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
