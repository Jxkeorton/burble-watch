
import { initGoogleSheets } from '../utils/initGoogleSheets.js';

// Utility: Format date as DD/MM/YYYY
function formatDate(date) {
  const d = new Date(date);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

async function findAndUpdateInvoice(sheets, cameraJumpInfo, spreadsheetId) {
  // Get all sheets in the spreadsheet
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties'
  });
  const sheetsList = response.data.sheets;
  const monthSheets = sheetsList
    .map(sheet => sheet.properties)
    .filter(p => p.title !== 'Invoice Template')
    .sort((a, b) => b.index - a.index);

  let createNewSheet = needsNewInvoice(monthSheets);
  let targetSheetTitle = createNewSheet ? null : monthSheets[0]?.title;
  let targetSheetId = createNewSheet ? null : monthSheets[0]?.sheetId;

  if (createNewSheet) {
    const result = await createNewInvoiceSheet(sheets, sheetsList, spreadsheetId);
    targetSheetId = result.sheetId;
    targetSheetTitle = result.sheetTitle;
  }

  // Get existing data from the target sheet
  const dataResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${targetSheetTitle}!A1:H400`
  });
  const existingData = dataResponse.data.values || [];

  // Find the next available row and NO. value
  const { rowIndex, nextNoValue } = findNextRowAndNumber(existingData, createNewSheet);

  // Add the new entry to the sheet
  await addEntryToSheet(
    sheets,
    spreadsheetId,
    targetSheetTitle,
    rowIndex,
    nextNoValue,
    cameraJumpInfo
  );

  return {
    success: true,
    sheetStatus: createNewSheet ? 'created' : 'updated',
    sheetTitle: targetSheetTitle,
    noValue: nextNoValue,
    message: createNewSheet
      ? `Created new invoice sheet "${targetSheetTitle}" and added entry with NO. ${nextNoValue}`
      : `Updated invoice in existing sheet "${targetSheetTitle}" with NO. ${nextNoValue}`
  };
}

function needsNewInvoice(monthSheets) {
  if (monthSheets.length === 0) return true;
  const current = new Date();
  const [sheetMonth, sheetYear] = monthSheets[0].title.split('_');
  const sheetMonthIndex = new Date(`${sheetMonth} 1, ${sheetYear}`).getMonth();
  const sheetYearNum = parseInt(sheetYear);
  if (sheetYearNum < current.getFullYear() || (sheetYearNum === current.getFullYear() && sheetMonthIndex < current.getMonth())) {
    return true;
  }
  const lastSunday = getLastSundayOfMonth(current.getFullYear(), current.getMonth());
  return current > lastSunday && current.getMonth() === sheetMonthIndex;
}

function getLastSundayOfMonth(year, month) {
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  let lastSunday = new Date(year, month, lastDayOfMonth);
  
  // Adjust to get the last Sunday
  while (lastSunday.getDay() !== 0) { // 0 is Sunday
    lastSunday = new Date(lastSunday.setDate(lastSunday.getDate() - 1));
  }
  
  return lastSunday;
}

async function createNewInvoiceSheet(sheets, sheetsList, spreadsheetId) {
  // Determine the month and year for the new sheet
  const now = new Date();
  const lastSunday = getLastSundayOfMonth(now.getFullYear(), now.getMonth());
  const nextMonth = new Date(now);
  if (now > lastSunday) nextMonth.setMonth(nextMonth.getMonth() + 1);
  const newSheetTitle = `${nextMonth.toLocaleString('default', { month: 'long' })}_${nextMonth.getFullYear()}`;

  // Find the template sheet
  const templateSheet = sheetsList.map(sheet => sheet.properties).find(p => p.title === 'Invoice Template');
  if (!templateSheet) throw new Error('Template sheet not found');

  // Duplicate the template sheet
  const duplicateResponse = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    resource: {
      requests: [{
        duplicateSheet: {
          sourceSheetId: templateSheet.sheetId,
          insertSheetIndex: sheetsList.length,
          newSheetName: newSheetTitle
        }
      }]
    }
  });
  const newSheetId = duplicateResponse.data.replies[0].duplicateSheet.properties.sheetId;

  // Update invoice date with the last Sunday of this new month
  const invoiceDate = getLastSundayOfMonth(nextMonth.getFullYear(), nextMonth.getMonth());
  const formattedInvoiceDate = formatDate(invoiceDate);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${newSheetTitle}!B4`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [[formattedInvoiceDate]] }
  });
  return { sheetId: newSheetId, sheetTitle: newSheetTitle };
}

function findNextRowAndNumber(existingData, createNewSheet) {
  // Start at row 18 (template default)
  let lastRowIndex = 18;
  let lastNoValue = createNewSheet ? 0 : 1;
  for (let i = 18; i < existingData.length; i++) {
    if (existingData[i] && existingData[i][2]) lastRowIndex = i + 1;
    if (existingData[i] && existingData[i][0]) {
      const noValue = parseInt(existingData[i][0]);
      if (!isNaN(noValue) && noValue >= lastNoValue) lastNoValue = noValue;
    }
  }
  return { rowIndex: lastRowIndex + 1, nextNoValue: lastNoValue + 1 };
}

async function addEntryToSheet(sheets, spreadsheetId, sheetTitle, rowIndex, noValue, cameraJumpInfo) {
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    resource: {
      valueInputOption: 'USER_ENTERED',
      data: [{
        range: `${sheetTitle}!A${rowIndex}:C${rowIndex}`,
        values: [
          [noValue, formatDate(cameraJumpInfo.date), cameraJumpInfo.studentName]
        ]
      }]
    }
  });
}

// main function 
export async function updateCameraInvoice(cameraJumpInfo, spreadsheetId) {
  try {
    const sheets = await initGoogleSheets();
    const result = await findAndUpdateInvoice(sheets, cameraJumpInfo, spreadsheetId);
    console.log(result.message);
    return result;
  } catch (error) {
    console.error('Error in updateCameraInvoice:', error);
    return { success: false, message: `Error in updateCameraInvoice: ${error.message}` };
  }
}