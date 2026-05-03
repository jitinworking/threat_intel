import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';

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
    { name: 'SSLBL', type: 'api', url: 'https://sslbl.abuse.ch/blacklist/sslblacklist.csv' }
  ];

  for (const feed of defaultFeeds) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO feeds (name, type, url) VALUES (?, ?, ?)`,
      args: [feed.name, feed.type, feed.url]
    });
  }

  console.log('[DB] LibSQL initialized at', process.env.TURSO_DATABASE_URL ? 'Turso Cloud' : DB_PATH);
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
