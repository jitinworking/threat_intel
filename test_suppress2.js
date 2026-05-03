import { initDB, getDB } from './server/db.js';

async function test() {
  await initDB();
  const db = getDB();
  
  console.log("Testing execute:");
  const res1 = await db.execute({
    sql: "INSERT INTO iocs (ioc, ioc_type, source) VALUES (?, ?, ?)",
    args: ['8.8.8.8', 'ip', 'test']
  });
  console.log("Insert 8.8.8.8 affected rows:", res1.rowsAffected);

  const res2 = await db.execute({
    sql: "INSERT INTO iocs (ioc, ioc_type, source) VALUES (?, ?, ?)",
    args: ['192.168.1.1', 'ip', 'test']
  });
  console.log("Insert 192.168.1.1 affected rows:", res2.rowsAffected);

  const res3 = await db.execute({
    sql: "INSERT INTO iocs (ioc, ioc_type, source) VALUES (?, ?, ?)",
    args: ['11.22.33.44', 'ip', 'test']
  });
  console.log("Insert 11.22.33.44 affected rows:", res3.rowsAffected);

  console.log("Testing batch:");
  const batchRes = await db.batch([
    { sql: "INSERT INTO iocs (ioc, ioc_type, source) VALUES (?, ?, ?)", args: ['1.1.1.1', 'ip', 'test'] },
    { sql: "INSERT INTO iocs (ioc, ioc_type, source) VALUES (?, ?, ?)", args: ['55.66.77.88', 'ip', 'test'] }
  ], 'write');
  console.log("Batch insert:", batchRes.length, "statements executed.");

  await db.execute("DELETE FROM iocs WHERE source = 'test'");
}

test().catch(console.error);
