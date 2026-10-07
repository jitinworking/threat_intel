import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'threat_intel.db');

let db;

export function initDB() {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
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
  `);

  // Lightweight migration for databases created before feed health tracking.
  const feedColumns = db.prepare('PRAGMA table_info(feeds)').all().map(column => column.name);
  if (!feedColumns.includes('last_status')) {
    db.exec("ALTER TABLE feeds ADD COLUMN last_status TEXT NOT NULL DEFAULT 'inactive'");
  }

  // Seed default feeds
  const upsertFeed = db.prepare(`INSERT OR IGNORE INTO feeds (name, type, url) VALUES (?, ?, ?)`);
  upsertFeed.run('ThreatFox', 'api', 'https://threatfox-api.abuse.ch/api/v1/');
  upsertFeed.run('URLhaus', 'api', 'https://urlhaus-api.abuse.ch/v1/urls/recent/');
  upsertFeed.run('Feodo Tracker', 'api', 'https://feodotracker.abuse.ch/downloads/ipblocklist_recommended.txt');
  upsertFeed.run('MalwareBazaar', 'api', 'https://mb-api.abuse.ch/api/v1/');
  upsertFeed.run('OpenPhish', 'api', 'https://openphish.com/feed.txt');
  upsertFeed.run('CISA KEV', 'api', 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json');
  upsertFeed.run('Mastodon', 'social', 'https://infosec.exchange');
  upsertFeed.run('Twitter', 'social', 'https://api.twitter.com/2/tweets/search/recent');
  upsertFeed.run('Telegram', 'social', 'https://api.telegram.org/');
  upsertFeed.run('Email', 'internal', 'imap.feed');
  upsertFeed.run('AlienVault OTX', 'api', 'https://otx.alienvault.com/api/v1/pulses/subscribed');
  upsertFeed.run('Unit42', 'static', '');
  upsertFeed.run('PulseDive', 'api', 'https://pulsedive.com/feed/');
  upsertFeed.run('PhishTank', 'api', 'https://raw.githubusercontent.com/mitchellkrogza/Phishing.Database/master/phishing-links-ACTIVE.txt');
  upsertFeed.run('News', 'rss', 'cyber-news-aggregator');
  upsertFeed.run('SSLBL', 'api', 'https://sslbl.abuse.ch/blacklist/sslblacklist.csv');

  // A restart must not revive stale health from a previous server process.
  // Each ingestion cycle promotes only freshly successful feeds to active.
  db.prepare("UPDATE feeds SET last_status = 'inactive'").run();

  console.log('[DB] SQLite initialized at', DB_PATH);
  return db;
}

export function getDB() {
  if (!db) initDB();
  return db;
}
