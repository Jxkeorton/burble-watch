const { google } = require('googleapis');

class SkydiveLogUpdater {
    constructor(credentialsPath = './credentials.json') {
        this.credentialsPath = credentialsPath;
    }

    async init() {
        try {
            const credentials = require(this.credentialsPath);
            this.auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });
            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            return true;
        } catch (error) {
            console.error('Error initializing:', error.message);
            return false;
        }
    }

    async getLastJumpNumber(spreadsheetId) {
        try {
            // Get all values from column D
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId,
                range: 'Logbook!D2:D',
                valueRenderOption: 'UNFORMATTED_VALUE',
                majorDimension: 'ROWS'
            });

            const values = response.data.values || [];
            if (values.length === 0) {
                return 0;
            }

            // Get the last value
            const lastJumpNo = parseInt(values[values.length - 1][0]);
            return isNaN(lastJumpNo) ? 0 : lastJumpNo;
        } catch (error) {
            console.error('Error getting last jump number:', error.message);
            throw error;
        }
    }

    validateData(data) {
        const required = ['date', 'dz', 'planeName', 'canopy'];
        const missing = required.filter(field => !data[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }
    }

    async appendJump(spreadsheetId, data) {
        try {
            this.validateData(data);

            // Get the last jump number and increment by 1
            const lastJumpNo = await this.getLastJumpNumber(spreadsheetId);
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

            const result = await this.sheets.spreadsheets.values.append(request);
            console.log('Append successful:', result.data);
            console.log('New jump number:', newJumpNo);
            return true;
        } catch (error) {
            console.error('Error appending to sheet:', error.message);
            return false;
        }
    }
}

async function main(newJump) {
    const updater = new SkydiveLogUpdater();
    await updater.init();

    const SPREADSHEET_ID = '1zDM0rkzke54iwCCN-cBzJpCPh38uTLOv2xo3Nktou-0';

    await updater.appendJump(SPREADSHEET_ID, newJump);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = SkydiveLogUpdater;
