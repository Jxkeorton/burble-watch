const {initGoogleSheets} = require('../utils/initGoogleSheets')

async function readSheet(spreadsheetId, range, sheets) {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });
        return response.data.values;
    } catch (error) {
        console.error('Error reading sheet:', error.message);
        return null;
    }
}

async function updateSheet(spreadsheetId, range, values, sheets) {
    try {
        const response = await sheets.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values }
        });
        console.log(`Updated ${response.data.updatedCells} cells at ${range}`);
        return true;
    } catch (error) {
        console.error('Error updating sheet:', error.message);
        return false;
    }
}

function getCurrentSunday() {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
    
    // Get next Sunday if today isn't Sunday
    const nextSunday = new Date(today);
    if (currentDay !== 0) {  // if not Sunday
        nextSunday.setDate(today.getDate() + (7 - currentDay));
    }
    
    // Format date as D/M/YYYY to match your sheet format
    const day = nextSunday.getDate();
    const month = nextSunday.getMonth() + 1;
    const year = nextSunday.getFullYear();
    
    // Match the exact format in your sheet (no leading zeros)
    return `${day}/${month}/${year}`;
}

async function findAndUpdateCell(sheets, spreadsheetId, valueToAdd) {
    try {
        // Get current week's Sunday
        const targetDate = getCurrentSunday();
        console.log('Looking for date:', targetDate);
        
        // Read the entire sheet
        const data = await readSheet(spreadsheetId, 'Camera!A1:Z100', sheets);
        if (!data) return false;

        // Find the row and column with the target date
        let targetRow = -1;
        let targetCol = -1;

        for (let row = 0; row < data.length; row++) {
            for (let col = 0; col < data[row].length; col++) {
                const cellValue = data[row][col];
                if (cellValue === targetDate) {
                    targetRow = row;
                    targetCol = col;
                    break;
                }
            }
            if (targetRow !== -1) break;
        }

        if (targetRow === -1) {
            console.log('Target Sunday not found in sheet');
            return false;
        }

        // Get the current value in the cell to the right of the date
        const currentValue = data[targetRow][targetCol + 1] || '0';
        const newValue = parseFloat(currentValue) + parseFloat(valueToAdd);

        // Update the cell
        const columnLetter = String.fromCharCode(65 + targetCol + 1); // Convert column number to letter (A, B, C, etc.)
        const range = `Camera!${columnLetter}${targetRow + 1}`;
        
        await updateSheet(
            spreadsheetId,
            range,
            sheets
            [[newValue.toString()]]
        );

        console.log(`Updated value from ${currentValue} to ${newValue}`);
        return true;
    } catch (error) {
        console.error('Error in findAndUpdateCell:', error.message);
        return false;
    }
}

async function updateCameraInvoice(spreadsheetId, valueToAdd) {
    // Initialize updater
    const sheets = initGoogleSheets();
    
    // Find and update the correct cell
    await findAndUpdateCell(
        sheets,
        spreadsheetId,
        valueToAdd
    );
}

module.exports = { updateCameraInvoice }