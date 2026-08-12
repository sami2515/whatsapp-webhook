import puppeteer from 'puppeteer';

(async () => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('BROWSER ERROR:', msg.text());
        }
    });

    page.on('pageerror', err => {
        console.log('PAGE ERROR STR:', err.toString());
    });

    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

    console.log('Waiting for conversation-item...');
    await page.waitForSelector('.conversation-item', { timeout: 5000 });

    console.log('Clicking it...');
    await page.click('.conversation-item');

    console.log('Waiting 2s for crash...');
    await new Promise(r => setTimeout(r, 2000));

    await browser.close();
    console.log('Done.');
})();
