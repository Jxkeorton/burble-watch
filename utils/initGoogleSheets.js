import { google } from 'googleapis';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

async function initGoogleSheets() {
    let credentials;

    try {
        // Try to use base64 encoded credentials from environment variable (for cloud deployment)
        if (process.env.GOOGLE_CREDENTIALS_BASE64) {
            const credentialsJson = Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('utf8');
            credentials = JSON.parse(credentialsJson);
            console.log('✅ Using credentials from environment variable');
        } 
        // Fallback to local file (for local development)
        else if (existsSync('./credentials.json')) {
            const credentialsFile = await readFile('./credentials.json', 'utf8');
            credentials = JSON.parse(credentialsFile);
            console.log('✅ Using credentials from local file');
        }
        else {
            throw new Error('No Google credentials found. Set GOOGLE_CREDENTIALS_BASE64 environment variable or add credentials.json file.');
        }
        
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            timeout: 30000,
            retry: true,
            retryConfig: {
                retry: 3,
                retryDelay: 1000,
                httpMethodsToRetry: ['GET', 'POST', 'PUT'],
                statusCodesToRetry: [[100, 199], [429, 429], [500, 599]]
            }
        });
        
        return google.sheets({ 
            version: 'v4', 
            auth,
            timeout: 30000
        });
    } catch (error) {
        console.error('❌ Error initializing Google Sheets:', error.message);
        throw error;
    }
}

export { initGoogleSheets };