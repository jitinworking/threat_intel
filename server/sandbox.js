import puppeteer from 'puppeteer';

export async function detonateUrl(url) {
  let browser;
  try {
    // Launch headless Chromium
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    
    // Set a common desktop viewport and user agent
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

    // Go to the URL with a 15-second timeout, waiting until network is mostly idle
    const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

    const title = await page.title();
    const status = response ? response.status() : null;

    // Take a screenshot and encode as base64
    const screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 80 });
    const screenshotBase64 = screenshotBuffer.toString('base64');

    await browser.close();

    // Naive heuristic: if title contains "login" or "sign in", might be phishing if it's a weird URL
    let verdict = 'Suspicious';
    if (status >= 400) verdict = 'Failed';
    else if (title.toLowerCase().includes('login') || title.toLowerCase().includes('sign in')) verdict = 'Malicious';
    else verdict = 'Suspicious';

    return {
      success: true,
      title: title || 'Unknown Title',
      status,
      screenshot: `data:image/jpeg;base64,${screenshotBase64}`,
      verdict
    };
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    return {
      success: false,
      error: error.message
    };
  }
}
