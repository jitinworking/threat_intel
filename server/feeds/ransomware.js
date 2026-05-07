import fetch from 'node-fetch';
import { getDB } from '../db.js';

export async function pollRansomware() {
  const db = getDB();
  try {
    // ransomware.live API for recent victims
    const res = await fetch('https://api.ransomware.live/recentvictims');
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const json = await res.json();

    if (!Array.isArray(json)) {
      console.warn('[Ransomware] No valid data found');
      return 0;
    }

    const insertSql = `
      INSERT INTO ransomware_leaks (group_name, victim_name, victim_url, description, published_at)
      VALUES (?, ?, ?, ?, ?)
    `;

    let count = 0;
    const recent = json.slice(0, 50); // Get latest 50
    const batch = [];
    
    // Get existing leaks to avoid duplicates since we don't have a unique constraint on victim_name + group_name yet
    // Alternatively, just use INSERT OR IGNORE and alter the table if needed.
    // For now, we'll try to insert and catch errors, or fetch existing.
    
    // Let's first get existing victim names to prevent duplicates
    const existingRes = await db.execute('SELECT victim_name FROM ransomware_leaks');
    const existingVictims = new Set(existingRes.rows.map(r => r.victim_name));

    for (const leak of recent) {
      if (!existingVictims.has(leak.post_title)) {
        try {
          batch.push({ sql: insertSql, args: [
            leak.group_name || 'Unknown',
            leak.post_title || 'Unknown Victim',
            leak.post_url || '',
            leak.description || '',
            leak.published || new Date().toISOString()
          ] });
          count++;
          existingVictims.add(leak.post_title);
        } catch (e) {}
      }
    }
    
    if (batch.length > 0) {
      try {
        await db.batch(batch, 'write');
      } catch (e) { console.error('[Ransomware] Batch error:', e.message); }
    }

    console.log(`[Ransomware] Ingested ${count} new leak(s)`);
    return count;
  } catch (err) {
    console.error('[Ransomware] Error:', err.message);
    return 0;
  }
}
