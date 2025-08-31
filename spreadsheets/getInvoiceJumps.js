import { initGoogleSheets } from '../utils/initGoogleSheets.js';
import dotenv from 'dotenv';
import { updateJsonValue } from './updateData.js';
import { findNextRowAndNumber } from './updateCameraInvoice.js';

dotenv.config();

export async function fetchInvoiceJumps(){
  const sheets = await initGoogleSheets();
  const spreadsheetId = process.env.INVOICE_SPREADSHEET_ID;

  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties'
  });
  const sheetsList = response.data.sheets;
  const monthSheets = sheetsList
    .map(sheet => sheet.properties)
    .filter(p => p.title !== 'Invoice Template')
    .sort((a, b) => b.index - a.index);

  let targetSheetTitle = monthSheets[0]?.title;
  let targetSheetId = monthSheets[0]?.sheetId;

  // Get existing data from the target sheet
  const dataResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${targetSheetTitle}!A1:H400`
  });
  const existingData = dataResponse.data.values || [];

  // Find the next available row and NO. value
  const { rowIndex, nextNoValue } = findNextRowAndNumber(existingData, null);

  const lastEntry = nextNoValue - 1;
  updateJsonValue(['invoice', 'month-total'], lastEntry * 40);
  updateJsonValue(['invoice', 'month-work-jumps'], lastEntry);
};

//test
// fetchInvoiceJumps();
