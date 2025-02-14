const puppeteer = require('puppeteer');
const { checkName, formatData } = require('./utils/formatJson');
const { SkydiveLogUpdater } = require('./SkydiveLogUpdater');

// Configure jumps
const jumpersName = 'Jake Orton'
const canopy = 'Sabre 1 150';
const DZID = 531;
const description = '';

const todaysLoads = [];

async function monitorAjaxTraffic() {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox']
    });

    const updater = new SkydiveLogUpdater;
    await updater.init();
    
    const page = await browser.newPage();
    await page.setRequestInterception(true);

    page.on('request', request => request.continue());

    page.on('response', async response => {
        if (response.url().includes('ajax_dzm2_frontend_jumpermanifestpublic')) {
            try {
                const responseBody = await response.text();
                const jsonData = JSON.parse(responseBody);
                
                const loadData = checkName(jumpersName, jsonData.loads);

                if (loadData != null && !todaysLoads.includes(loadData.id)) {
                    const newJump = formatData(jsonData, canopy, DZID, description);
                    todaysLoads.push(loadData.id);

                    try {
                        await updater.appendJump(SPREADSHEET_ID, newJump);
                        console.log('Jump added to spreadsheet successfully');
                    } catch (error) {
                        console.error('Error adding jump to spreadsheet:', error);
                    }

                } 
            } catch (error) {
                console.log('Error processing response:', error);
            }
        }
    });

    await page.goto('https://dzm.burblesoft.com/jmp?dz_id=531', {
        waitUntil: 'networkidle0'
    });

    process.on('SIGINT', async () => {
        console.log('Closing browser...');
        await browser.close();
        process.exit();
    });
}

monitorAjaxTraffic().catch(error => {
    console.error('Script error:', error);
});