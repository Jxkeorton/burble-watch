import { updateCameraInvoice } from '../spreadsheets/updateCameraInvoice.js';

export async function shutdown(spreadsheetId, valueToAdd) {
    console.log('Initiating shutdown...');
    try {
        // Log the shutdown status to Google Sheets
        await updateCameraInvoice(spreadsheetId, valueToAdd);
        
        console.log('Shutdown complete');
    } catch (error) {
        console.error('Error during shutdown:', error);
    }
    process.exit(0);
}
