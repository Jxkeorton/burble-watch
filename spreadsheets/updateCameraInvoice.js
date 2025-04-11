import { initGoogleSheets } from '../utils/initGoogleSheets.js';

/**
 * Finds the appropriate sheet and updates it with new invoice information
 * @param {Object} sheets - Google Sheets API client
 * @param {Object} cameraJumpInfo - Information about the camera jump
 * @param {string} spreadsheetId - ID of the target spreadsheet
 * @returns {Object} Result of the operation
 */
async function findAndUpdateInvoice(sheets, cameraJumpInfo, spreadsheetId) {
  try {
    // Get all sheets in the spreadsheet
    const response = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
      fields: 'sheets.properties'
    });
    
    const sheetsList = response.data.sheets;
    
    // Filter out the template sheet and sort sheets by index (newest first)
    const monthSheets = sheetsList
      .map(sheet => sheet.properties)
      .filter(properties => properties.title !== 'Invoice Template')
      .sort((a, b) => b.index - a.index);
    
    let targetSheetId;
    let targetSheetTitle;
    let createNewSheet = false;
    
    // Determine if we need a new invoice sheet
    if (needsNewInvoice(monthSheets)) {
      createNewSheet = true;
    } else if (monthSheets.length > 0) {
      // Use the most recent sheet
      targetSheetId = monthSheets[0].sheetId;
      targetSheetTitle = monthSheets[0].title;
    }
    
    // Create a new sheet if needed
    if (createNewSheet) {
      const result = await createNewInvoiceSheet(sheets, sheetsList, spreadsheetId);
      targetSheetId = result.sheetId;
      targetSheetTitle = result.sheetTitle;
    }
    
    // Get existing data from the target sheet
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${targetSheetTitle}!A1:H400`
    });
    
    const existingData = dataResponse.data.values || [];
    
    // Find the appropriate row and NO. value for the new entry
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
    
  } catch (error) {
    console.error('Error updating invoice:', error);
    return {
      success: false,
      message: `Error updating invoice: ${error.message}`
    };
  }
}

/**
 * Determines if a new invoice sheet is needed
 * @param {Array} monthSheets - List of existing month sheets
 * @returns {boolean} Whether a new invoice is needed
 */
function needsNewInvoice(monthSheets) {
  // If no sheets exist yet, we definitely need one
  if (monthSheets.length === 0) return true;
  
  const current = new Date();
  const currentMonth = current.getMonth();
  const currentYear = current.getFullYear();
  
  // Check if most recent sheet is from current month/year
  const mostRecentSheetTitle = monthSheets[0].title;
  // Assuming title format is like "March_2025"
  const [sheetMonth, sheetYear] = mostRecentSheetTitle.split('_');
  const sheetMonthIndex = new Date(`${sheetMonth} 1, ${sheetYear}`).getMonth();
  const sheetYearNum = parseInt(sheetYear);
  
  // If the most recent sheet is from a previous month/year, we need a new one
  if (sheetYearNum < currentYear || (sheetYearNum === currentYear && sheetMonthIndex < currentMonth)) {
    return true;
  }
  
  // Check if we've passed the last Sunday of the current month
  const lastSundayOfMonth = getLastSundayOfMonth(currentYear, currentMonth);
  
  // If today is after the last Sunday of the month, and we're still in the same month as the sheet,
  // then we need a new sheet for the next month
  return current > lastSundayOfMonth && currentMonth === sheetMonthIndex;
}

/**
 * Gets the last Sunday of a given month
 * @param {number} year - The year
 * @param {number} month - The month (0-11)
 * @returns {Date} The date of the last Sunday
 */
function getLastSundayOfMonth(year, month) {
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  let lastSunday = new Date(year, month, lastDayOfMonth);
  
  // Adjust to get the last Sunday
  while (lastSunday.getDay() !== 0) { // 0 is Sunday
    lastSunday = new Date(lastSunday.setDate(lastSunday.getDate() - 1));
  }
  
  return lastSunday;
}

/**
 * Creates a new invoice sheet based on the template
 * @param {Object} sheets - Google Sheets API client
 * @param {Array} sheetsList - List of all sheets
 * @param {string} spreadsheetId - ID of the target spreadsheet
 * @returns {Object} Information about the created sheet
 */
async function createNewInvoiceSheet(sheets, sheetsList, spreadsheetId) {
  // Determine the month and year for the new sheet
  const nextMonth = new Date();
  const current = new Date();
  const lastSundayOfMonth = getLastSundayOfMonth(nextMonth.getFullYear(), nextMonth.getMonth());
  
  // If today is after the last Sunday, use the next month for the new sheet
  if (current > lastSundayOfMonth) {
    nextMonth.setMonth(nextMonth.getMonth() + 1);
  }
  
  const newSheetTitle = `${nextMonth.toLocaleString('default', { month: 'long' })}_${nextMonth.getFullYear()}`;
  
  // Find the template sheet
  const templateSheet = sheetsList
    .map(sheet => sheet.properties)
    .find(properties => properties.title === 'Invoice Template');
  
  if (!templateSheet) {
    throw new Error('Template sheet not found');
  }
  
  // Duplicate the template sheet
  const duplicateResponse = await sheets.spreadsheets.batchUpdate({
    spreadsheetId: spreadsheetId,
    resource: {
      requests: [
        {
          duplicateSheet: {
            sourceSheetId: templateSheet.sheetId,
            insertSheetIndex: sheetsList.length,
            newSheetName: newSheetTitle
          }
        }
      ]
    }
  });
  
  const newSheetId = duplicateResponse.data.replies[0].duplicateSheet.properties.sheetId;
  
  // Update invoice date with the last Sunday of this new month
  const invoiceDate = getLastSundayOfMonth(nextMonth.getFullYear(), nextMonth.getMonth());
  const formattedInvoiceDate = `${invoiceDate.getDate()}/${invoiceDate.getMonth() + 1}/${invoiceDate.getFullYear()}`;
  
  // Update the DATE field in the template
  await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId,
    range: `${newSheetTitle}!B4`, // DATE: field
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [[formattedInvoiceDate]]
    }
  });
  
  return {
    sheetId: newSheetId,
    sheetTitle: newSheetTitle
  };
}

/**
 * Finds the next available row and invoice number
 * @param {Array} existingData - Existing data in the sheet
 * @param {boolean} createNewSheet - Whether a new sheet was created
 * @returns {Object} The row index and next invoice number
 */
function findNextRowAndNumber(existingData, createNewSheet) {
  // Find the row where we need to add data (after the last entry)
  let lastRowIndex = 18; // Default starting row (based on template)
  
  // Find the last row with data in the student name column (now column C, index 2)
  for (let i = 18; i < existingData.length; i++) {
    if (existingData[i] && existingData[i][2]) { // Column C (index 2) is CUSTOMER/Student Name
      lastRowIndex = i + 1;
    }
  }
  
  // Find the last NO. value to determine the next one
  let lastNoValue = createNewSheet ? 0 : 1; // Start with 1 if no previous entries
  
  // Scan through existing data to find the highest NO. value
  for (let i = 15; i < existingData.length; i++) {
    if (existingData[i] && existingData[i][0]) { // Column A (index 0) is NO.
      const noValue = parseInt(existingData[i][0]);
      if (!isNaN(noValue) && noValue >= lastNoValue) {
        lastNoValue = noValue;
      }
    }
  }
  
  // Increment the NO. value for the new entry
  const nextNoValue = lastNoValue + 1;
  
  return {
    rowIndex: lastRowIndex + 1,
    nextNoValue
  };
}

/**
 * Adds a new entry to the specified sheet
 * @param {Object} sheets - Google Sheets API client
 * @param {string} spreadsheetId - ID of the target spreadsheet
 * @param {string} sheetTitle - Title of the target sheet
 * @param {number} rowIndex - Row index for the new entry
 * @param {number} noValue - Invoice number for the new entry
 * @param {Object} cameraJumpInfo - Information about the camera jump
 */
async function addEntryToSheet(sheets, spreadsheetId, sheetTitle, rowIndex, noValue, cameraJumpInfo) {
  // Format the date as DD/MM/YYYY
  const jumpDate = new Date(cameraJumpInfo.date);
  const formattedDate = `${jumpDate.getDate()}/${jumpDate.getMonth() + 1}/${jumpDate.getFullYear()}`;
  
  // Update the sheet with the new entry
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: spreadsheetId,
    resource: {
      valueInputOption: 'USER_ENTERED',
      data: [{
        range: `${sheetTitle}!A${rowIndex}:C${rowIndex}`,
        values: [
          [noValue, formattedDate, cameraJumpInfo.studentName] // NO., DATE, CUSTOMER
        ]
      }]
    }
  });
}

/**
 * Updates a camera invoice with the provided information
 * @param {Object} cameraJumpInfo - Information about the camera jump
 * @param {string} spreadsheetId - ID of the target spreadsheet
 * @returns {Object} Result of the operation
 */
export async function updateCameraInvoice(cameraJumpInfo, spreadsheetId) {
  try {
    const sheets = await initGoogleSheets();
    
    const result = await findAndUpdateInvoice(
      sheets,
      cameraJumpInfo,
      spreadsheetId,
    );
    
    console.log(result.message);
    return result;
    
  } catch (error) {
    console.error('Error in updateCameraInvoice:', error);
    return {
      success: false,
      message: `Error in updateCameraInvoice: ${error.message}`
    };
  }
}