import { processJumpData } from './formatJson.js';
import { updateLogbook } from '../spreadsheets/updateLogbook.js';
import dotenv from 'dotenv';
import { shutdown } from './shutdown.js';
import { EventEmitter } from 'events';
import readline from 'readline'; 
import { updateCameraInvoice } from '../spreadsheets/updateCameraInvoice.js';
import { updateMoneyEarnt } from '../spreadsheets/updateMoneyEarnt.js';
import { burblequery } from "../api-calls/getLoads.js";

dotenv.config();

// State updates through event emitter
const stateEmitter = new EventEmitter();

export const createConfig = env => ({
    jumpersName: env.JUMPERS_NAME,
    canopy: env.CANOPY,
    dzId: env.DZ_ID,
    description: env.DESCRIPTION,
    logbookSpreadsheetId: env.LOGBOOK_SPREADSHEET_ID,
    moneyEarntSpreadsheetId: env.MONEY_EARNT_SPREADSHEET_ID,
    invoiceSpreadsheetId: env.INVOICE_SPREADSHEET_ID
});

const config = createConfig(process.env);

export const handleNewJump = (processedLoads = new Set()) => async (jumpData) => {
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

export const checkBurble = async () => {
    const data = await burblequery(config);

    const jumpData = processJumpData(data, config);
    const newState = await handleNewJump(processedLoads)(jumpData);
    processedLoads = newState.processedLoads;

    return stateEmitter;
};