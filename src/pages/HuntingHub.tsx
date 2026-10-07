import React, { useState } from 'react';
import { 
  Terminal, Copy, Search, Shield, Play, 
  FileCode2, FileText, Check, ArrowRight, Sparkles
} from 'lucide-react';
import { 
  PageHeader, FilterBar, CodeViewer, Button, Badge, 
  Input, EmptyState, Dropdown 
} from '../components/ui/design-system';

interface HuntingRule {
  id: string;
  name: string;
  tactic: string;
  technique: string;
  description: string;
  kql: string;
  spl: string;
}

const HUNTER_RULES: HuntingRule[] = [
  {
    id: 'HUNT-001',
    name: 'Suspicious PowerShell DownloadString',
    tactic: 'Execution',
    technique: 'T1059.001',
    description: 'Detects PowerShell processes downloading and in-memory executing payloads from remote servers.',
    kql: `DeviceProcessEvents
| where ProcessCommandLine has "DownloadString"
| where ProcessCommandLine has "Net.WebClient" or ProcessCommandLine has "iwr"
| project TimeGenerated, DeviceName, AccountName, ProcessCommandLine`,
    spl: `index=endpoint (process_name="powershell.exe" OR process_name="pwsh.exe")
(CommandLine="*DownloadString*" OR CommandLine="*Net.WebClient*")
| table _time, host, user, CommandLine`
  },
  {
    id: 'HUNT-002',
    name: 'LSASS Memory Dumping via ProcDump / comsvcs',
    tactic: 'Credential Access',
    technique: 'T1003.001',
    description: 'Detects memory dump operations against the Local Security Authority Subsystem Service (LSASS).',
    kql: `DeviceProcessEvents
| where FileName =~ "procdump.exe" or ProcessCommandLine has "comsvcs.dll"
| where ProcessCommandLine has_any ("lsass", "0x123", "-ma", "MiniDump")
| project TimeGenerated, DeviceName, InitiatingProcessFileName, ProcessCommandLine`,
    spl: `index=windows sourcetype="XmlWinEventLog:Microsoft-Windows-Sysmon/Operational" EventCode=1
(CommandLine="*procdump*" OR CommandLine="*comsvcs.dll*") CommandLine="*lsass*"
| table _time, Computer, ParentImage, CommandLine`
  },
  {
    id: 'HUNT-003',
    name: 'Cobalt Strike Default Named Pipe Artifacts',
    tactic: 'Command and Control',
    technique: 'T1071',
    description: 'Detects the creation of default IPC named pipes utilized by Cobalt Strike malleable C2 profiles.',
    kql: `DeviceEvents
| where ActionType == "NamedPipeEvent"
| where AdditionalFields.PipeName has_any ("msagent_", "postex_", "status_", "mojo.")
| project TimeGenerated, DeviceName, InitiatingProcessFileName, AdditionalFields.PipeName`,
    spl: `index=endpoint tag=network (pipe_name="\\\\msagent_*" OR pipe_name="\\\\postex_*")
| table _time, host, process, pipe_name`
  },
  {
    id: 'HUNT-004',
    name: 'Active Directory BloodHound Reconnaissance',
    tactic: 'Discovery',
    technique: 'T1087',
    description: 'Detects SharpHound / BloodHound active directory collection parameters and LDAP query floods.',
    kql: `DeviceProcessEvents
| where FileName =~ "SharpHound.exe" or ProcessCommandLine has "Invoke-BloodHound"
| project TimeGenerated, DeviceName, AccountName, ProcessCommandLine`,
    spl: `index=windows (Image="*SharpHound.exe" OR CommandLine="*Invoke-BloodHound*")
| stats count by host, user, CommandLine`
  },
  {
    id: 'HUNT-005',
    name: 'AWS S3 / Azure Blob Storage Exfiltration (Rclone)',
    tactic: 'Exfiltration',
    technique: 'T1567.002',
    description: 'Identifies rclone tool executions transmitting bulk enterprise archives to public cloud object storage.',
    kql: `DeviceProcessEvents
| where FileName =~ "rclone.exe"
| where ProcessCommandLine has_any ("copy", "sync", "move")
| where ProcessCommandLine has_any ("s3:", "gcs:", "azure:")
| project TimeGenerated, DeviceName, AccountName, ProcessCommandLine`,
    spl: `index=endpoint (Image="*rclone.exe" AND (CommandLine="*copy*" OR CommandLine="*sync*"))
| table _time, host, user, CommandLine`
  }
];

export const HuntingHub: React.FC = () => {
  const [selectedRule, setSelectedRule] = useState<HuntingRule>(HUNTER_RULES[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tacticFilter, setTacticFilter] = useState('');
  const [queryLanguage, setQueryLanguage] = useState<'kql' | 'spl'>('kql');

  // Translator Tab
  const [activeTab, setActiveTab] = useState<'library' | 'translator'>('library');
  const [sigmaInput, setSigmaInput] = useState(`title: Suspicious Certutil Download
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    Image|endswith: '\\certutil.exe'
    CommandLine|contains:
      - '-urlcache'
      - '-split'
  condition: selection`);

  const [translatedKql, setTranslatedKql] = useState('');
  const [translatedSpl, setTranslatedSpl] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = () => {
    setIsTranslating(true);
    setTimeout(() => {
      setTranslatedKql(`DeviceProcessEvents
| where FileName =~ "certutil.exe"
| where ProcessCommandLine has_any ("-urlcache", "-split")
| project TimeGenerated, DeviceName, AccountName, ProcessCommandLine`);

      setTranslatedSpl(`index=windows sourcetype="XmlWinEventLog:Microsoft-Windows-Sysmon/Operational"
Image="*certutil.exe" (CommandLine="*-urlcache*" OR CommandLine="*-split*")
| table _time, Computer, CommandLine`);
      setIsTranslating(false);
    }, 400);
  };

  const filteredRules = HUNTER_RULES.filter(rule => {
    const matchSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        rule.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTactic = tacticFilter ? rule.tactic === tacticFilter : true;
    return matchSearch && matchTactic;
  });

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
      
      {/* ── Page Header ── */}
      <PageHeader
        title="Threat Hunting Playground"
        description="Curated threat hunting library, MITRE ATT&CK tactic mappings, and cross-platform detection query translation."
        breadcrumbs={[
          { label: 'Hunting & Investigation' },
          { label: 'Hunting Playground' }
        ]}
        actions={
          <div className="flex items-center gap-1 bg-surface border border-border rounded p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('library')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                activeTab === 'library' ? 'bg-surface-elevated text-primary font-semibold' : 'text-text-muted hover:text-text'
              }`}
            >
              Hunting Rules Library
            </button>
            <button
              onClick={() => setActiveTab('translator')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                activeTab === 'translator' ? 'bg-surface-elevated text-primary font-semibold' : 'text-text-muted hover:text-text'
              }`}
            >
              Sigma Query Translator
            </button>
          </div>
        }
      />

      {activeTab === 'library' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* ── Left: Rules List ── */}
          <div className="lg:col-span-5 space-y-3">
            <FilterBar
              search={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search detection rules..."
              hasActiveFilters={Boolean(searchTerm || tacticFilter)}
              onClear={() => { setSearchTerm(''); setTacticFilter(''); }}
            >
              <Dropdown
                options={[
                  { value: '', label: 'All MITRE Tactics' },
                  { value: 'Execution', label: 'Execution' },
                  { value: 'Credential Access', label: 'Credential Access' },
                  { value: 'Command and Control', label: 'Command & Control' },
                  { value: 'Discovery', label: 'Discovery' },
                  { value: 'Exfiltration', label: 'Exfiltration' }
                ]}
                value={tacticFilter}
                onChange={e => setTacticFilter(e.target.value)}
              />
            </FilterBar>

            <div className="space-y-2">
              {filteredRules.map(rule => {
                const isSelected = selectedRule.id === rule.id;
                return (
                  <div
                    key={rule.id}
                    onClick={() => setSelectedRule(rule)}
                    className={`p-3.5 rounded border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-surface-elevated border-primary/40 shadow-xs'
                        : 'bg-surface border-border hover:bg-surface-hover'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-[10px] font-bold text-text-muted">
                        {rule.id}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="info">{rule.tactic}</Badge>
                        <span className="font-mono text-[10px] text-text-muted">{rule.technique}</span>
                      </div>
                    </div>

                    <h4 className="text-xs font-semibold text-text mb-1">
                      {rule.name}
                    </h4>
                    <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                      {rule.description}
                    </p>
                  </div>
                );
              })}

              {!filteredRules.length && (
                <EmptyState title="No matching rules" description="Try selecting a different MITRE tactic or keyword." />
              )}
            </div>
          </div>

          {/* ── Right: Query Viewer & Inspector ── */}
          <div className="lg:col-span-7 bg-surface border border-border rounded flex flex-col">
            <div className="px-5 py-3.5 border-b border-border bg-surface-elevated flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] text-text-muted font-bold block">{selectedRule.id} · {selectedRule.technique}</span>
                <h3 className="text-sm font-bold text-text mt-0.5">{selectedRule.name}</h3>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center border border-border rounded bg-surface p-0.5 text-xs">
                <button
                  onClick={() => setQueryLanguage('kql')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    queryLanguage === 'kql' ? 'bg-surface-elevated text-primary font-semibold' : 'text-text-muted hover:text-text'
                  }`}
                >
                  Microsoft Sentinel (KQL)
                </button>
                <button
                  onClick={() => setQueryLanguage('spl')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    queryLanguage === 'spl' ? 'bg-surface-elevated text-primary font-semibold' : 'text-text-muted hover:text-text'
                  }`}
                >
                  Splunk (SPL)
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4 flex-1">
              <div>
                <span className="text-xs font-semibold text-text uppercase tracking-wider block mb-1">Detection Logic</span>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {selectedRule.description}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-text uppercase tracking-wider block mb-2">
                  {queryLanguage === 'kql' ? 'Kusto Query Language' : 'Search Processing Language'}
                </span>
                <CodeViewer
                  code={queryLanguage === 'kql' ? selectedRule.kql : selectedRule.spl}
                  language={queryLanguage.toUpperCase()}
                />
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* ── Translator Mode ── */
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text">Sigma Rule Specification Input (YAML)</span>
              <Button
                variant="primary"
                size="sm"
                onClick={handleTranslate}
                disabled={isTranslating}
                className="gap-1.5"
              >
                <Sparkles size={13} /> Translate Detection Rule
              </Button>
            </div>
            <textarea
              value={sigmaInput}
              onChange={e => setSigmaInput(e.target.value)}
              rows={8}
              className="w-full bg-surface-elevated border border-border rounded p-3 font-mono text-xs text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface border border-border rounded p-4">
              <span className="text-xs font-semibold text-text block mb-2">Generated Microsoft Sentinel (KQL)</span>
              {translatedKql ? (
                <CodeViewer code={translatedKql} language="KQL" />
              ) : (
                <div className="p-6 text-center text-xs text-text-muted border border-dashed border-border rounded">
                  Click 'Translate Detection Rule' to generate query.
                </div>
              )}
            </div>

            <div className="bg-surface border border-border rounded p-4">
              <span className="text-xs font-semibold text-text block mb-2">Generated Splunk (SPL)</span>
              {translatedSpl ? (
                <CodeViewer code={translatedSpl} language="SPL" />
              ) : (
                <div className="p-6 text-center text-xs text-text-muted border border-dashed border-border rounded">
                  Click 'Translate Detection Rule' to generate query.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
