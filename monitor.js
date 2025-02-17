const puppeteer = require('puppeteer');
const { checkName, formatData } = require('./utils/formatJson');
const { updateLogbook } = require('./spreadsheets/updateLogbook');
require('dotenv').config();

// TODO: Add check for camera flying jump - switch to functional programming 

// Configure variables
const jumpersName = process.env.JUMPERS_NAME;
const canopy = process.env.CANOPY;
const DZID = process.env.DZ_ID;
const description = process.env.DESCRIPTION; 
const INVOICE_SPREADSHEET_ID = process.env.INVOICE_SPREADSHEET_ID;
const LOGBOOK_SPREADSHEET = process.env.LOGBOOK_SPREADSHEET_ID 

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
                const data = JSON.parse(responseBody);
                const {loadData, jumpType } = checkName(jumpersName, data.loads);
        
                if (loadData != null && !todaysLoads.includes(loadData.id)) {
                    const newJump = formatData(loadData, canopy, DZID, description, jumpType);
                    todaysLoads.push(loadData.id);
        
                    // if camera update camera invoice
        
                    // update logbook with new jump
                    try {
                        console.log('updating logbook')
                        await updateLogbook(newJump, LOGBOOK_SPREADSHEET);
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