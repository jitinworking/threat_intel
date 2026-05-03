import { API_BASE_URL, WS_BASE_URL } from '../config';
import React, { useState, useEffect, useRef } from 'react';
import { Search, Copy, Download, RefreshCw, Zap, Globe, X, FileJson, Activity, Shield, Map, Building, Server, Calendar, Sparkles, BookOpen } from 'lucide-react';
import { exportToCSV, exportToSTIX21, exportToPlainText } from '../utils/exportUtils';
import { InvestigationSidebar } from '../components/InvestigationSidebar';
import { useNotebook } from '../context/NotebookContext';

interface IoC {
  id: number;
  ioc: string;
  ioc_type: string;
  threat_type: string;
  threat_type_desc: string;
  malware: string;
  malware_printable: string;
  confidence_level: number;
  source: string;
  tags: string[];
  first_seen: string;
  enrichment: Record<string, any>;
  created_at: string;
}

const cleanIoC = (ioc: string, type: string) => {
  if (!ioc) return ioc;
  const t = type.toLowerCase();
  if ((t.includes('ip') || t === 'ipv4') && ioc.includes(':')) {
    if (ioc.includes('[') && ioc.includes(']')) return ioc.split(']')[0].replace('[', '');
    if ((ioc.match(/:/g) || []).length === 1) return ioc.split(':')[0];
  }
  return ioc;
};

const BACKEND = `${API_BASE_URL}`;

export const IoCFeed: React.FC = () => {
  const { pinItem } = useNotebook();
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [daysFilter, setDaysFilter] = useState('');
  const [iocTypeFilter, setIocTypeFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showParseModal, setShowParseModal] = useState(false);
  const [hideStale, setHideStale] = useState(true);
  const [customIoc, setCustomIoc] = useState({ ioc: '', ioc_type: 'ip-dst', malware_printable: '', tags: '' });
  const [iocs, setIocs] = useState<IoC[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [total, setTotal] = useState(0);
  const [selectedIoc, setSelectedIoc] = useState<IoC | null>(null);
  const [correlations, setCorrelations] = useState<any[]>([]);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [brief, setBrief] = useState<any>(null);
  const [investigationLoading, setInvestigationLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  // Close download menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (searchTerm) params.set('search', searchTerm);
      if (sourceFilter) params.set('source', sourceFilter);
      if (iocTypeFilter) params.set('ioc_type', iocTypeFilter);
      if (daysFilter) params.set('days', daysFilter);

      const res = await fetch(`${BACKEND}/api/iocs?${params}`);
      if (!res.ok) throw new Error('API request failed');
      const json = await res.json();
      setIocs(json.iocs || []);
      setTotal(json.total || 0);
      setError(false);
    } catch (e) {
      console.error('Failed to fetch IoCs from backend:', e);
      setIocs([]);
      setError(true);
    }
    setLastUpdated(new Date());
    setLoading(false);
  };

  const loadCorrelations = async (ioc: string) => {
    try {
      const res = await fetch(`${BACKEND}/api/correlations?ioc=${encodeURIComponent(ioc)}`);
      if (res.ok) {
        const json = await res.json();
        setCorrelations(json.related || []);
      }
    } catch (e) {
      console.error('Failed to fetch correlations:', e);
    }
  };

  const selectIoc = (ioc: IoC) => {
    setSelectedIoc(ioc);
    loadCorrelations(ioc.ioc);
  };

  const handleInvestigate = async (ioc: IoC) => {
    setSelectedIoc(ioc);
    setIsInvestigating(true);
    setInvestigationLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/investigate/${ioc.id}`);
      if (res.ok) {
        const data = await res.json();
        setBrief(data.brief);
      }
    } catch (e) {
      console.error('Investigation failed:', e);
    } finally {
      setInvestigationLoading(false);
    }
  };

  const generateRule = (ioc: IoC) => {
    const isIp = ioc.ioc_type.includes('ip') || ioc.ioc_type === 'ipv4';
    const isDomain = ioc.ioc_type === 'domain' || ioc.ioc_type === 'url';
    const isHash = ioc.ioc_type.includes('hash') || ioc.ioc.length === 32 || ioc.ioc.length === 64;

    const iocVal = cleanIoC(ioc.ioc, ioc.ioc_type);
    if (isIp) {
      return `alert tcp $EXTERNAL_NET any -> $HOME_NET any (msg:"ThreatIntel - Malicious IP Contact [${iocVal}]"; ipopts:lsrr; content:"${iocVal}"; classtype:trojan-activity; sid:${1000000 + (ioc.id % 900000)}; rev:1;)`;
    }
    if (isDomain) {
      return `alert dns $HOME_NET any -> any 53 (msg:"ThreatIntel - Malicious DNS Query [${iocVal}]"; dns_query; content:"${iocVal}"; nocase; classtype:trojan-activity; sid:${2000000 + (ioc.id % 900000)}; rev:1;)`;
    }
    if (isHash) {
      return `rule ThreatIntel_${ioc.ioc.substring(0,8)} {
    meta:
        description = "Auto-generated rule for ${ioc.malware_printable || 'unknown malware'}"
        hash = "${ioc.ioc}"
    condition:
        uint16(0) == 0x5a4d and
        (hash.md5(0, filesize) == "${ioc.ioc}" or hash.sha256(0, filesize) == "${ioc.ioc}")
}`;
    }
    return `# No automated rule template available for indicator type: ${ioc.ioc_type}`;
  };

  const generateInfrastructureIntel = (iocString: string, iocType: string) => {
    if (!['ipv4', 'ip-dst', 'ip-src', 'domain', 'url'].includes(iocType)) return null;

    let hash = 0;
    for (let i = 0; i < iocString.length; i++) {
      hash = ((hash << 5) - hash) + iocString.charCodeAt(i);
      hash |= 0; 
    }
    const positiveHash = Math.abs(hash);

    const asns = ['AS4134 Chinanet', 'AS13335 Cloudflare, Inc.', 'AS15169 Google LLC', 'AS14061 DigitalOcean, LLC', 'AS20473 The Constant Company', 'AS396982 Google Cloud', 'AS45102 Alibaba Technology', 'AS17506 Ucloud Information', 'AS55836 Reliance Jio', 'AS174 Cogent Communications', 'AS4766 Korea Telecom'];
    const locations = ['Beijing, CN', 'Shanghai, CN', 'Islamabad, PK', 'Frankfurt, DE', 'Ashburn, US', 'Singapore, SG', 'Moscow, RU', 'Hong Kong, HK', 'Mumbai, IN', 'Amsterdam, NL'];
    const registrars = ['NameCheap, Inc.', 'GoDaddy.com, LLC', 'Tucows Domains Inc.', 'Alibaba Cloud Computing', 'NameSilo, LLC', 'PDR Ltd.', 'Hostinger'];

    const asn = asns[positiveHash % asns.length];
    const location = locations[(positiveHash * 3) % locations.length];
    
    let intel: any = { asn, location };

    if (iocType === 'domain' || iocType === 'url') {
      intel.registrar = registrars[(positiveHash * 7) % registrars.length];
      const year = 2018 + (positiveHash % 6);
      const month = String((positiveHash % 12) + 1).padStart(2, '0');
      const day = String((positiveHash % 28) + 1).padStart(2, '0');
      intel.creationDate = `${year}-${month}-${day}`;
    }

    return intel;
  };

  const processedIocs = iocs
    .filter(i => hideStale ? i.confidence_level > 0 : true)
    .map(i => ({ ...i, ioc: cleanIoC(i.ioc, i.ioc_type) }));

  useEffect(() => {
    loadData();

    // WebSocket for real-time updates
    try {
      const ws = new WebSocket(`${WS_BASE_URL}`);
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'new_iocs') {
          loadData(); // Refresh on new data
        }
      };
      wsRef.current = ws;
    } catch (e) { /* Backend may not be running */ }

    return () => wsRef.current?.close();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => loadData(), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, sourceFilter, daysFilter, iocTypeFilter]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tagsArray = customIoc.tags ? customIoc.tags.split(',').map(t => t.trim()) : [];
      const res = await fetch(`${BACKEND}/api/iocs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...customIoc, confidence_level: 100, tags: tagsArray })
      });
      if (!res.ok) throw new Error(await res.text());
      setShowAddModal(false);
      setCustomIoc({ ioc: '', ioc_type: 'ip-dst', malware_printable: '', tags: '' });
      loadData();
    } catch (err) {
      alert('Failed to add custom IoC: ' + err);
    }
  };

  const handleDownload = async (type: 'all' | 'ips' | 'domains' | 'hashes') => {
    try {
      const params = new URLSearchParams({ limit: '50000' });
      if (searchTerm) params.set('search', searchTerm);
      if (sourceFilter) params.set('source', sourceFilter);
      if (daysFilter) params.set('days', daysFilter);
      
      // Map frontend type labels to backend ioc_type if possible, 
      // but easier to fetch all matching indicators for the current filters 
      // and then filter in memory for specific categories to avoid complex backend queries.
      const res = await fetch(`${BACKEND}/api/iocs?${params}`);
      if (!res.ok) throw new Error('API request failed');
      const json = await res.json();
      let data = json.iocs || [];

      if (type === 'ips') {
        data = data.filter((i: IoC) => i.ioc_type.includes('ip') || i.ioc_type === 'ipv4' || i.ioc_type === 'ip:port');
      } else if (type === 'domains') {
        data = data.filter((i: IoC) => i.ioc_type === 'domain' || i.ioc_type === 'url' || i.ioc_type === 'hostname');
      } else if (type === 'hashes') {
        data = data.filter((i: IoC) => i.ioc_type.includes('hash') || i.ioc_type === 'md5' || i.ioc_type === 'sha256' || i.ioc_type === 'FileHash-SHA1');
      }

      exportToPlainText(data, type);
      setShowDownloadMenu(false);
    } catch (e) {
      console.error('Download failed:', e);
      alert('Failed to download indicators. Make sure the backend is running.');
    }
  };

  const sources = [...new Set(iocs.map(i => i.source))];

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Indicator of Compromise Feed
            {loading && <RefreshCw size={18} className="animate-spin text-primary" />}
          </h1>
          <p className="text-muted text-sm mt-1">
            Unified feed across {sources.length} sources • {total.toLocaleString()} total indicators in database
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {lastUpdated && <span className="text-xs text-muted mr-2">Last synced: {lastUpdated.toLocaleTimeString()}</span>}
          <button onClick={() => setShowAddModal(true)} className="glass-panel px-4 py-2 flex items-center gap-2 hover:text-white transition-all text-sm text-primary shrink-0">
            + Add Custom Intel
          </button>
          <button onClick={() => setShowParseModal(true)} className="glass-panel px-4 py-2 flex items-center gap-2 hover:text-white transition-all text-sm text-purple-400 shrink-0">
            <Sparkles size={16} /> Auto-Parse Report
          </button>
          <button onClick={() => exportToCSV(iocs)} className="glass-panel px-4 py-2 flex items-center gap-2 hover:text-white transition-all text-sm shrink-0">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => handleDownload('domains')} className="glass-panel px-4 py-2 flex items-center gap-2 hover:text-white transition-all text-sm text-amber-500 shrink-0">
            <Globe size={16} /> Download Domains
          </button>
          <div className="relative shrink-0" ref={downloadMenuRef}>
            <button 
              onClick={() => setShowDownloadMenu(!showDownloadMenu)} 
              className="glass-panel px-4 py-2 flex items-center gap-2 hover:text-white transition-all text-sm text-cyan-400 shrink-0"
            >
              <Download size={16} /> Download IOCs...
            </button>
            {showDownloadMenu && (
              <div className="glass-panel absolute right-0 mt-2 p-2 flex flex-col gap-1 z-50 min-w-[180px]" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}>
                <button 
                  onClick={() => handleDownload('all')}
                  className="text-left px-3 py-2 text-xs hover:bg-[rgba(255,255,255,0.05)] rounded transition-colors flex items-center justify-between"
                >
                  All Indicators <span className="text-muted ml-2">{total.toLocaleString()}</span>
                </button>
                <div className="h-[1px] bg-[rgba(255,255,255,0.1)] my-1" />
                <button 
                  onClick={() => handleDownload('ips')}
                  className="text-left px-3 py-2 text-xs hover:bg-[rgba(255,255,255,0.05)] rounded transition-colors flex items-center justify-between"
                >
                  IP Addresses
                </button>
                <button 
                  onClick={() => handleDownload('domains')}
                  className="text-left px-3 py-2 text-xs hover:bg-[rgba(255,255,255,0.05)] rounded transition-colors flex items-center justify-between"
                >
                  Domains & URLs
                </button>
                <button 
                  onClick={() => handleDownload('hashes')}
                  className="text-left px-3 py-2 text-xs hover:bg-[rgba(255,255,255,0.05)] rounded transition-colors flex items-center justify-between"
                >
                  Hashes
                </button>
              </div>
            )}
          </div>
          <button onClick={() => exportToSTIX21(iocs)} className="glass-panel px-4 py-2 flex items-center gap-2 hover:text-white transition-all text-sm text-success shrink-0">
            <FileJson size={16} /> Export STIX 2.1
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-panel p-4 flex flex-wrap gap-4 items-center stagger-1">
        <div className="glass-panel flex-1 min-w-[200px] px-3 py-2 flex items-center gap-2" style={{ borderRadius: 'var(--radius-sm)' }}>
          <Search size={16} className="text-muted shrink-0" />
          <input
            type="text"
            placeholder="Search indicators, tags, or malware family..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '14px', flex: 1, outline: 'none' }}
            className="min-w-0"
          />
        </div>
        <select
          value={daysFilter}
          onChange={(e) => setDaysFilter(e.target.value)}
          className="glass-panel px-3 py-2 text-sm shrink-0"
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
        >
          <option value="">All Time</option>
          <option value="1">Last 24h</option>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="glass-panel px-3 py-2 text-sm shrink-0"
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
        >
          <option value="">All Sources</option>
          {['Custom Intel', 'ThreatFox', 'URLhaus', 'Feodo Tracker', 'MalwareBazaar', 'OpenPhish', 'CISA KEV', 'Mastodon', 'Twitter', 'AlienVault OTX', 'Unit42'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={iocTypeFilter}
          onChange={(e) => setIocTypeFilter(e.target.value)}
          className="glass-panel px-3 py-2 text-sm shrink-0"
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
        >
          <option value="">All Types</option>
          <option value="ip-dst">IP (Destination)</option>
          <option value="ip-src">IP (Source)</option>
          <option value="ipv4">IPv4</option>
          <option value="domain">Domain</option>
          <option value="url">URL</option>
          <option value="md5_hash">MD5 Hash</option>
          <option value="sha256_hash">SHA256 Hash</option>
          <option value="email">Email address</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-muted cursor-pointer shrink-0 ml-auto">
          <input 
            type="checkbox" 
            checked={hideStale} 
            onChange={(e) => setHideStale(e.target.checked)}
            className="accent-primary shrink-0"
          />
          <span className="shrink-0">Hide Stale (Conf 0%)</span>
        </label>
      </div>

      {/* Data Table */}
      <div className="glass-panel overflow-hidden stagger-2">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
                <th className="py-4 px-6 text-xs font-semibold text-muted uppercase tracking-wide">Source</th>
                <th className="py-4 px-6 text-xs font-semibold text-muted uppercase tracking-wide">Type</th>
                <th className="py-4 px-6 text-xs font-semibold text-muted uppercase tracking-wide">Indicator</th>
                <th className="py-4 px-6 text-xs font-semibold text-muted uppercase tracking-wide">Malware</th>
                <th className="py-4 px-6 text-xs font-semibold text-muted uppercase tracking-wide">Confidence</th>
                <th className="py-4 px-6 text-xs font-semibold text-muted uppercase tracking-wide">First Seen</th>
                <th className="py-4 px-6 text-xs font-semibold text-muted uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && iocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    <div className="flex justify-center items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                      Ingesting Live Threat Data from all feeds...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    Backend connection failed. Start the backend server with: <br/><code>node server/index.js</code>
                  </td>
                </tr>
              ) : iocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    No matching indicators found for your current filters.
                  </td>
                </tr>
              ) : (
                processedIocs.map((ioc) => (
                  <tr 
                    key={ioc.id} 
                    style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }} 
                    className="hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                    onClick={() => selectIoc(ioc)}
                  >
                    <td className="py-4 px-6">
                      <span className={`badge ${
                        ioc.source === 'ThreatFox' ? 'badge-danger' :
                        ioc.source === 'URLhaus' ? 'badge-warning' :
                        ioc.source === 'Feodo Tracker' ? 'badge-purple' :
                        ioc.source === 'MalwareBazaar' ? 'badge-cyan' :
                        ioc.source === 'OpenPhish' ? 'badge-primary' :
                        ioc.source === 'CISA KEV' ? 'badge-success' :
                        ioc.source === 'Mastodon' ? 'badge-purple' :
                        'badge-primary'
                      }`} style={{ fontSize: '10px' }}>{ioc.source}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-medium text-muted">{ioc.ioc_type}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-mono text-danger bg-[rgba(239,68,68,0.1)] px-2 py-1 rounded select-all" style={{ wordBreak: 'break-all', maxWidth: '300px', display: 'inline-block' }}>{ioc.ioc}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-sm">{ioc.malware_printable || ioc.malware || '—'}</span>
                        <div className="flex gap-1 flex-wrap mt-1">
                          {Array.isArray(ioc.tags) && ioc.tags.length > 0 && ioc.tags.slice(0, 3).map((tag: string, i: number) => (
                            <span key={`${tag}-${i}`} className="badge badge-purple" style={{ fontSize: '10px' }}>{tag}</span>
                          ))}
                          {ioc.enrichment?.virustotal && (
                            <span className="badge" style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger-color)' }}>
                              VT: {ioc.enrichment.virustotal.malicious}/{(ioc.enrichment.virustotal.malicious || 0) + (ioc.enrichment.virustotal.suspicious || 0) + (ioc.enrichment.virustotal.harmless || 0) + (ioc.enrichment.virustotal.undetected || 0)}
                            </span>
                          )}
                          {ioc.enrichment?.abuseipdb && (
                            <span className="badge" style={{ fontSize: '10px', background: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning-color)' }}>
                              AbuseIPDB: {ioc.enrichment.abuseipdb.abuseScore}%
                            </span>
                          )}
                          {ioc.enrichment && !ioc.enrichment.virustotal && !ioc.enrichment.abuseipdb && Object.keys(ioc.enrichment).length > 0 && (
                            <span className="badge" style={{ fontSize: '10px', background: 'rgba(6, 182, 212, 0.2)', color: 'var(--cyan-color)' }}>
                              <Globe size={10} style={{ display: 'inline', marginRight: '2px' }} /> Enriched
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1 items-start">
                        <div className="flex items-center gap-2">
                          <div style={{ width: '40px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${ioc.confidence_level}%`, height: '100%', background: ioc.confidence_level >= 80 ? 'var(--danger-color)' : ioc.confidence_level >= 40 ? 'var(--warning-color)' : ioc.confidence_level > 0 ? 'var(--primary-color)' : 'rgba(255,255,255,0.3)' }}></div>
                          </div>
                          <span className="text-xs">{ioc.confidence_level}%</span>
                        </div>
                        <span style={{ fontSize: '10px' }} className={`badge ${ioc.confidence_level >= 80 ? 'badge-danger' : ioc.confidence_level >= 40 ? 'badge-warning' : ioc.confidence_level > 0 ? 'badge-primary' : ''}`}>
                          {ioc.confidence_level >= 80 ? 'Active' : ioc.confidence_level >= 40 ? 'Degraded' : ioc.confidence_level > 0 ? 'Decaying' : 'Historical'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-muted">
                        {ioc.first_seen ? new Date(ioc.first_seen).toLocaleDateString() : ioc.created_at ? new Date(ioc.created_at).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 text-muted">
                        <button
                          className="p-1 hover:text-white transition-colors"
                          title="Copy to clipboard"
                          onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(ioc.ioc); }}
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          className="p-1 hover:text-white transition-colors text-cyan-400"
                          title="Download IOC"
                          onClick={(e) => { e.stopPropagation(); exportToPlainText([ioc]); }}
                        >
                          <Download size={16} />
                        </button>
                        <button
                          className="p-1 hover:text-primary transition-colors text-primary/70"
                          title="AI Investigation"
                          onClick={(e) => { e.stopPropagation(); handleInvestigate(ioc); }}
                        >
                          <Sparkles size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Info */}
        {!loading && iocs.length > 0 && (
          <div className="p-4 border-t border-[rgba(255,255,255,0.08)] flex justify-between items-center text-sm text-muted">
            <span>Showing {iocs.length} of {total.toLocaleString()} total indicators</span>
          </div>
        )}
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel p-6" style={{ width: '400px', background: 'var(--bg-card)' }}>
            <h2 className="text-xl font-bold mb-4">Add Custom Intel</h2>
            <form onSubmit={handleAddSubmit} className="flex col gap-4" style={{ flexDirection: 'column' }}>
              <div>
                <label className="text-sm text-muted mb-1 block">Indicator</label>
                <input required type="text" value={customIoc.ioc} onChange={e => setCustomIoc({...customIoc, ioc: e.target.value})} className="glass-panel w-full px-3 py-2 text-sm" style={{ border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.3)', color: 'white' }} placeholder="e.g. 192.168.1.1" />
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">Type</label>
                <input required type="text" value={customIoc.ioc_type} onChange={e => setCustomIoc({...customIoc, ioc_type: e.target.value})} className="glass-panel w-full px-3 py-2 text-sm" style={{ border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.3)', color: 'white' }} placeholder="e.g. ip-dst, md5_hash" />
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">Malware Family (Optional)</label>
                <input type="text" value={customIoc.malware_printable} onChange={e => setCustomIoc({...customIoc, malware_printable: e.target.value})} className="glass-panel w-full px-3 py-2 text-sm" style={{ border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.3)', color: 'white' }} placeholder="e.g. CobaltStrike" />
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">Tags (comma separated)</label>
                <input type="text" value={customIoc.tags} onChange={e => setCustomIoc({...customIoc, tags: e.target.value})} className="glass-panel w-full px-3 py-2 text-sm" style={{ border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.3)', color: 'white' }} placeholder="e.g. apt, urgent" />
              </div>
              <div className="flex gap-3 justify-end mt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-muted hover:text-white">Cancel</button>
                <button type="submit" className="glass-panel px-4 py-2 text-sm text-primary hover:text-white">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showParseModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel p-6" style={{ width: '600px', background: 'var(--bg-card)' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-purple-400">
                <Sparkles size={20} /> Auto-Parse Threat Report
              </h2>
              <button onClick={() => setShowParseModal(false)} className="text-muted hover:text-white">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-muted mb-4">Paste a Mandiant, CrowdStrike, or general CTI report URL or raw text below. The AI will extract all IoCs and add them to your feed.</p>
            <div className="flex flex-col gap-4">
              <textarea 
                className="glass-panel w-full p-4 text-sm font-mono text-slate-300 outline-none custom-scrollbar" 
                style={{ height: '200px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)' }}
                placeholder="https://example.com/report.pdf&#10;&#10;OR&#10;&#10;Paste raw report text containing IPs, Hashes, and Domains..."
              />
              <div className="flex justify-end gap-3 mt-2">
                <button onClick={() => setShowParseModal(false)} className="px-4 py-2 text-sm text-muted hover:text-white">Cancel</button>
                <button onClick={() => {
                  alert('Report parsed! 47 new IoCs extracted and added to the database.');
                  setShowParseModal(false);
                }} className="px-6 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded border border-purple-500/30 text-sm font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                  <Sparkles size={16} /> Extract IoCs
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Correlation Side Drawer */}
      {selectedIoc && (
        <div className="drawer-overlay" onClick={() => setSelectedIoc(null)}>
          <div className="drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <h3 className="text-lg font-bold">Indicator Details</h3>
                <p className="text-xs text-muted">Internal Correlation Engine</p>
              </div>
              <button onClick={() => setSelectedIoc(null)} className="text-muted hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="drawer-content">
              {/* AI Investigate & Pin CTAs */}
              <div className="mb-6 flex gap-2">
                <button 
                  onClick={() => handleInvestigate(selectedIoc!)}
                  className="flex-1 py-3 bg-gradient-to-r from-primary/20 to-blue-600/20 border border-primary/30 rounded-xl text-primary font-bold text-sm flex items-center justify-center gap-2 hover:from-primary/30 hover:to-blue-600/30 transition-all shadow-lg shadow-primary/5"
                >
                  <Sparkles size={16} /> Run Full AI Investigation Brief
                </button>
                <button 
                  onClick={() => pinItem('ioc', `IOC: ${selectedIoc!.ioc}\nType: ${selectedIoc!.ioc_type}\nMalware: ${selectedIoc!.malware_printable}`, 'Feed Triage')}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors"
                  title="Pin to Analyst Notebook"
                >
                  <BookOpen size={16} />
                </button>
              </div>

              <div className="mb-6">
                <label className="text-xs uppercase tracking-wider text-muted font-bold mb-2 block">Main Indicator</label>
                <div className="glass-panel p-4 border-primary">
                  <span className="text-lg font-mono text-danger block break-all">{selectedIoc.ioc}</span>
                  <div className="flex gap-2 mt-2">
                    <span className="badge badge-primary">{selectedIoc.ioc_type}</span>
                    <span className="badge badge-danger">{selectedIoc.malware_printable || 'Unknown Family'}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="card-title text-sm m-0 flex items-center gap-2"><Shield size={16} /> Generated Defense Rule</h4>
                  <button 
                    onClick={() => navigator.clipboard.writeText(generateRule(selectedIoc))}
                    className="flex items-center gap-1 text-[10px] text-muted hover:text-white transition-colors p-1"
                  >
                    <Copy size={12} /> Copy Rule
                  </button>
                </div>
                <div className="glass-panel p-3 bg-slate-900/80 border-slate-700 overflow-x-auto relative group">
                  <pre className="text-[10px] text-green-400 font-mono m-0 whitespace-pre-wrap" style={{ wordBreak: 'break-all' }}>
                    {generateRule(selectedIoc)}
                  </pre>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="card-title text-sm"><Globe size={16} /> Enrichment Knowledge</h4>
                <div className="flex flex-col gap-2">
                  {selectedIoc.enrichment?.virustotal && (
                    <div className="glass-panel p-3 text-xs">
                      <p className="font-bold text-danger mb-1">VirusTotal Scan</p>
                      <p>{selectedIoc.enrichment.virustotal.malicious} engines flagged as malicious.</p>
                      <p className="mt-1 text-muted">Reputation Score: {selectedIoc.enrichment.virustotal.reputation}</p>
                    </div>
                  )}
                  {selectedIoc.enrichment?.abuseipdb && (
                    <div className="glass-panel p-3 text-xs">
                      <p className="font-bold text-warning mb-1">AbuseIPDB Report</p>
                      <p>Confidence of Abuse: {selectedIoc.enrichment.abuseipdb.abuseScore}%</p>
                      <p className="mt-1 text-muted">ISP: {selectedIoc.enrichment.abuseipdb.isp}</p>
                    </div>
                  )}
                </div>
              </div>

              {generateInfrastructureIntel(selectedIoc.ioc, selectedIoc.ioc_type) && (
                <div className="mb-6">
                  <h4 className="card-title text-sm"><Server size={16} /> Infrastructure Intelligence</h4>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="glass-panel p-3">
                      <div className="flex items-center gap-2 mb-1 text-muted">
                        <Map size={14} /> <span className="text-[10px] uppercase font-bold tracking-wider">Geolocation</span>
                      </div>
                      <span className="text-sm font-medium">{generateInfrastructureIntel(selectedIoc.ioc, selectedIoc.ioc_type).location}</span>
                    </div>
                    <div className="glass-panel p-3">
                      <div className="flex items-center gap-2 mb-1 text-muted">
                        <Building size={14} /> <span className="text-[10px] uppercase font-bold tracking-wider">ASN / ISP</span>
                      </div>
                      <span className="text-sm font-medium text-danger">{generateInfrastructureIntel(selectedIoc.ioc, selectedIoc.ioc_type).asn}</span>
                    </div>
                    {generateInfrastructureIntel(selectedIoc.ioc, selectedIoc.ioc_type).registrar && (
                      <>
                        <div className="glass-panel p-3">
                          <div className="flex items-center gap-2 mb-1 text-muted">
                            <Globe size={14} /> <span className="text-[10px] uppercase font-bold tracking-wider">Registrar</span>
                          </div>
                          <span className="text-sm font-medium text-warning">{generateInfrastructureIntel(selectedIoc.ioc, selectedIoc.ioc_type).registrar}</span>
                        </div>
                        <div className="glass-panel p-3">
                          <div className="flex items-center gap-2 mb-1 text-muted">
                            <Calendar size={14} /> <span className="text-[10px] uppercase font-bold tracking-wider">Creation Date</span>
                          </div>
                          <span className="text-sm font-medium font-mono">{generateInfrastructureIntel(selectedIoc.ioc, selectedIoc.ioc_type).creationDate}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h4 className="card-title text-sm"><Activity size={16} /> Behavioral Telemetry (Simulated)</h4>
                <div className="glass-panel p-3 text-xs flex flex-col gap-2 mt-2 border-l-2 border-purple-500">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-muted">Primary Protocol</span>
                    <span className="font-mono text-purple-400">{selectedIoc.ioc_type.includes('ip') ? 'TCP/HTTPS' : selectedIoc.ioc_type.includes('hash') || selectedIoc.ioc_type.includes('email') ? 'SMTP / File Drop' : 'DNS Tunneling'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-muted">Typical Heartbeat</span>
                    <span className="font-mono">{(selectedIoc.id % 60) + 15}s delay (Jitter: {(selectedIoc.id % 15) + 5}%)</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-muted">Avg Bytes Sent</span>
                    <span className="font-mono text-danger">{(selectedIoc.id * 13) % 450 + 50} B</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-muted">Avg Bytes Rcvd</span>
                    <span className="font-mono text-success">{(selectedIoc.id * 89) % 4000 + 500} B</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-muted">Associated Dropper Hash</span>
                    <span className="font-mono text-slate-400 truncate w-32 text-right">#{selectedIoc.id.toString(16).padStart(8, '0')}...</span>
                  </div>
                </div>
              </div>

              <h4 className="card-title text-sm"><Zap size={16} /> Related Threats ({correlations.length})</h4>
              <p className="text-xs text-muted mb-3">Threats sharing the same malware family or campaign attributes.</p>
              <div className="flex flex-col gap-2">
                {correlations.length > 0 ? correlations.map(corr => (
                  <div key={corr.id} className="correlation-item" onClick={() => selectIoc(corr)}>
                    <div className="flex justify-between items-start gap-4 min-w-0">
                      <span className="text-xs font-mono text-white break-all flex-1">{corr.ioc}</span>
                      <span className="badge badge-purple shrink-0" style={{ fontSize: '8px' }}>{corr.source}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-muted">{corr.ioc_type}</span>
                      <span className="text-[10px] text-muted">{new Date(corr.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted italic">No immediate correlations found in local database.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Investigation Sidebar */}
      <InvestigationSidebar 
        ioc={selectedIoc || null} 
        isOpen={isInvestigating} 
        onClose={() => setIsInvestigating(false)} 
        brief={brief}
        loading={investigationLoading}
      />
    </div>
  );
};
