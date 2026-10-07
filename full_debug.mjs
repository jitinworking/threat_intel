import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`[CONSOLE] ${msg.type().toUpperCase()}:`, msg.text()));
  page.on('pageerror', error => console.error('[FATAL JS ERROR]:', error.message));
  page.on('requestfailed', request => {
    console.error(`[NETWORK FAIL] ${request.url()} - ${request.failure()?.errorText}`);
  });

  try {
    console.log('Navigating to Dashboard...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 10000 });
    const dashBody = await page.$eval('body', el => el.innerText);
    console.log('[DASHBOARD TEXT]', dashBody.substring(0, 500));

    // Wait a brief moment to ensure React finished rendering
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('\nNavigating to IoC Feed...');
    await page.goto('http://localhost:5173/ioc-feed', { waitUntil: 'networkidle0', timeout: 10000 });
    const iocBody = await page.$eval('body', el => el.innerText);
    console.log('[IOC FEED TEXT]', iocBody.substring(0, 500));

  } catch (err) {
    console.error('[PUPPETEER EXCEPTION]', err.message);
  } finally {
    await browser.close();
  }
})();
