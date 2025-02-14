const { google } = require('googleapis');

async function initGoogleSheets() {

    const credentialsPath = './credentials.json';

    try {
        const credentials = require(credentialsPath);
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        return google.sheets({ version: 'v4', auth });
    } catch (error) {
        console.error('Error initializing:', error.message);
        throw error;
    }
}

async function getLastJumpNumber(sheets, spreadsheetId) {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Logbook!D2:D',
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

        const result = await sheets.spreadsheets.values.append(request);
        console.log('Append successful:', result.data);
        console.log('New jump number:', newJumpNo);
        return true;
    } catch (error) {
        console.error('Error appending to sheet:', error.message);
        throw error;
    }
}

export async function updateLogbook(newJump, spreadsheetId) {
    try {
        const sheets = await initGoogleSheets();
        await appendJump(sheets, spreadsheetId, newJump);
        return true;
    } catch (error) {
        console.error('Error updating logbook:', error);
        return false;
    }
}

