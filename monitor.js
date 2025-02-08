const puppeteer = require('puppeteer');

async function monitorAjaxTraffic() {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setRequestInterception(true);

    page.on('request', request => request.continue());

    page.on('response', async response => {
        if (response.url().includes('ajax_dzm2_frontend_jumpermanifestpublic')) {
            try {
                const responseBody = await response.text();
                const jsonData = JSON.parse(responseBody);
                console.log(jsonData.loads);
            } catch (error) {
                console.log('Error getting response:', error.message);
            }
        }
    });

    await page.goto('https://dzm.burblesoft.com/jmp?dz_id=531', {
        waitUntil: 'networkidle0'
    });

    process.on('SIGINT', async () => {
        await browser.close();
        process.exit();
    });
}

monitorAjaxTraffic().catch(console.error);