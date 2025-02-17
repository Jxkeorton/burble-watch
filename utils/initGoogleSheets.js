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

module.exports = { initGoogleSheets }