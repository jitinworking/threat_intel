import { getDB } from './db.js';

// Correlation Engine — links related IoCs together
export async function findCorrelations(iocValue) {
  const db = getDB();

  try {
    const targetRes = await db.execute({
      sql: 'SELECT * FROM iocs WHERE ioc = ?',
      args: [iocValue]
    });
    const target = targetRes.rows[0];
    if (!target) return { target: null, related: [], clusters: [] };

    const related = [];

    // 1. Same malware family
    if (target.malware && target.malware !== 'unknown') {
      const sameMalware = await db.execute({
        sql: 'SELECT * FROM iocs WHERE malware = ? AND ioc != ? LIMIT 30',
        args: [target.malware, iocValue]
      });
      related.push(...sameMalware.rows.map(r => ({ ...r, relation: 'same_malware', tags: JSON.parse(r.tags || '[]') })));
    }

    // 2. Same source report
    if (target.source) {
      const sameSource = await db.execute({
        sql: 'SELECT * FROM iocs WHERE source = ? AND malware = ? AND ioc != ? LIMIT 20',
        args: [target.source, target.malware, iocValue]
      });
      related.push(...sameSource.rows.map(r => ({ ...r, relation: 'same_report', tags: JSON.parse(r.tags || '[]') })));
    }

    // 3. IP-to-domain correlation
    if (target.ioc_type === 'ipv4') {
      const relatedDomains = await db.execute({
        sql: "SELECT * FROM iocs WHERE ioc_type = 'domain' AND malware = ? AND ioc != ? LIMIT 10",
        args: [target.malware, iocValue]
      });
      related.push(...relatedDomains.rows.map(r => ({ ...r, relation: 'ip_domain_link', tags: JSON.parse(r.tags || '[]') })));
    }

    // 4. Domain-to-IP correlation
    if (target.ioc_type === 'domain') {
      const relatedIPs = await db.execute({
        sql: "SELECT * FROM iocs WHERE ioc_type = 'ipv4' AND malware = ? AND ioc != ? LIMIT 10",
        args: [target.malware, iocValue]
      });
      related.push(...relatedIPs.rows.map(r => ({ ...r, relation: 'domain_ip_link', tags: JSON.parse(r.tags || '[]') })));
    }

    // 5. Hash clusters
    if (target.ioc_type === 'sha256' || target.ioc_type === 'md5') {
      const relatedHashes = await db.execute({
        sql: "SELECT * FROM iocs WHERE (ioc_type = 'sha256' OR ioc_type = 'md5') AND malware = ? AND ioc != ? LIMIT 15",
        args: [target.malware, iocValue]
      });
      related.push(...relatedHashes.rows.map(r => ({ ...r, relation: 'hash_cluster', tags: JSON.parse(r.tags || '[]') })));
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
  } catch (err) {
    console.error('[Correlation] Error:', err.message);
    return { target: null, related: [], clusters: [] };
  }
}
