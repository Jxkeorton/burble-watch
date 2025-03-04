import { initGoogleSheets } from '../utils/initGoogleSheets.js';

async function getLastJumpNumber(sheets, spreadsheetId) {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "'Logbook'!D2:D",  // Added quotes around sheet name
            valueRenderOption: 'UNFORMATTED_VALUE',
            majorDimension: 'ROWS'
        });

        const values = response.data.values || [];
        if (values.length === 0) {
            return 0;
        }

        const lastJumpNo = parseInt(values[values.length - 1][0]);
        return isNaN(lastJumpNo) ? 0 : lastJumpNo;
    } catch (error) {
        console.error('Error getting last jump number:', error.message);
        if (error.errors) {
            console.error('Detailed errors:', error.errors);
        }
        throw error;
    }
}

function validateData(data) {
    const required = ['date', 'dz', 'planeName', 'canopy'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
}

async function appendJump(sheets, spreadsheetId, data) {
    try {
        validateData(data);

        const lastJumpNo = await getLastJumpNumber(sheets, spreadsheetId);
        const newJumpNo = lastJumpNo + 1;

        const formattedData = [
            data.date,
            data.dz,
            data.planeName,
            newJumpNo.toString().padStart(4, '0'),
            data.jumpType || '',
            data.canopy || '',
            data.description || ''
        ];

        const request = {
            spreadsheetId,
            range: 'Logbook!A:G',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [formattedData]
            }
        };

        await sheets.spreadsheets.values.append(request);
        return true;
    } catch (error) {
        console.error('Error appending to sheet:', error.message);
        throw error;
    }
}

async function updateLogbook(newJump, spreadsheetId) {
    try {
        const sheets = await initGoogleSheets();
        await appendJump(sheets, spreadsheetId, newJump);
        return true;
    } catch (error) {
        console.error('Error updating logbook:', error);
        return false;
    }
}

export { updateLogbook };