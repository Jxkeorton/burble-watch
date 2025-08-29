import { initGoogleSheets } from '../utils/initGoogleSheets.js';
import { updateJsonValue } from './updateData.js';

async function getLastJumpNumber(sheets, spreadsheetId) {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "'Logbook'!D2:D",
        valueRenderOption: 'UNFORMATTED_VALUE',
        majorDimension: 'ROWS'
    });
    const values = response.data.values || [];
    const lastJumpNo = values.length ? parseInt(values[values.length - 1][0]) : 0;
    return isNaN(lastJumpNo) ? 0 : lastJumpNo;
}

async function getTodaysJumps(sheets, spreadsheetId) {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "'Logbook'!A2:G",
        valueRenderOption: 'UNFORMATTED_VALUE',
        majorDimension: 'ROWS'
    });
    const values = response.data.values || [];
    const today = new Date().toLocaleDateString();
    return values.filter(row => row[0] === today).length;
}

export async function updateLogbook(newJump, spreadsheetId) {
    try {
        // Inline validation
        const required = ['date', 'dz', 'planeName', 'canopy'];
        const missing = required.filter(field => !newJump[field]);
        if (missing.length) throw new Error(`Missing required fields: ${missing.join(', ')}`);

        const sheets = await initGoogleSheets();
        const lastJumpNo = await getLastJumpNumber(sheets, spreadsheetId);
        const todaysJumps = await getTodaysJumps(sheets, spreadsheetId);
        const newJumpNo = lastJumpNo + 1;
        updateJsonValue(['logbook-analytics', 'total-jumps'], newJumpNo);
        updateJsonValue(['logbook-analytics', 'total-jumps-today'], todaysJumps + 1);

        const formattedData = [
            newJump.date,
            newJump.dz,
            newJump.planeName,
            newJumpNo.toString().padStart(4, '0'),
            newJump.jumpType || '',
            newJump.canopy || '',
            newJump.description || ''
        ];
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Logbook!A:G',
            valueInputOption: 'USER_ENTERED',
            resource: { values: [formattedData] }
        });
        return true;
    } catch (error) {
        console.error('Error updating logbook:', error.message || error);
        return false;
    }
}
