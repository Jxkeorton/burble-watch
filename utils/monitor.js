import puppeteer from 'puppeteer';
import { processJumpData } from './formatJson.js';
import { updateLogbook } from '../spreadsheets/updateLogbook.js';
import dotenv from 'dotenv';
import { shutdown } from './shutdown.js';
import { EventEmitter } from 'events';
import readline from 'readline'; 

dotenv.config();

// State updates through event emitter
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
        console.log('Loads processed, nothing to log')
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
export const monitorAjaxTraffic = async () => {
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

    // Track when the last response was handled
    let isProcessing = false;

    page.on('response', async (response) => {
        if (!response.url().includes('ajax_dzm2_frontend_jumpermanifestpublic')) {
            return;
        }

        // If already processing, ignore new responses
        if (isProcessing) {
            return;
        }

        isProcessing = true;

        try {
            const responseBody = await response.text();
            const data = JSON.parse(responseBody);

            const jumpData = processJumpData(data, config);
            const newState = await handleNewJump(processedLoads, cameraCount)(jumpData);

            // Update state values
            processedLoads = newState.processedLoads;
            cameraCount = newState.cameraCount;

            // Delay processing new responses for 60 seconds
            await new Promise(resolve => setTimeout(resolve, 60000));

        } catch (error) {
            console.error('Error processing response:', error);
        } finally {
            isProcessing = false; // Reset processing flag after timeout
        }
    });

    await page.goto('https://dzm.burblesoft.com/jmp?dz_id=531', {
        waitUntil: 'networkidle0'
    });

    // Handle shutdown
    const shutdownHandler = async () => {
        if(cameraCount == 0 ){
            await browser.close();
            console.log('No camera jumps to add')
            return
        }
        await shutdown(config.invoiceSpreadsheetId, cameraCount);
        await browser.close();
    };

    // Add SIGINT handling
    if (process.platform === "win32") {
        // Workaround for Windows to ensure SIGINT is caught correctly
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.on("SIGINT", function () {
            process.emit("SIGINT");
        });
    }

    process.on("SIGINT", async () => {
        console.log( 'Shutting down...');
        await shutdownHandler();
        console.log('Exiting now...');
        process.exit(0); 
    });

    process.on('SIGTERM', async () => {
        console.log( 'SIGTERM Shutting down...');
        await shutdownHandler();
        console.log('Exiting now...');
        process.exit(0);
    });
    
    process.on('uncaughtException', async (error) => {
        console.error('Uncaught Exception:', error);
        await shutdownHandler();
        process.exit(0);
    });
    process.on('unhandledRejection', async (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        await shutdownHandler();
        process.exit(0);
    });

    // Return event emitter for external state monitoring
    return stateEmitter;
};