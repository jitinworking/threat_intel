import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  MapPin, Code, Search, Shield, ChevronRight, X, Target, 
  Copy, Check, Terminal, Activity, Globe, Zap, AlertTriangle, Layers
} from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { mockApts, type AptGroup, type PlaybookStep } from '../data/mockApts';
import { 
  Card, Button, Badge, H1, H2, H3, Text, Small, PageHeader, FilterBar
} from '../components/ui/design-system';
import { BACKEND_URL } from '../config';

export const AptGroups: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApt, setSelectedApt] = useState<AptGroup | null>(null);
  const [copiedRule, setCopiedRule] = useState<'sigma' | 'yara' | null>(null);
  const [localCorrelations, setLocalCorrelations] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'profile' | 'playbook' | 'detections'>('profile');

  useEffect(() => {
    const fetchCorrelations = async () => {
      const counts: Record<string, number> = {};
      for (const apt of mockApts) {
        try {
          const searchPromises = apt.malware.slice(0, 2).map(mw => 
            fetch(`${BACKEND_URL}/api/iocs?search=${encodeURIComponent(mw)}&limit=1`)
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

      yara = `rule APT_${apt.name.replace(/\\s+/g, '')}_Generic {
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
    <div className="p-6 md:p-8 flex flex-col gap-6 md:gap-8 bg-background min-h-full transition-colors duration-300">
      
      {/* ── HEADER TITLE ── */}
      <PageHeader
        title="Threat Actors & APT Intelligence"
        description="Profiles, behavioral fingerprinting, and active tracking of Advanced Persistent Threat adversaries."
        breadcrumbs={[
          { label: 'Threat Intelligence' },
          { label: 'Threat Actors & APTs' }
        ]}
      />

      {/* ── TOOLBAR ── */}
      <FilterBar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search groups, aliases, origins, or targets..."
        hasActiveFilters={Boolean(searchTerm)}
        onClear={() => setSearchTerm('')}
      />

      {/* ── GRID OF APTS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredApts.map((apt) => (
          <Card 
            key={apt.id} 
            onClick={() => { setSelectedApt(apt); setActiveTab('profile'); }} 
            className="flex flex-col cursor-pointer hover:border-blue/50 hover:shadow-lg transition-all group overflow-hidden relative min-h-[300px]"
          >
            {/* Top color bar depending on threat level */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${
              apt.threatLevel === 'Critical' ? 'bg-red animate-pulse' :
              apt.threatLevel === 'High' ? 'bg-amber-500' : 'bg-blue'
            }`} />

            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1">
                  <H2 className="text-[16px] font-bold flex items-center gap-2 group-hover:text-blue transition-colors">
                    {apt.name}
                  </H2>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-mid/60">
                    aka {apt.aliases[0] || 'Unknown'}
                  </span>
                </div>
                <Badge variant={
                  apt.threatLevel === 'Critical' ? 'critical' : 
                  apt.threatLevel === 'High' ? 'high' : 'medium'
                }>
                  {apt.threatLevel}
                </Badge>
              </div>

              <div className="flex flex-col gap-3 flex-1 mb-4 mt-2">
                <div className="flex gap-3 items-start">
                  <MapPin size={14} className="text-ink-mid/40 shrink-0 mt-0.5" />
                  <div>
                    <Small className="text-ink-mid/60 block font-bold uppercase">Origin</Small>
                    <span className="text-[12px] font-semibold text-foreground">{apt.origin}</span>
                  </div>
                </div>
                
                <div className="flex gap-3 items-start">
                  <Target size={14} className="text-ink-mid/40 shrink-0 mt-0.5" />
                  <div>
                    <Small className="text-ink-mid/60 block font-bold uppercase">Primary Targets</Small>
                    <span className="text-[12px] text-foreground font-medium line-clamp-1">{apt.targets.join(', ')}</span>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <Code size={14} className="text-ink-mid/40 shrink-0 mt-0.5" />
                  <div>
                    <Small className="text-ink-mid/60 block font-bold uppercase">Arsenal Count</Small>
                    <span className="text-[12px] text-foreground font-medium line-clamp-1">{apt.malware.length} distinct families</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-line mt-auto">
                <div className="flex items-center gap-2">
                  {localCorrelations[apt.id] > 0 ? (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red/10 text-red text-[10px] font-bold uppercase border border-red/20 animate-pulse">
                      <Zap size={10} className="fill-red" /> {localCorrelations[apt.id]} Active Hits
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green/10 text-green text-[10px] font-bold uppercase border border-green/20">
                      <Check size={10} /> Dormant
                    </span>
                  )}
                </div>
                <div className="text-blue flex items-center gap-1 text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Profile <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </Card>
        ))}
        {filteredApts.length === 0 && (
          <div className="col-span-full text-center py-20 text-ink-mid/60 border border-dashed border-line rounded-xl">
             <span className="text-[13px] font-bold">No threat actors matched your search criteria.</span>
          </div>
        )}
      </div>

      {/* ── INTELLIGENCE DRAWER ── */}
      {selectedApt && createPortal(
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm" onClick={() => setSelectedApt(null)} />
          
          <div className="relative w-full max-w-2xl bg-paper border-l border-line h-full flex flex-col shadow-2xl animate-fade-in-right">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-line bg-paper-alt flex justify-between items-center shrink-0">
              <div className="flex gap-4 items-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm ${
                  selectedApt.threatLevel === 'Critical' ? 'bg-red/10 border-red/20 text-red' :
                  selectedApt.threatLevel === 'High' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                  'bg-blue/10 border-blue/20 text-blue'
                }`}>
                  <Shield size={24} />
                </div>
                <div>
                  <H2 className="text-[20px] font-bold text-foreground flex items-center gap-3">
                    {selectedApt.name}
                    <Badge variant={selectedApt.threatLevel === 'Critical' ? 'critical' : selectedApt.threatLevel === 'High' ? 'high' : 'medium'}>
                      {selectedApt.threatLevel} Threat
                    </Badge>
                  </H2>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-mid mt-1">
                    State-Sponsored · Attributed to {selectedApt.origin}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedApt(null)} className="p-2 hover:bg-line rounded-lg text-ink-mid hover:text-foreground transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* Inner Tabs Selector */}
            <div className="flex border-b border-line bg-paper-alt px-6 gap-6">
              {[
                { id: 'profile', label: 'Intelligence Profile', icon: <Layers size={14} /> },
                { id: 'playbook', label: 'TTPs & Playbook', icon: <Activity size={14} /> },
                { id: 'detections', label: 'Signatures & Rules', icon: <Terminal size={14} /> }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`py-4 text-[12px] font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                    activeTab === t.id 
                      ? 'border-blue text-blue' 
                      : 'border-transparent text-ink-mid hover:text-foreground'
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-background">
              
              {/* TAB: PROFILE */}
              {activeTab === 'profile' && (
                <div className="flex flex-col gap-8 animate-fade-in">
                  
                  {/* Summary */}
                  <div className="flex flex-col gap-3">
                    <H3 className="text-[14px] font-bold flex items-center gap-2"><Globe size={16} className="text-blue" /> Executive Summary</H3>
                    <Text className="text-[13px] leading-relaxed text-ink-mid font-medium p-4 bg-paper border border-line rounded-xl">
                      {selectedApt.description}
                    </Text>
                  </div>

                  {/* Badges / Meta */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <Small className="font-bold uppercase tracking-wider text-ink-mid">Known Aliases</Small>
                      <div className="flex flex-wrap gap-2">
                        {selectedApt.aliases.map(alias => (
                          <span key={alias} className="px-2.5 py-1 rounded-md bg-paper border border-line text-[11px] font-bold text-foreground">
                            {alias}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Small className="font-bold uppercase tracking-wider text-ink-mid">Targeted Sectors</Small>
                      <div className="flex flex-wrap gap-2">
                        {selectedApt.targets.map(t => (
                          <span key={t} className="px-2.5 py-1 rounded-md bg-blue/10 border border-blue/20 text-blue text-[11px] font-bold">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Fingerprint Radar Chart */}
                  <div className="flex flex-col gap-3">
                    <H3 className="text-[14px] font-bold flex items-center gap-2"><Target size={16} className="text-red" /> Behavioral Fingerprint</H3>
                    <div className="bg-paper border border-line rounded-xl p-4 h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={[
                          { subject: 'Sophistication', A: selectedApt.fingerprint.sophistication, fullMark: 10 },
                          { subject: 'Aggression', A: selectedApt.fingerprint.aggression, fullMark: 10 },
                          { subject: 'Persistence', A: selectedApt.fingerprint.persistence, fullMark: 10 },
                          { subject: 'Obfuscation', A: selectedApt.fingerprint.obfuscation, fullMark: 10 },
                          { subject: 'Infra Rot', A: selectedApt.fingerprint.infraRot, fullMark: 10 },
                        ]}>
                          <PolarGrid stroke="currentColor" className="text-line-strong opacity-50" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 700 }} className="text-ink-mid" />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: 'hsl(var(--paper))', border: '1px solid hsl(var(--line))', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }} 
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                          />
                          <Radar
                            name={selectedApt.name}
                            dataKey="A"
                            stroke="#2563EB"
                            fill="#2563EB"
                            fillOpacity={0.2}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Arsenal */}
                  <div className="flex flex-col gap-4">
                    <H3 className="text-[14px] font-bold flex items-center gap-2"><Code size={16} className="text-amber-500" /> Malicious Arsenal & CVEs</H3>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-paper border border-line rounded-xl p-4 flex flex-col gap-3">
                        <Small className="font-bold uppercase tracking-wider text-ink-mid">Associated Malware Families</Small>
                        <div className="flex flex-wrap gap-2">
                          {selectedApt.malware.map(m => (
                            <span key={m} className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-bold">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-paper border border-line rounded-xl p-4 flex flex-col gap-3">
                        <Small className="font-bold uppercase tracking-wider text-ink-mid">Actively Exploited Vulnerabilities</Small>
                        <div className="flex flex-wrap gap-2">
                          {selectedApt.associatedCVEs.map(cve => (
                            <span key={cve} className="px-2.5 py-1 rounded-md bg-red/10 border border-red/20 text-red text-[11px] font-bold font-mono">
                              {cve}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: PLAYBOOK & TTPs */}
              {activeTab === 'playbook' && (
                <div className="flex flex-col gap-6 animate-fade-in">
                  <div className="bg-blue/5 border border-blue/20 rounded-xl p-4 flex items-center gap-4">
                     <Activity size={24} className="text-blue" />
                     <div>
                       <span className="block text-[13px] font-bold text-blue">MITRE ATT&CK® Execution Flow</span>
                       <span className="block text-[11px] text-ink-mid mt-0.5">Chronological breakdown of typical attack campaigns utilizing observed Tactics, Techniques, and Procedures.</span>
                     </div>
                  </div>

                  <div className="relative pl-6 sm:pl-8 border-l-2 border-line ml-4 mt-2 flex flex-col gap-8">
                    {selectedApt.playbook.map((step: PlaybookStep, idx: number) => (
                      <div key={idx} className="relative group">
                        {/* Timeline Node */}
                        <div className="absolute -left-[35px] sm:-left-[43px] top-1 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-paper border-2 border-blue flex items-center justify-center text-blue group-hover:scale-110 group-hover:bg-blue group-hover:text-white transition-all shadow-sm">
                          {React.cloneElement(step.icon as React.ReactElement<any>, { size: 14 })}
                        </div>
                        
                        <div className="bg-paper border border-line rounded-xl p-4 shadow-sm group-hover:border-blue/30 transition-colors">
                          <H3 className="text-[14px] font-bold mb-2 flex items-center justify-between">
                            {step.phase}
                            <span className="text-[10px] font-mono text-ink-mid/50">PHASE 0{idx + 1}</span>
                          </H3>
                          <Text className="text-[12.5px] leading-relaxed text-ink-mid whitespace-pre-wrap">
                            {step.description}
                          </Text>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: DETECTIONS */}
              {activeTab === 'detections' && (
                <div className="flex flex-col gap-6 animate-fade-in">
                  
                  <div className="bg-red/5 border border-red/20 rounded-xl p-4 flex items-center gap-4">
                     <AlertTriangle size={24} className="text-red" />
                     <div>
                       <span className="block text-[13px] font-bold text-red">Defensive Countermeasures</span>
                       <span className="block text-[11px] text-ink-mid mt-0.5">Automated generation of behavioral logic and memory signatures targeting {selectedApt.name} infrastructure.</span>
                     </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    {/* SIGMA */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center bg-paper-alt px-4 py-2 border border-line rounded-t-xl">
                        <span className="text-[11px] font-bold text-ink-mid uppercase tracking-wider">Sigma Behavioral Rule</span>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => copyRule(generateAdvancedRules(selectedApt).sigma, 'sigma')}
                          className="h-7 text-[10px] gap-1.5"
                        >
                          {copiedRule === 'sigma' ? <Check size={12} className="text-green" /> : <Copy size={12} />}
                          {copiedRule === 'sigma' ? 'Copied' : 'Copy'}
                        </Button>
                      </div>
                      <div className="bg-ink border-x border-b border-line rounded-b-xl p-4 overflow-x-auto">
                        <pre className="text-[11px] font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed">
                          {generateAdvancedRules(selectedApt).sigma}
                        </pre>
                      </div>
                    </div>

                    {/* YARA */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center bg-paper-alt px-4 py-2 border border-line rounded-t-xl">
                        <span className="text-[11px] font-bold text-ink-mid uppercase tracking-wider">YARA Memory Signature</span>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => copyRule(generateAdvancedRules(selectedApt).yara, 'yara')}
                          className="h-7 text-[10px] gap-1.5"
                        >
                          {copiedRule === 'yara' ? <Check size={12} className="text-green" /> : <Copy size={12} />}
                          {copiedRule === 'yara' ? 'Copied' : 'Copy'}
                        </Button>
                      </div>
                      <div className="bg-ink border-x border-b border-line rounded-b-xl p-4 overflow-x-auto">
                        <pre className="text-[11px] font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed">
                          {generateAdvancedRules(selectedApt).yara}
                        </pre>
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
