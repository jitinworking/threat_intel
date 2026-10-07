async function test() {
  console.log("--- Testing CISA ---");
  try {
    const c = await fetch('http://localhost:5174/api/cisa');
    const cJ = await c.json();
    console.log("Keys: ", Object.keys(cJ));
    console.log("Vulns length: ", cJ.vulnerabilities?.length);
  } catch(e) { console.error("CISA Error: ", e.message); }

  console.log("--- Testing ThreatFox ---");
  try {
    const t = await fetch('http://localhost:5174/api/threatfox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'get_iocs', days: 1 }) // Wait, get_iocs is for regular search?
    });
    const tText = await t.text();
    console.log("ThreatFox Body: ", tText.substring(0, 200));
  } catch(e) { console.error("TF Error: ", e.message); }

  console.log("--- Testing RSS2JSON ---");
  try {
    const r = await fetch('http://localhost:5174/api/rss?rss_url=https://feeds.feedburner.com/TheHackersNews');
    const rText = await r.text();
    console.log("RSS Body: ", rText.substring(0, 200));
  } catch(e) { console.error("RSS Error: ", e.message); }
}
test();
