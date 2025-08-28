import puppeteer from 'puppeteer';
import { processJumpData } from './formatJson.js';
import { updateLogbook } from '../spreadsheets/updateLogbook.js';
import dotenv from 'dotenv';
import { shutdown } from './shutdown.js';
import { EventEmitter } from 'events';
import readline from 'readline'; 
import { updateCameraInvoice } from '../spreadsheets/updateCameraInvoice.js';
import { updateMoneyEarnt } from '../spreadsheets/updateMoneyEarnt.js';

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
    moneyEarntSpreadsheetId: env.MONEY_EARNT_SPREADSHEET_ID,
    invoiceSpreadsheetId: env.INVOICE_SPREADSHEET_ID
});

// Side effect: Handle new jump detection
export const handleNewJump = (processedLoads = new Set()) => async (jumpData) => {
    const config = createConfig(process.env);

    if (!jumpData || processedLoads.has(jumpData.loadId)) {
        return { processedLoads };
    }

    try {
        await updateLogbook(jumpData.jump, config.logbookSpreadsheetId);
        console.log('Logbook updated');

        stateEmitter.emit('loadProcessed', jumpData.loadId);
        if (jumpData.isCamera) {
            stateEmitter.emit('cameraJumpAdded');
            const cameraJumpInfo = {
                date: new Date(),
                studentName: jumpData.studentName
            };
            console.log('Updating camera invoice...');
            updateCameraInvoice(cameraJumpInfo, config.invoiceSpreadsheetId);
            // Immediately update money earnt for each camera jump
            updateMoneyEarnt(config.moneyEarntSpreadsheetId, 1);
        }

        return {
            processedLoads: new Set([...processedLoads, jumpData.loadId])
        };
    } catch (error) {
        console.error('Error processing jump:', error);
        return { processedLoads };
    }
};

// Main monitoring function
export const monitorBurble = async () => {
    const config = createConfig(process.env);
    let processedLoads = new Set();

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
            const newState = await handleNewJump(processedLoads)(jumpData);
            processedLoads = newState.processedLoads;

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
        await browser.close();
    };

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
        await shutdownHandler();
        process.exit(0); 
    });

    process.on('message', async (msg) => {
        if(msg === 'shutdown'){
            await shutdownHandler();

            setTimeout(function() {
                process.exit(0)
              }, 1500)
        }
    })

    process.on('SIGTERM', async () => {
        await shutdownHandler();
        process.exit(0);
    });

    process.on('SIGBREAK', async () => {
        await shutdownHandler();
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