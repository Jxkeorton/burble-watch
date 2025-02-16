const { checkName, formatData } = require('./utils/formatJson');
const { updateLogbook } = require('./spreadsheets/updateLogbook');
require('dotenv').config();
const { jsonData } = require('./jsondata');

const jumpersName = process.env.JUMPERS_NAME;
const canopy = process.env.CANOPY;
const DZID = process.env.DZ_ID;
const description = process.env.DESCRIPTION; 
const INVOICE_SPREADSHEET_ID = process.env.INVOICE_SPREADSHEET_ID;
const LOGBOOK_SPREADSHEET = process.env.LOGBOOK_SPREADSHEET_ID // within the url of google sheet

const todaysLoads = [];

async function test(data) {

    try {
        const {loadData, jumpType } = checkName(jumpersName, data.loads);

        if (loadData != null && !todaysLoads.includes(loadData.id)) {
            const newJump = formatData(loadData, canopy, DZID, description, jumpType);
            todaysLoads.push(loadData.id);

            // if camera update camera invoice

            // update logbook with new jump
            try {
                console.log('updating logbook')
                await updateLogbook(newJump, LOGBOOK_SPREADSHEET);
            } catch (error) {
                console.error('Error adding jump to spreadsheet:', error);
            }
        } 
    } catch (error) {
        console.log('Error processing response:', error);
    }
}

test(jsonData);