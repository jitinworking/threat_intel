/**
 * Utility functions for exporting IoC data in various formats.
 */

interface IoC {
  id: number;
  ioc: string;
  ioc_type: string;
  source: string;
  malware?: string;
  malware_printable?: string;
  confidence_level: number;
  first_seen?: string;
  created_at?: string;
  tags?: string[];
}

const cleanIoC = (ioc: string, type: string) => {
  if (!ioc) return ioc;
  const t = type.toLowerCase();
  if ((t.includes('ip') || t === 'ipv4') && ioc.includes(':')) {
    // Handle IPv6 (multiple colons) vs IPv4 with port (single colon)
    if (ioc.includes('[') && ioc.includes(']')) {
      // [2001:db8::1]:80 -> 2001:db8::1
      return ioc.split(']')[0].replace('[', '');
    }
    if ((ioc.match(/:/g) || []).length === 1) {
      // 8.8.8.8:53 -> 8.8.8.8
      return ioc.split(':')[0];
    }
  }
  return ioc;
};

export const exportToCSV = (iocs: IoC[]) => {
  const header = 'IoC,Type,Source,Malware,Confidence,First Seen,Tags\n';
  const rows = iocs.map(i => {
    const tags = Array.isArray(i.tags) ? i.tags.join('; ') : '';
    const ioc = cleanIoC(i.ioc, i.ioc_type);
    return `"${ioc}","${i.ioc_type}","${i.source}","${i.malware_printable || i.malware || ''}",${i.confidence_level},"${i.first_seen || i.created_at}","${tags}"`;
  }).join('\n');
  
  const blob = new Blob([header + rows], { type: 'text/csv' });
  saveAs(blob, `threat_intel_export_${new Date().toISOString().split('T')[0]}.csv`);
};

export const exportToPlainText = (iocs: IoC[], typeLabel = 'iocs') => {
  const content = iocs.map(i => cleanIoC(i.ioc, i.ioc_type)).join('\n');
  const blob = new Blob([content], { type: 'text/plain' });
  saveAs(blob, `threat_intel_${typeLabel}_${new Date().toISOString().split('T')[0]}.txt`);
};

export const exportToSTIX21 = (iocs: IoC[]) => {
  const bundleId = `bundle--${crypto.randomUUID()}`;
  const objects = iocs.map(i => {
    const id = `indicator--${crypto.randomUUID()}`;
    const ioc = cleanIoC(i.ioc, i.ioc_type);
    const pattern = `[${iocTypeToStix(i.ioc_type)} = '${ioc}']`;
    
    return {
      type: 'indicator',
      spec_version: '2.1',
      id,
      created: i.created_at || new Date().toISOString(),
      modified: i.created_at || new Date().toISOString(),
      name: `Indicator from ${i.source}`,
      description: i.malware_printable ? `Related to ${i.malware_printable}` : 'Threat intelligence indicator',
      indicator_types: ['malicious-activity'],
      pattern,
      pattern_type: 'stix',
      valid_from: i.first_seen || i.created_at || new Date().toISOString(),
      confidence: i.confidence_level,
      labels: Array.isArray(i.tags) ? i.tags : [],
      external_references: [
        {
          source_name: i.source,
          external_id: String(i.id)
        }
      ]
    };
  });

  const bundle = {
    type: 'bundle',
    id: bundleId,
    objects
  };

  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  saveAs(blob, `threat_intel_stix_${new Date().toISOString().split('T')[0]}.json`);
};

const iocTypeToStix = (type: string) => {
  switch (type.toLowerCase()) {
    case 'ip-dst':
    case 'ipv4': return 'ipv4-addr:value';
    case 'ipv6': return 'ipv6-addr:value';
    case 'domain': return 'domain-name:value';
    case 'url': return 'url:value';
    case 'md5_hash':
    case 'md5': return 'file:hashes.MD5';
    case 'sha256_hash':
    case 'sha256': return 'file:hashes.SHA-256';
    case 'email': return 'email-addr:value';
    default: return 'artifact:payload_bin';
  }
};

const saveAs = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
};
