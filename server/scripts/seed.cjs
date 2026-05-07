const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../threat_intel.db');
console.log('Connecting to db:', dbPath);
const db = new Database(dbPath);

const apts = [
  {
    name: 'Lazarus Group',
    aliases: JSON.stringify(['HIDDEN COBRA', 'Guardians of Peace', 'ZINC']),
    description: 'A highly sophisticated North Korean state-sponsored threat actor focused on both destructive attacks and financially motivated cybercrime to bypass sanctions.',
    targets: JSON.stringify(['Financial Institutions', 'Cryptocurrency Exchanges', 'Aerospace']),
    motivations: JSON.stringify(['Financial', 'Destructive'])
  },
  {
    name: 'Cozy Bear',
    aliases: JSON.stringify(['APT29', 'NOBELIUM', 'The Dukes']),
    description: 'A Russian intelligence agency (SVR) group renowned for highly stealthy, long-term intelligence gathering and supply chain compromises.',
    targets: JSON.stringify(['Government', 'Think Tanks', 'Healthcare']),
    motivations: JSON.stringify(['Espionage'])
  }
];

const cves = [
  { id: 'CVE-2024-21413', score: 9.8, severity: 'critical', description: 'Outlook Remote Code Execution', vendor: 'Microsoft', product: 'Outlook' },
  { id: 'CVE-2023-7028', score: 10.0, severity: 'critical', description: 'GitLab Account Takeover', vendor: 'GitLab', product: 'GitLab' },
  { id: 'CVE-2024-21351', score: 7.6, severity: 'high', description: 'SmartScreen Bypass', vendor: 'Microsoft', product: 'Windows' }
];

const leaks = [
  { group_name: 'LockBit 3.0', victim_name: 'Boeing', victim_url: 'boeing.com', description: 'Aerospace giant compromised.' },
  { group_name: 'ALPHV (BlackCat)', victim_name: 'MGM Resorts', victim_url: 'mgmresorts.com', description: 'Massive casino outage.' },
  { group_name: 'Play', victim_name: 'Dallas County', victim_url: 'dallascounty.org', description: 'Local government services impacted.' }
];

try {
  for (const apt of apts) {
    db.prepare('INSERT OR IGNORE INTO apt_groups (name, aliases, description, targets, motivations) VALUES (?, ?, ?, ?, ?)').run(apt.name, apt.aliases, apt.description, apt.targets, apt.motivations);
  }
  for (const cve of cves) {
    db.prepare('INSERT OR IGNORE INTO cves (id, score, severity, description, vendor, product) VALUES (?, ?, ?, ?, ?, ?)').run(cve.id, cve.score, cve.severity, cve.description, cve.vendor, cve.product);
  }
  for (const leak of leaks) {
    db.prepare('INSERT OR IGNORE INTO ransomware_leaks (group_name, victim_name, victim_url, description) VALUES (?, ?, ?, ?)').run(leak.group_name, leak.victim_name, leak.victim_url, leak.description);
  }
  console.log('Seeded database successfully.');
} catch (err) {
  console.error('Error seeding db:', err);
}
