const {updateCameraInvoice} = require('../spreadsheets/updateCameraInvoice')

async function shutdown(spreadsheetId, valueToAdd) {
    console.log('Initiating shutdown...');
    try {
        if (browser) {
            console.log('Closing browser...');
            await browser.close();
        }
        
        // Log the shutdown status to Google Sheets
        await updateCameraInvoice(spreadsheetId, valueToAdd);
        
        console.log('Shutdown complete');
    } catch (error) {
        console.error('Error during shutdown:', error);
    }
    process.exit(0);
}

module.exports = {shutdown};