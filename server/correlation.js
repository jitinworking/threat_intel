import { getDB } from './db.js';

// Correlation Engine — links related IoCs together
export function findCorrelations(iocValue) {
  const db = getDB();

  const target = db.prepare('SELECT * FROM iocs WHERE ioc = ?').get(iocValue);
  if (!target) return { target: null, related: [], clusters: [] };

  const related = [];

  // 1. Same malware family
  if (target.malware && target.malware !== 'unknown') {
    const sameMalware = db.prepare(
      'SELECT * FROM iocs WHERE malware = ? AND ioc != ? LIMIT 30'
    ).all(target.malware, iocValue);
    related.push(...sameMalware.map(r => ({ ...r, relation: 'same_malware', tags: JSON.parse(r.tags || '[]') })));
  }

  // 2. Same source report
  if (target.source) {
    const sameSource = db.prepare(
      'SELECT * FROM iocs WHERE source = ? AND malware = ? AND ioc != ? LIMIT 20'
    ).all(target.source, target.malware, iocValue);
    related.push(...sameSource.map(r => ({ ...r, relation: 'same_report', tags: JSON.parse(r.tags || '[]') })));
  }

  // 3. IP-to-domain correlation: if it's an IP, find domains from same malware
  if (target.ioc_type === 'ipv4') {
    const relatedDomains = db.prepare(
      "SELECT * FROM iocs WHERE ioc_type = 'domain' AND malware = ? AND ioc != ? LIMIT 10"
    ).all(target.malware, iocValue);
    related.push(...relatedDomains.map(r => ({ ...r, relation: 'ip_domain_link', tags: JSON.parse(r.tags || '[]') })));
  }

  // 4. Domain-to-IP correlation
  if (target.ioc_type === 'domain') {
    const relatedIPs = db.prepare(
      "SELECT * FROM iocs WHERE ioc_type = 'ipv4' AND malware = ? AND ioc != ? LIMIT 10"
    ).all(target.malware, iocValue);
    related.push(...relatedIPs.map(r => ({ ...r, relation: 'domain_ip_link', tags: JSON.parse(r.tags || '[]') })));
  }

  // 5. Hash clusters — find hashes sharing same malware
  if (target.ioc_type === 'sha256' || target.ioc_type === 'md5') {
    const relatedHashes = db.prepare(
      "SELECT * FROM iocs WHERE (ioc_type = 'sha256' OR ioc_type = 'md5') AND malware = ? AND ioc != ? LIMIT 15"
    ).all(target.malware, iocValue);
    related.push(...relatedHashes.map(r => ({ ...r, relation: 'hash_cluster', tags: JSON.parse(r.tags || '[]') })));
  }

  // Deduplicate
  const seen = new Set();
  const unique = related.filter(r => {
    if (seen.has(r.ioc)) return false;
    seen.add(r.ioc);
    return true;
  });

  // Build cluster summary
  const clusters = {};
  for (const r of unique) {
    const key = r.relation;
    if (!clusters[key]) clusters[key] = [];
    clusters[key].push(r);
  }

  return {
    target: { ...target, tags: JSON.parse(target.tags || '[]'), enrichment: JSON.parse(target.enrichment || '{}') },
    related: unique,
    clusters: Object.entries(clusters).map(([relation, items]) => ({ relation, count: items.length, items })),
  };
}
