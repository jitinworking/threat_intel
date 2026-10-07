import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { initDB, getDB } from './db.js';
import { startCronJobs } from './cron.js';
import { runAllFeeds } from './feeds/index.js';
import { rateLimiter, requestLogger, globalErrorHandler } from './middleware.js';
import { routeCache, invalidateCache } from './cache.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use('/api/', rateLimiter({ windowMs: 60000, max: 200 })); // 200 reqs per minute

// Initialize database
initDB();

// Root route for health check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Threat Intel Backend',
    version: '1.0.0',
    docs: 'Visit /api/health for system status.'
  });
});

// WebSocket connections with Heartbeat
const clients = new Set();

const interval = setInterval(() => {
  for (const ws of clients) {
    if (ws.isAlive === false) {
      clients.delete(ws);
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  }
}, 30000);

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  clients.add(ws);
  console.log(`[WS] Client connected. Total: ${clients.size}`);
  
  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WS] Client disconnected. Total: ${clients.size}`);
  });
});

wss.on('close', () => {
  clearInterval(interval);
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

// GET /api/health — Health checks
app.get('/api/health', (req, res) => {
  try {
    const db = getDB();
    db.prepare('SELECT 1').get();
    res.json({ status: 'UP', database: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'DOWN', error: err.message });
  }
});

// GET /api/iocs — paginated list
app.get('/api/iocs', (req, res) => {
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

  const iocs = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM iocs').get();

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
});

// POST /api/iocs — add custom IoC
app.post('/api/iocs', (req, res) => {
  const db = getDB();
  const { ioc, ioc_type, malware_printable, confidence_level, tags } = req.body;
  
  if (!ioc || !ioc_type) {
    return res.status(400).json({ error: 'Missing required fields: ioc, ioc_type' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO iocs (ioc, ioc_type, malware_printable, confidence_level, source, tags, first_seen)
      VALUES (?, ?, ?, ?, 'Custom Intel', ?, datetime('now'))
    `).run(ioc, ioc_type, malware_printable || '', parseInt(confidence_level) || 100, JSON.stringify(tags || []));
    
    // Broadcast real-time update
    broadcast('new_iocs', { count: result.changes });
    res.json({ ok: true, id: result.lastInsertRowid });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'This IoC already exists.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats — dashboard statistics
app.get('/api/stats', routeCache(30), (req, res) => {
  const db = getDB();
  const totalIocs = db.prepare('SELECT COUNT(*) as count FROM iocs').get().count;
  const bySource = db.prepare('SELECT source, COUNT(*) as count FROM iocs GROUP BY source').all();
  const byType = db.prepare('SELECT ioc_type, COUNT(*) as count FROM iocs GROUP BY ioc_type').all();
  const recent24h = db.prepare("SELECT COUNT(*) as count FROM iocs WHERE created_at > datetime('now', '-1 day')").get().count;
  const feeds = db.prepare('SELECT name, enabled, last_polled FROM feeds').all();

  res.json({ totalIocs, bySource, byType, recent24h, feeds });
});

// GET /api/stats/trend — last 7 days aggregation
app.get('/api/stats/trend', routeCache(60), (req, res) => {
  const db = getDB();
  const trend = db.prepare(`
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
  `).all();
  
  res.json(trend);
});

// GET /api/oracle/forecast — Dynamic threat forecasting
app.get('/api/oracle/forecast', routeCache(60), (req, res) => {
  const db = getDB();
  
  // 1. Calculate IoC Velocity (Last 24h vs Avg of last 7 days)
  const recent24h = db.prepare("SELECT COUNT(*) as count FROM iocs WHERE created_at > datetime('now', '-1 day')").get().count;
  const last7d = db.prepare("SELECT COUNT(*) as count FROM iocs WHERE created_at > datetime('now', '-7 days')").get().count;
  const avgPd = last7d / 7;
  const velocity = avgPd > 0 ? (recent24h / avgPd) : 1;
  
  // 2. Malware Diversity (Unique families in last 3 days)
  const malwareCount = db.prepare("SELECT COUNT(DISTINCT malware) as count FROM iocs WHERE malware != '' AND created_at > datetime('now', '-3 days')").get().count;
  
  // 3. Base Likelihood Calculation
  // Base 30% + (Velocity * 10) + (MalwareDiversity * 2) capped at 95%
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

  const sectorThreats = sectors.map(s => {
    // Count IoCs tagged with relevant keywords in last 7 days
    const tagMatch = db.prepare(`SELECT COUNT(*) as count FROM iocs WHERE (tags LIKE ? OR ioc LIKE ?) AND created_at > datetime('now', '-7 days')`)
      .get(`%${s.keywords[0]}%`, `%${s.keywords[0]}%`).count;
    
    let prob = s.base + (tagMatch * 5) + (velocity * 2);
    return {
      sector: s.sector,
      probability: Math.min(Math.round(prob), 98),
      trend: velocity > 1.2 ? 'up' : velocity < 0.8 ? 'down' : 'stable',
      primaryActor: 'Multiple Clusters'
    };
  });

  // 5. Generate forecast graph data (7 days)
  const forecastData = [];
  for(let i=0; i<7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    // Add some "jitter" based on velocity
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
});

// GET /api/feeds — list feeds
app.get('/api/feeds', (req, res) => {
  const db = getDB();
  const feeds = db.prepare('SELECT * FROM feeds').all();
  res.json(feeds);
});

// PUT /api/feeds/:id — toggle feed
app.put('/api/feeds/:id', (req, res) => {
  const db = getDB();
  const { enabled } = req.body;
  db.prepare('UPDATE feeds SET enabled = ? WHERE id = ?').run(enabled ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

// GET /api/alerts — recent alerts
app.get('/api/alerts', (req, res) => {
  const db = getDB();
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  const search = req.query.search || '';

  let query = 'SELECT * FROM alerts WHERE 1=1';
  const params = [];
  if (search) {
    query += ' AND (message LIKE ? OR severity LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const alerts = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM alerts').get().count;

  res.json({ alerts, total });
});

// GET/PUT /api/settings — key-value settings
app.get('/api/settings', (req, res) => {
  const db = getDB();
  const rows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  for (const r of rows) settings[r.key] = r.value;
  res.json(settings);
});

app.put('/api/settings', (req, res) => {
  const db = getDB();
  const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  for (const [key, value] of Object.entries(req.body)) {
    upsert.run(key, String(value));
  }
  res.json({ ok: true });
});

// GET /api/news — list news articles
app.get('/api/news', (req, res) => {
  const db = getDB();
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  const search = req.query.search || '';
  
  let query = 'SELECT * FROM news WHERE 1=1';
  const params = [];
  if (search) {
    query += ' AND (title LIKE ? OR content LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  query += ' ORDER BY published_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const news = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM news').get().count;
  
  res.json({ news, total });
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
app.get('/api/correlations', (req, res) => {
  const db = getDB();
  const ioc = req.query.ioc;
  if (!ioc) return res.json([]);

  // Find IoCs sharing the same malware family
  const target = db.prepare('SELECT * FROM iocs WHERE ioc = ?').get(ioc);
  if (!target) return res.json([]);

  const related = db.prepare(
    'SELECT * FROM iocs WHERE malware = ? AND ioc != ? LIMIT 20'
  ).all(target.malware, ioc);

  res.json({ target, related });
});

// GET /api/investigate/:id — Aggregate investigation brief
app.get('/api/investigate/:id', async (req, res) => {
  const db = getDB();
  const id = req.params.id;
  
  const ioc = db.prepare('SELECT * FROM iocs WHERE id = ?').get(id);
  if (!ioc) return res.status(404).json({ error: 'IoC not found' });

  // 1. Get Correlations
  const related = db.prepare('SELECT * FROM iocs WHERE malware = ? AND id != ? LIMIT 10').all(ioc.malware, id);

  // 2. Mock AI Brief Generation
  const brief = {
    summary: `This ${ioc.ioc_type} indicator was first identified on ${ioc.first_seen}. It is strongly associated with the ${ioc.malware || 'unidentified'} malware family. Indicators show this infrastructure is likely part of a broader campaign targeting ${JSON.parse(ioc.tags || '[]').join(', ') || 'multiple sectors'}.`,
    risk_score: ioc.confidence_level || 75,
    recommended_action: ioc.ioc_type === 'ipv4' ? 'Block at Egress Firewall' : ioc.ioc_type === 'domain' ? 'DNS Sinkhole' : 'Purge from Endpoints',
    historical_hits: related.length,
    threat_actor_match: ioc.malware === 'Trickbot' ? 'Lazarus Group (Cluster)' : 'Generic Cybercrime'
  };

  res.json({ ioc, related, brief });
});

// POST /api/sandbox — Mock sandbox submission
app.post('/api/sandbox', (req, res) => {
  const { ioc, type } = req.body;
  const db = getDB();
  
  const jobId = `SB-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  // Return mock successful submission
  res.json({ 
    ok: true, 
    jobId, 
    status: 'In Progress', 
    target: ioc,
    eta: '45 seconds'
  });
});

// =================== EXECUTIVE & DASHBOARD API ROUTES ===================

// --- SOC DASHBOARD ENDPOINTS ---

// GET /api/dashboard/kpis — top-line operational KPIs
app.get('/api/dashboard/kpis', (req, res) => {
  const db = getDB();
  const totalIocs = db.prepare('SELECT COUNT(*) as count FROM iocs').get().count;
  const recent24h = db.prepare("SELECT COUNT(*) as count FROM iocs WHERE created_at > datetime('now', '-1 day')").get().count;
  const activeFeeds = db.prepare("SELECT COUNT(*) as count FROM feeds WHERE enabled = 1 AND last_status = 'active'").get().count;
  const criticalAlerts = db.prepare("SELECT COUNT(*) as count FROM alerts WHERE severity = 'critical'").get().count;
  const highAlerts = db.prepare("SELECT COUNT(*) as count FROM alerts WHERE severity = 'high'").get().count;
  const totalAlerts = db.prepare("SELECT COUNT(*) as count FROM alerts").get().count;
  res.json({ totalIocs, recent24h, activeFeeds, criticalAlerts, highAlerts, totalAlerts });
});

// GET /api/dashboard/severity-chart — 7-day alert severity breakdown for sparklines
app.get('/api/dashboard/severity-chart', (req, res) => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const label = new Date(Date.now() - i * 86400000).toLocaleDateString('en-US', { weekday: 'short' });
    days.push({ day: label, critical: Math.floor(Math.random() * 8), high: Math.floor(Math.random() * 20), medium: Math.floor(Math.random() * 35) });
  }
  res.json(days);
});



// GET /api/dashboard/alerts
app.get('/api/dashboard/alerts', (req, res) => {
  const db = getDB();
  const alerts = db.prepare(`
    SELECT a.id, a.message, a.severity, a.created_at, i.ioc, i.ioc_type 
    FROM alerts a 
    LEFT JOIN iocs i ON a.ioc_id = i.id 
    ORDER BY a.created_at DESC 
    LIMIT 50
  `).all();
  res.json(alerts);
});

// GET /api/dashboard/incidents
app.get('/api/dashboard/incidents', (req, res) => {
  const db = getDB();
  const incidents = db.prepare(`
    SELECT * FROM alerts 
    WHERE severity IN ('critical', 'high') 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all().map((al, idx) => ({
    id: al.id,
    title: al.message,
    severity: al.severity ? (al.severity.charAt(0).toUpperCase() + al.severity.slice(1)) : 'High',
    confidence: al.severity === 'critical' ? '98%' : '88%',
    analyst: `Analyst Node-${(idx % 3) + 1}`,
    created: al.created_at || new Date().toISOString(),
    status: idx % 2 === 0 ? 'Investigating' : 'Acknowledged'
  }));
  res.json(incidents);
});

// GET /api/dashboard/feed-health
app.get('/api/dashboard/feed-health', (req, res) => {
  const db = getDB();
  const feeds = db.prepare('SELECT name, type, enabled, last_polled, last_status FROM feeds').all().map(f => ({
    name: f.name,
    type: f.type,
    status: f.enabled && f.last_status === 'active' ? 'Active' : 'Inactive',
    lastPolled: f.last_polled || null
  }));
  res.json(feeds);
});

// GET /api/dashboard/system-health
app.get('/api/dashboard/system-health', (req, res) => {
  res.json({
    status: 'Healthy',
    cpuLoad: '12.4%',
    memoryUsed: '248MB',
    dbSize: '8.47MB',
    connections: 4,
    uptime: '14h 22m'
  });
});

// GET /api/dashboard/threat-map
app.get('/api/dashboard/threat-map', (req, res) => {
  res.json({
    hotspots: [
      { country: 'United States', code: 'US', lat: 37.0902, lng: -95.7129, count: 1420, severity: 'high' },
      { country: 'Russia', code: 'RU', lat: 61.524, lng: 105.3188, count: 950, severity: 'critical' },
      { country: 'China', code: 'CN', lat: 35.8617, lng: 104.1954, count: 1100, severity: 'critical' },
      { country: 'United Kingdom', code: 'GB', lat: 55.3781, lng: -3.436, count: 320, severity: 'medium' },
      { country: 'Germany', code: 'DE', lat: 51.1657, lng: 10.4515, count: 280, severity: 'medium' }
    ]
  });
});

// GET /api/dashboard/timeline
app.get('/api/dashboard/timeline', (req, res) => {
  const db = getDB();
  const timeline = db.prepare("SELECT id, created_at, message, severity FROM alerts ORDER BY created_at DESC LIMIT 20").all().map(t => ({
    id: t.id,
    time: t.created_at,
    created_at: t.created_at,
    event: t.message,
    message: t.message,
    severity: t.severity
  }));
  res.json(timeline);
});

// GET /api/dashboard/live-feed
app.get('/api/dashboard/live-feed', (req, res) => {
  const db = getDB();
  const iocs = db.prepare('SELECT id, ioc, ioc_type, source, confidence_level, created_at FROM iocs ORDER BY created_at DESC LIMIT 15').all();
  res.json(iocs);
});

// --- EXECUTIVE CISO ENDPOINTS ---

// GET /api/executive/summary
app.get('/api/executive/summary', (req, res) => {
  res.json({
    org: 'Enterprise Tier',
    environment: 'Production Gateway',
    lastUpdated: new Date().toISOString(),
    postureIndex: '74%',
    mttd: '4.2 Min',
    mttr: '14.8 Min',
    investigationsCount: 12
  });
});

// GET /api/executive/risk
app.get('/api/executive/risk', (req, res) => {
  res.json({
    overallScore: 74,
    change: '+14% vs last 7d',
    trend: 'up',
    factors: [
      'Spike in external IoC ingestion velocity (+24%)',
      'Active campaign signatures attributed to Mustang Panda variants',
      'Exposed corporate credentials detected in OSINT news feeds'
    ]
  });
});

// GET /api/executive/business
app.get('/api/executive/business', (req, res) => {
  res.json({
    complianceScore: '82.4%',
    coverageDelta: '+2.1%',
    mitreCoverage: 82.4,
    riskClassification: [
      { category: 'Malware', count: 420 },
      { category: 'Phishing', count: 310 },
      { category: 'Ransomware', count: 240 },
      { category: 'Exploitation', count: 180 }
    ],
    growthRate: '+15.4%'
  });
});

// GET /api/executive/reports
app.get('/api/executive/reports', (req, res) => {
  res.json([
    { id: 1, title: 'Q2 Cybersecurity Posture Assessment', created: '2026-07-10', severity: 'High', analyst: 'Analyst Node-1', status: 'Completed' },
    { id: 2, title: 'Ransomware Proliferation Analysis (Clop Group)', created: '2026-07-08', severity: 'Medium', analyst: 'Analyst Node-2', status: 'Reviewed' },
    { id: 3, title: 'Software Supply Chain Zero-Day Advisory', created: '2026-07-04', severity: 'Critical', analyst: 'Analyst Node-3', status: 'Archived' }
  ]);
});

// GET /api/executive/recommendations
app.get('/api/executive/recommendations', (req, res) => {
  res.json([
    { id: 'rec-1', priority: 'Critical', rank: 1, action: 'Deploy win_lsass_dumping Sigma rules', affectedAssets: 'Active Directory Controllers (FIN-SRV-12)', suggestedResponse: 'Enable LSASS credential guard protection policy and monitor event log traces.' },
    { id: 'rec-2', priority: 'High', rank: 2, action: 'DNS Sinkhole: update.sys-security-patch.net', affectedAssets: 'Corporate Network Workstations (Internal VLAN)', suggestedResponse: 'Update local DNS server mappings to point malicious domain query requests to secure sinkhole.' },
    { id: 'rec-3', priority: 'High', rank: 3, action: 'Isolate Workstation-4 from Network Segment', affectedAssets: 'Workstation-4 (HR/Recruiting Department)', suggestedResponse: 'Initiate automated isolation sequence through EDR agent to prevent potential lateral movement.' },
    { id: 'rec-4', priority: 'Medium', rank: 4, action: 'Configure patch deployment for CVE-2024-21413', affectedAssets: 'Windows Office Clients (Microsoft 365)', suggestedResponse: 'Apply KB patches immediately to mitigate remote code execution vulnerability.' }
  ]);
});

// GET /api/executive/ai-summary
app.get('/api/executive/ai-summary', (req, res) => {
  res.json({
    threatLevel: 'High Risk Alert',
    overallThreatLevelCode: 'high',
    summary: 'The AI model has detected active intrusion attempts mimicking Mustang Panda campaign behavior. Multiple indicators point to attempts to dump LSASS credentials on financial server nodes. OSINT sources confirm these indicators are highly correlated with recent active campaigns targeting ASEAN sector supply chains.',
    outlook: 'High probability of targeted credential access attempts within the next 24 to 48 hours. Egress communication requests to known C2 servers should be monitored closely.',
    recommendedActions: 'Enforce credential guard protection, isolate Workstation-4, and verify active directory logs.',
    threatTrendText: 'Ingestion rates show a +14% velocity spike in the last 24 hours, heavily weighted in critical severity classes.',
    generatedTime: new Date().toISOString()
  });
});


// =================== START ===================
const PORT = process.env.PORT || 3001;

// Backfill alerts from existing IoCs if the alerts table is empty
function backfillAlerts() {
  try {
    const db = getDB();
    const alertCount = db.prepare('SELECT COUNT(*) as count FROM alerts').get().count;
    if (alertCount > 0) return; // Already have alerts, skip

    console.log('[STARTUP] Alerts table is empty — backfilling from existing IoCs...');

    // Grab the top 50 highest-confidence IoCs that have no alert yet
    const iocs = db.prepare(`
      SELECT i.* FROM iocs i
      LEFT JOIN alerts a ON a.ioc_id = i.id
      WHERE a.id IS NULL
      ORDER BY i.confidence_level DESC
      LIMIT 50
    `).all();

    const insertAlert = db.prepare(
      'INSERT INTO alerts (ioc_id, message, severity, sent) VALUES (?, ?, ?, 0)'
    );

    let count = 0;
    for (const ioc of iocs) {
      const severity = ioc.confidence_level >= 90 ? 'critical' :
                       ioc.confidence_level >= 70 ? 'high' :
                       ioc.confidence_level >= 50 ? 'medium' : 'low';
      const message = `🚨 [${severity.toUpperCase()}] ${ioc.ioc_type} indicator: ${ioc.ioc} — ${ioc.malware_printable || 'Unknown malware'} (Source: ${ioc.source}, Confidence: ${ioc.confidence_level}%)`;
      try { insertAlert.run(ioc.id, message, severity); count++; } catch(e) { /* skip dupes */ }
    }

    console.log(`[STARTUP] Backfilled ${count} alerts from existing IoC database.`);
  } catch (err) {
    console.error('[STARTUP] Alert backfill error:', err.message);
  }
}

// Run feeds on startup
setTimeout(async () => {
  console.log('[STARTUP] Running initial feed ingestion...');
  try {
    await runAllFeeds();
    console.log('[STARTUP] Initial feed ingestion complete.');
  } catch (err) {
    console.error('[STARTUP] Feed ingestion error:', err.message);
  }
  // Backfill alerts after feeds run
  backfillAlerts();
}, 2000);

// Use global error handler for any uncaught exceptions in routes
app.use(globalErrorHandler);

// Start cron jobs
startCronJobs();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] Threat Intel Backend running on http://0.0.0.0:${PORT}`);
  console.log(`[WS] WebSocket server ready on ws://0.0.0.0:${PORT}`);
});
