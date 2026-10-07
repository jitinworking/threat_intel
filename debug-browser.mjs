import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
  page.on('pageerror', error => console.error('BROWSER_ERROR:', error));
  page.on('requestfailed', request => {
    console.error('REQUEST_FAILED:', request.url(), request.failure()?.errorText);
  });

  await page.goto('http://localhost:5173/');
  await new Promise(r => setTimeout(r, 2000));
  
  // Attempt to navigate to the IoC page
  try {
    const links = await page.$$('a');
    for (const link of links) {
      const text = await page.evaluate(el => el.textContent, link);
      if (text && text.includes('IoC Feed')) {
        await link.click();
        break;
      }
    }
  } catch (e) {
    console.error('Could not click link', e);
  }
  
  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
})();
