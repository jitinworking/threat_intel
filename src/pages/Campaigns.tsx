import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Clock, Search, X, Target, MapPin, Code,
  Server, GitBranch, GitCommit, ChevronRight, Activity, Users,
  Database, Network
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';
import { 
  Card, Badge, H1, H2, H3, Text, Small, Button, PageHeader, FilterBar
} from '../components/ui/design-system';

interface Campaign {
  id: string;
  name: string;
  status: 'Active' | 'Historical' | 'Emerging';
  severity: 'Critical' | 'High' | 'Medium';
  description: string;
  dateRange: string;
  actors: string[];
  malware: string[];
  victims: { sector: string; count: number }[];
  countries: string[];
  infrastructure: { type: string; value: string; active: boolean }[];
  timeline: { date: string; phase: string; event: string }[];
}

const mockCampaigns: Campaign[] = [
  {
    id: 'CMP-2020-001',
    name: 'Operation SolarWinds (SUNBURST)',
    status: 'Historical',
    severity: 'Critical',
    description: 'A massive, highly sophisticated supply chain attack targeting SolarWinds Orion software, resulting in widespread compromise of US government agencies and enterprise corporations globally.',
    dateRange: 'Spring 2020 - Dec 2020',
    actors: ['APT29 (Cozy Bear)', 'NOBELIUM'],
    malware: ['SUNBURST', 'TEARDROP', 'Cobalt Strike', 'GoldMax'],
    victims: [
      { sector: 'Government', count: 45 },
      { sector: 'Tech/IT', count: 30 },
      { sector: 'Telecom', count: 15 },
      { sector: 'Finance', count: 10 }
    ],
    countries: ['United States', 'United Kingdom', 'Canada', 'Israel', 'Spain'],
    infrastructure: [
      { type: 'Domain', value: 'avsvmcloud.com', active: false },
      { type: 'Domain', value: 'digitalcollege.org', active: false },
      { type: 'IP', value: '18.130.252.126', active: false },
      { type: 'IP', value: '71.152.53.111', active: false }
    ],
    timeline: [
      { date: 'Sep 2019', phase: 'Reconnaissance', event: 'Initial access to SolarWinds internal network.' },
      { date: 'Feb 2020', phase: 'Weaponization', event: 'SUNBURST malicious code injected into SolarWinds.Orion.Core.BusinessLayer.dll.' },
      { date: 'Mar 2020', phase: 'Delivery', event: 'Trojanized updates signed and distributed to thousands of customers.' },
      { date: 'May 2020', phase: 'C2', event: 'Secondary payloads (TEARDROP) deployed via avsvmcloud.com.' },
      { date: 'Dec 2020', phase: 'Discovery', event: 'FireEye officially discloses the breach and tools stolen.' }
    ]
  },
  {
    id: 'CMP-2023-014',
    name: 'CitrixBleed Exploitation Wave',
    status: 'Active',
    severity: 'Critical',
    description: 'Mass exploitation of CVE-2023-4966 (CitrixBleed) in Citrix NetScaler ADC and Gateway appliances, allowing attackers to hijack authenticated sessions and bypass MFA.',
    dateRange: 'Aug 2023 - Present',
    actors: ['LockBit 3.0 Affiliates', 'UNC5005'],
    malware: ['LockBit Black', 'Cobalt Strike', 'AnyDesk', 'Mimikatz'],
    victims: [
      { sector: 'Healthcare', count: 65 },
      { sector: 'Manufacturing', count: 40 },
      { sector: 'Finance', count: 35 },
      { sector: 'Legal', count: 20 }
    ],
    countries: ['United States', 'Australia', 'Germany', 'Japan', 'Brazil'],
    infrastructure: [
      { type: 'IP', value: '104.244.75.12', active: true },
      { type: 'IP', value: '45.14.71.100', active: true },
      { type: 'Domain', value: 'remote-admin-support.net', active: true },
      { type: 'Hash', value: 'a9b4c3... (LockBit DLL)', active: true }
    ],
    timeline: [
      { date: 'Aug 2023', phase: 'Exploitation', event: 'Zero-day exploitation of CVE-2023-4966 observed in the wild.' },
      { date: 'Oct 2023', phase: 'Disclosure', event: 'Citrix releases patches and advisory.' },
      { date: 'Nov 2023', phase: 'Lateral Movement', event: 'LockBit affiliates industrialize the exploit for rapid ransomware deployment.' },
      { date: 'Dec 2023', phase: 'Impact', event: 'Major healthcare providers and ports paralyzed by encryption.' }
    ]
  },
  {
    id: 'CMP-2024-002',
    name: 'Operation Phantom Nexus',
    status: 'Emerging',
    severity: 'High',
    description: 'An ongoing cyber espionage campaign targeting telecommunications infrastructure in APAC, utilizing novel living-off-the-land (LotL) techniques to maintain deep persistence in ISP routing equipment.',
    dateRange: 'Jan 2024 - Present',
    actors: ['Mustang Panda', 'Volt Typhoon (Suspected)'],
    malware: ['PlugX', 'Custom Firmware Rootkits', 'PowerShell Obfuscation'],
    victims: [
      { sector: 'Telecom', count: 50 },
      { sector: 'Critical Infra', count: 25 },
      { sector: 'Government', count: 15 }
    ],
    countries: ['Taiwan', 'Philippines', 'Japan', 'South Korea'],
    infrastructure: [
      { type: 'IP', value: '203.119.34.22', active: true },
      { type: 'IP', value: '118.99.10.2', active: true },
      { type: 'Domain', value: 'apac-routing-metrics.com', active: true }
    ],
    timeline: [
      { date: 'Jan 2024', phase: 'Initial Access', event: 'Compromise of edge routers via unpatched VPN vulnerabilities.' },
      { date: 'Feb 2024', phase: 'Persistence', event: 'Deployment of custom firmware modifications surviving reboots.' },
      { date: 'Mar 2024', phase: 'Collection', event: 'Large scale passive interception of BGP routing tables.' },
      { date: 'Apr 2024', phase: 'Discovery', event: 'Anomalous firmware hashes detected during routine audits.' }
    ]
  }
];

export const Campaigns: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'infrastructure'>('overview');

  const filteredCampaigns = mockCampaigns.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.actors.join(' ').toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.malware.join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 md:gap-8 bg-background min-h-full transition-colors duration-300">
      
      {/* ── HEADER TITLE ── */}
      <PageHeader
        title="Campaign Intelligence"
        description="Trace coordinated adversarial operations spanning multiple actors, payloads, and targeted victim sectors."
        breadcrumbs={[
          { label: 'Threat Intelligence' },
          { label: 'Campaigns' }
        ]}
      />

      {/* ── TOOLBAR ── */}
      <FilterBar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search campaigns, threat actors, or malware..."
        hasActiveFilters={Boolean(searchTerm)}
        onClear={() => setSearchTerm('')}
      />

      {/* ── GRID OF CAMPAIGNS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCampaigns.map((camp) => (
          <Card 
            key={camp.id} 
            onClick={() => { setSelectedCampaign(camp); setActiveTab('overview'); }} 
            className="flex flex-col cursor-pointer hover:border-blue/50 hover:shadow-lg transition-all group overflow-hidden relative min-h-[320px]"
          >
            {/* Top color bar depending on severity */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${
              camp.severity === 'Critical' ? 'bg-red animate-pulse' :
              camp.severity === 'High' ? 'bg-amber-500' : 'bg-blue'
            }`} />

            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1">
                  <H2 className="text-[16px] font-bold flex items-center gap-2 group-hover:text-blue transition-colors leading-tight">
                    {camp.name}
                  </H2>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-mid/60 mt-1">
                    {camp.dateRange}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2 mb-5">
                <Badge variant={
                  camp.severity === 'Critical' ? 'critical' : 
                  camp.severity === 'High' ? 'high' : 'medium'
                }>
                  {camp.severity}
                </Badge>
                <Badge variant="default" className={
                  camp.status === 'Active' ? 'bg-blue/10 text-blue border-blue/20 animate-pulse' : 
                  camp.status === 'Emerging' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 
                  'bg-paper-alt text-ink-mid border-line'
                }>
                  {camp.status}
                </Badge>
              </div>

              <div className="flex flex-col gap-3 flex-1 mb-4">
                <div className="flex gap-3 items-start">
                  <Users size={14} className="text-ink-mid/40 shrink-0 mt-0.5" />
                  <div>
                    <Small className="text-ink-mid/60 block font-bold uppercase mb-0.5">Attributed Actors</Small>
                    <span className="text-[12px] font-semibold text-foreground line-clamp-1">{camp.actors.join(', ')}</span>
                  </div>
                </div>
                
                <div className="flex gap-3 items-start">
                  <Target size={14} className="text-ink-mid/40 shrink-0 mt-0.5" />
                  <div>
                    <Small className="text-ink-mid/60 block font-bold uppercase mb-0.5">Top Sectors</Small>
                    <span className="text-[12px] text-foreground font-medium line-clamp-1">
                      {camp.victims.map(v => v.sector).slice(0,2).join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-line mt-auto">
                <span className="text-[11px] font-bold text-ink-mid">
                  {camp.infrastructure.length} IOCs tracked
                </span>
                <div className="text-blue flex items-center gap-1 text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Details <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </Card>
        ))}
        {filteredCampaigns.length === 0 && (
          <div className="col-span-full text-center py-20 text-ink-mid/60 border border-dashed border-line rounded-xl">
             <span className="text-[13px] font-bold">No campaigns matched your search criteria.</span>
          </div>
        )}
      </div>

      {/* ── CAMPAIGN DRAWER ── */}
      {selectedCampaign && createPortal(
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm" onClick={() => setSelectedCampaign(null)} />
          
          <div className="relative w-full max-w-3xl bg-paper border-l border-line h-full flex flex-col shadow-2xl animate-fade-in-right">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-line bg-paper-alt flex justify-between items-start shrink-0">
              <div className="flex gap-4 items-start">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm shrink-0 ${
                  selectedCampaign.severity === 'Critical' ? 'bg-red/10 border-red/20 text-red' :
                  selectedCampaign.severity === 'High' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                  'bg-blue/10 border-blue/20 text-blue'
                }`}>
                  <Network size={24} />
                </div>
                <div>
                  <H2 className="text-[22px] font-bold text-foreground leading-tight">
                    {selectedCampaign.name}
                  </H2>
                  <div className="flex gap-2 items-center mt-2 flex-wrap">
                    <Badge variant={selectedCampaign.severity === 'Critical' ? 'critical' : selectedCampaign.severity === 'High' ? 'high' : 'medium'}>
                      {selectedCampaign.severity} Severity
                    </Badge>
                    <Badge variant="default" className={selectedCampaign.status === 'Active' ? 'bg-blue/10 text-blue border-blue/20' : 'bg-paper border-line text-ink-mid'}>
                      {selectedCampaign.status}
                    </Badge>
                    <span className="text-[11px] font-bold text-ink-mid uppercase flex items-center gap-1.5 ml-2">
                      <Clock size={12} /> {selectedCampaign.dateRange}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedCampaign(null)} className="p-2 hover:bg-line rounded-lg text-ink-mid hover:text-foreground transition-colors cursor-pointer shrink-0">
                <X size={20} />
              </button>
            </div>

            {/* Inner Tabs Selector */}
            <div className="flex border-b border-line bg-paper-alt px-6 gap-8">
              {[
                { id: 'overview', label: 'Attribution & Victims', icon: <Users size={14} /> },
                { id: 'timeline', label: 'Campaign Timeline', icon: <GitBranch size={14} /> },
                { id: 'infrastructure', label: 'Infrastructure Map', icon: <Server size={14} /> }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`py-4 text-[13px] font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
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
              
              {/* TAB: OVERVIEW / ATTRIBUTION */}
              {activeTab === 'overview' && (
                <div className="flex flex-col gap-8 animate-fade-in">
                  
                  {/* Summary */}
                  <div className="flex flex-col gap-3">
                    <H3 className="text-[14px] font-bold">Executive Intelligence Brief</H3>
                    <Text className="text-[13.5px] leading-relaxed text-ink-mid font-medium p-5 bg-paper border border-line rounded-xl">
                      {selectedCampaign.description}
                    </Text>
                  </div>

                  {/* Attribution Matrix */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-paper border border-line rounded-xl p-5 flex flex-col gap-4">
                      <H3 className="text-[12px] font-bold uppercase tracking-wider text-ink-mid flex items-center gap-2">
                        <Users size={14} className="text-purple-500" /> Attributed Actors
                      </H3>
                      <div className="flex flex-col gap-2">
                        {selectedCampaign.actors.map(actor => (
                          <div key={actor} className="px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[13px] font-bold text-purple-600 dark:text-purple-400">
                            {actor}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-paper border border-line rounded-xl p-5 flex flex-col gap-4">
                      <H3 className="text-[12px] font-bold uppercase tracking-wider text-ink-mid flex items-center gap-2">
                        <Code size={14} className="text-amber-500" /> Deployed Arsenal
                      </H3>
                      <div className="flex flex-col gap-2">
                        {selectedCampaign.malware.map(mw => (
                          <div key={mw} className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[13px] font-bold text-amber-600 dark:text-amber-400">
                            {mw}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Victimology Chart */}
                  <div className="flex flex-col gap-3">
                    <H3 className="text-[14px] font-bold flex items-center gap-2"><Target size={16} className="text-blue" /> Victimology Analytics</H3>
                    <div className="bg-paper border border-line rounded-xl p-5 h-[300px] flex flex-col gap-2">
                      <Small className="font-bold text-ink-mid mb-2 uppercase tracking-wider">Compromises by Sector</Small>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={selectedCampaign.victims} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--line))" />
                          <XAxis type="number" tick={{ fill: 'hsl(var(--ink-mid))', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                          <YAxis dataKey="sector" type="category" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} width={100} />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: 'hsl(var(--paper))', border: '1px solid hsl(var(--line))', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }} 
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                            cursor={{ fill: 'hsl(var(--paper-alt))' }}
                          />
                          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                            {selectedCampaign.victims.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : index === 1 ? '#f59e0b' : '#3b82f6'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Geographic Impact */}
                  <div className="flex flex-col gap-3">
                    <H3 className="text-[14px] font-bold flex items-center gap-2"><MapPin size={16} className="text-green" /> Geographic Impact</H3>
                    <div className="bg-paper border border-line rounded-xl p-5 flex flex-wrap gap-2">
                      {selectedCampaign.countries.map(country => (
                        <span key={country} className="px-3 py-1.5 rounded-lg bg-green/10 border border-green/20 text-green text-[12px] font-bold">
                          {country}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB: TIMELINE */}
              {activeTab === 'timeline' && (
                <div className="flex flex-col gap-6 animate-fade-in">
                  <div className="bg-blue/5 border border-blue/20 rounded-xl p-5 flex items-center gap-4">
                     <Clock size={24} className="text-blue" />
                     <div>
                       <span className="block text-[14px] font-bold text-blue">Chronological Operations Tracker</span>
                       <span className="block text-[12px] text-ink-mid mt-1">Trace the evolution of the campaign across the intrusion lifecycle.</span>
                     </div>
                  </div>

                  <div className="relative pl-6 sm:pl-10 border-l-2 border-line ml-4 mt-4 flex flex-col gap-10">
                    {selectedCampaign.timeline.map((step, idx) => (
                      <div key={idx} className="relative group">
                        {/* Timeline Node */}
                        <div className="absolute -left-[35px] sm:-left-[53px] top-1 w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-paper border-2 border-blue flex items-center justify-center text-blue group-hover:scale-110 group-hover:bg-blue group-hover:text-white transition-all shadow-sm">
                          <GitCommit size={16} />
                        </div>
                        
                        <div className="bg-paper border border-line rounded-xl p-5 shadow-sm group-hover:border-blue/30 transition-colors">
                          <div className="flex justify-between items-center mb-3">
                            <Badge variant="medium" className="bg-blue/10 text-blue border-blue/20">{step.date}</Badge>
                            <span className="text-[10px] font-mono font-bold text-ink-mid uppercase tracking-wider bg-paper-alt px-2 py-1 rounded">
                              {step.phase}
                            </span>
                          </div>
                          <Text className="text-[13.5px] leading-relaxed text-foreground font-medium">
                            {step.event}
                          </Text>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: INFRASTRUCTURE */}
              {activeTab === 'infrastructure' && (
                <div className="flex flex-col gap-6 animate-fade-in">
                  
                  <div className="bg-paper-alt border border-line rounded-xl p-5 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                       <Database size={24} className="text-ink-mid" />
                       <div>
                         <span className="block text-[14px] font-bold text-foreground">Operational Infrastructure</span>
                         <span className="block text-[12px] text-ink-mid mt-1">Known C2 endpoints, payload delivery domains, and artifact hashes.</span>
                       </div>
                     </div>
                     <Button variant="secondary" className="text-[11px]">Export CSV</Button>
                  </div>

                  <div className="bg-paper border border-line rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-paper-alt border-b border-line">
                          <th className="p-4 text-[11px] font-bold text-ink-mid uppercase tracking-wider">Indicator</th>
                          <th className="p-4 text-[11px] font-bold text-ink-mid uppercase tracking-wider">Type</th>
                          <th className="p-4 text-[11px] font-bold text-ink-mid uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCampaign.infrastructure.map((infra, idx) => (
                          <tr key={idx} className="border-b border-line hover:bg-paper-alt/50 transition-colors">
                            <td className="p-4 text-[13px] font-mono font-bold text-foreground">{infra.value}</td>
                            <td className="p-4">
                              <Badge variant="default" className="bg-line text-ink-mid border-none">{infra.type}</Badge>
                            </td>
                            <td className="p-4">
                              {infra.active ? (
                                <span className="flex items-center gap-1.5 text-[11px] font-bold text-red uppercase animate-pulse">
                                  <Activity size={12} /> Active
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-[11px] font-bold text-ink-mid uppercase">
                                  <Server size={12} /> Offline
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
