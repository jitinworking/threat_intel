import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Copy, Download, RefreshCw, Plus, Check, 
  ExternalLink, Filter, Database, ArrowUpDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import { exportToSTIX21, exportToPlainText } from '../utils/exportUtils';
import { useInvestigation } from '../context/InvestigationContext';
import { 
  PageHeader, FilterBar, TableContainer, Table, TableHeader, 
  TableBody, TableRow, TableHead, TableCell, SeverityBadge, 
  ConfidenceScore, Button, Input, Dropdown, EmptyState, Modal, Skeleton 
} from '../components/ui/design-system';

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

import { BACKEND_URL } from '../config';

const BACKEND = BACKEND_URL;

export const IoCFeed: React.FC = () => {
  const { openInvestigation } = useInvestigation();

  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [iocTypeFilter, setIocTypeFilter] = useState('');
  const [daysFilter, setDaysFilter] = useState('');
  
  const [iocs, setIocs] = useState<IoC[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const limit = 50;

  // Add Manual IoC Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [customIoc, setCustomIoc] = useState({ ioc: '', ioc_type: 'ipv4', malware_printable: '', source: 'Manual Submission' });

  const fetchIocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString()
      });

      if (searchTerm) params.set('search', searchTerm);
      if (sourceFilter) params.set('source', sourceFilter);
      if (iocTypeFilter) params.set('ioc_type', iocTypeFilter);
      if (daysFilter) params.set('days', daysFilter);

      const res = await fetch(`${BACKEND}/api/iocs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setIocs(data.iocs || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to query IoCs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, sourceFilter, iocTypeFilter, daysFilter]);

  useEffect(() => {
    fetchIocs();
  }, [fetchIocs]);

  const handleCopy = (ioc: string, id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ioc);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleSelectRow = (ioc: IoC) => {
    openInvestigation({
      id: ioc.id,
      type: ioc.ioc_type,
      value: ioc.ioc,
      severity: ioc.confidence_level >= 80 ? 'critical' : ioc.confidence_level >= 60 ? 'high' : 'medium',
      confidence: ioc.confidence_level,
      source: ioc.source,
      malware: ioc.malware_printable,
      threatType: ioc.threat_type_desc || ioc.threat_type,
      firstSeen: ioc.created_at,
    });
  };

  const handleAddIocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customIoc.ioc.trim()) return;

    try {
      const res = await fetch(`${BACKEND}/api/iocs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ioc: customIoc.ioc.trim(),
          ioc_type: customIoc.ioc_type,
          malware_printable: customIoc.malware_printable,
          source: 'Analyst Submission',
          confidence_level: 90
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        setCustomIoc({ ioc: '', ioc_type: 'ipv4', malware_printable: '', source: 'Manual Submission' });
        fetchIocs();
      }
    } catch (e) {
      console.error('Failed to submit manual IoC:', e);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
      
      {/* ── Page Header ── */}
      <PageHeader
        title="IoC Explorer"
        description="Search, triage, and correlate validated indicators of compromise against global threat feeds and autonomous systems."
        breadcrumbs={[
          { label: 'Threat Intelligence' },
          { label: 'IoC Explorer' }
        ]}
        badge={
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface-elevated border border-border text-text">
            {total.toLocaleString()} Records
          </span>
        }
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => exportToPlainText(iocs)}
              className="gap-1.5"
            >
              <Download size={13} /> Export Plaintext
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => exportToSTIX21(iocs)}
              className="gap-1.5"
            >
              <Download size={13} /> Export STIX 2.1
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="gap-1.5"
            >
              <Plus size={13} /> Ingest Indicator
            </Button>
          </>
        }
      />

      {/* ── Filter Bar ── */}
      <FilterBar
        search={searchTerm}
        onSearchChange={(val) => { setSearchTerm(val); setPage(0); }}
        searchPlaceholder="Filter by indicator, malware, or threat pattern..."
        hasActiveFilters={Boolean(searchTerm || sourceFilter || iocTypeFilter || daysFilter)}
        onClear={() => {
          setSearchTerm('');
          setSourceFilter('');
          setIocTypeFilter('');
          setDaysFilter('');
          setPage(0);
        }}
      >
        <Dropdown
          options={[
            { value: '', label: 'All Indicator Types' },
            { value: 'domain', label: 'Domain' },
            { value: 'ipv4', label: 'IPv4' },
            { value: 'ip:port', label: 'IP:Port' },
            { value: 'url', label: 'URL' },
            { value: 'sha256_hash', label: 'SHA-256 Hash' },
            { value: 'md5_hash', label: 'MD5 Hash' },
            { value: 'ssl_cert_sha1', label: 'SSL SHA-1' }
          ]}
          value={iocTypeFilter}
          onChange={(e) => { setIocTypeFilter(e.target.value); setPage(0); }}
        />

        <Dropdown
          options={[
            { value: '', label: 'All Ingestion Sources' },
            { value: 'ThreatFox', label: 'ThreatFox' },
            { value: 'SSLBL', label: 'SSLBL' },
            { value: 'URLhaus', label: 'URLhaus' },
            { value: 'OpenPhish', label: 'OpenPhish' },
            { value: 'MalwareBazaar', label: 'MalwareBazaar' },
            { value: 'PhishTank', label: 'PhishTank' }
          ]}
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setPage(0); }}
        />

        <Dropdown
          options={[
            { value: '', label: 'All Observation Windows' },
            { value: '1', label: 'Last 24 Hours' },
            { value: '7', label: 'Last 7 Days' },
            { value: '30', label: 'Last 30 Days' },
            { value: '90', label: 'Last 90 Days' }
          ]}
          value={daysFilter}
          onChange={(e) => { setDaysFilter(e.target.value); setPage(0); }}
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={fetchIocs}
          className="p-1.5 text-text-muted hover:text-text ml-auto"
          title="Refresh table"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </Button>
      </FilterBar>

      {/* ── Enterprise Data Table ── */}
      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>Indicator Value</TableHead>
              <TableHead className="w-28">Type</TableHead>
              <TableHead className="w-28">Severity</TableHead>
              <TableHead className="w-28">Confidence</TableHead>
              <TableHead>Malware / Threat Description</TableHead>
              <TableHead className="w-32">Source Feed</TableHead>
              <TableHead className="w-32">Observed</TableHead>
              <TableHead className="w-16 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={9} className="py-3">
                    <div className="h-4 bg-surface-elevated rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : iocs.length > 0 ? (
              iocs.map((item, idx) => {
                const severity = item.confidence_level >= 80 ? 'critical' : item.confidence_level >= 60 ? 'high' : 'medium';
                return (
                  <TableRow
                    key={item.id}
                    onClick={() => handleSelectRow(item)}
                    className="cursor-pointer hover:bg-surface-hover"
                  >
                    <TableCell className="text-center font-mono text-[11px] text-text-muted">
                      {page * limit + idx + 1}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[12px] font-semibold text-text truncate max-w-sm" title={item.ioc}>
                          {item.ioc}
                        </span>
                        <button
                          onClick={(e) => handleCopy(item.ioc, item.id, e)}
                          title="Copy indicator"
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
                        {item.malware_printable || item.threat_type_desc || 'Unclassified Threat'}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-text-secondary font-mono">
                        {item.source}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs font-mono text-text-muted whitespace-nowrap">
                        {item.created_at ? item.created_at.slice(0, 16) : '—'}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 text-text-muted hover:text-text"
                        title="Investigate indicator"
                      >
                        <ExternalLink size={12} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="py-12">
                  <EmptyState
                    title="No matching indicators"
                    description="No threat indicators matched your query parameters. Try widening filter parameters."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Table Pagination Bar ── */}
      <div className="flex items-center justify-between px-2 text-xs text-text-muted">
        <div>
          Showing <span className="font-mono font-medium text-text">{iocs.length ? page * limit + 1 : 0}</span> to{' '}
          <span className="font-mono font-medium text-text">{Math.min((page + 1) * limit, total)}</span> of{' '}
          <span className="font-mono font-medium text-text">{total.toLocaleString()}</span> indicators
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0 || loading}
            onClick={() => setPage(prev => Math.max(0, prev - 1))}
            className="gap-1 text-xs"
          >
            <ChevronLeft size={13} /> Previous
          </Button>
          <span className="font-mono text-xs text-text px-2">
            Page {page + 1} of {Math.max(1, totalPages)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page + 1 >= totalPages || loading}
            onClick={() => setPage(prev => prev + 1)}
            className="gap-1 text-xs"
          >
            Next <ChevronRight size={13} />
          </Button>
        </div>
      </div>

      {/* ── Manual IoC Ingest Modal ── */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Ingest Manual Indicator"
      >
        <form onSubmit={handleAddIocSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-text block mb-1">Indicator Value *</label>
            <Input
              value={customIoc.ioc}
              onChange={(e) => setCustomIoc({ ...customIoc, ioc: e.target.value })}
              placeholder="e.g. 185.220.101.5 or malware-beacon.org"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-text block mb-1">Indicator Type</label>
              <select
                value={customIoc.ioc_type}
                onChange={(e) => setCustomIoc({ ...customIoc, ioc_type: e.target.value })}
                className="w-full bg-surface border border-border rounded px-3 py-1.5 text-xs text-text"
              >
                <option value="ipv4">IPv4 Address</option>
                <option value="domain">Domain Name</option>
                <option value="url">URL Endpoint</option>
                <option value="sha256_hash">SHA-256 Hash</option>
                <option value="md5_hash">MD5 Hash</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-text block mb-1">Associated Malware / TTP</label>
              <Input
                value={customIoc.malware_printable}
                onChange={(e) => setCustomIoc({ ...customIoc, malware_printable: e.target.value })}
                placeholder="e.g. Cobalt Strike Beacon"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" size="md" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Submit to Pipeline
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
