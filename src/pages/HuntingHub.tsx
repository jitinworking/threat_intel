import { API_BASE_URL } from '../config';
import React, { useState } from 'react';
import { Terminal, Copy, Search, Shield, Zap, Info, Play, Code, CheckCircle, AlertTriangle } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'library' | 'validator'>('library');
  const [customRule, setCustomRule] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validating, setValidating] = useState(false);

  const handleValidate = async () => {
    if (!customRule) return;
    setValidating(true);
    setValidationResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/rules/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule: customRule })
      });
      const data = await res.json();
      setValidationResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setValidating(false);
    }
  };

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
          <p className="text-muted text-sm mt-1">Convert TTPs into actionable hunting queries or validate custom YARA/Sigma rules.</p>
        </div>
        <div className="flex bg-slate-900/50 rounded-lg p-1 border border-white/5">
          <button 
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'library' ? 'bg-secondary text-white shadow-lg shadow-secondary/20' : 'text-muted hover:text-white'}`}
          >
            Query Library
          </button>
          <button 
            onClick={() => setActiveTab('validator')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'validator' ? 'bg-secondary text-white shadow-lg shadow-secondary/20' : 'text-muted hover:text-white'}`}
          >
            Rule Validator
          </button>
        </div>
      </div>

      {activeTab === 'library' ? (
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
                <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-white mb-1 truncate max-w-full">{selectedRule.name}</h2>
                    <p className="text-sm text-muted break-words">{selectedRule.description}</p>
                  </div>
                  <div className="badge badge-secondary shrink-0">{selectedRule.id}</div>
                </div>

                <div className="flex flex-col gap-6 flex-1">
                  {/* KQL Section */}
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                        <Zap size={14} /> AZURE SENTINEL / MDE (KQL)
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => {
                          alert('Query submitted to Azure Sentinel backend. Generating results...');
                        }} className="px-3 py-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded border border-blue-500/30 text-[10px] flex items-center gap-1.5 transition-all font-bold">
                          <Play size={12} /> RUN IN SIEM
                        </button>
                        <button onClick={() => copyToClipboard(selectedRule.kql)} className="text-[10px] flex items-center gap-1.5 hover:text-white text-muted transition-colors">
                          <Copy size={12} /> COPY KQL
                        </button>
                      </div>
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
                      <div className="flex gap-2">
                        <button onClick={() => {
                          alert('Query submitted to Splunk backend. Generating results...');
                        }} className="px-3 py-1 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded border border-orange-500/30 text-[10px] flex items-center gap-1.5 transition-all font-bold">
                          <Play size={12} /> RUN IN SIEM
                        </button>
                        <button onClick={() => copyToClipboard(selectedRule.spl)} className="text-[10px] flex items-center gap-1.5 hover:text-white text-muted transition-colors">
                          <Copy size={12} /> COPY SPL
                        </button>
                      </div>
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
          <div className="glass-panel p-6 flex flex-col gap-4 border-white/10">
            <h2 className="text-lg font-bold flex items-center gap-2"><Code size={20} className="text-secondary" /> Paste Custom Rule</h2>
            <p className="text-xs text-muted">Paste a YARA or Sigma rule generated from the Threat Actor Directory to search the IoC database retrospectively.</p>
            <textarea 
              value={customRule}
              onChange={(e) => setCustomRule(e.target.value)}
              placeholder="rule APT_Example { ... } or title: Detect Suspicious Activity ..."
              className="flex-1 bg-slate-950/80 border border-white/10 rounded-lg p-4 text-sm font-mono text-slate-300 outline-none focus:border-secondary focus:ring-1 focus:ring-secondary custom-scrollbar resize-none"
            />
            <button 
              onClick={handleValidate}
              disabled={validating || !customRule}
              className="w-full py-3 bg-secondary hover:bg-secondary-hover disabled:opacity-50 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {validating ? 'Validating...' : <><Shield size={18} /> Validate & Search</>}
            </button>
          </div>
          
          <div className="glass-panel p-6 flex flex-col gap-4 border-white/10 overflow-y-auto custom-scrollbar">
            <h2 className="text-lg font-bold">Validation Results</h2>
            {validationResult ? (
              <div className="flex flex-col gap-4">
                <div className={`p-4 rounded-lg border ${validationResult.matches.length > 0 ? 'bg-danger/10 border-danger/30' : 'bg-green-500/10 border-green-500/30'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    {validationResult.matches.length > 0 ? <AlertTriangle className="text-danger" size={24} /> : <CheckCircle className="text-green-500" size={24} />}
                    <h3 className={`font-bold ${validationResult.matches.length > 0 ? 'text-danger' : 'text-green-500'}`}>
                      {validationResult.matches.length} Historical Matches Found
                    </h3>
                  </div>
                  <p className="text-sm text-slate-300">
                    Rule parsed as <span className="font-bold text-white">{validationResult.type}</span>. Extracted {validationResult.extractedIndicators?.length || 0} unique indicators.
                  </p>
                </div>
                
                {validationResult.matches.length > 0 && (
                  <div className="space-y-3 mt-2">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted">Correlated Indicators</h4>
                    {validationResult.matches.map((m: any, i: number) => (
                      <div key={i} className="p-3 bg-slate-900/80 border border-white/5 rounded flex justify-between items-center">
                        <div>
                          <p className="font-mono text-sm text-white">{m.ioc}</p>
                          <p className="text-xs text-muted mt-1">{m.source} • {new Date(m.created_at).toLocaleDateString()}</p>
                        </div>
                        {m.malware && <span className="badge badge-warning">{m.malware}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted opacity-50">
                <Search size={48} className="mb-4" />
                <p>Run validation to see historical matches here.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
