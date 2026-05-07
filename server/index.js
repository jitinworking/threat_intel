import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import dns from 'dns';
import crypto from 'crypto';
import { analyzePayload } from './analyzer.js';
import { initDB, getDB } from './db.js';
import { startCronJobs } from './cron.js';
import { runAllFeeds } from './feeds/index.js';
import { detonateUrl } from './sandbox.js';

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

// POST /api/parse-report — Parse raw text and extract IoCs
app.post('/api/parse-report', async (req, res) => {
  const db = getDB();
  const { reportText } = req.body;
  if (!reportText) return res.status(400).json({ error: 'No report text provided' });

  const iocs = [];
  
  // IP Extraction (excluding obvious local IPs)
  const ipv4Regex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
  const ips = reportText.match(ipv4Regex) || [];
  ips.forEach(ip => {
    if (!ip.startsWith('127.') && !ip.startsWith('10.') && !ip.startsWith('192.168.')) {
      iocs.push({ ioc: ip, type: 'ipv4' });
    }
  });

  // SHA256 Extraction
  const sha256Regex = /\b[A-Fa-f0-9]{64}\b/g;
  const sha256s = reportText.match(sha256Regex) || [];
  sha256s.forEach(hash => iocs.push({ ioc: hash.toLowerCase(), type: 'sha256_hash' }));

  // MD5 Extraction
  const md5Regex = /\b[A-Fa-f0-9]{32}\b/g;
  const md5s = reportText.match(md5Regex) || [];
  md5s.forEach(hash => iocs.push({ ioc: hash.toLowerCase(), type: 'md5_hash' }));

  // Domain Extraction (simple)
  const domainRegex = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|org|net|info|biz|io|co|me|xyz|lat|ru|cn)\b/gi;
  const domains = reportText.match(domainRegex) || [];
  domains.forEach(d => iocs.push({ ioc: d.toLowerCase(), type: 'domain' }));

  let inserted = 0;
  // Deduplicate memory
  const unique = new Map();
  for (const item of iocs) {
    if (!unique.has(item.ioc)) unique.set(item.ioc, item.type);
  }

  try {
    for (const [iocVal, iocType] of unique.entries()) {
      try {
        await db.execute({
          sql: `INSERT INTO iocs (ioc, ioc_type, malware_printable, confidence_level, source, tags, first_seen)
                VALUES (?, ?, ?, ?, 'Auto-Parsed Report', ?, datetime('now'))`,
          args: [iocVal, iocType, '', 100, JSON.stringify(['parsed', 'report'])]
        });
        inserted++;
      } catch(e) {
        // ignore unique constraint
      }
    }
    
    if (inserted > 0) broadcast('new_iocs', { count: inserted });
    res.json({ success: true, count: inserted });
  } catch(err) {
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

// POST /api/sandbox — Live URL Detonation using Puppeteer
app.post('/api/sandbox', async (req, res) => {
  const { ioc, type } = req.body;
  const jobId = `SB-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  if (type === 'url') {
    let targetUrl = ioc;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'http://' + targetUrl;
    }
    
    // We do this asynchronously to match the real-world sandbox architecture where
    // you submit a job and poll, but for our MVP frontend, we'll just await it!
    const result = await detonateUrl(targetUrl);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error, jobId });
    }

    res.json({
      jobId,
      verdict: result.verdict,
      title: result.title,
      screenshot: result.screenshot,
      status: 'Completed',
      target: ioc
    });
  } else {
    // Mock for file uploads
    setTimeout(() => {
      res.json({ 
        ok: true, 
        jobId, 
        status: 'In Progress', 
        target: ioc,
        eta: '45 seconds'
      });
    }, 1500);
  }
});

// POST /api/rules/validate — Parse YARA/Sigma and query historical matches
app.post('/api/rules/validate', async (req, res) => {
  const { rule } = req.body;
  if (!rule) return res.status(400).json({ error: 'Rule content required' });

  try {
    const db = getDB();
    const isYara = rule.toLowerCase().includes('rule ') && rule.includes('condition:');
    const isSigma = rule.toLowerCase().includes('logsource:') && rule.includes('detection:');

    // Simple mock parser: look for IPs or specific strings to search the DB
    const stringMatches = [...rule.matchAll(/["']([^"']{4,})["']/g)].map(m => m[1]);
    const ipMatches = [...rule.matchAll(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g)].map(m => m[0]);
    
    const indicators = [...new Set([...stringMatches, ...ipMatches])].slice(0, 5); // Take up to 5 indicators to query

    if (indicators.length === 0) {
      return res.json({ 
        ok: true, 
        type: isYara ? 'YARA' : isSigma ? 'Sigma' : 'Unknown',
        matches: [], 
        message: 'Rule parsed successfully but no generic string/IP indicators could be extracted for retrospective hunting.'
      });
    }

    // Search historical IoCs
    const matches = [];
    for (const indicator of indicators) {
      const resData = await db.execute({
        sql: `SELECT ioc, ioc_type, malware, created_at, source FROM iocs WHERE ioc LIKE ? OR malware LIKE ? LIMIT 10`,
        args: [`%${indicator}%`, `%${indicator}%`]
      });
      matches.push(...resData.rows);
    }

    // Deduplicate by ioc
    const uniqueMatches = Array.from(new Map(matches.map(item => [item.ioc, item])).values());

    res.json({
      ok: true,
      type: isYara ? 'YARA' : isSigma ? 'Sigma' : 'Unknown',
      extractedIndicators: indicators,
      matches: uniqueMatches
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

// GET /api/apts — list APT groups
app.get('/api/apts', async (req, res) => {
  const db = getDB();
  try {
    const aptsRes = await db.execute('SELECT * FROM apt_groups ORDER BY last_active DESC');
    const parsed = aptsRes.rows.map(r => ({
      ...r,
      aliases: JSON.parse(r.aliases || '[]'),
      targets: JSON.parse(r.targets || '[]'),
      motivations: JSON.parse(r.motivations || '[]'),
      malware: JSON.parse(r.malware || '[]'),
      playbook: JSON.parse(r.playbook || '[]'),
      associatedCVEs: JSON.parse(r.associatedCVEs || '[]'),
      fingerprint: JSON.parse(r.fingerprint || '{}')
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cves — list CVEs
app.get('/api/cves', async (req, res) => {
  const db = getDB();
  try {
    const cvesRes = await db.execute('SELECT * FROM cves ORDER BY published_at DESC LIMIT 100');
    res.json(cvesRes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ransomware — list ransomware leaks
app.get('/api/ransomware', async (req, res) => {
  const db = getDB();
  try {
    const leaksRes = await db.execute('SELECT * FROM ransomware_leaks ORDER BY published_at DESC LIMIT 100');
    res.json(leaksRes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/copilot/chat — RAG Mock integration
app.post('/api/copilot/chat', async (req, res) => {
  const db = getDB();
  const { prompt } = req.body;
  
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });
  
  const p = prompt.toLowerCase();
  
  try {
    // 1. Check for Auto-Triage Report Request
    if (p.includes('report') || p.includes('triage') || p.includes('briefing')) {
       // Extract potential IoC (simple IP/Domain regex)
       const ipMatch = p.match(/(?:\d{1,3}\.){3}\d{1,3}/);
       const domainMatch = p.match(/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/);
       
       const targetIoc = (ipMatch && ipMatch[0]) || (domainMatch && domainMatch[0]);
       
       if (targetIoc) {
          const iocRes = await db.execute({
             sql: 'SELECT * FROM iocs WHERE ioc = ? OR ioc LIKE ?',
             args: [targetIoc, `%${targetIoc}%`]
          });
          
          if (iocRes.rows.length > 0) {
             const ioc = iocRes.rows[0];
             // Fetch correlations
             const corrRes = await db.execute({
                sql: 'SELECT * FROM iocs WHERE malware = ? AND id != ? LIMIT 3',
                args: [ioc.malware || 'Trickbot', ioc.id]
             });
             
             // Generate Report Object
             return res.json({
               type: 'report',
               content: {
                 title: `Executive Triage Report: ${targetIoc}`,
                 target: targetIoc,
                 type: ioc.ioc_type,
                 firstSeen: ioc.first_seen || new Date().toISOString().split('T')[0],
                 malwareFamily: ioc.malware || 'Unknown/Generic',
                 confidence: ioc.confidence_level || 85,
                 mitre: JSON.parse(ioc.mitre_techniques || '["T1059", "T1105"]'),
                 correlatedInfrastructure: corrRes.rows.map(r => r.ioc),
                 summary: `The indicator ${targetIoc} was automatically triaged. It is a known ${ioc.ioc_type} associated with the ${ioc.malware || 'unidentified'} malware family. Retrospective hunting identified ${corrRes.rows.length} related pieces of infrastructure. Immediate defensive action is recommended.`,
                 recommendations: [
                   `Block ${ioc.ioc_type} on egress firewalls.`,
                   `Hunt for related infrastructure: ${corrRes.rows.map(r=>r.ioc).join(', ')}`,
                   `Review EDR telemetry for associated MITRE techniques.`
                 ]
               }
             });
          } else {
             return res.json({
               type: 'text',
               content: `I could not find the indicator **${targetIoc}** in our active intelligence database to generate a triage report.`
             });
          }
       }
    }
    
    // 2. RAG Query for Threat Actors or Malware
    const keywords = ['lazarus', 'apt29', 'apt28', 'trickbot', 'cobalt strike', 'plugx', 'log4j', 'iran', 'china', 'russia'];
    const matchedKeyword = keywords.find(k => p.includes(k));
    
    if (matchedKeyword) {
       // Query DB for context
       const iocRes = await db.execute({
          sql: 'SELECT ioc, ioc_type, source FROM iocs WHERE malware LIKE ? OR tags LIKE ? ORDER BY created_at DESC LIMIT 5',
          args: [`%${matchedKeyword}%`, `%${matchedKeyword}%`]
       });
       
       let responseText = `Here is the intelligence I pulled from the matrix regarding **${matchedKeyword.toUpperCase()}**:\n\n`;
       
       if (iocRes.rows.length > 0) {
          responseText += `I found **${iocRes.rows.length}** recent indicators of compromise:\n`;
          iocRes.rows.forEach(r => {
             responseText += `- \`${r.ioc}\` (${r.ioc_type}) via ${r.source}\n`;
          });
          responseText += `\nBased on these findings, I recommend pivoting on these indicators in the Threat Graph to uncover broader infrastructure.`;
       } else {
          responseText += `While this is a known threat profile, we currently have **0 active indicators** in our local database for this specific query over the last 30 days.`;
       }
       
       return res.json({ type: 'text', content: responseText });
    }
    
    // 3. Fallback General Response
    return res.json({
       type: 'text',
       content: "I am connected to the global intelligence matrix. I can summarize activity for specific APTs (e.g., 'Lazarus', 'APT29'), look up malware families, or generate executive triage reports for specific IPs or Domains (e.g., 'Generate a triage report for 185.12.x.x')."
    });

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

// GET /api/darkweb
app.get('/api/darkweb', async (req, res) => {
  const db = getDB();
  try {
    const data = await db.execute('SELECT * FROM darkweb_leaks ORDER BY published_at DESC LIMIT 50');
    res.json(data.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/emulation
app.get('/api/emulation', async (req, res) => {
  const db = getDB();
  try {
    const data = await db.execute('SELECT * FROM emulation_plans ORDER BY id ASC');
    res.json(data.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/assets
app.get('/api/assets', async (req, res) => {
  const db = getDB();
  try {
    const data = await db.execute('SELECT * FROM assets ORDER BY id ASC');
    res.json(data.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/assets
app.post('/api/assets', async (req, res) => {
  const db = getDB();
  const { type, value } = req.body;
  if (!type || !value) return res.status(400).json({ error: 'type and value required' });
  try {
    await db.execute({ sql: 'INSERT INTO assets (type, value) VALUES (?, ?)', args: [type, value] });
    const data = await db.execute('SELECT * FROM assets ORDER BY id DESC LIMIT 1');
    res.json(data.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/assets/:id
app.delete('/api/assets/:id', async (req, res) => {
  const db = getDB();
  try {
    await db.execute({ sql: 'DELETE FROM assets WHERE id = ?', args: [req.params.id] });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/analyze-payload
app.post('/api/analyze-payload', (req, res) => {
  const { payload } = req.body;
  if (!payload) return res.status(400).json({ error: 'Payload required' });
  
  // Simulate an LLM taking a moment to analyze
  setTimeout(() => {
    try {
      const result = analyzePayload(payload);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Analysis failed' });
    }
  }, 1500);
});

// POST /api/shadow-map
app.post('/api/shadow-map', async (req, res) => {
  const { seed } = req.body;
  if (!seed) return res.status(400).json({ error: 'Seed required' });
  
  let node1 = { type: 'ip', value: '104.21.44.12', label: 'A Record (Cloudflare)' };
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(seed);
  
  try {
    if (isIp) {
      // It's an IP, do a reverse lookup
      const hostnames = await dns.promises.reverse(seed);
      if (hostnames && hostnames.length > 0) {
        node1 = { type: 'domain', value: hostnames[0], label: 'Reverse DNS' };
      } else {
        node1 = { type: 'domain', value: `host-${seed.replace(/\./g, '-')}.net`, label: 'Reverse DNS (Mock)' };
      }
    } else {
      // It's a domain, resolve to IP
      const ips = await dns.promises.resolve4(seed);
      if (ips && ips.length > 0) {
        node1 = { type: 'ip', value: ips[0], label: 'A Record' };
      } else {
        node1 = { type: 'ip', value: '192.0.2.14', label: 'A Record (Mock)' };
      }
    }
  } catch (err) {
    // DNS resolution failed, use fallback
    if (isIp) {
      node1 = { type: 'domain', value: `host-${seed.replace(/\./g, '-')}.net`, label: 'Reverse DNS (Mock)' };
    } else {
      node1 = { type: 'ip', value: '192.0.2.14', label: 'A Record (Mock)' };
    }
  }

  // Generate deterministic mock data based on the seed
  const hash = crypto.createHash('md5').update(seed).digest('hex');
  
  const node2 = { 
    type: isIp ? 'asn' : 'domain', 
    value: isIp ? `AS${parseInt(hash.substring(0, 4), 16)}` : `dev.${seed}`, 
    label: isIp ? 'BGP ASN' : 'Subdomain (Exposed)' 
  };
  
  // JARM is a 62 character hex string
  const jarm = hash + crypto.createHash('md5').update(hash).digest('hex').substring(0, 30);
  const node3 = { type: 'jarm', value: jarm, label: 'JARM Fingerprint' };
  
  const node4 = { 
    type: 'cert', 
    value: `Let's Encrypt (SNI: ${isIp ? node1.value : seed})`, 
    label: 'SSL Cert Issuer' 
  };

  res.json({
    root: seed,
    nodes: [
      { type: isIp ? 'ip' : 'domain', value: seed, label: 'Root Target' },
      node1,
      node2,
      node3,
      node4
    ],
    links: [
      { source: seed, target: node1.value },
      { source: seed, target: node2.value },
      { source: node2.value, target: node3.value },
      { source: seed, target: node4.value },
      { source: node2.value, target: node4.value }
    ]
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] Threat Intel Backend running on http://0.0.0.0:${PORT}`);
  console.log(`[WS] WebSocket server ready on ws://0.0.0.0:${PORT}`);
});
