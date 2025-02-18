const puppeteer = require('puppeteer');
const { processJumpData } = require('./utils/formatJson');
const { updateLogbook } = require('./spreadsheets/updateLogbook');
require('dotenv').config();
const { shutdown } = require('./utils/shutdown');

// State updates through event emitter
const EventEmitter = require('events');
const stateEmitter = new EventEmitter();

// Pure function to create configuration object
const createConfig = env => ({
    jumpersName: env.JUMPERS_NAME,
    canopy: env.CANOPY,
    dzId: env.DZ_ID,
    description: env.DESCRIPTION,
    logbookSpreadsheetId: env.LOGBOOK_SPREADSHEET_ID,
    invoiceSpreadsheetId: env.INVOICE_SPREADSHEET_ID
});

// Side effect: Handle new jump detection
const handleNewJump = (processedLoads = new Set(), cameraCount = 0) => async (jumpData) => {
    if (!jumpData || processedLoads.has(jumpData.loadId)) {
        return { processedLoads, cameraCount };
    }

    try {
        await updateLogbook(jumpData.jump, process.env.LOGBOOK_SPREADSHEET_ID);
        console.log('Logbook updated');
        
        // Emit state updates
        stateEmitter.emit('loadProcessed', jumpData.loadId);
        if (jumpData.isCamera) {
            stateEmitter.emit('cameraJumpAdded');
        }

        return {
            processedLoads: new Set([...processedLoads, jumpData.loadId]),
            cameraCount: jumpData.isCamera ? cameraCount + 1 : cameraCount
        };
    } catch (error) {
        console.error('Error processing jump:', error);
        return { processedLoads, cameraCount };
    }
};

// Main monitoring function
const monitorAjaxTraffic = async () => {
    const config = createConfig(process.env);
    let processedLoads = new Set();
    let cameraCount = 0;

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setRequestInterception(true);

    page.on('request', request => request.continue());

    // Handle responses functionally
    page.on('response', async response => {
        if (!response.url().includes('ajax_dzm2_frontend_jumpermanifestpublic')) {
            return;
        }

        try {
            const responseBody = await response.text();
            const data = JSON.parse(responseBody);
            
            const jumpData = processJumpData(data, config);
            const newState = await handleNewJump(processedLoads, cameraCount)(jumpData);
            
            // Update state values
            processedLoads = newState.processedLoads;
            cameraCount = newState.cameraCount;

            await new Promise(resolve => setTimeout(resolve, 60000));
        } catch (error) {
            console.log('Error processing response:', error);
        }
    });

    await page.goto('https://dzm.burblesoft.com/jmp?dz_id=531', {
        waitUntil: 'networkidle0'
    });

    // Handle shutdown
    const shutdownHandler = async () => {
        await shutdown(config.invoiceSpreadsheetId, cameraCount);
        await browser.close();
        process.exit(0);
    };

    process.on('SIGINT', shutdownHandler);
    process.on('SIGTERM', shutdownHandler);
    process.on('uncaughtException', async (error) => {
        console.error('Uncaught Exception:', error);
        await shutdownHandler();
    });
    process.on('unhandledRejection', async (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        await shutdownHandler();
    });

    // Return event emitter for external state monitoring
    return stateEmitter;
};

module.exports = {
    monitorAjaxTraffic,
    processJumpData,
    stateEmitter
};