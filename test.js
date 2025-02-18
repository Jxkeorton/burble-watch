require('dotenv').config();
const {updateCameraInvoice} = require('./spreadsheets/updateCameraInvoice')

const invoiceSpreadsheetId = process.env.INVOICE_SPREADSHEET_ID;

updateCameraInvoice(invoiceSpreadsheetId, 1);
