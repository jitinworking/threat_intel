import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.TURSO_DATABASE_URL || `file:${path.join(__dirname, 'threat_intel.db')}`;
const DB_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || '';

export const db = createClient({
  url: DB_PATH,
  authToken: DB_AUTH_TOKEN
});

export async function initDB() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS iocs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ioc TEXT NOT NULL,
      ioc_type TEXT NOT NULL,
      threat_type TEXT DEFAULT '',
      threat_type_desc TEXT DEFAULT '',
      malware TEXT DEFAULT '',
      malware_printable TEXT DEFAULT '',
      confidence_level INTEGER DEFAULT 50,
      source TEXT NOT NULL,
      tags TEXT DEFAULT '[]',
      first_seen TEXT DEFAULT '',
      last_seen TEXT DEFAULT '',
      enrichment TEXT DEFAULT '{}',
      mitre_techniques TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(ioc, source)
    );

    CREATE TABLE IF NOT EXISTS feeds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      url TEXT DEFAULT '',
      enabled INTEGER DEFAULT 1,
      poll_interval_min INTEGER DEFAULT 5,
      last_polled TEXT DEFAULT '',
      config TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ioc_id INTEGER,
      message TEXT NOT NULL,
      severity TEXT DEFAULT 'medium',
      sent INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (ioc_id) REFERENCES iocs(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      source TEXT NOT NULL,
      summary TEXT DEFAULT '',
      url TEXT UNIQUE NOT NULL,
      category TEXT DEFAULT 'General',
      published_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_iocs_ioc ON iocs(ioc);
    CREATE INDEX IF NOT EXISTS idx_iocs_source ON iocs(source);
    CREATE INDEX IF NOT EXISTS idx_iocs_ioc_type ON iocs(ioc_type);
    CREATE INDEX IF NOT EXISTS idx_iocs_malware ON iocs(malware);

    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      threat_actor TEXT DEFAULT '',
      first_seen TEXT DEFAULT (datetime('now')),
      last_updated TEXT DEFAULT (datetime('now')),
      status TEXT DEFAULT 'Active'
    );

    CREATE TABLE IF NOT EXISTS campaign_iocs (
      campaign_id INTEGER,
      ioc_id INTEGER,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
      FOREIGN KEY (ioc_id) REFERENCES iocs(id),
      PRIMARY KEY (campaign_id, ioc_id)
    );

    DROP TABLE IF EXISTS apt_groups;
    CREATE TABLE IF NOT EXISTS apt_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      aliases TEXT DEFAULT '[]',
      description TEXT DEFAULT '',
      targets TEXT DEFAULT '[]',
      motivations TEXT DEFAULT '[]',
      malware TEXT DEFAULT '[]',
      threatLevel TEXT DEFAULT 'Medium',
      playbook TEXT DEFAULT '[]',
      associatedCVEs TEXT DEFAULT '[]',
      fingerprint TEXT DEFAULT '{}',
      last_active TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cves (
      id TEXT PRIMARY KEY,
      score REAL DEFAULT 0.0,
      severity TEXT DEFAULT 'medium',
      description TEXT DEFAULT '',
      vendor TEXT DEFAULT '',
      product TEXT DEFAULT '',
      published_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ransomware_leaks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_name TEXT NOT NULL,
      victim_name TEXT NOT NULL,
      victim_url TEXT DEFAULT '',
      description TEXT DEFAULT '',
      published_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS darkweb_leaks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT NOT NULL,
      source TEXT NOT NULL,
      severity TEXT DEFAULT 'Medium',
      compromised_accounts INTEGER DEFAULT 0,
      published_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS emulation_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      tactic TEXT DEFAULT '',
      technique TEXT DEFAULT '',
      procedure TEXT DEFAULT '',
      mitre_id TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      value TEXT NOT NULL UNIQUE
    );
  `);

  // Seed default feeds
  const defaultFeeds = [
    { name: 'ThreatFox', type: 'api', url: 'https://threatfox-api.abuse.ch/api/v1/' },
    { name: 'URLhaus', type: 'api', url: 'https://urlhaus-api.abuse.ch/v1/urls/recent/' },
    { name: 'Feodo Tracker', type: 'api', url: 'https://feodotracker.abuse.ch/downloads/ipblocklist_recommended.txt' },
    { name: 'MalwareBazaar', type: 'api', url: 'https://mb-api.abuse.ch/api/v1/' },
    { name: 'OpenPhish', type: 'api', url: 'https://openphish.com/feed.txt' },
    { name: 'CISA KEV', type: 'api', url: 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json' },
    { name: 'Mastodon', type: 'social', url: 'https://infosec.exchange' },
    { name: 'Twitter', type: 'social', url: 'https://api.twitter.com/2/tweets/search/recent' },
    { name: 'Telegram', type: 'social', url: 'https://api.telegram.org/' },
    { name: 'Email', type: 'internal', url: 'imap.feed' },
    { name: 'AlienVault OTX', type: 'api', url: 'https://otx.alienvault.com/api/v1/pulses/subscribed' },
    { name: 'Unit42', type: 'static', url: '' },
    { name: 'PulseDive', type: 'api', url: 'https://pulsedive.com/feed/' },
    { name: 'PhishTank', type: 'api', url: 'https://raw.githubusercontent.com/mitchellkrogza/Phishing.Database/master/phishing-links-ACTIVE.txt' },
    { name: 'News', type: 'rss', url: 'cyber-news-aggregator' },
    { name: 'SSLBL', type: 'api', url: 'https://sslbl.abuse.ch/blacklist/sslblacklist.csv' },
    { name: 'Ransomware Live', type: 'api', url: 'https://api.ransomware.live/recentvictims' }
  ];

  for (const feed of defaultFeeds) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO feeds (name, type, url) VALUES (?, ?, ?)`,
      args: [feed.name, feed.type, feed.url]
    });
  }

  console.log('[DB] LibSQL initialized at', process.env.TURSO_DATABASE_URL ? 'Turso Cloud' : DB_PATH);
  // Seed APTs
  const aptsCount = await db.execute('SELECT COUNT(*) as count FROM apt_groups');
  if (aptsCount.rows[0].count === 0) {
    const aptsRaw = fs.readFileSync(path.join(process.cwd(), 'server/data/apts.json'), 'utf-8');
    const apts = JSON.parse(aptsRaw);
    for (const apt of apts) {
      await db.execute({ 
        sql: 'INSERT INTO apt_groups (name, aliases, description, targets, motivations, malware, threatLevel, playbook, associatedCVEs, fingerprint) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        args: [
          apt.name, 
          JSON.stringify(apt.aliases || []), 
          apt.description, 
          JSON.stringify(apt.targets || []), 
          JSON.stringify(apt.motivations || []),
          JSON.stringify(apt.malware || []),
          apt.threatLevel || 'Medium',
          JSON.stringify(apt.playbook || []),
          JSON.stringify(apt.associatedCVEs || []),
          JSON.stringify(apt.fingerprint || {})
        ] 
      });
    }
  }

  // Seed CVEs
  const cvesCount = await db.execute('SELECT COUNT(*) as count FROM cves');
  if (cvesCount.rows[0].count === 0) {
    const cves = [
      { id: 'CVE-2024-21413', score: 9.8, sev: 'critical', desc: 'Outlook Remote Code Execution', vendor: 'Microsoft', product: 'Outlook' },
      { id: 'CVE-2023-7028', score: 10.0, sev: 'critical', desc: 'GitLab Account Takeover', vendor: 'GitLab', product: 'GitLab' }
    ];
    for (const cve of cves) {
      await db.execute({ sql: 'INSERT INTO cves (id, score, severity, description, vendor, product) VALUES (?, ?, ?, ?, ?, ?)', args: [cve.id, cve.score, cve.sev, cve.desc, cve.vendor, cve.product] });
    }
  }

  // Seed Ransomware
  const ransomwareCount = await db.execute('SELECT COUNT(*) as count FROM ransomware_leaks');
  if (ransomwareCount.rows[0].count === 0) {
    const leaks = [
      { group: 'LockBit 3.0', victim: 'Boeing', url: 'boeing.com', desc: 'Aerospace giant compromised.' },
      { group: 'ALPHV (BlackCat)', victim: 'MGM Resorts', url: 'mgmresorts.com', desc: 'Massive casino outage.' }
    ];
    for (const leak of leaks) {
      await db.execute({ sql: 'INSERT INTO ransomware_leaks (group_name, victim_name, victim_url, description) VALUES (?, ?, ?, ?)', args: [leak.group, leak.victim, leak.url, leak.desc] });
    }
  }

  // Seed Dark Web Leaks
  const darkwebCount = await db.execute('SELECT COUNT(*) as count FROM darkweb_leaks');
  if (darkwebCount.rows[0].count === 0) {
    const leaks = [
      { domain: 'corp.local', source: 'Naz.API', severity: 'High', accounts: 245 },
      { domain: 'internal-portal.corp.local', source: 'RedLine Stealer Logs', severity: 'Critical', accounts: 12 }
    ];
    for (const leak of leaks) {
      await db.execute({ sql: 'INSERT INTO darkweb_leaks (domain, source, severity, compromised_accounts) VALUES (?, ?, ?, ?)', args: [leak.domain, leak.source, leak.severity, leak.accounts] });
    }
  }

  // Seed Emulation Plans
  const emulationCount = await db.execute('SELECT COUNT(*) as count FROM emulation_plans');
  if (emulationCount.rows[0].count === 0) {
    const plans = [
      { id: 'AE-001', name: 'LSASS Memory Dump', desc: 'Attempt to dump LSASS memory using ProcDump.', tactic: 'Credential Access', technique: 'OS Credential Dumping', procedure: 'procdump.exe -ma lsass.exe lsass.dmp', mitre: 'T1003.001' },
      { id: 'AE-002', name: 'Kerberoasting', desc: 'Request service tickets and extract hashes.', tactic: 'Credential Access', technique: 'Steal or Forge Kerberos Tickets', procedure: 'Invoke-Kerberoast -OutputFormat Hashcat', mitre: 'T1558.003' }
    ];
    for (const plan of plans) {
      await db.execute({ sql: 'INSERT INTO emulation_plans (id, name, description, tactic, technique, procedure, mitre_id) VALUES (?, ?, ?, ?, ?, ?, ?)', args: [plan.id, plan.name, plan.desc, plan.tactic, plan.technique, plan.procedure, plan.mitre] });
    }
  }

  // Seed Assets
  const assetsCount = await db.execute('SELECT COUNT(*) as count FROM assets');
  if (assetsCount.rows[0].count === 0) {
    const assets = [
      { type: 'Technology', value: 'Microsoft Exchange' },
      { type: 'Technology', value: 'Atlassian Confluence' },
      { type: 'IP', value: '198.51.100.24' },
      { type: 'Domain', value: 'internal-portal.corp.local' }
    ];
    for (const asset of assets) {
      await db.execute({ sql: 'INSERT OR IGNORE INTO assets (type, value) VALUES (?, ?)', args: [asset.type, asset.value] });
    }
  }

  return db;
}

import { isSuppressed } from './suppression.js';

export function getDB() {
  return {
    ...db,
    batch: async (statements, mode) => {
      const filtered = statements.filter(stmt => {
        if (stmt.sql && stmt.sql.includes('INSERT INTO iocs') && stmt.args && stmt.args.length > 0) {
          const ioc = stmt.args[0];
          if (isSuppressed(ioc)) return false;
        }
        return true;
      });
      if (filtered.length === 0) return [];
      return db.batch(filtered, mode);
    },
    execute: async (stmt) => {
      if (stmt.sql && stmt.sql.includes('INSERT INTO iocs') && stmt.args && stmt.args.length > 0) {
        const ioc = stmt.args[0];
        if (isSuppressed(ioc)) return { rows: [], rowsAffected: 0 };
      }
      return db.execute(stmt);
    }
  };
}
