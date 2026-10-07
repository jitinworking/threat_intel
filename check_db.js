import Database from 'better-sqlite3';

const DB_PATH = './server/threat_intel.db';
const db = new Database(DB_PATH);

console.log('--- IoC Counts by Source ---');
const bySource = db.prepare('SELECT source, COUNT(*) as count FROM iocs GROUP BY source').all();
console.log(JSON.stringify(bySource, null, 2));

console.log('--- Recent IoCs (last 30 minutes) ---');
const recent = db.prepare("SELECT COUNT(*) as count FROM iocs WHERE created_at > datetime('now', '-30 minutes')").get();
console.log(JSON.stringify(recent, null, 2));

console.log('--- Sample Recent Data ---');
const sample = db.prepare("SELECT ioc, source, created_at FROM iocs ORDER BY created_at DESC LIMIT 5").all();
console.log(JSON.stringify(sample, null, 2));
