import React, { useState } from 'react';
import { 
  Calendar, Download, FileText, AlertTriangle, Activity, 
  ShieldAlert, ChevronRight, Zap, Terminal, Share2, BookOpen
} from 'lucide-react';
import { 
  Card, Button, H1, H2, H3, Text, Small, PageHeader
} from '../components/ui/design-system';

export const WeeklyAdvisory: React.FC = () => {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadIoc = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert('Downloading Weekly IoC Bundle (JSON/CSV) - Signature Validated');
    }, 1500);
  };

  const topCves = [
    { id: 'CVE-2026-1140', cvss: 9.8, name: 'CloudEdge RCE', desc: 'Pre-auth remote code execution in edge gateways.', active: true },
    { id: 'CVE-2026-2001', cvss: 8.4, name: 'VaultCore Bypass', desc: 'Authentication bypass via crafted token injection.', active: true },
    { id: 'CVE-2026-1055', cvss: 7.8, name: 'OSSync LPE', desc: 'Local privilege escalation in background sync services.', active: false },
    { id: 'CVE-2026-3022', cvss: 9.1, name: 'HyperVisor Escape', desc: 'Memory corruption leading to VM escape.', active: false },
    { id: 'CVE-2026-0044', cvss: 6.5, name: 'WebDash XSS', desc: 'Stored cross-site scripting in management portal.', active: false },
  ];

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 md:gap-8 bg-background min-h-full">
      
      {/* ── HEADER ── */}
      <PageHeader
        title="Weekly Threat Advisory (Vol. 42)"
        description="Consolidated intelligence briefing, active weaponized vulnerabilities, and recommended defensive mitigations."
        breadcrumbs={[
          { label: 'Threat Intelligence' },
          { label: 'Weekly Advisory' }
        ]}
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <Share2 size={13} />
              <span>Share</span>
            </Button>
            <Button variant="primary" size="sm" onClick={() => window.print()} className="gap-1.5">
              <FileText size={13} />
              <span>Export Briefing</span>
            </Button>
          </div>
        }
      />

      {/* ── AI EXECUTIVE SUMMARY ── */}
      <div className="relative bg-gradient-to-br from-indigo-500/5 to-transparent border border-line rounded-2xl p-6 overflow-hidden shadow-sm flex flex-col gap-3.5 print:bg-white print:border-black print:from-white">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none print:hidden" />
        
        <div className="flex items-center gap-2 mb-1">
          <Zap size={14} className="text-indigo-500" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-500">Executive Summary</span>
        </div>
        
        <p className="text-[14px] leading-relaxed text-foreground print:text-black font-medium">
          This week was dominated by a surge in automated exploitation attempts against <span className="text-red font-bold">CVE-2026-1140</span> targeting perimeter infrastructure. We also observed a 40% week-over-week increase in identity-based attacks correlated with the <span className="text-blue font-bold">Lazarus Group</span> targeting the financial sector. Organizations are advised to prioritize edge-gateway patching and enforce strict conditional access policies.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Left Column: Top CVEs & IOCs */}
        <div className="xl:col-span-2 flex flex-col gap-6 lg:gap-8">
          
          <Card className="print:border-black">
             <div className="p-4 border-b border-line flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <ShieldAlert size={16} className="text-red" />
                   <H3 className="text-[13px] font-bold uppercase tracking-wider">Top 5 Trending CVEs</H3>
                </div>
                <Small>Highest exploitation volume this week</Small>
             </div>
             <div className="p-0 flex flex-col">
               {topCves.map((cve, idx) => (
                 <div key={cve.id} className={`p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${idx !== topCves.length - 1 ? 'border-b border-line' : ''}`}>
                    <div className="flex items-center gap-4 flex-1">
                       <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-paper-alt border border-line shrink-0">
                          <span className={`text-[14px] font-black ${cve.cvss >= 9 ? 'text-red' : cve.cvss >= 7 ? 'text-amber-500' : 'text-blue'}`}>
                             {cve.cvss}
                          </span>
                       </div>
                       <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                             <span className="text-[14px] font-bold text-foreground font-mono">{cve.id}</span>
                             {cve.active && (
                               <span className="px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-widest bg-red/10 text-red border border-red/20">
                                 Active Exploitation
                               </span>
                             )}
                          </div>
                          <span className="text-[12px] font-semibold text-foreground mt-0.5">{cve.name}</span>
                          <span className="text-[11px] text-ink-mid line-clamp-1">{cve.desc}</span>
                       </div>
                    </div>
                    <Button variant="secondary" size="sm" className="shrink-0 print:hidden">View Intel</Button>
                 </div>
               ))}
             </div>
          </Card>

          {/* IOC Download Banner */}
          <div className="p-6 bg-paper-alt border border-line rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 print:border-black print:bg-white">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue/10 border border-blue/20 flex items-center justify-center text-blue shrink-0">
                   <Terminal size={20} />
                </div>
                <div className="flex flex-col gap-1">
                   <H3 className="text-[15px] font-bold text-foreground">Weekly Indicator Bundle (IoC)</H3>
                   <Text className="text-[12px] text-ink-mid">Download a curated CSV bundle of 1,492 high-confidence indicators extracted from this week's campaigns.</Text>
                </div>
             </div>
             <Button 
               variant="primary" 
               size="lg" 
               onClick={handleDownloadIoc} 
               disabled={downloading}
               className="gap-2 shrink-0 w-full md:w-auto"
             >
               {downloading ? (
                 <Activity size={16} className="animate-spin" />
               ) : (
                 <Download size={16} />
               )}
               <span>{downloading ? 'Compiling Package...' : 'Download IOCs'}</span>
             </Button>
          </div>

        </div>

        {/* Right Column: Campaign Spotlight */}
        <div className="flex flex-col gap-6 lg:gap-8">
           
           <Card className="print:border-black h-full flex flex-col">
             <div className="p-4 border-b border-line bg-red/5 rounded-t-xl print:bg-white print:border-b-2">
                <div className="flex items-center gap-2 mb-1">
                   <Target size={14} className="text-red" />
                   <span className="text-[10px] font-bold uppercase tracking-widest text-red">Campaign Spotlight</span>
                </div>
                <H2 className="text-[18px] font-extrabold text-foreground">Lazarus Group: Operation GhostNet</H2>
             </div>
             
             <div className="p-5 flex flex-col gap-5 flex-1">
                <div className="flex flex-col gap-1.5">
                   <span className="text-[10px] font-bold text-ink-mid uppercase tracking-widest">Primary Objective</span>
                   <Text className="text-[13px] text-foreground font-medium">Financial theft and espionage targeting Southeast Asian banking infrastructure.</Text>
                </div>

                <div className="flex flex-col gap-1.5">
                   <span className="text-[10px] font-bold text-ink-mid uppercase tracking-widest">Observed TTPs (MITRE)</span>
                   <div className="flex flex-wrap gap-2">
                      {['T1566.001 - Spearphishing', 'T1059.001 - PowerShell', 'T1071.001 - Web Protocols', 'T1105 - Ingress Tool Transfer'].map(t => (
                         <span key={t} className="px-2 py-1 rounded-md bg-paper border border-line text-[10px] font-mono font-semibold text-ink-mid">
                           {t}
                         </span>
                      ))}
                   </div>
                </div>

                <div className="flex flex-col gap-1.5 mt-auto">
                   <span className="text-[10px] font-bold text-ink-mid uppercase tracking-widest">Mitigation Strategy</span>
                   <p className="text-[12px] leading-relaxed text-foreground bg-paper border border-line p-3 rounded-xl border-l-2 border-l-blue">
                      Enforce strict execution policies on PowerShell scripts and closely monitor anomalous outbound traffic to newly registered domains within the last 30 days.
                   </p>
                </div>
             </div>
           </Card>

        </div>

      </div>

    </div>
  );
};

// Assuming Target icon is missing from import above, adding it here for completeness:
import { Target } from 'lucide-react';
