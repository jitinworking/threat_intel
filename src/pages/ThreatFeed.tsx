import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Rss, Search, RefreshCw, LayoutGrid, List, 
  ExternalLink, Copy, Check, Filter, ShieldAlert, ArrowUpRight
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import { 
  PageHeader, FilterBar, SeverityBadge, StatusIndicator, 
  ConfidenceScore, Button, EmptyState, Dropdown, TableContainer,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from '../components/ui/design-system';

interface IoC {
  id: number;
  ioc: string;
  ioc_type: string;
  threat_type: string;
  malware_printable: string;
  confidence_level: number;
  source: string;
  created_at: string;
}

import { BACKEND_URL, WS_URL } from '../config';

const BACKEND = BACKEND_URL;

export const ThreatFeed: React.FC = () => {
  const { openInvestigation } = useInvestigation();

  const [iocs, setIocs] = useState<IoC[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isLive, setIsLive] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [viewMode, setViewMode] = useState<'stream' | 'table'>('table');

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '60' });
      if (searchTerm) params.set('search', searchTerm);
      if (sourceFilter) params.set('source', sourceFilter);
      if (typeFilter) params.set('ioc_type', typeFilter);

      const res = await fetch(`${BACKEND}/api/iocs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setIocs(data.iocs || []);
      }
    } catch (e) {
      console.error('Failed to query live feed:', e);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, sourceFilter, typeFilter]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // WebSocket listener for live feed updates
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(WS_URL);
      ws.onopen = () => setIsLive(true);
      ws.onclose = () => setIsLive(false);
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'new_iocs') {
            loadFeed();
          }
        } catch {}
      };
    } catch {
      setIsLive(false);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [loadFeed]);

  const handleCopy = (ioc: string, id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ioc);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleInspect = (ioc: IoC) => {
    openInvestigation({
      id: ioc.id,
      type: ioc.ioc_type,
      value: ioc.ioc,
      severity: ioc.confidence_level >= 80 ? 'critical' : ioc.confidence_level >= 60 ? 'high' : 'medium',
      confidence: ioc.confidence_level,
      source: ioc.source,
      malware: ioc.malware_printable,
      firstSeen: ioc.created_at,
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
      
      {/* ── Page Header ── */}
      <PageHeader
        title="Live Threat Telemetry Feed"
        description="Continuous ingestion stream capturing malicious indicators across public, commercial, and open-source intelligence vectors."
        breadcrumbs={[
          { label: 'Threat Intelligence' },
          { label: 'Live Threat Feed' }
        ]}
        badge={
          <StatusIndicator
            status={isLive ? 'live' : 'syncing'}
            label={isLive ? 'WebSocket Active' : 'Connecting'}
          />
        }
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-border rounded bg-surface p-0.5 text-xs">
              <button
                onClick={() => setViewMode('table')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-surface-elevated text-primary font-semibold' : 'text-text-muted hover:text-text'
                }`}
              >
                Table View
              </button>
              <button
                onClick={() => setViewMode('stream')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  viewMode === 'stream' ? 'bg-surface-elevated text-primary font-semibold' : 'text-text-muted hover:text-text'
                }`}
              >
                Stream Cards
              </button>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={loadFeed}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
            </Button>
          </div>
        }
      />

      {/* ── Filter Bar ── */}
      <FilterBar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Filter live telemetry stream..."
        hasActiveFilters={Boolean(searchTerm || sourceFilter || typeFilter)}
        onClear={() => { setSearchTerm(''); setSourceFilter(''); setTypeFilter(''); }}
      >
        <Dropdown
          options={[
            { value: '', label: 'All Ingestion Sources' },
            { value: 'ThreatFox', label: 'ThreatFox' },
            { value: 'URLhaus', label: 'URLhaus' },
            { value: 'SSLBL', label: 'SSLBL' },
            { value: 'OpenPhish', label: 'OpenPhish' },
            { value: 'MalwareBazaar', label: 'MalwareBazaar' },
            { value: 'PhishTank', label: 'PhishTank' }
          ]}
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
        />

        <Dropdown
          options={[
            { value: '', label: 'All Indicator Types' },
            { value: 'domain', label: 'Domain' },
            { value: 'ipv4', label: 'IPv4' },
            { value: 'ip:port', label: 'IP:Port' },
            { value: 'url', label: 'URL' },
            { value: 'sha256_hash', label: 'SHA-256' },
            { value: 'ssl_cert_sha1', label: 'SSL SHA-1' }
          ]}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        />
      </FilterBar>

      {/* ── View: Table View ── */}
      {viewMode === 'table' ? (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-center"></TableHead>
                <TableHead>Observed Indicator</TableHead>
                <TableHead className="w-28">Type</TableHead>
                <TableHead className="w-28">Severity</TableHead>
                <TableHead className="w-28">Confidence</TableHead>
                <TableHead>Associated Threat / Family</TableHead>
                <TableHead className="w-32">Source Feed</TableHead>
                <TableHead className="w-32">Ingest Time</TableHead>
                <TableHead className="w-16 text-right">Pivot</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9} className="py-3">
                      <div className="h-4 bg-surface-elevated rounded animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))
              ) : iocs.length > 0 ? (
                iocs.map((item) => {
                  const severity = item.confidence_level >= 80 ? 'critical' : item.confidence_level >= 60 ? 'high' : 'medium';
                  return (
                    <TableRow
                      key={item.id}
                      onClick={() => handleInspect(item)}
                      className="cursor-pointer hover:bg-surface-hover"
                    >
                      <TableCell className="text-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[12px] font-semibold text-text truncate max-w-sm" title={item.ioc}>
                            {item.ioc}
                          </span>
                          <button
                            onClick={(e) => handleCopy(item.ioc, item.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-surface border border-border text-text-muted hover:text-text cursor-pointer transition-opacity"
                          >
                            {copiedId === item.id ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                          </button>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="font-mono text-[10px] uppercase font-bold text-text-muted bg-surface-elevated px-1.5 py-0.5 rounded border border-border">
                          {item.ioc_type}
                        </span>
                      </TableCell>

                      <TableCell>
                        <SeverityBadge level={severity} />
                      </TableCell>

                      <TableCell>
                        <ConfidenceScore score={item.confidence_level} />
                      </TableCell>

                      <TableCell>
                        <span className="text-text font-medium text-xs truncate max-w-xs block">
                          {item.malware_printable || 'Threat Activity'}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="text-xs text-text-secondary font-mono">
                          {item.source}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="text-xs font-mono text-text-muted whitespace-nowrap">
                          {item.created_at ? item.created_at.slice(11, 19) : 'Just now'}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="p-1 text-text-muted">
                          <ArrowUpRight size={13} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="py-12">
                    <EmptyState title="No active stream records" description="Awaiting next scheduled feed ingestion." />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* Stream Cards Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {iocs.map((item) => {
            const severity = item.confidence_level >= 80 ? 'critical' : item.confidence_level >= 60 ? 'high' : 'medium';
            return (
              <div
                key={item.id}
                onClick={() => handleInspect(item)}
                className="p-3.5 bg-surface border border-border rounded hover:bg-surface-hover cursor-pointer transition-colors flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <SeverityBadge level={severity} />
                    <span className="font-mono text-[11px] text-text-muted">
                      {item.created_at ? item.created_at.slice(11, 19) : 'Live'}
                    </span>
                  </div>

                  <p className="font-mono text-xs font-semibold text-text truncate mb-1" title={item.ioc}>
                    {item.ioc}
                  </p>
                  <p className="text-xs text-text-secondary line-clamp-1">
                    {item.malware_printable || `${item.ioc_type.toUpperCase()} telemetry observed`}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-2 text-[11px] text-text-muted">
                  <span className="font-mono">{item.source}</span>
                  <ConfidenceScore score={item.confidence_level} />
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
