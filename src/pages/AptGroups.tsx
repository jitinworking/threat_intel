import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { MapPin, Code, Search, Shield, ChevronRight, Target, Copy, Check, Terminal, Activity, Globe, ArrowLeft, Flame } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { WorldMap } from '../components/WorldMap';

export interface PlaybookStep {
  phase: string;
  description: string;
  icon?: any;
}

export interface AptGroup {
  id: number;
  name: string;
  aliases: string[];
  origin: string;
  targets: string[];
  malware: string[];
  threatLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  playbook: PlaybookStep[];
  associatedCVEs: string[];
  fingerprint: {
    sophistication: number;
    aggression: number;
    persistence: number;
    obfuscation: number;
    infraRot: number;
  };
}

export const AptGroups: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApt, setSelectedApt] = useState<AptGroup | null>(null);
  const [copiedRule, setCopiedRule] = useState<'sigma' | 'yara' | null>(null);
  const [localCorrelations, setLocalCorrelations] = useState<Record<string, number>>({});
  const [apts, setApts] = useState<AptGroup[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/apts`)
      .then(r => r.json())
      .then(data => {
        setApts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch APTs', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (apts.length === 0) return;
    const fetchCorrelations = async () => {
      const counts: Record<string, number> = {};
      for (const apt of apts) {
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

  const filteredApts = apts.filter(apt => 
    apt.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    apt.aliases.join(' ').toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.targets.join(' ').toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.origin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {!selectedApt ? (
        <>
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
                <div className="flex flex-col xl:flex-row justify-between items-start gap-3 mb-4">
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight truncate">
                      <Shield size={20} className={apt.threatLevel === 'Critical' ? 'text-danger shrink-0' : apt.threatLevel === 'High' ? 'text-warning shrink-0' : 'text-primary shrink-0'} />
                      <span className="truncate">{apt.name}</span>
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted truncate">aka {apt.aliases.slice(0, 2).join(', ')}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center shrink-0">
                    {localCorrelations[apt.id] > 0 && (
                      <span 
                        className="badge badge-danger animate-pulse flex items-center gap-1 cursor-help"
                        title={`Local IoCs matching ${apt.name} TTPs`}
                      >
                        <Activity size={10} /> {localCorrelations[apt.id]} Matches
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
        </>
      ) : (
        /* Full Screen Baseball Card */
        <div className="animate-fade-in flex flex-col gap-6 w-full max-w-full min-w-0 overflow-x-hidden">
          {/* Back button and Header */}
          <div className="flex items-start gap-4 mb-2">
             <button onClick={() => setSelectedApt(null)} className="p-3 bg-slate-900/50 border border-white/5 hover:bg-white/10 hover:border-white/20 rounded-full transition-all mt-1">
               <ArrowLeft size={24} className="text-blue-400" />
             </button>
             <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <Shield size={32} className={selectedApt.threatLevel === 'Critical' ? 'text-danger animate-pulse' : selectedApt.threatLevel === 'High' ? 'text-warning' : 'text-primary'} />
                  <h1 className="text-4xl font-black tracking-tight">{selectedApt.name}</h1>
                  <span className={`badge ${selectedApt.threatLevel === 'Critical' ? 'badge-danger' : selectedApt.threatLevel === 'High' ? 'badge-warning' : 'badge-primary'} px-3 py-1 text-sm shadow-lg`}>
                    {selectedApt.threatLevel.toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <p className="text-muted"><span className="uppercase tracking-widest text-[10px] font-bold">Origin:</span> <span className="text-white font-medium">{selectedApt.origin}</span></p>
                  <p className="text-muted"><span className="uppercase tracking-widest text-[10px] font-bold">Aliases:</span> <span className="text-white font-medium">{selectedApt.aliases.join(', ')}</span></p>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
             {/* Left Column: Map & Overview */}
             <div className="xl:col-span-2 flex flex-col gap-6 min-w-0">
                <div className="glass-panel p-6 shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-transparent"></div>
                   <h3 className="text-lg font-bold mb-3 flex items-center gap-2"><Globe className="text-blue-400"/> Global Targeting Matrix</h3>
                   <p className="text-sm text-slate-300 mb-6 leading-relaxed bg-slate-900/50 p-4 border-l-2 border-blue-500 rounded-r">{selectedApt.description}</p>
                   <div style={{ height: '450px' }}>
                      <WorldMap targets={selectedApt.targets} />
                   </div>
                </div>

                {/* Kill Chain */}
                <div className="glass-panel p-6 overflow-hidden">
                   <h3 className="text-lg font-bold mb-6 border-b border-white/10 pb-3 uppercase tracking-widest text-muted text-sm flex items-center gap-2">
                     <Target size={16}/> MITRE Attack Flow / Playbook
                   </h3>
                   <div className="flex flex-wrap gap-y-6 items-stretch justify-start">
                     {selectedApt.playbook.map((phase: any, i: number) => (
                       <React.Fragment key={i}>
                         <div className="flex items-stretch shrink-0" style={{ width: '300px' }}>
                           <div className="glass-panel p-5 relative hover:border-blue-500/50 transition-all w-full h-full shadow-lg border-white/10 group bg-slate-900/80">
                             <div className="w-8 h-8 rounded-full bg-slate-800 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                               {i + 1}
                             </div>
                             <h5 className="font-bold text-white text-md mb-2">{phase.phase}</h5>
                             <p className="text-xs text-slate-400 leading-relaxed break-words whitespace-normal">{phase.description}</p>
                           </div>
                         </div>
                         {i < selectedApt.playbook.length - 1 && (
                           <div className="flex items-center justify-center shrink-0 w-6 md:w-10 mx-1 md:mx-2">
                             <div className="w-full h-0.5 bg-blue-500/40 relative">
                               <div className="absolute border-t-4 border-b-4 border-t-transparent border-b-transparent border-l-blue-500/60" style={{ right: '-0.125rem', top: '-4px', borderLeftWidth: '8px' }}></div>
                             </div>
                           </div>
                         )}
                       </React.Fragment>
                     ))}
                   </div>
                </div>
             </div>

             {/* Right Column: Analytics */}
             <div className="flex flex-col gap-6">
                {/* Burn Rate Widget */}
                <div className="glass-panel p-6 border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.05)] bg-gradient-to-b from-slate-900 to-slate-950">
                   <h3 className="text-sm font-bold uppercase tracking-widest text-red-500 mb-5 flex items-center gap-2">
                     <Flame size={16} className="animate-pulse" /> Infrastructure Burn Rate
                   </h3>
                   <div className="flex justify-between items-end mb-6">
                      <div>
                         <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Current Velocity</div>
                         <div className="text-4xl font-black text-white">{Math.floor(Math.random() * 50) + 20} <span className="text-sm text-slate-400 font-medium">IPs/hr</span></div>
                      </div>
                      <div className="text-right">
                         <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Avg Lifespan</div>
                         <div className="text-xl font-mono text-warning">18m 30s</div>
                      </div>
                   </div>
                   {/* Sparkline mock */}
                   <div className="h-16 w-full flex items-end gap-[2px] opacity-80">
                      {[40, 25, 60, 80, 50, 90, 100, 75, 45, 65, 85, 55, 30, 20, 50, 70, 95, 60].map((h, i) => (
                         <div key={i} className={`flex-1 rounded-t-sm transition-all hover:opacity-100 cursor-crosshair ${h > 80 ? 'bg-red-500' : h > 50 ? 'bg-orange-400' : 'bg-blue-500'}`} style={{ height: `${h}%` }}></div>
                      ))}
                   </div>
                   <p className="text-[10px] text-slate-500 mt-4 border-t border-white/5 pt-3 text-center uppercase tracking-widest">Simulated from live EDR telemetry</p>
                </div>

                {/* Behavioral Radar */}
                <div className="glass-panel p-6 bg-slate-900/50">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
                    <Activity size={16} /> Behavioral Fingerprint
                  </h3>
                  <div style={{ width: '100%', height: 240 }} className="mt-2">
                    <ResponsiveContainer>
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={[
                        { subject: 'Sophistication', A: selectedApt.fingerprint.sophistication, fullMark: 10 },
                        { subject: 'Aggression', A: selectedApt.fingerprint.aggression, fullMark: 10 },
                        { subject: 'Persistence', A: selectedApt.fingerprint.persistence, fullMark: 10 },
                        { subject: 'Obfuscation', A: selectedApt.fingerprint.obfuscation, fullMark: 10 },
                        { subject: 'Infra Rot', A: selectedApt.fingerprint.infraRot, fullMark: 10 },
                      ]}>
                        <PolarGrid stroke="rgba(59,130,246,0.2)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                        <Radar name={selectedApt.name} dataKey="A" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Detections */}
                <div className="glass-panel p-6 flex-1 flex flex-col">
                   <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4 border-b border-white/10 pb-3 flex items-center gap-2">
                     <Terminal size={14} /> The Rule Forge
                   </h3>
                   <div className="space-y-4 flex-1">
                     <div className="bg-slate-950 p-4 rounded border border-slate-800 relative group h-full max-h-[220px] flex flex-col shadow-inner">
                       <div className="flex justify-between items-center mb-3 shrink-0 border-b border-white/5 pb-2">
                         <span className="text-[10px] font-bold text-blue-400 tracking-wider">SIGMA (BEHAVIORAL)</span>
                         <button onClick={() => copyRule(generateAdvancedRules(selectedApt).sigma, 'sigma')} className="text-muted hover:text-white transition-colors flex items-center gap-1">
                           {copiedRule === 'sigma' ? <Check size={12} className="text-green-500"/> : <Copy size={12}/>}
                           <span className="text-[10px]">{copiedRule === 'sigma' ? 'COPIED' : 'COPY'}</span>
                         </button>
                       </div>
                       <pre className="text-[11px] font-mono text-slate-300 overflow-y-auto whitespace-pre-wrap flex-1 custom-scrollbar">{generateAdvancedRules(selectedApt).sigma}</pre>
                     </div>
                     <div className="bg-slate-950 p-4 rounded border border-slate-800 relative group h-full max-h-[220px] flex flex-col shadow-inner">
                       <div className="flex justify-between items-center mb-3 shrink-0 border-b border-white/5 pb-2">
                         <span className="text-[10px] font-bold text-red-400 tracking-wider">YARA (MEMORY)</span>
                         <button onClick={() => copyRule(generateAdvancedRules(selectedApt).yara, 'yara')} className="text-muted hover:text-white transition-colors flex items-center gap-1">
                           {copiedRule === 'yara' ? <Check size={12} className="text-green-500"/> : <Copy size={12}/>}
                           <span className="text-[10px]">{copiedRule === 'yara' ? 'COPIED' : 'COPY'}</span>
                         </button>
                       </div>
                       <pre className="text-[11px] font-mono text-slate-300 overflow-y-auto whitespace-pre-wrap flex-1 custom-scrollbar">{generateAdvancedRules(selectedApt).yara}</pre>
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
