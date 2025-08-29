import { processJumpData } from './formatJson.js';
import { updateLogbook } from '../spreadsheets/updateLogbook.js';
import dotenv from 'dotenv';
import { shutdown } from './shutdown.js';
import { EventEmitter } from 'events';
import { updateCameraInvoice } from '../spreadsheets/updateCameraInvoice.js';
import { updateMoneyEarnt } from '../spreadsheets/updateMoneyEarnt.js';
import { burblequery } from "../api-calls/getLoads.js";
import { updateCookie } from "../api-calls/getCookie.js";

let processedLoads = new Set();

dotenv.config();

export const handleNewJump = (processedLoads) => async (jumpData) => {
    if (!jumpData || processedLoads.has(jumpData.loadId)) {
        return { processedLoads };
    }

    try {
        await updateLogbook(jumpData.jump, process.env.LOGBOOK_SPREADSHEET_ID);
        console.log('Logbook updated');

        if (jumpData.isCamera) {
            const cameraJumpInfo = {
                date: new Date(),
                studentName: jumpData.studentName
            };
            console.log('Updating camera invoice...');

            // Update invoice and money earnt google sheets 
            updateCameraInvoice(cameraJumpInfo, process.env.INVOICE_SPREADSHEET_ID);
            updateMoneyEarnt(process.env.MONEY_EARNT_SPREADSHEET_ID, 1);
        }

        return {
            processedLoads: new Set([...processedLoads, jumpData.loadId])
        };
    } catch (error) {
        console.error('Error processing jump:', error);
        return { processedLoads };
    }
};

export const scrapeAndUpdate = async () => {
    const cookie = await updateCookie(process.env.DZ_ID);
    const data = await burblequery(cookie);

    console.log("Processed Loads: ", processedLoads);

    try {
        const jumpData = processJumpData(data);
        const newState = await handleNewJump(processedLoads)(jumpData);
        processedLoads = newState.processedLoads;
    } catch (error) {
        throw error;
    }
};