import { initGoogleSheets } from '../utils/initGoogleSheets.js';

function getCurrentSunday() {
    const today = new Date();
    const day = today.getDay();
    const sunday = new Date(today);
    if (day !== 0) sunday.setDate(today.getDate() + (7 - day));
    return `${sunday.getDate()}/${sunday.getMonth() + 1}/${sunday.getFullYear()}`;
}

async function updateMoneyEarnt(spreadsheetId, valueToAdd) {
    try {
        const sheets = await initGoogleSheets();
        const targetDate = getCurrentSunday();
        const { data } = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Camera!A1:Z100',
        });
        const rows = data.values || [];
        let found = false;
        for (let row = 0; row < rows.length && !found; row++) {
            for (let col = 0; col < rows[row].length; col++) {
                if (rows[row][col] === targetDate) {
                    const currentValue = parseFloat(rows[row][col + 1] || '0');
                    const newValue = currentValue + parseFloat(valueToAdd);
                    const colLetter = String.fromCharCode(65 + col + 1);
                    const range = `Camera!${colLetter}${row + 1}`;
                    await sheets.spreadsheets.values.update({
                        spreadsheetId,
                        range,
                        valueInputOption: 'USER_ENTERED',
                        requestBody: { values: [[newValue.toString()]] }
                    });
                    console.log(`Updated value from ${currentValue} to ${newValue}`);
                    found = true;
                    break;
                }
            }
        }
        if (!found) {
            console.error('Target Sunday not found in sheet');
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error updating money earnt:', error.message || error);
        return false;
    }
}

export { updateMoneyEarnt };