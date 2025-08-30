import { initGoogleSheets } from '../utils/initGoogleSheets.js';
import dotenv from 'dotenv';
import { updateJsonValue } from './updateData.js';
import { getTodaysJumps } from './updateLogbook.js'

dotenv.config();

export async function fetchTodaysJumps(){
    const sheets = await initGoogleSheets();
    const spreadsheetId = process.env.LOGBOOK_SPREADSHEET_ID;
    const todaysJumps = await getTodaysJumps(sheets, spreadsheetId);

    console.log(`Today's jumps: ${todaysJumps}`);
    updateJsonValue(['logbook-analytics', 'total-jumps-today'], todaysJumps);
}

// Test
// fetchTodaysJumps();