import { getDB, initDB } from './server/db.js';

async function testDecay() {
  await initDB();
  const db = getDB();
  
  // Insert an old IoC
  await db.execute({
    sql: `INSERT OR IGNORE INTO iocs (ioc, ioc_type, source, confidence_level, created_at, last_seen) VALUES (?, ?, ?, ?, datetime('now', '-10 days'), datetime('now', '-10 days'))`,
    args: ['1.1.1.99', 'ip', 'test', 100]
  });

  console.log("Inserted old IoC.");

  // Run the decay query
  const res = await db.execute(`
    UPDATE iocs 
    SET confidence_level = MAX(0, confidence_level - 5) 
    WHERE (date(last_seen) < date('now', '-7 days') OR (last_seen = '' AND date(created_at) < date('now', '-7 days')))
    AND confidence_level > 0
  `);

  console.log(`Decayed ${res.rowsAffected} rows.`);

  // Check the IoC
  const checkRes = await db.execute("SELECT confidence_level FROM iocs WHERE ioc = '1.1.1.99'");
  console.log("New confidence:", checkRes.rows[0].confidence_level);

  // Clean up
  await db.execute("DELETE FROM iocs WHERE ioc = '1.1.1.99'");
}

testDecay().catch(console.error);
