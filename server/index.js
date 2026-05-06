import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { initDB, getDB } from './db.js';
import { startCronJobs } from './cron.js';
import { runAllFeeds } from './feeds/index.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Initialize database
initDB();

// WebSocket connections
const clients = new Set();
wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[WS] Client connected. Total: ${clients.size}`);
  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WS] Client disconnected. Total: ${clients.size}`);
  });
});

export function broadcast(type, data) {
  const msg = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(msg);
    }
  }
}

// =================== API ROUTES ===================

// GET /health — server health check for UptimeRobot
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// GET /api/iocs — paginated list
app.get('/api/iocs', async (req, res) => {
  const db = getDB();
  const limit = Math.min(parseInt(req.query.limit) || 100, 50000);
  const offset = parseInt(req.query.offset) || 0;
  const source = req.query.source || '';
  const search = req.query.search || '';
  const iocType = req.query.ioc_type || '';
  const days = parseInt(req.query.days) || 0;

  let query = 'SELECT * FROM iocs WHERE 1=1';
  const params = [];

  if (days > 0) { query += " AND created_at > datetime('now', ?)"; params.push(`-${days} day`); }
  if (source) { query += ' AND source = ?'; params.push(source); }
  if (iocType) { query += ' AND ioc_type = ?'; params.push(iocType); }
  if (search) { query += ' AND (ioc LIKE ? OR malware LIKE ? OR tags LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  try {
    const iocsRes = await db.execute({ sql: query, args: params });
    const iocs = iocsRes.rows;
    
    const totalRes = await db.execute('SELECT COUNT(*) as count FROM iocs');
    const total = totalRes.rows[0];

    // Helper for safe JSON parsing
    const safeParse = (str, fallback) => {
      try {
        const parsed = JSON.parse(str || 'null');
        return (parsed !== null && typeof parsed === typeof fallback) ? parsed : fallback;
      } catch { return fallback; }
    };

    // Parse JSON fields
    const parsed = iocs.map(ioc => ({
      ...ioc,
      tags: safeParse(ioc.tags, []),
      enrichment: safeParse(ioc.enrichment, {}),
      mitre_techniques: safeParse(ioc.mitre_techniques, []),
    }));

    res.json({ iocs: parsed, total: total.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/iocs — add custom IoC
app.post('/api/iocs', async (req, res) => {
  const db = getDB();
  const { ioc, ioc_type, malware_printable, confidence_level, tags } = req.body;
  
  if (!ioc || !ioc_type) {
    return res.status(400).json({ error: 'Missing required fields: ioc, ioc_type' });
  }

  try {
    const result = await db.execute({
      sql: `INSERT INTO iocs (ioc, ioc_type, malware_printable, confidence_level, source, tags, first_seen)
            VALUES (?, ?, ?, ?, 'Custom Intel', ?, datetime('now'))`,
      args: [ioc, ioc_type, malware_printable || '', parseInt(confidence_level) || 100, JSON.stringify(tags || [])]
    });
    
    // Broadcast real-time update
    broadcast('new_iocs', { count: 1 });
    res.json({ ok: true, id: Number(result.lastInsertRowid) });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'This IoC already exists.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats — dashboard statistics
app.get('/api/stats', async (req, res) => {
  const db = getDB();
  try {
    const [totalIocsRes, bySourceRes, byTypeRes, recent24hRes, feedsRes] = await Promise.all([
      db.execute('SELECT COUNT(*) as count FROM iocs'),
      db.execute('SELECT source, COUNT(*) as count FROM iocs GROUP BY source'),
      db.execute('SELECT ioc_type, COUNT(*) as count FROM iocs GROUP BY ioc_type'),
      db.execute("SELECT COUNT(*) as count FROM iocs WHERE created_at > datetime('now', '-1 day')"),
      db.execute('SELECT name, enabled, last_polled FROM feeds')
    ]);

    res.json({ 
      totalIocs: totalIocsRes.rows[0].count, 
      bySource: bySourceRes.rows, 
      byType: byTypeRes.rows, 
      recent24h: recent24hRes.rows[0].count, 
      feeds: feedsRes.rows 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/trend — last 7 days aggregation
app.get('/api/stats/trend', async (req, res) => {
  const db = getDB();
  try {
    const trendRes = await db.execute(`
      WITH RECURSIVE days(d) AS (
        SELECT date('now', '-6 days')
        UNION ALL
        SELECT date(d, '+1 day') FROM days WHERE d < date('now')
      )
      SELECT 
        CASE strftime('%w', d.d)
          WHEN '0' THEN 'Sun' WHEN '1' THEN 'Mon' WHEN '2' THEN 'Tue'
          WHEN '3' THEN 'Wed' WHEN '4' THEN 'Thu' WHEN '5' THEN 'Fri'
          WHEN '6' THEN 'Sat' ELSE '???'
        END as name,
        COUNT(i.id) as threats
      FROM days d
      LEFT JOIN iocs i ON date(i.created_at, 'localtime') = d.d
      GROUP BY d.d
      ORDER BY d.d ASC
    `);
    
    res.json(trendRes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/oracle/forecast — Dynamic threat forecasting
app.get('/api/oracle/forecast', async (req, res) => {
  const db = getDB();
  try {
    // 1. Calculate IoC Velocity (Last 24h vs Avg of last 7 days)
    const recent24hRes = await db.execute("SELECT COUNT(*) as count FROM iocs WHERE created_at > datetime('now', '-1 day')");
    const last7dRes = await db.execute("SELECT COUNT(*) as count FROM iocs WHERE created_at > datetime('now', '-7 days')");
    
    const recent24h = Number(recent24hRes.rows[0].count);
    const last7d = Number(last7dRes.rows[0].count);
    const avgPd = last7d / 7;
    const velocity = avgPd > 0 ? (recent24h / avgPd) : 1;
    
    // 2. Malware Diversity (Unique families in last 3 days)
    const malwareCountRes = await db.execute("SELECT COUNT(DISTINCT malware) as count FROM iocs WHERE malware != '' AND created_at > datetime('now', '-3 days')");
    const malwareCount = Number(malwareCountRes.rows[0].count);
    
    // 3. Base Likelihood Calculation
    let likelihood = 30 + (velocity * 10) + (malwareCount * 2);
    likelihood = Math.min(Math.round(likelihood), 95);

    // 4. Sector Probabilities (weighted by source/tags)
    const sectors = [
      { sector: 'Financial Services', base: 40, keywords: ['bank', 'finance', 'payment'] },
      { sector: 'Supply Chain / MSPs', base: 35, keywords: ['supply', 'msp', 'it'] },
      { sector: 'Healthcare', base: 30, keywords: ['health', 'hospital', 'medical'] },
      { sector: 'Critical Infrastructure', base: 45, keywords: ['energy', 'grid', 'water'] },
      { sector: 'Government & Defense', base: 50, keywords: ['gov', 'mil', 'defense'] },
    ];

    const sectorThreats = [];
    for (const s of sectors) {
      const tagMatchRes = await db.execute({
        sql: `SELECT COUNT(*) as count FROM iocs WHERE (tags LIKE ? OR ioc LIKE ?) AND created_at > datetime('now', '-7 days')`,
        args: [`%${s.keywords[0]}%`, `%${s.keywords[0]}%`]
      });
      const tagMatch = Number(tagMatchRes.rows[0].count);
      let prob = s.base + (tagMatch * 5) + (velocity * 2);
      sectorThreats.push({
        sector: s.sector,
        probability: Math.min(Math.round(prob), 98),
        trend: velocity > 1.2 ? 'up' : velocity < 0.8 ? 'down' : 'stable',
        primaryActor: 'Multiple Clusters'
      });
    }

    // 5. Generate forecast graph data (7 days)
    const forecastData = [];
    for(let i=0; i<7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayLikelihood = Math.min(Math.max(likelihood + (Math.sin(i) * 10) * velocity, 20), 99);
      forecastData.push({
        day: dayName,
        likelihood: Math.round(dayLikelihood),
        activeThreats: Math.round(recent24h / 10 + (Math.random() * 5))
      });
    }

    res.json({
      likelihood,
      velocity: velocity.toFixed(2),
      malwareDiversity: malwareCount,
      sectorThreats,
      forecastData,
      summary: `The Oracle has detected a ${velocity > 1.5 ? 'significant spike' : 'steady flow'} of ${malwareCount} unique malware variants. Relative velocity is ${velocity.toFixed(2)}x normal levels.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/feeds — list feeds
app.get('/api/feeds', async (req, res) => {
  const db = getDB();
  try {
    const feedsRes = await db.execute('SELECT * FROM feeds');
    res.json(feedsRes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/feeds/:id — toggle feed
app.put('/api/feeds/:id', async (req, res) => {
  const db = getDB();
  const { enabled } = req.body;
  try {
    await db.execute({
      sql: 'UPDATE feeds SET enabled = ? WHERE id = ?',
      args: [enabled ? 1 : 0, req.params.id]
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/alerts — recent alerts
app.get('/api/alerts', async (req, res) => {
  const db = getDB();
  try {
    const alertsRes = await db.execute('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 50');
    res.json(alertsRes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET/PUT /api/settings — key-value settings
app.get('/api/settings', async (req, res) => {
  const db = getDB();
  try {
    const rowsRes = await db.execute('SELECT * FROM settings');
    const settings = {};
    for (const r of rowsRes.rows) settings[r.key] = r.value;
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings', async (req, res) => {
  const db = getDB();
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await db.execute({
        sql: 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        args: [key, String(value)]
      });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/news — list news articles
app.get('/api/news', async (req, res) => {
  const db = getDB();
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  try {
    const newsRes = await db.execute({
      sql: 'SELECT * FROM news ORDER BY published_at DESC LIMIT ?',
      args: [limit]
    });
    res.json(newsRes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sync — force-run all feeds now
app.post('/api/sync', async (req, res) => {
  try {
    const result = await runAllFeeds();
    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/correlations — find related IoCs
app.get('/api/correlations', async (req, res) => {
  const db = getDB();
  const ioc = req.query.ioc;
  if (!ioc) return res.json([]);

  try {
    const targetRes = await db.execute({
      sql: 'SELECT * FROM iocs WHERE ioc = ?',
      args: [ioc]
    });
    const target = targetRes.rows[0];
    if (!target) return res.json([]);

    const relatedRes = await db.execute({
      sql: 'SELECT * FROM iocs WHERE malware = ? AND ioc != ? LIMIT 20',
      args: [target.malware, ioc]
    });

    res.json({ target, related: relatedRes.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/investigate/:id — Aggregate investigation brief
app.get('/api/investigate/:id', async (req, res) => {
  const db = getDB();
  const id = req.params.id;
  
  try {
    const iocRes = await db.execute({
      sql: 'SELECT * FROM iocs WHERE id = ?',
      args: [id]
    });
    const ioc = iocRes.rows[0];
    if (!ioc) return res.status(404).json({ error: 'IoC not found' });

    // 1. Get Correlations
    const relatedRes = await db.execute({
      sql: 'SELECT * FROM iocs WHERE malware = ? AND id != ? LIMIT 10',
      args: [ioc.malware, id]
    });
    const related = relatedRes.rows;

    // 2. Mock AI Brief Generation
    const brief = {
      summary: `This ${ioc.ioc_type} indicator was first identified on ${ioc.first_seen}. It is strongly associated with the ${ioc.malware || 'unidentified'} malware family. Indicators show this infrastructure is likely part of a broader campaign targeting ${JSON.parse(ioc.tags || '[]').join(', ') || 'multiple sectors'}.`,
      risk_score: ioc.confidence_level || 75,
      recommended_action: ioc.ioc_type === 'ipv4' ? 'Block at Egress Firewall' : ioc.ioc_type === 'domain' ? 'DNS Sinkhole' : 'Purge from Endpoints',
      historical_hits: related.length,
      threat_actor_match: ioc.malware === 'Trickbot' ? 'Lazarus Group (Cluster)' : 'Generic Cybercrime'
    };

    res.json({ ioc, related, brief });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sandbox — Mock sandbox submission
app.post('/api/sandbox', (req, res) => {
  const { ioc, type } = req.body;
  const db = getDB();
  
  const jobId = `SB-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  res.json({ 
    ok: true, 
    jobId, 
    status: 'In Progress', 
    target: ioc,
    eta: '45 seconds'
  });
});

// GET /api/pivot/:ioc — JARM/SSL Certificate Pivoting
app.get('/api/pivot/:ioc', async (req, res) => {
  const db = getDB();
  const ioc = req.params.ioc;
  
  try {
    // 1. Mock JARM/SSL Hash from Shodan/Censys
    const mockJarmHash = '27d27d27d27d27d27d27d27d27d27d27d27d27d27d27d27d27d27d27d27d27d';
    
    // 2. Find other IPs in our DB that "share" this infrastructure
    const targetRes = await db.execute({ sql: 'SELECT * FROM iocs WHERE ioc = ?', args: [ioc] });
    const target = targetRes.rows[0];
    
    if (!target) return res.status(404).json({ error: 'IoC not found' });
    
    const relatedRes = await db.execute({
      sql: 'SELECT * FROM iocs WHERE malware = ? AND ioc != ? ORDER BY RANDOM() LIMIT 5',
      args: [target.malware || 'Trickbot', ioc]
    });
    
    res.json({
      target_ioc: ioc,
      jarm_hash: mockJarmHash,
      ssl_issuer: "Let's Encrypt Authority X3",
      pivoted_infrastructure: relatedRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/campaigns — list tracked campaigns
app.get('/api/campaigns', async (req, res) => {
  const db = getDB();
  try {
    const campaignsRes = await db.execute('SELECT * FROM campaigns ORDER BY last_updated DESC LIMIT 50');
    res.json(campaignsRes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/campaigns — create campaign
app.post('/api/campaigns', async (req, res) => {
  const db = getDB();
  const { name, description, threat_actor } = req.body;
  try {
    const result = await db.execute({
      sql: 'INSERT INTO campaigns (name, description, threat_actor) VALUES (?, ?, ?)',
      args: [name, description, threat_actor]
    });
    res.json({ ok: true, id: Number(result.lastInsertRowid) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== START ===================
const PORT = process.env.PORT || 3001;

// Run feeds on startup
setTimeout(async () => {
  console.log('[STARTUP] Running initial feed ingestion...');
  try {
    await runAllFeeds();
    console.log('[STARTUP] Initial feed ingestion complete.');
  } catch (err) {
    console.error('[STARTUP] Feed ingestion error:', err.message);
  }
}, 2000);

// Start cron jobs
startCronJobs();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] Threat Intel Backend running on http://0.0.0.0:${PORT}`);
  console.log(`[WS] WebSocket server ready on ws://0.0.0.0:${PORT}`);
});
