import React, { useState } from 'react';
import { 
  ShieldAlert, ExternalLink, Search, Clock, Tag, 
  AlertCircle, RefreshCw, AlertTriangle, CheckCircle 
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import { 
  PageHeader, FilterBar, TableContainer, Table, TableHeader, 
  TableBody, TableRow, TableHead, TableCell, SeverityBadge, 
  ConfidenceScore, Button, Badge, Dropdown, EmptyState 
} from '../components/ui/design-system';

interface CVE {
  id: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  score: number;
  epss: number;
  epssPercentile: number;
  isKev: boolean;
  cwe: string;
  publishedDate: string;
  vendor: string;
  status: string;
}

const MOCK_CVES: CVE[] = [
  {
    id: 'CVE-2024-21413',
    description: 'Microsoft Outlook Remote Code Execution Vulnerability (MonikerLink). Allows remote attackers to bypass Office Protected View policies and execute arbitrary code.',
    severity: 'Critical',
    score: 9.8,
    epss: 0.9424,
    epssPercentile: 99.1,
    isKev: true,
    cwe: 'CWE-119',
    publishedDate: '2024-02-13',
    vendor: 'Microsoft',
    status: 'Actively Exploited'
  },
  {
    id: 'CVE-2024-21351',
    description: 'Windows SmartScreen Security Feature Bypass Vulnerability. Observed weaponized in the wild to bypass trust boundaries and execute untrusted code without prompting.',
    severity: 'High',
    score: 7.6,
    epss: 0.8142,
    epssPercentile: 97.4,
    isKev: true,
    cwe: 'CWE-200',
    publishedDate: '2024-02-13',
    vendor: 'Microsoft',
    status: 'Actively Exploited'
  },
  {
    id: 'CVE-2023-4863',
    description: 'Heap buffer overflow in WebP in Google Chrome and Mozilla Firefox. Enables remote code execution via specially crafted WebP image rendering.',
    severity: 'Critical',
    score: 8.8,
    epss: 0.9524,
    epssPercentile: 99.4,
    isKev: true,
    cwe: 'CWE-122',
    publishedDate: '2023-09-12',
    vendor: 'Google / Multiple',
    status: 'Analyzed'
  },
  {
    id: 'CVE-2023-34362',
    description: 'MOVEit Transfer SQL Injection Vulnerability. Leveraged by Cl0p ransomware syndicate for massive global extortion operations.',
    severity: 'Critical',
    score: 9.8,
    epss: 0.9750,
    epssPercentile: 99.9,
    isKev: true,
    cwe: 'CWE-89',
    publishedDate: '2023-05-31',
    vendor: 'Progress Software',
    status: 'Ransomware Exploited'
  },
  {
    id: 'CVE-2023-22515',
    description: 'Broken Access Control in Atlassian Confluence Data Center and Server. Allows remote unauthenticated attackers to create Confluence admin accounts.',
    severity: 'Critical',
    score: 10.0,
    epss: 0.9631,
    epssPercentile: 99.7,
    isKev: true,
    cwe: 'CWE-284',
    publishedDate: '2023-10-04',
    vendor: 'Atlassian',
    status: 'Actively Exploited'
  }
];

export const CveFeed: React.FC = () => {
  const { openInvestigation } = useInvestigation();

  const [searchTerm, setSearchTerm] = useState('');
  const [kevFilter, setKevFilter] = useState<'all' | 'kev' | 'non-kev'>('all');
  const [severityFilter, setSeverityFilter] = useState('');

  const filteredCves = MOCK_CVES.filter(cve => {
    const matchSearch = cve.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        cve.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        cve.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKev = kevFilter === 'all' ? true : kevFilter === 'kev' ? cve.isKev : !cve.isKev;
    const matchSev = severityFilter ? cve.severity.toLowerCase() === severityFilter.toLowerCase() : true;
    return matchSearch && matchKev && matchSev;
  });

  const handleInspect = (cve: CVE) => {
    openInvestigation({
      id: cve.id,
      type: 'cve',
      value: cve.id,
      severity: cve.severity.toLowerCase() as any,
      confidence: Math.round(cve.epss * 100),
      source: 'CISA KEV / NVD',
      threatType: cve.description,
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
      
      {/* ── Page Header ── */}
      <PageHeader
        title="Vulnerability & CISA KEV Registry"
        description="National Vulnerability Database indexed against CISA Known Exploited Vulnerabilities (KEV) and EPSS predictive exploitability scores."
        breadcrumbs={[
          { label: 'External Recon' },
          { label: 'CVE & KEV Registry' }
        ]}
      />

      {/* ── Filter Bar ── */}
      <FilterBar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Filter by CVE ID, vendor, or description..."
        hasActiveFilters={Boolean(searchTerm || kevFilter !== 'all' || severityFilter)}
        onClear={() => { setSearchTerm(''); setKevFilter('all'); setSeverityFilter(''); }}
      >
        <Dropdown
          options={[
            { value: 'all', label: 'All Catalog Vulnerabilities' },
            { value: 'kev', label: 'CISA KEV (Known Exploited Only)' },
            { value: 'non-kev', label: 'Standard NVD CVEs' }
          ]}
          value={kevFilter}
          onChange={(e: any) => setKevFilter(e.target.value)}
        />

        <Dropdown
          options={[
            { value: '', label: 'All Severities' },
            { value: 'critical', label: 'Critical' },
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' }
          ]}
          value={severityFilter}
          onChange={e => setSeverityFilter(e.target.value)}
        />
      </FilterBar>

      {/* ── Data Table ── */}
      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">Vulnerability ID</TableHead>
              <TableHead className="w-24">CVSS Score</TableHead>
              <TableHead className="w-32">Severity</TableHead>
              <TableHead className="w-32">CISA KEV Status</TableHead>
              <TableHead className="w-36">EPSS Probability</TableHead>
              <TableHead>Vulnerability Summary</TableHead>
              <TableHead className="w-32">Affected Vendor</TableHead>
              <TableHead className="w-28">Published</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCves.map(cve => (
              <TableRow
                key={cve.id}
                onClick={() => handleInspect(cve)}
                className="cursor-pointer hover:bg-surface-hover"
              >
                <TableCell>
                  <span className="font-mono text-xs font-semibold text-primary">
                    {cve.id}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="font-mono text-xs font-bold text-text">
                    {cve.score.toFixed(1)}
                  </span>
                </TableCell>

                <TableCell>
                  <SeverityBadge level={cve.severity} />
                </TableCell>

                <TableCell>
                  {cve.isKev ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-critical bg-critical-muted px-2 py-0.5 rounded border border-critical/30">
                      KEV Listed
                    </span>
                  ) : (
                    <span className="text-[11px] text-text-muted">Not Listed</span>
                  )}
                </TableCell>

                <TableCell>
                  <div className="font-mono text-xs">
                    <span className="text-text font-semibold">{(cve.epss * 100).toFixed(1)}%</span>
                    <span className="text-text-muted text-[10px] ml-1">({cve.epssPercentile}th)</span>
                  </div>
                </TableCell>

                <TableCell>
                  <p className="text-xs text-text-secondary line-clamp-1 leading-relaxed" title={cve.description}>
                    {cve.description}
                  </p>
                </TableCell>

                <TableCell>
                  <span className="text-xs text-text font-medium">
                    {cve.vendor}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="text-xs font-mono text-text-muted">
                    {cve.publishedDate}
                  </span>
                </TableCell>
              </TableRow>
            ))}

            {!filteredCves.length && (
              <TableRow>
                <TableCell colSpan={8} className="py-12">
                  <EmptyState title="No matching vulnerabilities" description="Adjust your search filters." />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

    </div>
  );
};
