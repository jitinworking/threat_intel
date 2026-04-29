import React, { useState } from 'react';
import { Terminal, Copy, Search, Shield, Zap, Info } from 'lucide-react';

interface HuntingRule {
  id: string;
  name: string;
  tactic: string;
  description: string;
  kql: string;
  spl: string;
}

const hunterRules: HuntingRule[] = [
  {
    id: 'HUNT-001',
    name: 'Suspicious PowerShell DownloadString',
    tactic: 'Execution',
    description: 'Detects PowerShell processes downloading and executing content from the internet.',
    kql: 'DeviceProcessEvents\n| where ProcessCommandLine has "DownloadString"\n| where ProcessCommandLine has "Net.WebClient"',
    spl: 'index=network tag=process "DownloadString" "Net.WebClient"'
  },
  {
    id: 'HUNT-002',
    name: 'LSASS Memory Dumping (ProcDump)',
    tactic: 'Credential Access',
    description: 'Detects ProcDump execution with parameters known for dumping LSASS memory.',
    kql: 'DeviceProcessEvents\n| where FileName =~ "procdump.exe"\n| where ProcessCommandLine has_any ("lsass", "0x123", "-ma")',
    spl: 'index=windows sourcetype=XmlWinEventLog:Microsoft-Windows-Sysmon/Operational Image="*procdump.exe" CommandLine="* -ma *lsass*"'
  },
  {
    id: 'HUNT-003',
    name: 'Cobalt Strike Default Named Pipe',
    tactic: 'Command and Control',
    description: 'Detects the creation of default named pipes used by Cobalt Strike Beacons.',
    kql: 'DeviceEvents\n| where ActionType == "NamedPipeEvent"\n| where AdditionalFields.PipeName has_any ("msagent_", "postex_")',
    spl: 'index=endpoint tag=network pipe_name="\\\\msagent_*" OR pipe_name="\\\\postex_*"'
  },
  {
    id: 'HUNT-004',
    name: 'Active Directory Enumeration (SharpHound)',
    tactic: 'Discovery',
    description: 'Detects the execution of BloodHound/SharpHound for AD reconnaissance.',
    kql: 'DeviceProcessEvents\n| where FileName =~ "SharpHound.exe" or ProcessCommandLine has "Invoke-BloodHound"',
    spl: 'index=windows sourcetype="XmlWinEventLog:Microsoft-Windows-Sysmon/Operational" (Image="*SharpHound.exe" OR CommandLine="*Invoke-BloodHound*")'
  },
  {
    id: 'HUNT-005',
    name: 'Rare Ingress from Tor Exit Nodes',
    tactic: 'Initial Access',
    description: 'Identifies network connections originating from known Tor exit nodes.',
    kql: 'let torIPs = externaldata(ip:string) [h"https://check.torproject.org/exit-addresses"];\nDeviceNetworkEvents\n| where RemoteIP in (torIPs)',
    spl: 'index=firewall [| inputlookup tor_exit_nodes | rename ip as src_ip | fields src_ip]'
  },
  {
    id: 'HUNT-006',
    name: 'AWS S3 Bucket Exfiltration (Rclone)',
    tactic: 'Exfiltration',
    description: 'Detects rclone execution with "copy" or "sync" parameters targeting cloud storage.',
    kql: 'DeviceProcessEvents\n| where FileName =~ "rclone.exe"\n| where ProcessCommandLine has_any ("copy", "sync", "move")\n| where ProcessCommandLine has_any ("s3:", "gcs:", "azure:")',
    spl: 'index=endpoint Image="*rclone.exe" (CommandLine="*copy*" OR CommandLine="*sync*")'
  }
];

export const HuntingHub: React.FC = () => {
  const [selectedRule, setSelectedRule] = useState<HuntingRule | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRules = hunterRules.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.tactic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Query copied to clipboard!');
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Terminal className="text-secondary" size={28} /> Hunting Hub
          </h1>
          <p className="text-muted text-sm mt-1">Convert TTPs into actionable hunting queries for your SIEM.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Rules List */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="glass-panel p-4 flex items-center gap-3 border-white/10">
            <Search size={16} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search tactics or rules..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent border-none text-sm text-main outline-none flex-1"
            />
          </div>
          
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
            {filteredRules.map(rule => (
              <button 
                key={rule.id}
                onClick={() => setSelectedRule(rule)}
                className={`text-left p-4 rounded-xl border transition-all ${selectedRule?.id === rule.id ? 'bg-secondary/15 border-secondary/40' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
              >
                <div className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">{rule.tactic}</div>
                <div className="text-sm font-bold text-white mb-2">{rule.name}</div>
                <div className="text-[11px] text-muted line-clamp-2 italic">"{rule.description}"</div>
              </button>
            ))}
          </div>
        </div>

        {/* Query Display */}
        <div className="lg:col-span-8">
          {selectedRule ? (
            <div className="flex flex-col gap-6 h-full">
              <div className="glass-panel p-6 border-l-4 border-l-secondary h-full flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">{selectedRule.name}</h2>
                    <p className="text-sm text-muted">{selectedRule.description}</p>
                  </div>
                  <div className="badge badge-secondary">{selectedRule.id}</div>
                </div>

                <div className="flex flex-col gap-6 flex-1">
                  {/* KQL Section */}
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                        <Zap size={14} /> AZURE SENTINEL / MDE (KQL)
                      </div>
                      <button onClick={() => copyToClipboard(selectedRule.kql)} className="text-[10px] flex items-center gap-1.5 hover:text-white text-muted transition-colors">
                        <Copy size={12} /> COPY KQL
                      </button>
                    </div>
                    <pre className="p-4 bg-slate-950/80 rounded-lg border border-white/10 text-xs font-mono text-slate-300 overflow-x-auto">
                      {selectedRule.kql}
                    </pre>
                  </div>

                  {/* SPL Section */}
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
                        <Shield size={14} /> SPLUNK (SPL)
                      </div>
                      <button onClick={() => copyToClipboard(selectedRule.spl)} className="text-[10px] flex items-center gap-1.5 hover:text-white text-muted transition-colors">
                        <Copy size={12} /> COPY SPL
                      </button>
                    </div>
                    <pre className="p-4 bg-slate-950/80 rounded-lg border border-white/10 text-xs font-mono text-slate-300 overflow-x-auto">
                      {selectedRule.spl}
                    </pre>
                  </div>

                  <div className="mt-auto p-4 bg-blue-500/5 rounded-lg border border-blue-500/20 flex items-start gap-3">
                    <Info className="text-primary shrink-0" size={16} />
                    <p className="text-[11px] text-muted">
                      <span className="font-bold text-primary italic">Analyst Note:</span> This rule focuses on behavior-based detection. Ensure your data sources (Sysmon Event ID 1 or MDE DeviceProcessEvents) are correctly configured for maximum visibility.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel h-full flex flex-col items-center justify-center p-12 text-center opacity-50">
              <Terminal size={48} className="text-muted mb-4" />
              <h3 className="text-lg font-bold text-white">Select a Hunting Rule</h3>
              <p className="text-sm text-muted mt-2">Choose a rule from the left column to view implementation details and SIEM queries.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
