const puppeteer = require('puppeteer');
const { checkName, formatData } = require('./utils/formatJson');
const { updateLogbook } = require('./spreadsheets/updateLogbook');
require('dotenv').config();

// Configure variables
const jumpersName = process.env.JUMPERS_NAME;
const canopy = process.env.CANOPY;
const DZID = process.env.DZ_ID;
const description = process.env.DESCRIPTION; 
const SPREADSHEET_ID = process.env.SPREADSHEET_ID; // within the url of google sheet

const todaysLoads = [];

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
                
                const loadData = checkName(jumpersName, jsonData.loads);

                if (loadData != null && !todaysLoads.includes(loadData.id)) {
                    const newJump = formatData(jsonData, canopy, DZID, description);
                    todaysLoads.push(loadData.id);

                    // if camera update camera invoice

                    // update logbook with new jump
                    try {
                        await updateLogbook(SPREADSHEET_ID, newJump);
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