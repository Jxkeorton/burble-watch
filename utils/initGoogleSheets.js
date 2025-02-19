import { google } from 'googleapis';
import { readFile } from 'fs/promises';

async function initGoogleSheets() {
    const credentialsPath = './credentials.json';

    try {
        const credentialsFile = await readFile(credentialsPath, 'utf8');
        const credentials = JSON.parse(credentialsFile);
        
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

export { initGoogleSheets };