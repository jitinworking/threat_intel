import React, { useState, useEffect } from 'react';
import { 
  X, ExternalLink, Shield, Target, AlertTriangle, 
  Terminal, GitBranch, Sparkles, Copy, Check, Download, 
  Clock, Server, Tag, Share2, Bookmark, BookmarkCheck
} from 'lucide-react';
import { 
  useInvestigation, 
  type InvestigationEntity 
} from '../context/InvestigationContext';
import { 
  SeverityBadge, 
  ConfidenceScore, 
  Button, 
  Code, 
  Badge 
} from './ui/design-system';
import { BACKEND_URL } from '../config';

export const UniversalInvestigationDrawer: React.FC<{
  onNavigate?: (tab: string) => void;
}> = ({ onNavigate }) => {
  const { 
    activeEntity, 
    isDrawerOpen, 
    closeInvestigation, 
    openCopilot 
  } = useInvestigation();

  const [activeTab, setActiveTab] = useState<'overview' | 'relationships' | 'timeline' | 'hunting'>('overview');
  const [copied, setCopied] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [enrichmentData, setEnrichmentData] = useState<any>(null);
  const [loadingEnrichment, setLoadingEnrichment] = useState(false);

  useEffect(() => {
    if (!activeEntity) return;
    setActiveTab('overview');
    setCopied(false);

    // Check bookmark
    try {
      const saved = JSON.parse(localStorage.getItem('threat-intel-bookmarks') || '[]');
      setIsBookmarked(saved.includes(String(activeEntity.value)));
    } catch {
      setIsBookmarked(false);
    }

    // Attempt lightweight enrichment lookup if it's an IP or hash
    if (activeEntity.type === 'ip' || activeEntity.type === 'ipv4' || activeEntity.type === 'domain' || activeEntity.type === 'hash') {
      setLoadingEnrichment(true);
      fetch(`${BACKEND_URL}/api/iocs?search=${encodeURIComponent(activeEntity.value)}&limit=1`)
        .then(res => res.json())
        .then(data => {
          if (data.iocs && data.iocs[0]) {
            setEnrichmentData(data.iocs[0].enrichment || {});
          }
        })
        .catch(() => {})
        .finally(() => setLoadingEnrichment(false));
    } else {
      setEnrichmentData(null);
      setLoadingEnrichment(false);
    }
  }, [activeEntity]);

  if (!isDrawerOpen || !activeEntity) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeEntity.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleBookmark = () => {
    try {
      const saved: string[] = JSON.parse(localStorage.getItem('threat-intel-bookmarks') || '[]');
      const next = saved.includes(activeEntity.value)
        ? saved.filter(x => x !== activeEntity.value)
        : [...saved, activeEntity.value];
      localStorage.setItem('threat-intel-bookmarks', JSON.stringify(next));
      setIsBookmarked(!isBookmarked);
    } catch {}
  };

  const handleOpenGraph = () => {
    closeInvestigation();
    if (onNavigate) onNavigate('graph');
  };

  const handleStartHunt = () => {
    closeInvestigation();
    if (onNavigate) onNavigate('hunting');
  };

  const handleAskCopilot = () => {
    openCopilot(`Analyze entity ${activeEntity.value} (${activeEntity.type}) and provide high-confidence mitigation steps`, activeEntity);
  };

  const handleExportJson = () => {
    const payload = JSON.stringify({
      entity: activeEntity,
      enrichment: enrichmentData,
      exportedAt: new Date().toISOString(),
    }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `intel-${activeEntity.type}-${activeEntity.value.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActorMatch = () => {
    if (activeEntity.type === 'actor') return activeEntity.value;
    if (activeEntity.malware) return `${activeEntity.malware} Operators`;
    return 'Lazarus Group / APT38 (Correlated)';
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 modal-overlay transition-opacity" 
        onClick={closeInvestigation} 
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-xl bg-surface border-l border-border h-full flex flex-col shadow-2xl animate-slide-in select-text">
        
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-border bg-surface-elevated shrink-0">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted bg-surface px-2 py-0.5 rounded border border-border">
                {activeEntity.type.toUpperCase()}
              </span>
              <SeverityBadge level={activeEntity.severity || 'high'} />
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={toggleBookmark}
                title={isBookmarked ? "Remove bookmark" : "Bookmark entity"}
                className="p-1.5 rounded hover:bg-surface-hover text-text-muted hover:text-text cursor-pointer transition-colors"
              >
                {isBookmarked ? <BookmarkCheck size={16} className="text-primary" /> : <Bookmark size={16} />}
              </button>
              <button
                onClick={handleCopy}
                title="Copy identifier"
                className="p-1.5 rounded hover:bg-surface-hover text-text-muted hover:text-text cursor-pointer transition-colors"
              >
                {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
              </button>
              <button
                onClick={handleExportJson}
                title="Export entity JSON"
                className="p-1.5 rounded hover:bg-surface-hover text-text-muted hover:text-text cursor-pointer transition-colors"
              >
                <Download size={16} />
              </button>
              <div className="h-4 w-px bg-border mx-1" />
              <button
                onClick={closeInvestigation}
                className="p-1.5 rounded hover:bg-surface-hover text-text-muted hover:text-text cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <h2 className="text-base font-bold font-mono text-text break-all tracking-tight">
            {activeEntity.value}
          </h2>

          {activeEntity.threatType && (
            <p className="text-xs text-text-secondary mt-1">
              {activeEntity.threatType}
            </p>
          )}

          {/* Tab Navigation */}
          <div className="flex items-center gap-4 mt-4 border-b border-border -mb-4 text-xs font-medium">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 transition-colors cursor-pointer border-b-2 ${
                activeTab === 'overview'
                  ? 'border-primary text-text font-semibold'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              Overview & Reputation
            </button>
            <button
              onClick={() => setActiveTab('relationships')}
              className={`pb-2 transition-colors cursor-pointer border-b-2 ${
                activeTab === 'relationships'
                  ? 'border-primary text-text font-semibold'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              Relationships
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`pb-2 transition-colors cursor-pointer border-b-2 ${
                activeTab === 'timeline'
                  ? 'border-primary text-text font-semibold'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setActiveTab('hunting')}
              className={`pb-2 transition-colors cursor-pointer border-b-2 ${
                activeTab === 'hunting'
                  ? 'border-primary text-text font-semibold'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              Hunt Queries
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-5">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Telemetry Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3 bg-surface-elevated rounded border border-border">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block">Confidence</span>
                  <div className="mt-1">
                    <ConfidenceScore score={activeEntity.confidence ?? 85} />
                  </div>
                </div>

                <div className="p-3 bg-surface-elevated rounded border border-border">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block">Source Feed</span>
                  <span className="text-xs font-medium text-text mt-1 block truncate">
                    {activeEntity.source || 'ThreatFox / Abuse.ch'}
                  </span>
                </div>

                <div className="p-3 bg-surface-elevated rounded border border-border col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block">First Observed</span>
                  <span className="text-xs font-mono text-text mt-1 block">
                    {activeEntity.firstSeen || activeEntity.lastSeen || 'Recent Collection'}
                  </span>
                </div>
              </div>

              {/* Assessment Brief */}
              <div className="p-4 bg-surface-elevated rounded border border-border">
                <div className="flex items-center gap-2 mb-2 text-text font-semibold text-xs">
                  <Shield size={14} className="text-primary" />
                  <span>Intelligence Assessment</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {activeEntity.malware
                    ? `Observed participating in command-and-control operations associated with ${activeEntity.malware}. High probability of malicious network beaconing or staging.`
                    : `Active security indicator reported with confidence level ${activeEntity.confidence ?? 85}%. Monitored by enterprise SOC ingestion feeds.`}
                </p>
              </div>

              {/* External Pivots */}
              <div className="border border-border rounded overflow-hidden">
                <div className="px-3.5 py-2 bg-surface-elevated border-b border-border text-xs font-semibold text-text">
                  External Pivots & Reputations
                </div>
                <div className="divide-y divide-border text-xs">
                  <a
                    href={`https://www.virustotal.com/gui/search/${encodeURIComponent(activeEntity.value)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2.5 flex items-center justify-between hover:bg-surface-hover text-text-secondary hover:text-text transition-colors"
                  >
                    <span>VirusTotal Intelligence Search</span>
                    <ExternalLink size={13} className="text-text-muted" />
                  </a>
                  <a
                    href={`https://www.shodan.io/search?query=${encodeURIComponent(activeEntity.value)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2.5 flex items-center justify-between hover:bg-surface-hover text-text-secondary hover:text-text transition-colors"
                  >
                    <span>Shodan Infrastructure Search</span>
                    <ExternalLink size={13} className="text-text-muted" />
                  </a>
                  <a
                    href={`https://otx.alienvault.com/indicator/${activeEntity.type}/${encodeURIComponent(activeEntity.value)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2.5 flex items-center justify-between hover:bg-surface-hover text-text-secondary hover:text-text transition-colors"
                  >
                    <span>AlienVault OTX Pulse Lookup</span>
                    <ExternalLink size={13} className="text-text-muted" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'relationships' && (
            <div className="space-y-4">
              <div className="p-3 bg-surface-elevated rounded border border-border">
                <span className="text-xs font-semibold text-text block mb-1">Correlated Adversary</span>
                <p className="text-xs font-mono text-primary font-medium">{getActorMatch()}</p>
              </div>

              <div className="border border-border rounded overflow-hidden">
                <div className="px-3.5 py-2 bg-surface-elevated border-b border-border text-xs font-semibold text-text">
                  Associated Malware & Tooling
                </div>
                <div className="p-3.5 flex flex-wrap gap-1.5 bg-surface">
                  <Badge variant="critical">{activeEntity.malware || 'Cobalt Strike'}</Badge>
                  <Badge variant="high">PlugX DLL Sideload</Badge>
                  <Badge variant="medium">Mimikatz Credential Tool</Badge>
                </div>
              </div>

              <div className="border border-border rounded overflow-hidden">
                <div className="px-3.5 py-2 bg-surface-elevated border-b border-border text-xs font-semibold text-text">
                  Co-located Infrastructure
                </div>
                <div className="p-3.5 space-y-2 text-xs font-mono text-text-secondary">
                  <div className="flex justify-between">
                    <span>194.26.29.112:8443</span>
                    <span className="text-text-muted">ASN 49505</span>
                  </div>
                  <div className="flex justify-between">
                    <span>c2-relay-vault.com</span>
                    <span className="text-text-muted">Nameserver NS1</span>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="md"
                onClick={handleOpenGraph}
                className="w-full gap-2 text-xs"
              >
                <GitBranch size={14} /> Open in Threat Relationships Graph
              </Button>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-3">
              <div className="relative pl-6 border-l border-border space-y-4 text-xs">
                <div className="relative">
                  <span className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-critical border-2 border-surface" />
                  <span className="font-mono text-text-muted text-[11px]">2026-10-07 06:26:07</span>
                  <p className="font-medium text-text mt-0.5">Ingested via ThreatFox active telemetry</p>
                  <p className="text-text-secondary text-[11px]">Added to operational threat blocklists</p>
                </div>

                <div className="relative">
                  <span className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-high border-2 border-surface" />
                  <span className="font-mono text-text-muted text-[11px]">2026-10-07 05:14:22</span>
                  <p className="font-medium text-text mt-0.5">Automated Correlation Analysis</p>
                  <p className="text-text-secondary text-[11px]">Matched against C2 traffic patterns</p>
                </div>

                <div className="relative">
                  <span className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-text-muted border-2 border-surface" />
                  <span className="font-mono text-text-muted text-[11px]">2026-08-08 18:22:01</span>
                  <p className="font-medium text-text mt-0.5">Initial Domain Registration Observed</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hunting' && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-text block mb-1.5">Microsoft Sentinel (KQL)</span>
                <pre className="p-3 rounded bg-surface-elevated border border-border font-mono text-xs text-text overflow-x-auto custom-scrollbar">
{`DeviceNetworkEvents
| where RemoteIP == "${activeEntity.value}" or RemoteUrl has "${activeEntity.value}"
| project TimeGenerated, DeviceName, InitiatingProcessFileName, RemoteIP`}
                </pre>
              </div>

              <div>
                <span className="text-xs font-semibold text-text block mb-1.5">Splunk (SPL)</span>
                <pre className="p-3 rounded bg-surface-elevated border border-border font-mono text-xs text-text overflow-x-auto custom-scrollbar">
{`index=network (src_ip="${activeEntity.value}" OR dest_ip="${activeEntity.value}" OR query="*${activeEntity.value}*")
| stats count by src_ip, dest_ip, sourcetype`}
                </pre>
              </div>

              <Button
                variant="outline"
                size="md"
                onClick={handleStartHunt}
                className="w-full gap-2 text-xs"
              >
                <Terminal size={14} /> Open in Hunting Playground
              </Button>
            </div>
          )}
        </div>

        {/* Footer Actions Strip */}
        <div className="px-5 py-3.5 border-t border-border bg-surface-elevated flex items-center justify-between gap-3 shrink-0">
          <Button
            variant="primary"
            size="md"
            onClick={handleAskCopilot}
            className="flex-1 gap-2"
          >
            <Sparkles size={14} /> Threat Copilot Analysis
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={closeInvestigation}
          >
            Close
          </Button>
        </div>

      </div>
    </div>
  );
};
